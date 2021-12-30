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
        const { manifest } = dynamicObject;
        this.isStaticObject = manifest.isStaticObject ?? true;

        const mass = this.isStaticObject ? 0 : dynamicObject.manifest.mass || 1;
        const restitution = dynamicObject.manifest.restitution || 0.0;
        const friction = dynamicObject.manifest.friction;
        const physicsModel = dynamicObject.physicsModel;

        this.buildBoxImpostor({physicsModel, mass, restitution, friction, manifest});
    }

    private buildBoxImpostor({physicsModel, mass, restitution, friction, manifest}) {
        let impostorType = BABYLON.PhysicsImpostor.BoxImpostor;

        if (manifest.meshImpostor) {
            impostorType = BABYLON.PhysicsImpostor.MeshImpostor;
        }

        physicsModel.physicsImpostor = new BABYLON.PhysicsImpostor(
            physicsModel,
            impostorType,
            {
                mass,
                restitution,
                friction,
                nativeOptions: {
                    move: mass !== 0,
                    canSleep: false
                },
            },
            this.scene
        );
    }
}
