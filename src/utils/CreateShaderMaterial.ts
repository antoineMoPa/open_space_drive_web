import * as BABYLON from 'babylonjs';
import URLFetchStringCached from './UrlFetchStringCached';

export default async function CreateShaderMaterial(name: string, path: string, scene: BABYLON.Scene) {
    const vertexShader = await URLFetchStringCached.getUrl(`${path}Vertex.glsl`);
    const fragmentShader = await URLFetchStringCached.getUrl(`${path}Fragment.glsl`);

    if(!fragmentShader || !vertexShader) {
        throw Error('Could not load shaders.');
    }

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
