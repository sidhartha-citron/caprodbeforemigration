	angular.module('supportModule')
		.controller('IncidentDetailsController', ['errorModel', '$scope', 'errorDialogService', 'supportModel', 'userModel', '$state',
			function (errorModel, $scope, errorDialogService, supportModel, userModel, $state) {
				$scope.supportModel = supportModel;
				$scope.userModel = userModel;
				$scope.formSubmitted = false;
				errorModel.clearAllErrors();
				var srdDetailsCtrlState = {};
				$scope.srdDetailsCtrlState = srdDetailsCtrlState;
				
				srdDetailsCtrlState.requestedFor = {
					userId: userModel.userId,
					phone: userModel.UserPhone,
					userName: userModel.userName,
					email: userModel.userEmail
				};
				
				if($state.params.beId){
					srdDetailsCtrlState.requestedFor.beId = $state.params.beId;
				}

				srdDetailsCtrlState.onBehalfOfEnabled = userModel.isOnBehalfOfEnabled;

				$scope.createIncident = function () {
							$scope.formSubmitted = true;
							if (!$scope.createIncidentForm.$invalid) {
								$scope.supportModel.createIncident($scope.incident.questions, srdDetailsCtrlState.requestedFor);
							} else {
								var error={
									text : selfServiceLabels.ValidationMsg,
									hide : "10000"
								};
								errorModel.clearAllErrors();
								error.text = supportModel.htmlDecode(error.text);
								errorModel.addModalError(error);
							}
				};
			}
		]);
