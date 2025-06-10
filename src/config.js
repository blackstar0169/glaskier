
class Config {
    config = {};
    default = {
        'lang': 'en',
        'soundDir': './sounds',
    };
    required = [
        'lang',
        'botToken',
        'soundDir',
    ];

    /**
     * Init configuration
     * @param {object} config
     * @return {boolean}
     */
    init(config) {
        const errors = this.validate(config);
        if (errors.length === 0) {
            this.config = Object.assign({}, this.default, config);
            return true;
        }

        console.error('Config error. Missing properties : ' + errors.join(', '));

        return false;
    }

    /**
     * Validate configuration and return an array with missing attribute.
     * The config is valid if the array is empty
     *
     * @param {object} config
     * @returns {object} Array of missing attributes
     */
    validate(config) {
        const missing = [];
        for (let i = 0; i < this.required.length; i++) {
            if (typeof config[this.required[i]] === 'undefined' || config[this.required[i]] === null || config[this.required[i]] === '') {
                missing.push(this.required[i]);
            }
        }

        return missing;
    }

    get(key, def) {
        return typeof this.config[key] !== 'undefined' ? this.config[key] : def;
    }

    set(key, value) {
        return this.config[key] = value;
    }
}

module.exports = new Config();
