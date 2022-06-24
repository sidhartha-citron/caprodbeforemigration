angular.module('selfServiceApp')
		.factory('decodeResponseModel', [
			function () {
				var self = {};

				self.htmlUnescape = function(response){
                	if(response){
				    	response = response.replace(/&quot;/g, '"');
				    	response = response.replace(/&#39;/g, "'");
				    	response = response.replace(/&lt;/g, '<');
				    	response = response.replace(/&gt;/g, '>');
				    	response = response.replace(/&amp;/g, '&');
						response = response.replace(/%2F/g, '/');
						response = response.replace(/&nbsp;/g, ' ');
				        return response;
				    }else{
				    	return '';
				    }
                }
				return self;
			}
]);
