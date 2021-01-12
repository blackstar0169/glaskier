const fs = require('fs');
const {Client} = require('discord.js');
const GuildPlayer = require('./GuildPlayer.js');
const {findPlayerByGuild} = require('./utils.js');
const Command = require('./Command.js');
const config = require('./config.js');

const client = new Client();

var players = [];


// Read config
if (!fs.existsSync('config.json')) {
    throw new Error('Config file config.json not found.');
}

try {
    var config = JSON.parse(fs.readFileSync('config.json'));
    Config.init(config);
} catch (e) {
    console.error("Parsing error:", e);
}

if (config === null) {
    throw new Error('Confg file config.json not found.');
}


//Toutes les actions à faire quand le bot se connecte
client.on("ready", () => {
    console.log("Servers list : ");
    client.guilds.cache.each((guild) => {
        players.push(new GuildPlayer(guild));
        console.log(guild.name);
    });
})

client.on('message', (message) => {
    var answer = null;



    if (message.content.startsWith('!gla')) {
        var player = findPlayerByGuild(message.guild.id, players);
        Command.exec(message.content, player, message);
    }

    if (answer) {
        message.channel.send(answer);
    }
})

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
    var deleteIndex;
    for (var i = players.length; i >= 0; i--) {
        // Remove players attached to the guild
        if (guild.id === players[i].guild.id) {
            players[i].destroy()
            delete players[i];
        }
    }
});

client.login(config.botToken);

