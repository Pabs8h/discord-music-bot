const { getVoiceConnection } = require('@discordjs/voice');
const { Message, Collection } = require('discord.js');

module.exports = {
    name: 'reset',
    description: 'leaves voice channel \n command: -reset',
    /**
     * Disconnects from the voice channel and resets server queue.
     * @param {Message} message 
     * @param {Collection} queues 
     * @returns Goodbye Message.
     */
    async execute(message, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('You need to be in a voice channel to execute this command');
        const serverId = voiceChan.guildId;

        const connection = getVoiceConnection(voiceChan.guild.id);
        connection.destroy();
        queues.delete(serverId);

        await message.channel.send('Vemos');
    }
}