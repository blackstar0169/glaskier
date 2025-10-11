const { EventEmitter } = require('events');

export default abstract class CanEmmitErrors extends EventEmitter {
    /**
     * Trigger an error
     * @param {string} error
     */
    triggerError(error) {
        if (error) {
            console.error(error);
        }
        this.emit('error', this, error);
    }
}
