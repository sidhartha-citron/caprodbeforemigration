	angular.module('userModule').controller('MyProfileController', ['errorModel', '$scope', 'errorDialogService','supportModel' ,'userModel','profileModel','$uibModal','$timeout',
			function (errorModel, $scope, errorDialogService,supportModel, userModel, profileModel, $uibModal, $timeout) {
				$scope.userModel = userModel;
				$scope.formSubmitted = false;
				errorModel.clearAllErrors();
				$scope.saveMyProfile = function () { 
					$scope.formSubmitted = true;
					if (!$scope.clientForm.$invalid) {
						var myProfileDetails = supportModel.processFormFields($scope.userModel.profileInfo.questions);;
						userModel.dataLoading = true;
						myProfileDetails["id"]=userId;
						$scope.userModel.saveMyProfileInfo(myProfileDetails).then(function(result,status){
							if(result.event.status){
								if(result.event.result != ''){
									var validationError={
										text : result.event.result,
										hide : "10000"
									};
									showError(validationError);
									userModel.dataLoading = false;
								}else{
									openSuccessConfirmationModal();
									if(userModel.userId) {
										profileModel.getProfileData(userModel.userId, true);
									}
									$scope.userModel.close();
								}
							}
						});		
					} else {
						var validationError={
							text : selfServiceLabels.ValidationMsg,
							hide : "10000"
						};
						showError(validationError);
					}
			};
			
			var showError = function(validationError){
				errorModel.clearAllErrors();
				validationError.text = supportModel.htmlDecode(validationError.text);
				errorModel.addModalError(validationError);
			}
			
			var openSuccessConfirmationModal = function () {
				var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
				return $uibModal.open({
					templateUrl: resourceUrl+'views/user/user-modal-success.html',
					ariaDescribedBy: 'support-modal-header__description',
					ariaLabelledBy:'support-modal-header__title',
					controller: ['$scope', '$uibModalInstance',
						function ($scope, $uibModalInstance) {
							$timeout(function () {
								$uibModalInstance.dismiss('cancel');
							}, 5000);
							userModel.dataLoading = false;
						}
					]
				});
			};
		}
]);
