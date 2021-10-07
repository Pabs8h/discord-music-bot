require('dotenv').config();
const { default: axios } = require('axios');
const Discord = require('discord.js');
const fs = require('fs');
const { URLSearchParams } = require('url');
const prefix = '-'

const client = new Discord.Client({intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_VOICE_STATES]});

client.commands = new Discord.Collection();
client.queues = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter( file => file.endsWith('.js'));

commandFiles.forEach(file => {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
});

let spotifyParams = process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_SECRET;

let buff = Buffer.from(spotifyParams, "utf-8");
let authHeader = "Basic " + buff.toString("base64");

const paramData = new URLSearchParams();
paramData.append('grant_type', 'client_credentials');
axios.post('https://accounts.spotify.com/api/token', paramData ,{headers:{"Authorization": authHeader, "Content-Type" : "application/x-www-form-urlencoded"}})
.then((resp)=>{
    client.spotifyToken = resp.data.access_token;
})


client.once('ready', ()=>{
    console.log('ready')
})

client.on('message', message => {

    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const comm = args.shift().toLowerCase();

    if(comm === 'play' || comm === 'p'){
        client.commands.get('play').execute(message, args, client.queues, client.spotifyToken);
    }
    if(comm === 'reset'){
        client.commands.get('reset').execute(message, args, client.queues);
    }
    if(comm === 'n' || comm === 'next'){
        client.commands.get('next').execute(message, args, client.queues);
    }
    if(comm === 'queue' || comm === 'q'){
        client.commands.get('queue').execute(message, args, client.queues);
    }
})

client.login(process.env.CLIENT_LOGIN);