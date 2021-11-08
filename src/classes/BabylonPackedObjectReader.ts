import * as BABYLON from 'babylonjs';
import PackedObject from './PackedObject';
import FrameUpdater from './FrameUpdater';
import DynamicObject from './DynamicObject';
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
        let boxModel = scene.getMeshByName(name + '_box');
        let model = scene.getMeshByName(name);
        if (boxModel) {
            boxModel.isVisible = false;
            boxModel.name = randName + '_box';
        }
        if (model) {
            model.name = randName;
        }

        const dynamicObject = new DynamicObject({ model, boxModel, manifest });

        if (manifest.hasCustomShader) {
            model.material = material;
        }

        if (manifest.isPlayer) {
            dynamicObject.poseModel = model;
        }

        resolve(dynamicObject);

        if (manifest.hasCustomShader) {
            this.frameUpdaterCallbackID = FrameUpdater.addUpdater(({ scene }) => {
                const cameraPosition = scene.cameras[0].globalPosition;
                material.setVector3(
                    'cameraPosition',
                    cameraPosition.subtract((boxModel || model).getAbsolutePosition())
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
            const assetsManager = new BABYLON.AssetsManager(scene);
            const task = assetsManager.addMeshTask(
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

            assetsManager.onTaskErrorObservable.add((task, message) => {
                reject(message);
            });

            assetsManager.load();
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
