import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vehicle from './DynamicWorld/Vehicle';
import DynamicWorld from './DynamicWorld/DynamicWorld';
import FrameUpdater from './FrameUpdater';
import ActivePlayer from './DynamicWorld/ActivePlayer';
import Hermes from './hermes/Hermes';

// import * as CANNON from 'cannon';
//
// window.CANNON = CANNON;

export default class OSDApp {
    canvas : HTMLCanvasElement;
    engine : BABYLON.Engine;
    scene: BABYLON.Scene;
    camera : BABYLON.UniversalCamera;
    cameraGoal: BABYLON.Mesh;
    cameraCurrent: BABYLON.Mesh;
    dynamicWorld: DynamicWorld;
    hermes: Hermes;
    player: ActivePlayer = null;

    constructor() {
        window['_osdapp'] = this;
        this.canvas = document.createElement('canvas');
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.createScene();
        this.createCamera();

        this.engine.runRenderLoop(() => {
            this.update();
            this.scene.render();
            FrameUpdater.postFrameUpdate({ scene: this.scene });
        });

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
        this.dynamicWorld = new DynamicWorld(this);
        this.dynamicWorld.load();
        this.hermes = new Hermes(this);

        // To see physics model, do:
        // setTimeout(this.showPhysicsViewer.bind(this), 3000);
    }

    showPhysicsViewer() {
        let physicsViewer = new BABYLON.PhysicsViewer(this.scene);

        this.scene.meshes.forEach(mesh =>{
            if (mesh.physicsImpostor) {
                physicsViewer.showImpostor(mesh.physicsImpostor, mesh as any);
            }
        });
    }

    update() {
        const deltaTime = this.engine.getDeltaTime();
        this.updateCamera(deltaTime);
        FrameUpdater.update({ scene: this.scene, deltaTime: deltaTime });
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

        this.cameraGoal.position.z += 30;
        this.cameraGoal.rotation.y -= Math.PI;

        this.camera.parent = this.cameraCurrent;

        this.updateCamera(0.0);
    }

    updateCamera(deltaTime) {
        const yOffset = this.player?.vehicle?.dynamicObject.manifest.cameraYOffset || 4;
        this.cameraGoal.position.y = yOffset;

        const targetPosition = this.cameraGoal.getAbsolutePosition();
        const currentPosition = this.cameraCurrent.getAbsolutePosition();
        const targetRotation = this.cameraGoal.absoluteRotationQuaternion;

        const factor = 1.0 - Math.min(Math.max(deltaTime * 0.03, 0.0), 1.0);

        const rotationMultiplyer =  this.player?.isInVehicle? 0.18 :  0.2;
        const rotationFactor =  rotationMultiplyer * factor;
        this.cameraCurrent.position =
            targetPosition.scale(1.0 - factor).add(currentPosition.scale(factor));
        this.cameraCurrent.rotationQuaternion = BABYLON.Quaternion.Slerp(this.cameraCurrent.absoluteRotationQuaternion, targetRotation, rotationFactor);
    }

    createScene() {
        const scene = new BABYLON.Scene(this.engine);
        this.scene = scene;
        new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), this.scene);
        this.canvas.focus();
        this.createPhysics();
    };

    async createPhysics() {
        let gravityVector = new BABYLON.Vector3(0, -30, 0);

        await (Ammo as any)();
        let physicsPlugin = new BABYLON.AmmoJSPlugin();
        this.scene.enablePhysics(gravityVector, physicsPlugin);
        const engine = this.scene.getPhysicsEngine();
    }
}
