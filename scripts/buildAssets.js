const fs = require('fs');

fs.readdir('./public/objects', function (_, files) {
    files.forEach(async function (folder) {
        if (!fs.statSync('./public/objects/' + folder).isDirectory()) {
            return;
        }

        const objectFiles = await fs.readdirSync('./public/objects/' + folder);
        const hasCustomShader = objectFiles.indexOf('vertex.glsl') > -1 && objectFiles.indexOf('fragment.glsl') > -1;
        const hasCollisions = objectFiles.indexOf('.collide') > -1;

        const objectManifest = {
            hasCustomShader,
            hasCollisions
        };

        const objectManifestText = JSON.stringify(objectManifest);
        fs.writeFileSync('./public/objects/' + folder + '/manifest.json', objectManifestText);
    });

    const manifest = {
        objects: files,
    };
    const manifestText = JSON.stringify(manifest);
    fs.writeFileSync('./public/objects/manifest.json', manifestText);
});
