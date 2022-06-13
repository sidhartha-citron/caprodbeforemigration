	angular.module('supportModule')
		.controller('SrDetailsModalController', ['confirmationDialogService', 'errorDialogService', 'errorModel', 'getByRequestId', '$uibModal', '$uibModalInstance', 'parentScope',
			'$q', '$rootScope', '$scope', 'selectedSrId', 'isRequest', 'isTicket', 'isDisableEdit', 'srdCreateService', 'srDetailsService', 'srModel', '$state',
			'supportModel', 'supportService', 'userModel','$timeout', 'incidentCreateService', '$filter','$sce',
			function (confirmationDialogService, errorDialogService, errorModel, getByRequestId, $uibModal, $uibModalInstance, parentScope, $q, $rootScope, $scope, selectedSrId,
				isRequest, isTicket, isDisableEdit, srdCreateService, srDetailsService, srModel, $state, supportModel, supportService, userModel, $timeout, $incidentCreateService, $filter, $sce) {

				var srDetailsModalState = {};
				srDetailsModalState.isReopenAllowed=userModel.allowOpen;
				srDetailsModalState.isCloseAllowed=userModel.allowClose;
				srDetailsModalState.isNoteAllowed=userModel.allowNotes;
				srDetailsModalState.isRequestAgainAllowed=userModel.allowCopy;
				srDetailsModalState.isEditAllowed=userModel.allowEdit;
				srDetailsModalState.canSeeTasks=userModel.canSeeTasks;
				var init = function () {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					srModel.allowResolution = userModel.allowResolution;
					$scope.isDetailSectionCollapsed = true;
					$scope.isTaksSectionCollapsed = true;
					$scope.isAttachmentSectionCollapsed = true;
					$scope.isNotesSectionCollapsed = false;
					$scope.isApprovalsSectionCollapsed = true;
					$scope.isRequest = isRequest;
					$scope.isTicket = isTicket;
					$scope.srModel = srModel;
					$scope.supportModel = supportModel;
					$scope.userModel = userModel;
					$scope.srColumnLayoutForSS3 = srColumnLayoutForSS3Val == 2;
					
					// $scope.attachments = {};
					$scope.comments = {};
					$scope.approvalDetails = [];
					$scope.incidentDetails = {};
					$scope.incidentFldsToDisplay = {};
					$scope.incidentFields = {};
					$scope.taskDetails = {};
					$scope.srDetailsModalState = srDetailsModalState;
					if(!$scope.srDetailsModalState.isNoteAllowed){
						$scope.isDetailSectionCollapsed = false;
						$scope.isNotesSectionCollapsed = true;
					}
					$scope.srDetailsModalState.logText = '';
					$scope.srDetailsModalState.addingComment = false;
					$scope.formSubmitted = false;
					$scope.editRequestForm = '';
					$scope.requestDetailLeftFieldSet = namespace+'leftPanel';
					$scope.requestDetailRightFieldSet = namespace+'rightPanel';
					$scope.requestDetailSS3FieldSet = namespace+'RequestDetailsSelfService3';
					$scope.templates = [
						{
							titleI18nKey: 'support.sr.details.title',
							name: 'log',
							url: resourceUrl+'views/support/sr-modal-log.html'
						},
						{
							titleI18nKey: 'support.sr.details.title',
							name: 'details',
							url: resourceUrl+'views/support/sr-modal-details.html'
						}
					];

					$scope.template = $scope.templates[0];
					
					$scope.srdDetailsCtrlState = {};
					$scope.srdDetailsCtrlState.requestedFor = {
						userId: userModel.userId,
						userName: userModel.userName,
						phone: userModel.UserPhone,
						email: userModel.userEmail
					};

					$scope.srdDetailsCtrlState.onBehalfOfEnabled = userModel.isOnBehalfOfEnabled;
					
					$scope.isDisableEdit = ( typeof(isDisableEdit) !== 'undefined' && isDisableEdit ) ? true : false;
					
					getSRDetails();
				};
				
				$scope.localizeNumber = function(value){
					if(userModel.enableLocaleNumberFormat && value){
						value = value.toString().replace('.', userModel.localeDecimalSeparator);
					}
					return value;
				};
				
				$scope.dataDetail = {};

				$scope.getNoteRecord = function(Id) {
					var deferred = $q.defer();
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getNoteRecord,Id,null, function(result, event) {
						if (event.status && result) {
							deferred.resolve(result);
							$scope.showDetails('comment', result);
						}else{
							deferred.reject();
						}
					});
					return deferred.promise;
				}
				
				$scope.showDetails = function (type, data) {
					$scope.srDetailsModalState.srLoading = true;
					$scope.dataDetail.sectionDetail = {
															isDetailSectionCollapsed : $scope.isDetailSectionCollapsed,
															isTaksSectionCollapsed : $scope.isTaksSectionCollapsed,
															isAttachmentSectionCollapsed : $scope.isAttachmentSectionCollapsed,
															isNotesSectionCollapsed : $scope.isNotesSectionCollapsed,
															isApprovalsSectionCollapsed : $scope.isApprovalsSectionCollapsed
														};
					$scope.dataDetail.type = type;
					if(type == 'instruction'){
						$scope.dataDetail.data = $scope.supportModel.config.actualInstr;
					}else{
						$scope.dataDetail.data = data;
					}
					$scope.goToRequestDetails();
					$scope.srDetailsModalState.srLoading = false;
				};

				$scope.$on("addAttachment", function(evt,data){ 
					if($scope.isTicket){
						getSRDetails(null, null, true);
					}
				});

				var getSRDetails = function (isAddingComment, action, isAttachmentRefresh) {
					$scope.srDetailsModalState.srLoading = true;
					
					if($scope.isRequest){
						$scope.supportModel.setToDefault();
						if(isAddingComment)
							$scope.supportModel.config.action = action;
						else
						$scope.supportModel.config.action = 'VIEW';
						$scope.supportModel.config.recordId = selectedSrId;
						$scope.supportModel.config.loggedInUserId = userModel.userId;
						$scope.supportModel.getSRDById('', selectedSrId, $scope.supportModel.config.action)
							.then(supportModel.onGetSrdByIdSuccessCallback)
							['catch'](function(message) {
									if(selfServiceLabels.InsufficientPrivilegeContactAdministrator == message)
										supportModel.onGetSrdByIdFailCallback(message);
									else
										supportModel.onGetSrdByIdFailCallback();
								}
								
							)
							['finally'](function () {								
								$scope.srdDetailsCtrlState.requestedFor.userId = $scope.supportModel.OnBehalfOf.fvalue;
								$scope.srdDetailsCtrlState.requestedFor.userName = $scope.supportModel.OnBehalfOf.fRefFieldVal;
								$scope.srdDetailsCtrlState.requestedFor.phone = $scope.supportModel.OnBehalfOf.phone;
								$scope.srdDetailsCtrlState.requestedFor.email = $scope.supportModel.OnBehalfOf.fEmail;
								
								$scope.supportModel.attachmentData.srId = selectedSrId;
								getAttachmentDetails(selectedSrId).then(function(result){
									$scope.supportModel.attachmentData.attachments = result;
								});
								
								if(!userModel.isPortalUser){
									$scope.getApprovalDetails().then(function(result){
										if(result.length > 0){
											$scope.approvalDetails = result;
										}
									});
								}
								
								$scope.srDetailsModalState.srLoading = false;
								
								if($scope.srDetailsModalState.isNoteAllowed){
									$scope.srDetailsModalState.srLoading = true;
									getClientCommentsDetails(selectedSrId).then(function(result){
										$scope.comments = result;
										$scope.srDetailsModalState.srLoading = false;
									});
								}
								
								if($scope.srDetailsModalState.canSeeTasks){
									$scope.srDetailsModalState.srLoading = true;
									$scope.getTaskDetails().then(function(result){
										$scope.taskDetails = result;
										$scope.srDetailsModalState.srLoading = false;
									});
								}
							});
					}else if($scope.isTicket){
						$scope.getIncidentDetails(selectedSrId)
							.then(function(result){
								if(result !== undefined && result !== null && result.length > 0){
									_.forEach(result, function (obj) {
										if(obj.dataSourceName !== undefined && obj.dataSourceName !== null && obj.dataSourceName === 'ServiceRequest'){
											if(obj.items !== undefined && obj.items !== null && obj.items.length > 0){			
												$scope.incidentDetails = obj.items[0];
											}
										}else if(obj.dataSourceName !== undefined && obj.dataSourceName !== null && obj.dataSourceName === 'ServiceRequestAnswer'){
											if(obj.items !== undefined && obj.items !== null && obj.items.length > 0){
												_.forEach(obj.items, function (field) {
													if(field.questionId.indexOf("incidentDescription__c") !== -1){
														field.value = field.value.$$unwrapTrustedValue();
													}
												});
												$scope.incidentFields = obj.items;
											}
										}else if(obj.dataSourceName !== undefined && obj.dataSourceName !== null && obj.dataSourceName === 'fldsToDisplay'){
											_.forEach(obj.items, function (field) {
													var isMultiPicklistString = false;
													if(field.id.indexOf('incidentdescription__c') != -1){
														field.IsRequired = true;
													}
													if(typeof(field.id) != "undefined" && field.id != null && field.id != ''){
														field.apiName = field.id;
													}
													if(field.Type.toLowerCase() == 'string'){
														field.Type = 'textfield';
													}else if(field.Type.toLowerCase() == 'double' || field.Type.toLowerCase() == 'integer'){
														field.Type = 'number';
													}else if(field.Type.toLowerCase() == 'date' || field.Type.toLowerCase() == 'datetime'){
														
														field.dateTimeFormat=userModel.dateTimeFormat;
														field.dateFormat=userModel.dateFormat;
														field.currentTime=userModel.currentTime;
														
														var dateVal;
														var isDateValEmpty = false;
														if(field.Value !== undefined && field.Value != null && field.Value != ''){
															dateVal = new Date(moment(field.Value,'YYYY-MM-DD HH:mm:ss'));									
														}else{
															dateVal = new Date(moment(field.currentTime,'YYYY-MM-DD HH:mm:ss'));
															isDateValEmpty = true;
														}
														
														field.yy=dateVal.getFullYear();
														field.MM=dateVal.getMonth()+1;
														field.dd=dateVal.getDate();
														field.HH=dateVal.getHours();
														field.mm=dateVal.getMinutes();
														field.ss=dateVal.getSeconds();
														if(isDateValEmpty == true)
															dateVal = '';
														if(field.Type.toLowerCase() == 'date'){
															field.Type = 'date';
															field.Value=$filter('date')(dateVal, userModel.dateFormat);
														}else{
															field.Type = 'date/time';
															field.Value=$filter('date')(dateVal, userModel.dateTimeFormat).replace('a.m.', 'AM').replace('p.m.','PM').replace('午前', 'AM').replace('vorm.', 'AM').replace('午後', 'PM').replace('nachm.', 'PM'); 
														}	
													}else if(field.Type.toLowerCase() == 'boolean'){
														field.Type = 'checkbox';
													}else if(field.Type.toLowerCase() == 'reference'){
														field.Type = 'lookup';
													}else if(field.Type.toLowerCase() == 'multipicklist'){
														field.Type = 'picklist';
														if(field.Value && typeof field.Value == 'string') {
															supportModel.decodeField(field);
															isMultiPicklistString = true;
														}
														field.Value = typeof field.Value == 'string' ? field.Value.split(';') : field.Value;
													}else if (field.Type.toLowerCase() == 'picklist' && !field.MultiSelect) {
														field.Type = 'picklist';
														field.addNoneInPicklist = ((field.IsRequired && (field.Value == '' || field.Value == undefined)) || (!field.IsRequired ));
													}else{
														field.Type = field.Type.toLowerCase();
													}

													if(typeof(userModel.LayoutFldsandCriteria) != 'undefined' && userModel.LayoutFldsandCriteria != null && (field.id in userModel.LayoutFldsandCriteria) && typeof(userModel.LayoutFldsandCriteria[field.id].myConditions) != 'undefined' && userModel.LayoutFldsandCriteria[field.id].myConditions != null && userModel.LayoutFldsandCriteria[field.id].myConditions.length > 0){
														field.isVisible = false;
													}

													if (field.Type == 'number') {
														if (field.Scale != undefined && field.Value != undefined && field.Value != 0) {
															if (field.Scale > 0) {
																field.Value = Math.round(field.Value * Math.pow(10, field.Scale)) / Math.pow(10, field.Scale);
															} else {
																field.Value = parseInt(field.Value);
															}
														}
													}
													if(!isMultiPicklistString) {
														supportModel.decodeField(field);
													}

													if(field.Value&& (field.Type.toLowerCase() == "richtextarea" && field.isHtmlFormatted) || (field.Type.toLowerCase() == 'textfield' && field.isFormula)) {
														field.Value = getSFDocumentURL('','',field.Value);
													}

													supportModel.incident.questions.push(field);
												

												
											});
											$scope.incidentFldsToDisplay = obj.items;
										}
									});
								}
							})
							['catch'](supportModel.onGetSrdByIdFailCallback)
							['finally'](function () {
								supportModel.TicketOrRequest = 'Ticket';
								$scope.supportModel.attachmentData.srId = selectedSrId;
								$scope.supportModel.attachmentData.hideList = true;
								$scope.supportModel.attachmentData.isTicket = true;
								getAttachmentDetails(selectedSrId).then(function(result){
									$scope.supportModel.attachmentData.attachments = result;
									if(isAttachmentRefresh){
										var attachmentDiv = document.getElementById('AttachmentsSectionId');
										attachmentDiv.scrollIntoView();
									}
								});
								
								$scope.srDetailsModalState.srLoading = false;
								if($scope.srDetailsModalState.isNoteAllowed){
									$scope.srDetailsModalState.srLoading = true;
									getClientCommentsDetails(selectedSrId).then(function(result){
										$scope.comments = result;
										$scope.srDetailsModalState.srLoading = false;
									});
								}
								
								if($scope.srDetailsModalState.canSeeTasks){
									$scope.srDetailsModalState.srLoading = true;
									$scope.getTaskDetails().then(function(result){
										$scope.taskDetails = result;
										$scope.srDetailsModalState.srLoading = false;
									});
								}
							});
					}
				};
				
				$scope.getIncidentDetails = function (id) {
					var deferred = $q.defer();
					$scope.supportModel.timeZoneOffSetMinutes = userModel.timeZoneOffSetMinutes;
					$scope.supportModel.config.loggedInUserId = userModel.userId;
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getTicketDetails,id, null, function(result, event){
						var fieldsToBeDisplayed=[];
						var dateTimeFields={};
						var dateFields={};
						var fieldLabelToBeDisplayed={};
							if (event.status) {		
							    var srRequests=[];
								var srId;
								var srAwrItemsForSR=[];
								var fields=JSON.parse(result.headerInfo.replace(/&quot;/g,'"'));
								var fldsToDisplay = result.incidentDetails;
								$scope.supportModel.incident.questions = []; 
								if(fields.length > 0){
									_.each(fields[0].lstOfFSMember,function(record,keyRecord){									
										var fieldAPIName;
										var fieldLabel;
										var hidden;
										_.each(record,function(value,key){
										
										if(key=='hidden'){
											hidden=value;
										}
										if(key=='type'){
											if(value=='datetime'||value=='DATETIME'){
												dateTimeFields[record.fieldPath]=true;
											}
											if(value=='date'||value=='DATE'){
												dateFields[record.fieldPath]=true;
											}	
										}
										if(key=='fieldPath'){
											fieldsToBeDisplayed.push(value);
											fieldAPIName=value;
										}
										if(key=='label')
											fieldLabel=value;
										
										});
										if(hidden!='true' && fieldAPIName!="Name")
											fieldLabelToBeDisplayed[fieldAPIName]=fieldLabel;
									});
								}
								var srAwrItemsForSRHash={};
								var createdDateString = result.createdDateString;
								var lastModifiedDateString = result.lastModifiedDateString;
								 _.each(result.recordInfo,function(record,keyRecord){
									 var ticketDetails={};
									 var feedData={};									
									 var statusLabel;
									 var statusValue;
									 var isStateOpen;
									_.each(record,function(value,key){
										var srId=record.Id;
										if(key.toLowerCase().indexOf('fkclient__r') != -1){
											$scope.srdDetailsCtrlState.requestedFor.userId = value.Id;
											$scope.srdDetailsCtrlState.requestedFor.userName = value.Name;
										}
										if(fieldsToBeDisplayed.indexOf(key)>-1){
											if(key.indexOf('FKStatus__c')==-1 && key.indexOf('Status_ID__c')==-1){
												var srAwrItem={};										 
												srAwrItem['questionText']=fieldLabelToBeDisplayed[key];
												if(dateTimeFields[key]){
													var dateVal =moment.tz(value, userTimeZone).format('M/D/YYYY h:mm A');
													srAwrItem['displayValue']=dateVal;
													srAwrItem['value']=dateVal;
												}else if(dateFields[key]){
													var dateVal =moment.tz(value, userTimeZone).format('M/D/YYYY');
													srAwrItem['displayValue']=dateVal;
													srAwrItem['value']=dateVal;
												}	  
												else{
													if(key.indexOf('OwnerId')>-1){
														srAwrItem['displayValue']=$scope.srModel.htmlDecode(record.Owner.Name).replace(/&amp;/g, '&');
														srAwrItem['value']=$scope.srModel.htmlDecode(record.Owner.Name).replace(/&amp;/g, '&');
														srAwrItem['questionText']='Owner';
													}else{
														srAwrItem['displayValue']=$scope.srModel.sce.trustAsHtml($scope.srModel.htmlDecode(value.toString()));
														srAwrItem['value']=$scope.srModel.sce.trustAsHtml($scope.srModel.htmlDecode(value.toString()));
													}
												}
												srAwrItem['questionId']=key;
												srAwrItem['srId']=srId;
												srAwrItemsForSRHash[key]=srAwrItem;
											}else{	
												statusLabel=key;
											}
										}
										
										if(key.indexOf('Status_ID__c')>-1){
										    statusValue=$scope.srModel.htmlDecode(value);;
									    }
										if(key.indexOf('state__c')>-1){
										    isStateOpen=value;
										}
										if(key.indexOf('__r')>-1 && key.indexOf('FKStatus__r')==-1){
										    var referenceKey=key.replace('__r','__c');
											if(srAwrItemsForSRHash[referenceKey] && value.Name){
											    srAwrItemsForSRHash[referenceKey].displayValue=value.Name;
											    srAwrItemsForSRHash[referenceKey].value=value.Name;
											}
										}
										if(key.indexOf('FKRequestDefinition__c')>-1){
										    ticketDetails.isRequest=true;
										}
										
										if (key.indexOf(namespace+'incidentResolution__c') >- 1) {
										    if (value !== "") {
												ticketDetails.resolution = value.trim();
											}
  									    }
									 });
									 ticketDetails.status=statusValue;
									 ticketDetails.isStateOpen=isStateOpen;
									 ticketDetails.createDate=createdDateString;
									 ticketDetails.lastModifiedDate=lastModifiedDateString;
									 if(!ticketDetails.isRequest)
										ticketDetails.isTicket=true;								   
									 if(statusLabel){
										  var srAwrItem={};		
										 srAwrItem['questionText']=fieldLabelToBeDisplayed[statusLabel];
												  srAwrItem['displayValue']=statusValue;//-------------com
												  srAwrItem['value']=statusValue;//------------------
												  srAwrItem['questionId']=statusLabel;
												  srAwrItem['srId']=srId;
												  srAwrItemsForSRHash[statusLabel]=srAwrItem;
									 }
								     
									 ticketDetails['id']=record.Id;		
									 ticketDetails['requestId']=record.Name;
									 
									 srRequests.push(ticketDetails);
									 
								 }); 
								  _.each(result.srInputs,function(inputVal){
										  var srAwrItem={};	
										  _.each(inputVal,function(val,key){
											  if(key.indexOf('Input__c')>-1){
												  srAwrItem['questionText']=val;
												  fieldLabelToBeDisplayed[inputVal.Id]=val;
											  }	  
											  if(key.indexOf('Response__c')>-1){
												  if(val != "header section"){
													srAwrItem['displayValue']=val;
													srAwrItem['value']=val;  
												  }												  
											  }	  
										  });	
										  if(!srAwrItem.value){
											  srAwrItem['displayValue']='';
											  srAwrItem['value']='';
										  }
											  fieldsToBeDisplayed.push(inputVal.Id);										 
											  srAwrItem.questionId=inputVal.Id;
											  srAwrItem.srId=id;	
											  srAwrItemsForSRHash[ srAwrItem.questionId]= srAwrItem;
								});
								$scope.srModel.fieldsToBeDisplayed=fieldsToBeDisplayed;
								$scope.srModel.fieldLabelToBeDisplayed=fieldLabelToBeDisplayed;
								_.each(srAwrItemsForSRHash,function(value,key){
									srAwrItemsForSR.push(value);
								});
								var srModalDetails=[];
								var srDetailsWithId={
									dataSourceName: 'ServiceRequest',
									items: srRequests				
								}
								srModalDetails.push(srDetailsWithId);
								var srAnswerDetailsWithId={
									dataSourceName: 'ServiceRequestAnswer',
									items: srAwrItemsForSR						
								}
								srModalDetails.push(srAnswerDetailsWithId);
								
								$scope.srModel.srDetailsCache[srId]=srModalDetails;								
								
								var fldsToShow = {};
								fldsToShow.dataSourceName = 'fldsToDisplay';
								fldsToShow.items = fldsToDisplay;
								srModalDetails.push(fldsToShow);
								
								var result=[];
								result.push(srModalDetails);
								deferred.resolve(srModalDetails);
								return result;
							}else{
								deferred.reject();
							}
					},{escape: true});
					return deferred.promise;
				};
				$scope.to_trusted = function(html_code) {
					if(html_code != undefined && (html_code.toLowerCase().indexOf('<script') > -1 || html_code.toLowerCase().indexOf('</script>') > -1 )) {
		        	    return html_code;
		            } else
              		    return $sce.trustAsHtml(html_code);
				};
				$scope.goToRequestDetails = function () {
					$scope.template = $scope.templates[1];
				};
				
				$scope.sectionsStatus = {};

				$scope.goToRequestActivity = function () {
					$scope.template = $scope.templates[0];
					$scope.sectionsStatus = $scope.dataDetail.sectionDetail;
					$scope.dataDetail = {};
				};
				
				$scope.resetSections = function(){
					$scope.isDetailSectionCollapsed = $scope.sectionsStatus.isDetailSectionCollapsed;
					$scope.isTaksSectionCollapsed = $scope.sectionsStatus.isTaksSectionCollapsed;
					$scope.isAttachmentSectionCollapsed = $scope.sectionsStatus.isAttachmentSectionCollapsed;
					$scope.isNotesSectionCollapsed = $scope.sectionsStatus.isNotesSectionCollapsed;
					$scope.isApprovalsSectionCollapsed = $scope.sectionsStatus.isApprovalsSectionCollapsed;
				}
				
				$scope.changeValueOfBoolean = function(type){
					if(type == 'detail'){
						$scope.isDetailSectionCollapsed = !$scope.isDetailSectionCollapsed;
					}else if(type == 'attachment'){
						$scope.isAttachmentSectionCollapsed = !$scope.isAttachmentSectionCollapsed;
					}else if(type == 'note'){
						$scope.isNotesSectionCollapsed = !$scope.isNotesSectionCollapsed;
					}else if(type == 'approval'){
						$scope.isApprovalsSectionCollapsed = !$scope.isApprovalsSectionCollapsed;
					}else if(type == 'task'){
						$scope.isTaksSectionCollapsed = !$scope.isTaksSectionCollapsed;
					}
				}

				$scope.close = function () {
					supportModel.clearClonedSrAnswers();
					errorModel.clearAllErrors();
					$uibModalInstance.dismiss();
				};
				
				
				$scope.copySR = function () {
					if($scope.isRequest){
						var srDetails = {
							categoryId: '',
							desc: '',
							icon: '',
							id: selectedSrId,
							serviceRequestDefinitionId: '',
							title: '',
							action: 'COPY'
						};
						srdCreateService.showSupportSrdCreateDialog(srDetails);
						$scope.close();
					}else if($scope.isTicket){
						$incidentCreateService.showSupportIncidentCopyDialog(selectedSrId);
						$scope.close();
					}
				};
				
				$scope.editSR = function () {
					if($scope.isRequest){
						if(srColumnLayoutForSS3Val == 2){
							$('.modal').addClass('sr2ColumnLayout');
						}	
						var attachmentData = $scope.supportModel.attachmentData;
						srDetailsModalState.srLoading = true;
						$scope.isDetailSectionCollapsed = false;
						$scope.isTaksSectionCollapsed = true;
						$scope.isAttachmentSectionCollapsed = true;
						$scope.isNotesSectionCollapsed = true;
						$scope.isApprovalsSectionCollapsed = true;
						$scope.supportModel.setToDefault();
						$scope.supportModel.config.action = 'EDIT';
						$scope.supportModel.getSRDById('', selectedSrId, $scope.supportModel.config.action)
								.then($scope.supportModel.onGetSrdByIdSuccessCallback)
								['catch']($scope.supportModel.onGetSrdByIdFailCallback)
								['finally'](function(){
									$scope.srDetailsModalState.srLoading = false;
									$scope.supportModel.dataLoading = false;
									$scope.supportModel.attachmentData = attachmentData;
								});
						
					}
				};
				
				$scope.getApprovalDetails = function (){
					var deferred = $q.defer();
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getApprovalDetails,selectedSrId, null, function(result, event){
						if(event.status){
							if(result !== undefined && result != null && result != '' && result != '[]'){
								result = JSON.parse(result.replace(/&quot;/g,'"'));
								_.forEach(result, function (approval) {
									approval.approversName = supportModel.decodeText(approval.approversName);
									approval.status = supportModel.decodeText(approval.status);
									approval.comment = supportModel.decodeText(approval.comment);
								});
							}else{
								result = [];
							}
							deferred.resolve(result);
						}else{
							deferred.reject();
						}
					});
					return deferred.promise;
				};
				
				$scope.getTaskDetails = function (){
					var deferred = $q.defer();
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getTaskDetails,selectedSrId, null, function(result, event){
						if(event.status){
							if(result !== undefined && result != null && result.tasksAccessible !== undefined && result.tasksAccessible != null && result.tasksAccessible == true){
								if(result.tasksList !== undefined && result.tasksList != null && result.tasksList.length > 0){
									if(result.ApiNameOfFlds != undefined && result.ApiNameOfFlds != null && result.ApiNameOfFlds.length > 0 && 
										result.fldLabels !== undefined && result.fldLabels != null){
										var apiNames = [];
										var fldLblMap = {};
										var fldTypeMap = {};
										_.forEach(result.ApiNameOfFlds, function (apiName) {
											var tempLbl = '';
											tempLbl = result.fldLabels[apiName];
											var tempType = '';
											tempType = result.fldTypes[apiName];
											apiName = (apiName.indexOf("__r.Name") != -1)?apiName.replace("__r.Name", "__r"):apiName;
											apiNames.push(apiName);
											fldLblMap[apiName] = tempLbl;
											fldTypeMap[apiName] = tempType;
										});
										result.ApiNameOfFlds = apiNames;
										result.fldLabels = fldLblMap;
										result.fldTypes = fldTypeMap;
									}
									if(result.tasksList !== undefined && result.tasksList != null && result.tasksList.length > 0){
										_.forEach(result.tasksList, function (task) {
											_.forEach(result.ApiNameOfFlds, function (fldName) {
												if(task[fldName] !== undefined && task[fldName] != null && 
													task[fldName].Id !== undefined && task[fldName].Id != null && task[fldName].Id != '' && 
													task[fldName].Name !== undefined && task[fldName].Name != null && task[fldName].Name != ''){
														var tempName = task[fldName].Name;
														task[fldName] = tempName;
												}else if (fldName == 'LastModifiedBy.Name' && task.LastModifiedBy != undefined) {
														task[fldName] = task.LastModifiedBy.Name;
												} else if (fldName == 'CreatedBy.Name' && task.CreatedBy != undefined) {
														task[fldName] = task.CreatedBy.Name;
												} else if (fldName == 'Owner.Name' && task.Owner != undefined) {
														task[fldName] = task.Owner.Name;
												}
												if(typeof(task[fldName]) != 'undefined' && task[fldName] != null && task[fldName] != ''){
													task[fldName] = supportModel.htmlUnescape(unescape(task[fldName]));
												}
											});
										});
									}
								}
							}
							deferred.resolve(result);
						}else{
							deferred.reject();
						}
					});
					return deferred.promise;
				};
				$scope.setForm = function(editRequestForm) {
					$scope.editRequestForm = editRequestForm;
				}
				$scope.submitSR = function(){
					$scope.srDetailsModalState.srLoading = true;
					$scope.formSubmitted = true;
					if ($scope.editRequestForm !== undefined && !$scope.editRequestForm.$valid) {
						var error={
							text : selfServiceLabels.ValidationMsg,
							hide : "10000"
						};
						$scope.srDetailsModalState.srLoading = false;
						errorModel.clearAllErrors();
						error.text = $scope.srModel.htmlDecode(error.text);
						errorModel.addModalError(error);
						return;
					}
					if($scope.isRequest){
						if ($scope.supportModel.attachmentData.isAttachmentRequired && (!$scope.supportModel.attachmentData.attachments || $scope.supportModel.attachmentData.attachments.length === 0)) {
							var error={
								text : selfServiceLabels.attachmentRequired,
								hide : "5000"
							};
							$scope.srDetailsModalState.srLoading = false;
							errorModel.clearAllErrors();
							errorModel.addModalError(error);
							return;
						}
						$scope.supportModel.config.recordId = selectedSrId;
						var promise = $scope.supportModel.createSR(false, $scope.supportModel.srData.RequestDetailId);
						
						if(promise !== undefined && promise != null){
							promise.then(function(result){
										if(result.success){
											$scope.supportModel.openSuccessSRCreatedConfirmationModal(result.data.incidentName);
											//getSRDetails();
											$scope.srDetailsModalState.srLoading = false;
											$scope.close();
										}else{
											var error={
												text :result.error,
												hide : "10000"
											};
											errorModel.clearAllErrors();
											error.text = $scope.srModel.htmlDecode(error.text);
											errorModel.addModalError(error);
											$scope.srDetailsModalState.srLoading = false;
										}
									})['catch']()['finally'](function(){});
						} 
					}else if($scope.isTicket){
						var isDynamicRenderingEnabled = false;
						if(typeof(userModel.LayoutFldsandCriteria) != 'undefined' && userModel.LayoutFldsandCriteria != null && (JSON.stringify(userModel.LayoutFldsandCriteria) != JSON.stringify({}))){
							isDynamicRenderingEnabled = true;
						}
						var incidentObj = {};
						incidentObj.Id = selectedSrId;
						_.forEach($scope.incidentFldsToDisplay, function (field) {
							if(field.isUpdateable == false && field.apiName.toLowerCase() == (namespace+'opendatetime__c').toLowerCase()){
								return ;
							} 
							if(field.id.toLowerCase() != 'name'){
								if(!isDynamicRenderingEnabled || (isDynamicRenderingEnabled && (field.isTemplateHiddenField || field.isVisible))){
									if(field.Type.toLowerCase() == 'lookup'){
										incidentObj[field.id] = field.fvalue;
									}else if(field.Type.toLowerCase() == 'date/time'){
										if(field.Value != ''){
											var delim = field.dateFormat.indexOf('/')==-1?'-':'/';
											var dt=$scope.supportModel.stringToDateTime(field.Value,field.dateTimeFormat,delim);
											var dateArray=$scope.supportModel.stringToDateTime(field.Value,field.dateTimeFormat,delim).split(' ');
											incidentObj[field.id] = dateArray[0]+'T'+dateArray[1]+userModel.timeZoneOffset;
										}else{
											incidentObj[field.id] = null;
										}
									}else if(field.Type.toLowerCase() == 'date'){
										if(field.Value != ''){
											var delim = field.dateFormat.indexOf('/')==-1?'-':'/';
											incidentObj[field.id] = $scope.supportModel.stringToDate(field.Value,field.dateFormat,delim);
										}else{
											incidentObj[field.id] = null;
										}
									}else if(field.Type.toLowerCase() == 'picklist' && field.MultiSelect == true){
										if(typeof field.Value != 'string'){
											if (field.Value != undefined || field.Value != null)
												incidentObj[field.id] = field.Value.join(';');
											else 
												incidentObj[field.id] = '';
										}else{
											incidentObj[field.id] = field.Value;
										}
									}else if(field.Type.toLowerCase() == 'number'){
										if (field.Scale != undefined && field.Value != undefined && field.Value != 0) {
											if (field.Scale > 0) {
												field.Value = Math.round(field.Value * Math.pow(10, field.Scale)) / Math.pow(10, field.Scale);
											} else {
												field.Value = parseInt(field.Value);
											}
										}
										incidentObj[field.id] = field.Value;
									} else if (field.Type.toLowerCase() == 'checkbox') {
										incidentObj[field.id] = field.Value;
									} else{
										incidentObj[field.id] = field.Value;
									}
								}
							}
							incidentObj.lastmodifieddate = $scope.incidentDetails.lastModifiedDate;								
							
						});
						var incidentJSON = JSON.stringify(incidentObj);
						var successCallbackWrapper = function (result) {
							incidentCreationSuccessCallback(result);
						};
						createRemoteIncident(incidentJSON, $scope.srdDetailsCtrlState.requestedFor.userId)
							.then(function(result){
								if(result.Name){
									$scope.srDetailsModalState.srLoading = false;
									openSuccessTicketCreatedConfirmationModal(result.Name);
									//getSRDetails();
									$scope.close();
								}else{
									var error={
												text :result.errorMessage,
												hide : "10000"
											};
										errorModel.clearAllErrors();
										error.text = $scope.srModel.htmlDecode(error.text);
										errorModel.addModalError(error);
										$scope.srDetailsModalState.srLoading = false;
								}
							})['catch']()['finally'](function(){});
							
							var openSuccessTicketCreatedConfirmationModal = function (ticketNo) {
								var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
								return $uibModal.open({
									templateUrl: resourceUrl+'views/support/create-ticket-modal-success.html',
									ariaLabelledBy:'modal-header__title',
									ariaDescribedBy: 'modal-header__text',
									controller: ['$scope', '$uibModalInstance',
										function ($scope, $uibModalInstance) {
											$scope.ticketNo = ticketNo;
											$timeout(function () {
												$uibModalInstance.dismiss('cancel');
											}, 5000);
										}
									]
								});
							};
					}
				};
				
				function createRemoteIncident(params,requestedFor){
					var deferred = $q.defer();  
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.createIncident,params,requestedFor, null, function(result, event) {
							if (event.status) {
								deferred.resolve(result);
								return result;
							}else{
								deferred.reject();
							}
						});
						return deferred.promise;
				}

				$scope.addCommentAndAttachment = function () {
					if (srDetailsModalState.logText) {
						addComment();
					}
				};

				$scope.CancelAddingNote = function(){
					srDetailsModalState.logText = '';				
				}

				function getAttachmentDetails(selectedSrId){
					var deferred = $q.defer();
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getAttachmentlist,selectedSrId, null, function(result,event) {
					 	if (event.status) {	
					 		if(result.length > 0){
					 			for(var i=0; i<result.length;i++){
                            		var tempAttachment = result[i];
	                            	tempAttachment.iconClass = supportModel.getFileGenericIconClass(tempAttachment.Name);
    	                        }
					 		}							 								
							deferred.resolve(result);
						}else{
							deferred.reject();
						}
				 	});
					return deferred.promise;	
				}
				
				function getClientCommentsDetails(selectedSrId){
					var deferred = $q.defer();
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getLogs,selectedSrId, null, function(result, event) {
					 	if (event.status) {	
					 		if(!_.isEmpty(result)){
								_.each(result,function(comment){
									// process thumbnail
									
									if (comment.createdByThumbnail) {
										thumbnailCache.put('user', comment.submitter, comment.createdByThumbnail);
									}
									if(comment.Notes){
										comment.Notes = supportModel.decodeText(comment.Notes);
									}else if(comment.Summary){
										comment.Summary = supportModel.decodeText(comment.Summary);
									}
								});
							}
							deferred.resolve(result);
						}else{
							deferred.reject();
						}
				 	});
					return deferred.promise;
				}
				
				function delAttachment(attachmentId){
					var deferred = $q.defer();
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.deleteAttachment,attachmentId, null, function(result,event) {
					 	if (event.status) {	
							var len = $scope.supportModel.attachmentData.attachments.length;
							for(var i=0;i<len;i++){
								if(($scope.supportModel.attachmentData.attachments[i].isFile == false && $scope.supportModel.attachmentData.attachments[i].Id == attachmentId) || 
								   ($scope.supportModel.attachmentData.attachments[i].isFile == true && $scope.supportModel.attachmentData.attachments[i].contentDocumentId == attachmentId)){
										$scope.supportModel.attachmentData.attachments.splice(i, 1);
										break;
								}
							}
							if($rootScope.isTicket){
								$scope.$emit("addAttachment", attachmentId);
							}
							deferred.resolve(result);
						}else{
							deferred.reject();
						}
				 	});
					return deferred.promise;	
				}
		
				function getLogs(activityLog){
				var deferred = $q.defer();
				 Visualforce.remoting.Manager.invokeAction(_RemotingActions.createClientNote,userModel.userId,activityLog.srId,activityLog.notes, null, function(result, event) {
					 	if (event.status) {	
							deferred.resolve(result);
						}else{
							deferred.reject();
							srDetailsModalState.addingComment = false;
							var errorMsg = selfServiceLabels.OperationFailed;
							if(event.message != '' && event.message.indexOf('FIELD_CUSTOM_VALIDATION_EXCEPTION') != -1){
								errorMsg = event.message.split(supportModel.EF_NEW)[1];
								errorDialogService.showDialog({
										title: selfServiceLabels.Error,
										titleI18nKey: 'support.sr.reopen.errorHeader',
										text: supportModel.decodeText(errorMsg),
										timeout: 10000
								});
							}
							else if(activityLog.notes.length > 131072){
								errorDialogService.showDialog({
										title: selfServiceLabels.Error,
										titleI18nKey: 'support.sr.reopen.errorHeader',
										text: selfServiceLabels.CharacterExceeded,
										timeout: 10000
								});
							}else{
								errorDialogService.showDialog({
										title: selfServiceLabels.Error,
										titleI18nKey: 'support.sr.reopen.errorHeader',
										text: supportModel.decodeText(errorMsg),
										timeout: 10000
								});
							}
							
						}
				 });
				 return deferred.promise;	
			    }

				var addComment = function () {
					var activityLog = {
						notes: srDetailsModalState.logText,
						srId: getByRequestId ? $scope.supportModel.recordId : selectedSrId						
					};
					getLogs(activityLog)
						.then(function () {
							onAddCommentSuccess(getByRequestId ? $scope.supportModel.recordId : selectedSrId);
							srDetailsModalState.addingComment = false;
						});
				};
				
				var onAddCommentSuccess = function (selectedSrId) {
					srDetailsModalState.logText = '';			
					getSRDetails(true,$scope.supportModel.config.action);
				};

				$scope.cancelRequest = function () {
					srDetailsService.showRequestCancellationDialog({
						srId: getByRequestId ? $scope.supportModel.recordId : selectedSrId,
						recordTitle: isRequest ? supportModel.config.recordName : $scope.incidentDetails.requestId,
						isTicket: isTicket,
						isRequest: isRequest,
						parentModalScope: $scope,
						resolution: $scope.supportModel.htmlUnescape($scope.incidentDetails.resolution)
					})
				};

				$scope.goToUserProfile = function (userId) {
					$scope.navigateToUserProfile(userId);
					$scope.close();
					if (parentScope) {
						parentScope.close();
					}
				};

				$rootScope.deleteAttach = function(type){
					
							delAttachment($rootScope.attachmentId);
						
				}
				
				$scope.removeAttachment = function (id) {
							$rootScope.attachmentId = id;
							$rootScope.isTicket = $scope.isTicket;
							if (supportModel.attachmentData.isAttachmentRequired && supportModel.attachmentData.attachments.length == 1) {
								errorDialogService.showDialog({
										title: selfServiceLabels.warning,
										titleI18nKey: 'support.sr.reopen.errorHeader',
										text: selfServiceLabels.oneAttachmentRequired
									});
								return;
							}
							confirmationDialogService.showDialog({
										title: selfServiceLabels.deleteAttachment,
										titleI18nKey: 'support.sr.reopen.errorHeader',
										text: selfServiceLabels.deleteAttachmentMsg,
										functionType: 'deleteIncident'
									});
				};

				$scope.showSrdCreateDialog = function () {
					if (srDetailsModalState.srClone.crossLaunchUrl) {
						srDetailsModalState.aifSrdLoading = true;
						supportModel.getSRDById(srDetailsModalState.srClone.srdId)
							.then(function (result) {
								var selectedSRD = result[0].items[0];
								selectedSRD.crossLaunchUrl = srDetailsModalState.srClone.requestAgainCrossLaunchUrl;
								srdCreateService.showAifSrdCreateDialog(selectedSRD);
							})
							['finally'](function () {
								srDetailsModalState.aifSrdLoading = false;
							})
					} else {
						supportModel.prepareClonedSrAnswers(srDetailsModalState.srClone);
						srdCreateService.showSupportSrdCreateDialog({
							serviceRequestDefinitionId: srDetailsModalState.srClone.srdId
						});
					}
				};
                 var srId= getByRequestId ? $scope.selectedSR.id : selectedSrId; 
				$scope.confirmReopen = function () {					
							return srModel.reopenServiceRequest(srId)
								.then(function (result) {
									if (result != undefined && result != null) {
										errorDialogService.showDialog({
															title: selfServiceLabels.reopen,
															titleI18nKey: 'support.sr.reopen.errorHeader',
															text: result
										})
									} else {
										getSRDetails(); 
									}
										
								})
								['catch'](function (response) {
									errorDialogService.showDialog({
										titleI18nKey: 'support.sr.reopen.errorHeader',
										text: response.data.defaultMessage
									});
								});
				};
				
				$scope.reduceTheString = function(data){
					if(data !== undefined && data != null && data != '' && data.length > 57){
						data = data.substring(0, 57) + '...';
					}
					return data;
				}

				init();
			}
		]);
