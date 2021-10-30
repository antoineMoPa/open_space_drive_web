import * as BABYLON from 'babylonjs';
import PlayerVehicle from './PlayerVehicle';
import OSDApp from './OSDApp';

export default class Player {
    app: OSDApp
    _playerVehicle: PlayerVehicle;
    position = new BABYLON.Vector3(0, 0, 0);

    constructor(app) {
        this.app = app;
    }

    update(deltaTime) {
        if (this._playerVehicle != null) {
            this._playerVehicle.update(deltaTime);
        }
    }

    set playerVehicle(_playerVehicle) {
        this._playerVehicle = new PlayerVehicle(
            this.app,
            _playerVehicle.model,
            this.app.scene,
        );
        this.app.cameraGoal.parent = _playerVehicle.model;
    }
}
