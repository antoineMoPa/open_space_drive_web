import * as BABYLON from 'babylonjs';

export default class DynamicObject {
    velocity:BABYLON.Vector3 = new BABYLON.Vector3(0.0, 0.0, 0.0);
    _model = null;
    _manifest = null;

    constructor(model, manifest) {
        this._model = model;
        this._manifest = manifest;
    }

    get model() {
        return this._model;
    }

    get manifest() {
        return this._manifest;
    }
}
