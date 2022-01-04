const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'reset',
    descrption: 'leaves voice channel \n command: -reset',
    async execute(message, args, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('You can not execute this command outside the voice channel');
        const serverId = voiceChan.guildId;

        const connection = getVoiceConnection(voiceChan.guild.id);
        connection.destroy();
        queues.delete(serverId);

        await message.channel.send('Vemos');
    }
}