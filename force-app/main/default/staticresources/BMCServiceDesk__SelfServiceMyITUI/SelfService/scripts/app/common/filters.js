
	angular.module('selfServiceApp')
		.filter('fileSize', fileSize)
		.filter('htmlToText', htmlToText)
		.filter('cut', cut)
		.filter('toCamelCase', toCamelCase);
	
	
	angular.module('selfServiceApp').filter('filterEditableFields', function() {
		return function(items,prop){
			var result = [];
			angular.forEach(items,function(item,key){
				if(!item.Editable && (item.Name != 'requestFor' || !prop) && item.Name!='approvalRequired'){
					result.push(item);
				}
			});
			return result;
		}
	});
	angular.module('selfServiceApp').filter('filterNonEditableFields', function() {
		return function(items,prop){
			var result = [];
			angular.forEach(items,function(item,key){
				if(item.Editable){
					result.push(item);
				}
			});
			return result;
		}
	});
	angular.module('selfServiceApp').filter('removeUndefined', function() {
		return function(items, prop) {
			var requestedFor;
			var email;
			var phone;
			var requestedBy;
			var otherDisplayOptions = []; //includes Turnaround Time, Unit Price, Total Price, Date Expected
			var dateRequired;
			var quantity;
			angular.forEach(items, function(item, key) {
				if (item.hasOwnProperty(prop) && typeof item[prop] != 'undefined' && item[prop] !== null && 
					item.Name != 'dateRequired' && item.Name != 'quantity' && item.Name != 'email' && 
					item.Name != 'requestFor' && item.Name != 'requestedBy' && item.Name != 'phone'){
						otherDisplayOptions.push(item);
				}else if(item.hasOwnProperty(prop) && typeof item[prop] != 'undefined' && item[prop] !== null && item.Name == 'dateRequired'){
					dateRequired = item;
				}else if(item.hasOwnProperty(prop) && typeof item[prop] != 'undefined' && item[prop] !== null && item.Name == 'quantity'){
					quantity = item;
				}else if(item.hasOwnProperty(prop) && typeof item[prop] != 'undefined' && item[prop] !== null && item.Name == 'email'){
					email = item;
				}else if(item.hasOwnProperty(prop) && typeof item[prop] != 'undefined' && item[prop] !== null && item.Name == 'requestFor'){
					requestedFor = item;
				}else if(item.hasOwnProperty(prop) && typeof item[prop] != 'undefined' && item[prop] !== null && item.Name == 'requestedBy'){
					requestedBy = item;
				}else if(item.hasOwnProperty(prop) && typeof item[prop] != 'undefined' && item[prop] !== null && item.Name == 'phone'){
					phone = item;
				}
          	});
			var filtered = [];
			
			if(typeof(requestedFor) != 'undefined' && requestedFor != null){
				filtered.push(requestedFor);
			}
			if(typeof(email) != 'undefined' && email != null){
				filtered.push(email);
			}
			if(typeof(phone) != 'undefined' && phone != null){
				filtered.push(phone);
			}
			if(typeof(requestedBy) != 'undefined' && requestedBy != null){
				filtered.push(requestedBy);
			}
			if(typeof(otherDisplayOptions) != 'undefined' && otherDisplayOptions != null && otherDisplayOptions.length > 0){
				filtered = filtered.concat(otherDisplayOptions);
			}
			if(typeof(dateRequired) != 'undefined' && dateRequired != null){
				filtered.push(dateRequired);
			}
			if(typeof(quantity) != 'undefined' && quantity != null){
				filtered.push(quantity);
			}
			return filtered;
		};
	});
	
	angular.module('selfServiceApp').filter('StaticFieldsFilter', function() {
		return function(items, prop) {
			var requestedFor;
			var filtered = [];
			
			angular.forEach(items, function(item, key) {
				if (item.hasOwnProperty(prop) && typeof item[prop] != 'undefined' && item[prop] !== null && item.Name != 'requestFor'){
						filtered.push(item);
				}else if(item.hasOwnProperty(prop) && typeof item[prop] != 'undefined' && item[prop] !== null && item.Name == 'requestFor'){
					requestedFor = item;
				}
          	});
			
			if(typeof(requestedFor) != 'undefined' && requestedFor != null){
				filtered.push(requestedFor);
			}
			return filtered;
		};
	});
	
	angular.module('selfServiceApp').filter('incidentFieldsFilter', function() {
		return function(items, prop) {
			var filtered = [];
			
			angular.forEach(items, function(item, key) {
				if(item.id.toLowerCase() != 'name'){
					filtered.push(item);
				}
          	});
			
			return filtered;
		};
	});
	
	angular.module('selfServiceApp').filter('createAnchors', ['$sce', function ($sce) {
	    return function (str) {
	    	if (str)
	        	return $sce.trustAsHtml(str.
	                                replace(/</g, '&lt;').
	                                replace(/>/g, '&gt;').
	                                replace(/(http[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
	                               );
	        else
	        	return '';
	    }
	}]);
	
	angular.module('selfServiceApp').filter('newlines', function () {
	    return function (str) {
	    	if (str)
	    		return str.replace(/\n/g, '<br/>');
	        else
	        	return '';
	    }
	});
	
	angular.module('selfServiceApp').filter('orderObjectBy', function() {
	 	return function(items, field, reverse) {
			function isNumeric(n) {
				return !isNaN(parseFloat(n)) && isFinite(n);
			}
          
			var filtered = [];

			angular.forEach(items, function(item, key) {
            	item.key = key;
            	filtered.push(item);
          	});

          	function index(obj, i) {
	        	return obj[i];
			}

			filtered.sort(function (a, b) {
            	var comparator;
            	var reducedA = field.split('.').reduce(index, a);
            	var reducedB = field.split('.').reduce(index, b);

            	if (isNumeric(reducedA) && isNumeric(reducedB)) {
				    reducedA = Number(reducedA);
                    reducedB = Number(reducedB);
            	}

				if (reducedA === reducedB) {
					comparator = 0;
            	} else {
              		comparator = reducedA > reducedB ? 1 : -1;
            	}
	            return comparator;
    	    });
	        if (reverse) {
    		    filtered.reverse();
			}
			return filtered;
		};
	});
	
	angular.module('socialModule').filter('getTime', function() {
		 return function(input){
		  input = input.split(" ");
		  if(input.length == 3){
			return input[1] + " " + input[2];
		  }else if(input.length == 2){
			return input[1];
		  }else{
			return '';
		  }
	   }
	});
	
	angular.module('socialModule').filter('getDate', function() {
		 return function(input){
		  input = input.split(" ");
		  if(input.length >= 1){
			return input[0];
		  }else{
			return '';
		  }
	   }
	});
	
	function fileSize() {
		return function (input) {
			if (isNaN(input)) {
				return '';
			}

			var kiloByte = 1024,
				megaByte = 1048576,
				gigaByte = 1073741824,
				fileSize = parseInt(input),
				fileSizeLabel;

			if (fileSize > gigaByte) {
				fileSizeLabel = (fileSize / gigaByte).toFixed(1) + " GB";
			} else if (fileSize > megaByte) {
				fileSizeLabel = (fileSize / megaByte).toFixed(1) + " MB";
			} else if (fileSize > kiloByte) {
				fileSizeLabel = Math.floor(fileSize / kiloByte) + " KB";
			} else {
				fileSizeLabel = fileSize + " B";
			}

			return fileSizeLabel;
		};
	}


	/**
	 * Filter returns string without html tags
	 */
	function htmlToText() {
		return function (input) {
			return String(input).replace(/<[^>]+>/gm, '');
		};
	}


	/**
	 * Smart string cutter
	 *
	 * Usage:
	 *   {{some_text | cut:true:100:' ...'}}
	 * Options:
	 *   - wordwise (boolean) - if true, cut only by words bounds,
	 *   - max (integer) - max length of the text, cut to this number of chars,
	 *   - tail (string, default: ' ...') - add this string to the input
	 *     string if the string was cut.
	 */
	function cut() {
		return function (value, wordwise, max, tail) {
			if (!value) {
				return '';
			}

			max = parseInt(max, 10);

			if (!max) {
				return value;
			}

			if (value.length <= max) {
				return value;
			}

			value = value.substr(0, max);

			if (wordwise) {
				var lastSpace = value.lastIndexOf(' ');
				if (lastSpace !== -1) {
					value = value.substr(0, lastSpace);
				}
			}

			return value + (tail || ' ...');
		};
	}
	
	function toCamelCase() {
		return function (input) {
			if (angular.isString(input)) {
				return input.toLowerCase()
					.replace(/['"]/g, '')
					.replace(/\W+/g, ' ')
					.replace(/ (.)/g, function ($1) { return $1.toUpperCase(); })
					.replace(/ /g, '');
			} else {
				return input || '';
			}
		}
	}