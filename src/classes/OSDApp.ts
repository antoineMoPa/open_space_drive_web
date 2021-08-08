import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vehicle from "./Vehicle.ts";
import PlayerVehicle from "./PlayerVehicle.ts";


export default class OSDApp {
    canvas : HTMLCanvasElement;
    engine;
    scene;
    playerVehicle : Vehicle;
    camera: BABYLON.FollowCamera;

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

        this.updateCamera();
    }

    updateCamera() {
        if (this.playerVehicle == null)
            return;
        /* TODO
        let Matrix = vehicleModel.getWorldMatrix();
        const offset = new BABYLON.Vector3(0,2,15);
        const vehicleModel = this.playerVehicle.model;
        const vehiclePosition = vehicleModel.getAbsolutePosition();
        this.camera.rotation = vehicleModel.rotation;
        this.camera._worldMatrix = ;
        */
    }

    resize () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.engine.resize();
    }

    createCamera() {
        this.camera = new BABYLON.UniversalCamera("UniversalCamera",
                                                  new BABYLON.Vector3(0, 0, 0), this.scene);
        this.updateCamera();
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
        this.camera.lockedTarget = playerCar;
    }

    createModels () {
        BABYLON.SceneLoader.Append("./models/", "scene.glb", this.scene,
                                   this.onSceneLoaded.bind(this));
    }
}
