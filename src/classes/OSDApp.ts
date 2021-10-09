import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vehicle from './Vehicle';
import PlayerVehicle from './PlayerVehicle';
import DynamicWorld from './DynamicWorld';
import FrameUpdater from './FrameUpdater';

export default class OSDApp {
    canvas : HTMLCanvasElement;
    engine : BABYLON.Engine;
    scene: BABYLON.Scene;
    playerVehicle : Vehicle;
    camera : BABYLON.UniversalCamera;
    cameraGoal: BABYLON.Mesh;
    cameraCurrent: BABYLON.Mesh;
    dynamicWorld: DynamicWorld;

    constructor() {
        window['_osdapp'] = this;
        this.canvas = document.createElement('canvas');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.createScene();
        this.createCamera();

        this.engine.runRenderLoop(() => {
            this.update();
            this.scene.render();
        });

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
        this.dynamicWorld = new DynamicWorld(this.scene);
        this.dynamicWorld.load();
    }

    update() {
        const deltaTime = this.engine.getDeltaTime();

        if (this.playerVehicle != null) {
            this.playerVehicle.update(deltaTime);
        }

        this.updateCamera(deltaTime);
        FrameUpdater.update({ scene: this.scene });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.engine.resize();
    }

    createCamera() {
        this.cameraGoal = new BABYLON.Mesh('cameraGoal', this.scene);
        this.cameraCurrent = new BABYLON.Mesh('cameraCurrent', this.scene);
        this.camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 0, 0), this.scene);

        this.cameraGoal.position.z += 20;
        this.cameraGoal.position.y += 3;
        this.cameraGoal.rotation.x -= Math.PI;

        this.camera.parent = this.cameraCurrent;

        this.updateCamera(0.0);
    }

    updateCamera(deltaTime) {
        if (this.playerVehicle == null) {
            return;
        }

        const targetPosition = this.cameraGoal.getAbsolutePosition();
        const currentPosition = this.cameraCurrent.getAbsolutePosition();
        const targetRotation = this.cameraGoal.absoluteRotationQuaternion;
        const currentRotation = this.cameraCurrent.absoluteRotationQuaternion;

        const factor = 1.0 - Math.min(Math.max(deltaTime * 0.005, 0.0), 1.0);
        const rotationFactor = 0.1 * factor;
        this.cameraCurrent.position =
            targetPosition.scale(1.0 - factor).add(currentPosition.scale(factor));
        this.cameraCurrent.rotationQuaternion = BABYLON.Quaternion.Slerp(this.cameraCurrent.absoluteRotationQuaternion, targetRotation, rotationFactor);
    }


    createScene() {
        const scene = new BABYLON.Scene(this.engine);
        this.scene = scene;
        new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), this.scene);

        this.scene._inputManager._onCanvasFocusObserver.callback();
        this.canvas.focus();
        this.createModels();
    };

    onSceneLoaded() {
        const playerCar = this.scene.getNodeByName('player_car');
        this.playerVehicle = new PlayerVehicle(
            playerCar,
            this.scene,
        );

        this.cameraGoal.parent = this.playerVehicle.model;
    }

    createModels() {
        BABYLON.SceneLoader.Append(
            './models/', 'scene.glb', this.scene,
            this.onSceneLoaded.bind(this),
        );
    }
}
