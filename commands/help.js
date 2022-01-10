const { createEmbed } = require("./utilities/embedMsg")

module.exports={
    name: "help",
    description: "shows all available commands",
    execute(message, commands){
        let comms = {}

        /**
         * checks the description of all commands and sends a message with each one.
         */
        commands.forEach((value, key) => {
            comms[key] = value.description;
        });

        let msg = createEmbed("Available Commands", null, "Here are all the commands avaiable and their description", null, null, comms)
        return message.channel.send({embeds:[msg]})
    }
}