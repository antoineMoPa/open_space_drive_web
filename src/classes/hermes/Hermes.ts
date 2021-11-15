import DB from '../db';
import Routes from './Routes';

/**
 * Hermes: Road maps & routing
 */
export default class Hermes {
    db: DB = null;
    routes: Routes = null;

    constructor() {
        window._hermes = this;
        this.init();
    }

    save() {
        const blob = new Blob([this.db.export()], {type: "application/x-sqlite3"});
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = "osd.sqlite";
        a.click();
    }

    async init() {
        this.db = await DB.db();
        this.routes = new Routes(this);
    }
}
