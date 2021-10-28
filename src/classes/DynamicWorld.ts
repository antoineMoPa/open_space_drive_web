import BabylonPackedObjectReader from './BabylonPackedObjectReader';
import OSDApp from './OSDApp';
import makeCollisions from './CollisionObject.ts';

export default class DynamicWorld {
    scene: BABYLON.Scene;
    initialObjectData: [] = [];
    allDynamicObjects:[] = [];

    constructor(scene) {
        this.scene = scene;
        this.scene.dynamicWorld = this;
        this.buildVehicles();
        this.buildTempBuildings();
        this.buildGround();
        this.buildWorldSphere();
    }

    buildVehicles(app) {
        this.initialObjectData.push({
            objectName: 'trailer_0001',
            x: 0,
            y: 10,
            z: 40
        });
        this.initialObjectData.push({
            objectName: 'truck_0001',
            x: 0,
            y: 0,
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


        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                this.initialObjectData.push({
                    objectName: 'palm_tree_0001',
                    x: (Math.random() - 0.5) * 2000,
                    y: 0,
                    z: (Math.random() - 0.5) * 2000 + 1000,
                    rotateY: (Math.random() - 0.5) * Math.PI
                });
            }
        }
    }

    buildWorldSphere() {
        this.initialObjectData.push({
            objectName: 'world_sphere_0001',
            x: 0,
            y: 0,
            z: 0,
        });
    }

    async load(osdApp: OSDApp) {
        setTimeout(() => {
            this.initialObjectData.forEach(async (parameters) => {
                const { objectName, x, y, z } = parameters;
                const babylonPackedObjectReader = new BabylonPackedObjectReader(
                    this.scene, `${document.baseURI}objects/${objectName}`
                );
                const dynamicObject = await babylonPackedObjectReader.load();
                const model = dynamicObject.model;
                const manifest = dynamicObject.manifest;
                const isStaticObject = manifest.isStaticObject ?? true;


                if (model.parent) {
                    model.parent = null;
                }

                if (manifest.hasCollisions) {
                    makeCollisions(dynamicObject, this.scene);
                }

                if (manifest.isPlayerVehicle && manifest.isDefaultPlayerVehicle) {
                    osdApp.playerVehicle = dynamicObject;
                }

                model.position.x += x;
                model.position.y += y;
                model.position.z += z;

                if (parameters.rotateY) {
                    model.rotation.y = parameters.rotateY;
                }

                if (!isStaticObject) {
                    this.allDynamicObjects.push(dynamicObject);
                }
            },  30000 * Math.random());
        });
    }
}
