const {AudioPlayerStatus} = require('@discordjs/voice');

module.exports={
    name: 'pause',
    description: 'pauses the current song \n command: -pause',
    execute(message, args, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('`You can not execute this command outside the voice channel`');
        const serverId = voiceChan.guildId;
        
        let queue = queues.get(serverId);
        if(queue.player.state.status !== AudioPlayerStatus.Playing)
            return message.channel.send('There is no song playing at the moment');

        queue.player.pause();
    }
}