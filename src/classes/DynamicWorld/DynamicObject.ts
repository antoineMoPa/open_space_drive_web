import * as BABYLON from 'babylonjs';

import { cloneDeep } from 'lodash';

export default class DynamicObject {
    velocity:BABYLON.Vector3 = new BABYLON.Vector3(0.0, 0.0, 0.0);
    _model = null;
    _manifest = null;
    _poseModel = null;
    _boxModel = null;

    constructor({ model, boxModel, manifest }) {
        this._model = model;
        this._boxModel = boxModel;
        this._manifest = manifest;
    }

    clone() {
        const dynamicObject = new DynamicObject({
            model: this._model ? this._model.clone() : null,
            boxModel: this._boxModel ? this._boxModel.clone() : null,
            poseModel: this._poseModel ? this._poseModel.clone() : null,
            manifest: this._manifest ? cloneDeep(this._manifest) : {}
        });
        if (this._poseModel) {
            dynamicObject._poseModel = this._poseModel.clone();
        }
        if (this._boxModel) {
            dynamicObject._boxModel = this._boxModel.clone();
        }
        return dynamicObject;
    }

    get model() {
        return this._model;
    }

    get poseModel() {
        return this._poseModel;
    }

    set poseModel(poseModel) {
        this._poseModel = poseModel;
    }

    get manifest() {
        return this._manifest;
    }

    get boxModel() {
        return this._boxModel;
    }

    set boxModel(boxModel) {
        this._boxModel = boxModel;
    }

    get physicsModel() {
        return this.boxModel || this.model;
    }
}
