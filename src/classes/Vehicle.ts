import * as BABYLON from 'babylonjs';

export default class Vehicle {
    model;
    scene;
    watchedKeyCodes;
    velocity;
    angularVelocity;

    constructor(model, scene) {
        this.model = model;
        this.scene = scene;
        this.velocity = new BABYLON.Vector3(0.0, 0.0, 0.0);
        this.angularVelocity = new BABYLON.Vector3();

        this.listenKeyboard();
    }

    dispose() {
        this.model.dispose();
    }

    updatePhysics(deltaTime) {
        const t = deltaTime;

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
        const dampPerSecond = 0.001;
        const dampingFactor = (1.0 - dampPerSecond * deltaTime);

        const velocity = this.model.physicsImpostor.getLinearVelocity();
        const angularVelocity = this.model.physicsImpostor.getAngularVelocity();
        this.model.physicsImpostor.setLinearVelocity(velocity.scale(dampingFactor));
        this.model.physicsImpostor.setAngularVelocity(angularVelocity.scale(dampingFactor));
    }

    listenKeyboard() { }

    updateControl(deltaTime) { }

    update(deltaTime) {
        this.updateControl(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateDamping(deltaTime);
    }
}
