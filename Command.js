const {chunk} = require('./utils.js');

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
        // 'log': 'Display debug logs',
    }

    static usage = 'Usage: !gla [command] [options]...\n';

    static exec(commandStr, player, message) {
        var match = commandStr.match(/!gla\s*([a-zA-Z]+)\s*(.*)/);
        var args = [];

        // Check if the command line is valid
        if (match === null || typeof match[1] === 'undefined' || typeof this.commands[match[1]] === 'undefined') {
            this.displayBadCommand(message.channel);
            return;
        }

        // Extract strings
        if (typeof match[2] !== 'undefined') {
            args = match[2];
            var stringArgs = args.match(/("|')((?:\\\1|(?:(?!\1).))*)\1/g);
            if (stringArgs) {
                for (var i = 0; i < stringArgs.length; i++) {
                    args.replace(stringArgs, '');
                }
            } else {
                stringArgs = [];
            }

            args = args.split(' ').map(s => s.trim()).filter(s => s.length > 0).concat(stringArgs);
        }
        // Call the function of the command
        var output = this[match[1]](player, message, args);
        if (typeof output === 'string' && output.length > 0) {
            message.channel.send(output);
        } else if (typeof output === 'object' && Array.isArray(output) && output.length > 0) {
            for (let i = 0; i < output.length; i++) {
                message.channel.send(output[i]);
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

    static test(player, message) {
        player.targetMember(message.member);
        return 'Test :sweat_drops:';
    }

    static next(player, message) {
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
        var history = chunk(player.history, 15);
        var output = ['Les ' + player.history.length + ' dernières interventions : \n```\n' + history[0].join('\n') + '\n```'];
        for (let i = 1; i < history.length; i++) {
            output.push([
                '```\n' + history[i].join('\n') + '\n```'
            ]);
        }
        return output;
    }
}

module.exports = Command;
