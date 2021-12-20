import { Scene } from "@babylonjs/core/scene";
import URLFetchStringCached from './URLFetchStringCached';

export const CreateShaderMaterial = async (name: string, path: string, scene: Scene) => {
    const vertexShader = await URLFetchStringCached.getUrl(`${path}Vertex.glsl`);
    const fragmentShader = await URLFetchStringCached.getUrl(`${path}Fragment.glsl`);
    BABYLON.Effect.ShadersStore[name + 'VertexShader'] = vertexShader;
    BABYLON.Effect.ShadersStore[name + 'FragmentShader'] = fragmentShader;

    return new BABYLON.ShaderMaterial(
        name,
        scene,
        {
            vertex: name,
            fragment: name,
        },
        {
            attributes: ['position', 'normal', 'uv'],
            uniforms: [
                'world', 'worldView', 'worldViewProjection', 'view',
                'projection'
            ],
        },
    );
}
