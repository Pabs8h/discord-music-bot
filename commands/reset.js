const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'reset',
    description: 'leaves voice channel \n command: -reset',
    async execute(message, args, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('You need to be in a voice channel to execute this command');
        const serverId = voiceChan.guildId;

        const connection = getVoiceConnection(voiceChan.guild.id);
        connection.destroy();
        queues.delete(serverId);

        await message.channel.send('Vemos');
    }
}