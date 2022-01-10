const { MessageEmbed } = require("discord.js")


module.exports={
    /**
     * Function to create Embed given the info required to create it.
     * @param {String} title title for the embed
     * @param {String} image thumbnail url for the embed
     * @param {String} description description of the embed
     * @param {Object} songInfo Object containing length and position of the current song if embed is for "playing song" message
     * @param {String} url url to click on the embed
     * @param {Object} extraFields Object with any extra fields.
     * @returns MessageEmbed
     */
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