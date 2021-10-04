/**
 * Utility to update certain values at every frame.  Keep operations
 * very lightweight when using this class.  Later, we might want to
 * limit frame updater execution to a given subset of the space to
 * avoid updating far-away stuff.
 *
 * A frame updater function should not rely on values based on past
 * executions.  It should be able to do it's job according to the
 * current time and the state of the scene.
 *
 */
export default class FrameUpdater {
    private static callbacks: {} = {};
    private static counter: number = 0;

    /**
     * Adds a callback to the callback map. Returns the id
     * @param callback a new function to execute at every frame.
     * @return the id of the callback, useful for deletion
     */
    static addUpdater(callback): string {
        let id = 'callback_' + FrameUpdater.counter;
        FrameUpdater.callbacks[id] = callback;
        FrameUpdater.counter++;
        return id;
    }

    static removeUpdater(id: string) {
        delete FrameUpdater.callbacks[id];
    }

    static update({ scene }) {
        for (const callback in FrameUpdater.callbacks) {
            FrameUpdater.callbacks[callback]({ scene });
        }
    }
}
