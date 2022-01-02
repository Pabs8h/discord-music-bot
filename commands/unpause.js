module.exports={
    name: 'unpause',
    description: 'unpauses the current song',
    execute(message, args, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('`You can not execute this command outside the voice channel`');
        const serverId = voiceChan.guildId;
        
        let queue = queues.get(serverId);

        let successful = queue.player.unpause();

        if(!successful)
            return message.channel.send('`There is no song to unpause`');
    }
}