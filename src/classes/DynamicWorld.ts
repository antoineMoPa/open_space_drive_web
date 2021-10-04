import BabylonPackedObjectReader from './BabylonPackedObjectReader';

export default class DynamicWorld {
    scene: BABYLON.Scene;
    visibleObjects: [] = [];

    constructor(scene) {
        this.scene = scene;
        this.buildTempBuildings();
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
                    objectName: 'building_000000000000000' + ((i ^ j )% 5 + 1),
                    x: i * 300 - 500,
                    y: -83,
                    z: j * 250 + 1000
                });
            }
        }
    }

    async load() {
        setTimeout(() => {
            this.visibleObjects.forEach(async ({ objectName, x, y, z }) => {
                const babylonPackedObjectReader = new BabylonPackedObjectReader(
                    this.scene, `/objects/${objectName}`
                );
                const obj = await babylonPackedObjectReader.load();
                obj.name = objectName + Math.random();
                obj.position.x = x;
                obj.position.y = y;
                obj.position.z = z;
            },  30000 * Math.random());
        });
    }
}
