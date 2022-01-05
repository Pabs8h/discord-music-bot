const { createEmbed } = require("./utilities/embedMsg");

module.exports = {
    name: 'queue',
    description: 'shows the queue for the server \n command: -q or -queue',
    execute(message, args, queues){
        const voiceChan = message.member.voice.channel;
        const serverId = voiceChan.guildId;
        if(!voiceChan) return message.channel.send('You can not execute this command outside the voice channel');
        
        let queue = queues.get(serverId);

        if(!queue) return message.channel.send('there is no queue for this server');

        let queueString = "";

        let pos = queue.position;
        let max = pos + 10;

        if(queue.position + 10 > queue.queue.length){
            pos = queue.queue.length-10 < 0?0:queue.queue.length-10;
            max = queue.queue.length;
        }

        while(pos < max && pos < queue.queue.length){
            queueString += pos + ". " +queue.queue[pos].name + "\n";
            pos++;
        }

        if(max < queue.queue.length){
            queueString += "... \n";
            queueString += "and " + (queue.queue.length-max + 1) + " more"
        }

        queueString += "\n"

        let msg = createEmbed("Queue", null, queueString, null);
        return message.channel.send({embeds: [msg]});
    }
}