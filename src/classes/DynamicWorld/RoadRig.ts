import * as BABYLON from 'babylonjs';
import Vehicle from './Vehicle';

export default class RoadRig extends Vehicle {
    currentSegmentPoints = [];

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
}
