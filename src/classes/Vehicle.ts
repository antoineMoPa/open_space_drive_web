import * as BABYLON from 'babylonjs';
import FrameUpdater from './FrameUpdater';

export default class Vehicle {
    model;
    scene;
    watchedKeyCodes;
    velocity;
    angularVelocity;
    trailer: null;
    frameUpdater = null;

    constructor(model, scene) {
        this.model = model;
        this.scene = scene;

        this.frameUpdater = FrameUpdater.addUpdater(this.update.bind(this));
    }

    dispose() {
        this.model.dispose();
        FrameUpdater.removeUpdater(this.frameUpdater);
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
            dampModel((this.trailer as any).model, 0.001, 0.02);
        }
    }

    listenKeyboard() { }

    updateControl(deltaTime) { }

    update({ deltaTime }) {
        this.updateControl(deltaTime);
        this.updateDamping(deltaTime);
    }
}
