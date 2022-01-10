const { Message, Collection } = require("discord.js");
const { createEmbed } = require("./utilities/embedMsg");

module.exports={
    name: 'unpause',
    description: 'unpauses the current song \n command: -unpause',
    /**
     * Unpauses a song if there is one currently paused.
     * @param {Message} message 
     * @param {Collection} queues 
     * @returns Reply message.
     */
    execute(message, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('`You can not execute this command outside the voice channel`');
        const serverId = voiceChan.guildId;
        
        let queue = queues.get(serverId);

        if(!queue) return message.channel.send('there is no song to unpause');

        let successful = queue.player.unpause();

        if(!successful){
            let msg = createEmbed("",null, "There is no song to unpause", null)
            return message.channel.send({embeds: [msg]});
        }
    }
}