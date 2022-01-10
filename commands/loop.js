const { createEmbed } = require("./utilities/embedMsg");

module.exports = {
    name: "loop",
    description: "sets the queue to loop mode",
    execute(message, queues){
        /**
         * checks conditions to process command. must be in a voice channel and there must be a queue. the queue can be empty.
         */
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('You cannot execute this command outside the voice channel');
        const serverId = voiceChan.guildId;
        
        let serverQueue = queues.get(serverId);
        if(!serverQueue){
            return message.channel.send({embeds: [createEmbed("",null, "There is no queue for this server")]})
        }

        /**
         * sets loop variable to the server queue. 
        */
        serverQueue.loop = !serverQueue.loop;

        if(serverQueue.loop === true)
            return message.channel.send({embeds: [createEmbed("",null, "Queue set to loop mode")]})
        else
            return message.channel.send({embeds: [createEmbed("",null, "Loop mode deactivated")]})
    }
}