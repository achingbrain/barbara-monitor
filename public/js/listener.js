var events = require("events"),
	util = require("util");

var Listener = function(url, frequency) {
	if(!window.WebSocket) {
		alert("Please use a browser that supports web sockets.");

		return;
	}

	console.info("Connecting to", url);
	var ws = new WebSocket(window.settings.server);
	ws.onopen = function () {
		ws.send("");

		/*setInterval(function() {
			ws.send("");
		}, frequency);*/
	}
	ws.onmessage = function (event) {
		console.info("got response");
		var message = JSON.parse(event.data);

		if(message.query) {
			// query result
			this.emit("services", message.query);
		} else if(message.registered) {
			console.info("adding");

			this.emit("serviceAdded", message.registered);
		} else if(message.removed) {
			console.info("removing");

			this.emit("serviceRemoved", message.removed);
		} else {
			console.warn("Unknown response", event.data);
		}
	}.bind(this);
}
util.inherits(Listener, events.EventEmitter);


module.exports = Listener;