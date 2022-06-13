	angular.module('supportModule')
		.service('incidentCreateService', ['errorModel', '$uibModal','supportModel',
			function (errorModel, $uibModal, supportModel) {

				function dismissSrdModal(modalInstance) {
					errorModel.clearAllErrors();
					supportModel.baseElementId = '';
					supportModel.baseElementName = '';
					supportModel.arrJunkAttRefIds = [];
					modalInstance.dismiss('cancel');
				}
				
				
				this.showSupportSrdCreateDialog = function (templateId, beId, beName, desc) {					
				var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					this.modalInstance = $uibModal.open({
						templateUrl: resourceUrl+'views/support/incident-modal.html',
						backdrop: 'static',
						windowClass: 'toggle-incident-modal-window',
						ariaLabelledBy:'support-modal-header__title',
						controller: ['$uibModalInstance', '$scope', 'supportModel', '$state',
							function ( $uibModalInstance, $scope, supportModel, $state) {
								if(beId){
									supportModel.baseElementId = beId;
									supportModel.baseElementName = beName;
								}else if(supportModel.baseElementId){
									beId = supportModel.baseElementId;
									beName = supportModel.baseElementName;									
								}
								supportModel.modalInstance =  $uibModalInstance;
								supportModel.TicketOrRequest = 'Ticket';
							 	$scope.incident = supportModel.incident;
								$scope.supportModel = supportModel;
								$scope.lightningModule = lightningModule;
								var baseUrlVal=$("a[id*='selfServiceResourcesUrl']").attr('href');
								$scope.resourceUrl=baseUrlVal+'views/support/incident-details.html';
								$scope.questionListUrl=	baseUrlVal+'views/support/incident-questions-list.html';
									supportModel.createTicket(templateId, beId, beName).then(supportModel.onGetTicketSuccessCallback)
										.catch(supportModel.onGetTicketByIdFailCallback).finally(function(){
											supportModel.TicketOrRequest = 'Ticket';
											if(templateId){
												var question={
													'answerIsValid': true,
													'format': 0,
														'id': templateApiName,
														'isRequired': false,	
														'visibility': false,	
														'Value':templateId,
														'Type':'',
														'isTemplateHiddenField':true,
														'verificationRegExp': /.*/
														
												};
												supportModel.incident.questions.push(question);///namespace field name
											}	
											if(desc){
												supportModel.incident.questions.forEach(function(question){
													if(question.apiName.indexOf('incidentDescription__c') > -1){
														question.Value = desc;
													}
												});
											}
									
										});
									$scope.$watchCollection('supportModel.incident', function () {									
										$scope.incident = supportModel.incident;
										$scope.supportModel = supportModel;
										supportModel.processDynamicQuestions($scope.incident);
										supportModel.triggerActions($scope.incident, $scope.incident.initActions, null, $scope.incident.userId);
										// adding listeners for SRD response actions
										_.each($scope.incident.questions, function (question, index) {
											$scope.$watch('incident.questions[' + index + '].answer', function (newVal, oldVal) {
												if (newVal !== oldVal) {
													supportModel.triggerActions($scope.incident, $scope.incident.responseActions, question.id);
												}
											});
										});
									});
							
								$scope.cancel = function () {
									var response = {
													message: "Close_After_Cancel",
													component: cmpId
												};
									if (lightningModule=='createInc')
										parent.postMessage(response, lexOpenerURL);
									
									if(supportModel.smartSuggestionsData && supportModel.smartSuggestionsData.isSuggestionsOpen==true){
										supportModel.smartSuggestionsData.isSuggestionsOpen = false;
										supportModel.smartSuggestionsData.clearSearchString = true;
									}

									dismissSrdModal( $uibModalInstance);
								};

								$scope.$on('$destroy', function () {
									supportModel.selectedFoundSRD = {};
								})
							}]
					});
					this.modalInstance.rendered.then(function(){
						angular.element('.modal-dialog').addClass('modal-dialog-incident');
					});
				};
				
				
				this.showSupportIncidentCopyDialog = function (copyIncidentId) {					
				var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/incident-modal.html',
						backdrop: 'static',
						ariaLabelledBy:'support-modal-header__title',
						controller: ['$uibModalInstance', '$scope', 'supportModel', '$state',
							function ( $uibModalInstance, $scope, supportModel, $state) {
								supportModel.modalInstance =  $uibModalInstance;
							 	$scope.incident = supportModel.incident;
								$scope.supportModel = supportModel;
								var templateId;
								var baseUrlVal=$("a[id*='selfServiceResourcesUrl']").attr('href');
								$scope.resourceUrl=baseUrlVal+'views/support/incident-details.html';
								$scope.questionListUrl=	baseUrlVal+'views/support/incident-questions-list.html';
									supportModel.copyTicket(copyIncidentId).then(supportModel.onGetTicketSuccessCallback)
										.catch(supportModel.onGetTicketByIdFailCallback).finally(function(){
											supportModel.TicketOrRequest = 'Ticket';						
										});
									
									$scope.$watchCollection('supportModel.incident', function () {									
										$scope.incident = supportModel.incident;
										$scope.supportModel = supportModel;
										supportModel.processDynamicQuestions($scope.incident);
										supportModel.triggerActions($scope.incident, $scope.incident.initActions, null, $scope.incident.userId);
										// adding listeners for SRD response actions
										_.each($scope.incident.questions, function (question, index) {
											$scope.$watch('incident.questions[' + index + '].answer', function (newVal, oldVal) {
												if (newVal !== oldVal) {
													supportModel.triggerActions($scope.incident, $scope.incident.responseActions, question.id);
												}
											});
										});
									});
									
								$scope.cancel = function () {
									dismissSrdModal( $uibModalInstance);
								};

								$scope.$on('$destroy', function () {
									supportModel.selectedFoundSRD = {};
								})
							}]
					}).rendered.then(function(){
						angular.element('.modal-dialog').addClass('modal-dialog-incident');
					});
				};
			}
		]);
