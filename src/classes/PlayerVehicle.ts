import Vehicle from './Vehicle';

export default class PlayerVehicle extends Vehicle {
    constructor(model, scene) {
        super(model, scene);
    }

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

        this.scene.onKeyboardObservable.add((kbInfo) => {
            const code = kbInfo.event.code.toString();
            if (code === 'KeyJ' && kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
                this.joinTrailer();
            }
        });

    }

    joinTrailer() {
        if (this.trailer) {
            return;
        }

        const trailer = this.scene.dynamicWorld
            .allDynamicObjects
            .filter(obj => obj.manifest.isTrailer)[0];
        const joint = new BABYLON.PhysicsJoint(
            BABYLON.PhysicsJoint.BallAndSocketJoint, {
                mainAxis: new BABYLON.Vector3(0,1,0),
                connectedAxis: new BABYLON.Vector3(0,1,0),
                mainPivot: new BABYLON.Vector3(0,0,10),
                connectedPivot: new BABYLON.Vector3(0,0,-10),
            });

        this.model.position.scale(0);
        this.model.physicsImpostor.addJoint(trailer.model.physicsImpostor, joint);

        //trailer.model.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0,0,0));
        //trailer.model.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion3(0,0,0,0));
        //this.model.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0,0,0));
        //this.model.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion3(0,0,0,0));

        this.trailer = trailer;
    }

    dispose() {
        super.dispose();
    }

    updateControl(deltaTime) {
        let strength = 0.2 * deltaTime;
        const backStrength = 0.3 * strength;
        let rotateStrength = 0.001 * deltaTime;
        const rollStrength = rotateStrength;

        if (this.trailer) {
            rotateStrength *= 60.0;
        }

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
        this.model.physicsImpostor.setLinearVelocity(
            velocity.add(localToGlobal(localVelocityOffset)));
        this.model.physicsImpostor.setAngularVelocity(
            angularVelocity.add(localToGlobal(localAngularVelocityOffset)));
    }
}
