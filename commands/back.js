const { createEmbed } = require("./utilities/embedMsg");
const { playResource } = require("./utilities/music");

module.exports = {
    name: "back",
    description: "goes back to the previous song \n Command: -back or -b",
    execute(message, queues){

        /**
         * Check conditions to process command correctly, must be in a voice channel and there must be a queue for the server
        */
        const voiceChan = message.member.voice.channel;
        
        if(!voiceChan) return message.channel.send('You need to be in a voice channel to execute this command');

        let serverQueue = queues.get(voiceChan.guildId);
        if(!serverQueue) return message.channel.send({embeds:[createEmbed(null,null, "There is no active queue for the server")]});

        /**
         * either goes back a song or sends a message saying that it cant go back, due to reasons like there not being a song to go back to
         */
        if(serverQueue.position > 0 && serverQueue.queue.length >= 2)
            try{
                serverQueue.position -= 1;
                playResource(serverQueue, message);
            }
            catch{
                return message.channel.send({embeds:[createEmbed(null,null, "An error has ocurred trying to go back to the previous song")]});
            }
        else{
            return message.channel.send({embeds:[createEmbed(null,null, "Can't go back")]});
        }
    }
}