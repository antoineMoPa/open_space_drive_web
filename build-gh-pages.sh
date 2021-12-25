#!/bin/bash

# Create branch if not exists to make sure deletion step works
git checkout -b gh-pages
git switch main

git branch -D gh-pages &&\
    yarn install &&\
    yarn run build --base=/open_space_drive_web/ && \
    git checkout --orphan gh-pages &&\
    touch .nojekyll &&\
    git add .nojekyll &&\
    git add -f dist/* &&\
    git add -f node_modules/ammo.js/builds/ammo.js &&\
    git add -f node_modules/sql.js/dist/sql-wasm.* &&\
    git mv -f dist/* . && \
    git commit -m "deploy";

git push origin gh-pages --force

git switch -f main;
