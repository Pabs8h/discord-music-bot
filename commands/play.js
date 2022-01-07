const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const axios = require('axios').default;
const { createEmbed } = require('./utilities/embedMsg');


module.exports = {
    name: 'play',
    description: 'joins channel to play music, adds a song to the end of the queue or after the current song \n command: -p or -play followed by url or song name',
    async execute(message, args, queues, spotifyHandler, next) {

        const voiceChan = message.member.voice.channel;
        
        if(!voiceChan) return message.channel.send('You need to be in a voice channel to execute this command');
        const permissions = voiceChan.permissionsFor(message.client.user);

        if(!permissions.has('CONNECT')) return message.channel.send('You dont have the correct permissions');
        if(!permissions.has('SPEAK')) return message.channel.send('You dont have the correct permissions');

        if(!args.length) return message.channel.send('You need to specify a song');
        
        const serverId = voiceChan.guildId;

        let serverQueue = queues.get(serverId);
        let isIdle = false;
        let player;
        let firstComm = false;

        const connection = joinVoiceChannel({
            channelId: voiceChan.id,
            guildId: voiceChan.guild.id,
            adapterCreator: voiceChan.guild.voiceAdapterCreator,
        });

        if(serverQueue){
            if(serverQueue.player.state.status === AudioPlayerStatus.Playing)
                isIdle = false;
            else if((serverQueue.position >= serverQueue.queue.length) || serverQueue.queue.length === 0)
                isIdle = true;
            player = serverQueue.player;
        }
        else{
            player = createAudioPlayer();
            queues.set(serverId, {
                player: player,
                position: 0,
                queue: [],
            });
            firstComm = true;
            connection.subscribe(player);
            serverQueue = queues.get(serverId);
            isIdle = true;
        }

        const validURL = (str) =>{
            var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
            if(!regex.test(str)){
                return false;
            } else {
                return true;
            }
        }

        const playSong = (song) => {
            const stream = ytdl(song.url, {filter: 'audioonly', highWaterMark: 1 << 25});
            let resourceToPlay = createAudioResource(stream, {inlineVolume: true});
            resourceToPlay.volume.setVolume(0.2);
            player.play(resourceToPlay);
            let msg = createEmbed(song.title, song.thumbnail, "Now Playing", {length: song.timestamp, position: serverQueue.position}, song.url)
            return message.channel.send({embeds: [msg]});
        }

        const playQueue = (audioObj) => {
            if(isIdle){
                let song;
                if(audioObj.song)
                    song = audioObj.song;
                else if(audioObj.list)
                    song = audioObj.list[0].resource;

                playSong(song);
            }
        }

        const spotifyUrl = (str) => {
            let strParts = str.split("/");
            let id = strParts[strParts.length-1].split("?")[0];
            
            if(str.startsWith("https://open.spotify.com/playlist/")){
                spotifyPlaylistAlbum(id, true);
            }
            else if(str.startsWith("https://open.spotify.com/track/")){
                spotifySong(id);
            }
            else if(str.startsWith("https://open.spotify.com/album/")){
                spotifyPlaylistAlbum(id, false);
            }
            else
                message.channel.send("`Please provide a valid spotify link`")
        }

        const spotifyPlaylistAlbum = async (id, playlist) => {
            let spotUrl = "";
            spotUrl = playlist?`https://api.spotify.com/v1/playlists/${id}/tracks`:`https://api.spotify.com/v1/albums/${id}/tracks`; 
            
            try{
                let resp = await spotifyHandler.handleRequest(spotUrl);
                if(resp.error){
                    return message.channel.send({embeds: [createEmbed("Error",null, resp.error)]})
                }
                let json = resp.data;
                let songs = json.items;
                let play = false;
                songs.forEach(async element => {
                        let info = "";
                        if(playlist)
                            info = element.track.name + " " + element.track.artists[0].name;
                        else
                            info = element.name + " " + element.artists[0].name
                        let video = await videoFinder(info);
                        video.title = info;
                        addToQueue(video);
                        if(!play){
                            play = true;
                            playQueue({song: video});
                        }
                    });
                }
            catch(e){
                console.log(e)
                message.channel.send("An error has ocurred, please check the url");
            };
        }

        const spotifySong = async (id) => {
            let urlSong = `https://api.spotify.com/v1/tracks/${id}`
            let response = await spotifyHandler.handleRequest(urlSong);
            if(response.error){
                return message.channel.send({embeds: [createEmbed("Error",null, response.error)]})
            }
            let query = response.data.name + " " + response.data.artists[0].name;
            let video = await videoFinder(query);
            video.title = query;

            let success = addToQueue(video); 
            if(!success)
                message.channel.send("`No video was found for the song " + response.data.name + "`");
            else{
                playQueue({song: video})
            }
        }

        const getNextSong = () => {
            serverQueue.position += 1;
            if(serverQueue.position >= serverQueue.queue.length)
                return null
            return serverQueue.queue[serverQueue.position];
        }

        const videoFinder = async (query) => {
            const videoResult = await ytSearch(query);
            return (videoResult.videos.length > 1) ? videoResult.videos[0]:null;
        }

        const addToQueue = (video) => {
            let nextPosition = next?serverQueue.position + 1:serverQueue.queue.length;
            if(video){
                if(next){
                    serverQueue.queue.splice(nextPosition, 0, {
                        name: video.title,
                        resource: video,
                    });
                }
                else{
                    serverQueue.queue.push({
                        name: video.title,
                        resource: video,
                    });
                }
                if(!isIdle)
                {
                    let msg = createEmbed("Added to the queue", video.thumbnail, video.title, {length: video.timestamp, position: nextPosition}, video.url)
                    message.channel.send({embeds: [msg]})
                }
                
                return true;
            }
            return false;
        }


        let video;

        if(validURL(args[0]))
            if(args[0].startsWith("https://open.spotify.com/"))
                spotifyUrl(args[0]);
            else{
                let info = await ytdl.getBasicInfo(args[0]);
                let len = parseInt(info.videoDetails.lengthSeconds);
                let timeString = "";
                let leadingC = "";
                let hours = len/3600 >= 1?Math.floor(len/3600):0;
                if(hours == 0)
                    timeString += "";
                else{
                    timeString += hours+":"
                    leadingC = "0";
                }
                let min = (len-(3600*hours))/60 >=1?Math.floor((len-(3600*hours))/60):0;
                timeString += (min < 10?leadingC+min:min) + ":";
                let seconds = (len-(min*60)-(3600*hours));
                timeString += seconds >= 10?seconds.toString():"0"+ seconds.toString();

                let videoDetails = info.videoDetails;
                let videoTitle = videoDetails.title;
                if(videoDetails.media.song){
                    videoTitle = videoDetails.media.song + " " + (videoDetails.media.artist?videoDetails.media.artist:"");
                }

                video = {title: videoTitle, url: args[0], thumbnail: info.videoDetails.thumbnails[0].url, timestamp: timeString}
                addToQueue(video);
                playQueue({song:video});
            }
        else{
            video = await videoFinder(args.join(' '));
            if(video){
                let info = await ytdl.getBasicInfo(video.url);
                let videoDetails = info.videoDetails;
                if(videoDetails.media.song){
                    video.title = videoDetails.media.song + " " + (videoDetails.media.artist?videoDetails.media.artist:"");
                }
                addToQueue(video);
                playQueue({song: video});
            }
            else
                message.channel.send("`No results found`");
        }

        if(firstComm){
            player.on(AudioPlayerStatus.Idle, () => {
                let nextSong = getNextSong();
                if(nextSong !== null){
                    try{
                        playSong(nextSong.resource);
                    }
                    catch(e){
                        console.log(e);
                    }
                }
                else
                    message.channel.send("`No more songs left on the Queue`");
            });
        }

    }
}