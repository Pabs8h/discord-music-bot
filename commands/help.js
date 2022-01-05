const { createEmbed } = require("./utilities/embedMsg")
const pause = require("./pause")
const play = require("./play")
const queue = require("./queue")
const remove = require("./remove")
const reset = require("./reset")
const skip = require("./skip")
const unpause = require("./unpause")

module.exports={
    name: "help",
    description: "shows all available commands",
    execute(message){
        let comms = {
            play: play.description,
            pause: pause.description,
            unpause: unpause.description,
            queue: queue.description,
            remove: remove.description,
            reset: reset.descrption,
            skip: skip.description
        }
        let msg = createEmbed("Available Commands", null, "Here are all the commands avaiable and their description", null, null, comms)
        return message.channel.send({embeds:[msg]})
    }
}