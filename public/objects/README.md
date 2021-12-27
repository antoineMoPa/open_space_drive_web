We use a system to manage assets so that they can be loaded in the 3d world.

# Adding or modifying a new object

Be sure to have the object in the blend file with the same name as the folder. As an example,
if the folder is `tree_0001`, the object in blender should also be called `tree_0001`. The name of the blend file does not matter but we use model.blend as a convention.

Once you have proper naming, use blender's export feature to export to glb (which is the binary version of gltf). The file name must be `model.glb`.

The last step is to run `yarn run assets:build` to update asset manifests.


# Optional: shader

You can have a custom set of shader. If you want to use this feature, you need to provide both.
The files must be named `fragment.glsl` and `vertex.glsl`.

Run `yarn run assets:build` after adding a shader, as this will change the manifest.
