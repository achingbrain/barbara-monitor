var d3 = require("d3"),
	_s = require("underscore.string");

Graph = function(width, height, radius) {
	this._nodes = [];
	this._links = [];
	this._radius = radius;

	this._force = d3.layout.force()
		.nodes(this._nodes)
		.links(this._links)
		.charge(-6000)
		.linkDistance(150)
		.size([width, height])
		.on("tick", this._tick.bind(this));

	this._svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height);

	this._svg.append("marker")
		.attr("id", "arrowhead")
		.attr("refX", (this._radius/4) + 2)
		.attr("refY", 2)
		.attr("markerWidth", 6)
		.attr("markerHeight", 10)
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead
}

Graph.prototype._draw = function() {
	var link = this._svg.selectAll(".link").data(this._force.links(), function(d) { return d.source.id + "-" + d.target.id; });
	link.enter()
		.insert("line", ".node")
		.attr("class", "link");
	link.exit().remove();

	var group = this._svg.selectAll(".node").data(this._force.nodes(), function(d) { return d.id; });
	group.enter().append("g")
		.attr("class", function(d) {
			return "node";
		});
	group.on("click", function() {

	});
	group.call(this._force.drag);

	var host = group.append("circle")
		.attr("class", function(d) { return "host " + d.id; })
		.attr("r", this._radius);

	var role = group.append("text");
	role.attr("text-anchor", "middle");
	role.attr("width", this._radius);
	role.attr("x", 0);
	role.attr("y", 5);
	role.text(function(d) {return d.role ? d.role.replace("brewbot-", "").replace("-rest", "") : "unknown"});

	group.exit().remove();

	this._force.charge((this._nodes.length * -1000) - 1000);
	this._force.start();
};

Graph.prototype._tick = function() {
	this._svg.selectAll(".node").attr("transform", function(d) {
		return "translate(" + d.x + ", " + d.y + ")";
	});

	this._svg.selectAll(".link").attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; })
		.attr("marker-end", "url(#arrowhead)");
}

Graph.prototype._findNode = function(id) {
	var output;

	this._nodes.forEach(function(node) {
		if(node.id === id) {
			output = node;
		}
	});

	if(!output) {
		output = {
			id: id
		};

		this._nodes.push(output);
	}

	return output;
};

Graph.prototype._done = function() {
	if(this._timeout) {
		clearTimeout(this._timeout);
	}

	this._timeout = setTimeout(function() {
		this._draw();
	}.bind(this), 500);
};

Graph.prototype.update = function(services) {
	this._nodes.length = 0;
	this._links.length = 0;

	console.dir(services);

	services.forEach(function(service) {
		this.serviceAdded(service, this._done);
	}.bind(this));
};

Graph.prototype.serviceAdded = function(service) {
	if(!_s.endsWith(service.role, "rest")) {
		return;
	}

	var host = this._findNode(service.host + ":" + service.port);
	host.role = service.role;
	host.lastSeen = (new Date().getTime()) - service._heartbeat;

	$.getJSON("http://" + host.id + "/config", function(config) {
		if(config.upstream) {
			config.upstream.forEach(function(upstream) {
				var remote = this._findNode(upstream.host);
				var linkPresent;

				this._links.forEach(function(link) {
					if(link.source === host && link.target === remote) {
						linkPresent = true;
					}
				});

				if(linkPresent) {
					return;
				}

				console.info("Creating an upstream link from " + host.id + " to " + remote.id);
				this._links.push({source: host, target: remote});
			}.bind(this));
		}

		if(config.downstream) {
			config.downstream.forEach(function(downstream) {
				var remote = this._findNode(downstream.host);
				var linkPresent;

				this._links.forEach(function(link) {
					if(link.source === remote && link.target === host) {
						linkPresent = true;
					}
				});

				if(linkPresent) {
					return;
				}

				console.info("Creating a downstream link from " + remote.id + " to " + host.id);
				this._links.push({source: remote, target: host});
			}.bind(this));
		}

		this._done();
	}.bind(this));
};

Graph.prototype.serviceRemoved = function(service) {
	var id = service.host + ":" + service.port;

	for(var i = 0; i < this._nodes.length; i++) {
		if(this._nodes[i].id === id) {
			this._nodes.splice(i, 1);

			i--;
		}
	}

	for(var i = 0; i < this._links.length; i++) {
		if(this._links[i].source.id == id || this._links[i].target.id == id) {
			this._links.splice(i, 1);

			i--;
		}
	}

	this._done();
};

module.exports = Graph;