//链接池
//Project: SWT chatserver test version
//by: zhujinliang
//ver0 2012.08.02

//how to use
//模块自行创建链接模型实例，但必须有(string)id和(function)write(msg, okCallBack, errCallBack)属性。
//使用register注册该模型到池中
//可使用pool[id]访问池中链接
//使用msgIn(msg, conn)提交消息，该消息将进入路由环节。return 使用 new okResponse(data) 表示消息被正确处理，errResponse(code, data) 为错误返回。
//使用remove(conn)从池中移除链接，将自动从池中删除，模型端不需delete。

//使用addMsgHandler(type, function(conn, msg))注册消息服务。
//特别的当type='_remove'时表示接收链接被移除消息。
//此时回调函数不需msg，且return无任何作用，函数中不可对其进行写操作（注意broadcast也不可使用）。

module.exports = {
	config : {
		maxConnection : 10000, //最大链接数
		extendedConnections : 100  //扩展链接数空间
	},
	
	init :  function(){
		stat.connections = {
			online : 0,   //在线链接数
			totalIncome : 0,  //总接入数
			incomeDropped : 0,  //由于达到最大链接而被放弃的链接数
			incomeMessages : 0,  //进入消息数
			errorMessages : 0,  //错误的消息数(格式错误等)
			sendMessages : 0,  //通过各种接口发出的消息数
			droppedMessages : 0  //丢弃的消息数
		};
		global.okResponse = this.okResponse;
		global.errResponse = this.errResponse;
	},
	
	pool : {},
	//将新生成的conn注册到池中
	//useExtended: 允许使用扩展空间
	register : function(conn, useExtended){
		//判断链接池最大限制
		if(stat.connections.online < this.config.maxConnection ||
			(useExtended &&
			stat.connections.online < this.config.maxConnection+this.config.extendedConnections)){
			stat.connections.online++;
			stat.connections.totalIncome++;
			log('new connection: '+conn.id+' online: '+stat.connections.online);				
			return this.pool[conn.id] = conn;
		}else{
			//禁止注册新链接
			stat.connections.incomeDropped++;
			return false;
		};
	},
	//处理消息进入路由
	msgIn : function(conn, msg){
		stat.connections.incomeMessages++;
		if('type' in msg && msg.type in this.msgHandler){
			return this.msgHandler[msg.type](conn, msg);
		}else{
			stat.connections.errorMessages++;
			return new this.errResponse('UNKNOWN_MSG_TYPE');
		};			
	},
	//处理链接移除
	remove : function(conn){
		stat.connections.online--;
		log('connection suspend: '+conn.id+' online: '+stat.connections.online);
		for(var i in this.removeHandler){
			this.removeHandler[i](conn);
		}
		delete this.pool[conn.id];
	},
	
	msgHandler : {},
	removeHandler : new Array(),
	//添加消息路由
	addMsgHandler : function(type, handlerFunc){
		if(type == '_remove'){
			this.removeHandler.push(handlerFunc);
		}else{
			this.msgHandler[type] = handlerFunc;
		}				
	},
	broadcast : function(msg){
		for(var i in this.pool){
			this.pool[i].write(msg);
		}
	},
	broadcastNoSelf : function(msg, conn){
		for(var i in this.pool){
			if(this.pool[i].id != conn.id)
				this.pool[i].write(msg);
		}
	},
	//_data 附加数据
	okResponse : function(_data){
		this.status = 1;
		if(_data) this.data = _data;
	},
	//_code 错误代码，仅用于软件识别
	//_data 错误附加数据
	errResponse : function(_code, _data){
		this.status = 0;
		if(_code) this.code = _code;
		if(_data) this.data = _data;
	}
};