var nodemailer = require('nodemailer');
var dbFunctions = require('./dbStore/dbFunctions');
var Q = require('q');
var generator = require('xoauth2').createXOAuth2Generator({
	user: "",
	clientId: "",
	clientSecret: "",
	refreshToken: "",
	accessToken: ""
});

var transporter = nodemailer.createTransport(({
	service: 'gmail',
	auth: {
		xoauth2: generator
	}
}));

var mailOptions = {
	from: "Sender <sernder@email.com>", // sender address 
	to: "admin@email.com", 				// list of receivers 
	subject: '', 						// Subject line 
	generateTextFromHTML: true,
	html: ""
};

exports.sendMail = function(data) {
	dbFunctions.getMessages(data.roomID, 0, data.MsgLen - 1)
		.then(function(history) {
			//mail only if history is !null
			history.splice(-1, 1);
			mailOptions.subject = "Chat with " + data.email[0];
			if (history.length) {
				formatMail(history, data.email);
				transporter.sendMail(mailOptions, function(error, response) {
					if (error)
						console.log(error);
				});
			}
			mailOptions.html = "";
		})
		.catch(function(error) {
			console.log("Mail.js : ", error)
		})
		.done();
}

exports.alertMail = function() {
	mailOptions.subject = "Customer is trying to chat";
	mailOptions.html = "No admins are online and a customer needs help.";
	transporter.sendMail(mailOptions, function(error, response) {
		if (error)
			console.log(error);
	});
}

function formatMail(history, details) {
	var len = history.length;
	mailOptions.html = "<b>" + details[0] + "</b><br><b> Email ID : " + details[1] + "</b><br><b> Phone : " +
		details[2] + "</b><br><br> Chat History <br><br>";
	for (var i = len - 1; i >= 0; i--) {
		var sender;
		if (history[i]["who"])
			sender = "Admin"
		else
			sender = "Client"
		var when = (history[i]["when"]).toLocaleString().substr(15, 6);
		mailOptions.html += "<b>" + sender + "</b>: " + history[i]["what"] + "<br>";
	}
}