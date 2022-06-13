try { 
	window.send = function(msg, audience) { 
		window.targetWindow.postMessage(msg, audience); 
	};
	window.parent._walkmeInternals.hiddenIframeCallback();
} catch (err) { }