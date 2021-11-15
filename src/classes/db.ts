export default class DB {
    static async db() {
        if (!window._osdDB) {
            const sqlPromise = await initSqlJs({
                locateFile: file => `./node_modules/sql.js/dist/${file}`
            });

            const dataPromise = fetch("osd.sqlite").then(res => res.arrayBuffer());
            const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
            const db = new SQL.Database(new Uint8Array(buf));

            window._osdDB = db;
        }

        return window._osdDB;
    }
}
