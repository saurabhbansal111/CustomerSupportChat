var redis = require('redis');
var config = require('../config');
var Q = require('q');
var redisClient;

exports.ConnectToRedis = function(startApp) {
	redisClient = redis.createClient(config.redis_port, config.redis_hostname);

	redisClient.on('ready', function() {
		console.log('Connected to Redis');
		startApp(true);
	});

	redisClient.on('error', function() {
		console.log('Failed to connect to Redis');
		startApp(false);
	});
}

exports.getMessages = function(roomID, startPos, endPos) {
	if (endPos == undefined) {
		if (startPos > -10 && startPos < 0)
			endPos = -1;
		else
			endPos = startPos + 9
	}
	var deffered = Q.defer();
	redisClient.lrange(roomID, startPos, endPos, function(err, res) {
		if (!err) {
			var result = [];
			// Loop through the list, parsing each item into an object
			for (var msg in res)
				result.push(JSON.parse(res[msg]));
			result.push(roomID);
			deffered.resolve(result)
		} else {
			deffered.reject(err);
		}
	});
	return deffered.promise;
}

exports.pushMessage = function(data) {
	redisClient.lpush(data.roomID, JSON.stringify({
		who: data.isAdmin,
		what: data.msg,
		when: data.timestamp
	}));
}

exports.setDetails = function(data) {
	redisClient.hmset(data.roomID + "-details", {
		'Name': data.Name,
		'Email': data.Email,
		'Phone': data.Phone
	});
}

exports.getDetails = function(roomID) {
	var deffered = Q.defer();
	redisClient.hmget(roomID + "-details", ["Name", "Email", "Phone"], function(err, result) {
		if (!err) {
			deffered.resolve(result)
		} else {
			deffered.reject(err);
		}
	});
	return deffered.promise;
}

exports.getMsgLength = function(roomID) {
	var deffered = Q.defer();
	redisClient.llen(roomID, function(err, len) {
		if (!err) {
			deffered.resolve(len);
		} else {
			deffered.reject(err);
		}
	});
	return deffered.promise;
}