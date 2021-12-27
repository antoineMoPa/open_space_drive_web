const fs = require('fs');

fs.readdir('./public/objects', function (_, files) {
    const manifest = {
        objects: files,
    };
    const manifestText = JSON.stringify(manifest);
    fs.writeFileSync('./public/objects/manifest.json', manifestText);
});
