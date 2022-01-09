const fs = require('fs');

class Cache {
    constructor(id) {
        this.dir = './cache/';
        this.file = id
        this.values = {}
        if (!fs.existsSync(this.dir)) {
            console.error("Storage dir does not exists");
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

    pull(key, def) {
        if(Object.keys(this.values).indexOf(key) >= 0) {
            return this.values[key];
        }
        return def;
    }

    push(key, val) {
        this.values[key] = val;
        this.save();
    }

    forget(key) {
        if(Object.keys(this.values).indexOf(key) >= 0) {
            delete this.values[key]
        }
        this.save();
    }

    flush() {
        this.values = {};
        this.save();
    }

    save() {
        fs.appendFileSync(this.dir + this.file, JSON.stringify(this.values));
    }

    load() {
        this.values = JSON.parse(fs.readFileSync(this.dir + this.file));
    }
}

module.exports = Cache;
