import URLFetchStringCached from '../../utils/UrlFetchStringCached';

export default class PackedObject {
    model;
    scene;
    watchedKeyCodes;
    private path;

    constructor(path) {
        this.path = path;
    }

    async load() {
        const manifestText = await URLFetchStringCached.getUrl(this.path + '/manifest.json');
        const manifest = JSON.parse(manifestText);

        if (!manifest) {
            console.error('Invalid manifest');
        }

        let vertexShader = null;
        let fragmentShader = null;

        if (manifest.hasCustomShader) {
            const vertexFetchPromise = URLFetchStringCached.getUrl(this.path + '/vertex.glsl');
            const fragmentFetchPromise = URLFetchStringCached.getUrl(this.path + '/fragment.glsl');
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
