import * as BABYLON from 'babylonjs';

import OSDApp from '../OSDApp';
import FrameUpdater from '../FrameUpdater';
import CreateShaderMaterial from '../../utils/CreateShaderMaterial';
import DynamicObject from './DynamicObject';
import RouteDB from '../hermes/RouteDB';

function projectVector(A: BABYLON.Vector3, B: BABYLON.Vector3) {
    return B.scale(BABYLON.Vector3.Dot(A, B) / Math.pow(B.length(), 2));
}

export default class Vehicle {
    protected app: OSDApp;
    public _dynamicObject;
    protected watchedKeyCodes;
    private trailer = null;
    private trailerJoint = null;
    private frameUpdater = null;
    private observers: any[] = [];
    private material: BABYLON.ShaderMaterial;
    private propellers: BABYLON.Mesh[] = [];
    private boundInfo: { height: number; width: number; length: number };
    private acceleration:BABYLON.Vector3 = new BABYLON.Vector3(0,0,0);
    private rotationAcceleration:BABYLON.Vector3 = new BABYLON.Vector3(0,0,0);
    private smoothedAcceleration:BABYLON.Vector3 = new BABYLON.Vector3(0,0,0);
    private smoothedRotationAcceleration:BABYLON.Vector3 = new BABYLON.Vector3(0,0,0);

    constructor(app, dynamicObject) {
        this.app = app;
        this._dynamicObject = dynamicObject;

        this.frameUpdater = FrameUpdater.addUpdater(this.update.bind(this));
        this.buildPropellers();

        this.watchedKeyCodes = {
            'KeyS': false,
            'ArrowDown': false,
            'KeyW': false,
            'ArrowUp': false,
            'KeyA': false,
            'ArrowLeft': false,
            'KeyD': false,
            'Shift': false,
            'ArrowRight': false,
            'Space': false
        };
    }

    private async buildPropellers() {
        const scene = this.app.scene;
        const model: BABYLON.Mesh = this._dynamicObject.physicsModel;
        const propellerBoxMaterial = await CreateShaderMaterial('propeller', 'public/shaders/vehicles/propeller', scene);
        propellerBoxMaterial.needAlphaBlending = () => true;
        this.material = propellerBoxMaterial;

        const { minimum, maximum } = model.getBoundingInfo().boundingBox;
        const width = maximum.x - minimum.x;
        const height = maximum.y - minimum.y;
        const length = maximum.z - minimum.z;

        this.boundInfo = { width, height, length };

        const y = -0.25 * height;

        // Positions of the propellers to build
        // Note that in updatePropellers, we assume that the first 2 are at the front
        const positions = [
            [width/2-0.25, y, length/2-1.5],
            [-width/2+0.25, y, length/2-1.5],
            [-width/2+0.25, y, -length/2+1.5],
            [width/2-0.25, y, -length/2+1.5],
        ];
        positions.forEach(position => {
            const box = BABYLON.MeshBuilder
                .CreateBox("propeller_box_volume", {height: 3, width: 3, depth: 3}, scene);
            box.material = propellerBoxMaterial;
            model.addChild(box);
            box.position.x = position[0];
            box.position.y = position[1];
            box.position.z = position[2];

            box.setPivotPoint(new BABYLON.Vector3(0,0,0));

            const halfSphere = BABYLON.MeshBuilder.CreateSphere("propeller", {
                slice: 0.5,
                sideOrientation: BABYLON.Mesh.DOUBLESIDE
            }, scene);
            box.addChild(halfSphere);
            halfSphere.position.x = 0;
            halfSphere.position.y = 0;
            halfSphere.position.z = 0;
            this.propellers.push(box);
        });
    }

    updatePropellers() {
        const model: BABYLON.Mesh = this._dynamicObject.physicsModel;
        const acceleration = this.acceleration;
        const rotationAcceleration = this.rotationAcceleration;
        // Smoothing factor to blend in acceleration from last frame
        const factor = 0.98;
        const smoothedAcceleration = this.smoothedAcceleration;
        const smoothedRotationAcceleration = this.smoothedRotationAcceleration;

        this.smoothedAcceleration = smoothedAcceleration.scale(factor)
            .add(acceleration.scale(1.0 - factor));
        this.smoothedRotationAcceleration = smoothedRotationAcceleration.scale(factor)
            .add(rotationAcceleration.scale(1.0 - factor));

        this.propellers.forEach((propeller,) => {
            propeller.rotation.x = Math.max(Math.min(
                smoothedAcceleration.z * 0.000001,
                0.4),-0.4);
            propeller.rotation.z = smoothedRotationAcceleration.y * 11.0;
        });

        if (this.material) {
            const date = new Date();
            this.material.setFloat(
                'time',
                (date.getMilliseconds() + date.getSeconds() * 1000) / 100
            );
            this.material.setVector3(
                'acceleration',
                acceleration
            );
            this.material.setVector3(
                'cameraPosition',
                this.app.camera.position
            );
        }
    }

