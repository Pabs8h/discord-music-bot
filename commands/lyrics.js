const { AudioPlayerStatus } = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const { createEmbed } = require("./utilities/embedMsg");
const { getLyrics } = require("./utilities/lyricsScraping");

module.exports={
    name: 'lyrics',
    description: 'Search for the lyrics of the song thats currently playing \n -ly or -lyrics',
    async execute(message, queues){
        const voiceChan = message.member.voice.channel;
        if(!voiceChan) return message.channel.send('You need to be in a voice channel to execute this command');
        
        let serverQueue = queues.get(voiceChan.guildId);
        if(!serverQueue){
            return message.channel.send({embeds: [createEmbed("", null, "music has to be playing")]});
        }

        if(serverQueue.player.state.status !== AudioPlayerStatus.Playing){
            return message.channel.send({embeds: [createEmbed("", null, "music has to be playing")]});
        }

        let song = serverQueue.queue[serverQueue.position];

        let songName = song.name;
        
        let lyrics = await getLyrics(songName);
        if(lyrics.error){
            let info = await ytdl.getBasicInfo(song.resource.url);
            let videoDetails = info.videoDetails;
            if(!videoDetails.media.song)
                lyrics.message = "Could not get lyrics";
            else{
                songName = videoDetails.media.song + " " + (videoDetails.media.artist?videoDetails.media.artist:"");
                lyrics = await getLyrics(songName);
            }
        }
        
        message.channel.send({embeds: [createEmbed(songName + " Lyrics", null, lyrics.message)]})
        .catch((error)=>{
            message.channel.send({embeds: [createEmbed(songName + " Lyrics", null, "Could not get lyrics")]})
        })
        
    }
}