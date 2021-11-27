import * as BABYLON from 'babylonjs';
import Hermes from './Hermes';

export default class Routes {
    protected hermes: Hermes = null;
    private customMeshes: BABYLON.Mesh[] = [];
    private lastDrawnRouteId = 0;

    constructor(hermes: Hermes) {
        this.hermes = hermes;
        this.update();
    }

    buildRoadSegment(specs, nextSpecs): BABYLON.Mesh[] {
        const {up, p1, forward, right} = (specs);
        const nextUp = nextSpecs.up;
        const nextForward = nextSpecs.forward;
        const nextRight = nextSpecs.right;
        const p2 = nextSpecs.p1;

        const scene = this.hermes.app.scene;
        const lineMesh = new BABYLON.Mesh("road", scene);
        const lineMaterial = new BABYLON.StandardMaterial("road", scene);
        // lineMaterial.wireframe = true;
        lineMesh.material = lineMaterial;


        //
        //                |------------ fence width  -------------|
        //
        //                |-| fence width
        //            p8   _  p9              ^ up           p11 _ p12     _
        //                | |                 |                 | |        | fence height
        //            p3  |_|________________________________p10|_|  p4    _
        //                |  p7               . p1  ----> right   |        | road height
        //            p5  |_______________________________________|  p6    _
        //
        //    TODO, implement the shape above, both blocks at the side removable with an option
        //    (this will facilitate makin highway exits)

        const getRoadProfile = ({p1, up, forward, right}) => {
            const road_width = 10;
            const road_height = 4;
            const fence_width = 2;
            const fence_height = 6;

            const p3 = p1.add(right.scale(-road_width/2).add(up.scale(road_height/2)));
            const p4 = p3.add(right.scale(road_width));
            const p5 = p3.add(up.scale(-road_height));
            const p6 = p5.add(right.scale(road_width));
            const p8 = p3.add(up.scale(fence_height));
            const p9 = p8.add(right.scale(fence_width));
            const p7 = p3.add(right.scale(fence_width));
            const p10 = p4.add(right.scale(-fence_width));
            const p12 = p4.add(up.scale(fence_height));
            const p11 = p10.add(up.scale(fence_height));

            return [p3, p4, p6, p5, p3, p3];
        }

        const vertexData = new BABYLON.VertexData();

        const points1 = getRoadProfile({p1, forward, right, up});
        const points2 = getRoadProfile({p1: p2, forward: nextForward, right: nextRight, up: nextUp});
        const positions = [];

        if (points1.length !== points2.length) {
            throw new Error('Vertices number must be equal!');
        }

        points1.forEach(point => {
            positions.push(point.x, point.y, point.z);
        });

        points2.forEach(point => {
            positions.push(point.x, point.y, point.z);
        });

        let indices = [];
        const l = points1.length;
        for (let i = 0; i < l - 1; i++) {
            // Build a face by connecting the current profile with ne next one
            //
            //  i + l +--+  i + 1 + l     next profile
            //        |  |
            //        |  |
            //        |  |
            //        |  |
            //        |  |
            //        |  |
            //  i     +--+   i + 1       current profile

            const face = [
                i,
                i + 1 + l,
                i + l,
                i,
                i + 1,
                i + 1 + l
            ];

            indices.push(...face);
        }

        vertexData.positions = positions;
        vertexData.indices = indices;

        vertexData.applyToMesh(lineMesh);

        return [lineMesh];
    }

    deleteAll() {
        const db = this.hermes.db;
        let results = db.exec("DELETE FROM old_road_segment; DELETE FROM road_segment; DELETE FROM road_points;");
        this.update();
    }

    update() {
        const db = this.hermes.db;
        const start = this.lastDrawnRouteId;
        let results = db.exec(`SELECT x1,y1,z1,x2,y2,z2,upX,upY,upZ,id FROM old_road_segment WHERE id > ${start - 1} ORDER BY id`);

        if (!results[0]) {
            return;
        }

        let allSpecs = [];

        results[0].values.forEach((row) => {
            const positions = [];
            const indices = [];

            const [x1, y1, z1, x2, y2, z2, upX, upY, upZ, id] = row;
            const up = new BABYLON.Vector3(upX,  upY, upZ);
            const p1 = new BABYLON.Vector3(x1, y1, z1);
            const p2 = new BABYLON.Vector3(x2, y2, z2);
            const forward = p2.subtract(p1);
            const right = up.cross(forward).normalize();

            allSpecs.push({p1, p2, forward, up, right, id});
        });

        let previousSpecs = null;

        // If we ever need to destroy all current roads, this is how we would proceed:
        // this.customMeshes.forEach(mesh => mesh.dispose());
        this.customMeshes = [];

        allSpecs.forEach(specs => {
            if (previousSpecs) {
                previousSpecs.p2 = specs.p1;
                const mesh = this.buildRoadSegment(previousSpecs, specs);
                this.customMeshes.push(...mesh);
            }
            previousSpecs = specs;
            this.lastDrawnRouteId = specs.id;
        })
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
            `INSERT INTO old_road_segment (${fields.join(',')}) VALUES (${values.join(',')})`
        );
        this.update();
    }
}
