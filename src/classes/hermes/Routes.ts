import * as BABYLON from 'babylonjs';
import Hermes from './Hermes';

export default class Routes {
    protected hermes: Hermes = null;

    constructor(hermes: Hermes) {
        this.hermes = hermes;
        this.update();
    }

    buildRoadSegment({x1,y1,z1,x2,y2,z2}) {

    }

    deleteAll() {
        const db = this.hermes.db;
        let results = db.exec("DELETE FROM road_segment");
        this.update();
    }

    update() {
        const db = this.hermes.db;
        let results = db.exec("SELECT x1,y1,z1,x2,y2,z2,upX,upY,upZ FROM road_segment ORDER BY id");

        const scene = this.hermes.app.scene;
        const customMesh = new BABYLON.Mesh("road", scene);
        const roadMaterial = new BABYLON.StandardMaterial("road", scene);
        roadMaterial.wireframe = true;
        let offset = 0;

        if (!results[0]) {
            return;
        }

        results[0].values.forEach((row) => {
            const customMesh = new BABYLON.Mesh("road", scene);
            const positions = [];
            const indices = [];
            customMesh.material = roadMaterial;

            const [x1,y1,z1,x2,y2,z2,upX,upY,upZ] = row;
            const vertexData = new BABYLON.VertexData();
            vertexData.positions = [x1, y1, z1, x2, y2, z2,
                                    x1, y1, z1, x1 + upX, y1 + upY, z1 + upZ];
            vertexData.indices = [0, 1, 2, 3];
            vertexData.applyToMesh(customMesh);
        });
    };

    add({point1, point2, up}) {
        const db = this.hermes.db;
        const fieldMap = {
            'x1': point1.x,
            'y1': point1.y,
            'z1': point1.z,
            'x2': point2.x,
            'y2': point2.y,
            'z2': point2.z,
            'upX': up.x,
            'upY': up.y,
            'upZ': up.z
        };
        const fields = Object.keys(fieldMap);
        const values = Object.keys(fieldMap).map(key => fieldMap[key]);
        let stmt = db.exec(
            `INSERT INTO road_segment (${fields.join(',')}) VALUES (${values.join(',')})`
        );
        this.update();
    }
}
