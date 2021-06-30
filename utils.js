const {Guild} = require('discord.js');

module.exports = {
    findPlayerByGuild: (guild, players) => {
        var id = guild;
        if (typeof guild === 'object' && typeof guild.id !== 'undefined') {
            id = guild.id
        }

        for (var i = 0; i < players.length; i++) {
            // Remove players attached to the guild
            if (id === players[i].guild.id) {
                return players[i];
            }
        }
    },

    random: (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min;
    },

    empty: (value) => {
        if (typeof value === 'string' && value === '') {
            return true;
        }
        return typeof value === 'undefined' || value === null || value === false || value === 0;
    },

    chunk: (array, chunkSize) => {
        var i, j;
        var temparray = [];
        for (i=0 , j = array.length; i < j; i += chunkSize) {
            temparray.push(array.slice(i, i+chunkSize));
        }
        return temparray;
    }
}
