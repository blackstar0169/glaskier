const config = require('./config.js');
const { ChatInputCommandInteraction, CommandInteractionOption } = require('discord.js');

const GuildPlayer = require('./GuildPlayer.js');
const {chunk, log} = require('./utils.js');

class Command {
    static commands = {
        'help' : 'List commands',
        // 'setMinTime': '[number] Set the minimum random time in seconds',
        // 'setMaxTime': '[number] Set the maximum random time in seconds',
        'stop': 'Stop the bot to play random songs',
        'start': 'Start the bot to play random songs',
        'next': 'Display the date and in which channel the next song will be played',
        'reroll': 'Generate a new random time to play a song',
        'test': 'Play a song in your channel. Don\'t interupte the next random traget',
        'history': 'List the last 50 glitch',
        'debug': 'Debug command. Only available for the creator.',
        'play': '[key] [channel?] Play a binded song if there is a key or a random song.',
        'bind': '[key] [song name or index] Bind a key to a song',
        'listsounds': 'List songs.',
        'listbinds': 'List binds.',
        // 'log': 'Display debug logs',
    }

    static usage = 'Usage: !gla [command] [options]...\n';

    /**
     * Exec a registred command
     * @param {ChatInputCommandInteraction} interaction
     * @param {GuildPlayer} player
     * @returns boolean
     */
    static exec(interaction, player) {
        const command = interaction.options.getSubcommand();
        const args = interaction.options.data.options;
        // Call the function of the command
        // log(interaction.member.displayName + ' run command ' + command);
        const output = this[command](player, interaction, args);
        if (typeof output === 'string' && output.length > 0) {
            interaction.reply(output);
        } else if (typeof output === 'object' && Array.isArray(output) && output.length > 0) {
            for (let i = 0; i < output.length; i++) {
                interaction.channel.send(output[i]);
            }
        }
    }

    static help() {
        var output = 'This bot is playing random songs in a choosen channel in which there is users.\n' +
                        this.usage;

        for (const command in this.commands) {
            if (this.commands.hasOwnProperty(command)) {
                output +=  '\t**' + command + '** : ' + this.commands[command] + '\n';
            }
        }

        return output;
    }

    static displayBadCommand(channel) {
        return channel.isText && channel.send('Erreur d\'utilisation de la commande !gla. Executez la command `!gla help` pour en savoir plus.');
    }

    /**
     * Play a random sound in the channel where the author is
     * @param {GuildPlayer} player The sound player instance for the Guild
     * @param {ChatInputCommandInteraction} interaction Message of the command
     * @returns
     */
    static test(player, message) {
        var ret = player.targetMember(message.member);
        if (typeof ret === 'number') {
            if (ret === GuildPlayer.eCantFindMember) {
                return 'Impossible de trouver ' + message.member.displayName;
            } else if (ret === GuildPlayer.eChannelPermissions) {
                return 'Permission insufisante pour entrer dans le channel.';
            }
            return 'Code d\'erreur : ' + ret;
        } else {
            return 'Test :sweat_drops:';
        }
    }

    static next(player) {
        if (!player.started) {
            return 'Je ne suis pas démarrer. Pour le faire, lance la commande `!gla start`';
        }

        if (player.target) {
            var output = 'Ma prochaine intervention à ' + player.target.timeoutDate.format('DD/MM/YYYY HH:mm:ss');
            if (player.target.channel) {
                output += ' dans le salon ' + player.target.channel.name
            }
            return output;
        }

        return 'Pas d\'intervention de prévue. Lancez la commande `!gla reroll` pour planifier aléatoirement une intervention.';
    }

    static reroll(player) {
        player.planNextPlay();
        if (player.target) {
            var output = 'Ma prochaine intervention à ' + player.target.timeoutDate.format('DD/MM/YYYY HH:mm:ss');
            if (player.target.channel) {
                output += ' dans le salon ' + player.target.channel.name
            }
            return output;
        }

        return 'Impossible de planifier une intervention. Vérifie qu\'il y a du monde dans au moins un channel';
    }

    static start(player) {
        var output = '';
        if (player.started) {
            output += 'Déjà démarré !';
        } else {
            player.start();
            output += 'Démarrage...';
        }

        if (player.target) {
            output += ' Prochaine intervention à ' + player.target.timeoutDate.format('DD/MM/YYYY HH:mm:ss') + ' dans le salon ' + player.target.channel.name;
        } else {
            output += ' Aucune intervention planifiée.';
        }

        return output;
    }

    static stop(player) {
        if (!player.started) {
            return 'Déjà stoppé !';
        }

        player.stop();
        return 'Stoppé';
    }

