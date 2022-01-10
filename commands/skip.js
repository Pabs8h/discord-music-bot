const { createAudioResource } = require("@discordjs/voice");
const ytdl = require('ytdl-core');
const { createEmbed } = require("./utilities/embedMsg");

module.exports = {
    name: 'next',
    description: 'skips to the next song \n command: -n or -next',
    execute(message, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('`You can not execute this command outside the voice channel`');
        const serverId = voiceChan.guildId;
        
        let queue = queues.get(serverId);
        if(!queue) return message.channel.send('there is no queue for this server');
        if(queue.queue.length === 0) {
            queue.player.stop();
            return message.channel.send({embeds:[createEmbed(null, null, 'The queue is empty', null)]});
        }

        const playResource = (queue) =>{
            try{
                let audioPlayer = queue.player;
                let song = queue.queue[queue.position];
                const stream = ytdl(song.resource.url, {filter: 'audioonly', highWaterMark: 1 << 25});
                let res = createAudioResource(stream, {inlineVolume: true});
                res.volume.setVolume(0.2)
                audioPlayer.play(res);
                let msg = createEmbed(song.name, song.resource.thumbnail, "Now Playing", {length: song.resource.timestamp, position: queue.position}, song.resource.url)
                return message.channel.send({embeds: [msg]});
            }
            catch{
                let msg = createEmbed("Error", null, "An error has ocurred")
                return message.channel.send({embeds: [msg]});
            }
        }

        if(queue.position + 1 > queue.queue.length || (queue.position + 1 === queue.queue.length && queue.loop)){
            queue.position = 0;
            playResource(queue);
        }
        else if(queue.position + 1 < queue.queue.length){
            queue.position = queue.position + 1;
            playResource(queue);
        }
        else{
            queue.player.stop()
        }
    }
}