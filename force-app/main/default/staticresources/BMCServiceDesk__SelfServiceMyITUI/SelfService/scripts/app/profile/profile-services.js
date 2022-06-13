	angular.module('profileModule')
		.factory('userProfileService', ['$q', 
		function ($q) {
				var self = {				
				};
				self.getUserProfileInfo= function(){			
					var userProfileInfo={};
					var deferred = $q.defer();  	
					 Visualforce.remoting.Manager.invokeAction(_RemotingActions.getUserProfileInfo,function(result, event) {		
							userProfileInfo['result']=result;
							userProfileInfo['event']=event;
							isUserInLightningMode = result[0].items[0].switchedToLightning;
							deferred.resolve(userProfileInfo);								
						});	
					return deferred.promise;						
				}; 	
				return self;		
			
		}]);