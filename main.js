var Config = require("./config.json"),
	daemonize = require("daemonize2");

var daemon = daemonize.setup({
    main: "./bot.js",
    name: "dbot",
    pidfile: Config.pidPath
});

switch (process.argv[2]) {
    case "start":
        daemon.start();
        break;

    case "stop":
        daemon.stop();
        break;

    default:
        console.log("Usage: [start|stop]");
		break;		
};