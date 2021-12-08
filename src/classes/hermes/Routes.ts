import * as BABYLON from 'babylonjs';
import Hermes from './Hermes';
import * as CANNON from 'cannon';

export default class Routes {
    protected hermes: Hermes = null;
    private customMeshes: BABYLON.Mesh[] = [];
    private lastDrawnRouteId = 0;

    constructor(hermes: Hermes) {
        this.hermes = hermes;
        this.update();
    }

    buildRoadSegment(point1, point2, { id, has_left_wall, has_right_wall }): BABYLON.Mesh[] {
        const {up, p, forward, right} = (point1);
        const p2Up = point2.up;
        const p2Forward = point2.forward;
        const p2Right = point2.right;
        const p2 = point2.p;

        const scene = this.hermes.app.scene;
        let meshes = [];
        let physicsShapes = [];
        const roadMaterial = new BABYLON.StandardMaterial("road", scene);

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

        // Builds an array of shapes to build (road + walls)
        const getRoadProfile = ({p, up, forward, right}) => {
            let shapes = [];
            const road_width = 40;
            const road_height = 1.5;
            const fence_width = 1.0;
            const fence_height = 5.0;

            const p3 = p.add(right.scale(-road_width/2).add(up.scale(road_height/2)));
            const p4 = p3.add(right.scale(road_width));
            const p5 = p3.add(up.scale(-road_height));
            const p6 = p5.add(right.scale(road_width));
            const p8 = p3.add(up.scale(fence_height));
            const p9 = p8.add(right.scale(fence_width));
            const p7 = p3.add(right.scale(fence_width));
            const p10 = p4.add(right.scale(-fence_width));
            const p12 = p4.add(up.scale(fence_height));
            const p11 = p10.add(up.scale(fence_height));

            const roadShape = [p3, p4, p6, p5];
            shapes.push([roadShape]);

            if (has_left_wall) {
                const wall_shape = [p3, p8, p9, p7];
                shapes.push([wall_shape]);
            }

            if (has_right_wall) {
                const wall_shape = [p10, p11, p12, p4];
                shapes.push([wall_shape]);
            }

            return shapes;
        }

        const bodies1 = getRoadProfile({p, forward, right, up});
        const bodies2 = getRoadProfile({p: p2, forward: p2Forward, right: p2Right, up: p2Up});

        bodies1.forEach((_, index) => {
            let offset = 0;
            const shape1 = bodies1[index];
            const shape2 = bodies2[index];

            if (shape1.length !== shape2.length) {
                throw new Error('Shape number must be equal!');
            }

            for (let i = 0; i < shape1.length; i++) {
                const previousOffset = offset;
                const points1 = shape1[i];
                const points2 = shape2[i];
                const shapeVertices = [];
                const shapeFaceIndices = [];

                if (points1.length !== points2.length) {
                    throw new Error('Vertices number must be equal!');
                }

                points1.forEach(point => {
                    shapeVertices.push(point.x, point.y, point.z);
                    offset += 1;
                });

                points2.forEach(point => {
                    shapeVertices.push(point.x, point.y, point.z);
                    offset += 1;
                });

                const l = points1.length;
                for (let j = 0; j < l - 1; j++) {
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
                        j,
                        j + 1 + l,
                        j + l,
                        j,
                        j + 1,
                        j + 1 + l,
                    ];

                    shapeFaceIndices.push(...face.map(i => i + previousOffset));
                }

                const vertexData = new BABYLON.VertexData();
                vertexData.positions = shapeVertices;
                vertexData.indices = shapeFaceIndices;
                const mesh = new BABYLON.Mesh('road_' + id + '_' + index, scene);
                vertexData.applyToMesh(mesh);

                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                    mesh, BABYLON.PhysicsImpostor.ConvexHullImpostor,
                    { mass: 0, restitution: 0, friction: 0.1 }, scene);

                mesh.material = roadMaterial;
                meshes.push(mesh);
            }
        });

        this.lastDrawnRouteId = id;

        return meshes;
    }

    clear() {
        const db = this.hermes.db;
        let results = db.exec("DELETE FROM road_segment; DELETE FROM road_point;");
        this.customMeshes.forEach(mesh => {
            mesh.dispose();
        });
        this.customMeshes = [];
    }

    getSegments() {
        const db = this.hermes.db;
        const start = this.lastDrawnRouteId;

        let roadResults = db.exec(`SELECT id, point_1, point_2 FROM road_segment WHERE id > ${start - 1} ORDER BY id`);

        if (!roadResults[0]) {
            return [];
        }

        return roadResults[0].values;
    }

    getPoints() {
        const db = this.hermes.db;

        let pointsResults = db.exec(`SELECT id,x,y,z,upX,upY,upZ,forwardX,forwardY,forwardZ FROM road_point ORDER BY id`);

        if (!pointsResults[0]) {
            return [];
        }

        return pointsResults[0].values;
    }

    getSegmentsAndPoints() {
        const db = this.hermes.db;

        let pointsResults = db.exec(
            `
SELECT
    road_segment.id,
    point_1.x as x1,
    point_1.y as y1,
    point_1.z as z1,
    point_1.upX as up1X,
    point_1.upY as up1Y,
    point_1.upZ as up1Z,
    point_1.forwardX as forward1X,
    point_1.forwardY as forward1Y,
    point_1.forwardZ as forward1Z,
    point_2.x as x2,
    point_2.y as y2,
    point_2.z as z2,
    point_2.upX as up2X,
    point_2.upY as up2Y,
    point_2.upZ as up2Z,
    point_2.forwardX as forward2X,
    point_2.forwardY as forward2Y,
    point_2.forwardZ as forward2Z,
    road_segment.has_left_wall as has_left_wall,
    road_segment.has_right_wall as has_right_wall
FROM
    road_segment
INNER JOIN
    road_point as point_1,
    road_point as point_2
ON road_segment.point_1 = point_1.id
AND  road_segment.point_2 = point_2.id
WHERE road_segment.id > ${this.lastDrawnRouteId}`);

        if (!pointsResults[0]) {
            return [];
        }

        return pointsResults[0].values;
    }


    update() {
        const segmentsAndPoints = this.getSegmentsAndPoints();

        segmentsAndPoints.forEach((row) => {
            const [
                id,
                x1,
                y1,
                z1,
                up1X,
                up1Y,
                up1Z,
                forward1X,
                forward1Y,
                forward1Z,
                x2,
                y2,
                z2,
                up2X,
                up2Y,
                up2Z,
                forward2X,
                forward2Y,
                forward2Z,
                has_left_wall,
                has_right_wall,
            ] = row;

            const p1 = new BABYLON.Vector3(x1, y1, z1);
            const up1 = new BABYLON.Vector3(up1X,  up1Y, up1Z);
            const forward1 = new BABYLON.Vector3(forward1X,  forward1Y, forward1Z);
            const right1 = forward1.cross(up1).normalize();
            const p2 = new BABYLON.Vector3(x2, y2, z2);
            const up2 = new BABYLON.Vector3(up2X,  up2Y, up2Z);
            const forward2 = new BABYLON.Vector3(forward2X,  forward2Y, forward2Z);
            const right2 = forward2.cross(up2).normalize();

            const meshes = this.buildRoadSegment(
                {up: up1, p: p1, forward: forward1, right: right1},
                {up: up2, p: p2, forward: forward2, right: right2},
                {id, has_left_wall, has_right_wall}
            );
            this.customMeshes.push(...meshes);
        });
    };

    /**
     * Adds a point to road_point table.
     * returns the added point id.
     */
    addPoint({point, up, forward}): number {
        const db = this.hermes.db;
        const fieldMap = {
            'x': point.x,
            'y': point.y,
            'z': point.z,
            'upX': up.x,
            'upY': up.y,
            'upZ': up.z,
            'forwardX': forward.x,
            'forwardY': forward.y,
            'forwardZ': forward.z,
        };
        const fields = Object.keys(fieldMap);
        const values = Object.keys(fieldMap).map(key => fieldMap[key]);
        let stmt = db.exec(
            `INSERT INTO road_point (${fields.join(',')}) VALUES (${values.join(',')})`
        );

        let results = db.exec(`SELECT id FROM road_point ORDER BY id DESC LIMIT 1`);

        return results[0].values[0][0];
    }

    addSegment({point1ID, point2ID, has_left_wall, has_right_wall}) {
        const db = this.hermes.db;
        let stmt = db.exec(
            `INSERT INTO road_segment (point_1, point_2, has_left_wall, has_right_wall) VALUES (${point1ID}, ${point2ID}, ${has_left_wall}, ${has_right_wall})`
        );
        this.update();
    }
}
