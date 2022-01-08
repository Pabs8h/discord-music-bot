const { playResource } = require("./utilities/music");

module.exports = {
    name: "jump",
    description: "jump to a position on the queue \n Command: -j or -jump <Position in the queue>",
    execute(message, args, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('You can not execute this command outside the voice channel');
        const serverId = voiceChan.guildId;
        
        let queue = queues.get(serverId);
        if(!queue) return message.channel.send('there is no queue for this server');

        if(args.length != 1)
            return message.channel.send('please send a valid queue position');

        if(isNaN(args[0]))
            return message.channel.send('please send a valid queue position');

        let jumpPosition = args[0]

        if(jumpPosition < 0 || jumpPosition > queue.queue.length-1)
            return message.channel.send('please send a valid queue position');
        
        if(jumpPosition == queue.position)
            return message.channel.send('the position cannot be the current song');
        
        try{
            queue.position = parseInt(jumpPosition);
            playResource(queue, message)
        }
        catch(error){
            let msg =  createEmbed("Error", "", "An error has ocurred")
            return message.channel.send({embeds: [msg]});
        }
    }
}