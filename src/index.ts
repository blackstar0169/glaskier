console.log('Running NodeJS ' + process.version);
console.log('CWD : ' + process.cwd());

import { Client, GatewayIntentBits } from 'discord.js';
import GuildPlayer from './GuildPlayer.js';
import { findPlayerByGuild } from './utils.js';
import Command from './Command.js';
import { config } from './Config';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const players: GuildPlayer[] = [];

try {
    config.init();
}
catch (e) {
    console.error('.env file parsing error', e);
    process.exit(2);
}

process.on('SIGINT', function() {
    console.error('Process stopped');
    process.exit(1);
});

// Toutes les actions à faire quand le bot se connecte
client.on('ready', () => {
    console.log('Servers list : ');
    client.guilds.cache.each((guild) => {
        players.push(new GuildPlayer(guild));
        console.log(guild.name);
    });
    if (typeof process.send === 'function') {
        process.send('ready');
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'gla') {
        const memberId = interaction.member.user.id;
        if (!config.isProd() && memberId !== config.get('creatorId')) {
            interaction.channel.send(':warning: Je suis en maintenance.');
        }
        else {
            const player = findPlayerByGuild(interaction.guild.id, players);
            Command.exec(interaction, player);
        }
    }

    // Command.exec(message.commandName, player, message);
});

client.on('guildCreate', (guild) => {
    console.log('Added to guild ' + guild.name);
    // Don't recreate a player if the guild exists
    const find = players.filter(player => guild.id === player.guild.id);

    if (typeof find === 'undefined') {
        players.push(new GuildPlayer(guild));
    }
});
client.on('guildDelete', (guild) => {
    console.log('Removed from guild ' + guild.name);

    for (let i = players.length; i >= 0; i--) {
        // Remove players attached to the guild
        if (guild.id === players[i].guild.id) {
            players[i].destroy();
            delete players[i];
        }
    }
});

client.login(config.get('discordToken'));
