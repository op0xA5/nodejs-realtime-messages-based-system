//simple objective timer module
//by:zhujinliang

exports.timer=function(fun, time, args){
	this._fun = fun;
	this._time = time;
	this._args = args;
	this.timerID = null;
};
exports.timer.prototype.start = function(){
	if(this.timerID) clearTimeout(this.timerID);
	this.timerID = setTimeout(this._fun, this._time, this._args);
};
exports.timer.prototype.stop = function(){
	if(this.timerID){
		clearTimeout(this.timerID);
		this.timerID = null;
	}
};