//by:zhujinliang

var autoScroll = true;

$(function(){
	
	//convList 鼠标响应
	var convTrBind = function(e){
		e.hover(function(){
			$(this).addClass('hover');
		}, function(){
			$(this).removeClass('hover');
		}).click(function(){
			$('#convContainer .opened').removeClass('opened');
			$(this).addClass('opened');
			
			//
			var tmpText = '', tmpObj;
			tmpObj = $(this).data('createTime');
			if(tmpObj){
				tmpText += '// '+tmpObj+'\r\r';
			}
			tmpObj = $(this).data('inData');
			if(tmpObj){
				tmpText += '//receiveData\r';
				tmpText += JsonUti.convertToString(tmpObj)+'\r\r';
			}
			tmpObj = $(this).data('outData');
			if(tmpObj){
				tmpText += '//sendData\r';
				tmpText += JsonUti.convertToString(tmpObj)+'\r\r';
			}
			tmpObj = $(this).data('rtnData');
			if(tmpObj){
				tmpText += '//returnData\r';
				tmpText += JsonUti.convertToString(tmpObj)+'\r\r';
			}
			$('#textOutput').text(tmpText);
		});
	};convTrBind($('#convContainer li'));
	var showNewMessage = function(dir, type){	
		var li = $('<li>').data('createTime', new Date()).addClass(dir).text(type);
		convTrBind(li);
		li.appendTo('#convContainer');
		li.saveData = function(name, val){
			li.data(name, val);
			if(li.hasClass('opened')) li.click();
		}
		if(autoScroll){
			var e=$('#convContainer')[0];
			e.scrollTop = e.scrollHeight;
			li.click();
		}
		return li;	
	}
	
	//模板存取逻辑
	var templetes = localGet('templetes') || localSet('templetes', {'blank':'{\r    "type":""\r}'});
	var reloadTemplete = function(){
		$('#selTemplete').children().remove()
		$('#selTemplete').append($('<option>')
			.text('')
			.attr('seleted', 'seleted')
			.addClass('optNull')
		);
		for(var i in templetes){
			$('#selTemplete').append($('<option>').text(i));
		}
	};reloadTemplete();
	$('#selTemplete').change(function(){		
		if(!$('#selTemplete').find('option:selected').hasClass('optNull')){
			$('#textInput').val(templetes[$('#selTemplete').val()]);
		}
	});
	$('#btnSaveTemplete').click(function(){
		var pName = '';
		var e=$('#selTemplete').find('option:selected');
		if(!e.hasClass('optNull')){
			pName = e.text();
		}
		var pName = prompt('模板名称', pName);
		if(pName){
			if(pName in templetes){
				if(confirm('模板 '+pName+' 已存在，是否替换?')){
					templetes[pName] = $('#textInput').val();
				}
			}else{
				templetes[pName] = $('#textInput').val();
			}
			localSet('templetes', templetes);
			reloadTemplete();
		}
	});
	$('#btnDelTemplete').click(function(){
		var e=$('#selTemplete').find('option:selected');
		if(!e.hasClass('optNull')){
			var pName = e.text();
			if(confirm('确认删除模板 '+pName+' ?')){
				delete templetes[pName];				
				localSet('templetes', templetes);
				reloadTemplete();
			}
		}
	});
	
	$('#btnSendMsg').click(function(){
		var sData = $('#textInput').val();
		if(!sData){
			return;			
		}
		if(!myConn.conn){
			if(confirm('尚未连接服务器，是否连接?')){
				$('#btnConnect').click();
			}
			return;
		}
		try{
			sData = JSON.parse(sData);
		}catch(err){
			alert('JSON序列化错误: '+err.message);
			return;
		}
		if(!sData){			
			alert('JSON格式错误');
			return;
		}			
		if(!sData.type){
			alert('没有type属性');
			return;
		}
		
		var li = showNewMessage('upStream', sData.type);
		li.saveData('outData', sData);
		myConn.send(sData, function(isok, data){
			if(!isok){
				li.addClass('error');
				li.text(sData.type+' ('+data.code+')');
			}
			li.saveData('rtnData', data);
		});
	});

	var myConn = new connection();
	var connServer = function(){
		if(myConn._baseUrl){
			$('#btnConnect').text('正在连接...');
			myConn.connect(function(ok){
				if(ok) {
					$('#btnConnect').text('已连接');
					showNewMessage('info', '已连接');
					localSet('serverURL', myConn._baseUrl);
				}else{
					$('#btnConnect').text('连接服务器');
					showNewMessage('info', '连接失败');
				}
			});
		}else{
			var url = prompt('服务器BaseURL',localGet('serverURL'));
			if(url){
				myConn._baseUrl = url;
				connServer();				
			}
		}	
	};
	
	myConn.onMsgIn(function(data){		
		var li = showNewMessage('downStream', data.type);
		li.saveData('inData', data);
	});
	
	myConn.onSuspend(function(){
		$('#btnConnect').text('连接服务器');
		showNewMessage('info', '连接断开');		
	});	
	
	$('#btnConnect').click(function(){
		if(!myConn.conn) connServer();
	});
	
	$('#btnAutoScroll').click(function(){
		$(this).children('span').text((autoScroll=!autoScroll) ? 'ON' : 'OFF');
	});

})