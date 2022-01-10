const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const axios = require('axios').default;
const { createEmbed } = require('./utilities/embedMsg');
const { Message, Collection } = require('discord.js');
const { SpotifyManager } = require('./utilities/spotifyAPI');


module.exports = {
    name: 'play',
    description: 'joins channel to play music, adds a song to the end of the queue or after the current song \n command: -p or -play followed by url or song name',
    /**
     * plays a song or only adds it to the queue.
     * @param {Message} message 
     * @param {Array} args 
     * @param {Collection} queues 
     * @param {SpotifyManager} spotifyHandler 
     * @param {boolean} next 
     * @returns message
     */
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
        let connection;
        let timeout;

        /**
         * check if a queue for the server exists.
         * if it does then check if it is playing, to determine if it should just add to queue or also play it. also sets some local variables like player and timeout.
         * if there is no queue then join the voice channel of the user, create an audio player, create server object to store in queues collection and subscribe
         * connection to player.
         */
        if(serverQueue){
            if(serverQueue.player.state.status === AudioPlayerStatus.Playing)
                isIdle = false;
            else if((serverQueue.position >= serverQueue.queue.length) || serverQueue.queue.length === 0)
                isIdle = true;
            player = serverQueue.player;

            timeout = serverQueue.timeout?serverQueue.timeout:undefined;
        }
        else{
            connection = joinVoiceChannel({
                channelId: voiceChan.id,
                guildId: voiceChan.guild.id,
                adapterCreator: voiceChan.guild.voiceAdapterCreator,
            });
            player = createAudioPlayer();
            queues.set(serverId, {
                connection: connection,
                voiceChannel: voiceChan.id,
                player: player,
                position: 0,
                queue: [],
                loop: false,
            });
            firstComm = true;
            connection.subscribe(player);
            serverQueue = queues.get(serverId);
            isIdle = true;
        }

        /**
         * checks if a url is valid.
         * @param {String} str url
         * @returns true if valid, false if not.
         */
        const validURL = (str) =>{
            var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
            if(!regex.test(str)){
                return false;
            } else {
                return true;
            }
        }

        /**
         * plays a song and resets disconnection timeout if necessary.
         * @param {Object} song 
         * @returns message of song playing.
         */
        const playSong = (song) => {
            if(timeout)
                clearTimeout(timeout);
            const stream = ytdl(song.url, {filter: 'audioonly', highWaterMark: 1 << 25});
            let resourceToPlay = createAudioResource(stream, {inlineVolume: true});
            resourceToPlay.volume.setVolume(0.2);
            player.play(resourceToPlay);
            let msg = createEmbed(song.title, song.thumbnail, "Now Playing", {length: song.timestamp, position: serverQueue.position}, song.url)
            return message.channel.send({embeds: [msg]});
        }

        /**
         * plays the queue if there is nothing playing.
         * @param {Object} audioObj 
         */
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

        /**
         * depending on the type of spotify url entered by the user, it executes the correct method to process it.
         * @param {String} str url entered by user.
         */
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

        /**
         * processes all songs from a spotify playlist or album.
         * @param {String} id album or playlist id 
         * @param {boolean} playlist determines if the url should be for albums or playlysts.
         * @returns message
         */
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
                for (const element of songs) {                    
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
                }
                
            }
            catch(e){
                console.log(e)
                message.channel.send("An error has ocurred, please check the url");
            };
        }

        /**
         * processes a song from spotify.
         * @param {String} id song id 
         * @returns message
         */
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

        /**
         * gets the next song in the queue.
         * @returns null or a song(resource to play).
         */
        const getNextSong = () => {
            serverQueue.position += 1;
            if(serverQueue.position >= serverQueue.queue.length){
                if(serverQueue.loop && serverQueue.queue.length > 0){
                    serverQueue.position = 0;
                    return serverQueue.queue[serverQueue.position]
                }
                else
                    return null
            }
            return serverQueue.queue[serverQueue.position];
        }

        /**
         * searches on youtube.
         * @param {String} query 
         * @returns info from the video that resulted from the search.
         */
        const videoFinder = async (query) => {
            const videoResult = await ytSearch(query);
            return (videoResult.videos.length > 1) ? videoResult.videos[0]:null;
        }

        /**
         * adds a new song to the queue.
         * @param {Object} video 
         * @returns message
         */
        const addToQueue = (video) => {
            let nextPosition;
            if(next && serverQueue.queue.length >= 1 && serverQueue.position+1 <= serverQueue.queue.length)
                nextPosition = serverQueue.position + 1;
            else
                nextPosition = serverQueue.queue.length;
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

        /**
         * checks if the argument is a url or words.
         * if its a url it processes spotify and youtube separately.
         * if its a normal query of words, it searches youtube, adds to queue and plays the song if there is nothing playing.
         */

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

        /**
         * Event listener created only the first time.
         * responsible for playing the next song on the queue when the current one ends.
         * timeout if there are no songs left.
         * disconnects from voice channel if there are no people connected.
         */
        if(firstComm){
            player.on(AudioPlayerStatus.Idle, () => {
                if(voiceChan.members.size === 1){
                    connection.destroy();
                    queues.delete(serverId);
                    return message.channel.send("I left the voice channel because it was empty");;
                }
                let nextSong = getNextSong();
                if(nextSong !== null){
                    try{
                        playSong(nextSong.resource);
                    }
                    catch(e){
                        console.log(e);
                    }
                }
                else{
                    timeout = setTimeout(()=>{
                        connection.destroy();
                        queues.delete(serverId);
                    }, 300000)

                    serverQueue.timeout = timeout;
                }
            });
        }

    }
}