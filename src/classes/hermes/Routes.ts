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

    buildRoadSegment(point1, point2, { has_left_wall, has_right_wall }): BABYLON.Mesh[] {
        const {up, p, forward, right} = (point1);
        const p2Up = point2.up;
        const p2Forward = point2.forward;
        const p2Right = point2.right;
        const p2 = point2.p;

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

        const getRoadProfile = ({p, up, forward, right}) => {
            const road_width = 20;
            const road_height = 1;
            const fence_width = 0.6;
            const fence_height = 1.7;

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

            const shape = [p3];

            if (has_left_wall) {
                shape.push(p8, p9, p7)
            }

            if (false&&has_right_wall) {
                shape.push(p10, p11, p12)
            }

            shape.push(p4, p6, p5, p3, p3);

            return shape;
        }

        const vertexData = new BABYLON.VertexData();

        const points1 = getRoadProfile({p, forward, right, up});
        const points2 = getRoadProfile({p: p2, forward: p2Forward, right: p2Right, up: p2Up});
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
                i + 1 + l,
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
AND  road_segment.point_2 = point_2.id`);

        if (!pointsResults[0]) {
            return [];
        }

        return pointsResults[0].values;
    }


    update() {
        const segmentsAndPoints = this.getSegmentsAndPoints();

        segmentsAndPoints.forEach((row) => {
            const [
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

            const mesh = this.buildRoadSegment(
                {up: up1, p: p1, forward: forward1, right: right1},
                {up: up2, p: p2, forward: forward2, right: right2},
                {has_left_wall, has_right_wall}
            );
            this.customMeshes.push(...mesh);
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
