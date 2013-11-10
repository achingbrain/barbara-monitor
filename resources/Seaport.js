var _s = require("underscore.string"),
	bonvoyage = require("bonvoyage"),
	Autowire = require("wantsit").Autowire;

var Seaport = function() {
	this._seaport = Autowire;
}

Seaport.prototype.retrieveOne = function(request) {
	var output = {
		"host": null,
		"port": 0
	};

	request.reply(output);
};

Seaport.prototype._shouldInclude = function(type, params, values) {
	if(params[type] && !_s.contains(values[type], params[type])) {
		return false;
	}

	return true;
};

Seaport.prototype._listServices = function(list, params, service) {
	if( !this._shouldInclude("role", params, service) ||
		!shouldInclude("version", params, service) ||
		!shouldInclude("host", params, service) ||
		!shouldInclude("type", params, service)) {

		return;
	}

	list.push({
		id: service.id,
		role: service.role,
		version: service.version,
		host: service.host,
		port: service.port,
		type: service.type
	});
};

module.exports = Seaport;