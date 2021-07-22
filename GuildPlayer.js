const {Collection, VoiceChannel} = require('discord.js');
const moment = require('moment');
const config = require('./config.js');
const Target = require('./Target.js');
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

        this.scanChannels();
        // Check if there is someone in the channel
        if (this.availableChannels.size === 0) {
            return null;
        }

        // Cancel planned target
        if (this.target !== null && this.target.timeoutDate.isBefore(moment())) {
            this.target.cancel();
        }

        this.target = new Target(
            null,
            random(this.minLimit, this.maxLimit),
            this
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
            ' | Membres : ' + channel.members.filter(m => m.id !== this.guild.me.id).map(m => m.displayName).join(', ') +
            ' | Son : ' + soundfile
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
     * @returns
     */
    targetMember(member) {
        // Find the VoiceChannel where the author is.
        var memberChannel = this.guild.channels.cache.find((channel) => {
            return channel.type === 'voice' && channel.members.find((m) => {
                return m.id === member.id;
            });
        });

        if (typeof memberChannel !== 'object') {
            return eCantFindMember;
        }

        // If we can play sound in the channel
        if (memberChannel instanceof VoiceChannel &&
            memberChannel.joinable &&
            memberChannel.speakable &&
            memberChannel.members.size
        ) {
            return new Target(memberChannel, 0, this);
        } else {
            return eChannelPermissions;
        }
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
