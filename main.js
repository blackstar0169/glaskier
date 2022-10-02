const fs = require('fs');
const {Client, GatewayIntentBits} = require('discord.js');
const GuildPlayer = require('./src/GuildPlayer.js');
const {findPlayerByGuild} = require('./src/utils.js');
const Command = require('./src/Command.js');
const config = require('./src/config.js');
const { isProd } = require('./src/utils.js');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	],
});

var players = [];


// Read config
if (!fs.existsSync('config.json')) {
    console.error('Config file ' + process.cwd() + '/config.json not found.');
    process.exit(1);
}

try {
    config.init(JSON.parse(fs.readFileSync('config.json')));
} catch (e) {
    console.error("Config file parsing error:", e);
    process.exit(2);
}

process.on('SIGINT', function() {
    db.stop(function(err) {
        console.error("Process stoped with status :", e);

        process.exit(err ? 1 : 0)
    })
})

//Toutes les actions à faire quand le bot se connecte
client.on('ready', () => {
    console.log("Servers list : ");
    client.guilds.cache.each((guild) => {
        players.push(new GuildPlayer(guild));
        console.log(guild.name);
    });
    process.send('ready');
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'gla') {
        if (!isProd() && interaction.member.id !== config.get('creatorId')) {
            message.channel.send(':warning: Je suis en maintenance.');
        } else {
            var player = findPlayerByGuild(interaction.guild.id, players);
            Command.exec(interaction, player);
        }
    }

    // Command.exec(message.commandName, player, message);
});

client.on('guildCreate', (guild) => {
    console.log('Added to guild ' + guild.name);
    // Don't recreate a player if the guild exists
    var find = players.filter(player => guild.id === player.guild.id);

    if (typeof find === 'undefined') {
        players.push(new GuildPlayer(guild));
    }
});
client.on('guildDelete', (guild) => {
    console.log('Removed from guild ' + guild.name);

    for (var i = players.length; i >= 0; i--) {
        // Remove players attached to the guild
        if (guild.id === players[i].guild.id) {
            players[i].destroy()
            delete players[i];
        }
    }
});

client.login(config.get('botToken'));

