import DB from '../db';

export default class Hermes {
    db: DB;
    constructor() {
        this.init();
    }

    async init() {
        this.db = await DB.db();

        this.db.exec("SELECT * FROM road_segment");
    }
}
