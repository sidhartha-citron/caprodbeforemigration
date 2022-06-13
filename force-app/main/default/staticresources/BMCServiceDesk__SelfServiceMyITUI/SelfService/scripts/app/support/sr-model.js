	angular.module('supportModule')
		.factory('srModel', ['attachmentService', 'errorModel', '$filter', '$q', 'supportService', 'thumbnailCache', 'userModel','$sce', '$rootScope',
			function (attachmentService, errorModel, $filter, $q, supportService, thumbnailCache, userModel,$sce,$rootScope) {
				var self = {};
				self.sce = $sce;
				self.srDetailsCache={};
				self.htmlDecode=function (input){
					if(input)
						return angular.element('<div>' + input + '</div>').text().replace(/&amp;/g, '&');
					return '';
				}
				self.resolution=null;
				self.addingComment = false;
				self.cancelingRequest = false;
				self.srCache = {};
				
				function updateSR(id,action,resolution){
						var deferred = $q.defer();  
						var nullVar=[];
						if(!resolution){
							resolution = null;
						}
						Visualforce.remoting.Manager.invokeAction(_RemotingActions.updateSR, id,action,resolution, null, function(result, event) {
							if (event.status) {	
								deferred.resolve();
								$rootScope.$emit("refreshActivityStream", {});
								return ;
							}else{
								deferred.resolve(self.htmlDecode(event.message));
								return self.htmlDecode(event.message);
							}
						});	
						return deferred.promise;	
					} 
					
					
				self.cancelServiceRequest = function (id,resolution) {					

					self.cancelingRequest = true;
						
					return updateSR(id,'Close',resolution).then(function (result) {
							return result;
						})
						['finally'](function () {
							self.cancelingRequest = false;
						});
				};
				
				
				self.reopenServiceRequest = function (id) {					

					self.cancelingRequest = true;

					return updateSR(id,'Reopen').then(function (result) {
							if (result != undefined && result != null) {
								return result;
							} else {
								if (self.srCache[id]) {
									self.srCache[id].isOpen = false;
									self.srCache[id].status = 'Reopened';
								}
								return result;
							}
							
						})
						['finally'](function () {
							self.cancelingRequest = false;
						});
				};

				return self;
			}
		]);
