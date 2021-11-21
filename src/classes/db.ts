export default class DB {
    static async db() {
        if (!(window as any)._osdDB) {
            const sqlPromise = await (window as any).initSqlJs({
                locateFile: file => `./node_modules/sql.js/dist/${file}`
            });

            const dataPromise = fetch("osd.sqlite").then(res => res.arrayBuffer());
            const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
            const db = new SQL.Database(new Uint8Array(buf));

            (window as any)._osdDB = db;
        }

        return (window as any)._osdDB;
    }
}
