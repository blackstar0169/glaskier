
var required = [
    'lang',
    'botToken',
    'soundDir'
];


function validate(config) {
    var missing = [];
    for (let i = 0; i < required.length; i++) {
        if (typeof config[required[i]] === 'undefined' || config[this.required[i]] === null || config[this.required[i]] === '') {
            missing.push(this.required[i]);
        }
    }

    return missing;
}

var errors = validate(config);
if (errors !== null) {
    throw new Error('Invalid config. Missing ' + errors.join(', ') + 'parameters.');
}
delete errors;
delete required;

var config = Object.assign({}, this.default, config);
module.exports = config;
