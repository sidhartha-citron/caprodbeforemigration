function extractHostURL(url) {
    // https://host.example.com/query?params=... => https://host.example.com
    return url.replace(/^((?:https?:\/\/)?[^/?]+).*$/, '$1');
}

function extractDomainURL(url) {
    // https://host.example.com/query?params=... => https://example.com
    return url.replace(/^(https?:\/\/)?(?:[^/?]+\.)*([^/?]+\.[^/?]+).*$/, '$1$2');
}

function removeTrailingSlashesFromURL(url) {
    // https://example.com/arcgis/rest/ => https://example.com/arcgis/rest
    return url.replace(/\/+$/, '');
}

function removeParametersFromURL(url) {
    // https://host.example.com/query?params=... => https://host.example.com/query
    return url.replace(/\?.*$/, '');
}

// https://stackoverflow.com/a/2901298
function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function round(x) {
    if (x < 0.001)
        decimal = 6;
    else if (x < 1)
        decimal = 3;
    else
        decimal = 2;
    multiplier = Math.pow(10, decimal);
    return Math.round(x * multiplier) / multiplier;
}

// https://codepen.io/shaikmaqsood/pen/XmydxJ/
function copyToClipboard(element) {
	var $temp = $('<input>');
	$('body').append($temp);
	$temp.val($(element).text()).select();
	document.execCommand('copy');
	$temp.remove();
}

// https://learn.jquery.com/using-jquery-core/faq/how-do-i-select-an-element-by-an-id-that-has-characters-used-in-css-notation/
function escapeElementId(id) {
	return '#' + id.replace(/(:|\.|\[|\]|,|=|@)/g, '\\$1');
}

// https://blog.element84.com/polygon-winding-post.html
function calculatePolygonArea(path) {
	var ret = (path[0].lng() - path[path.length-1].lng()) * (path[0].lat() + path[path.length-1].lat());
	for (var i = 0; i < path.length - 1; i++)
		ret += (path[i+1].lng() - path[i].lng()) * (path[i+1].lat() + path[i].lat());
	return ret / 2.0;
}

function findPolygonWinding(path) {
	return calculatePolygonArea(path) > 0;
}