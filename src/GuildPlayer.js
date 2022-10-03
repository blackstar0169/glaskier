const {Collection, VoiceChannel, ChannelType} = require('discord.js');
const moment = require('moment');
const config = require('./config.js');
const Target = require('./Target.js');
const Cache = require('./Cache.js');
const fs = require('fs');
const path = require('path');
const {random} = require('./utils.js');

const eCantFindMember = 1;
const eChannelPermissions = 1;

/**
 * A player that will plan to play song at random interval. Each planification is called a Target
 */
class GuildPlayer {

    constructor(guild) {
        this.target = null;
        this.started = true;
        this.minLimit = config.get('defaultMinTime', 600);
        this.maxLimit = config.get('defaultMaxTime', 3600);
        this.history = [];
        this.guild = guild;
        /**
         * @var Collection
         */
        this.availableChannels = new Collection();
        this.cache = new Cache(this.guild.id);
        this.soundDir = config.get('soundDir').replace(/\/$/, '');
        // Add trailing salsh to sound dir
        this.soundDir = fs.realpathSync(this.soundDir);
        if(this.soundDir.substr(-1) !== '/') {
            this.soundDir += '/';
        }

        this.planNextPlay();

        // Listen join and leav events in voice chanels
        this.guild.client.on('channelCreate', this.scanChannels.bind(this));
        this.guild.client.on('channelDelete', this.scanChannels.bind(this));
        this.guild.client.on('voiceStateUpdate', () => {
            this.scanChannels.bind(this);
            if (this.target === null) {
                this.planNextPlay();
            }
        });
    }

    planNextPlay() {
        if (!this.started) {
            return null;
        }
        if (this.target !== null) {
            this.target.cancel();
            this.target = null;
        }

        this.scanChannels();
        // Check if there is someone in the channel
        if (this.availableChannels.size === 0) {
            return null;
        }

        // Cancel planned target

        this.target = new Target(
            null,
            this,
            random(this.minLimit, this.maxLimit)
        );

        // Generate a new target after it has been played
        this.target.on('played', (channel, soundfile) => {
            this.addHistory(channel, soundfile)
            this.planNextPlay();
        });
        // Plan next play if the current play failed
        this.target.on('error', (channel, soundfile) => {
            // @todo : Log cancel
            this.planNextPlay();
        });

        return this.target;
    }

    // Log when sound has been played. Give the date, channel members in the channel when it appened
    addHistory(channel, soundfile) {
        this.history.push(
            '[' + moment().format('DD/MM/YYYY HH:mm:ss') + '] Channel : ' +
            channel.name +
            ' | Membres : ' + channel.members.filter(m => m.id !== this.guild.members.me.id).map(m => m.displayName).join(', ') +
            ' | Son : ' + path.basename(soundfile)
        );

        // Limit history size
        while (this.history.length > 50) {
            this.history.shift();
        }
    }

    scanChannels() {
        // Get available voice channels in which we can play sound.
        this.availableChannels = this.guild.channels.cache
                                .filter((channel) => {
                                    return channel instanceof VoiceChannel &&
                                        channel.speakable &&
                                        channel.members.size
                                });

        return this.availableChannels;
    }

    destroy() {
        if (this.target !== null && this.target.timeoutDate.isBefore(moment())) {
            this.target.cancel();
        }
    }

    stop() {
        if (!this.started) {
            return;
        }

        if (this.target !== null && this.target.timeoutDate.isSameOrAfter(moment())) {
            this.target.cancel();
        }
        this.target = null;
        this.started = false;
    }

    start() {
        if (this.started) {
            return true;
        }

        this.started = true;
        return this.planNextPlay();
    }

    /**
     * Play a random sound in the channel where the given member is
     * @param {GuildMember} member
     * @return bool|int True if the member that is targeted has been found in a channel or an error
     * number if it failed.
     */
    targetMember(member, soundPath) {
        // Find the VoiceChannel where the author is.
        var memberChannel = this.guild.channels.cache.find((channel) => {
            return channel instanceof VoiceChannel && channel.members.find((m) => {
                return m.id === member.id;
            });
        });

        if (typeof memberChannel !== 'object') {
            return eCantFindMember;
        }

        return this.targetChannel(memberChannel, soundPath);
    }

    /**
     * Play a random sound in the given channel
     * @param {GuildChannel} channel
     * @return bool|int True if the member that is targeted has been found in a channel or an error
     * number if it failed.
     */
    targetChannel(channel, soundPath) {
        // If we can play sound in the channel
        if (channel instanceof VoiceChannel &&
            channel.joinable &&
            channel.speakable &&
            channel.members.size
        ) {
            var target = new Target(channel, this);
            target.setSound(soundPath);
            target.play();
            return target;
        } else {
            return eChannelPermissions;
        }
    }

    /**
     * Return the list of sound files in the sound directory
     * @returns string[]
     */
    getSounds() {

        if (typeof this.soundDir !== 'string') {
            this.triggerError('Dossier audio introuvable : ' + config.get('soundDir'));
            return false;
        }
        return fs.readdirSync(this.soundDir).filter(file => {
            return file.match(/.*\.(mp3|wav)$/);
        });
    }

    /**
     * Define class constant bellow
     */

    static get eCantFindMember() {
        return eCantFindMember;
    }

    static get eChannelPermissions() {
        return eChannelPermissions;
    }
}

module.exports = GuildPlayer;
