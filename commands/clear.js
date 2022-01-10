const { createEmbed } = require("./utilities/embedMsg");

module.exports = {
    name: 'clear',
    description: 'removes all the songs from the queue \n command: -clear',
    execute(message, queues){

        /**
         * check conditions to process command.
         */
        const voiceChan = message.member.voice.channel;
        
        if(!voiceChan) return message.channel.send('You need to be in a voice channel to execute this command');
        const serverId = voiceChan.guildId;
        let queue = queues.get(serverId);

        if(!queue) return message.channel.send({embeds: [createEmbed("",null, "There is no queue for this server", null, null)]})

        if(queue.queue.length === 0) return message.channel.send({embeds: [createEmbed("",null, "The queue is already empty", null, null)]})

        /**
         * empties queue and makes position -1 so that when there is a next song, it starts again at position 0
         */
        queue.queue = [];
        queue.position = -1;
        message.channel.send({embeds: [createEmbed("",null, "The queue has been cleared", null, null)]});
    }
}