
var emitter = function() {
	this._listeners;
}

emitter.prototype.on = function(event, listener) {
	if(!this._listeners[event]) {
		this._listeners[event] = [];
	}

	this._listeners[event].push(listener);
}

emitter.prototype.once = function(event, listener) {
	if(!this._listeners[event]) {
		this._listeners[event] = [];
	}

	var wrapper = function() {
		listener.apply(listener, arguments);

		for(var i = 0; i < this._listeners[event].length; i++) {
			if(this._listeners[event][i] === wrapper) {
				this._listeners[event].splice(i, 1);
			}
		}
	}.bind(this);

	this._listeners[event].push();
}

emitter.prototype.emit = function(event) {
	var args = arguments.slice(1);

	this._listeners[event].forEach(function(listener) {
		listener.apply(listener, args.slice(0));
	});
}

module.exports = emitter;