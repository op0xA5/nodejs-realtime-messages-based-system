//http server core
//Project: SWT chatserver test version
//by: zhujinliang
//ver0 2012.08.02

//危险：post允许任意上传而不检查长度，可导致恶意上传占据大量内存空间

//to add handler,use addHandler('url_path', function(req, res){})

module.exports = {
	config : {
		port : 9999,
		postBufferSize : 65535,
	},

	init : function(){
		var _this=this;
		stat.http = {
			connections : 0, //接收到的tcp链接数
			onlineConnections : 0, //在线链接数
			requests : 0,    //接收到的请求数
			receiveBytes : 0,  //接收的字节数（该项目只在断开tcp链接后处理，下同）
			sendBytes : 0,  //发送的字节数
			errors : 0,  //请求错误计数
			notHandled : 0,  //无法路由到的请求计数
		};
		
		var http = require('http'),
			url = require('url'),
			querystring = require('querystring');	
		
		var notFoundHandler = function(req, res){
			stat.http.notHandled++;
			res.writeHead(404, 'File Not Found', {'Content-Type': 'text/plain'});
			res.write("Not Found\n");
			res.end();
		};
		//使用json格式输出数据
		http.ServerResponse.prototype.jsonOut = function(obj){
			var json = JSON.stringify(obj);
			if(this.crossSiteHeader){
				this.writeHead(200, 'OK', {
					"Access-Control-Allow-Origin" : "*",
				    "Access-Control-Allow-Methods" : "POST, GET",
				    "Access-Control-Allow-Headers" : "POWERED-BY-NODEJS",
				    "Access-Control-Max-Age" : "30",
					"Content-Type" : 'text/html',
					'Content-Length' : Buffer.byteLength(json, 'utf-8')
				});
			}else{
				this.writeHead(200, 'OK', {
					"Content-Type": 'text/html',
					'Content-Length' : Buffer.byteLength(json, 'utf-8')
				});
			};
			this.write(json);
			this.end();
		};
		//启动服务器
		http.createServer(function(req, res){
			stat.http.requests++;
			req.get = (req.urlParsed = url.parse(req.url, true)).query;
			req.ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			log('http '+req.method+'<'+req.ip+':'+req.connection.remotePort+'>: '+req.url);
			if(req.isPost = (req.method.toLowerCase() == 'post')){
				req.body = new Buffer(_this.config.postBufferSize);
				req.bodyLength = 0;
				req.setEncoding('utf8');
				req.addListener('data', function(chunk){
					req.body.write(chunk, req.bodyLength);
					req.bodyLength += Buffer.byteLength(chunk);
					if(req.bodyLength >= _this.config.postBufferSize){
						req.bodyLength = _this.config.postBufferSize;
						req.emit('end');
					};
				}).once('end', function(){
					req.removeAllListeners('data');
					req.post = querystring.parse(req.body.toString('utf8', 0, this.bodyLength));
					(_this.urlMap[req.urlParsed.pathname] || notFoundHandler)(req, res);
				});				
			}else{
				(_this.urlMap[req.urlParsed.pathname] || notFoundHandler)(req, res);
			}			
		}).addListener('connection', function(socket){
			stat.http.connections++;
			stat.http.onlineConnections++;
			socket.addListener('close', function(){
				stat.http.onlineConnections--;
				stat.http.receiveBytes+=socket.bytesRead;
				stat.http.sendBytes+=socket.bytesWritten;
			});
		}).addListener('clientError', function(){
			stat.http.errors++;
		}).listen(this.config.port, null, function(){
			log('HTTP Server Started on '+'Port '+_this.config.port);
		});
	},
	
	urlMap : {},
	//添加路由方法
	addHandler : function(url, handlerFunc){
		this.urlMap[url] = handlerFunc;
	},
};
