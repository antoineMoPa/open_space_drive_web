import * as BABYLON from 'babylonjs';
import Vehicle from './Vehicle';

export default class RoadRig extends Vehicle {
    currentSegmentPoints = [];
    private targetPosition: BABYLON.Vector3 = null;
    private targetForward: BABYLON.Vector3 = null;

    constructor(app, dynamicObject) {
        super(app, dynamicObject);
        this.watchedKeyCodes['Space'] = false;
    }

    get hasGravity() {
        return false;
    }

    playerExit() {
        super.playerExit();
        this.app.enableGravity();
        this.app.hermes.routeUI.disable();
        this.app.player.model.position.y += 10;
    }

    playerEnter() {
        super.playerEnter();
        // Road rig works better without gravity, as it can build roads
        // at arbitrary positions.
        this.app.disableGravity();
        this.app.hermes.routeUI.enable(this);
    }

    setTarget(position, rotation) {
        this.targetPosition = position;
        this.targetForward = rotation;
    }

    update({ deltaTime }) {
        super.update({ deltaTime });
        const impostor = this.model.physicsImpostor;

        if (this.targetPosition !== null) {
            const diff = this.targetPosition.subtract(this.model.position);

            if (diff.length() < 0.1) {
                this.targetPosition = null;
                impostor.setLinearVelocity(BABYLON.Vector3.Zero());
            } else {
                impostor.setLinearVelocity(diff.scale(10));
            }
        }

        if (this.targetForward !== null) {
            const cross = BABYLON.Vector3.Cross(this.targetForward, this.model.forward);
            if (cross.length() < 0.1) {
                this.targetForward = null;
                impostor.setAngularVelocity(BABYLON.Vector3.Zero());
            } else {
                impostor.setAngularVelocity(cross.scale(0.5 * deltaTime));
            }
        }
    }
}
