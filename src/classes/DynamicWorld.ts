import BabylonPackedObjectReader from './BabylonPackedObjectReader';

export default class DynamicWorld {
    scene: BABYLON.Scene;
    visibleObjects: [] = [];

    constructor(scene) {
        this.scene = scene;
        this.buildTempBuildings();
        this.buildGround();
        this.buildWorldSphere();
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
                this.visibleObjects.push({
                    objectName: 'building_000000000000000' + ((i ^ j + 2) % 4 + 1),
                    x: i * 300 - 500,
                    y: 0,
                    z: j * 250 + 1000
                });
            }
        }
    }

    buildGround() {
        this.visibleObjects.push({
            objectName: 'ground_0001',
            x: -200,
            y: 0,
            z: 1250
        });


        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                this.visibleObjects.push({
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
        this.visibleObjects.push({
            objectName: 'world_sphere_0001',
            x: 0,
            y: 0,
            z: 0,
        });
    }

    async load() {
        setTimeout(() => {
            this.visibleObjects.forEach(async (parameters) => {
                const { objectName, x, y, z } = parameters;
                const babylonPackedObjectReader = new BabylonPackedObjectReader(
                    this.scene, `${document.baseURI}objects/${objectName}`
                );
                const obj = await babylonPackedObjectReader.load();
                obj.name = objectName + Math.random();

                obj.position.x = x;
                obj.position.y = y;
                obj.position.z = z;

                if (parameters.rotateY) {
                    obj.rotationQuaternion = null;
                    obj.rotation.y = parameters.rotateY;
                }

            },  30000 * Math.random());
        });
    }
}
