// JavaScript Document
//by:zhujinliang

//require jQuery
jQuery.support.cors = true;
var XHR = function(_method, _url, _data, okFun, errFun){
	$.ajax({
		type : _method,
		url : _url,
		data : _data,
		timeout : 60000,
		success : function(data){
			var objData;
			try{
				objData = $.parseJSON(data);
			}catch(err){
				objData = {};
			}
			okFun(objData);
		},
		error : errFun,
		global :false
	});
}
var connection = function(baseUrl){	
	this._baseUrl = baseUrl;
	this.conn = null;
	this.msgInFunc = null;
	this.suspendFunc = null;
};
connection.prototype._creatLink = function(){
	var _this = this;
	if(_this.conn){		
		XHR('GET', _this._getUrl(), null, function(data){
			
			if(data && data.status==0){
				_this.conn = null;
				if(_this.suspendFunc) _this.suspendFunc();
			}else{
				if(_this.msgInFunc){					
					for(var i in data){
						_this.msgInFunc(data[i]);
					}
				}
				_this._creatLink();
			}			
		}, function(xhr, status){
			if(status == 'timeout'){
				_this._creatLink();
			}else{
				_this.conn = null;
				if(_this.suspendFunc) _this.suspendFunc();
			}			
		});	
	}
}
connection.prototype._getUrl = function(){
	var rtn = this._baseUrl+'?r='+Math.random();
	if(this.conn){
		rtn+='&connid='+this.conn;
	}
	return rtn;
}
connection.prototype.connect = function(callback, send){	
	var _this = this;
	if(!_this._baseUrl || _this.conn) return false;	
	XHR('POST', _this._getUrl(), send?send.msg:null, function(data){
		if(data.connid){
			_this.conn = data.connid;
			callback(true);
			_this._creatLink();	
		}else{
			callback(false);
		}
		if(send){
			if(data.status){
				send.callback(true, data.data);
			}else{
				send.callback(false, data.data);
			}
		}	
	}, function(){
		callback(false);
		if(send) send.callback(false);
	});	
	return true;
};
connection.prototype.send = function(msg, callback){
	var _this = this;
	if(_this.conn){
		XHR('POST', _this._getUrl(), 'JSON'+JSON.stringify(msg), function(data){
			if(data.status){
				callback(true, data);		
			}else{
				callback(false, data);
			}		
		}, function(){
			callback(false);
		});	
	}else{
		return false;
	}
};
connection.prototype.onMsgIn = function(callback){
	this.msgInFunc = callback;
};
connection.prototype.onSuspend = function(callback){
	this.suspendFunc = callback;
}
