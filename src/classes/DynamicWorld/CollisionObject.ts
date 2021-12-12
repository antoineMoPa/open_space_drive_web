import * as BABYLON from 'babylonjs';
import DynamicObject from './DynamicObject';

export default function makeCollisions(dynamicObject: any, scene: BABYLON.Scene, options: any = {}) {
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

        const mass = this.isStaticObject ? 0 : dynamicObject.manifest.mass || 1;
        const restitution = dynamicObject.manifest.restitution || 0.0;
        const friction = dynamicObject.manifest.friction || 0.9;
        const physicsModel = dynamicObject.physicsModel;
        const data = {physicsModel, mass, restitution, friction};

        if (dynamicObject.manifest.isVehicle) {
            this.buildVehicleImpostor(data);
        } else {
            this.buildBoxImpostor(data);
        }
    }

    buildVehicleImpostor({physicsModel, mass, restitution, friction}) {
        const size = 2.0;

        const boundingInfo = physicsModel.getBoundingInfo();
        const max = boundingInfo.boundingBox.maximum;
        const min = boundingInfo.boundingBox.minimum;
        const halfDimensions = max.subtract(min).scale(0.5);
        const centerOfMass = boundingInfo.boundingBox.center.add(physicsModel.getAbsolutePosition());

        const pos_x = halfDimensions.x;
        const pos_y = halfDimensions.y;
        const pos_z = halfDimensions.z;

        const vertexBoxPositions = [
            new BABYLON.Vector3(0,0,0),
            new BABYLON.Vector3(pos_x, -pos_y, pos_z),
            new BABYLON.Vector3(pos_x, -pos_y, -pos_z),
            new BABYLON.Vector3(-pos_x, -pos_y, pos_z),
            new BABYLON.Vector3(-pos_x, -pos_y, -pos_z),
            new BABYLON.Vector3(pos_x, pos_y, pos_z),
            new BABYLON.Vector3(pos_x, pos_y, -pos_z),
            new BABYLON.Vector3(-pos_x, pos_y, pos_z),
            new BABYLON.Vector3(-pos_x, pos_y, -pos_z)
        ];

        const childMeshes = vertexBoxPositions.map(position => {
            const cornerMesh = BABYLON.MeshBuilder.CreateBox("cornerMesh", {size}, this.scene);
            cornerMesh.isVisible = false;
            return cornerMesh;
        });

        childMeshes.forEach(mesh => {
            physicsModel.addChild(mesh);
        });

        childMeshes.forEach(cornerMesh => {
            cornerMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                cornerMesh,
                BABYLON.PhysicsImpostor.SphereImpostor,
                {
                    mass: 0,
                },
                this.scene
            );
        });
        childMeshes.forEach((mesh, index) => {
            mesh.position.addInPlace(centerOfMass.add(vertexBoxPositions[index]));
        });

        physicsModel.physicsImpostor = new BABYLON.PhysicsImpostor(
            physicsModel,
            BABYLON.PhysicsImpostor.NoImpostor,
            {
                mass,
                restitution,
                friction
            },
            this.scene
        );

    }

    private buildBoxImpostor({physicsModel, mass, restitution, friction}) {
        physicsModel.physicsImpostor = new BABYLON.PhysicsImpostor(
            physicsModel,
            BABYLON.PhysicsImpostor.BoxImpostor,
            {
                mass: mass,
                restitution,
            },
            this.scene
        );
    }
}
