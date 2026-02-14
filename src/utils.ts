import {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    VoiceConnection,
} from '@discordjs/voice';
import GuildPlayer from './GuildPlayer';
import { Guild, VoiceChannel } from 'discord.js';

export function safelyDestroyConnection(connection) {
    if (connection instanceof VoiceConnection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
        try {
            connection.destroy();
        } catch (e) {
            console.log('Failed to destroy connection', e);
        }
    }
}

export async function connectToChannel(channel: VoiceChannel): Promise<VoiceConnection> {
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 3e3);
        return connection;
    }
    catch (error) {
        safelyDestroyConnection(connection);
        throw error;
    }
}

export function findPlayerByGuild(guild: Guild|string, players: GuildPlayer[]): GuildPlayer | undefined {
    let id = guild;
    if (typeof guild === 'object' && typeof guild.id !== 'undefined') {
        id = guild.id;
    }

    for (let i = 0; i < players.length; i++) {
        // Remove players attached to the guild
        if (id === players[i].guild.id) {
            return players[i];
        }
    }
};

export function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
};

export function empty(value: any): boolean {
    if (typeof value === 'string' && value === '') {
        return true;
    }
    return typeof value === 'undefined' || value === null || value === false || value === 0;
};

export function chunk(array: any[], chunkSize: number) {
    let i, j;
    const temparray = [];
    for (i = 0, j = array.length; i < j; i += chunkSize) {
        temparray.push(array.slice(i, i + chunkSize));
    }
    return temparray;
};

export function log(str: string) {
    const now = new Date();
    console.log('[' + now.toISOString() + '] ' + str);
};

/**
 * Convert a string from snake_case or kebab-case to camelCase
 * @param {string} s
 * @returns {string}
 */
export function camelize(s: string): string {
    return s.toLowerCase().replace(/(-|_)./g, x => x[1].toUpperCase());
};
