//Project: SWT chatserver test version
//by: zhujinliang
//ver0 2012.08.02
(function(){
	
	//�������
	global.config = {};
	var _config = require('./config.js') || {};
	var _clone = function(f,t){
		for(var i in f){
			if(typeof f[i] =='object'){
				_c(f[i], t[i]||(t[i]={}));
			}else{
				t[i]=f[i];
			}
		}
	};
	
	//����debug����
	var sys = require('sys');
	global.debug = _config.debug ? sys.debug : function(){};
	global.log = sys.log;
	global.error = sys.error;
	
	//ͳ����Ϣ
	global.stat = {
		serverTime : new Date(),
		onlineTime : 0
	};
	setInterval(function(){
		global.stat.serverTime = new Date();
		global.stat.onlineTime ++;
	}, 1000);

	//����ģ�鲢��ʼ��
	global.$ = global.modules = {};
	var incFiles = require('./load.files.js');
	for(var i in incFiles){
		log('Load Module <'+i+'>: '+incFiles[i]);
		var m = require(incFiles[i]);	
		global.modules[i] = m;
		if('config' in m){
			if(i in _config){
				_clone(_config[i], m.config);
			}
			global.config[i] = m.config;
		}
		if('init' in m && typeof m.init =='function')
			m.init();
	};
})();