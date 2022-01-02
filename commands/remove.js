
module.exports = {
    name: 'remove',
    description: 'removes a song from the queue given the position',
    execute(message, args, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('`You can not execute this command outside the voice channel`');
        const serverId = voiceChan.guildId;
        
        let queue = queues.get(serverId);
        if(!queue) return message.channel.send('`there is no queue for this server`');

        if(args.length != 1)
            return message.channel.send('`please send a valid queue position`');

        if(isNaN(args[0]))
            return message.channel.send('`please send a valid queue position`');

        let remPosition = args[0]

        console.log("remPos: " + remPosition);
        console.log("position queue: " + queue.position);
        if(remPosition < 0 || remPosition > queue.queue.length-1)
            return message.channel.send('`please send a valid queue position`');
        
        if(remPosition == queue.position)
            return message.channel.send('`the position cannot be the current song`');
        
        queue.queue.splice(remPosition, 1);
        if(remPosition < queue.position)
            queue.position -= 1;
        return message.channel.send('`The song has been removed from the queue`');
    }
}