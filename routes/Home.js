var Autowire = require("wantsit").Autowire,
	LOG = require("winston");

var HomeController = function() {
	this._config = Autowire;
	this._seaport = Autowire;
};

HomeController.prototype.get = function(request, response){
	var services = this._seaport.query(this._config.get("registry:role") + "@" + this._config.get("registry:version"));
	var service = null;

	if(services.length > 0) {
		service = "ws://" + services[0].host + ":" + services[0].port;
	}

	response.render("index", {
		title: "Brewbot Monitor",
		registry: service
	});
};

module.exports = HomeController;