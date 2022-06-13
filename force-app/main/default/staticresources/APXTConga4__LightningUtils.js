(function(w) {
    "use strict";
    
	var utilMethods = {
		"navigateTo": navigateTo,
		"compareName": compareName
    };
    
	function navigateTo(cmp, navigateTarget) {
		window.location.assign('/apex/'+navigateTarget+'?theme='+cmp.get("v.theme"));
    }
    
	function compareName(a, b) {
		const nameA = a.Name.toUpperCase();
		const nameB = b.Name.toUpperCase();
		var comparison = 0;
		if(nameA > nameB) {
			comparison = 1;
		} else if (nameA < nameB) {
			comparison = -1;
		}
		return comparison;
	}
	w.lightningUtils = utilMethods;
})(window);