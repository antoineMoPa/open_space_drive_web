import * as BABYLON from 'babylonjs';
import DynamicObject from './DynamicObject';

export default function makeCollisions(dynamicObject: any, scene: BABYLON.Scene) {
    dynamicObject.collisionObject = new CollisionObject(dynamicObject, scene);
}

export class CollisionObject {
    public dynamicObject: DynamicObject;
    private isStaticObject: boolean = false;
    private scene: BABYLON.Scene;

    constructor(dynamicObject: DynamicObject, scene: BABYLON.Scene) {
        this.scene = scene;
        this.dynamicObject = dynamicObject;
        this.isStaticObject = dynamicObject.manifest.isStaticObject ?? true;

        const mass = this.isStaticObject ? 0 : dynamicObject.manifest.mass || 1;
        const restitution = dynamicObject.manifest.restitution || 0.0;
        const friction = dynamicObject.manifest.friction;
        const physicsModel = dynamicObject.physicsModel;
        const data = {physicsModel, mass, restitution, friction};

        this.buildBoxImpostor(data);
    }

    private buildBoxImpostor({physicsModel, mass, restitution, friction}) {
        physicsModel.physicsImpostor = new BABYLON.PhysicsImpostor(
            physicsModel,
            BABYLON.PhysicsImpostor.BoxImpostor,
            {
                mass,
                restitution,
                friction,
                nativeOptions: {
                    move: true,
                    canSleep: mass === 0
                }

            },
            this.scene
        );
    }
}
