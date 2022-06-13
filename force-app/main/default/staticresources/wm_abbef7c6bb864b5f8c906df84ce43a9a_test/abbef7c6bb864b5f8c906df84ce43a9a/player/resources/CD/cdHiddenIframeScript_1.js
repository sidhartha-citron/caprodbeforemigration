try { 
	window.send = function(msg, audience) { 
		window.targetWindow.postMessage(msg, audience); 
	} 
} catch (err) { }