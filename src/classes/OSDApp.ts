import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import Vehicle from './DynamicWorld/Vehicle';
import DynamicWorld from './DynamicWorld/DynamicWorld';
import FrameUpdater from './FrameUpdater';
import ActivePlayer from './DynamicWorld/ActivePlayer';
import Hermes from './hermes/Hermes';
import DynamicObject from './DynamicWorld/DynamicObject';

// import * as CANNON from 'cannon';
//
// window.CANNON = CANNON;

class CameraSmoother {
    private smoothLength: number = 10;
    private pastTargetPositions: BABYLON.Vector3[] = [];
    private pastTargetRotations: BABYLON.Quaternion[] = [];

    addTargetRotation(x: BABYLON.Quaternion) {
        this.pastTargetRotations.push(x);
        if (this.pastTargetRotations.length > this.smoothLength) {
            this.pastTargetRotations.splice(0,1);
        }
    }

    addTargetPosition(x: BABYLON.Vector3) {
        this.pastTargetPositions.push(x);
        if (this.pastTargetPositions.length > this.smoothLength) {
            this.pastTargetPositions.splice(0,1);
        }
    }

    getTargetRotation() {
        return this.pastTargetRotations.reduce((acc, current) => {
            if (acc == null) {
                return current;
            }
            return acc.add(current);
        }, null).scale(1.0 / this.pastTargetRotations.length);
    }

    getTargetPosition() {
        return this.pastTargetPositions.reduce((acc, current) => {
            if (acc == null) {
                return current;
            }
            return acc.add(current);
        }, null).scale(1.0 / this.pastTargetPositions.length);
    }
}

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
    cameraSmoother = new CameraSmoother();

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

        this.camera.rotation.y = -Math.PI;
        this.camera.parent = this.cameraCurrent;

        this.updateCamera(0.0);
    }

    smoothCamera(deltaTime: number, target: DynamicObject, offset: BABYLON.Vector3) {
        const quaternion = target.physicsModel.absoluteRotationQuaternion;

        const playerPosition = target.physicsModel.getAbsolutePosition();
        offset.rotateByQuaternionAroundPointToRef(quaternion, new BABYLON.Vector3(0.0,0.0,0.0), offset);

        let targetPosition = playerPosition.add(offset);
        const currentPosition = this.cameraCurrent.getAbsolutePosition();
        let targetRotation = target.physicsModel.absoluteRotationQuaternion;

        this.cameraSmoother.addTargetPosition(targetPosition);
        this.cameraSmoother.addTargetRotation(targetRotation);
        targetPosition = this.cameraSmoother.getTargetPosition();
        targetRotation = this.cameraSmoother.getTargetRotation();

        const factor = 0.1 * deltaTime;
        const rotationMultiplier = 0.1;
        let rotationFactor =  rotationMultiplier * factor;

        this.cameraCurrent.position =
            targetPosition.scale(factor).add(currentPosition.scale(1.0 - factor));
        this.cameraCurrent.rotationQuaternion = BABYLON.Quaternion.Slerp(this.cameraCurrent.absoluteRotationQuaternion, targetRotation, rotationFactor);

    }

    updateCamera(deltaTime: number) {
        if (!this.player) {
            return;
        }
        let target: DynamicObject, yOffset: number, offset: BABYLON.Vector3;
        if (this.player?.isInVehicle) {
            target = this.player.vehicle.dynamicObject;
            yOffset = target.manifest.cameraYOffset || 4;
            offset = new BABYLON.Vector3(0.0, yOffset,  20.0);
        } else {
            target = this.player.dynamicObject;
            yOffset = target.manifest.cameraYOffset || 4;
            offset = new BABYLON.Vector3(0.0, yOffset,  14.0);
        }
        this.smoothCamera(deltaTime, target, offset);
    }

    createScene() {
        const scene = new BABYLON.Scene(this.engine);
        this.scene = scene;
        new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), this.scene);
        this.canvas.focus();
        this.createPhysics();
    };

    disableGravity() {
        this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0,0,0));
    }

    enableGravity() {
        this.scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0,-60,0));
    }

    get gravity(): BABYLON.Vector3 {
        return this.scene.getPhysicsEngine().gravity;
    }

    async createPhysics() {
        let gravityVector = new BABYLON.Vector3(0, 0, 0);

        await (Ammo as any)();
        let physicsPlugin = new BABYLON.AmmoJSPlugin();
        this.scene.enablePhysics(gravityVector, physicsPlugin);
        const engine = this.scene.getPhysicsEngine();
        this.enableGravity();
    }
}
