function GoBack(bTopFrameUrl)
{
	var myBackURL = location.search.substr(1).split("&")[0].split("=")[1];
	if(bTopFrameUrl)
		this.parent.location.href = myBackURL;
	else
		this.location.href = myBackURL;
}

function getBackURL()
{
	var myGetBackURL = location.search.substr(1).split("&")[0];
	return myGetBackURL;
}