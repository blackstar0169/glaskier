const { VoiceChannel } = require('discord.js');
const { createAudioResource, createAudioPlayer } = require('@discordjs/voice');
const mp3Duration = require('mp3-duration');
const moment = require('moment');
const { random, empty, connectToChannel } = require('./utils.js');
const fs = require('fs');
const { EventEmitter } = require('events');
const config = require('./config.js');

class Target extends EventEmitter {
    /**
     * Target a channel to play a sound
     * @param {VoiceChannel} channel The targeted VoiceChannel
     * @param {GuildPlayer} player GuildPlayer object that instanciate this target
     * @param {number} timeout The timeout duration in seconds
     */
    constructor(channel, player, timeout) {
        super();
        this.channel = channel;
        this.timeoutDate = null;
        this.player = player;
        this.soundPath = null;

        if (channel !== null) {
            this.client = channel.client;
        } else if (channel === null && !empty(player)) {
            this.client = player.guild.client;
        } else {
            this.triggerError('Bad Target object construction. You must give a Channel or at lease a GuildPlayer object.');
            return null;
        }

        if (typeof timeout === 'number' && timeout >= 0) {
            this.timeoutDate = moment().add(timeout, 'seconds');
            this.timeout = setTimeout(() => {
                this.play();
            }, timeout * 1000);
        }
    }

    cancel() {
        clearTimeout(this.timeout);
        this.timeout = null;
        this.channel = null;
        this.timeoutDate = null;
    }

    setSound(soundPath) {
        this.soundPath = soundPath;
    }

    play() {
        // Try to find a channel to play a sound in
        if (this.channel === null && !empty(this.player)) {
            this.player.scanChannels();
            if (this.player.availableChannels.size === 0) {
                this.triggerError('Can\'t find non empty channel in Guild ' + this.player.guild.name);
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
            } else if (!this.channel.joinable) {
                console.trace('error');
                this.triggerError('Le bot ne peut pas aller dans le channel ' + this.player.guild.name + '/' + this.channel.name);
            } else if (this.channel.members.size === 0) {
                this.triggerError('Aucun membre présent dans ' + this.player.guild.name + '/' + this.channel.name);
            } else {
                this.triggerError('Erreur indéterminée pour accèder à ' + this.player.guild.name + '/' + this.channel.name);
            }
            return false;
        }

        // Get a sound file
        if (typeof this.soundPath !== 'string' || this.soundPath.length === 0) {
            var soundFiles = this.player.getSounds();
            if (soundFiles.length === 0) {
                this.triggerError('Dossier audio vide.');
                return false;
            }
            var index = random(0, soundFiles.length - 1);
            this.soundPath = fs.realpathSync(this.player.soundDir + soundFiles[index]);
        }

        if(typeof this.soundPath !== 'string' || !fs.existsSync(this.soundPath)){
            this.triggerError('Fichier audio inexistant : ' + this.soundPath);
            return false;
        }

        try {
            fs.accessSync(this.soundPath, fs.R_OK);
        } catch (err) {
            console.log(err);
            this.triggerError('Accès refusé au fichier audio : ' + this.soundPath);
            return false;
        }

        // Play the sound
        var now = new Date();
        console.log('[' + now.toISOString() + '] ' + this.soundPath);

        // Get the sound duration to disconnect at the end of it
        mp3Duration(this.soundPath, async (err, duration) => {
            if (err) {
                console.error(err.message);
                duration = 10e3;
            }
            const resource = createAudioResource(this.soundPath);
            const player = createAudioPlayer();
            var connection = null;
            var subscription = null;
            player.play(resource);
            try {
                connection = await connectToChannel(this.channel);
                subscription = connection.subscribe(player);
            } catch (error) {
                if (connection) {
                    connection.destroy();
                }
                console.error(error);
                return;
            }

            setTimeout(() => {
                if (subscription) {
                    subscription.unsubscribe();
                }
                if (connection) {
                    connection.destroy();
                }
                this.emit('played', this.channel, this.soundPath);
                this.timeout = null;
                this.timeoutDate = null;
                this.channel = null;
            }, duration * 1000);
        });
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
}

module.exports = Target;