    static history(player) {
        if (player.history.length === 0) {
            return 'Aucune intervention depuis le lancement du serveur.';
        }
        var history = chunk(player.history, 10);
        var output = ['Les ' + player.history.length + ' dernières interventions : \n```\n' + history[0].join('\n') + '\n```'];
        for (let i = 1; i < history.length; i++) {
            output.push([
                '```\n' + history[i].join('\n') + '\n```'
            ]);
        }
        return output;
    }

    static debug(player, interaction) {
        const userId = interaction.member.user.id;
        const option = interaction.options.get('option');

        if (userId.toString() !== config.get('creatorId')) {
            return 'Seul mon créateur peut accéder à cette commande.';
        }
        if (option && option.value) {
            if (option.value === 'play') {
                player.target.play();
                return 'Forcing the next song to play.';
            } else if (option.value === 'getUserId') {
                return 'Your user id is ' + userId;
            }
        }
        return 'Wrong option';
    }

    static play(player, interaction) {
        var binds = player.cache.pull('binds', {});
        var sounds = player.getSounds().map(sound => sound.replace('.mp3', ''));
        var key = interaction.options.get('key');
        var channel = interaction.options.get('channel');

        if (!key) {
            return 'Usage : /gla play [key]';
        }

        key = key.value;
        if (Object.keys(binds).indexOf(key) < 0) {
            return 'Aucun son associé à '+key+'.';
        } else if (sounds.indexOf(binds[key]) < 0) {
            return 'Le son associé à '+key+' n\'existe plus.';
        }

        var path = player.soundDir + binds[key] + '.mp3';
        if (channel) {
            var ret = player.targetChannel(args[1], path);
        } else {
            var ret = player.targetMember(interaction.member, path);
        }

        if (typeof ret === 'number') {
            if (ret === GuildPlayer.eCantFindMember) {
                return 'Impossible de trouver ' + interaction.member.displayName;
            } else if (ret === GuildPlayer.eChannelPermissions) {
                return 'Permission insufisante pour entrer dans le channel.';
            }
            return 'Code d\'erreur : ' + ret;
        } else {
            return 'Play :hot_face:';
        }
    }

    /**
     *
     * @param {GuildPlayer} player
     * @param {ChatInputCommandInteraction} interaction
     */
    static bind(player, interaction) {
        var binds = player.cache.pull('binds', {});
        var key = interaction.options.get('key');
        var sound = interaction.options.get('sound');
        var message = '';
        var sounds = player.getSounds().map(sound => sound.replace('.mp3', ''));
        if (!key || !sound) {
            return 'Usage : /gla bind [bind_name] [song_name/song_index]';
        }
        sound = sound.value;
        key = key.value;
        if (typeof sounds[sound] !== "string" && sounds.indexOf(sound) < 0) {
            return 'Impossible de trouver le son "'+sound+'". Utiliser la commande `/gla listsongs` pour lister les sons disponnibles';
        }
        if (typeof binds[key] === 'string') {
            message = 'Le bind "'+key+'" a été remplacé avec succès';
        } else {
            message = 'Le bind "'+key+'" a été créé avec succès';
        }

        // Convert the bind by index to a bind by song name
        if (typeof sounds[sound] === "string") {
            sound = sounds[sound];
        }

        binds[key] = sound;
        player.cache.push('binds', binds);

        return message
    }

    /**
     *
     * @param {GuildPlayer} player
     * @param {ChatInputCommandInteraction} interaction
     */
    static unbind(player, interaction) {
        var binds = player.cache.pull('binds', {});
        var key = interaction.options.get('key');
        var message = '';

        if (!key) {
            return 'Usage : /gla unbind [bind_name]';
        }
        key = key.value;

        if (typeof binds[key] === 'string') {
            delete binds[key];
            message = 'Le bind "'+key+'" a été supprimé avec succès';
        } else {
            message = 'Le bind "'+key+'" n\'existe pas';
        }

        player.cache.push('binds', binds);

        return message;
    }

    static listsounds(player, message) {
        var message = 'Liste des sons :\n';
        var sounds = player.getSounds();
        if (sounds.length === 0) {
            return 'Aucun son disponible.';
        }
        for (const key in sounds) {
            if (Object.hasOwnProperty.call(sounds, key)) {
                message += key + ' : ' + sounds[key].replace('.mp3', '') + '\n';
            }
        }

        return message;
    }

    static listbinds(player, message) {
        var message = 'Liste des binds :\n';
        var binds = player.cache.pull('binds', {});
        if (Object.keys(binds).length === 0) {
            return 'Aucun bind n\'a été créé.';
        }
        for (const key in binds) {
            if (Object.hasOwnProperty.call(binds, key)) {
                message += key + ' : ' + binds[key] + '\n';
            }
        }

        return message;
    }
}

module.exports = Command;
