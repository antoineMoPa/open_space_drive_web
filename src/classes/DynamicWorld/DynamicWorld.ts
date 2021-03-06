import BabylonPackedObjectReader from './BabylonPackedObjectReader';
import OSDApp from '../OSDApp';
import makeCollisions from './CollisionObject';
import Vehicle from './Vehicle';
import RoadRig from './RoadRig';
import ActivePlayer from './ActivePlayer';

export default class DynamicWorld {
    initialObjectData = {};
    allDynamicObjects: any[] = [];
    private allVehicles: (Vehicle|RoadRig)[] = [];
    app: OSDApp;

    constructor(app) {
        this.app = app;

        this.buildGround();
        this.buildVehicles();
        //this.buildTempBuildings();
        //this.buildWorldSphere();
        this.buildPlayers();
    }

    get vehicles() {
        return this.allVehicles;
    }

    buildPlayers() {
        this.initialObjectData['player_0001'] = [];
        this.initialObjectData['player_0001'].push({
            x: 20,
            y: 2.5,
            z: 50
        });
    }

    buildVehicles() {
        this.initialObjectData['trailer_0001'] = [{
            x: 75,
            y: 3,
            z: 220
        }];
        this.initialObjectData['road_rig_0001'] = [{
            x: 20,
            y: 2.5,
            z: 20
        }];
        this.initialObjectData['car_0002'] = [{
            x: 40,
            y: 2.5,
            z: 20
        }];
        this.initialObjectData['bus_0001'] = [{
            x: 60,
            y: 2.5,
            z: 20
        }];
        this.initialObjectData['car_0001'] = [{
            x: 80,
            y: 2.5,
            z: 20
        }];

    }

    buildTempBuildings() {
        let availableBuildingMeshes = [
            'building_0000000000000001',
            'building_0000000000000002',
            'building_0000000000000003',
            'building_0000000000000004'
        ];

        availableBuildingMeshes.forEach(building => {
            this.initialObjectData[building] = [];
        });

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                this.initialObjectData['building_000000000000000' + ((i ^ j + 2) % 4 + 1)]
                    .push({
                        x: i * 300 - 500,
                        y: 0,
                        z: j * 250 + 1000
                    });
            }
        }
    }

    buildGround() {
        this.initialObjectData['ground_0001'] = [{
            x: -200,
            y: 0,
            z: 1250
        }];

        this.initialObjectData['palm_tree_0001'] = [];

        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                this.initialObjectData['palm_tree_0001'].push({
                    x: (Math.random() - 0.5) * 2000,
                    y: 0,
                    z: (Math.random() - 0.5) * 2000 + 1000,
                    rotateY: (Math.random() - 0.5) * Math.PI
                });
            }
        }
    }

    buildWorldSphere() {
        this.initialObjectData['world_sphere_0001'] = [{
            x: 0,
            y: 0,
            z: 0,
        }];
    }

    async loadInitialObjectsByName(objectName) {
        const app = this.app;

        let initialObjectData = this.initialObjectData[objectName];
        const babylonPackedObjectReader = new BabylonPackedObjectReader(
            app.scene, `${document.baseURI}objects/${objectName}`
        );

        const sourceDynamicObject = await babylonPackedObjectReader.load() as any;

        initialObjectData.forEach(async (parameters, index) => {
            let dynamicObject = null;
            if (index === initialObjectData.length - 1) {
                dynamicObject = sourceDynamicObject;
            } else {
                dynamicObject = sourceDynamicObject.clone();
            }
            let { x, y, z } = parameters;
            const {model, physicsModel, boxModel, poseModel} = dynamicObject;
            const manifest = dynamicObject.manifest;
            const isStaticObject = manifest.isStaticObject ?? true;

            [model, physicsModel, boxModel].forEach(model => {
                if (!model) {
                    return;
                }

                model.position.scaleInPlace(0);
                if (model.parent && model != poseModel) {
                    model.parent = null;
                }
            })

            if (manifest.isPlayer) {
                poseModel.parent.parent = physicsModel;
            }

            if (manifest.hasCollisions) {
                makeCollisions(dynamicObject, app.scene);
            }

            (boxModel || physicsModel).position.x += x;
            (boxModel || physicsModel).position.y += y;
            (boxModel || physicsModel).position.z += z;

            const impostor: BABYLON.PhysicsImpostor = physicsModel.physicsImpostor;
            if (impostor && impostor.type != BABYLON.PhysicsImpostor.MeshImpostor) {
                // No idea why I need to do this...
                const center = physicsModel.getBoundingInfo().boundingBox.center;
                physicsModel.physicsImpostor.setDeltaPosition(center.negate());
            }

            if (manifest.isPlayer) {
                app.player = new ActivePlayer(app, dynamicObject);
                this.app.player.model = physicsModel;
                (this.app.player.dynamicObject as any) = dynamicObject;
            }

            if (manifest.isVehicle) {
                this.allVehicles.push(new Vehicle(app, dynamicObject));
            }
            if (manifest.isRoadRig) {
                this.allVehicles.push(new RoadRig(app, dynamicObject));
            }
            if (parameters.rotateY) {
                physicsModel.rotation.y = parameters.rotateY;
            }
            if (!isStaticObject) {
                this.allDynamicObjects.push(dynamicObject);
            }
        });
    }

    async load() {
        for (let objectName in this.initialObjectData) {
            await this.loadInitialObjectsByName(objectName);
        }
    }
}
