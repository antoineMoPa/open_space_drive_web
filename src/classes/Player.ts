import * as BABYLON from 'babylonjs';
import OSDApp from './OSDApp';
import Vehicle from './Vehicle';
import makeCollisions from './CollisionObject';
import DynamicObject from './DynamicObject';
import FrameUpdater from './FrameUpdater';

export default class Player {
    app: OSDApp
    model: BABYLON.AbstractMesh;
    dynamicObject;
    vehicle: null;

    constructor(app) {
        this.app = app;
        this.buildModel();
        this.frameUpdater = FrameUpdater.addUpdater(this.update.bind(this));
    }

    enterExitVehicle() {
        if (this.isInVehicle) {
            this.exitVehicle();
        } else {
            this.enterVehicle();
        }
    }

    enterVehicle() {
        const position = this.model.position;
        this.app.dynamicWorld.vehicles.forEach((vehicle) => {
            const distance = vehicle.dynamicObject.model.position.subtract(position).length();

            if (distance < 10) {
                this.vehicle = vehicle;
                this.model.setParent(vehicle.dynamicObject.model);
                this.model.physicsImpostor.dispose();
                this.model.position.scaleInPlace(0);
                this.model.position.y -= 0.5;
                this.app.cameraGoal.parent = vehicle.dynamicObject.model;
                vehicle.playerEnter();
            }
        });
    }

    exitVehicle() {
        this.model.setParent(null);
        this.model.physicsImpostor.physicsBody.wakeUp();
        this.model.position = this.vehicle.dynamicObject.model.position.clone();
        this.model.position.addInPlace(new BABYLON.Vector3(1,0,0));
        this.app.cameraGoal.parent = this.model;
        this.enablePhysics();
        this.vehicle.playerExit();
        this.vehicle = null;
    }

    buildModel() {
        const collisionParent =  BABYLON.MeshBuilder.CreateBox("box", {
        }, this.app.scene);

        collisionParent.isVisible = false;

        this.model = collisionParent;
        this.model.position.x = 0;
        this.model.position.z = 0;
        this.model.position.y = 10;
        this.model.rotation.y = Math.PI;

        const head = BABYLON.MeshBuilder.CreateSphere("sphere", {
        }, this.app.scene);
        const body = BABYLON.MeshBuilder.CreateCylinder("test", {
            height: 1.0
        }, this.app.scene);

        this.model.addChild(head);
        this.model.addChild(body);

        head.position.y = 1;
        body.position.y = 0.5;

        const material = new BABYLON.StandardMaterial("playerMaterial", this.app.scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        head.material = material;
        body.material = material;

        const dynamicObject = new DynamicObject(this.model, {
            isStaticObject: false,
            mass: 70
        });
        this.dynamicObject = dynamicObject;
        this.enablePhysics();
    }

    enablePhysics() {
        makeCollisions(this.dynamicObject, this.app.scene);
    }

    get isInVehicle() {
        return this.model.parent !== null;
    }

    updateDamping(deltaTime) {
        if (this.isInVehicle) {
            return;
        }
        const dampModel = (model, dampPerSecond, angularDampPerSecond) => {
            const dampingFactor = (1.0 - dampPerSecond * deltaTime);
            const angularDampingFactor = (1.0 - angularDampPerSecond * deltaTime);
            const velocity = model.physicsImpostor.getLinearVelocity();
            const angularVelocity = model.physicsImpostor.getAngularVelocity();
            model.physicsImpostor.setLinearVelocity(velocity.scale(dampingFactor));
            model.physicsImpostor.setAngularVelocity(angularVelocity.scale(angularDampingFactor));
        };

        dampModel(this.model, 0.01, 0.001);
    }

    listenKeyboard() { }

    updateControl(deltaTime) { }

    updateGravity(deltaTime) {
        if (this.isInVehicle) {
            return;
        }
        const velocity = this.model.physicsImpostor.getLinearVelocity();
        this.model.physicsImpostor.setLinearVelocity(velocity.add(new BABYLON.Vector3(0,-3,0)));
    }

    update({ deltaTime }) {
        this.updateControl(deltaTime);
        this.updateDamping(deltaTime);
        this.updateGravity(deltaTime);
    }
}
