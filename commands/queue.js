const { MessageActionRow, MessageButton, Message, Collection, Interaction } = require("discord.js");
const { createEmbed } = require("./utilities/embedMsg");

module.exports = {
    name: 'queue',
    description: 'shows the queue for the server \n command: -q or -queue',
    /**
     * Shows the queue of the server.
     * @param {Message} message 
     * @param {Collection} queues 
     * @returns message with queue.
     */
    execute(message, queues){
        const voiceChan = message.member.voice.channel;
        const serverId = voiceChan.guildId;
        if(!voiceChan) return message.channel.send('You can not execute this command outside the voice channel');
        
        let queue = queues.get(serverId);

        if(!queue) return message.channel.send('there is no queue for this server');

        if(queue.queue.length === 0) return message.channel.send('The Queue is empty');

        let queueString = "";

        let pos = queue.position;
        let max = pos + 10;

        /**
         * creates a String containing a section from the queue given 2 positions.
         * @param {Number} start position of the current queue page 
         * @param {Number} end position of the current queue page
         * @returns String containing a section from the queue given the start and end positions.
         */
        const getQueuePage = (start, end) => {
            let page = "";
            let pos1 = start;
            let max1 = end;

            if(queue.queue.length === 0)
                return "Queue is empty";

            if(end > queue.queue.length){
                pos1 = queue.queue.length-10 < 0?0:queue.queue.length-10;
                max1 = queue.queue.length;
            }
    
            while(pos1 < max1 && pos1 < queue.queue.length){
                page += pos1 + ". " +queue.queue[pos1].name + "\n";
                pos1++;
            }
    
            if(max1 < queue.queue.length){
                page += "... \n";
                page += "and " + (queue.queue.length-max1 + 1) + " more"
            }
    
            page += "\n"
            return page;
        }

        queueString = getQueuePage(pos, max);

        /**
         * create action row of pagination buttons.
         */
        const actionRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('prevPage')
                .setEmoji('◀️')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('nextPage')
                .setEmoji('▶️')
                .setStyle('SECONDARY'),
        )

        /**
         * filter for button interactions
         * @param {Interaction} interaction 
         * @returns filter for pagination button interacions.
         */
        const filter = (interaction) => {
            if(!interaction.member.voice.channel){
                return interaction.reply({content: "you need to be listening to the bot to press this button"});
            }
            if(interaction.member.voice.channel.id === queue.voiceChannel) return true;
            return interaction.reply({content: "you need to be listening to the bot to press this button"}); 
        }

        const collector = message.channel.createMessageComponentCollector({
            filter,
            dispose: true
        })


        /**
         * Button collector listener, will change current queue section or page depending on which button was pressed
         */
        collector.on('collect', (i)=>{
            if(i.customId === 'prevPage'){
                pos = pos-10 <= 0?0:pos-10;
                max = pos+10;
                let newPage = getQueuePage(pos, max);
                let msg = createEmbed("Queue", null, newPage, null);
                i.update({embeds: [msg]})
            }
            else if(i.customId=== 'nextPage'){
                pos = pos+10 >= queue.queue.length?pos:pos+10;
                max = pos+10;
                let newPage = getQueuePage(pos, max);
                let msg = createEmbed("Queue", null, newPage, null);
                i.update({embeds: [msg]})
            }
        })
        
        collector.on('end', i =>{
            console.log("ended")
        })

        /**
         * if there is a new queue message after one was already called
         * stops the last message component collector that is used for the buttons
         * deletes las message that contained the queue.
         */
        if(queue.lastQueueMessage){
            queue.lastQueueMessage.cl.stop()
            queue.lastQueueMessage.ms.delete()
        }

        /**
         * sends the message that contains the queue.
         * saves the message that was sent on the server queue object, so that next time the command is used the last message containing the queue is deleted.
         */
        let msg = createEmbed("Queue", null, queueString, null);
        message.channel.send({embeds: [msg], components:[actionRow]})
        .then((sentMessage)=>{
            queue.lastQueueMessage = {ms: sentMessage, cl:collector};
        });
    }
}