//���ӳ�
//Project: SWT chatserver test version
//by: zhujinliang
//ver0 2012.08.02

//how to use
//ģ�����д�������ģ��ʵ������������(string)id��(function)write(msg, okCallBack, errCallBack)���ԡ�
//ʹ��registerע���ģ�͵�����
//��ʹ��pool[id]���ʳ�������
//ʹ��msgIn(msg, conn)�ύ��Ϣ������Ϣ������·�ɻ��ڡ�return ʹ�� new okResponse(data) ��ʾ��Ϣ����ȷ����errResponse(code, data) Ϊ���󷵻ء�
//ʹ��remove(conn)�ӳ����Ƴ����ӣ����Զ��ӳ���ɾ����ģ�Ͷ˲���delete��

//ʹ��addMsgHandler(type, function(conn, msg))ע����Ϣ����
//�ر�ĵ�type='_remove'ʱ��ʾ�������ӱ��Ƴ���Ϣ��
//��ʱ�ص���������msg����return���κ����ã������в��ɶ������д������ע��broadcastҲ����ʹ�ã���

module.exports = {
	config : {
		maxConnection : 10000, //���������
		extendedConnections : 100  //��չ�������ռ�
	},
	
	init :  function(){
		stat.connections = {
			online : 0,   //����������
			totalIncome : 0,  //�ܽ�����
			incomeDropped : 0,  //���ڴﵽ������Ӷ���������������
			incomeMessages : 0,  //������Ϣ��
			errorMessages : 0,  //�������Ϣ��(��ʽ�����)
			sendMessages : 0,  //ͨ�����ֽӿڷ�������Ϣ��
			droppedMessages : 0  //��������Ϣ��
		};
		global.okResponse = this.okResponse;
		global.errResponse = this.errResponse;
	},
	
	pool : {},
	//�������ɵ�connע�ᵽ����
	//useExtended: ����ʹ����չ�ռ�
	register : function(conn, useExtended){
		//�ж����ӳ��������
		if(stat.connections.online < this.config.maxConnection ||
			(useExtended &&
			stat.connections.online < this.config.maxConnection+this.config.extendedConnections)){
			stat.connections.online++;
			stat.connections.totalIncome++;
			log('new connection: '+conn.id+' online: '+stat.connections.online);				
			return this.pool[conn.id] = conn;
		}else{
			//��ֹע��������
			stat.connections.incomeDropped++;
			return false;
		};
	},
	//������Ϣ����·��
	msgIn : function(conn, msg){
		stat.connections.incomeMessages++;
		if('type' in msg && msg.type in this.msgHandler){
			return this.msgHandler[msg.type](conn, msg);
		}else{
			stat.connections.errorMessages++;
			return new this.errResponse('UNKNOWN_MSG_TYPE');
		};			
	},
	//���������Ƴ�
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
	//�����Ϣ·��
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
	//_data ��������
	okResponse : function(_data){
		this.status = 1;
		if(_data) this.data = _data;
	},
	//_code ������룬���������ʶ��
	//_data ���󸽼�����
	errResponse : function(_code, _data){
		this.status = 0;
		if(_code) this.code = _code;
		if(_data) this.data = _data;
	}
};