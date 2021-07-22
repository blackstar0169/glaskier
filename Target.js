const { VoiceChannel } = require('discord.js');
const mp3Duration = require('mp3-duration');
const moment = require('moment');
const { random, empty } = require('./utils.js');
const fs = require('fs');
const { EventEmitter } = require('events');
const config = require('./config.js');

class Target extends EventEmitter {
    /**
     * Target a channel to play a sound
     * @param {VoiceChannel} channel The targeted VoiceChannel
     * @param {number} duration The timeout duration in seconds
     * @param {GuildPlayer} player GuildPlayer object that instanciate this target
     */
    constructor(channel, duration, player) {
        super();
        this.channel = channel;
        this.timeoutDate = moment().add(duration, 'seconds');
        this.player = player;

        if (channel !== null) {
            this.client = channel.client;
        } else if (channel === null && !empty(player)) {
            this.client = player.guild.client;
        } else {
            this.triggerError('Bad Target object construction. You must give a Channel or at lease a GuildPlayer object.');
            return null;
        }

        this.timeout = this.client.setTimeout(() => {
            this.play();
        }, duration * 1000);
    }

    cancel() {
        this.client.clearTimeout(this.timeout);
        this.timeout = null;
        this.timeoutDate = null;
    }

    play() {
        // Try to find a channel to play a sound in
        if (this.channel === null && !empty(this.player)) {
            this.player.scanChannels();
            if (this.player.availableChannels.size === 0) {
                this.triggerError('Can\'t find non empty channel in Guild' + this.player.guild.name);
                return false;
            }
            this.channel = this.player.availableChannels.random();
        }

        // Check if all required condition are valid to play a sound
        if (!this.isValid()) {
            if (!(this.channel instanceof VoiceChannel)) {
                this.triggerError('Channel instance invalide pour ' + this.player.guild.name + '/' + this.channel.name);
            } else if (!this.channel.speakable) {
                this.triggerError('Le bot ne peut pas parler dans le channel ' + this.player.guild.name + '/' + this.channel.name);
            } else if (this.channel.joinable === 0) {
                this.triggerError('Le bot ne peut pas aller dans le channel ' + this.player.guild.name + '/' + this.channel.name);
            } else if (this.channel.members.size === 0) {
                this.triggerError('Aucun membre présent dans ' + this.player.guild.name + '/' + this.channel.name);
            } else {
                this.triggerError('Erreur indéterminée pour accèder à' + this.player.guild.name + '/' + this.channel.name);
            }
            return false;
        }

        // Get a sound file
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
            var now = new Date();
            console.log('[' + now.toISOString() + '] ' + path);
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
            this.channel.joinable &&
            this.channel.speakable &&
            this.channel.members.size > 0
    }

    filterSoundFiles(file) {
        return file.match(/.*\.(mp3|wav)$/);
    }
}

module.exports = Target;
