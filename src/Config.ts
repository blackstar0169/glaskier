import dotenv from "dotenv";
import { camelize } from "./utils";
import fs from 'fs';

class Config {
    protected config = {};
    protected default = {
        'lang': 'en',
        'soundDir': './sounds',
    };
    protected required = [
        'nodeEnv',
        'discordToken',
        'discordClientId',
    ];

    /**
     * Init configuration
     */
    public init() {

        // Read config
        if (fs.existsSync('.env')) {
            dotenv.config();
        }

        const config = this.populate(process.env);

        const errors = this.validate(config);
        if (errors.length > 0) {
            throw new Error('Config error. Missing environment variables : ' + errors.join(', '));
        }

        this.config = Object.assign({}, this.default, config);
    }

    private populate(source) {
        const target = {};
        for (const key in source) {
            if (Object.hasOwnProperty.call(source, key)) {
                const camelKey = camelize(key);
                target[camelKey] = source[key];
            }
        }

        return target;
    }

    /**
     * Validate configuration and return an array with missing attribute.
     * The config is valid if the array is empty
     *
     * @param {object} config
     * @returns {object} Array of missing attributes
     */
    private validate(config) {
        const missing = [];
        for (let i = 0; i < this.required.length; i++) {
            if (typeof config[this.required[i]] === 'undefined' || config[this.required[i]] === null || config[this.required[i]] === '') {
                missing.push(this.required[i]);
            }
        }

        return missing;
    }

    public get(key, def: any = undefined) {
        return typeof this.config[key] !== 'undefined' ? this.config[key] : def;
    }

    public set(key, value) {
        return this.config[key] = value;
    }

    /**
     * Return true if the application is running in production mode
     * @returns {boolean}
     */
    public isProd(): boolean {
        const env = this.get('nodeEnv', 'dev').toLowerCase();
        return env === 'prod' || env === 'production';
    }
}

export const config = new Config();
