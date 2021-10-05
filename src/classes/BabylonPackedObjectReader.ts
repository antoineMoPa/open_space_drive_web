import * as BABYLON from 'babylonjs';
import PackedObject from './PackedObject';
import FrameUpdater from './FrameUpdater.ts';

export default class BabylonPackedObjectReader {
    scene;
    path;
    name;
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

    async load(): BABYLON.Mesh {
        const name = this.name;
        const path = this.path;
        const scene = this.scene;

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
                'model.glb',
            );

            task.onSuccess = () => {
                const model = scene.getMeshByName(name);
                if (manifest.hasCustomShader) {
                    model.material = material;
                }
                model.position.z = 200;
                resolve(model);

                if (manifest.hasCustomShader) {
                    this.frameUpdaterCallbackID = FrameUpdater.addUpdater(({ scene }) => {
                        const cameraPosition = scene.cameras[0].globalPosition;
                        material.setVector3(
                            'cameraPosition',
                            cameraPosition.subtract(model.getAbsolutePosition())
                        );
                    });
                }
            };

            task.onErrorCallback = (task, message) => {
                reject();
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
