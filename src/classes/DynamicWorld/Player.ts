import * as BABYLON from 'babylonjs';

import OSDApp from '../OSDApp';
import FrameUpdater from '../FrameUpdater';

import Vehicle from './Vehicle';
import makeCollisions from './CollisionObject';
import DynamicObject from './DynamicObject';

export default class Player {
    app: OSDApp
    _model: BABYLON.AbstractMesh;
    vehicle: Vehicle = null;
    frameUpdater: FrameUpdater;
    private dynamicObject: DynamicObject;

    constructor({ app, dynamicObject }) {
        this.app = app;
        this.dynamicObject = dynamicObject;
        this.frameUpdater = FrameUpdater.addUpdater(this.update.bind(this));
    }

    get model() {
        return this._model;
    }

    set model(model) {
        this._model = model;
    }

    enterExitVehicle() {
        if (this.isInVehicle) {
            this.exitVehicle();
        } else {
            this.enterVehicle();
        }
    }

    enterVehicle() {
        const position = this.dynamicObject.boxModel.position;
        this.app.dynamicWorld.vehicles.forEach((vehicle) => {
            const distance = vehicle.dynamicObject
                .physicsModel.position.subtract(position).length();

            if (distance < 10) {
                this.vehicle = vehicle;
                this.dynamicObject.boxModel.setParent(vehicle.dynamicObject.physicsModel);
                this.dynamicObject.boxModel.physicsImpostor.dispose();
                this.dynamicObject.boxModel.position.scaleInPlace(0);
                this.dynamicObject.boxModel.position.y -= 0.5;
                this.app.cameraGoal.parent = vehicle.dynamicObject.physicsModel;
                this.dynamicObject.model.isVisible = false;
                vehicle.playerEnter();
            }
        });
    }

    exitVehicle() {
        this.dynamicObject.boxModel.setParent(null);
        this.dynamicObject.boxModel.physicsImpostor.physicsBody.wakeUp();
        this.dynamicObject.boxModel.position = this.vehicle.dynamicObject.physicsModel.position.clone();
        this.dynamicObject.boxModel.position.addInPlace(new BABYLON.Vector3(1,0,0));
        this.dynamicObject.model.isVisible = true;
        this.app.cameraGoal.parent = this.dynamicObject.boxModel;
        this.enablePhysics();
        this.vehicle.playerExit();
        this.vehicle = null;
    }

    enablePhysics() {
        makeCollisions(this.dynamicObject, this.app.scene);
    }

    get isInVehicle() {
        return this.dynamicObject.boxModel.parent !== null;
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

        dampModel(this.dynamicObject.boxModel, 0.01, 0.001);
    }

    listenKeyboard() { }

    updateControl(deltaTime) { }

    updateGravity(deltaTime) {
        if (this.isInVehicle) {
            return;
        }
        const velocity = this.dynamicObject.boxModel.physicsImpostor.getLinearVelocity();
        this.dynamicObject.boxModel.physicsImpostor.setLinearVelocity(velocity.add(new BABYLON.Vector3(0,-3,0)));
    }

    updateAnimation() {
        const walking = this.dynamicObject.boxModel.physicsImpostor.getLinearVelocity().length() > 10;
        const animationGroup = this.app.scene.getAnimationGroupByName('player_0001_walk');

        if (!animationGroup) {
            return;
        }

        if (animationGroup.isPlaying != walking) {
            if (walking) {
                animationGroup.play();
            } else {
                animationGroup.pause();
            }
        }
    }

    update({ deltaTime }) {
        this.updateControl(deltaTime);
        this.updateDamping(deltaTime);
        this.updateGravity(deltaTime);
        this.updateAnimation();
    }
}
