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
        const {vertexShader, fragmentShader} = await packedObject.load();
        BABYLON.Effect.ShadersStore[name + 'VertexShader'] = vertexShader;
        BABYLON.Effect.ShadersStore[name + 'FragmentShader'] = fragmentShader;

        const shaderMaterial = new BABYLON.ShaderMaterial(
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
                model.material = shaderMaterial;
                model.position.z = 200;
                resolve(model);
                this.frameUpdaterCallbackID = FrameUpdater.addUpdater(({ scene }) => {
                    const cameraPosition = scene.cameras[0].globalPosition;
                    shaderMaterial.setVector3(
                        'cameraPosition',
                        cameraPosition.subtract(model.getAbsolutePosition())
                    );
                });
            };

            task.onErrorCallback = (task, message) => {
                reject();
            };

            task.run();
        });
    }
}
