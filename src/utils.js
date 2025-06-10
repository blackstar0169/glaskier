const config = require('./config');
const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
} = require('@discordjs/voice');

async function connectToChannel(channel) {
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
        connection.destroy();
        throw error;
    }
}

module.exports = {
    findPlayerByGuild: (guild, players) => {
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
    },

    random: (min, max) => {
        return Math.floor(Math.random() * (max + 1 - min)) + min;
    },

    empty: (value) => {
        if (typeof value === 'string' && value === '') {
            return true;
        }
        return typeof value === 'undefined' || value === null || value === false || value === 0;
    },

    chunk: (array, chunkSize) => {
        let i, j;
        const temparray = [];
        for (i = 0, j = array.length; i < j; i += chunkSize) {
            temparray.push(array.slice(i, i + chunkSize));
        }
        return temparray;
    },

    log: (str) => {
        const now = new Date();
        console.log('[' + now.toISOString() + '] ' + str);
    },

    isProd: () => {
        const env = config.get('env', 'dev');
        return env === 'prod' || env === 'production';
    },

    camelize: (s) => {
        return s.replace(/-./g, x => x[1].toUpperCase());
    },
};
module.exports.connectToChannel = connectToChannel;
