//simple msg router - echo, return msg to self
//Project: SWT chatserver test version
//by: zhujinliang
//ver0 2012.08.02

module.exports = {
		
	init : function(){
		$.connections.addMsgHandler('echo', function(conn, msg){
			conn.write(msg);
			return new okResponse();
		});
	}

};