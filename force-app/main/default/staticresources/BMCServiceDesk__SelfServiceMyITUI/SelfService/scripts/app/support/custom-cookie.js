/************************************************** */
// Default expiry date: 10 years
// Default samesite : none
//
/************************************************************* */
function setRFCookies(key, value, options) {
	if ( key !== undefined && value !== undefined) {

		if(!options.expires) {
			var tenYears = new Date();
			tenYears.setYear(tenYears.getFullYear() + 10);
			options.expires = tenYears;
		}
		
		if (typeof options.expires === 'number') {
			var days = options.expires, t = options.expires = new Date();
			t.setDate(t.getDate() + days);
		}		

		return (document.cookie = [
			encodeURIComponent(key),
			'=',
			encodeURIComponent(value),
			options.expires 	? '; expires=' 	+ options.expires.toUTCString() : '', 
			options.path    	? '; path=' 	+ options.path : '',
			options.domain  	? '; domain=' 	+ options.domain : '',
			// options.samesite	? '; samesite=' + options.samesite : 
			'; samesite= None',
            '; secure' 
		].join(''));
	} 
}