import * as BABYLON from 'babylonjs';

import FrameUpdater from '../FrameUpdater';

export default class Vehicle {
    protected app;
    public _dynamicObject;
    protected watchedKeyCodes;
    private trailer = null;
    private trailerJoint = null;
    private frameUpdater = null;
    private observers: any[] = [];

    constructor(app, dynamicObject) {
        this.app = app;
        this._dynamicObject = dynamicObject;

        this.frameUpdater = FrameUpdater.addUpdater(this.update.bind(this));

        this.watchedKeyCodes = {
            'KeyS': false,
            'ArrowDown': false,
            'KeyW': false,
            'ArrowUp': false,
            'KeyA': false,
            'ArrowLeft': false,
            'KeyD': false,
            'Shift': false,
            'ArrowRight': false
        };
    }

    get dynamicObject() {
        return this._dynamicObject;
    }

    get hasGravity() {
        return true;
    }

    playerExit() {
        this.clearListenKeyboard();
    }

    playerEnter() {
        this.listenKeyboard();
    }

    dispose() {
        this._dynamicObject.model.dispose();
        FrameUpdater.removeUpdater(this.frameUpdater);
    }

    private updateDamping(deltaTime) {
        const dampModel = (model, dampPerSecond, angularDampPerSecond) => {
            const dampingFactor = (1.0 - dampPerSecond * deltaTime);
            const angularDampingFactor = (1.0 - angularDampPerSecond * deltaTime);
            const velocity = model.physicsImpostor.getLinearVelocity();
            const angularVelocity = model.physicsImpostor.getAngularVelocity();
            model.physicsImpostor.setLinearVelocity(velocity.scale(dampingFactor));
            model.physicsImpostor.setAngularVelocity(angularVelocity.scale(angularDampingFactor));
        };

        dampModel(this._dynamicObject.physicsModel, 0.001, 0.001);

        if (this.trailer) {
            dampModel((this.trailer as any).model, 0.001, 0.02);
        }
    }

    observeKeyboard(kbInfo, deltaTime) {
        const code = kbInfo.event.code.toString();

        if ('Shift' in this.watchedKeyCodes) {
            this.watchedKeyCodes['Shift'] = kbInfo.event.shiftKey;
        }
        if (code === 'KeyJ' && kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
            this.joinTrailer();
        }

        if (!(code in this.watchedKeyCodes)) {
            return;
        }

        if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYDOWN) {
            this.watchedKeyCodes[code] = true;
        } else if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYUP) {
            this.watchedKeyCodes[code] = false;
        }
    }

    private listenKeyboard() {
        this.observers.push(this.app.scene.onKeyboardObservable.add(this.observeKeyboard.bind(this)));
    }

    private clearListenKeyboard() {
        this.observers.forEach((observer) => {
            this.app.scene.onKeyboardObservable.remove(observer);
        });
    }

    joinTrailer() {
        const model = this._dynamicObject.physicsModel;
        const trailer = (this.app.dynamicWorld
            .allDynamicObjects as any)
            .filter(obj => (obj as any).manifest.isTrailer)[0];
        const trailerImpostor = ((trailer as any).model as any).physicsImpostor;

        if (this.trailer) {
            this.app.scene.getPhysicsEngine().removeJoint(model.physicsImpostor, trailerImpostor, this.trailerJoint);
            this.trailer = null;
            this.trailerJoint = null;
            return;
        }

        const joint = new BABYLON.PhysicsJoint(
            BABYLON.PhysicsJoint.BallAndSocketJoint, {
                mainAxis: new BABYLON.Vector3(0,1,0),
                connectedAxis: new BABYLON.Vector3(0,1,0),
                mainPivot: new BABYLON.Vector3(0,0,10),
                connectedPivot: new BABYLON.Vector3(0,0,-10),
            });

        model.position.scale(0);
        model.physicsImpostor.addJoint(trailerImpostor, joint);

        this.trailer = trailer;
        this.trailerJoint = joint;
    }

    private get isPlayerDriving() {
        return this.observers.length > 0;
    }

    updateControl(deltaTime) {
        if (!this.isPlayerDriving) {
            return;
        }

        const mass = this._dynamicObject.manifest.mass;
        const acceleration = this._dynamicObject.manifest.acceleration || 1;
        let strength = 5 * deltaTime * acceleration * mass;
        const backStrength = 0.3 * strength;
        let rotateStrength = 0.002 * deltaTime * (this._dynamicObject.manifest.rotationAcceleration || 1);
        const rollStrength = rotateStrength;

        if (this.trailer) {
            rotateStrength *= 60.0;
        }

        const rotationMatrix = new BABYLON.Matrix();
        this._dynamicObject.physicsModel.absoluteRotationQuaternion.toRotationMatrix(rotationMatrix);

        const localToGlobal = (vector) => {
            return BABYLON.Vector3.TransformCoordinates(vector, rotationMatrix);
        };

        let velocity = this._dynamicObject.physicsModel.physicsImpostor.getLinearVelocity();
        const angularVelocity = this._dynamicObject.physicsModel.physicsImpostor.getAngularVelocity();
        const force = new BABYLON.Vector3(0,0,0);
        const localAngularVelocityOffset = new BABYLON.Vector3(0,0,0);

        if (this.watchedKeyCodes.Shift) {
            strength *= 3.0;
        }
        if (this.watchedKeyCodes.KeyW) {
            force.z -= strength;
        }
        if (this.watchedKeyCodes.KeyS) {
            force.z += backStrength;
        }
        if (this.watchedKeyCodes.ArrowLeft) {
            localAngularVelocityOffset.y -= rotateStrength;
        }
        if (this.watchedKeyCodes.ArrowRight) {
            localAngularVelocityOffset.y += rotateStrength;
        }
        if (this.watchedKeyCodes.KeyA) {
            localAngularVelocityOffset.z -= rollStrength;
        }
        if (this.watchedKeyCodes.KeyD) {
            localAngularVelocityOffset.z += rollStrength;
        }
        if (this.watchedKeyCodes.ArrowUp) {
            localAngularVelocityOffset.x -= rotateStrength;
        }
        if (this.watchedKeyCodes.ArrowDown) {
            localAngularVelocityOffset.x += rotateStrength;
        }

        let localGravity = new BABYLON.Vector3(0,0,0);


        if (this.hasGravity) {
            const nearestRoadPoint = this.app.hermes.routes.getNearestRoadPoint(this._dynamicObject.physicsModel.position);
            if (nearestRoadPoint && nearestRoadPoint.up) {
                const strength = 40.0 * mass;
                localGravity = nearestRoadPoint.up.negate().scale(strength);
            }

            localGravity = new BABYLON.Vector3(0,-40 * mass,0);
        }

        const impostor = this._dynamicObject.physicsModel.physicsImpostor;
        const modelPosition = this._dynamicObject.physicsModel.getAbsolutePosition(new BABYLON.Vector3(0,0));

        const physicsModel = this._dynamicObject.physicsModel;
        const boundingInfo = physicsModel.getBoundingInfo();
        const centerOfMass = boundingInfo.boundingBox.centerWorld;

        impostor.applyForce(localToGlobal(force).add(localGravity), centerOfMass);
        impostor.setAngularVelocity(angularVelocity.add(localToGlobal(localAngularVelocityOffset)));
    }

    update({ deltaTime }) {
        this.updateControl(deltaTime);
        this.updateDamping(deltaTime);
    }
}
