import * as BABYLON from 'babylonjs';
import Vehicle from './Vehicle';

export default class RoadRig extends Vehicle {
    last: BABYLON.Vector3 = null;

    constructor(app, dynamicObject) {
        super(app, dynamicObject);
        this.watchedKeyCodes['Space'] = false;
    }

    insertRoad() {
        const position = this.dynamicObject.physicsModel.position;

        if (this.last !== null) {
            this.app.hermes.routes.add({
                point1: this.last.clone(),
                point2: position.clone(),
                up: this.dynamicObject.physicsModel.up.clone()
            });
        }
        this.last = position.clone();
    }

    observeKeyboard(kbInfo, deltaTime) {
        super.observeKeyboard(kbInfo, deltaTime);

        const code = kbInfo.event.code.toString();

        if (code === 'Space' && kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
            this.insertRoad();
        }
    }
}
