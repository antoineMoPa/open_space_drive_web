import DB from '../db';
import Routes from './Routes';
import OSDApp from '../OSDApp';

/**
 * Hermes: Road maps & routing
 */
export default class Hermes {
    db: any = null;
    routes: Routes = null;
    app: OSDApp = null;

    constructor(app: OSDApp) {
        (window as any)._hermes = this;
        this.app = app;
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
