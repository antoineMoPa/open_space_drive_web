import * as BABYLON from 'babylonjs';

export default class DynamicObject {
    velocity:BABYLON.Vector3 = new BABYLON.Vector3(0.0, 0.0, 0.0);
    model = null;

    constructor(model) {
        this.model = model;
    }
}
