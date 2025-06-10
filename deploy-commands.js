const { REST, SlashCommandBuilder, Routes } = require('discord.js');
const { clientId, botToken } = require('./config.json');

const command = new SlashCommandBuilder()
    .setName('gla')
    .setDescription('Interact with glaskier')
    .addSubcommand(subcommand =>
        subcommand
            .setName('help')
            .setDescription('List commands'),
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('stop')
            .setDescription('Stop the bot to play random sounds'),
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('start')
            .setDescription('Start the bot to play random sounds'),
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('next')
            .setDescription('Display the date and in which channel the next song will be played'),
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('reroll')
            .setDescription('Generate a new random time to play a song'),
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('test')
            .setDescription('Play a song in your channel. Don\'t interupte the next random traget'),
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('history')
            .setDescription('List the last 50 glitch'),
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('debug')
            .setDescription('Debug command. Only available for the creator.')
            .addStringOption(option =>
                option
                    .setName('option')
                    .setDescription('The option to debug')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Play', value: 'play' },
                        { name: 'Get user ID', value: 'getUserId' },
                    ),
            ),
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('play')
            .setDescription('Play a binded sound if there is a key or a random sound')
            .addStringOption(option => option.setName('key').setDescription('The binded key').setRequired(true))
            .addStringOption(option => option.setName('channel').setDescription('The where to play the sound')),
    )
    // .addSubcommand(subcommand =>
    //     subcommand
    //         .setName('bind')
    //         .setDescription('Bind a key to a sound')
    //         .addStringOption(option => option.setName('key').setDescription('The key name (without space)').setRequired(true))
    //         .addStringOption(option => option.setName('sound').setDescription('Sound name or index').setRequired(true))
    // )
    // .addSubcommand(subcommand =>
    //     subcommand
    //         .setName('unbind')
    //         .setDescription('Unind a key to a sound')
    //         .addStringOption(option => option.setName('key').setDescription('The key name (without space)').setRequired(true))
    // )
    // .addSubcommand(subcommand =>
    //     subcommand
    //         .setName('list-binds')
    //         .setDescription('List binds')
    // )
    .addSubcommand(subcommand =>
        subcommand
            .setName('list-sounds')
            .setDescription('List sounds'),
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('list-channels')
            .setDescription('List voice channels'),
    );


const rest = new REST({ version: '10' }).setToken(botToken);

rest.put(Routes.applicationCommands(clientId), { body: [command.toJSON()] })
    .then((ret) => console.log(`Successfully registered ${ret.length} application commands.`))
    .catch(console.error);
