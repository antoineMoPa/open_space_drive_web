import * as BABYLON from 'babylonjs';
import makeCollisions from './CollisionObject';

export default class Vehicle {
    model;
    scene;
    watchedKeyCodes;
    velocity;
    angularVelocity;
    collisionObject;

    constructor(model, scene) {
        this.model = model;
        this.scene = scene;
        this.velocity = new BABYLON.Vector3(0.0, 0.0, 0.0);
        this.angularVelocity = new BABYLON.Vector3();

        this.listenKeyboard();

        makeCollisions(this);
    }

    dispose() {
        this.collisionObject.dispose();
        this.model.dispose();
    }

    updatePhysics(deltaTime) {
        const t = deltaTime;
        // no idea why the -1 is required here...
        this.model.position.addInPlace(this.velocity.scale(t).multiplyByFloats(-1,1,1));

        this.model.rotate(BABYLON.Axis.X,
            this.angularVelocity.x * t,
            BABYLON.Space.WORLD);
        this.model.rotate(BABYLON.Axis.Y,
            this.angularVelocity.y * t,
            BABYLON.Space.WORLD);
        this.model.rotate(BABYLON.Axis.Z,
            this.angularVelocity.z * t,
            BABYLON.Space.WORLD);
    }

    updateDamping(deltaTime) {
        const dampPerSecond = 0.008;
        const dampingFactor = (1.0 - dampPerSecond * deltaTime);

        this.velocity = this.velocity.scale(dampingFactor);
        this.angularVelocity = this.angularVelocity.scale(dampingFactor);
    }

    listenKeyboard() { }

    updateControl(deltaTime) { }

    update(deltaTime) {
        this.updateControl(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateDamping(deltaTime);
    }
}
