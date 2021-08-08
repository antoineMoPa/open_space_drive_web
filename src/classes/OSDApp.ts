import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

export default class OSDApp {
    canvas : HTMLCanvasElement;
    engine;
    scene;

    constructor () {
        this.canvas = document.createElement("canvas");
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = this.createScene();

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener("resize", this.resize.bind(this));
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.engine.resize();
    }

    createScene () {
        const scene = new BABYLON.Scene(this.engine);

        BABYLON.MeshBuilder.CreateBox("box", {})

        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));
        camera.attachControl(this.canvas, true);
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

        this.createModels();

        return scene;
    };

    createModels () {
        const scene = this.scene;

        BABYLON.SceneLoader.Append("./models/", "scene.glb", scene, function (scene) {

        });
    }
}
