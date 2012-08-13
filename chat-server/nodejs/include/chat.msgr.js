//simple msg router - chat, broadcast msg to connections
//Project: SWT chatserver test version
//by: zhujinliang
//ver0 2012.08.02

module.exports = {
	config : {
		nameCannotUse : ['À˘”–»À']
		
	},
	init : function(){
		var _this = this;
		$.connections.addMsgHandler('join', function(conn, msg){			
			if('name' in msg){
				for(var i in _this.config.nameCannotUse){
					if(_this.config.nameCannotUse[i] == msg.name){
						return new errResponse('cannot use this name');
					}
				}
				for(var i in $.connections.pool){
					if($.connections.pool[i].name == msg.name){
						return new errResponse('name already in use');
					}
				}
				conn.name = msg.name;
				$.connections.broadcastNoSelf({
					'type':'userIn',
					'name':conn.name
				}, conn);
				return new okResponse();
			}else{
				return new errResponse('please input your name');
			}
		});
		$.connections.addMsgHandler('listUser', function(conn, msg){			
			var userList = new Array();			
			for(var i in $.connections.pool){
				if($.connections.pool[i].name){
					userList.push($.connections.pool[i].name);
				}
			}
			return new okResponse(userList);
		});
		$.connections.addMsgHandler('chat', function(conn, msg){
			if(!conn.name) return new errResponse('you need register name first');
			if(!msg.msg) return new errResponse('no msg');
			if('to' in msg && msg.to){
				if(msg.to == conn.name) return new errResponse('cannot speak to yourself');
				for(var i in $.connections.pool){				
					if($.connections.pool[i].name == msg.to){
						$.connections.pool[i].write({
							'type' : 'chat',
							'name' : conn.name,
							'private' : true,
							'msg' : msg.msg
						});
						return new okResponse();
					}
				}
				return new errResponse('no this user');
			}else{
				$.connections.broadcastNoSelf({
					'type' : 'chat',
					'name' : conn.name,
					'msg' : msg.msg
				}, conn);
				return new okResponse();
			};
		});
		$.connections.addMsgHandler('_remove', function(conn){
			if(conn.name){
				$.connections.broadcastNoSelf({
					'type':'userOut',
					'name':conn.name
				}, conn);
			}
		});
	}
};