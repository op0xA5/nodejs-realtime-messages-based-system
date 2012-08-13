// JavaScript Document
var toUser, myName, showInOut = false;
function show(text){
	var e = $('#msgShow')[0];
	e.value += (text+'\n');
	e.scrollTop = e.scrollHeight;
}
function userIn(name){
	userOut(name);
	$('#userList').append($('<option />').text(name));
	$('#onlineNum').text('在线人数: '+$('#userList option').length);
}
function userOut(name){
	$('#userList option').each(function(){
		if($(this).text() == name) $(this).remove();
	});
	if(toUser == name){
		toUser=false;
		$('#toName').text('所有人');
	}
	$('#onlineNum').text('在线人数: '+$('#userList option').length);
}
var myConn = new connection('http://zhujinliang.info:81/longpoll');
myConn.onSuspend(function(){
	$('#connection').text('连接断开,重试连接');
	$('#connection').addClass('clickable');
	$('#loginPage').show();
	$('#chatPage').hide();
});
myConn.onMsgIn(function(data){
	switch(data.type){
		case 'userList':

		break;
		case 'userIn':
			if(data.name) userIn(data.name);
			if(showInOut) show('['+data.name+' 进入聊天室]');
		break;
		case 'userOut':
			if(data.name) userOut(data.name);
			if(showInOut) show('['+data.name+' 退出聊天室]');
		break;
		case 'chat':
			var txt='';
			txt += (data.private ? '[私聊]' : '');
			txt += data.name;
			txt += ' : ';
			txt += data.msg;
			show(txt);
		break;
	}
});

$(function(){
	
	var connectServer = function(){
		if(myConn.connect(function(isok){
			if(isok){
				$('#connection').text('已连接服务器');
				$('#connection').removeClass('clickable');
				$('#startChat').attr('disabled', null);
			}else{
				$('#connection').text('连接失败,重试连接');
				$('#connection').addClass('clickable');
			}
		}, {
			msg : {type:'listUser'},
			callback : function(isok, data){
				if(isok){
					if(data.length>0){
						for(var i in data){
							userIn(data[i]);
						}
					}else{
						$('#userList option').remove();
						$('#onlineNum').text('在线人数: 0');
					}
				}else{
					$('#onlineNum').text('列表失败');
				}
			}			
		})){
			$('#connection').text('正在连接服务器...');
			$('#connection').removeClass('clickable');
		};	
	};
	connectServer();
	$('#startChat').click(function(){
		if(!myConn.conn){
			alert('未连接服务器，请稍等或刷新页面重试');
			return;
		}
		var _myName = $('#username').val();
		if(_myName){
			myConn.send({type:'join', name:_myName}, function(isok, data){
				if(isok){
					$('#loginPage').hide();
					$('#chatPage').show();
					myName = _myName;
					userIn(myName);
				}else{
					alert('服务器报告错误: '+data.code);
				}
			});
		}else{
			alert('请输入用户名');
		}
	});
	
	$('#sendMsg').click(function(){
		if(!myConn.conn){
			alert('未连接服务器，请稍等或刷新页面重试');
			return;
		}
		var usermsg = $.trim($('#usermsg').val());
		if(usermsg == ''){
			alert('不能发送空文本');
		}else{
			var _toUser = toUser;
			var sendDat = {
				'type' : 'chat',
				'msg' : usermsg
			};
			if(_toUser) {
				sendDat.to = _toUser;
			}
			myConn.send(sendDat,function(isok, data){				
				if(isok){
					var txt='';
					txt += '[我';
					txt += (_toUser ? '->'+toUser : '');
					txt += ']: ';
					txt += usermsg;
					show(txt);
				}else{					
					show('[消息 '+usermsg+' 发送失败: '+data.code+']');
				}
			});
			$('#usermsg').val('');
		};	
	});	
	
	$('#userList').change(function(){
		toUser = $('#userList').val();
		if(toUser){
			if(toUser == myName){
				toUser = false;
				$('#toName').text('所有人');
			}else{
				$('#toName').text(toUser);
			}
		}else{
			toUser = false;
			$('#toName').text('所有人');
		}		
	});
	$('#toAll').click(function(){
		toUser = false;
		$('#toName').text('所有人');
	});
	$('#usermsg').keydown(function(e){
		if(e.keyCode == 13 && e.ctrlKey == true){
			$('#sendMsg').click();
		}
	});
	
	$('#connection').click(function(){
		if(!myConn.conn){
			connectServer();
		}
	});
	
	$('#showinout').click(function(){
		showInOut = !showInOut;
		$(this).text(showInOut ? '进入退出(显示)' : '进入退出(不显示)');
	});
});

