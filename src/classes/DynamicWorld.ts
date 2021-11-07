import * as BABYLON from 'babylonjs';
import BabylonPackedObjectReader from './BabylonPackedObjectReader';
import OSDApp from './OSDApp';
import makeCollisions from './CollisionObject';
import Vehicle from './Vehicle';
import ActivePlayer from './ActivePlayer';

export default class DynamicWorld {
    initialObjectData: any[] = [];
    allDynamicObjects: any[] = [];
    private allVehicles: Vehicle[] = [];
    app: OSDApp;

    constructor(app) {
        this.app = app;
        this.buildVehicles();

        this.buildTempBuildings();
        this.buildGround();
        this.buildWorldSphere();
        this.buildPlayers();
    }

    get vehicles() {
        return this.allVehicles;
    }

    buildPlayers() {
        this.initialObjectData.push({
            objectName: 'player_0001',
            x: 20,
            y: 2.5,
            z: 50
        });
    }

    buildVehicles() {
        this.initialObjectData.push({
            objectName: 'trailer_0001',
            x: 75,
            y: 3,
            z: 220
        });
        this.initialObjectData.push({
            objectName: 'truck_0001',
            x: -10,
            y: 2,
            z: 20
        });
        this.initialObjectData.push({
            objectName: 'car_0001',
            x: 20,
            y: 2.5,
            z: 20
        });
    }

    buildTempBuildings() {
        let availableBuildingMeshes = [
            'building_0000000000000001',
            'building_0000000000000002',
            'building_0000000000000003',
            'building_0000000000000004'
        ];

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                this.initialObjectData.push({
                    objectName: 'building_000000000000000' + ((i ^ j + 2) % 4 + 1),
                    x: i * 300 - 500,
                    y: 0,
                    z: j * 250 + 1000
                });
            }
        }
    }

    buildGround() {
        this.initialObjectData.push({
            objectName: 'ground_0001',
            x: -200,
            y: 0,
            z: 1250
        });


        // for (let i = 0; i < 20; i++) {
        //     for (let j = 0; j < 20; j++) {
        //         this.initialObjectData.push({
        //             objectName: 'palm_tree_0001',
        //             x: (Math.random() - 0.5) * 2000,
        //             y: 0,
        //             z: (Math.random() - 0.5) * 2000 + 1000,
        //             rotateY: (Math.random() - 0.5) * Math.PI
        //         });
        //     }
        // }
    }

    buildWorldSphere() {
        this.initialObjectData.push({
            objectName: 'world_sphere_0001',
            x: 0,
            y: 0,
            z: 0,
        });
    }

    async load() {
        const app = this.app;
        await new Promise((resolve) => {
            let numLoaded = 0;
            setTimeout(() => {
                this.initialObjectData.forEach(async (parameters) => {
                    const { objectName, x, y, z } = parameters;
                    const babylonPackedObjectReader = new BabylonPackedObjectReader(
                        app.scene, `${document.baseURI}objects/${objectName}`
                    );

                    const dynamicObject = await babylonPackedObjectReader.load() as any;
                    const model = dynamicObject.model;
                    const manifest = dynamicObject.manifest;
                    const isStaticObject = manifest.isStaticObject ?? true;

                    model.position.scaleInPlace(0);

                    if (model.parent) {
                        model.parent = null;
                    }
                    if (manifest.isMainPlayer) {
                        app.player = new ActivePlayer(app, dynamicObject);

                        dynamicObject.poseModel.parent.parent = model;
                    }

                    model.position.x += x;
                    model.position.y += y;
                    model.position.z += z;

                    if (manifest.hasCollisions) {
                        makeCollisions(dynamicObject, app.scene);
                    }

                    if (manifest.isVehicle) {
                        this.allVehicles.push(new Vehicle(app, dynamicObject));
                    }
                    if (parameters.rotateY) {
                        model.rotation.y = parameters.rotateY;
                    }

                    if (manifest.isPlayer) {
                        this.app.player.model = model;
                        this.app.player.dynamicObject = dynamicObject;
                    }

                    if (!isStaticObject) {
                        this.allDynamicObjects.push(dynamicObject);
                    }
                    numLoaded++;
                    if (numLoaded === this.initialObjectData.length) {
                        resolve();
                    }
                },  3000 * Math.random());
            });
        });
    }
}
