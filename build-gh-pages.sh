#!/bin/bash

git checkout -b gh-pages
git switch main

git branch -D gh-pages &&\
    yarn install &&\
    yarn run build && \
    git checkout --orphan gh-pages &&\
    touch .nojekyll &&\
    git add .nojekyll &&\
    git add -f dist/* &&\
    git mv -f dist/* . && \
    git commit -m "deploy";

git switch -f main;
