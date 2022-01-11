# discord music bot

Discord music bot for one or multiple servers. Created using Node js, discord js, and some additional modules and API's.

## Features

The bot currently features 13 commands to control music in a voice channel. It has multi-server functionality, which means that one instance of the bot can operate on multiple servers without interference.

| Feature | Command | description |
| ------- | ------- | ----------- |
| Play | -play or -p followed by a song url or name | Plays a song or adds it to the queue. |
| Pause | -pause | Pauses the song thats currently playing. |
| Unpause | -unpause | Unpauses a paused song. |
| Skip | -next or -n | Skips to the next song in the queue. can be added after a play command to play a song after the current one. |
| Back | -back or -b | Goes back to the previus song. |
| Jump | -jump or -j followed by the position in the queue to jump to. | Jumps to a song given its position in the queue. |
| Remove | -remove or -r followed by the position of the song to be removed from the queue. | Removes a song from the queue. |
| Queue | -q or -queue | Shows the queue, starting from the current song through 10 songs after it. Includes buttons that offer pagination. |
| Clear | -clear | Clears the queue. Doesnt stop a song if one is currently playing. |
| Loop | -loop | Activates or deactivates loop mode. after the last queued song, the whole list will be played again.
| Lyrics | -lyrics or -ly | Shows the lyrics of the song thats currently playing. It uses Genius as the source. |
| Help | -help | Shows all available commands. |
| Reset | -reset | disconnects the bot from the voice channel and deletes server info. |

## Setup

### Node

Node 14 must be installed. Discord js indicates Node 16 is required, but there is an issue with the ytdl-core module used in the project. The audio stream cuts out unexpectedly with an error if node 16 is used. To solve this issue the project uses Node 14 and the abort-controller module to solve the compatibility issue of not using Node 16. [Error: imput stream: aborted #902](https://github.com/fent/node-ytdl-core/issues/902#issue-831938147)

### Discord app setup

An app has to be created in the discord developer portal, and a bot has to be setup for it.

After creating the bot in the discord developer portal, create an environment variable called CLIENT_LOGIN and assign it the token that is shown in the bot page.

![image](https://user-images.githubusercontent.com/65831855/148860035-ab901c93-d4fb-4adb-a763-18e79e09d8ca.png)

### Spotify API

The bot uses Spotify's API to retrieve information of tracks, albums and playlists when a user inputs a Spotify url. To connect to the API you must have a spotify account and enter the developer portal. There you will have to create an application. then you will have to get the Client ID and Client Secret and create the environment variables SPOTIFY_CLIENT_ID and SPOTIFY_SECRET with their respective values.

### Running the bot

First install the node modules with `npm install`

Then run the bot using `npm start`
