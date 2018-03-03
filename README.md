# dbot.js
Discord musical bot on the library Discord.js. As a sound source is used MPD with the FIFO output method.

## Requirements
* NodeJS 6.0.0 or higher
* A C++ compiler for your system
* Music Player Daemon

## Used libraries

[discord.js](https://github.com/discordjs/discord.js) - Discord library,<br />
[node-opus](https://github.com/Rantanen/node-opus) - Opus audio encoding,<br />
[ffmpeg-binaries](https://www.npmjs.com/package/ffmpeg-binaries) - A simple way to install FFMPEG,<br />
[komponist](https://github.com/hughsk/komponist) - Simplified client library for MPD,<br />
[request](https://github.com/request/request) - Simplified HTTP client,<br />
[log4js](https://github.com/log4js-node/log4js-node) - The logging framework, <br />
[daemonize2](https://github.com/niegowski/node-daemonize2) - module for easy creation of daemons.<br />


## Installation
* Create and navigate to the folder. 
* Download and unpack the files of this Git repository.
* Install the required libraries:<br />
```
npm install discord.js node-opus ffmpeg-binaries komponist request log4js daemonize2
```


## Сonfiguration
*  In the MPD configuration file, add a new output method:<br />
```
audio_output {
type    "fifo"
name    "my_fifo"
path    "/tmp/mpd.fifo"
format  "48000:16:2"
}
```
*  Fill in the configuration file.<br />

"clientToken" - bot authentication token.<br />
"serverId" - ID server on which the bot must work<br />
"textChannelId" - The text channel ID on which the bot should process commands.<br />
"voiceChannelId" - Voice channel ID to which the bot should connect.<br />
"commandPrefix" - Сommand prefix.<br />
"defaultVolume" - Default volume. Possible value 0.0 to 1.0.<br />
"loggerLevel" - Logging level. Possible value "debug" < "info" < "warn" < "error" .<br />

## Usage
Start daemon
```
node main.js start
```

Stop daemon
```
node main.js stop
```
