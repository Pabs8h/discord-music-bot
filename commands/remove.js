const { Message, Collection } = require("discord.js");
const { createEmbed } = require("./utilities/embedMsg");

module.exports = {
    name: 'remove',
    description: 'removes a song from the queue given a position in the queue. \n command: -remove or -r followed by the position of a song, example: -r 2 removes the second song in the queue.',
    /**
     * removes a song from the queue.
     * @param {Message} message 
     * @param {Array} args 
     * @param {Collection} queues 
     * @returns message
     */
    execute(message, args, queues){

        /**
         * check position and argument conditions.
         */
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('You can not execute this command outside the voice channel');
        const serverId = voiceChan.guildId;
        
        let queue = queues.get(serverId);
        if(!queue) return message.channel.send('there is no queue for this server');

        if(args.length != 1)
            return message.channel.send('please send a valid queue position');

        if(isNaN(args[0]))
            return message.channel.send('please send a valid queue position');

        let remPosition = args[0]

        if(remPosition < 0 || remPosition > queue.queue.length-1)
            return message.channel.send('please send a valid queue position');
        
        if(remPosition == queue.position)
            return message.channel.send('the position cannot be the current song');
        
        let songName = queue.queue[remPosition].name;

        /**
         * if conditions are met, remove song from the given position.
         */
        queue.queue.splice(remPosition, 1);
        if(remPosition < queue.position)
            queue.position -= 1;

        let msg =  createEmbed("", "", songName + " has been removed from the queue", null)
        return message.channel.send({embeds: [msg]});
    }
}