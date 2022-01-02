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
    private _dynamicObject: DynamicObject;

    constructor({ app, dynamicObject }) {
        this.app = app;
        this._dynamicObject = dynamicObject;
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
        const position = this._dynamicObject.boxModel.position;
        this.app.dynamicWorld.vehicles.forEach((vehicle) => {
            const distance = vehicle.dynamicObject
                .physicsModel.position.subtract(position).length();

            if (distance < 10) {
                this.vehicle = vehicle;
                this._dynamicObject.boxModel.setParent(vehicle.dynamicObject.physicsModel);
                this._dynamicObject.boxModel.physicsImpostor.dispose();
                this._dynamicObject.boxModel.position.scaleInPlace(0);
                this._dynamicObject.boxModel.position.y -= 0.5;
                //this.app.cameraGoal.parent = vehicle.dynamicObject.physicsModel;
                this._dynamicObject.model.isVisible = false;
                vehicle.playerEnter();
            }
        });
    }

    exitVehicle() {
        this._dynamicObject.boxModel.setParent(null);
        if (this._dynamicObject.boxModel.physicsImpostor.physicsBody.wakeUp) {
            this._dynamicObject.boxModel.physicsImpostor.physicsBody.wakeUp();
        }
        this._dynamicObject.boxModel.position = this.vehicle.dynamicObject.physicsModel.position.clone();
        this._dynamicObject.boxModel.position.addInPlace(new BABYLON.Vector3(1,0,0));
        this._dynamicObject.model.isVisible = true;
        //this.app.cameraGoal.parent = this._dynamicObject.boxModel;
        this.enablePhysics();
        this.vehicle.playerExit();
        this.vehicle = null;
    }

    enablePhysics() {
        makeCollisions(this._dynamicObject, this.app.scene);
    }

    get isInVehicle() {
        return this._dynamicObject.boxModel.parent !== null;
    }

    updateDamping(deltaTime) {
        if (this.isInVehicle) {
            return;
        }

        const dampModel = (model, dampPerSecond, angularDampPerSecond) => {
            const dampingFactor = (1.0 - dampPerSecond * deltaTime);
            const angularDampingFactor = (1.0 - angularDampPerSecond * deltaTime);
            const velocity = model.physicsImpostor.getLinearVelocity().clone();
            const angularVelocity = model.physicsImpostor.getAngularVelocity();
            model.physicsImpostor.setLinearVelocity(velocity.scale(dampingFactor));
            model.physicsImpostor.setAngularVelocity(angularVelocity.scale(angularDampingFactor));
        };

        dampModel(this._dynamicObject.boxModel, 0.003, 0.001);
    }

    listenKeyboard() { }

    updateControl(deltaTime) { }

    updateAnimation() {
        const walking = this._dynamicObject.boxModel.physicsImpostor.getLinearVelocity().length() > 10;
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

    get dynamicObject(): DynamicObject {
        return this._dynamicObject;
    }

    set dynamicObject(dynamicObject: DynamicObject) {
        this._dynamicObject = dynamicObject;
    }


    update({ deltaTime }) {
        if (this.isInVehicle) {
            return;
        }
        this.updateControl(deltaTime);
        this.updateDamping(deltaTime);
        this.updateAnimation();
    }
}
