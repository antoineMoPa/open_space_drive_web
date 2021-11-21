import * as BABYLON from 'babylonjs';
import Hermes from './Hermes';

export default class Routes {
    protected hermes: Hermes = null;
    private customMeshes: BABYLON.Mesh[] = [];

    constructor(hermes: Hermes) {
        this.hermes = hermes;
        this.update();
    }

    buildRoadSegmentAndUpVectorLines({up, p1, forward, right}): BABYLON.Mesh[] {
        const scene = this.hermes.app.scene;
        const lineMesh = new BABYLON.Mesh("road", scene);
        const lineMaterial = new BABYLON.StandardMaterial("road", scene);
        lineMaterial.wireframe = true;
        lineMesh.material = lineMaterial;

        const vertexData = new BABYLON.VertexData();
        vertexData.positions = [p1.x, p1.y, p1.z,
                                p1.x + forward.x, p1.y + forward.y, p1.z + forward.z,
                                p1.x, p1.y, p1.z,
                                p1.x + up.x, p1.y + up.y, p1.z + up.z,
                                p1.x, p1.y, p1.z,
                                p1.x + right.x, p1.y + right.y, p1.z + right.z];
        vertexData.indices = [0, 1, 2, 3, 4, 5];
        vertexData.applyToMesh(lineMesh);

        return [lineMesh];
    }

    buildRoadSegment({up, p1, forward, right}): BABYLON.Mesh[] {
        const scene = this.hermes.app.scene;
        const lineMesh = new BABYLON.Mesh("road", scene);
        const lineMaterial = new BABYLON.StandardMaterial("road", scene);
        lineMaterial.wireframe = true;
        lineMesh.material = lineMaterial;


        //    _                  ^ up               _
        //   | |                 |                 | |
        //   |_|___________________________________|_|
        //   |                   . p1  ----> right   |
        //   |_______________________________________|
        //
        //    TODO, implement the shape above, both blocks at the side removable with an option
        //    (this will facilitate makin highway exits)


        const vertexData = new BABYLON.VertexData();
        vertexData.positions = [p1.x, p1.y, p1.z,
                                p1.x + forward.x, p1.y + forward.y, p1.z + forward.z,
                                p1.x, p1.y, p1.z,
                                p1.x + up.x, p1.y + up.y, p1.z + up.z,
                                p1.x, p1.y, p1.z,
                                p1.x + right.x, p1.y + right.y, p1.z + right.z];
        vertexData.indices = [0, 1, 2, 3, 4, 5];
        vertexData.applyToMesh(lineMesh);

        return [lineMesh];
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
        this.customMeshes.forEach(mesh => mesh.dispose());
        this.customMeshes = [];

        let offset = 0;

        if (!results[0]) {
            return;
        }

        results[0].values.forEach((row) => {
            const positions = [];
            const indices = [];

            const [x1,y1,z1,x2,y2,z2,upX,upY,upZ] = row;
            const up = new BABYLON.Vector3(upX, upY, upZ);
            const p1 = new BABYLON.Vector3(x1, y1, z1);
            const p2 = new BABYLON.Vector3(x2, y2, z2);
            const forward = p2.subtract(p1);
            const right = up.cross(forward).normalize();

            const mesh = this.buildRoadSegment({up, p1, forward, right});
            const lines = this.buildRoadSegmentAndUpVectorLines({up, p1, forward, right});

            this.customMeshes.push(...mesh, ...mesh);
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
