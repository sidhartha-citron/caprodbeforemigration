	angular.module('profileModule')
	.service('profileModel', ['$rootScope', '$q','userProfileService', 'errorDialogService', '$uibModal',
	                          function ($rootScope,$q,userProfileService, errorDialogService, $uibModal) {
				var self = this;


				function init() {
					self.profileDataIsLoading = false;
					self.profileDataIsUpdating = false;
					self.user = null;
					self.extraData = null;
					self.profileCache = {};
					self.loadingFlags = {};
					self.loadingPromises = {};
					self.imageFormats = ['jpg', 'jpeg', 'png', 'gif'];
					self.imageContentTypes = ['image/jpg', 'image/jpeg','image/png','image/gif'];
				}


				function processServerProfileResponse(result) {
					if (result && result[0].items && result[0].items[0]) {
						//self.user = profileService.processProfile(result[0].items[0], true);
						result[0].items[0].displayName.replace(/&amp;/g, '&');
						self.user = result[0].items[0];
						self.profileCache[self.user.elementId] = self.user;
						self.profileImage=result[0].items[0].profileImage;						
						self.isProfilePhotoAvailable = result[0].items[0].isProfilePhotoAvailable; 
						self.isPortalUser = result[0].items[0].isPortalUser; 
						return self.user;
					}
				}

				self.getProfileData = function (userId, isLoadProfileData) {
					isLoadProfileData = (isLoadProfileData) ? true : false;
					if (!isLoadProfileData && !_.isEmpty(self.profileCache[userId])) {
						return $.when(self.profileCache[userId]);
					}

					if (!isLoadProfileData && self.loadingFlags[userId]) {
						return self.loadingPromises[userId];
					}

					self.profileDataIsLoading = true;
					self.loadingFlags[userId] = true;

					self.loadingPromises[userId] = getUserProfileInfo()
						.then(processServerProfileResponse)
						.finally(function () {
							self.profileDataIsLoading = false;
							self.loadingFlags[userId] = false;
						});

					return self.loadingPromises[userId];
				};
				function processUserProfileInfo(userProfileInfoResult){
					if (userProfileInfoResult.event.status) {
						return userProfileInfoResult.result;
					}else{
						self.error='';	
						$log.error("Profile data is empty");
						return;						
					}
				}
				function getUserProfileInfo(){
					return userProfileService.getUserProfileInfo().then(processUserProfileInfo);	
				}
					                function dismissUploadImageModal(uibModalInstance){
							uibModalInstance.dismiss('cancel');
 		                }
 		            var uploadProfileImage = function (uibModalInstance, modalScope){
 	                    var attachFile = $('#userImageUpload')[0].files[0];
 	                    if(attachFile!== undefined && attachFile !== null)
 		                    {
 		                        var fileExt = attachFile.name.split(".").pop().toLowerCase();
 		                        var fileContentType = attachFile.type.toLowerCase();
 		                        // Max size of image in MB
 		                        var MAX_IMAGE_SIZE = 16;
 		                        if(self.imageFormats.indexOf(fileExt)!== -1 && MAX_IMAGE_SIZE > attachFile.size/(1024*1024) && self.imageContentTypes.indexOf(fileContentType))
 		                        {
 		                            modalScope.profileImageIsUpdating = true;
 		                            var reader = new FileReader();
 		                            reader.file = attachFile;
 		                            var att = new sforce.SObject("Attachment");
 		                            att.Name = attachFile.name;
 		                            att.ContentType = attachFile.type;
 		                            att.ParentId = self.attachmentParentId;
    	                            reader.onload = function(e) {
 		                                var binary = "";
 		                                var bytes = new Uint8Array(e.target.result);
 		                                var length = bytes.byteLength;
 		                                for (var i = 0; i < length; i++)
 		                                {
 		                                    binary += String.fromCharCode(bytes[i]);
 		                                }
 		                                att.Body = (new sforce.Base64Binary(binary)).toString();
 		                                sforce.connection.create([att], {
 		                                    onSuccess : function(result, source) {
 		                                        if (result[0].getBoolean("success")) {
 		                                            Visualforce.remoting.Manager.invokeAction(_RemotingActions.uploadUserProfilePhoto, self.attachmentParentId, null, function(result, event) {
 		                                                if (event.status) {
 		                                                    self.profileCache[self.user.elementId].image = result[0].items[0].image;
 		                                                    self.profileImage = result[0].items[0].profileImage;
 		                                                    self.user.profileImage = result[0].items[0].profileImage;
 		                                                    self.user.isProfilePhotoAvailable = result[0].items[0].isProfilePhotoAvailable;
 		                                                    modalScope.profileImageIsUpdating = false;
 		                                                    dismissUploadImageModal(uibModalInstance)
 		                                                } else {
 		                                                    errorDialogService.showDialog({
 		                                                        title:selfServiceLabels.Error,
 		                                                        titleI18nKey: 'profile.user.image.upload.error.title', 		                                                        text: event.message
 		                                                    });
 		                                                    modalScope.profileImageIsUpdating = false;
 		                                                }
 		                                            });
 		                                        }
 		                                        else {
 		                                            errorDialogService.showDialog({
 		                                                title:selfServiceLabels.Error,
 		                                                titleI18nKey: 'profile.user.image.attachments.​maxSizeError.title',
 		                                                text: selfServiceLabels.attachmentUploadError
 		                                            });
 		                                            modalScope.profileImageIsUpdating = false;
 		                                        }
 		                                    },
 		                                    onFailure : function(error, source) {
 		                                        errorDialogService.showDialog({
 		                                                title:selfServiceLabels.Error,
 		                                                titleI18nKey: 'profile.user.image.attachments.​maxSizeError.title',
 		                                                text: selfServiceLabels.attachmentUploadError
 		                                            });
 		                                        modalScope.profileImageIsUpdating = false;
 		                                    }
 		                                });
 		                            };
 		                            reader.readAsArrayBuffer(attachFile);
 		                        } else {
 		                            errorDialogService.showDialog({
 		                                title:selfServiceLabels.Error,
 		                                titleI18nKey: 'profile.user.image.file.ext.title',
 		                                text: selfServiceLabels.UserProfileImage
 		                            });
 		                        }
 	                    } else {
 	                        errorDialogService.showDialog({
 	                            title:selfServiceLabels.Error,
 	                            titleI18nKey: 'profile.user.image.upload.select.title',
								text: selfServiceLabels.ReqDefImageSelect
 		                        });
 		                    }
 		                }
 		   
 		                self.openProfileImageUploadModel = function() {
 		                    var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
 		                    Visualforce.remoting.Manager.invokeAction(_RemotingActions.performAttachmentActions,'INSERT', {},   function(result, event) {
 		                        if (event.status) {                
 		                            self.attachmentParentId = result;
 		                            $uibModal.open({
 		                                templateUrl: resourceUrl+'views/profile/user-image-upload.html',
										backdrop: 'static',
										ariaLabelledBy:'support-modal-header__title',
 		                                controller: ['$uibModalInstance', '$scope', 'profileModel', '$state', function ($uibModalInstance, $scope, supportModel, $state) {    
		                                    $scope.profileImageIsUpdating = false;
		                                    $scope.profileImage = self.profileImage;
											$scope.file_changed = function(element) {
												var reader = new FileReader();
												reader.readAsDataURL(element.files[0]);
												reader.onload = function(e) {
													$scope.profileImage = e.target.result;
												}
											};
		                                    $scope.save = function() {
	 	                                        uploadProfileImage($uibModalInstance, $scope);
	 	                                    }
	 	                                    $scope.cancel = function () {
	 	                                        dismissUploadImageModal($uibModalInstance);
	 	                                    };
	 	                                    $scope.$on('$destroy', function () {
 		                                        deleteAttachmentRef()
 		                                    })
 		                                }]
 		                            });
 		                        }                              
 		                    },{escape: true});
 		                }
 	               
 	                var deleteAttachmentRef = function(){
 	                    var actionParams = {ID:self.attachmentParentId};
 	                    Visualforce.remoting.Manager.invokeAction(_RemotingActions.performAttachmentActions,'DELETE', actionParams, function(result, event) {
 	                        if (event.status)
 	                        {
	                            self.attachmentParentId = null;
	                        }                              
	                    },
	                    {escape: false}
	                    );
	                }
				/*self.updateProfile = function (profileJson) {
					var promise;

					if (!profileJson) { return; }

					self.profileDataIsUpdating = true;

					promise = userProfileService.UpdateProfile({ element_id: self.user.elementId }, profileJson).$promise
						.then(processServerProfileResponse)
						.finally(function () {
							self.profileDataIsUpdating = false;
						});

					return promise;
				};


				self.updateUserPicture = function (image) {
					var promise;

					self.profileDataIsUpdating = true;
					self.profileImageIsUpdating = true;

					promise = attachmentService.uploadProfileImage('user', self.user.elementId, image, true)
						.finally(function () {
							self.profileDataIsUpdating = false;
							self.profileImageIsUpdating = false;
						});

					return promise;
				};


				$rootScope.$on('myit.user.logout', init);*/


				init();
			}
		]);
