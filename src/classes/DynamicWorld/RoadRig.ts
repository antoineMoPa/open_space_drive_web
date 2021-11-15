import * as BABYLON from 'babylonjs';
import Vehicle from './Vehicle';

export default class RoadRig extends Vehicle {
    constructor(...args) {
        super(...args);
    }

    insertRoad() {
        this.app.hermes.routes.add({
            point1: this.dynamicObject.physicsModel.position,
            point2: this.dynamicObject.physicsModel.position.add(new BABYLON.Vector3(1,0,0))
        });
    }

    observeKeyboard(kbInfo) {
        super.observeKeyboard(kbInfo);

        const code = kbInfo.event.code.toString();

        if (code === 'KeyI' && kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
            this.insertRoad();
        }
    }
}
