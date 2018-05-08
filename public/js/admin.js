// To-do
// Add scroll to load more messages for Admins

// Initialize variables
var $window = $(window);
var $newUser = $('#windowSound')[0];
var $newChat = $('#chatSound')[0];
var $pokeAdmin = $('#pokeSound')[0];
var $usernameInput = $('.usernameInput'); // Input for username
var $passwordInput = $('.passwordInput'); //Input for password
var $loginPage = $('.login.page'); // The login page
var $errorPage = $('.error.page'); // The error page
var $chatPage = $('.chat.page'); // The chat page
var $userList = $('.adminList'); // List of online admins
var $inputMessage; // Input message input box
var $messages; // Messages area

var username;	//Store admin username
var authenticated = false; //Boolean to check if admin is authenticated 
var connected = false; 
var typing = false; //Boolean to check if admin is typing
var timeout = undefined; //Timeout to monitor typing
var socket = io(); //io socket
$newUser.loop = true;
$usernameInput.focus();
Notification.requestPermission();

socket.on('login', function(data) {
	$userList.empty();
	authenticated = data.login;
	if (authenticated) {
		$loginPage.fadeOut();
		$chatPage.show();
		socket.emit('add admin', {
			admin: username,
			isAdmin: true
		});
		$userList.append('<li id=' + username + '>' + username + '</li>');
		connected = true;
	} else {
		alert(data.err);
		$usernameInput.val('');
		$passwordInput.val('');
		username = null;
		$usernameInput.focus();
	}
})

socket.on('chat message', function(data) {
	$inputMessage = $('#' + data.roomID);
	var $parent = $inputMessage.parent().parent();
	var $chatbox = $parent.children(".chatbox");
	var $messages = $chatbox.children(".chat-messages");

	var $messagebox = "";
	if (data.isAdmin)
		$messagebox = "<div class='message-box-holder'><div class='message-box message-admin'>"+ data.msg +"</div></div>";
	else
		$messagebox = "<div class='message-box-holder'><div class='message-box message-partner'>"+ data.msg +"</div></div>";
	
	var $timestampDiv = $('<span class="timestamp">').text((data.timestamp).toLocaleString().substr(15, 6));
	$messages.append($messagebox);
	var $messageBoxes = $messages.children(".message-box-holder");
	$messages[0].scrollTop = $messages[0].scrollHeight;
	$newChat.play();
});

socket.on('admin added', function(username) {
	$userList.append('<li id=' + username + '>' + username + '</li>');
	adminListListener(username);
})

socket.on('admin removed', function(username) {
	$('#' + username).remove();
})

socket.on('New Client', function(data) {
	$('.container').append(getChatArea(data.roomID));
	$inputMessage = $('#' + data.roomID);
	var $parent = $inputMessage.parent().parent();
	var $chatbox = $parent.children(".chatbox");
	var $messages = $chatbox.children(".chat-messages");
	var $chatHeader = $parent.siblings(".chatHeader");

	var len = data.history.length;
	var partnerName = "<span class='partner-name'>"+ data.details[0] +"</span>";
	var partnerEmail = "<span class='partner-email'>"+ data.details[1] +"</span>";
	var partnerPhone = "<span class='partner-phone'>"+ data.details[2] +"</span>";

	$chatHeader.append(partnerName + " <br> " + partnerEmail + partnerPhone);
	for (var i = len - 1; i >= 0; i--) {
		var $messagebox = "";
		if (data["history"][i]["who"])
			$messagebox = "<div class='message-box-holder'><div class='message-box'>"+ data["history"][i]["what"] +"</div></div>";
		else
			$messagebox = "<div class='message-box-holder'><div class='message-box message-partner'>"+ data["history"][i]["what"] +"</div></div>";
		
		var $timestampDiv = $('<span class="timestamp">').text((data["history"][i]["when"]).toLocaleString().substr(15, 6));
		$messages.append($messagebox);
		var $messageBoxes = $messages.children(".message-box-holder");
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}
	if (!data.justJoined) {
		$newUser.play();
		notifyAdmin("New Client", "Hey there!" + data.details[0] + " needs help!");
		$parent.css('border', '2px solid red')
		$inputMessage = $('#' + data.roomID);
		$inputMessage.on("focus", function() {
			$newUser.pause();
			$parent.css('border', '1px solid black')
			$inputMessage.off('focus');
			socket.emit('client ack', {});
		});
	}
	$inputMessage.on('keypress', function(event) {
		isTyping(event);
	});
})

