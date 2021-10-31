import * as BABYLON from 'babylonjs';
import PackedObject from './PackedObject';
import FrameUpdater from './FrameUpdater.ts';
import DynamicObject from './DynamicObject.ts';
import OSDApp from './OSDApp';

export default class BabylonPackedObjectReader {
    scene: BABYLON.Scene;
    path: string;
    name: string;
    frameUpdaterCallbackID: string = null;

    constructor(scene, path) {
        this.name = path.split('/').slice(-1)[0];
        this.path = path;
        this.scene = scene;
    }

    dispose() {
        if (this.frameUpdaterCallbackID !== null) {
            FrameUpdater.removeUpdater(this.frameUpdaterCallbackID);
        }
    }

    onSuccess({manifest, vertexShader, fragmentShader, material, resolve}) {
        const name:string = this.name;
        const scene = this.scene;

        // Some models made in blender have multiple materials
        // creating multiple meshes with the name starting with `name`.
        // We'll combine these.
        const matchingMeshes = scene.meshes
            .filter(mesh => {
                const meshName = mesh.name || '';
                return meshName.indexOf(name) !== -1 && meshName.indexOf('osd-instance-') === -1
            });


        const randName = name + '.osd-instance-' + Math.random();
        let model = scene.getMeshByName(name + '_box');
        if (model) {
            // Make parent bounding box invisible
            // By convention, the parent object of a model will be a bounding box to help
            // collision detection.
            model.isVisible = false;
        } else {
            model = scene.getMeshByName(name);
        }

        model.name = randName;
        //
        // if (matchingMeshes.length === 0) {
        //     throw new Error(`Mesh ${name} not found in ${path}/model.glb`);
        // } else if (matchingMeshes.length === 1) {
        //     model = matchingMeshes[0];
        //     model.name = randName;
        // } else {
        //     // Find the mandatory collision box to make it the parent
        //     debugger;
        //     const collisionBox = matchingMeshes.filter(
        //         mesh => mesh.name.indexOf('_collision') !== -1
        //     )[0];
        //     //collisionBox.name = randName;
        //     model = collisionBox;
        //     matchingMeshes.forEach(mesh => {
        //         model.addChild(mesh)
        //         mesh.name = randName + '.osd-instance-';
        //     });
        // }

        const dynamicObject = new DynamicObject(model, manifest);
        if (manifest.hasCustomShader) {
            model.material = material;
        }
        resolve(dynamicObject);

        if (manifest.hasCustomShader) {
            this.frameUpdaterCallbackID = FrameUpdater.addUpdater(({ scene }) => {
                const cameraPosition = scene.cameras[0].globalPosition;
                material.setVector3(
                    'cameraPosition',
                    cameraPosition.subtract(model.getAbsolutePosition())
                );
            });
        }
    }

    async load() {
        const name:string = this.name;
        const path:string = this.path;
        const scene:BABYLON.Scene = this.scene;

        const packedObject = new PackedObject(path);
        let {manifest, vertexShader, fragmentShader} = await packedObject.load();

        let material = null;
        if (manifest.hasCustomShader) {
            material = this.loadCustomShader({vertexShader, fragmentShader, scene, name, path});
        }

        return new Promise((resolve, reject) => {
            const AssetsManager = new BABYLON.AssetsManager();
            const task = AssetsManager.addMeshTask(
                'add-'+name,
                null,
                path + '/',
                'model.glb'
            );

            task.onSuccess = () => {
                try {
                    this.onSuccess({manifest, vertexShader, fragmentShader, material, resolve});
                } catch (e) {
                    console.error(e);
                }
            }

            task.onErrorCallback = (task, message) => {
                reject(message);
            };

            task.run();
        });
    }

    loadCustomShader({
        vertexShader, fragmentShader, scene, name, path
    }): BABYLON.ShaderMaterial{
        BABYLON.Effect.ShadersStore[name + 'VertexShader'] = vertexShader;
        BABYLON.Effect.ShadersStore[name + 'FragmentShader'] = fragmentShader;

        return new BABYLON.ShaderMaterial(
            name + 'shader',
            scene,
            {
                vertex: name,
                fragment: name,
            },
            {
                attributes: ['position', 'normal', 'uv'],
                uniforms: [
                    'world', 'worldView', 'worldViewProjection', 'view',
                    'projection', 'cameraPosition',
                ],
            },
        );
    }
}
