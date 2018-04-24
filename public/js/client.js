// Initialize variables
var $window = $(window);
var $messages = $('.messages'); //Message area
var $inputMessage = $('.inputMessage');  //Text area to input msg
var $nameInput = $('.nameInput') //Name input
var $phoneInput = $('.phoneInput') //Phone number input
var $emailInput = $('.emailInput') //Email input
var $form = $('.formArea'); // Details form
var $widgetBox = $('.contentArea'); //Widget box
var $Input = $('.inputFields'); //Input fields in form
var $chatBox = $('.chatArea'); //Chat page after filling form
var $Typing = $(".typing") //Typing notification
var $newMsg = $('.msg_push_new'); //Dummy to push new msgs
var $oldMsg = $('.msg_push_old'); //Dummy to push msg history 

var socket = io(); //io socket
var typing = false; //Boolean to check if user is typing
var timeout = undefined; //Timeout to monitor typing
var id = localStorage.getItem("roomID"); //Room ID in localstorage
var active = sessionStorage.getItem('active'); //Check if chat has been opened. 

if (active && id) {
	$form.hide();
	$chatBox.show();
	socket.emit('add user', {
		isNewUser: false,
		roomID: id
	});
	$widgetBox.show();
}

$('.msg_head').click(function() {
	$widgetBox.slideToggle('slow');
	if (id != null && !active) {
		socket.emit('add user', {
			isNewUser: false,
			roomID: id
		});
		$form.hide();
		$chatBox.show();
		$inputMessage.focus();
		sessionStorage.setItem('active', true);
		active = true;
	}
});

$Input.submit(function() {
	$form.hide();
	$chatBox.show();
	$inputMessage.focus();
	sessionStorage.setItem('active', true);
	socket.emit('add user', {
		isNewUser: true,
		Name: $nameInput.val().trim(),
		Email: $emailInput.val().trim(),
		Phone: $phoneInput.val().trim()
	});
});

$inputMessage.keypress(function(event) {
	if (event.which !== 13) {
		if (typing === false && $inputMessage.is(":focus")) {
			typing = true;
			socket.emit("typing", {
				isTyping: true,
				roomID: id,
				person: "Client"
			});
		} else {
			clearTimeout(timeout);
			timeout = setTimeout(timeoutFunction, 2000);
		}
	} else {
		sendMessage();
		clearTimeout(timeout);
		timeoutFunction();
	}
})

$messages.on("scroll", function() {
	if ($messages.scrollTop() == 0)
		socket.emit("more messages", {});
})

socket.on('roomID', function(roomID) {
	id = roomID;
	localStorage.setItem("roomID", roomID);
});

socket.on('chat message', function(data) {
	var sender;
	if (data.isAdmin)
		sender = "msg_a"
	else
		sender = "msg_b"
	var $messageBodyDiv = $('<div class="' + sender + '">' + data.msg + '<span class="timestamp">' +
		((data.timestamp).toLocaleString().substr(15, 6)) + '</span></div>').insertBefore($newMsg);
	$messages[0].scrollTop = $messages[0].scrollHeight;
});

socket.on('typing', function(data) {
	if (data.isTyping && data.person != 'Client')
		$Typing.append("CronJ is typing...");
	else
		$Typing.text('');
});

socket.on('chat history', function(data) {
	var len = data.history.length;
	for (var i = len - 1; i >= 0; i--)
		addMessages(data.history[i], false);
});

socket.on('more chat history', function(data) {
	var len = data.history.length;
	for (var i = 0; i < len; i++)
		addMessages(data.history[i], true);
});

socket.on('log message', function(text) {
	var time = ("" + new Date());
	var $messageDiv = $('<div class="msg_a">' + text + '<span class="timestamp">' +
		(time.toLocaleString().substr(15, 6)) + '</span></div>').insertBefore($newMsg);
	$messages[0].scrollTop = $messages[0].scrollHeight;
});

socket.on('disconnect', function() {
	console.log("Disconnected!");
	$inputMessage.prop('disabled', true);
	$inputMessage.prop('placeholder', "Connection Lost! Reconnecting..");
});

socket.on('reconnect_failed', function() {
	console.log("Reconnection Failed!");
	$inputMessage.prop('placeholder', "No active connection. Please refresh page.");
});

socket.on('reconnect', function() {
	setTimeout(function() {
		console.log("Reconnected!");
		$inputMessage.prop('disabled', false);
		$inputMessage.prop('placeholder', "Type here...");
		if (active && id)
			socket.emit('add user', {
				isNewUser: false,
				roomID: id
			});
	}, 4000);
});

function timeoutFunction() {
	typing = false;
	socket.emit("typing", {
		isTyping: false,
		roomID: id,
		person: "Client"
	});
}

function sendMessage() {
	var message = $inputMessage.val();
	// Prevent markup from being injected into the message
	message = cleanInput(message);
	// if there is a non-empty message
	if (message) {
		$inputMessage.val('');
		var time = ("" + new Date());
		// tell server to execute 'new message' and send along one parameter
		socket.emit('chat message', {
			roomID: "null",
			msg: message,
			timestamp: time
		});		
		var $messageBodyDiv = $('<div class="msg_b">' + message + '<span class="timestamp">' +
			(time.toLocaleString().substr(15, 6)) + '</span></div>').insertBefore($newMsg);
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}
}

function addMessages(data, getMore) {
	var sender;
	if (data["who"])
		sender = "msg_a"
	else
		sender = "msg_b"
	var $messageBodyDiv = $('<div class="' + sender + '">' + data["what"] + '<span class="timestamp">' +
		(data["when"]).toLocaleString().substr(15, 6) + '</span></div>');
	if (getMore) {
		$messageBodyDiv.insertAfter($oldMsg);
		$messages[0].scrollTop += $messageBodyDiv.outerHeight();
	} else {
		$messageBodyDiv.insertBefore($newMsg);
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}
}

// Prevents input from having injected markup
function cleanInput(input) {
	return $('<div/>').text(input).text();
}
