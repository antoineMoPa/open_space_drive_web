import * as BABYLON from 'babylonjs';
import FrameUpdater from './FrameUpdater';

export default function makeCollisions(classInstance, options) {
    if (classInstance.velocity == undefined) {
        throw new Error('classInstance.velocity should exist.');
    }
    if (classInstance.model == undefined) {
        throw new Error('classInstance.model should exist.');
    }
    if (classInstance.model.position == undefined) {
        throw new Error('classInstance.model.position should exist.');
    }

    classInstance.collisionObject = new CollisionObject(classInstance, options);
}

const allCollisionObjects = [];

export class CollisionObject {
    private classInstance: any;
    private frameUpdaterCallbackID: string;
    private postFrameUpdaterCallbackID: string;
    private id: number;
    private boundingInfoUpdated: boolean = false;
    private cachedBounds: BABYLON.BoundingInfo|null = null;
    private _isStaticObject: boolean = false;
    private currentCollidingObjectIndices: number[] = [];
    private positionBeforeCollision: BABYLON.Vector3;

    constructor(_classInstance, options={}) {
        this.classInstance = _classInstance;
        this.frameUpdaterCallbackID = FrameUpdater.addUpdater(this.update.bind(this));
        this.postFrameUpdaterCallbackID = FrameUpdater.addUpdater(this.postFrameUpdate.bind(this), true);
        this.id = allCollisionObjects.length;

        if(options.staticObject) {
            this._isStaticObject = true;
        }

        allCollisionObjects.push(this);
    }

    get boundingInfo(): BABYLON.BoundingInfo | null {
        if (this.cachedBoundingBox !== null && this.boundingInfoUpdated) {
            return this.cachedBoundingBox;
        }
        if (!this.classInstance.model.getBoundingInfo) {
            this.cachedBoundingBox = this.childboundingInfo;
        } else {
            if (!this._isStaticObject) {
                this.model.refreshBoundingInfo();
            }
            this.cachedBoundingBox = this.classInstance.model.getBoundingInfo();
        }

        this.boundingInfoUpdated = true;
        return this.cachedBoundingBox;
    }

    get isStaticObject():boolean {
        return this._isStaticObject;
    }

    private get childboundingInfo(): BABYLON.BoundingInfo | null {
        let meshes = this.classInstance.model.getChildMeshes();

        if (meshes.length === 0) {
            return null;
        }

        let accumulator = meshes[0].getBoundingInfo();

        for(let i = 0; i < meshes.length; i++) {
            meshes[i].refreshBoundingInfo()
            let current = meshes[i].getBoundingInfo();
            let accumulatorMin = accumulator.minimum;
            let accumulatorMax = accumulator.maximum;

            let currentMin = current.minimum;
            let currentMax = current.maximum;

            let newMin = BABYLON.Vector3.Minimize(currentMin, accumulatorMin);
            let newMax = BABYLON.Vector3.Maximize(currentMax, accumulatorMax);

            accumulator = new BABYLON.BoundingInfo(newMin, newMax);
        }

        accumulator.update(this.classInstance.model.getWorldMatrix());
        return accumulator;
    }

    dispose() {
        allCollisionObjects[this.id] = null;
        FrameUpdater.removeUpdater(this.frameUpdaterCallbackID);
        FrameUpdater.removeUpdater(this.postFrameUpdaterCallbackID);
    }

    update({ scene }) {
        let boundingInfo = this.boundingInfo;

        if (!boundingInfo || this._isStaticObject) {
            return;
        }

        allCollisionObjects.forEach((collisionObject, index) => {
            if (index === this.id || !collisionObject.boundingInfo) {
                return;
            }
            const otherBoundingInfo = collisionObject.boundingInfo;
            const otherIndexInArray = this.currentCollidingObjectIndices.indexOf(index);

            if (boundingInfo.intersects(otherBoundingInfo)) {
                // Flip the object to the other direction
                // TODO Make this work
                this.classInstance.velocity.scaleInPlace(0.8);
                if(otherIndexInArray === -1) {
                    this.currentCollidingObjectIndices.push(index);
                    this.classInstance.model.rotationQuaternion.conjugateInPlace();
                    this.classInstance.velocity.negateInPlace();
                }
            } else if (otherIndexInArray != -1){
                this.currentCollidingObjectIndices.splice(otherIndexInArray, 1);
            }
        });

        if (this.currentCollidingObjectIndices.length === 0) {
            this.positionBeforeCollision = this.classInstance.model.position.clone();
        }
    }

    postFrameUpdate() {
        this.boundingInfoUpdated = false;
    }
}
