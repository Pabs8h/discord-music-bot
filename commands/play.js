const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const axios = require('axios').default;


module.exports = {
    name: 'play',
    description: 'joins channel to play music',
    async execute(message, args, queues, spoToken) {

        const voiceChan = message.member.voice.channel;
        const serverId = voiceChan.guildId;
        
        if(!voiceChan) return message.channel.send("You need to be in a voice channel to execute this command");
        const permissions = voiceChan.permissionsFor(message.client.user);
        if(!permissions.has('CONNECT')) return message.channel.send('You dont have the correct permissions');
        if(!permissions.has('SPEAK')) return message.channel.send('You dont have the correct permissions');
        if(!args.length) return message.channel.send('You need to specify a song');

        let serverQueue = queues.get(serverId);
        let isIdle = false;
        let player;

        const connection = joinVoiceChannel({
            channelId: voiceChan.id,
            guildId: voiceChan.guild.id,
            adapterCreator: voiceChan.guild.voiceAdapterCreator,
        });

        if(serverQueue){
            if(serverQueue.position >= serverQueue.queue.length)
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

        const playQueue = (audioObj) => {
            if(isIdle){
                let song;
                if(audioObj.song)
                    song = audioObj.song;
                else if(audioObj.list)
                    song = audioObj.list[0].resource;

                const stream = ytdl(song.url, {filter: 'audioonly', highWaterMark: 1 << 25});
                let resourceNext = createAudioResource(stream, {inlineVolume: true});
                resourceNext.volume.setVolume(0.2)
                serverQueue.player.play(resourceNext);
                message.channel.send("`Now Playing ------ "+ song.title + "`");
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
            let resp = await axios.get(spotUrl, {headers: {"Authorization": `Bearer ${spoToken}`}})
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
                    addToQueue(video);
                    if(!play){
                        play = true;
                        playQueue({song: video});
                    }
                    // console.log(element);
                });
            }
            catch(e){
                console.log(e)
                message.channel.send("An error has ocurred, please check the url");
            };
        }

        const spotifySong = async (id) => {
            let urlSong = `https://api.spotify.com/v1/tracks/${id}`
            let response = await axios.get(urlSong, {headers: {"Authorization": `Bearer ${spoToken}`}})
            let query = response.data.name + " " + response.data.artists[0].name;
            let video = await videoFinder(query);

            let success = addToQueue(video); 
            if(!success)
                message.channel.send("`No video was found for the song " + response.data.name + "`");
            else{
                playQueue({song: video})
            }
        }

        const getNextSong = () => {
            // let serverQueue = queues.get(serverId);
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
            if(video){
                serverQueue.queue.push({
                    name: video.title,
                    resource: video,
                });
                if(!isIdle)
                    message.channel.send("`" + video.title + " was added to the queue`")
                
                return true;
            }
            return false;
        }

        let video;

        if(validURL(args[0]))
            if(args[0].startsWith("https://open.spotify.com/"))
                spotifyUrl(args[0]);
            else{
                video = {title: args[0], url: args[0]}
                addToQueue(video);
                playQueue({song:video});
            }
        else{
            video = await videoFinder(args.join(' '));
            if(video){
                addToQueue(video);
                playQueue({song: video});
            }
            else
                message.channel.send("`No results found`");
        }

        player.on(AudioPlayerStatus.Idle, () => {
            let nextSong = getNextSong();
            if(nextSong !== null){
                try{
                const stream = ytdl(nextSong.resource.url, {filter: 'audioonly', highWaterMark: 1 << 25});
                let resourceNext = createAudioResource(stream, {inlineVolume: true});
                // console.log(resourceNext);
                resourceNext.volume.setVolume(0.2)
                player.play(resourceNext);
                message.channel.send("`Now Playing ------ "+ nextSong.name + "`");
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