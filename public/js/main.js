var d3 = require("d3"),
	$ = require("jquery-browserify"),
	Graph = require("./graph"),
	Listener = require("./listener"),
	_s = require("underscore.string");

$(document).on("ready", function() {
	console.info("Reading registry services");

	var graph = new Graph(640, 480, 60);

	var listener = new Listener(window.settings.server, 15000);
	listener.on("services", graph.update.bind(graph));
	listener.on("serviceAdded", graph.serviceAdded.bind(graph));
	listener.on("serviceRemoved", graph.serviceRemoved.bind(graph));
});
