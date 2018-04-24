var url = "";
var port = "";

$.ajax({
	type: "GET",
	url: "https://" + url + ":"+ port +"/ping", //
	success: function(data) {
		$('<iframe src="https://' + url + ':'+ port +'/ id="chatApp" frameborder="0" width="300px" height="400px" style="position: fixed;bottom: -5px;right:20px;background:none transparent; z-index: 100;" scrolling="no" allowtransparency="true" onload="this.style.visibility = "visible></iframe>').appendTo('body');
	}
});