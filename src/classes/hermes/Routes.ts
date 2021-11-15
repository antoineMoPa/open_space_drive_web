import Hermes from './Hermes';

export default class Routes {
    protected hermes: Hermes = null;

    constructor(hermes: Hermes) {
        this.hermes = hermes;
        this.update();
    }

    update() {
        const db = this.hermes.db;
        let results = db.exec("SELECT x1,y1,z1,x2,y2,z2 FROM road_segment");

        results[0].values.forEach((row) => {
            const [x1,y1,z1,x2,y2,z2] = row;
            console.log([x1,y1,z1,x2,y2,z2]);
        });
    };

    add({point1, point2}) {
        const db = this.hermes.db;
        let stmt = db.prepare(
            "INSERT INTO road_segment (x1,y1,z1,x2,y2,z2) VALUES ($x1,$y1,$z1,$x2,$y2,$z2)"
        );
        stmt.getAsObject({
            $x1: point1.x,
            $y1: point1.y,
            $z1: point1.z,
            $x2: point2.x,
            $y2: point2.y,
            $z2: point2.z,
        });
        this.update();
    }
}
