	angular.module('userModule')
		.factory('userService',['$q', 
			function ($q) {
				var self = {				
				};
				self.getUserInfo= function(){			
					var userInfo={};
					var deferred = $q.defer();  		
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getLoggedInUserId,function(result, event) {		
							userInfo['result']=result;
							userInfo['event']=event;
							deferred.resolve(userInfo);								
						});	
					return deferred.promise;						
				}; 	
				
				self.getMyProfile = function(){
					var userInfo={};
					var deferred = $q.defer();  		
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getMyProfile,null,function(result, event) {		
							userInfo['result']=result;
							userInfo['event']=event;
							console.log(userInfo['result']);
							deferred.resolve(userInfo);								
						});	
					return deferred.promise;
				}
				self.saveMyProfile = function(profileInfo){
					var finalResult = {};
					var deferred = $q.defer();  		
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.saveMyProfile,profileInfo,null,function(result, event) {	
						finalResult['event']=event;
						deferred.resolve(finalResult);	
					});	
					return deferred.promise;
				}
				
				return self;				
			}
		]);