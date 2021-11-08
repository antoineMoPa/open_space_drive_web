import * as BABYLON from 'babylonjs';
import Vehicle from './Vehicle';
import Player from './Player';
import OSDApp from './OSDApp';

export default class ActivePlayer extends Player {
    _playerVehicle: Vehicle;
    watchedKeyCodes: any;
    _model: BABYLON.AbstractMesh;

    constructor(app, dynamicObject) {
        super({app, dynamicObject});
        this.listenKeyboard();
    }

    set model(model) {
        this._model = model;
        this.app.cameraGoal.parent = this._model;
    }

    get model() {
        return this._model;
    }

    listenKeyboard() {
        this.watchedKeyCodes = {
            'KeyS': false,
            'ArrowDown': false,
            'KeyW': false,
            'ArrowUp': false,
            'KeyA': false,
            'ArrowLeft': false,
            'KeyD': false,
            'Shift': false,
            'ArrowRight': false,
            'Space': false
        };

        this.app.scene.onKeyboardObservable.add((kbInfo) => {
            const code = kbInfo.event.code.toString();

            if (!(code in this.watchedKeyCodes)) {
                return;
            }

            if ('Shift' in this.watchedKeyCodes) {
                this.watchedKeyCodes['Shift'] = kbInfo.event.shiftKey;
            }

            if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYDOWN) {
                this.watchedKeyCodes[code] = true;
            } else if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYUP) {
                this.watchedKeyCodes[code] = false;
            }
        });

        this.app.scene.onKeyboardObservable.add((kbInfo) => {
            const code = kbInfo.event.code.toString();
            if (code === 'KeyF' && kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
                this.enterExitVehicle();
            }
            if (code === 'Space' && kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
                if (!this.isInVehicle) {
                    this.jump();
                }
            }
        });
    }

    jump() {
        // TODO : check if there is the ground below, right now, we can jump forever from the
        // void
        const velocity = this.model.physicsImpostor.getLinearVelocity();
        const globalVelocityOffset = new BABYLON.Vector3(0,0,0);
        globalVelocityOffset.y += 60;
        this.model.physicsImpostor.setLinearVelocity(velocity.add(globalVelocityOffset));
        this.model.rotationQuaternion.w = 1;
        this.model.rotationQuaternion.x = 0;
        this.model.rotationQuaternion.y = 0;
        this.model.rotationQuaternion.z = 0;
    }

    updateControl(deltaTime) {
        if (this.isInVehicle) {
            return;
        }
        let strength = 0.2 * deltaTime;
        const backStrength = strength;
        let rotateStrength = 0.002 * deltaTime;
        const rollStrength = rotateStrength;

        const rotationMatrix = new BABYLON.Matrix();
        this.model.absoluteRotationQuaternion.toRotationMatrix(rotationMatrix);

        const localToGlobal = (vector) => {
            return BABYLON.Vector3.TransformCoordinates(vector, rotationMatrix);
        };

        const velocity = this.model.physicsImpostor.getLinearVelocity();
        const angularVelocity = this.model.physicsImpostor.getAngularVelocity();
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

        const impostor = this.model.physicsImpostor;
        impostor.setLinearVelocity(velocity.add(localToGlobal(localVelocityOffset)));
        impostor.setAngularVelocity(angularVelocity.add(localToGlobal(localAngularVelocityOffset)));
    }
}
