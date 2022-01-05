const { createAudioResource } = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const { createEmbed } = require("./embedMsg");

module.exports = {
    playResource(queue, message){
    let audioPlayer = queue.player;
    let song = queue.queue[queue.position];
    const stream = ytdl(song.resource.url, {filter: 'audioonly', highWaterMark: 1 << 25});
    let res = createAudioResource(stream, {inlineVolume: true});
    res.volume.setVolume(0.2)
    audioPlayer.play(res);
    let msg = createEmbed(song.name, song.resource.thumbnail, "Now Playing", {length: song.resource.timestamp, position: queue.position}, song.resource.url)
    return message.channel.send({embeds: [msg]});
}
}