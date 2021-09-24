import Vehicle from "./Vehicle.ts";

export default class PlayerVehicle extends Vehicle {
    listenKeyboard() {
        this.watchedKeyCodes = { "KeyS": false,
                                 "ArrowDown": false,
                                 "KeyW": false,
                                 "ArrowUp": false,
                                 "KeyA": false,
                                 "ArrowLeft": false,
                                 "KeyD": false,
                                 "Shift": false,
                                 "ArrowRight": false };

        this.scene.onKeyboardObservable.add((kbInfo) => {
            let code = kbInfo.event.code.toString();

            if ('Shift' in this.watchedKeyCodes) {
                this.watchedKeyCodes['Shift'] = kbInfo.event.shiftKey;
            }

            if (!(code in this.watchedKeyCodes))
                return;

            if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYDOWN) {
                this.watchedKeyCodes[code] = true;
            } else if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYUP) {
                this.watchedKeyCodes[code] = false;
            }
        });
    }

    updateControl(deltaTime) {
        let strength = 0.001 * deltaTime;
        const backStrength = 0.001 * deltaTime;
        const rotateStrength = 0.00003 * deltaTime;

        if (this.watchedKeyCodes.Shift) {
            strength *= 10.0;
        }
        if (this.watchedKeyCodes.KeyW) {
            this.velocity.z += strength;
        }
        if (this.watchedKeyCodes.KeyS) {
            this.velocity.z -= backStrength;
        }
        if (this.watchedKeyCodes.ArrowLeft) {
            this.angularVelocity.y += rotateStrength;
        }
        if (this.watchedKeyCodes.ArrowRight) {
            this.angularVelocity.y -= rotateStrength;
        }
        if (this.watchedKeyCodes.KeyA) {
            this.angularVelocity.z += rotateStrength;
        }
        if (this.watchedKeyCodes.KeyD) {
            this.angularVelocity.z -= rotateStrength;
        }
        if (this.watchedKeyCodes.ArrowUp) {
            this.angularVelocity.x -= rotateStrength;
        }
        if (this.watchedKeyCodes.ArrowDown) {
            this.angularVelocity.x += rotateStrength;
        }
    }
}
