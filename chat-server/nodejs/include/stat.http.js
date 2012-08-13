//status report via http
//Project: SWT chatserver test version
//by: zhujinliang
//ver0 2012.08.02

//visit http://ip:port/status
//http://ip:port/status?json for json type

module.exports = {
	config : {
		templet : __dirname+'\\templet.html',
		templetEncoding : 'UTF-8'
	},
	init : function(){
		var _this = this;
		var fs = require('fs');
		var templet = null;
		if(fs.existsSync(_this.config.templet)){
			templet = fs.readFileSync(_this.config.templet, _this.config.templetEncoding);
		}else{
			log('statHttp: templet file not found');
		};
	
		$.httpCore.addHandler('/status', function(req, res){
			
			if('json' in req.get){
				res.crossSiteHeader = true;
				res.jsonOut(global.stat);
			}else{
				//debug模式每次访问都尝试读入一次模板
				if(debug && fs.existsSync(_this.config.templet)){
					templet = fs.readFileSync(_this.config.templet, _this.config.templetEncoding);
				};
				
				if(templet){
					//处理模板
					res.write(templet.replace(/\${(.*?)}/igm,function($0,$1){
						var s=$1.split('.');
						var o=global.stat;					
						for(var i in s){
							if(s[i] in o){
								o=o[s[i]];
							}else{
								o=null;
								break;
							};
						};
						return o;
					}));
				}else{
					res.write('Templet File Not Found');
				};
			};
			res.end();
		});
	}
};