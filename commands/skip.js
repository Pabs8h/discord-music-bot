const { createAudioResource } = require("@discordjs/voice");
const ytdl = require('ytdl-core');

module.exports = {
    name: 'next',
    description: 'skips to the next song',
    execute(message, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('`You can not execute this command outside the voice channel`');
        const serverId = voiceChan.guildId;
        
        let queue = queues.get(serverId);

        if(!queue) return message.channel.send('`there is no queue for this server`');

        const playResource = (queue) =>{
            let audioPlayer = queue.player;
            const stream = ytdl(queue.queue[queue.position].resource.url, {filter: 'audioonly', highWaterMark: 1 << 25});
            let res = createAudioResource(stream, {inlineVolume: true});
            res.volume.setVolume(0.2)
            audioPlayer.play(res);
            return message.channel.send('`Now Playing '+queue.queue[queue.position].name+'`');
        }

        queue.position = queue.position + 1;
        if(queue.position >= queue.queue.length){
            queue.position = 0;
            playResource(queue);
        }
        else{
            playResource(queue);
        }
    }
}