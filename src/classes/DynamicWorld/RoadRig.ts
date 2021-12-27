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

    addPoint() {
        const model = this.dynamicObject.physicsModel;
        const newPointId = this.app.hermes.routes.addPoint({
            point: model.position.clone(),
            up: model.up.clone(),
            forward: model.forward.clone()
        });

        this.currentSegmentPoints.push(newPointId);

        if (this.currentSegmentPoints.length == 2) {
            this.app.hermes.routes.addSegment({
                point1ID: this.currentSegmentPoints[0],
                point2ID: this.currentSegmentPoints[1],
                has_left_wall: true,
                has_right_wall: true
            });
            this.currentSegmentPoints.shift();
        }

        if (this.currentSegmentPoints.length > 2) {
            throw new Error('Should never happen.');
        }
    }

    observeKeyboard(kbInfo, deltaTime) {
        super.observeKeyboard(kbInfo, deltaTime);

        const code = kbInfo.event.code.toString();

        if (code === 'Space' && kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
            this.addPoint();
        }
    }
}
