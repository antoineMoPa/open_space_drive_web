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

    async load() {
        try {
            const name:string = this.name;
            const path:string = this.path;
            const scene:BABYLON.Scene = this.scene;

            const packedObject = new PackedObject(path);
            const {manifest, vertexShader, fragmentShader} = await packedObject.load();

            let material = null;
            if (manifest.hasCustomShader) {
                material = this.loadCustomShader({vertexShader, fragmentShader, scene, name, path});
            }

            return new Promise((resolve, reject) => {
                const AssetsManager = new BABYLON.AssetsManager();
                const task = AssetsManager.addMeshTask(
                    'add-'+name,
                    name,
                    path + '/',
                    'model.glb'
                );

                task.onSuccess = () => {
                    try {
                        let model = scene.getMeshByName(name);

                        if (!model) {
                            // Some models made in blender have multiple materials
                            // creating multiple meshes. We'll combine these.
                            const matchingMeshes = scene.meshes
                                .filter(mesh => mesh.name.indexOf(name) != -1);

                            if (matchingMeshes.length === 0) {
                                throw new Error(`Mesh ${name} not found in ${path}/model.glb`);
                            } else {
                                model = new BABYLON.AbstractMesh();
                                matchingMeshes.forEach(mesh => model.addChild(mesh));
                            }
                        }

                        const dynamicObject = new DynamicObject(model, manifest);

                        if (manifest.hasCustomShader) {
                            model.material = material;
                        }
                        model.position.z = 200;
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
                    } catch (e) {
                        console.error(e);
                        return;
                    }
                };

                task.onErrorCallback = (task, message) => {
                    reject();
                };

                task.run();
            });
        } catch (e) {
            console.error(e);
        }
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
