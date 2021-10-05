class URLFetchStringCache {
    private static resultMapByUrl = {};
    static async getUrl(url) {
        if (url in URLFetchStringCache.resultMapByUrl) {
            return URLFetchStringCache.resultMapByUrl[url];
        }
        URLFetchStringCache.resultMapByUrl[url] = new Promise(async (resolve) => {
            const result = await fetch(url);
            const text = await result.text();
            URLFetchStringCache.resultMapByUrl[url] = text;
            resolve(text);
        });

        return URLFetchStringCache.resultMapByUrl[url];
    }
}

export default class PackedObject {
    model;
    scene;
    watchedKeyCodes;
    #path;

    constructor(path) {
        this.#path = path;
    }

    async load() {
        const manifestText = await URLFetchStringCache.getUrl(this.#path + '/manifest.json');
        const manifest = JSON.parse(manifestText);

        let vertexShader = null;
        let fragmentShader = null;

        if (manifest.hasCustomShader) {
            const vertexFetchPromise = URLFetchStringCache.getUrl(this.#path + '/vertex.glsl');
            const fragmentFetchPromise = URLFetchStringCache.getUrl(this.#path + '/fragment.glsl');
            const result = await Promise.all([vertexFetchPromise, fragmentFetchPromise]);

            vertexShader = await result[0];
            fragmentShader = await result[1];
        }

        return {
            manifest,
            vertexShader,
            fragmentShader
        };
    }

    export() {
        // Eventual future
        // The idea would be to make objects with shaders and models which can be used
        // in other applications.
    }

    import() {
        // Eventual future
    }
}
