import * as BABYLON from 'babylonjs';

export default class Vehicle {
    model;
    scene;
    watchedKeyCodes;
    velocity;
    angularVelocity;
    trailer: null;

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

        const dampModel = (model, dampPerSecond, angularDampPerSecond) => {
            const dampingFactor = (1.0 - dampPerSecond * deltaTime);
            const angularDampingFactor = (1.0 - angularDampPerSecond * deltaTime);
            const velocity = model.physicsImpostor.getLinearVelocity();
            const angularVelocity = model.physicsImpostor.getAngularVelocity();
            model.physicsImpostor.setLinearVelocity(velocity.scale(dampingFactor));
            model.physicsImpostor.setAngularVelocity(angularVelocity.scale(angularDampingFactor));
        };

        dampModel(this.model, 0.001, 0.001);

        if (this.trailer) {
            dampModel(this.trailer.model, 0.001, 0.02);
        }
    }

    listenKeyboard() { }

    updateControl(deltaTime) { }

    update(deltaTime) {
        this.updateControl(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateDamping(deltaTime);
    }
}
