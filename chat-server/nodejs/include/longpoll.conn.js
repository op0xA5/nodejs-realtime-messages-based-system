//基于http longpoll的链接模型
//Project: SWT chatserver test version
//by: zhujinliang
//ver0 2012.08.02

//注册链接 : 使用post方法，路径中不含connid参数，同时可携带一消息（不携带消息则post数据为空即可）
//	         成功将返回{status:1, connid:''}
//发送消息 : 使用post方法，路径含connid参数，post数据为消息
//	         成功将返回{status:1, connid:''}
module.exports = {
	config:{
		url : '/longpoll',
		useExterndPool : false,
		httpTimeout : 20000,
		connectionTimeout : 20000
	},
	init : function(){
		var _this = this;
		var uuid = require('../modules/uuid.js'),
			sTimer = require('../modules/sTimer.js');
	
		var tConn = function(){
			this.id = uuid.v4();
			this.remoteIP;
			this.res = null;
			this.cTimer = new sTimer.timer(function(_this){
				_this.suspend();
			}, _this.config.connectionTimeout, this); //会话超时计时
			this.hTimer = new sTimer.timer(function(_this){
				if(_this.res){
					_this.res.jsonOut([]);
					_this.res = null;					
					_this.cTimer.start();
				}
			}, _this.config.httpTimeout, this); //一次http访问超时
			this.writeBuffer = new Array();
		};
		//处理写出消息，每个链接必须有此方法
		tConn.prototype.write = function(msg, okCallBack, errCallBack){
			if(this.res){
				//如果链接存在，则直接发送
				this.res.jsonOut([msg]);
				this.res = null;
				stat.connections.sendMessages++;
				if(okCallBack) okCallBack();
				this.cTimer.start();
			}else{
				//否则加入buffer
				this.writeBuffer.push({
					'm' : msg,
					'o' : okCallBack,
					'e' : errCallBack
				});
			};
		};
		tConn.prototype.suspend = function(){
			//释放资源，准备被移除
			this.cTimer.stop();	
			this.hTimer.stop();
			if(this.res) this.res.end();
			//通知消息发送失败		
			for(var i in this.writeBuffer){
				stat.connections.droppedMessages++;
				if(this.writeBuffer[i].e) this.writeBuffer[i].e();
			};
			$.connections.remove(this);
		};
		$.httpCore.addHandler(this.config.url, function(req, res){
			res.crossSiteHeader = true;	 //告知服务器提供跨域请求头
			if(req.isPost){
				var conn = null, connNewCreated = false;
				if(req.get.connid){
					if(req.get.connid in $.connections.pool){
						conn = $.connections.pool[req.get.connid];
					}else{
						res.jsonOut({'status':0, 'code':'CONNID_NOT_EXISTS', 'connid':false});
						return;
					}
				}else{
					//create new connection
					conn = $.connections.register(new tConn(), _this.config.useExterndPool);
					if(conn){
						conn.remoteIP = req.ip;
						connNewCreated = true;		
					}else{
						res.jsonOut({'status':0, 'code':'CANNOT_REGISTE_CONNECTION', 'connid':false});
						return;	
					}
				};				
				if(req.bodyLength){
					log('msg in<'+conn.id+'>: '+req.bodyLength+' bytes');
					var _info = $.connections.msgIn(conn, req.post);
					if(_info){
						if(connNewCreated) _info.connid = conn.id;
						res.jsonOut(_info);
					}else{
						if(connNewCreated){
							res.jsonOut({'status':0, 'code':'UNKNOWN_ERROR', 'connid':conn.id});
						}else{
							res.jsonOut({'status':0, 'code':'UNKNOWN_ERROR'});
						}
					}
				}else{
					if(connNewCreated){
						res.jsonOut({'status':1, 'connid':conn.id});
					}else{
						res.jsonOut({'status':1});
					}					
				};				
				conn.cTimer.start();
			}else{
				if(req.get.connid && req.get.connid in $.connections.pool){				
					var conn = $.connections.pool[req.get.connid];
					conn.cTimer.stop();					
					
					//保证同一会话仅一个链接
					if(conn.res) conn.res.jsonOut([]);
					conn.res = res;
					
					if(conn.writeBuffer.length>0){
						//处理缓存中的消息						
						var outBuffer = new Array();
						for(var i in conn.writeBuffer){
							outBuffer.push(conn.writeBuffer[i].m);
						};
						conn.res.jsonOut(outBuffer);
						conn.res = null;
						//通知消息发送成功
						for(var i in conn.writeBuffer){
							stat.connections.sendMessages++;
							if(conn.writeBuffer[i].o) conn.writeBuffer[i].o();
						};
						conn.writeBuffer = new Array();		//清空buffer
						conn.cTimer.start();
					}else{
						conn.hTimer.start();
						req.addListener('close', function(){
							conn.res = null;
							conn.hTimer.stop();
							conn.cTimer.start();
						});
					}						
				}else{
					res.jsonOut({'status':0, 'info':'ERROR_CONNECTION_ID'});	
				};
			};
		});
	}
};


