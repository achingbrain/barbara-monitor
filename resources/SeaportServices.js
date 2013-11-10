var _s = require("underscore.string"),
	bonvoyage = require("bonvoyage"),
	Autowire = require("wantsit").Autowire;

var SeaportServices = function() {
	this._seaport = Autowire;
}

SeaportServices.prototype.retrieveAll = function(request, response) {
	var list = [];

	if(this._seaport) {
		var query = null;

		if(request.query.role) {
			query = request.query.role;
		}

		if(query && request.query.version) {
			query = query + "@" + request.query.version;
		}

		this._seaport.query(query).forEach(this._listServices.bind(this, list, request.query));
	}

	request.reply(list);
};

SeaportServices.prototype._shouldInclude = function(type, params, values) {
	if(params[type] && !_s.contains(values[type], params[type])) {
		return false;
	}

	return true;
};

SeaportServices.prototype._listServices = function(list, params, service) {
	if( !this._shouldInclude("role", params, service) ||
		!this._shouldInclude("version", params, service) ||
		!this._shouldInclude("host", params, service) ||
		!this._shouldInclude("type", params, service)) {

		return;
	}

	list.push({
		id: service.id,
		role: service.role,
		version: service.version,
		host: service.host,
		port: service.port,
		type: service.type,
		lastSeen: ((new Date().getTime()) - service._heartbeat) / 1000
	});
};

module.exports = SeaportServices;