    get dynamicObject(): DynamicObject {
        return this._dynamicObject;
    }

    get hasGravity() {
        return true;
    }

    playerExit() {
        this.clearListenKeyboard();
    }

    playerEnter() {
        this.listenKeyboard();
    }

    dispose(): void {
        this._dynamicObject.model.dispose();
        FrameUpdater.removeUpdater(this.frameUpdater);
    }


    updateVelocityDirection(deltaTime: number) {
        const model = this._dynamicObject.physicsModel;
        const velocity = model.physicsImpostor.getLinearVelocity();
        const direction = model.forward;
        const projectedVelocity = projectVector(velocity, direction);
        const factor = Math.min(2.0 * deltaTime, 1.0);

        model.physicsImpostor.setLinearVelocity(
            velocity.scale(1.0 - factor).add(projectedVelocity.scale(factor))
        );
    }

    observeKeyboard(kbInfo: any): void {
        const code = kbInfo.event.code.toString();

        if ('Shift' in this.watchedKeyCodes) {
            this.watchedKeyCodes['Shift'] = kbInfo.event.shiftKey;
        }
        if (code === 'KeyJ' && kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
            this.joinTrailer();
        }

        if (!(code in this.watchedKeyCodes)) {
            return;
        }

        if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYDOWN) {
            this.watchedKeyCodes[code] = true;
        } else if (kbInfo.type == BABYLON.KeyboardEventTypes.KEYUP) {
            this.watchedKeyCodes[code] = false;
        }
    }

    private listenKeyboard() {
        this.observers.push(this.app.scene.onKeyboardObservable.add(this.observeKeyboard.bind(this)));
    }

    private clearListenKeyboard() {
        this.observers.forEach((observer) => {
            this.app.scene.onKeyboardObservable.remove(observer);
        });
    }

    joinTrailer() {
        const model = this._dynamicObject.physicsModel;
        const trailer = (this.app.dynamicWorld
            .allDynamicObjects as any)
            .filter(obj => (obj as any).manifest.isTrailer)[0];
        const trailerImpostor = ((trailer as any).model as any).physicsImpostor;

        if (this.trailer) {
            this.app.scene.getPhysicsEngine().removeJoint(model.physicsImpostor, trailerImpostor, this.trailerJoint);
            this.trailer = null;
            this.trailerJoint = null;
            return;
        }

        const joint = new BABYLON.PhysicsJoint(
            BABYLON.PhysicsJoint.BallAndSocketJoint, {
                mainAxis: new BABYLON.Vector3(0,1,0),
                connectedAxis: new BABYLON.Vector3(0,1,0),
                mainPivot: new BABYLON.Vector3(0,0,10),
                connectedPivot: new BABYLON.Vector3(0,0,-10),
            });

        model.position.scale(0);
        model.physicsImpostor.addJoint(trailerImpostor, joint);

        this.trailer = trailer;
        this.trailerJoint = joint;
    }

    private get isPlayerDriving() {
        return this.observers.length > 0;
    }

    updateControl(deltaTime: number) {
        if (!this.isPlayerDriving) {
            return;
        }

        const mass = this._dynamicObject.manifest.mass || 1000;
        const accelerationMultiplier = this._dynamicObject.manifest.acceleration || 1;
        let strength = deltaTime * accelerationMultiplier * mass;
        const backStrength = 0.3 * strength;
        const model = this._dynamicObject.physicsModel;
        const impostor: BABYLON.PhysicsImpostor = model.physicsImpostor;

        const speedFactor = Math.max(impostor.getLinearVelocity().length() / 1000.0, 1.0);
        let rotateStrength = 0.004 * deltaTime * (this._dynamicObject.manifest.rotationAcceleration || 1) / speedFactor;
        const rollStrength = rotateStrength;

        if (this.trailer) {
            rotateStrength *= 60.0;
        }

        const rotationMatrix = new BABYLON.Matrix();
        this._dynamicObject._boxModel.absoluteRotationQuaternion.toRotationMatrix(rotationMatrix);
        const localToGlobal = (vector) => {
            return BABYLON.Vector3.TransformCoordinates(vector, rotationMatrix);
        };

        let angularVelocity = impostor.getAngularVelocity().clone();
        const acceleration = this.acceleration;
        acceleration.scaleInPlace(0);
        const rotationAcceleration = this.rotationAcceleration;
        rotationAcceleration.scaleInPlace(0);

        if (this.watchedKeyCodes.Shift) {
            strength *= 3.0;
        }
        if (this.watchedKeyCodes.KeyW) {
            acceleration.z -= strength;
        }
        if (this.watchedKeyCodes.KeyS) {
            acceleration.z += backStrength;
        }
        if (this.watchedKeyCodes.ArrowLeft) {
            rotationAcceleration.y -= rotateStrength;
            rotationAcceleration.z -= rollStrength * 0.5;
        }
        if (this.watchedKeyCodes.ArrowRight) {
            rotationAcceleration.y += rotateStrength;
            rotationAcceleration.z += rollStrength * 0.5;
        }
        if (this.watchedKeyCodes.KeyA) {
            rotationAcceleration.z -= rollStrength;
            rotationAcceleration.y -= rotateStrength * 0.5;
        }
        if (this.watchedKeyCodes.KeyD) {
            rotationAcceleration.z += rollStrength;
            rotationAcceleration.y += rotateStrength * 0.5;
        }
        if (this.watchedKeyCodes.ArrowUp) {
            rotationAcceleration.x -= rotateStrength;
        }
        if (this.watchedKeyCodes.ArrowDown) {
            rotationAcceleration.x += rotateStrength;
        }
        if (this.watchedKeyCodes.Space) {
            // flip car when upside down & pressing space
            if (model.up.y < 0) {
                const rotation = model.rotationQuaternion.toEulerAngles();
                rotation.x = 0;
                rotation.z = 0;
                model.rotationQuaternion = BABYLON.Quaternion.FromEulerVector(rotation);
                impostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
            }
        }

        let localGravity = new BABYLON.Vector3(0,0,0);
        let aboveRoad = false;

        if (this.hasGravity) {
            const position = model.getAbsolutePosition();
            const nearestRoadPoint = this.app.hermes.routeDb.getNearestRoadPoint(position);

            // Build a force that will make the vehicle stay a certain distance
            // form the road vertically
            if (nearestRoadPoint &&
                nearestRoadPoint.point) {
                const roadPoint = nearestRoadPoint.point;
                const roadUp = nearestRoadPoint.up.normalize(1);
                const target = 10;
                const targetHeightVector = roadUp.scale(target);
                let strength = 60.0 * mass;
                const projection = projectVector(
                    position.subtract(roadPoint),
                    roadUp
                );

                localGravity = targetHeightVector.subtract(projection).scale(strength); // * distanceFactor(projection.length()/30));

                // Damp vertical speed relative to road to prevent endless oscillation
                const velocity = impostor.getLinearVelocity();
                const verticalSpeed = projectVector(velocity, roadUp);
                localGravity.addInPlace(verticalSpeed.scale(-1.3 * strength));

                const roadForward = nearestRoadPoint.forward.normalize(1);
                const roadRight = roadForward.cross(roadUp);
                const roadWidth = RouteDB.ROAD_WIDTH;

                // If under road or on the side of road, cancel impact
                if (BABYLON.Vector3.Dot(position.subtract(roadPoint), roadUp) < 0.0 ||
                    projectVector(position.subtract(roadPoint), roadRight).length() > roadWidth * 4) {
                    localGravity.scaleInPlace(0);
                } else {
                    aboveRoad = true;
                }

                // Align car up vector perpendicularly to road plane
                const cross = roadUp.cross(this._dynamicObject.physicsModel.up);

                angularVelocity.addInPlace(
                    cross.scale(-0.9 * deltaTime).scale(cross.length())
                );
            }
        }

        impostor.wakeUp()
        const force = localToGlobal(acceleration);
        const affectedByGravity = !aboveRoad && this.hasGravity;

        if (affectedByGravity) {
            // Car force and damping cannot go against gravity if not over road
            force.multiplyInPlace(new BABYLON.Vector3(1.0, 0.0, 1.0));
        }

        impostor.applyForce(
            force.add(localGravity).add(this.damper()),
            model.getAbsolutePosition()
        );
        const angularDampPerSecond = 0.001;
        impostor.setAngularVelocity(angularVelocity.add(localToGlobal(rotationAcceleration)).scale(1.0 - deltaTime * angularDampPerSecond));

    }

    /**
     * This method returns a force to apply that simulate damping propellers which try to:
     * stabilize movements
     */
    damper(): BABYLON.Vector3 {
        const model: BABYLON.Mesh = this._dynamicObject.physicsModel;
        const impostor: BABYLON.PhysicsImpostor = model.physicsImpostor;
        const velocity = impostor.getLinearVelocity();
        const damper = new BABYLON.Vector3(0.0, 0.0, 0.0);
        const mass = this._dynamicObject.manifest.mass || 1000;

        // Damp speed
        damper.z -= velocity.z;
        if (!this.hasGravity) {
            damper.y -= velocity.y;
        }
        damper.x -= velocity.x;

        let dampScale = 1.0 * mass;

        if (this.watchedKeyCodes.Space) {
            dampScale *= 3.0;
        }

        return damper.scale(dampScale);
    }

    get physicsImpostor(): BABYLON.PhysicsImpostor {
        const model = this._dynamicObject.physicsModel;
        return model.physicsImpostor;
    }

    update({ deltaTime }) {
        this.updateControl(deltaTime);
        this.updatePropellers();
    }
}
