const { MessageEmbed } = require("discord.js")


module.exports={
    createEmbed(title, image, description, songInfo, url, extraFields){
        let songFields = []
        if(songInfo){
            songFields.push({
                name: "Length", value: songInfo.length + "\n", inline: true
            },
            {
                name: "Position", value: songInfo.position + "\n", inline: true
            })
        }

        if(extraFields){
            for (const key in extraFields) {
                songFields.push({
                    name: key,
                    value: extraFields[key] + "\n",
                })
            }
        }

        let msg = new MessageEmbed({
            title: title,
            url: url,
            description: description,
            thumbnail:{
                url: image?image:''
            },
            fields: songFields,
            color: "PURPLE"
        });

        return msg;
    }
}