socket.on('typing', function(data) {
	$inputMessage = $('#' + data.roomID);
	var $parent = $inputMessage.parent();
	var $typing = $parent.children(".typing");
	if (data.isTyping)
		$typing.append("<small>" + data.person + " is typing...<small>");
	else
		$typing.text('');
})

socket.on('client ack', function() {
	$newUser.pause();
})

socket.on('User Disconnected', function(roomID) {
	$newUser.pause();
	$inputMessage = $('#' + roomID);
	$inputMessage.off();
	var $parent = $inputMessage.parent();
	$parent.remove();
})

socket.on('poke admin', function() {
	$pokeAdmin.play();
})

socket.on('reconnect', function() {
	console.log("Reconnected!");
	$userList.empty();
	$('.container').empty();
	$errorPage.fadeOut();
	$userList.append('<li id=' + username + '>' + username + '</li>');
	if (authenticated)
		socket.emit('add admin', {
			admin: username,
			isAdmin: true
		});
});

socket.on('disconnect', function() {
	console.log("Disconnected!");
	$errorPage.show();
});

socket.on('reconnect_failed', function() {
	console.log("Reconnection Failed!");
	var $errorMsg = $errorPage.children(".title")
	$errorMsg.text("Reconection Failed. Please refresh your page. ")
	$window.alert("Disconnected from chat.")
});

$passwordInput.keypress(function(event) {
	if (event.which === 13)
		setUsername();
});

function sendMessage(id) {
	$inputMessage = $('#' + id);
	var $parent = $inputMessage.parent().parent();
	var $chatbox = $parent.children(".chatbox");
	var $messages = $chatbox.children(".chat-messages");

	var message = $inputMessage.val();
	// Prevent markup from being injected into the message
	message = cleanInput(message);
	// if there is a non-empty message and a socket connection
	if (message && connected) {
		$inputMessage.val('');
		// tell server to execute 'new message' and send along one parameter
		var time = ("" + new Date());
		socket.emit('chat message', {
			roomID: id,
			msg: message,
			timestamp: time
		});

		var $messagebox = "<div class='message-box-holder'><div class='message-box'>"+ message +"</div></div>";

		// var $usernameDiv = $('<span class="username"/>').text("You");
		// var $messageBodyDiv = $('<span class="messageBody">').text(message);
		var $timestampDiv = $('<span class="timestamp">').text(time.toLocaleString().substr(15, 6));
		//var $messageDiv = $('<li class="message"/>').append($usernameDiv, $messageBodyDiv, $timestampDiv);
		
		$messages.append($messagebox);
		var $messageBoxes = $messages.children(".message-box-holder");
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}
}

function isTyping(event) {
	var id = event.target.id;
	if (event.which !== 13 && event.which !== undefined) {
		if (typing === false && $('#' + id).is(":focus")) {
			typing = true;
			socket.emit("typing", {
				isTyping: true,
				roomID: id,
				person: username
			});
		} else {
			clearTimeout(timeout);
			timeout = setTimeout(function() {
				timeoutFunction(id);
			}, 2000);
		}
	} else {
		sendMessage(id);
		clearTimeout(timeout);
		timeoutFunction(id);
	}
}

function timeoutFunction(id) {
	typing = false;
	socket.emit("typing", {
		isTyping: false,
		roomID: id,
		person: username
	});
}

function adminListListener(target) {
	$('#' + target).on('click', function() {
		var pokeAdmin = event.target.id;
		socket.emit('poke admin', pokeAdmin);
	});
}

function getChatArea(id) {
	return ("<div class='chatArea'><div class='chatHeader'></div><div class='chatbox-holder'>"+
			"<div class='chatbox'>"+
				"<div class='chat-messages'>" +
				"</div>"+
			"</div>"+
			"<div class='chat-input-holder'>" +
				"<input class='chat-input inputMessage' id='" + id + "'' placeholder='Type here...' />" +
				// "<input type='submit' value='Send' class='message-send' />"+
			"</div>");
}	

function setUsername() {
	username = cleanInput($usernameInput.val().trim());
	username = username.toLowerCase();
	password = $passwordInput.val();
	if (username) {
		// If the username is valid
		socket.emit('login', {
			admin: username,
			password: password
		});
	}
}

function notifyAdmin(title, body) {
	if (Notification.permission !== "granted")
		Notification.requestPermission();
	else {
		var notification = new Notification(title, {
			icon: '',
			body: body,
		});
		notification.onclick = function() {
			$window.focus();
			this.cancel();
		}
	}
}

// Prevents input from having injected markup
function cleanInput(input) {
	return $('<div/>').text(input).text();
}