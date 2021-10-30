import * as BABYLON from 'babylonjs';
import PlayerVehicle from './PlayerVehicle';
import OSDApp from './OSDApp';

export default class Player {
    app: OSDApp
    _playerVehicle: PlayerVehicle;
    model: BABYLON.AbstractMesh;
    position = new BABYLON.Vector3(0, 0, 0);

    constructor(app) {
        this.app = app;
        this.buildModel();
    }

    buildModel() {
        this.model = new BABYLON.AbstractMesh();
        this.model.position.x = 20;
        this.model.position.z = 20;

        const head = BABYLON.MeshBuilder.CreateSphere("sphere", {

        }, this.app.scene);
        head.position.y = 1;
        const body = BABYLON.MeshBuilder.CreateCylinder("test", {

        }, this.app.scene);

        this.model.addChild(head);
        const material = new BABYLON.StandardMaterial("playerMaterial", this.app.scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        head.material = material;
        body.material = material;
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
