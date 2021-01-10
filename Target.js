const {VoiceChannel} = require('discord.js');
const mp3Duration = require('mp3-duration');
const moment = require('moment');
const {random} = require('./utils.js');
const fs = require('fs');
const { EventEmitter } = require('events');

class Target extends EventEmitter {
    constructor (channel, duration) {
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
            console.log('Impossible de se connecter dans ' + this.channel.guild.name + '/' + this.channel.name);
            return false;
        }

        // Play the sound
        return this.channel.join().then((connection) => {
            var dir = './sounds/';
            var soundFiles = fs.readdirSync(dir);
            var index = random(0, soundFiles.length - 1);
            connection.play(dir + soundFiles[index]);

            // Get the sound duration to disconnect at the end of it
            mp3Duration(dir + soundFiles[index], (err, duration) => {
                if (err) {
                    console.log(err.message);
                    duration = 5000;
                }
                this.channel.client.setTimeout(() => {
                    connection.disconnect();
                    this.emit('played', this.channel, soundFiles[index]);
                    this.timeout = null;
                    this.timeoutDate = null;
                }, duration*1000);
            });
        }).catch(console.error);
    }

    isValid() {
        return this.channel instanceof VoiceChannel &&
                this.channel.speakable &&
                this.channel.members.size
    }
}

module.exports = Target;
