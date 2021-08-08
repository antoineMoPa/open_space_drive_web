import * as BABYLON from 'babylonjs';

export default class Vehicle {
    model;
    scene;
    watchedKeyCodes;

    constructor(model, scene){
        this.model = model;
        this.scene = scene;
        this.velocity = new BABYLON.Vector3(0.0,0.0,0.0);
        this.angularVelocity = new BABYLON.Vector3();

        this.listenKeyboard();
    }


    updatePhysics(deltaTime) {
        const t = deltaTime;
        this.model.translate(this.velocity.multiplyByFloats(t,t,-t), 1,
                             BABYLON.Space.MODEL);
        this.model.rotate(BABYLON.Axis.X,
                          this.angularVelocity.x * t,
                          BABYLON.Space.MODEL);
        this.model.rotate(BABYLON.Axis.Y,
                          this.angularVelocity.y * t,
                          BABYLON.Space.MODEL);
        this.model.rotate(BABYLON.Axis.Z,
                          this.angularVelocity.z * t,
                          BABYLON.Space.MODEL);
    }

    updateDamping(deltaTime) {
        const dampPerSecond = 0.008;
        const dampingFactor = (1.0 - dampPerSecond * deltaTime);

        this.velocity = this.velocity.multiplyByFloats(
            dampingFactor, dampingFactor, dampingFactor);
        this.angularVelocity = this.angularVelocity.multiplyByFloats(
            dampingFactor, dampingFactor, dampingFactor);
    }

    listenKeyboard() { }

    updateControl(deltaTime) { }

    update(deltaTime) {
        this.updateControl(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateDamping(deltaTime);
    }
}
