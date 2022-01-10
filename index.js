require('dotenv').config();
global.AbortController = require("abort-controller");
const { default: axios } = require('axios');
const Discord = require('discord.js');
const fs = require('fs');
const { SpotifyManager } = require('./commands/utilities/spotifyAPI');
const prefix = '-'

const client = new Discord.Client({intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_VOICE_STATES]});

client.commands = new Discord.Collection();
client.queues = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter( file => file.endsWith('.js'));

commandFiles.forEach(file => {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
});

client.spotifyHandler = new SpotifyManager();
client.spotifyHandler.getToken();


client.once('ready', ()=>{
    console.log('ready')
})

client.on('messageCreate', message => {

    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const comm = args.shift().toLowerCase();
    const next = args[args.length - 1] === '-n';

    if(comm === 'play' || comm === 'p'){
        client.commands.get('play').execute(message, args, client.queues, client.spotifyHandler, next);
    }
    if(comm === 'pause'){
        client.commands.get('pause').execute(message, args, client.queues);
    }
    if(comm === 'unpause'){
        client.commands.get('unpause').execute(message, args, client.queues);
    }
    if(comm === 'reset'){
        client.commands.get('reset').execute(message, args, client.queues);
    }
    if(comm === 'n' || comm === 'next'){
        client.commands.get('next').execute(message, client.queues);
    }
    if(comm === 'queue' || comm === 'q'){
        client.commands.get('queue').execute(message, args, client.queues);
    }
    if(comm === 'remove' || comm === 'r'){
        client.commands.get('remove').execute(message, args, client.queues);
    }
    if(comm === 'help'){
        client.commands.get('help').execute(message, client.commands);
    }
    if(comm === 'clear'){
        client.commands.get('clear').execute(message, client.queues)
    }
    if(comm === 'back' || comm === 'b'){
        client.commands.get('back').execute(message, client.queues)
    }
    if(comm === 'ly' || comm === 'lyrics'){
        client.commands.get('lyrics').execute(message, client.queues)
    }
    if(comm === 'j' || comm === 'jump'){
        client.commands.get('jump').execute(message, args, client.queues)
    }
    if(comm === 'loop'){
        client.commands.get('loop').execute(message, client.queues)
    }
})

client.login(process.env.CLIENT_LOGIN);