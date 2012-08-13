//by:zhujinliang
if(window.localStorage){
	var localSet = function(name, data){
		localStorage[name] = JSON.stringify(data);
		return data;
	}
	var localGet = function(name){
		var tmpStr = localStorage[name];
		if(tmpStr){
			try{
				return JSON.parse(tmpStr);
			}catch(err){
				return null;
			}
		}else{
			return null;	
		}
	}
	var localFind = function(regexp){
		var rtnArr = {};
		for(var i in localStorage){
			if(regexp.test(i)) rtnArr[i] = localGet(i);
		}
	}
}else{
	alert('您的浏览器不支持LocalStorage');
	var localSet = function(){};
	var localGet = function(){};
}// JavaScript Document