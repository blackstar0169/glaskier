const { VoiceChannel } = require('discord.js');
const mp3Duration = require('mp3-duration');
const moment = require('moment');
const { random } = require('./utils.js');
const fs = require('fs');
const { EventEmitter } = require('events');
const config = require('./config.js');

class Target extends EventEmitter {
    /**
     * Target a channel to play a sound
     * @param {*} channel The targeted VoiceChannel
     * @param {*} duration The timeout duration in seconds
     */
    constructor(channel, duration) {
        super();
        this.channel = channel;
        this.timeoutDate = moment().add(duration, 'seconds');
        this.timeout = channel.client.setTimeout(() => {
            this.play();
        }, duration * 1000);
    }

    cancel() {
        this.channel.client.clearTimeout(this.timeout);
        this.timeout = null;
        this.timeoutDate = null;
    }

    play() {
        if (!this.isValid()) {
            this.triggerError('Aucun membre présent ou accès refusé pour se connecter dans ' + this.channel.guild.name + '/' + this.channel.name);
            return false;
        }

        var dir = config.get('soundDir').replace(/\/$/, '');
        // Add trailing salsh to sound dir
        dir = fs.realpathSync(dir);
        if (typeof dir !== 'string') {
            this.triggerError('Dossier audio introuvable : ' + config.get('soundDir'));
            return false;
        }
        if(dir.substr(-1) !== '/') {
            dir += '/';
        }
        var soundFiles = fs.readdirSync(dir).filter(this.filterSoundFiles);
        if (soundFiles.length === 0) {
            this.triggerError('Dossier audio vide.');
            return false;
        }
        var index = random(0, soundFiles.length - 1);
        var path = fs.realpathSync(dir + soundFiles[index]);

        if(path == false || !fs.existsSync(path)){
            this.triggerError('Fichier audio inexistant : ' + path);
            return false;
        }

        try {
            fs.accessSync(path, fs.R_OK);
        } catch (err) {
            console.log(err);
            this.triggerError('Accès refusé au fichier audio : ' + path);
            return false;
        }

        // Play the sound
        return this.channel.join().then((connection) => {
            console.log(path);
            connection.play(path);

            // Get the sound duration to disconnect at the end of it
            mp3Duration(path, (err, duration) => {
                if (err) {
                    console.error(err.message);
                    duration = 10000;
                }
                this.channel.client.setTimeout(() => {
                    connection.disconnect();
                    this.emit('played', this.channel, soundFiles[index]);
                    this.timeout = null;
                    this.timeoutDate = null;
                }, duration * 1000);
            });
        }).catch(console.error);
    }

    triggerError(error) {
        if (error) {
            console.error(error)
        }
        this.emit('error', this, error);
    }

    isValid() {
        return this.channel instanceof VoiceChannel &&
            this.channel.speakable &&
            this.channel.members.size > 0
    }

    filterSoundFiles(file) {
        return file.match(/.*\.(mp3|wav)$/);
    }
}

module.exports = Target;
