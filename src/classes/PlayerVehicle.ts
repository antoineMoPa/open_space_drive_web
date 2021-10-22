import Vehicle from './Vehicle';

export default class PlayerVehicle extends Vehicle {
    listenKeyboard() {
        this.watchedKeyCodes = {'KeyS': false,
            'ArrowDown': false,
            'KeyW': false,
            'ArrowUp': false,
            'KeyA': false,
            'ArrowLeft': false,
            'KeyD': false,
            'Shift': false,
            'ArrowRight': false};

        this.scene.onKeyboardObservable.add((kbInfo) => {
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
        });
    }

    dispose() {
        super.dispose();
    }

    updateControl(deltaTime) {
        let strength = 0.001 * deltaTime;
        const backStrength = 0.0003 * deltaTime;
        const rotateStrength = 0.000016 * deltaTime;
        const rotationMatrix = new BABYLON.Matrix();
        this.model.absoluteRotationQuaternion.toRotationMatrix(rotationMatrix);

        const localToGlobal = (vector) => {
            return BABYLON.Vector3.TransformCoordinates(vector, rotationMatrix);
        };

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
            localAngularVelocityOffset.z += rotateStrength;
        }
        if (this.watchedKeyCodes.KeyD) {
            localAngularVelocityOffset.z -= rotateStrength;
        }
        if (this.watchedKeyCodes.ArrowUp) {
            localAngularVelocityOffset.x -= rotateStrength;
        }
        if (this.watchedKeyCodes.ArrowDown) {
            localAngularVelocityOffset.x += rotateStrength;
        }

        this.velocity.addInPlace(localToGlobal(localVelocityOffset));
        this.angularVelocity.addInPlace(localToGlobal(localAngularVelocityOffset));
    }
}
