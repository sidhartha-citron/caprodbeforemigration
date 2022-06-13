	angular.module('userModule')
		.factory('userModel', ['userService','$log','errorModel', '$uibModal','$timeout',
			function (userService,$log,errorModel,$uibModal,$timeout) {
				var self = {
					state: {}					
				};
				self.permissions = {
					isSubmitTicketOrSRAllowed : (typeof(_ObjectPermissions) != 'undefined' && _ObjectPermissions != null) ? _ObjectPermissions.isIncidentCreateable : true,
					isEditTicketOrSRAllowed : (typeof(_ObjectPermissions) != 'undefined' && _ObjectPermissions != null) ? _ObjectPermissions.isIncidentUpdateable : true
				};
				self.profileInfo ={questions : []};
                self.getLoggedInUserId=function(){					
					return userService.getUserInfo().then(processUserInfo);				
				}; 
				
				self.saveMyProfileInfo = function(profileInfo){		
					return userService.saveMyProfile(JSON.stringify(profileInfo));
				};

				self.htmlDecode=function (input){
					if(input)
						return angular.element('<div>' + input + '</div>').text().replace(/&amp;/g, '&').replace(/(?:\\[rn]|[\r\n]+)+/g,'');
					return '';
				};
				
				function processUserInfo(userInfoResult){
					if (userInfoResult.event.status) {
						self.userId=userInfoResult.result.userId;
						self.userEmail=userInfoResult.result.email;						
						self.userName =	userInfoResult.result.userName;	
						self.userLang =	userInfoResult.result.userLang;	
						self.UserPhone = userInfoResult.result.userPhone;	
						self.allowClose=userInfoResult.result.allowClose;
						self.allowOpen=userInfoResult.result.allowReOpen;
						self.allowCopy=userInfoResult.result.allowCopy;
						self.allowEdit=userInfoResult.result.allowEdit;
						self.allowNotes=userInfoResult.result.allowNotes;
						self.canSeeTasks=userInfoResult.result.CanSeeTasks;
						self.isOnBehalfOfEnabled=userInfoResult.result.isOnBehalfOfEnabled;
						self.dateFormat=userInfoResult.result.dateFormat;
						self.currentTime=userInfoResult.result.currentTime;
						self.dateTimeFormat=userInfoResult.result.dateTimeFormat;
						self.userCurrency=userInfoResult.result.userCurrency;
						self.timeZoneOffset=userInfoResult.result.timeZoneOffset;
						self.timeZoneOffSetMinutes=userInfoResult.result.timeZoneOffSetMinutes;
						self.isPortalUser=userInfoResult.result.isPortalUser;
						self.userLocale=userInfoResult.result.userLocale;
						self.enableLocaleNumberFormat=userInfoResult.result.enableLocaleNumberFormat;
						self.localeDecimalSeparator=userInfoResult.result.localeDecimalSeparator;
						self.LayoutFldsandCriteria=userInfoResult.result.LayoutFldsandCriteria;
					}else{
						self.error='';	
						$log.error("User data is empty");
						return;						
					}
				}
				
	            function dismissClientForm(uibModalInstance, sourceId) {
					errorModel.clearAllErrors();
					uibModalInstance.dismiss('cancel');
	                if (sourceId) {
	                	var userNameElement = document.getElementById(sourceId);
	                	var userNameDiv = angular.element(userNameElement);
	                	if (userNameDiv)
	                    	userNameDiv.focus();
					}
	            }
				
				self.close = function (result){
					self.uibModalInstance.close(result);
				};
				
	            self.showClientFormDialog = function(templateId, sourceId) {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
						templateUrl: resourceUrl+'views/user/user-modal.html',
						backdrop: 'static',
						ariaLabelledBy:'support-modal-header__title',
						controller: ['$uibModalInstance', '$scope', 'userModel', '$state',
							function ($uibModalInstance, $scope, userModel, $state) {
								//supportModel.modalInstance = $modalInstance;
							 	//$scope.incident = supportModel.incident;
								//$scope.supportModel = supportModel;
								//var baseUrlVal=$("a[id*='selfServiceResourcesUrl']").attr('href');
								$scope.userModel = userModel;
								$scope.profileInfo = userModel.profileInfo;
								userModel.uibModalInstance = $uibModalInstance;
								userModel.dataLoading = true;
								userModel.profileInfo.questions = [];
								userService.getMyProfile().then(function(user){
									if(user.event.status){
										angular.forEach(user.result.userDetails, function(question) {
											question.Type = question.Type.toLowerCase();
											if(question.Type != "boolean")
												question.Value = self.htmlDecode(question.Value);
											userModel.profileInfo.questions.push(question);
										});
									}else{
										var formError={
											text : result.event.result,
											hide : "10000"
										};
										errorModel.clearAllErrors();
										formError.text = supportModel.htmlDecode(formError.text);
										errorModel.addModalError(formError);
									}
									userModel.dataLoading= false;
								});
								$scope.$watchCollection('userModel.profileInfo', function () {									
										$scope.profileInfo = userModel.profileInfo;
										$scope.userModel = userModel;
								});
								$scope.resourceUrl=resourceUrl+'views/user/user-details.html';
								$scope.questionListUrl=	resourceUrl+'views/user/user-questions-list.html';
								$scope.cancel = function () {
	                                dismissClientForm($uibModalInstance, sourceId);
								};
							}]
					});
				};
				
				return self;
			}
		]);