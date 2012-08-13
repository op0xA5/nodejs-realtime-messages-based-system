exports.init=function(){
	
	config.httpCore.addHandler('/trace', function(req, res){
		
		if(req.isPost()){
			req.getPost(function(){				
				res.jsonOut(req.headers);
			});
		}else{
			res.write('need to be post');
			res.end();
		};
	});
	
};