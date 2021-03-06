var LOG = require("winston"),
	nconf = require("nconf"),
	Container = require("wantsit").Container
	express = require("express"),
	http = require("http"),
	path = require("path"),
	bonvoyage = require("bonvoyage"),
	mdns = require("mdns2"),
	path = require("path");

// set up arguments
nconf.argv().env().file(path.resolve(__dirname, "config.json"));

var container = new Container();
container.register("config", nconf);

// web controllers
container.createAndRegister("homeController", require(path.resolve(__dirname, "./routes/Home")));

// inject a dummy seaport - we'll overwrite this when the real one becomes available
container.register("seaport", {
	query: function() {
		return [];
	}
});

var bonvoyageClient = container.createAndRegister("seaportClient", bonvoyage.Client, {
	serviceType: nconf.get("registry:name")
});
bonvoyageClient.register({
	role: nconf.get("www:role"),
	version: nconf.get("www:version"),
	createService: function(port) {
		var app = express();

		var route = function(controller, url, method) {
			var component = container.find(controller);

			app[method](url, component[method].bind(component));
		}

		// all environments
		app.set("port", port);
		app.set("views", path.resolve(__dirname, "./views"));
		app.set("view engine", "jade");
		app.use(express.logger("dev"));
		app.use(express.urlencoded())
		app.use(express.json())
		app.use(express.methodOverride());
		app.use(app.router);
		app.use(express.static(path.resolve(__dirname, "./public")));

		// development only
		app.use(express.errorHandler());

		route("homeController", "/", "get");

		http.createServer(app).listen(app.get("port"), function(){
			LOG.info("Express server listening on port " + app.get("port"));
		});

		// publish via Bonjour
		var advert = mdns.createAdvertisement(mdns.tcp("http"), port, {
			name: "barbara-monitor"
		});
		advert.start();
	}
});
bonvoyageClient.on("seaportUp", function(seaport) {
	container.register("seaport", seaport);
});
