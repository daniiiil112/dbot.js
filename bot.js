var Discord = require("discord.js"),
	Config = require("./config.json"),
	Komponist = require("komponist"),
	request = require("request"),
	fs = require("fs"),
	log4js = require('log4js');
	
var Client = new Discord.Client(),
	MPDClient = new Komponist.createConnection(),
	logger = new log4js.getLogger('dbot');

var textChannel, voiceChannel, voiceStream, trackInfo;

//-----------------------PROCESSES-------------------------//

process.on('SIGINT', function() {
	logger.info("Disconnected!");
	Client.destroy();
	process.exit();
});

process.on('SIGTERM', function() {
	logger.info("Disconnected!");
	Client.destroy();
	process.exit();
});

//-----------------------LOGS-------------------------//

log4js.configure({
  appenders: { 'dbot': { type: 'file', filename: Config.loggerPath, keepFileExt: true, maxLogSize: 10485760, backups: 1 }},
  categories: { default: { appenders: ['dbot'], level: Config.loggerLevel }}
});

Client.on("disconnected", function () {
    logger.error("Disconnected!");
    process.exit(); 
});

Client.on("error", function (error) { logger.error(error) });

Client.on("warn", function (info) { logger.warn(info) });

Client.on("debug", function (info) { logger.debug(info) });

//-----------------------VOICE-------------------------//

Client.on("ready", function(){
	var server = Client.guilds.find("id", Config.serverId);	
	textChannel = server.channels.find(chn => chn.id === Config.textChannelId && chn.type === "text");
	voiceChannel = server.channels.find(chn => chn.id === Config.voiceChannelId && chn.type === "voice");	
	logger.info(`Connected from server "${server.name}"`);
	logger.info(`Bind from text channel "${textChannel.name}"`);		
	try {
		voice.init();
		logger.info(`Connected from voice channel "${voiceChannel.name}"`);		
	}catch (err){			
		logger.error("Voice connect error!");
		logger.debug (err);
	};		
});

function voice() {
};

voice.init = function (){
	var stream = fs.createReadStream(Config.fifoPath);
	voiceChannel.join().then(function(connection){ 
		voiceStream = connection.playConvertedStream(stream);
		voiceStream.setVolume(Config.defaultVolume);
	});
};	

voice.reconnect = function (){	
	var stream = fs.createReadStream(Config.fifoPath);
	voiceChannel.leave();	
	voiceChannel.join().then(function(connection){ 
		voiceStream = connection.playConvertedStream(stream);	
		voiceStream.setVolume(Config.defaultVolume); 
	});
};
	
voice.volume = function (suffix){
	voiceStream.setVolume(suffix);	
};

//------------------------TITLE------------------------//

Client.on("ready", function(){
	setInterval(function() {		
		MPDClient.currentsong(function(err, info) {
			if ('-' == info.Title){return};
			if (trackInfo !== info.Title){
				Client.user.setActivity(info.Title);
				trackInfo = info.Title;
				logger.info(`New current play: ${info.Title}`);
			};			
		});			
	}, 700);
});

function title(message){
	var url = "https://itunes.apple.com/search?term=" + encodeURIComponent(trackInfo) + "&limit=1";
	var embed = request(url, function (error, response, body) {
		try {
			var obj = (JSON.parse(body).results[0].artworkUrl100);
		} catch (err) {
			var obj = "https://cdn.discordapp.com/embed/avatars/0.png";
		};
		var embed = {
			"title": trackInfo,
			"description": '',
			"color": 2466784,
			"thumbnail": {
				"url": obj
			}
		};	
		message.channel.send({ embed });
	});
};

//-----------------------COMMANDS-----------------------//

Client.on("message", function(message) {
	if (message.channel.id === textChannel.id) {
		if (message.author.id != Client.user.id && (message.content.startsWith(Config.commandPrefix))) {
			var cmdTxt = message.content.split(" ")[0].substring(Config.commandPrefix.length);
			var suffix = message.content.substring(cmdTxt.length + Config.commandPrefix.length + 1);
			try {
				commands[cmdTxt].process(Client, message, suffix);
				logger.info(`${message.author.username}: ${message.content}`);
			}catch (err){
				logger.warn (`Еrror executing command or command not found! ${message.author.username}: ${message.content}`);
				logger.debug (err);
			};
		};
	};
});

commands = {	
	"help":{
		description: "List of available commands",
		process: function (Client, message, suffix) {
			var Title;	
			if (suffix) {
				Title = (commands[suffix.replace(/\s/g , "")].description);
			} else {
				suffix = "Commands:";
				var response = "";
				for (var m in commands) {
					response += ("!" + m + ", ");
				}
				Title = response.slice(0, -2)
			};
			var embed = {
				"title": suffix,
				"description": Title,
				"color": 2466784
			};
			message.channel.send({ embed });
		}
	},
	"reconnect":{
		description: "Reconnect voice channel",
		process: function (Client, message, suffix) {	
			try {
				voice.reconnect();
				message.channel.send('**Reconnect!**');
			}catch (err){
				message.channel.send('**Reconnect fail!**');
				logger.err ("Reconnect fail!");
				logger.debug (err);
			};
		}
	},
	"volume":{
		description: "Set volume",
		process: function (Client, message, suffix) {	
			suffix = suffix / 100;
			if (!isNaN(suffix) && suffix <= 2 && suffix >= 0.01){	
				voice.volume(suffix);
				message.channel.send('**Volume set: **' + suffix * 100);
			}else{
				message.channel.send('**Volume set fail! Invalid value! Available range from 1 to 200!**');
			};
		}
	},		
	"stop": {
		description: "Stopping playback",
		process: function (Client, message, suffix) {
			voiceStream.pause();
			MPDClient.stop();
			message.channel.send('**Playback stopped!**');
		}
	},	
	"play": {
		description: "Starting playback",
		process: function (Client, message, suffix) {
			MPDClient.play();
			voiceStream.resume();
			message.channel.send('**Playback started!**');
		}
	},	
	"next": {
		description: "Next track",
		process: function (Client, message, suffix) {	
			MPDClient.next();
			message.channel.send('**Next track toggled!**');
		}
	},		
	"prev": {
		description: "Previous track",
		process: function (Client, message, suffix) {	
			MPDClient.previous();
			message.channel.send('**Previous track toggled!**');
		}
	},	
	"track": {
		description: "Current track",
		process: function (Client, message, suffix) {	
			title(message);
		}
	}
};

Client.login(Config.clientToken);