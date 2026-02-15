import { Collection, Guild, GuildMember, VoiceChannel } from 'discord.js';
import moment from 'moment';
import { config } from './Config';
import Target from './Target';
import Cache from './Cache';
import fs from 'fs';
import path from 'path';
import { random } from './utils';
import CanEmmitErrors from './Contracts/CanEmmitErrors';

const eCantFindMember = 1;
const eChannelPermissions = 1;

/**
 * A player that will plan to play song at random interval. Each planification is called a Target
 */
export default class GuildPlayer extends CanEmmitErrors {
    private target: Target | null = null;
    private started: boolean;
    private minLimit: number;
    private maxLimit: number;
    private history: string[] = [];
    public guild: Guild;
    public availableChannels: Collection<string, VoiceChannel>;
    private cache: Cache;
    public soundDir: string;

    constructor(guild) {
        super ();
        this.target = null;
        this.started = true;
        this.minLimit = parseInt(config.get('defaultMinTime', 600));
        this.maxLimit = parseInt(config.get('defaultMaxTime', 3600));
        this.history = [];
        this.guild = guild;
        /**
         * @var Collection
         */
        this.availableChannels = new Collection<string, VoiceChannel>();
        this.cache = new Cache(this.guild.id);
        this.soundDir = config.get('soundDir').replace(/\/$/, '');
        // Add trailing salsh to sound dir
        this.soundDir = fs.realpathSync(this.soundDir);
        if (this.soundDir.substring(-1) !== '/') {
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
            this,
            null,
            random(this.minLimit, this.maxLimit),
        );

        // Generate a new target after it has been played
        this.target.on('played', (channel, soundfile) => {
            this.addHistory(channel, soundfile);
            this.planNextPlay();
        });
        // Plan next play if the current play failed
        // eslint-disable-next-line no-unused-vars
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
            ' | Son : ' + path.basename(soundfile),
        );

        // Limit history size
        while (this.history.length > 50) {
            this.history.shift();
        }
    }

    scanChannels(): Collection<string, VoiceChannel> {
        // Get available voice channels in which we can play sound.
        this.availableChannels = this.guild.channels.cache
            .filter((channel) => {
                return channel instanceof VoiceChannel &&
                                        channel.speakable &&
                                        channel.members.size;
            }) as Collection<string, VoiceChannel>;

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
     * @param {string|null} soundPath
     * @return bool|int True if the member that is targeted has been found in a channel or an error
     * number if it failed.
     */
    targetMember(member: GuildMember, soundPath: string|null = null) {
        // Find the VoiceChannel where the author is.
        const memberChannel = this.guild.channels.cache.find((channel) => {
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
     * @param {string|null} soundPath
     * @return bool|int True if the member that is targeted has been found in a channel or an error
     * number if it failed.
     */
    targetChannel(channel, soundPath: string|null = null) {
        // If we can play sound in the channel
        if (channel instanceof VoiceChannel &&
            channel.joinable &&
            channel.speakable &&
            channel.members.size
        ) {
            const target = new Target(this, channel, null);
            target.setSound(soundPath);
            target.play();
            return target;
        }
        else {
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
