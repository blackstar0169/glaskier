import { REST, SlashCommandBuilder, Routes } from 'discord.js';
import { config } from './Config';

try {
    config.init();
}
catch (e) {
    console.error('.env file parsing error', e);
    process.exit(2);
}

const botToken = config.get('discordToken');
const clientId = config.get('discordClientId');

const commands = new SlashCommandBuilder()
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


const rest = new REST().setToken(botToken);

try {
    console.log(`Started refreshing application (/) commands.`);
    // The put method is used to fully refresh all commands in the guild with the current set
    rest.put(Routes.applicationCommands(clientId), { body: [commands.toJSON()] }).then((data: any[]) => {
        if (Array.isArray(data)) {
            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } else {
            console.error('Error while reloading application (/) commands.');
            console.error(data);
        }
    }).catch((error) => {
        console.error('Error while reloading application (/) commands.');
        console.error(error);
    });
} catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
}
