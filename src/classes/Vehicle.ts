import * as BABYLON from 'babylonjs';
import FrameUpdater from './FrameUpdater';

export default class Vehicle {
    private app;
    public dynamicObject;
    private watchedKeyCodes;
    private trailer: null;
    private frameUpdater = null;
    private observers: any[] = [];

    constructor(app, dynamicObject) {
        this.app = app;
        this.dynamicObject = dynamicObject;

        this.frameUpdater = FrameUpdater.addUpdater(this.update.bind(this));
    }

    playerExit() {
        this.clearListenKeyboard();
    }

    playerEnter() {
        this.listenKeyboard();
    }

    dispose() {
        this.dynamicObject.model.dispose();
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

        dampModel(this.dynamicObject.physicsModel, 0.001, 0.001);

        if (this.trailer) {
            dampModel((this.trailer as any).model, 0.001, 0.02);
        }
    }

    private listenKeyboard() {
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


        this.observers.push(this.app.scene.onKeyboardObservable.add((kbInfo) => {
            const code = kbInfo.event.code.toString();

            if ('Shift' in this.watchedKeyCodes) {
                this.watchedKeyCodes['Shift'] = kbInfo.event.shiftKey;
            }

            if (!(code in this.watchedKeyCodes)) {
                return;
            }

            if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYDOWN) {
                this.watchedKeyCodes[code] = true;
            } else if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYUP) {
                this.watchedKeyCodes[code] = false;
            }
        }));

        this.observers.push(this.app.scene.onKeyboardObservable.add((kbInfo) => {
            const code = kbInfo.event.code.toString();
            if (code === 'KeyJ' && kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
                this.joinTrailer();
            }
        }));
    }

    private clearListenKeyboard() {
        this.observers.forEach((observer) => {
            this.app.scene.onKeyboardObservable.remove(observer);
        });
    }

    joinTrailer() {
        if (this.trailer) {
            return;
        }

        const trailer = (this.app.dynamicWorld
            .allDynamicObjects as any)
            .filter(obj => (obj as any).manifest.isTrailer)[0];
        const joint = new BABYLON.PhysicsJoint(
            BABYLON.PhysicsJoint.BallAndSocketJoint, {
                mainAxis: new BABYLON.Vector3(0,1,0),
                connectedAxis: new BABYLON.Vector3(0,1,0),
                mainPivot: new BABYLON.Vector3(0,0,10),
                connectedPivot: new BABYLON.Vector3(0,0,-10),
            });

        const model = this.dynamicObject.physicsModel;
        model.position.scale(0);
        model.physicsImpostor.addJoint(((trailer as any).model as any).physicsImpostor, joint);

        this.trailer = trailer;
    }

    private get isPlayerDriving() {
        return this.observers.length > 0;
    }

    updateControl(deltaTime) {
        if (!this.isPlayerDriving) {
            return;
        }

        let strength = 0.2 * deltaTime;
        const backStrength = 0.3 * strength;
        let rotateStrength = 0.002 * deltaTime;
        const rollStrength = rotateStrength;

        if (this.trailer) {
            rotateStrength *= 60.0;
        }

        const rotationMatrix = new BABYLON.Matrix();
        this.dynamicObject.physicsModel.absoluteRotationQuaternion.toRotationMatrix(rotationMatrix);

        const localToGlobal = (vector) => {
            return BABYLON.Vector3.TransformCoordinates(vector, rotationMatrix);
        };

        const velocity = this.dynamicObject.physicsModel.physicsImpostor.getLinearVelocity();
        const angularVelocity = this.dynamicObject.physicsModel.physicsImpostor.getAngularVelocity();
        const localVelocityOffset = new BABYLON.Vector3(0,0,0);
        const localAngularVelocityOffset = new BABYLON.Vector3(0,0,0);

        if (this.watchedKeyCodes.Shift) {
            strength *= 3.0;
        }
        if (this.watchedKeyCodes.KeyW) {
            localVelocityOffset.z -= strength;
        }
        if (this.watchedKeyCodes.KeyS) {
            localVelocityOffset.z += backStrength;
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
        const impostor = this.dynamicObject.physicsModel.physicsImpostor;
        impostor.setLinearVelocity(velocity.add(localToGlobal(localVelocityOffset)));
        impostor.setAngularVelocity(angularVelocity.add(localToGlobal(localAngularVelocityOffset)));
    }

    update({ deltaTime }) {
        this.updateControl(deltaTime);
        this.updateDamping(deltaTime);
    }
}
