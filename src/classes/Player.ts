import * as BABYLON from 'babylonjs';
import ActiveVehicle from './ActiveVehicle';
import OSDApp from './OSDApp';
import makeCollisions from './CollisionObject';
import DynamicObject from './DynamicObject';
import FrameUpdater from './FrameUpdater';

export default class Player {
    app: OSDApp
    _playerVehicle: ActiveVehicle;
    model: BABYLON.AbstractMesh;

    constructor(app) {
        this.app = app;
        this.buildModel();
        this.frameUpdater = FrameUpdater.addUpdater(this.update.bind(this));
    }

    enterExitCar() {

    }

    buildModel() {
        const collisionParent =  BABYLON.MeshBuilder.CreateBox("box", {
        }, this.app.scene);

        collisionParent.isVisible = false;

        this.model = collisionParent;
        this.model.position.x = 0;
        this.model.position.z = 0;
        this.model.position.y = 10;

        const head = BABYLON.MeshBuilder.CreateSphere("sphere", {

        }, this.app.scene);
        const body = BABYLON.MeshBuilder.CreateCylinder("test", {
            height: 1.0
        }, this.app.scene);

        this.model.addChild(head);
        this.model.addChild(body);

        head.position.y = 1;
        body.position.y = 0.5;

        const material = new BABYLON.StandardMaterial("playerMaterial", this.app.scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        head.material = material;
        body.material = material;

        const dynamicObject = new DynamicObject(this.model, {
            isStaticObject: false
        });
        makeCollisions(dynamicObject, this.app.scene);
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

        dampModel(this.model, 0.01, 0.001);
    }

    set playerVehicle(_playerVehicle) {
        this._playerVehicle = new ActiveVehicle(
            this.app,
            _playerVehicle.model,
            this.app.scene,
        );
    }

    listenKeyboard() { }

    updateControl(deltaTime) { }

    updateGravity(deltaTime) {
        const velocity = this.model.physicsImpostor.getLinearVelocity();
        this.model.physicsImpostor.setLinearVelocity(velocity.add(new BABYLON.Vector3(0,-3,0)));
    }

    update({ deltaTime }) {
        this.updateControl(deltaTime);
        this.updateDamping(deltaTime);
        this.updateGravity(deltaTime);
    }
}
