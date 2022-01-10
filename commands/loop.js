const { createEmbed } = require("./utilities/embedMsg");

module.exports = {
    name: "loop",
    description: "sets the queue to loop mode",
    execute(message, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('`You can not execute this command outside the voice channel`');
        const serverId = voiceChan.guildId;
        
        let serverQueue = queues.get(serverId);
        if(!serverQueue){
            return message.channel.send({embeds: [createEmbed("",null, "There is no queue for this server")]})
        }

        serverQueue.loop = !serverQueue.loop;

        if(serverQueue.loop === true)
            return message.channel.send({embeds: [createEmbed("",null, "Queue set to loop mode")]})
        else
            return message.channel.send({embeds: [createEmbed("",null, "Loop mode deactivated")]})
    }
}