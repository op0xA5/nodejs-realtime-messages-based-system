//����http longpoll������ģ��
//Project: SWT chatserver test version
//by: zhujinliang
//ver0 2012.08.02

//ע������ : ʹ��post������·���в���connid������ͬʱ��Я��һ��Ϣ����Я����Ϣ��post����Ϊ�ռ��ɣ�
//	         �ɹ�������{status:1, connid:''}
//������Ϣ : ʹ��post������·����connid������post����Ϊ��Ϣ
//	         �ɹ�������{status:1, connid:''}
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
			}, _this.config.connectionTimeout, this); //�Ự��ʱ��ʱ
			this.hTimer = new sTimer.timer(function(_this){
				if(_this.res){
					_this.res.jsonOut([]);
					_this.res = null;					
					_this.cTimer.start();
				}
			}, _this.config.httpTimeout, this); //һ��http���ʳ�ʱ
			this.writeBuffer = new Array();
		};
		//����д����Ϣ��ÿ�����ӱ����д˷���
		tConn.prototype.write = function(msg, okCallBack, errCallBack){
			if(this.res){
				//������Ӵ��ڣ���ֱ�ӷ���
				this.res.jsonOut([msg]);
				this.res = null;
				stat.connections.sendMessages++;
				if(okCallBack) okCallBack();
				this.cTimer.start();
			}else{
				//�������buffer
				this.writeBuffer.push({
					'm' : msg,
					'o' : okCallBack,
					'e' : errCallBack
				});
			};
		};
		tConn.prototype.suspend = function(){
			//�ͷ���Դ��׼�����Ƴ�
			this.cTimer.stop();	
			this.hTimer.stop();
			if(this.res) this.res.end();
			//֪ͨ��Ϣ����ʧ��		
			for(var i in this.writeBuffer){
				stat.connections.droppedMessages++;
				if(this.writeBuffer[i].e) this.writeBuffer[i].e();
			};
			$.connections.remove(this);
		};
		$.httpCore.addHandler(this.config.url, function(req, res){
			res.crossSiteHeader = true;	 //��֪�������ṩ��������ͷ
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
					
					//��֤ͬһ�Ự��һ������
					if(conn.res) conn.res.jsonOut([]);
					conn.res = res;
					
					if(conn.writeBuffer.length>0){
						//�������е���Ϣ						
						var outBuffer = new Array();
						for(var i in conn.writeBuffer){
							outBuffer.push(conn.writeBuffer[i].m);
						};
						conn.res.jsonOut(outBuffer);
						conn.res = null;
						//֪ͨ��Ϣ���ͳɹ�
						for(var i in conn.writeBuffer){
							stat.connections.sendMessages++;
							if(conn.writeBuffer[i].o) conn.writeBuffer[i].o();
						};
						conn.writeBuffer = new Array();		//���buffer
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


