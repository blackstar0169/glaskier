import fs from 'fs';

export default class Cache {
    protected dir = './cache/';
    protected file: string;
    protected values: {[key: string]: any} = {};

    constructor(id: string) {
        this.file = id;
        if (!fs.existsSync(this.dir)) {
            console.error('Storage dir does not exists');
            process.exit(3);
        }
        // Load cache file if it exists
        if (fs.existsSync(this.dir + this.file)) {
            this.load();
        }
    }

    all() {
        return this.values;
    }

    pull(key: string, def: any = undefined) {
        if (Object.keys(this.values).indexOf(key) >= 0) {
            return this.values[key];
        }
        return def;
    }

    push(key: string, val: any) {
        this.values[key] = val;
        this.save();
    }

    forget(key: string) {
        if (Object.keys(this.values).indexOf(key) >= 0) {
            delete this.values[key];
        }
        this.save();
    }

    flush() {
        this.values = {};
        this.save();
    }

    save() {
        fs.writeFileSync(this.dir + this.file, JSON.stringify(this.values));
    }

    load() {
        this.values = JSON.parse(fs.readFileSync(this.dir + this.file).toString());
    }
}
