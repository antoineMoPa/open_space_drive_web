import * as BABYLON from 'babylonjs';
import DynamicObject from './DynamicObject';

export default function makeCollisions(dynamicObject: any, scene: BABYLON.Scene, options: any = {}) {
    if (!dynamicObject.model) {
        throw new Error('dynamicObject.model should exist.');
    }
    dynamicObject.collisionObject = new CollisionObject(dynamicObject, scene, options);
}

export class CollisionObject {
    private dynamicObject: any;
    private isStaticObject: boolean = false;
    private scene: BABYLON.Scene;

    constructor(dynamicObject: DynamicObject, scene, options={}) {
        this.scene = scene;
        this.dynamicObject = dynamicObject;
        this.isStaticObject = dynamicObject.manifest.isStaticObject ?? true;

        const mass = this.isStaticObject ? 0 : 1;
        const restitution = dynamicObject.manifest.restitution || 0.1;
        const friction = dynamicObject.manifest.friction || 0.9;
        let model = this.dynamicObject.model;
        const children = model.getChildren();

        model.physicsImpostor = new BABYLON.PhysicsImpostor(
            model,
            BABYLON.PhysicsImpostor.BoxImpostor,
            {
                mass: mass,
                restitution,
            },
            this.scene
        );
    }
}
