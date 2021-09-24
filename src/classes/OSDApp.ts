import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vehicle from "./Vehicle.ts";
import PlayerVehicle from "./PlayerVehicle.ts";


export default class OSDApp {
    canvas : HTMLCanvasElement;
    engine;
    scene;
    playerVehicle : Vehicle;
    camera;
    cameraGoal: BABYLON.Mesh;
    cameraCurrent: BABYLON.Mesh;

    constructor () {
        this.canvas = document.createElement("canvas");
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.createScene();
        this.createCamera();

        this.engine.runRenderLoop(() => {
            this.update();
            this.scene.render();
        });

        window.addEventListener("resize", this.resize.bind(this));
        this.resize();
    }

    update () {
        const deltaTime = this.engine.getDeltaTime();

        if (this.playerVehicle != null)
            this.playerVehicle.update(deltaTime);

        this.updateCamera(deltaTime);
    }

    resize () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.engine.resize();
    }

    createCamera() {
        this.cameraGoal = new BABYLON.Mesh("cameraGoal", this.scene);
        this.cameraCurrent = new BABYLON.Mesh("cameraCurrent", this.scene);
        this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 0, 0), this.scene);

        this.cameraGoal.position.z += 20;
        this.cameraGoal.rotation.x -= Math.PI;

        this.camera.parent = this.cameraCurrent;

        this.updateCamera();
    }

    updateCamera(deltaTime) {
        if (this.playerVehicle == null)
            return;

        const vehiclePosition = this.playerVehicle.model.getAbsolutePosition();
        const targetPosition = this.cameraGoal.getAbsolutePosition()
        const targetRotation = this.cameraGoal.absoluteRotationQuaternion;
        const currentPosition = this.cameraCurrent.getAbsolutePosition()
        const currentRotation = this.cameraCurrent.absoluteRotationQuaternion;

        const factor = 1.0 - Math.min(Math.max(deltaTime * 0.005, 0.0), 1.0);

        this.cameraCurrent.position =
            targetPosition.scale(1.0 - factor).add(currentPosition.scale(factor));
        this.cameraCurrent.rotationQuaternion =
            targetRotation.scale(1.0 - factor).add(currentRotation.scale(factor));


        //const vehicleForward = this.playerVehicle.model.forward;

        //const cameraRelativeOffset = new BABYLON.Vector3(-20, -20, -20);
        //const cameraOffset = vehicleForward.normalize().multiply(cameraRelativeOffset);
        //this.cameraGoal.position = new BABYLON.Vector3(0, 2, 14);
        //this.cameraGoal.rotation = new BABYLON.Vector3(0, Math.PI, 0);
        //
        //this.camera.position = this.cameraGoal.getAbsolutePosition();
        //this.camera.rotate(this.cameraGoal.absoluteRotationQuaternion);
        //this.camera.cameraDirection.set(vehiclePosition);
    }


    createScene () {
        const scene = new BABYLON.Scene(this.engine);
        this.scene = scene;
        BABYLON.MeshBuilder.CreateBox("box", {})

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

        this.scene._inputManager._onCanvasFocusObserver.callback();
        this.canvas.focus();
        this.createModels();
    };

    onSceneLoaded () {
        const playerCar = this.scene.getNodeByName("player_car");
        this.playerVehicle = new PlayerVehicle(
            playerCar,
            this.scene
        );
        this.cameraGoal.parent = this.playerVehicle.model;
    }

    createModels () {
        BABYLON.SceneLoader.Append("./models/", "scene.glb", this.scene,
                                   this.onSceneLoaded.bind(this));
    }
}
