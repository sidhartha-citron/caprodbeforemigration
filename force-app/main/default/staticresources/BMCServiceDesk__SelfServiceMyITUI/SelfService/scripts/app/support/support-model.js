angular.module('supportModule')
		.factory('supportModel', ['attachmentService', 'errorModel', '$filter', '$log', '$uibModal', '$q', 'errorDialogService',
			'$state', 'supportService', 'thumbnailCache', '$timeout','profileModel',  'userModel','$http','$rootScope','$sce',
			function (attachmentService, errorModel, $filter, $log, $uibModal, $q, errorDialogService,
				$state, supportService, thumbnailCache, $timeout,profileModel ,userModel,$http,$rootScope,$sce) {
				var self = {
					srClones: {}
				};
				self.smartSuggestionsData = {
					isSuggestionsOpen : false,
					clearSearchString:false,
					isDataLoading:false
				};

				self.enableSaveAsDraft = enableSaveAsDraft;
				self.savedDraftCount = 0;
				self.userModel = userModel;
				self.retainValuesWhileLoading = false;
				self.errorDialogService = errorDialogService;
				self.lightningModule = lightningModule;
				self.q = $q;
				self.isDraft = false;
				self.isDraftFormLoading = false;
				self.requestDetailId;
				self.incident={};
				self.tempAttachmentId;
				self.oldRequestForWhileCopy;				
				self.defaultValuesForCurrentUserForSelectSRD;
				self.clientId;
				self.clientUsername;
				self.clientName;
				self.clientEmail;
				self.baseElementId;
				self.baseElementName;
				self.EF_NEW = String.fromCharCode(182) + String.fromCharCode(2365) + String.fromCharCode(1240)+String.fromCharCode(1092);
				self.defaultCategoryIconFromStaticResource = defaultCategoryIconFromStaticResource;
				self.categoriesDescMap = {};
				self.getFileGenericIconClass = function (name) {
					var fileExt = name.split('.').pop();
						fileExt = fileExt.toLowerCase();
						documentExts = ['xls', 'xlsx', 'doc', 'docx', 'pdf', 'csv','txt'],
						imageExts = ['jpg', 'jpeg', 'png', 'gif', 'tif', 'tiff', 'bmp'],
						iconClassName = 'd-icon-paperclip';
					var extentionToIcon = {
						'xls' : 'xls',
						'xlsx' : 'xls',
						'doc' : 'word',
						'docx' : 'word',
						'pdf' : 'pdf',
						'csv' : 'xls',				
						'txt' : 'txt'
					};
					if (documentExts.indexOf(fileExt) >= 0) {
						iconClassName = 'd-icon-'+ extentionToIcon[fileExt] + '_square';
					} else if (imageExts.indexOf(fileExt) >= 0) {
						iconClassName = 'd-icon-image_square';
					}
					return iconClassName;
				}
				self.htmlDecode=function (input){
					if(input)
						return angular.element('<div>' + input + '</div>').text().replace(/&amp;/g, '&').replace(/(?:\\[rn]|[\r\n]+)+/g,'');
					return '';
				}
				self.trustedHtml = function(plaintext) {
					return $sce.trustAsHtml(plaintext);
				}
				var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
				
				self.TicketOrRequest = '';
				
				self.setFocusToTop = function(id) {
					$('#'+id).focus();
				}

				self.timelineHover = function(ele, isTargetEelement, isHover) {
					var currentElement = isTargetEelement ? ele.delegateTarget : ele.parentElement;
					if(currentElement != undefined && currentElement.parentElement != undefined && currentElement.parentElement.getAttribute('id') == 'activity-items') {
						if(isHover && $(currentElement.parentElement).hasClass('activity-item_type_request'))
							$(currentElement.parentElement).removeClass('activity-item_type_request');
						else if(!isHover && !$(currentElement.parentElement).hasClass('activity-item_type_request'))
							$(currentElement.parentElement).addClass('activity-item_type_request');
					} else if( currentElement.parentElement == undefined)
						return;
					else
						self.timelineHover(currentElement, false, isHover);
					
				}
				
				self.smartSuggestions = function(searchData) {
                    self.smartSuggestionsData.isDataLoading = true;
                    self.openSmartSuggesetions(searchData);
                }

                self.openSmartSuggesetions = _.debounce(function (searchData) {
                    if(isSmartSuggestionsEnabled && !(lightningModule=='createInc' || lightningModule=='createSR')){
                        if(self.smartSuggestionsData.clearSearchString){
                            searchData = '';
                        }
                        if(!self.smartSuggestionsData.isSuggestionsOpen) {
                            self.smartSuggestionsData.clearSearchString = false;
                        }                   
                        $rootScope.$broadcast('openSmartSuggesetions', searchData);                         
                    }
                }, 500); 

				self.isCJKPattern = function(searchText){
					CJKpattern = /[\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
					var isCJKText = CJKpattern.test(searchText)
					return(isCJKText);
				}
				
				self.config = {
						Title:'',
						description:'',
						shortInstr: '',
						actualInstr: '',
						isRichTextInstr: '',
						ellipsisCls:'ellipsisTextSRDInstructions',
						showCollapsedInstruction: true,
						instructionCls:'support-request__instructioncollapsed',
						ellipsisClsDescription: srColumnLayoutForSS3Val != 2 ? 'support-modal__srd-header-description' : 'support-modal__srd-header-description_for_2_column',
						instructions : '',
						RTFDescription:'',
						conditions:[],
						recordId:'',
						recordName:'',
						category:'',
						openedDate:'',
						formless:'',
						isOnBehalfOf:'',
						onBehalfOfLabel: selfServiceLabels.onbehalfTitle,
						conditionalLabel: selfServiceLabels.MobNewRequest,
						image:'',
						turnaroundTime:'',
						price:'',
						phone:'',
						email:'',
						showApprovals: false,
						currencyType: selfServiceLabels.DefaultUSDCurrency,
						menuItem:[],
						recordState:false,
						recordStateValue:'',
						actionLabel:'',
						showMenu:false,
						showConfirmationMsg:false,
						buttonActionLabel: selfServiceLabels.yes,
						action: '',
						confirmationMsg: selfServiceLabels.NavigationWarning,
						permissions: {
							isEditDisabled: true,
							isCopyDisabled: true
						},
						submitted : false,
						errorMsgString : '',
						delAttachmentId: null,
						formFieldCount: 0,
						loggedInUserId: userModel.userId ,
						isOpen : false,
						isSRD : false
					};
					
					self.userLang = userModel.userLang;
					self.timeZoneOffSetMinutes = userModel.timeZoneOffSetMinutes;
					self.pluginParam = CKPluginLabels;
					self.srData = '';
					self.attachmentData = {	srId:'', 
											attachments:[], 
											isAttachmentRequired: false,
											canHaveAttachments: false
										};
					self.OnBehalfOf= {fvalue: "",
							fRefFieldVal: "",
							fadditionalInfo: "User"+String.fromCharCode(172)+"OnBehalfOf",
							fPhone: "",
							fEmail:""};
					
					self.displayOptions = {
							quantity : 1,
							dateRequired :'',
							dateRequiredDateTime: {},
							totalPrice: '',
							totalPriceLocalized: ''
						};
						
						
					self.calculatetotalPrice = function(){
						var unitPrice = parseFloat(self.config.price.split(' ')[0]);
						if(userModel.enableLocaleNumberFormat){
							if(self.displayOptions.quantity != null && self.displayOptions.quantity > 0){
								self.displayOptions.totalPrice = (self.displayOptions.quantity * unitPrice) + ' ' + self.config.currencyType;
								self.displayOptions.totalPriceLocalized = (self.displayOptions.quantity * unitPrice).toString().replace('.',userModel.localeDecimalSeparator) + ' ' + self.config.currencyType;
							}else{
								self.displayOptions.totalPrice = '0' + ' ' + self.config.currencyType;
								self.displayOptions.totalPriceLocalized = '0' + ' ' + self.config.currencyType;
							}
						}else{
							self.displayOptions.totalPrice = (self.displayOptions.quantity * unitPrice) + ' ' + self.config.currencyType;
							self.displayOptions.totalPriceLocalized = self.displayOptions.totalPrice;
						}
					}
				
				var baseParams = {
					attributes: {
						ServiceRequestDefinition: [
							"id",
							"title",
							"summary",
							"createDate",
							"modifiedDate",
							"desc",
							"isSupported",
							"isHidden",
							"category1",
							"category2",
							"category3",
							"type",
							"instructions",
							"turnaroundTimeUnits",
							"cost",
							"company",
							"category1Id",
							"category2Id",
							"category3Id",
							"locale",
							"turnaroundTime",
							"expectedDate",
							"icon",
							"isProblem",
							"isQuickPick",
							"quickPickOrder",
							"hasCrossLaunchUrl",
							"attachmentEnabled"
						],

						ServiceRequestDefinitionQuestionText: [
							"id",
							"label",
							"createDate",
							"modifiedDate",
							"isRequired",
							"format",
							"isHidden",
							"isReadOnly",
							"getTime",
							"defaultValue",
							"maxChars",
							"numLines",
							"validationExpression",
							"instructions"
						],

						ServiceRequestDefinitionQuestionChoice: [
							"id",
							"label",
							"createDate",
							"modifiedDate",
							"isRequired",
							"format",
							"isHidden",
							"isReadOnly",
							"getTime",
							"relatedQuestions",
							"instructions"
						],

						ServiceRequestDefinitionQuestionNumber: [
							"id",
							"label",
							"createDate",
							"modifiedDate",
							"isRequired",
							"format",
							"isHidden",
							"isReadOnly",
							"getTime",
							"maxValue",
							"minValue",
							"maxLabel",
							"minLabel",
							"defaultValue",
							"instructions"
						],

						ServiceRequestDefinitionQuestionDate: [
							"id",
							"label",
							"createDate",
							"modifiedDate",
							"isRequired",
							"format",
							"isHidden",
							"isReadOnly",
							"getTime",
							"hasDate",
							"hasTime",
							"instructions"
						],

						ServiceRequestDefinitionQuestionChoiceOption: [
							"id",
							"questionId",
							"label",
							"value",
							"order",
							"isDefault",
							"instructions"
						],

						ServiceRequestDefinitionQuestionConditionMap: [
							"id",
							"questionnaireId",
							"parentQuestionId",
							"questionConditionValues",
							"serviceRequestDefinitionId",
							"conditionUser",
							"instructions"
						],
						
						ServiceRequestDefinitionActions: [
							"id",
							"title",
							"order",
							"serviceRequestDefinitionId",
							"triggerCondition",
							"createDate",
							"modifiedDate",
							"type",
							"triggerType",
							"relatedQuestions"
						]
					}
				};
				var categoriesAttributes = {
					attributes: {
						Category: [
							"id",
							"icon",
							"desc",
							"name",
							"order",
							"parentCategoryId"
						],

						CategoryHierarchyMap: [
							"id",
							"order",
							"categoryId",
							"parentCategoryId",
							"calculatedIcon"
						],

						CategoryServiceRequestDefinitionMap: [
							"id",
							"order",
							"serviceRequestDefinitionId",
							"categoryId",
							"calculatedIcon"
						]
					}
				};
				
				self.createTicket= function(templateId, beId, beName){
					 self.dataLoading = true;
					 self.timeZoneOffSetMinutes = userModel.timeZoneOffSetMinutes;
					 var deferred = $q.defer();  
					 var incidentTemplate;
					 var isCiOrAssetAvailable = false;
					 if(!templateId)
						 incidentTemplate =null;
					 else
						 incidentTemplate=templateId;

					var additionalInfo = {};
					additionalInfo.action = 'CREATE';
					 Visualforce.remoting.Manager.invokeAction(_RemotingActions.fetchIncidentFormField,incidentTemplate, additionalInfo,  function(result, event) {
							if (event.status) {																
								angular.forEach(result, function (obj, index){
									if (obj.Type.toLowerCase() == 'date' || obj.Type.toLowerCase() == 'datetime') {
										self.objectToDate(obj);
									}
									if(baseElementApiName == obj.id && beId && beName) {
										isCiOrAssetAvailable = true;
										if(!obj.fvalue){
										obj.fRefFieldVal = beName;
										obj.Value = beName;
										obj.fvalue = beId;
										obj.isTemplateHiddenField = true;
									}
									}									
									if(typeof(self.userModel.LayoutFldsandCriteria) != 'undefined' && self.userModel.LayoutFldsandCriteria != null && (obj.id.toLowerCase() in self.userModel.LayoutFldsandCriteria) && typeof(self.userModel.LayoutFldsandCriteria[obj.id.toLowerCase()].myConditions) != 'undefined' && self.userModel.LayoutFldsandCriteria[obj.id.toLowerCase()].myConditions != null && self.userModel.LayoutFldsandCriteria[obj.id.toLowerCase()].myConditions.length > 0){
										obj.isVisible = false;
									}
									self.decodeField(obj);
								});
								if(!isCiOrAssetAvailable  && beId && beName ) {
									var question={
												'answerIsValid': true,
												'format': 0,
													'id': baseElementApiName,
													'isRequired': false,	
													'visibility': false,	
													'Value':beId,
													'isTemplateHiddenField':true,
													'Type':'',
													'verificationRegExp': /.*/
													
											};
									result.push(question);
								}
								deferred.resolve(result);
								return result;
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;	
				};
				
				self.copyTicket = function(copyIncidentId){
					 self.dataLoading = true;
					 self.timeZoneOffSetMinutes = userModel.timeZoneOffSetMinutes;
					 var deferred = $q.defer();  
					 var incidentTemplate;
					 if(!copyIncidentId)
						 incidentTemplate = null;
					 else
						 incidentTemplate = copyIncidentId;
					 Visualforce.remoting.Manager.invokeAction(_RemotingActions.copyIncident,incidentTemplate, null, function(result, event) {
							if (event.status) {
								result = result.replace(/&quot;/g,'"');
								result = JSON.parse(result);
								var fieldsListToReturn = [];
								self.incident.questions = [];
								_.forEach(result, function (field) {
									if(field.fName != 'id' && field.fadditionalInfo.indexOf('NotFromFS') == -1){
										var tempFldObj = {};
										tempFldObj.id = field.fName;
										tempFldObj.apiName = field.fName;
										tempFldObj.Text = field.fLabel;
										if(field.fisRequired){
											tempFldObj.IsRequired = "true";
										}else{
											tempFldObj.IsRequired = "false";
										}
										if(field.fName.indexOf('incidentresolution__c') == -1 && field.fName.indexOf('fkopenby__c') == -1){
											tempFldObj.isUpdateable = !field.fisReadonly;
										}else{
											tempFldObj.isUpdateable = false;
										}
										if(field.fName.indexOf('templatealreadyapplied__c') != -1 &&  field.fsLabel == 'NotFromFieldSet'){
											tempFldObj.isVisible = false;
											tempFldObj.isTemplateHiddenField = true;
										}else{
											if(typeof(self.userModel.LayoutFldsandCriteria) != 'undefined' && self.userModel.LayoutFldsandCriteria != null && (tempFldObj.id in self.userModel.LayoutFldsandCriteria) && typeof(self.userModel.LayoutFldsandCriteria[tempFldObj.id].myConditions) != 'undefined' && self.userModel.LayoutFldsandCriteria[tempFldObj.id].myConditions != null && self.userModel.LayoutFldsandCriteria[tempFldObj.id].myConditions.length > 0){
												tempFldObj.isVisible = false;
											}else{
												tempFldObj.isVisible = true;
											}
										}
										
										tempFldObj.isSRInput = false;
										if (field.fType.toLowerCase() == 'formula') {
											field.fType = field.fadditionalInfo;
											field.fadditionalInfo = '';
											field.isFormula = true;
										} 
										if (field.isFormula != undefined)
											tempFldObj.isFormula = field.isFormula;
										if(field.fType.toLowerCase() == 'number'){
											tempFldObj.Type = 'number';
											if(field.fvalue.indexOf(userModel.localeDecimalSeparator) > -1){
												tempFldObj.Value = parseFloat(field.fvalue);
											}else{
												tempFldObj.Value = parseInt(field.fvalue);
											}
										}else if(field.fType.toLowerCase() == 'string'){
											tempFldObj.Type = 'textfield';
											tempFldObj.Value = field.fvalue;
										}else if(field.fType.toLowerCase() == 'reference'){
											tempFldObj.Type = 'reference';
											tempFldObj.Value = field.fRefFieldVal;
											tempFldObj.fvalue = field.fvalue;
											var tempRefObj = [];
											var isCategory = false;
											if (field.fadditionalInfo != undefined && field.fadditionalInfo != null && field.fadditionalInfo != '') {
												var refData = field.fadditionalInfo.split('¬¬');
												if (refData[0] != undefined && refData[0] != null && refData[0] != '') {
												var objNameNLblArr = refData[0].split('¬');
												tempFldObj.Values = {0 :{Value : objNameNLblArr[0]}}
												if (objNameNLblArr[0].indexOf(namespaceprefix+'__Category__c') > -1) {
													if(isAccessibilityMode){
														isCategory = false;
													}else{
														isCategory = true;
													}
												}
											}
											if (refData[1] != undefined && refData[1] != null && refData[1] != '')
													tempFldObj.lookupFilter = JSON.parse(refData[1]);
											}
											tempFldObj.isCategory = isCategory;
										}else if(field.fType.toLowerCase() == 'datetime'){
											tempFldObj.Type = 'datetime';
											tempFldObj.Value = field.fvalue;
											tempFldObj.DateStringValue = field.fadditionalInfo;
										}else if(field.fType.toLowerCase() == 'date'){
											tempFldObj.Type = 'date';
											tempFldObj.Value = field.fvalue;
											tempFldObj.DateStringValue = field.fadditionalInfo;
										}else if(field.fType.toLowerCase() == 'multipicklist'){
											tempFldObj.Type = 'picklist';
											tempFldObj.MultiSelect = true;
											tempFldObj.Value = typeof field.fvalue == 'string' ? field.fvalue.split(';') : field.fvalue; 
											tempFldObj = self.splitAdditionalInfo(field.fadditionalInfo,tempFldObj);


										}else if(field.fType.toLowerCase() == 'picklist'){
											tempFldObj.Type = 'picklist';
											tempFldObj.Value = field.fvalue;
											tempFldObj = self.splitAdditionalInfo(field.fadditionalInfo, tempFldObj);
											tempFldObj.addNoneInPicklist = ((tempFldObj.IsRequired && (tempFldObj.Value == '' || tempFldObj.Value == undefined)) || (!tempFldObj.IsRequired));
											
										}else if(field.fType.toLowerCase() == 'number'){
											tempFldObj.Scale = field.fadditionalInfo;
											tempFldObj.Value = parseFloat(field.fvalue);
											tempFldObj.Type = 'number';
											if (tempFldObj.Scale != undefined && tempFldObj.Value != undefined && tempFldObj.Value != 0) {
												if (tempFldObj.Scale > 0) {
													tempFldObj.Value = Math.round(tempFldObj.Value * Math.pow(10, tempFldObj.Scale)) / Math.pow(10, tempFldObj.Scale);
												} else {
													tempFldObj.Value = parseInt(tempFldObj.Value);
												}
											}
										} else if (field.fType.toLowerCase() == 'boolean') {
											tempFldObj.Type = field.fType.toLowerCase();
											tempFldObj.Value = (field.fvalue.toLowerCase() == 'true');
											tempFldObj = self.splitAdditionalInfo(field.fadditionalInfo,tempFldObj);
										}else{
											tempFldObj.Type = field.fType.toLowerCase();
											tempFldObj.Value = field.fvalue;
										}
										if(field.fType.toLowerCase() == 'date' || field.fType.toLowerCase() == 'datetime'){
											self.objectToDate(tempFldObj);
										}
										tempFldObj.InlineHelp = field.fHelpText;
										self.decodeField(tempFldObj);
										fieldsListToReturn.push(tempFldObj);
										self.incident.questions.push(tempFldObj);
									}
								});
								
								deferred.resolve(fieldsListToReturn);
								return fieldsListToReturn;
							}else{
								deferred.reject();
							}
						}, {escape: true});
					return deferred.promise;	
				};

				self.getParentField = function (fldName, incidentFlds){
					var resultIndex;
					fldName = fldName.toLowerCase();
					for(var i = 0; i < incidentFlds.length; i++){
						if(incidentFlds[i].id.toLowerCase() == fldName){
							resultIndex = i;
							break;
						}
					}
					return resultIndex;
				}

				self.evaluateIncidentFldConditions = function (field, layoutFldsCriteria, incident, retainValue) {
					if(typeof(layoutFldsCriteria) != 'undefined' && layoutFldsCriteria != null  && (field.id.toLowerCase() in layoutFldsCriteria)){
						var dependentOnMe, child, myConditions, isInputVisible, parent, advLogicEnabled, indexOfParent, indexOfChild;
						dependentOnMe = layoutFldsCriteria[field.id.toLowerCase()].dependentOnMe;
						angular.forEach(dependentOnMe, function(dependent, index){
							dependent = dependent.toLowerCase();
							indexOfChild = self.getParentField(dependent, incident.questions);
							child = incident.questions[indexOfChild];
							if(typeof(child) != 'undefined' && child != null && !child.IsRequired && layoutFldsCriteria[child.id.toLowerCase()].isAccessible){
								advLogicEnabled = false;
								if(typeof(layoutFldsCriteria[dependent].myConditions) != 'undefined' && layoutFldsCriteria[dependent].myConditions != null && layoutFldsCriteria[dependent].myConditions.length > 0){
									myConditions = layoutFldsCriteria[dependent].myConditions;
									var cndsResultString = layoutFldsCriteria[child.id.toLowerCase()].advancedRuleLogic;
									if(cndsResultString != ''){
										advLogicEnabled = true;
										cndsResultString = ' ' + cndsResultString + ' ';
									}
									angular.forEach(myConditions, function(condition, index){
										indexOfParent = self.getParentField(condition.ControllingFieldName.toLowerCase(), incident.questions);
										parent = incident.questions[indexOfParent];
										isInputVisible = self.evaluateSinglecondition(condition, parent);
										if(advLogicEnabled){
											if(cndsResultString.indexOf(' ' + condition.OrderIndex + ' ') > -1){
												cndsResultString = cndsResultString.replace(' ' + condition.OrderIndex + ' ', ' ' + isInputVisible + ' ');
											}
										}else{
											if(condition.LogicalOperator.toLowerCase() != 'none'){
												cndsResultString = cndsResultString + isInputVisible + ' ' + condition.LogicalOperator + ' ';
											}else{
												cndsResultString = cndsResultString + isInputVisible;
											}
										}
									});
									if(typeof(cndsResultString) != 'undefined' && cndsResultString != null && cndsResultString != ''){
										if(cndsResultString.toLowerCase().indexOf('and') > -1){
											cndsResultString = cndsResultString.replace(/AND/gi, "&&");
										}
										if(cndsResultString.toLowerCase().indexOf('or') > -1){
											cndsResultString = cndsResultString.replace(/OR/gi, "||");
										}
										child.isVisible = eval(cndsResultString);
										//reevaluate conditions for Child's dependent fields
										self.evaluateIncidentFldConditions(child, layoutFldsCriteria, incident, retainValue);
									}
								}
							}else if(typeof(child) != 'undefined' && child != null && child.IsRequired && layoutFldsCriteria[child.id.toLowerCase()].isAccessible){
								child.isVisible = true; 
							}
						});
					}
				}

				self.splitAdditionalInfo = function(fadditionalInfo, tempFldObj) {
					if (typeof(fadditionalInfo) == 'undefined' || fadditionalInfo == null || fadditionalInfo == '')
						return tempFldObj;
					var additionalInfo = JSON.parse(fadditionalInfo);
					if (additionalInfo != undefined) {
						if (additionalInfo.isDependentPicklist) {
							tempFldObj.depValues = additionalInfo.depValues;
							tempFldObj.isDependentPicklist = additionalInfo.isDependentPicklist;
							tempFldObj.picklistInfo = additionalInfo.picklistInfo;
							tempFldObj.PicklistController = additionalInfo.PicklistController;
						}

						if (additionalInfo.hasDependentPicklist){
							tempFldObj.hasDependentPicklist = additionalInfo.hasDependentPicklist;
							tempFldObj.dependentFieldList = additionalInfo.dependentFieldList;
						}
							
						if (additionalInfo.Values)
							tempFldObj.Values = additionalInfo.Values;
						if (additionalInfo.Value)
							tempFldObj.Value =  additionalInfo.Value;
					}
					return tempFldObj;
				}
				self.objectToDate= function(obj){
				  obj.dateTimeFormat=userModel.dateTimeFormat;
				  obj.dateFormat=userModel.dateFormat;
				  obj.currentTime=userModel.currentTime;
				  
				  var dateVal;
				  if(obj.Value !== undefined && obj.Value != null && obj.Value != ''){
						dateVal = new Date(moment(obj.Value,'YYYY-MM-DD HH:mm:ss'));
						if(obj.Type.toLowerCase() == 'date')
							  obj.Value=$filter('date')(dateVal, userModel.dateFormat);
						else
							  obj.Value=$filter('date')(dateVal, userModel.dateTimeFormat).replace('a.m.', 'AM').replace('p.m.','PM').replace('午前', 'AM').replace('vorm.', 'AM').replace('午後', 'PM').replace('nachm.', 'PM');
				  }else{
						dateVal=new Date(moment(obj.currentTime,'YYYY-MM-DD HH:mm:ss'));                                
						var diff = Math.abs((new Date() - dateNow)/60000);
						dateVal.setMinutes(dateVal.getMinutes()+diff);
						
				  }
				  if(obj.Type.toLowerCase() == 'date'){
					obj.DateObject = dateVal;
				  }else{
					obj.DateObject = self.converDatetoLocale(dateVal.getTime().toString());
				  }
				  obj.yy=dateVal.getFullYear();
				  obj.MM=dateVal.getMonth()+1;
				  obj.dd=dateVal.getDate();
				  obj.HH=dateVal.getHours();
				  obj.mm=dateVal.getMinutes();
				  obj.ss=dateVal.getSeconds();      
				  if(obj.HH==00 && obj.mm==00)
						obj.mm=01;
                              
				}

				self.clickedOnDescription = function(){
					if(srColumnLayoutForSS3Val != 2){
					if(self.config.ellipsisClsDescription == 'support-modal__srd-header-description'){
						self.config.ellipsisClsDescription = 'support-modal__srd-header-description-ellipsis';
					}else{
						self.config.ellipsisClsDescription = 'support-modal__srd-header-description';
					}
					}else{
						if(self.config.ellipsisClsDescription == 'support-modal__srd-header-description_for_2_column'){
							self.config.ellipsisClsDescription = 'support-modal__srd-header-description-ellipsis_for_2_column';
						}else{
							self.config.ellipsisClsDescription = 'support-modal__srd-header-description_for_2_column';
						}
					}					
				}

				self.clickedOnInstructions = function(){
					if(self.config && !self.config.isRichTextInstr){
						if(self.config.ellipsisCls == 'withoutEllipsisTextSRDInstructions'){
							self.config.ellipsisCls = 'ellipsisTextSRDInstructions';
						}else{
							self.config.ellipsisCls = 'withoutEllipsisTextSRDInstructions';
						}
					}
				}
				
				self.toggleUserInstruction = function(){
					if(this.config && this.config.isRichTextInstr){
						if(this.config.showCollapsedInstruction){
							this.config.instructionCls = 'support-request__instruction';
						}
						else{
							this.config.instructionCls = 'support-request__instructioncollapsed';
						}
						this.config.showCollapsedInstruction = !this.config.showCollapsedInstruction;
					}
				}
				var displayInstructionToggle = false;
				self.displayShowMoreShowLess = function(){
					var richTextInstrDiv = document.getElementById("richTextInstrDiv");
					if(richTextInstrDiv && this.config && this.config.showCollapsedInstruction)
						richTextInstrDiv.style.maxHeight="100px";
					else{
						var srdForm = document.getElementById('srdForm');
						if(srdForm){
							var ht = srdForm.clientHeight - 100;
							if(richTextInstrDiv)
								richTextInstrDiv.style.maxHeight=ht+"px";
						}
					}
					if(displayInstructionToggle)
						return true;
					if(this.config && this.config.isRichTextInstr && !displayInstructionToggle){
						var el = document.getElementById('richTextInstrDiv');
						if(el && el.scrollHeight != el.clientHeight + 1  && el.scrollHeight != el.clientHeight){
							displayInstructionToggle = true;
							return true;
						}
					}
					return false;
				}
				
				var getCachedServerData = function (cache, successCb, failCb) {
					if (!cache) {
						var successWrapperCall = function (result) {
							cache = result;
							successCb(result);
						};
						self.dataLoading = true;
						return supportService.getSRDCategories()
							['then'](successWrapperCall)
							['catch'](failCb);
					} else {
						return $q.when(successCb(cache));
					}
				};
				
				var getCachedTicketData = function (cache, successCb, failCb) {
					if (!cache) {
						var successWrapperCall = function (result) {
							cache = result;
							successCb(result);
						};
						self.dataLoading = true;
						return createTicket()
							['then'](successWrapperCall)
							['catch'](failCb);
					} else {
						return $q.when(successCb(cache));
					}
				};

				var filterQuickPickSrds = function (qpSrdsCache) {
					return _.filter(qpSrdsCache[0].items, function (srd) {
						return srd.isSupported;
					});
				};

				var setSrdIcon = function (item) {
					var result;
					if (item.icon) {
						result = item.icon;
					} else {
						result = self.srdAndCategoriesIconsHash[item.id];
					}
					if (!result) {
						if(item.name)
							result = 'assistant-categorySRD-storage';	
						else	
							result = 'assistant-categorySRD-form';
					}
					item.icon = result.replace('&', '-');
				};

				self.setSrdAndCategoryIcon = function (item) {
					var result;
					if (item.icon) {
						result = item.icon;
					} else if (item.ParentId) {
						result = self.categoriesIconsHash[item.Id + '_' + item.ParentId];
					} else if (item.Id) {
						result = self.srdsAndCategoriesIconsHash[item.Id + '_' + item.ParentId];
					} else {
						var catId = $state.params.categoryId;
						if(typeof(catId) != 'undefined' && catId != null && catId != ""){
							catId = catId.replace(/%2F/g, '/');
						}
						if (!item.icon && angular.isDefined(catId) && catId != "" && !item.serviceRequestDefinitionId) {
							result = self.categoryHash[catId].icon;
						} else {
							if(item.name)
								result = "i-assistant-categorySRD-storage";	
							else
								result = "SRFilterIcon";
						}
					}
					item.icon = (result) ? result.replace('&', '-') : (item.name? "assistant-categorySRD-storage":"assistant-categorySRD-form");
				};

				var buildChildCategories = function (categoryId, parentCategoryId) {					
					if(self.srdInCache[categoryId]){
						self.childCategories = self.srdHash[categoryId];												
						processCategories();
						self.dataLoading = false;
					}else{
						self.getSrds(categoryId, parentCategoryId).then(function(){
							self.childCategories = self.srdHash[categoryId];												
							processCategories();
							self.dataLoading = false;
						});
					}
				};

				var loadCategorySRDs = function (categoryId) {
					if ($state.current.data.type == 'problem-requests') {
						self.getProblemSRDsByCategoryId(categoryId);
					} else if ($state.current.data.type == 'other-requests') {
						self.getOtherSRDsByCategoryId(categoryId);
					}
				};

				var getProblemSRDsByCategorySuccessCallback = function (result) {
					self.srdAndCategoriesHashCache.problem[$state.params.categoryId] = result;
					var srds = _.filter(self.srdAndCategoriesHashCache.problem[$state.params.categoryId][0].items, function (srd) {
						return srd.isSupported;
					});
					processCategoriesOrSrds(srds);
					self.dataLoading = false;
				};

				var getOtherSRDsByCategorySuccessCallback = function (result) {
					self.srdAndCategoriesHashCache.other[$state.params.categoryId] = result;
					var srds = _.filter(self.srdAndCategoriesHashCache.other[$state.params.categoryId][0].items, function (srd) {
						return srd.isSupported;
					});
					processCategoriesOrSrds(srds);
					self.dataLoading = false;
				};

				var processCategories = function (srds) {
					if (self.childCategories) {
						self.categoriesOrSrds = self.childCategories;
					}
					_.each(self.categoriesOrSrds, function (srd) {
						self.setSrdAndCategoryIcon(srd);
					});
				};

				self.srdAndCategoriesHashCache = {
					problem: {},
					other: {}
				};

				self.parentCategoryHash = {};

				var processAllSrdCategoriesData = function (result) {
					self.srdHash = {};
					self.categoryHash = {};
					self.allSrdHash = {};
					self.srdInCache={};
					self.parentCategoryHash = {};
					self.categoriesIconsHash = {};
					self.srdsAndCategoriesIconsHash = {};
					self.topLevelCategories = [];
					self.allCategories = result[0].items;				
					
					_.each(result[0].items, function (category) {						
						category.catImage = category.catImage != 'useDefaultFromStaticResource' ? getSFDocumentURL(relativeServletURL + category.catImage): category.catImage;						
						self.categoryHash[category.id] = category;	
						self.topLevelCategories.push(category);
						self.categoriesDescMap[category.id] = category.categoryDescription;						
					});

					_.each(self.topLevelCategories, function (item) {
						self.setSrdAndCategoryIcon(item);
					});
					self.config.isSRD = false;
					self.categoriesOrSrds = self.topLevelCategories;
				};
				
				var processSrds = function (srds, srdHash) {
					_.each(srds, function (srd) {
						srdHash[srd.id] = srd;
						srd.questions = [];
						srd.attachments = [];
						srd.initActions = [];
						srd.responseActions = [];
						srd.submitActions = [];
					});
				};

				var processQuestions = function (questions, questionsHash) {
					_.each(questions, function (question) {
						questionsHash[question.id] = question;
						question.answer = question.defaultValue;
						// if SRD is being requested again, cloned answer will be used
						if (self.checkClonedSrAnswer(question.id)) {
							question.answer = self.clonedSrAnswers[question.id].value;
						}
						question.options = [];
						question.foundMatches = [];
						if (question.format === 0 || question.format === 12) {
							if (!question.answer) { question.answer = ''; }
							question.answerIsValid = true;
							if (!question.validationExpression) {
								question.verificationRegExp = new RegExp('.*');
							} else {
								if (_.indexOf(question.validationExpression, '/') == 0) {
									question.verificationRegExp = new RegExp(question.validationExpression.replace(/^.(.*)./, '$1'));
								} else {
									question.verificationRegExp = new RegExp(question.validationExpression);
								}
								// If default value doesn't match the verification expression
								if (!question.verificationRegExp.test(question.answer)) {
									question.answer = '';
								}
							}
						}
					});
				};

				var processDateTimeQuestions = function (question) {
					if (question.format == 7) {
						question.answer = {
							date: new Date(),
							time: new Date()
						};
					}
				};

				var processQuestionsMapping = function (questionMap, srdHash, questionsHash) {
					_.each(questionMap, function (mapping) {
						var srdId = mapping.serviceRequestDefinitionId;
						var questionId = mapping.questionId;

						var srd = srdHash[srdId];
						if (srd) {
							if (!srd.questions) {
								srd.questions = [];
							}
							if (questionsHash[questionId]) {
								questionsHash[questionId].order = mapping.order;
								srd.questions.push(questionsHash[questionId]);
							}
						}
					});
				};

				var processQuestionConditionalMapping = function (questionConditionMap, questionMap, questionsHash, srds, srdHash) {

					// Write parentID for each question to have it in the scope
					_.each(questionsHash, function (question) {
						question.parentId = null;
						question.conditionValues = '';
						question.children = [];
						question.visibility = true;
						question.validate = false;
						question.affectedQuestionIds = [];
					});

					_.each(questionConditionMap, function (cMapping) {
						_.each(questionMap, function (qMapping) {
							if (cMapping.questionnaireId === qMapping.questionnaireId) {
								var question = questionsHash[qMapping.questionId];
								if (!question.parentId) {
									question.parentId = cMapping.parentQuestionId;
								}
								var parentQuestion = questionsHash[question.parentId];
								if( parentQuestion && parentQuestion.format == 2 )
								{
									question.conditionValues = cMapping.questionConditionValues;
								}else{
									question.conditionValues += (question.conditionValues.length) ?
									';' + cMapping.questionConditionValues :
									cMapping.questionConditionValues;
								}								
								question.conditionOperator = 	cMapping.operator;
							}
						},this);
					});

					// Write an order for questions, hide or show question depending on its parent's question answer
					function searchQuestionsTree(parentId, level) {
						level++;
						_.each(_.where(questionsHash, { parentId: parentId }), function (question) {
							var parentQuestion = questionsHash[parentId];
							question.order = (level > 0) ? questionsHash[parentId].order + Math.pow(100, -level) * question.order : question.order;
							question.level = level;
							parentQuestion.children.push(question);
							questionsHash[question.id].visibility = matchConditionValues(question) && !question.isHidden && !parentQuestion.isHidden && parentQuestion.visibility;

							if (matchConditionValues(question) && parentQuestion.hasAnswer) {
								question.hasAnswer = (answerIsNotEmpty(question.answer)) ? true : false;
							} else {
								question.hasAnswer = false;
							}
							searchQuestionsTree(question.id, level);
						});
					}

					_.each(_.where(questionsHash, { parentId: null }), function (pQuestion) {
						pQuestion.level = 0;
						pQuestion.hasAnswer = answerIsNotEmpty(pQuestion.answer);
						if (pQuestion.isHidden) {
							pQuestion.visibility = false;
						}
						searchQuestionsTree(pQuestion.id, pQuestion.level);
					});

					function answerIsNotEmpty(answer) {
						return answer !== null && typeof answer !== 'undefined' && answer !== '';
					}

					function matchConditionValues(question) {
						var parentQuestion = questionsHash[question.parentId];
						//case insensative toLowerCase()
						if(parentQuestion && parentQuestion.answer){
							if(question.conditionOperator=='='){
								if (parentQuestion.format === 1 || parentQuestion.format === 4) {
									var cValues = question.conditionValues.split(';');
									return $.inArray(parentQuestion.answer, cValues) > -1;
								} else{
									if( parentQuestion.answer == question.conditionValues)
										return true;
								}
							}else if(question.conditionOperator=='!='){
								if (parentQuestion.format === 1 || parentQuestion.format === 4) {
									var cValues = question.conditionValues.split(';');
									return $.inArray(parentQuestion.answer, cValues) == -1;
								} else {
									if( parentQuestion.answer != question.conditionValues)
										return true;
								}
							}else if(question.conditionOperator && question.conditionOperator.toLowerCase()=='like') {
									if((parentQuestion.answer.toLowerCase()).indexOf(question.conditionValues.toLowerCase())> -1)
										{
										return true;
										}
							}else if(question.conditionOperator && question.conditionOperator.toLowerCase()=='not like') {
								 if((parentQuestion.answer.toLowerCase()).indexOf(question.conditionValues.toLowerCase())<=-1) {
									return true;
									}
							}
						}
					return false;
						
					}
				};

				var sortQuestionsByOrder = function (srds, srdHash) {
					_.each(srds, function (srd) {
						srdHash[srd.id] = srd;
						srd.questions.sort(sortByOrder);
						_.each(srd.questions, function (question, index) {
							question.orderIndex = index + 1;
						});
					});
				};

				var processOptions = function (options, questionsHash) {
					options.sort(sortByOrder);

					_.each(options, function (option) {
						var questionId = option.questionId;

						var question = questionsHash[questionId];
						if (question) {
							if (!question.options) {
								question.options = [];
							}
							question.options.push(option);

							// processing default options for select/multiselect controls
							processDefaultOptionValues(question, option);
						}
					});
				};
				
				var processSrdActions = function (srdHash, questionsHash, actions) {
					_.each(actions, function (action) {
						action.questions = [];
						var questionIds = action.relatedQuestions.split('|');
						_.each(questionIds, function (questionId) {
							var question = questionsHash[questionId];
							if (question) {
								action.questions.push(question);
							}
						});
						
						var srd = srdHash[action.serviceRequestDefinitionId];
						if (srd) {
							if (action.triggerType == 'Init') {
								srd.initActions.push(action);
							}
							if (action.triggerType == 'Response') {
								srd.responseActions.push(action);
							}
							if (action.triggerType == 'Submit') {
								srd.submitActions.push(action);
							}
						}
						
						if (action.triggerCondition && !action.processed) {
							processActionTrigerCondition(action);
						}
					});
				};
				
				var processActionTrigerCondition = function (action) {
					var str = action.triggerCondition;
					str = str.replace(/ AND /g, " && ")
							.replace(/ OR /g, " || ")
							.replace(/=/g, "==")
							.replace(/null/g, "''");
					action.triggerCondition = str;
					action.processed = true;
				};
				
				self.triggerActions = function (srd, actions, questionId, userId) {
					var promises = [];
					
					if (srd && actions) {
						_.each(actions, function (action) {
							var condition = action.triggerCondition;
							
							// if condition is not set, then execute action in any case
							if (condition == null) {
								self.invokeSrdAction(srd, action, userId);
								return;
							}

							// skipping those actions that have condition but do not have id of the
							// question that triggered the event
							if (questionId && condition && condition.indexOf(questionId) == -1) {
								return;
							}
							
							_.each(srd.questions, function (question) {
								var answerPlaceholder = '#RQ:' + question.id + '#';
								var regx = new RegExp(answerPlaceholder, 'g');
								if (!question.answer) {
									condition = condition.replace(regx, "''");
								} else if (question.format == 3) {
									condition = condition.replace(regx, question.answer);
								} else {
									condition = condition.replace(regx, '"' + question.answer + '"');
								}
							});
							
							try {
								var result = eval(condition);
							} catch (e) {
								$log.error('Error evaluating action condition: ' + condition);
							}
							
							if (result) {
								promises.push(self.invokeSrdAction(srd, action, userId));
							}
						});
					}

					if (promises.length) {
						return promises;
					} else {
						return $q.when(true);
					}
				};

				var processDefaultOptionValues = function (question, option) {
					// if cloned SR answer is present, and current option is default one,
					// remove 'isDefault' flag so that cloned answer could be the default now
					if (self.checkClonedSrAnswer(question.id) && option.isDefault) {
						option.isDefault = false;
					}

					// if current option was chosen in SR that is being cloned, set is as default
					if (self.checkClonedSrAnswer(question.id)
						&& (self.clonedSrAnswers[question.id].value == option.value
							|| question.format === 2 && self.clonedSrAnswers[question.id].value.indexOf(option.value) !== -1)
					) {
						option.isDefault = true;
					}
					if (option.isDefault) {
						if (question.format == 2) {
							// checkboxes/multiple selection
							if (!question.answer) {
								question.answer = [];
							}
							if (question.answer.indexOf(option.value) === -1) {
								question.answer.push(option.value);
							}
						} else {
							// radio and lists
							question.answer = option.value;
						}
					}
				};

				var sortByOrder = function (x, y) {
					var order1 = x.order;
					var order2 = y.order;
					return ((order1 < order2) ? -1 : ((order1 > order2) ? 1 : 0));
				};
				
				self.close = function (result){
					self.modalInstance.close(result);
				};
				
				self.converDatetoLocale = function (milliseconds){
					var dt = new Date();
					var timezoneOffset = dt.getTimezoneOffset() * 60000;
					var utc = parseInt(milliseconds) + (dt.getTimezoneOffset() * 60000);
					var newdt = new Date(utc + parseInt(timezoneOffset));
					return newdt;
				}
				
				self.evaluateCondition = function (question, srInputs, retainValue) {
					var dependentOnMe, myConditions, isInputVisible, isPrevInputVisible, prevLogicalOperator, parent;
					dependentOnMe = question.dependentOnMe;
					
					angular.forEach(dependentOnMe, function(dependent, index){
						myConditions = srInputs[dependent].myConditions;
						var resultArray = [];
						angular.forEach(myConditions, function(condition, index){
							parent = srInputs[condition.DependentQuestionId];
							isInputVisible = self.evaluateSinglecondition(condition, parent);
							resultArray.push(isInputVisible);
							
							if(!condition.LogicalOperator) {
								isInputVisible = self.evaluateArray(resultArray);
								if(srInputs[condition.QuestionId].isVisible != isInputVisible) { 
									srInputs[condition.QuestionId].isVisible = isInputVisible;
									if(self.retainValuesWhileLoading == true){
										self.evaluateCondition(srInputs[condition.QuestionId], srInputs);
									}else{
										self.evaluateCondition(srInputs[condition.QuestionId], srInputs, false);
									}
								}
							} else {
								resultArray.push(condition.LogicalOperator);
							}
						});
					});
					return srInputs;
				};
				
				self.evaluateArray = function(resultArray){
					var prevValue = '';
					for(var i = 0; i < resultArray.length; i++) {
						if(resultArray[i] == 'AND') {
							i = i+1;
							prevValue = prevValue && resultArray[i];
						} else if(resultArray[i] == "OR") {
							if(prevValue === true) 
								return true;
						} else {
							prevValue = resultArray[i];
						}
					}
					return prevValue;
				};
				
				self.evaluateDateAndDateTime = function(parent, condition, value) {
					var isVisible = false;
					var parentVal = parent.Value;
					var	condVal = value;
					if(condition.Operator.indexOf('&gt;') != -1){
						condition.Operator = condition.Operator.replace(/&gt;/gi, '>');
					}else if(condition.Operator.indexOf('&lt;') != -1){
						condition.Operator = condition.Operator.replace(/&lt;/gi, '<');
					}
					var yearAdjustment = self.getThaiYearAdjustment();
					if(parent.Type == 'date' || parent.Type == 'date/time' || parent.Type == 'datetime') {
						if(typeof(parent.Value) != 'undefined' && parent.Value != null && parent.Value != ''){
							if(parent.Type == 'date') {
								parentVal = new Date(parent.yy - yearAdjustment, parent.MM-1, parent.dd, 0, 0, 0);//parent.DateObject;
							}
							else {
								parentVal = new Date(parent.yy - yearAdjustment, parent.MM-1, parent.dd, parent.HH, parent.mm, 0);//parent.DateObject;
							}
						}
						if(parent.Value !== null && parent.Value !== '' && (parentVal instanceof Date) ) {
								parentVal.setSeconds(0);
								if(parent.Type == 'date') {
									parentVal.setHours(0);
									parentVal.setMinutes(0);
								}
								parentVal = parentVal.getTime();
								condVal = condVal.getTime();
						}
					}
					if(!parent.isVisible || parentVal == undefined || parentVal === null || parentVal.toString() === '' ) {
						isVisible = false;
					} else if(condition.Operator == '=' && parentVal == condVal) {
							isVisible = true; 
					} else if(condition.Operator == '!=' && parentVal != condVal) {
							isVisible = true;  
					} else if(condition.Operator == '>' && parentVal > value) {
						 isVisible = true;
					} else if(condition.Operator == '>=' && parentVal >= value) {
						 isVisible = true;
					} else if(condition.Operator == '<' && parentVal < value) {
						 isVisible = true;
					} else if(condition.Operator == '<=' && parentVal <= value) {
						 isVisible = true;
					} 
					return isVisible;
				};
				
				self.evaluateSinglecondition = function(condition, parent) {
					var isVisible = false;
					if(parent && parent.Type && (typeof parent.Value != 'undefined' || typeof parent.fRefFieldVal != 'undefined')) {
						switch(parent.Type) {
							case 'boolean':
							case 'checkbox' : 
								var parentValue = parent.Value === '' ? false : angular.isString(parent.Value) ? JSON.parse(parent.Value.toLowerCase()) : parent.Value;
								if(!parent.isVisible) {
									isVisible = false;
								} else if(condition.Operator == '=' && parentValue == JSON.parse(condition.Value.toLowerCase())) {
									 isVisible = true;
								} else if(condition.Operator == '!=' && parentValue != JSON.parse(condition.Value.toLowerCase())) {
									isVisible = true;
								}
								break;
							
							case 'number' :
								if(!parent.isVisible || parent.Value === null || parent.Value.toString() === '') {
									isVisible = false;
								} else {
									isVisible = self.evaluateDateAndDateTime(parent, condition, condition.Value); 
								}
								break;
							
							case 'url':
							case 'phone':
							case 'email':
							case 'string':
							case 'textfield' :
								var val = self.htmlUnescape(condition.Value);
								if(!parent.isVisible || parent.Value === '') {
									isVisible = false;
								} else if(condition.Operator == 'LIKE' && parent.Value.toLowerCase().indexOf(val.toLowerCase()) > -1) {
									 isVisible = true;
								} else if(condition.Operator == 'NOT LIKE' && parent.Value.toLowerCase().indexOf(val.toLowerCase()) == -1) {
									 isVisible = true;
								} else if(condition.Operator == '=' && parent.Value.toLowerCase() == val.toLowerCase()) {
									 isVisible = true;
								} else if(condition.Operator == '!=' && parent.Value.toLowerCase() != val.toLowerCase()) {
									 isVisible = true;
								} 
								break;
							
							case 'textarea':
								var val = self.htmlUnescape(condition.Value);
								if(!parent.isVisible || parent.Value === '') {
									isVisible = false;
								} else if(condition.Operator == 'LIKE' && parent.Value.toLowerCase().indexOf(val.toLowerCase()) > -1) {
									 isVisible = true;
								} else if(condition.Operator == 'NOT LIKE' && parent.Value.toLowerCase().indexOf(val.toLowerCase()) == -1) {
									 isVisible = true;
								}
								break;
							
							case 'date':
								var dateValue ;
								dateValue = self.convertStringtoDate(condition.Value);
								if(dateValue !== undefined && dateValue != null){
									dateValue.setHours(0);
									dateValue.setMinutes(0);
									dateValue.setSeconds(0);
								}
								isVisible = self.evaluateDateAndDateTime(parent, condition, dateValue);
								break;
							
							case 'datetime':
							case 'date/time' :
								var dt=new Date();
								var dateTimeValue = new Date(parseInt(condition.Value,10) + (self.timeZoneOffSetMinutes + dt.getTimezoneOffset())*60000);
								isVisible = self.evaluateDateAndDateTime(parent, condition, dateTimeValue);
								break;
							
							case 'multipicklist':
							case 'picklist':
								var condVal = self.htmlUnescape(condition.Value);
								if(!parent.isVisible || !parent.Value) {
									isVisible = false;
								} else if(parent.MultiSelect) {
									if(condition.Operator == '=') {
										angular.forEach(parent.Value, function(val, key) {
											if(val.toLowerCase() == condVal.toLowerCase())
												isVisible = true;
										}); 
									} else if(condition.Operator == '!=' && parent.Value != dateTimeValue) {
										 var isAnyEqual = false;
										 angular.forEach(parent.Value, function(val, key) {
											if(val.toLowerCase() == condVal.toLowerCase())
												isAnyEqual = true;
												return;
										});
										isVisible = !isAnyEqual;
									} 
								} else {
									if(condition.Operator == '=' && parent.Value.toLowerCase() == condVal.toLowerCase())
										isVisible = true;
									else if(condition.Operator == '!=' && parent.Value.toLowerCase() != condVal.toLowerCase())
										isVisible = true;
								}
								break;
							
							case 'radiobutton' : 
								if(!parent.isVisible || parent.Value === '') {
									isVisible = false;
								} else if(condition.Operator == '=' && parent.Value == condition.Value) {
									 isVisible = true;
								} else if(condition.Operator == '!=' && parent.Value != condition.Value) {
									 isVisible = true;
								} 
								break;
							
							case 'reference' :
							case 'lookup' :
								var lookupVal='';
								var conditionValue = condition.Value;
								if(parent.Values[0].Value.toLowerCase() == 'user'){
									//Defect 82818: Evaluate condition on user lookup using user Id.
									var conditionSplit = condition.Value.split(String.fromCharCode(1092));
									if(conditionSplit.length > 1){
										conditionValue = conditionSplit[1];
										lookupVal = parent.fvalue;
									}
									else if(parent.fEmail){//fallback mechanism to do username based conditional rendering.
										lookupVal = parent.fEmail;
									}
								}else if(self.TicketOrRequest.toLowerCase() == 'ticket' && condition.Value.indexOf(String.fromCharCode(182) + String.fromCharCode(2365) + String.fromCharCode(1240) + String.fromCharCode(1092)) > -1){
									var conditionSplit = condition.Value.split(String.fromCharCode(182) + String.fromCharCode(2365) + String.fromCharCode(1240) + String.fromCharCode(1092));
									if(conditionSplit.length > 1){
										conditionValue = conditionSplit[1];
										lookupVal = parent.fvalue;
									}
								}else{
									lookupVal = parent.fRefFieldVal;
								}
								
								if(!parent.isVisible || lookupVal === '') {
									isVisible = false;
								} else if(condition.Operator == '=' && lookupVal == conditionValue) {
									 isVisible = true;
								} else if(condition.Operator == '!=' && lookupVal && lookupVal != conditionValue) {
									 isVisible = true;
								} 
								break;
								
							case 'richtextarea' : 
								if(!parent.isVisible || parent.Value === '') {
									isVisible = false;
								} else if(condition.Operator == 'LIKE' && parent.Value.toLowerCase().indexOf(condition.Value.toLowerCase()) > -1) {
									 isVisible = true;
								} else if(condition.Operator == 'NOT LIKE' && parent.Value.toLowerCase().indexOf(condition.Value.toLowerCase()) == -1) {
									 isVisible = true;
								}
								break;
								
						}
					}
					return isVisible;
				};
				
				self.convertStringtoDate = function(dateStr) {
					if(typeof(dateStr) != 'undefined' && dateStr != null && dateStr != ''){
						var dateArr = dateStr.split(' ');
						return new Date(dateArr[0]);
					}
				};
				
				self.setToDefault = function(){
					self.config = {
						Title:'',
						description:'',
						shortInstr: '',
						actualInstr: '',
						instructions : '',
						ellipsisCls:'ellipsisTextSRDInstructions',
						showCollapsedInstruction: true,
						instructionCls:'support-request__instructioncollapsed',
						ellipsisClsDescription: srColumnLayoutForSS3Val != 2 ? 'support-modal__srd-header-description-ellipsis' : 'support-modal__srd-header-description-ellipsis_for_2_column',
						RTFDescription:'',
						conditions:[],
						recordId:'',
						recordName:'',
						category:'',
						openedDate:'',
						formless:'',
						isOnBehalfOf:'',
						onBehalfOfLabel: selfServiceLabels.onbehalfTitle,
						conditionalLabel: selfServiceLabels.MobNewRequest,
						image:'',
						turnaroundTime:'',
						price:'',
						priceLocalized:'',
						phone:'',
						email:'',
						showApprovals: false,
						currencyType: selfServiceLabels.DefaultUSDCurrency,
						menuItem:[],
						recordState:false,
						recordStateValue:'',
						actionLabel:'',
						showMenu:false,
						showConfirmationMsg:false,
						buttonActionLabel: selfServiceLabels.yes,
						action: '',
						confirmationMsg: selfServiceLabels.NavigationWarning,
						permissions: {
							isEditDisabled: true,
							isCopyDisabled: true
						},
						submitted : false,
						errorMsgString : '',
						delAttachmentId: null,
						formFieldCount: 0,
						loggedInUserId: userModel.userId ,
						isOpen : false,
						isSRD : true
					};

					self.userLang = userModel.userLang;
					self.timeZoneOffSetMinutes = userModel.timeZoneOffSetMinutes;
					self.pluginParam = CKPluginLabels;
					self.srData = '';
					self.attachmentData = {	srId:'', 
											attachments:[], 
											isAttachmentRequired: false,
											canHaveAttachments: false
										};
					
					self.OnBehalfOf= {fvalue: "",
						fRefFieldVal: "",
						fadditionalInfo: "User"+String.fromCharCode(172)+"OnBehalfOf",
						fPhone: "",
						fEmail:""};
					
					self.displayOptions = {
						quantity : 1,
						dateRequired :'',
						dateRequiredDateTime: {},
						totalPrice: ''
					};
					
					self.srData.SRLeftRightPanelFields = {}; 
				};
				
				self.assignDataToModel = function(data){
					displayInstructionToggle = false;//set this variable to false each time the form loads
					self.TicketOrRequest = 'Request';
					self.srData = data;
					if (self.config.action != 'VIEW') {
						self.config.recordState = true;
					}
					
					if(self.config.action == 'EDIT'){
						self.config.showApprovals = self.srData.showApproval;
					}else if(self.config.action == 'VIEW'){
						if(self.srData.approversInfo != 'undefined' && self.srData.approversInfo != null && self.srData.approversInfo != ''){
							self.config.showApprovals = true;
						}
					}
					
					self.attachmentData.hideList = (self.config.action == 'VIEW');
					if (typeof data.SRPermissions != 'undefined') {
						self.attachmentData.isAttachmentRequired = data.SRPermissions.isAttachmentRequired;
						self.attachmentData.canHaveAttachments = data.SRPermissions.canHaveAttachments;
						self.config.permissions.isEditDisabled = data.SRPermissions.isEditDisabled ;
						self.config.permissions.isCopyDisabled = data.SRPermissions.isCopyDisabled ;
					}

					if(self.srData.SRIncidentFieldSet !== undefined && self.srData.SRIncidentFieldSet != null
						&& self.srData.SRIncidentFieldSet.fieldSetLabel !== undefined 
						&& self.srData.SRIncidentFieldSet.fieldSetLabel != null
						&& self.srData.SRIncidentFieldSet.fieldSetLabel != ''){
							//self.srData.SRIncidentFieldSet.fieldSetLabel = self.srData.SRIncidentFieldSet.fieldSetLabel.toUpperCase();
							
							angular.forEach(self.srData.SRIncidentFieldSet.fields, function (obj, index){
									if (obj.Type == 'encryptedstring' && typeof(obj.Value) != "undefined" && obj.Value != null && obj.Value != '') {
										obj.Value = obj.Value.replace(/./g, '*');
									}
									if (obj.Type == 'number') {
										if (obj.scale != undefined && obj.Value != undefined && obj.Value != 0)
											if (obj.scale > 0) {
												obj.Value = Math.round(obj.Value * Math.pow(10, obj.scale)) / Math.pow(10, obj.scale);
											} else {
												obj.Value = parseInt(obj.Value);
											}
										if(userModel.enableLocaleNumberFormat){
											if(self.config.action == 'VIEW' && typeof(obj.Value) != 'undefined' && obj.Value != null){
												obj.Value = obj.Value.toString().trim().replace(".",userModel.localeDecimalSeparator);
											}
										}
									}
									self.decodeField(obj);
								}
							);
							
					}
					
					if(self.srData.SRStaticFields !== undefined && self.srData.SRStaticFields.fields !== undefined && self.srData.SRStaticFields.fields.length > 0){
						angular.forEach(self.srData.SRStaticFields.fields,function (obj, index){
							self.decodeField(obj);
							if(obj.Name === 'clientId'){
								self.oldRequestForWhileCopy=obj.Value;
							}
						});
					}
					
					angular.forEach(self.srData.SRLeftRightPanelFields.fields,function (Fields, index){
						angular.forEach(Fields,function (obj, index){
						if(obj.Type == 'encryptedstring' && typeof(obj.Value) != "undefined" && obj.Value != null && obj.Value != ''){
							obj.Value = obj.Value.replace(/./g, '*');
						}
						if (obj.Type == 'number') {
							if (obj.scale != undefined && obj.Value != undefined && obj.Value != 0)
								if (obj.scale > 0) {
									obj.Value = Math.round(obj.Value * Math.pow(10, obj.scale)) / Math.pow(10, obj.scale)
								} else {
									obj.Value = parseInt(obj.Value);
								}
								
							if(userModel.enableLocaleNumberFormat){
								if(self.config.action == 'VIEW' && typeof(obj.Value) != 'undefined' && obj.Value != null){
									obj.Value = obj.Value.toString().trim().replace(".",userModel.localeDecimalSeparator);
								}
							}
						} else if (self.config.action != 'VIEW' && (obj.Type == 'picklist' || obj.Type == 'multipicklist' ) && obj.MultiSelect != undefined && obj.MultiSelect) {
							obj.Value = typeof obj.Value == 'string' ? obj.Value.split(';') : obj.Value;
						} else if(obj.Type == 'picklist' && (obj.MultiSelect == undefined || !obj.MultiSelect)) {
							obj.addNoneInPicklist = ((!obj.IsRequired ) || (obj.IsRequired && (obj.Value == undefined || obj.Value == '')));
						}else if (obj.Type == 'lookup') {
							obj.Value = obj.fRefFieldVal;
						}
						obj.isVisible = true;
						obj.isFromRDFieldSet = true;
						self.decodeField(obj);
					});
					});
					angular.forEach(self.srData.SRInputs,function (obj, index){
						
						
						
						self.decodeField(obj);
						if (obj.Value != undefined && obj.Value != null && obj.Type == 'date/time') {									
							obj.Value=obj.Value.replace('a.m.', 'AM').replace('p.m.','PM').replace('午前', 'AM').replace('vorm.', 'AM').replace('午後', 'PM').replace('nachm.', 'PM');
						} else if(obj.Type == 'picklist' && !obj.MultiSelect) {
							obj.addNoneInPicklist = ((obj.IsRequired && (obj.Value == '' || obj.Value == undefined || obj.Value == 'nullфnull'|| obj.Value == 'null'+self.EF_NEW+'null')) || (!obj.IsRequired ));
						} else if(obj.Type == 'number'){
							if(userModel.enableLocaleNumberFormat){
								if(self.config.action == 'VIEW' && typeof(obj.Value) != 'undefined' && obj.Value != null){
									obj.Value = obj.Value.toString().trim().replace(".",userModel.localeDecimalSeparator);
								}
								if(typeof(obj.Validations) != 'undefined' && obj.Validations != null){
									if(typeof(obj.Validations.MinValue) != 'undefined' && obj.Validations.MinValue != null){
										obj.Validations.MinValueLocalized = obj.Validations.MinValue.toString().trim().replace(".",userModel.localeDecimalSeparator);
									}
									if(typeof(obj.Validations.MaxValue) != 'undefined' && obj.Validations.MaxValue != null){
										obj.Validations.MaxValueLocalized = obj.Validations.MaxValue.toString().trim().replace(".",userModel.localeDecimalSeparator);
									}
								}
							}else{
								if(typeof(obj.Validations) != 'undefined' && obj.Validations != null){
									if(typeof(obj.Validations.MinValue) != 'undefined' && obj.Validations.MinValue != null){
										obj.Validations.MinValueLocalized = obj.Validations.MinValue;
									}
									if(typeof(obj.Validations.MaxValue) != 'undefined' && obj.Validations.MaxValue != null){
										obj.Validations.MaxValueLocalized = obj.Validations.MaxValue;
									}
								}
							}
						} else if(obj.Value && obj.Type.toLowerCase() == "richtextarea") {
							obj.Value = getSFDocumentURL('','',obj.Value);
						}
					});
					if (self.config.action != 'VIEW') {
						angular.forEach(self.srData.SRDisplayFields.fields, function (obj, index){
	                		if(obj && obj.Name && obj.Name != 'UserInstructions') {
								self.decodeField(obj);
	                		}

							if(obj.Type=='date/time' && obj.Name=='dateRequired'){
								if(self.config.action == 'NEW' || (self.config.action == 'COPY' && !self.isDraft)){
									obj.Value = '';
								}
								self.objectToDate(obj);
							}
						});
						
						angular.forEach(
							self.srData.SRInputs, function (obj, index){
								if (obj.Type == 'checkbox' && typeof obj.Value == 'string') {
									obj.Value = JSON.parse(obj.Value.toLowerCase());
								} else if (obj.Type == 'date' || obj.Type == 'date/time') {									
									self.objectToDate(obj);
								} else if (obj.Type == 'picklist' && obj.MultiSelect) {
									obj.Value = typeof obj.Value == 'string' ? obj.Value.split(',') : obj.Value;
								}
								if(obj.Type == 'checkbox' || (typeof obj.Value != 'undefined' && obj.Value.toString() !== '')){
									self.retainValuesWhileLoading = true;
									self.evaluateCondition(obj, self.srData.SRInputs, true);
									self.retainValuesWhileLoading = false;
								}
								if(obj.Type == 'richtextarea' && obj.IsRequired && obj.Value === '')
									self.config.errorMsgString = selfServiceLabels.CustomRequiredStr + ' ['+obj.Text+']';

							}
						);

						if(self.config.action == 'COPY' && !self.isDraft && self.oldRequestForWhileCopy!=userModel.userId){
							supportService.getDefaultValuesForUser(userModel.userId, self.srData.currentSRDId)
							.then(function (data) {
								self.defaultValuesForCurrentUserForSelectSRD=data;
								angular.forEach(
									self.srData.SRInputs, function (obj, index){
										for(var i=0; i<self.defaultValuesForCurrentUserForSelectSRD.length; i++){
											if(obj.Id==self.defaultValuesForCurrentUserForSelectSRD[i].Id){									
												obj.Value = self.decodeText(self.defaultValuesForCurrentUserForSelectSRD[i][namespace+'DefaultValue__c']);											
											}
										}
									}
								);
							});
						}	


						angular.forEach(self.srData.SRLeftRightPanelFields.fields, function (Fields, index){
							angular.forEach(Fields, function (obj, index){
								if (obj.Type == 'date' || obj.Type == 'date/time') {									
									self.objectToDate(obj);									
								} 
								if(obj.Type == 'encryptedstring' && typeof(obj.Value) != "undefined" && obj.Value != null && obj.Value != ''){
									obj.Value = obj.Value.replace(/./g, '*');
								}
							});
						});
						self.config.isOnBehalfOf = userModel.isOnBehalfOfEnabled;
						self.OnBehalfOf.fRefFieldVal = '';
					}

					if (typeof data.SRStaticFields != 'undefined') {
						self.processStaticFields(self.srData.SRStaticFields.fields, self.config.action);
					}
					self.processDisplayOptions(self.srData.SRDisplayFields.fields, self.config.action);
				};
				
				self.processStaticFields = function(fields, action) {
					var srdState = $filter('filter')(fields , {Name: 'state'});
					var srdName = $filter('filter')(fields , {Name: 'name'});
					var srdStatus = $filter('filter')(fields , {Name: 'status'});
					var srdCategory = $filter('filter')(fields , {Text: 'Category'});
					var srOpenedDate = $filter('filter')(fields , {Text: 'Date Opened'});

					if(srdState !== undefined  && srdState.length > 0 && srdState[0].Value !== undefined){
						self.config.recordState = srdState[0].Value;
						fields.splice(self.getIndexOf(fields,'state','Name'),1);
					}
					
					if(srdStatus !== undefined  && srdStatus.length > 0 && srdStatus[0].Value !== undefined){
						self.config.recordStateValue = srdStatus[0].Value;
						fields.splice(self.getIndexOf(fields,'status','Name'),1);
					}
					if (self.config.recordState == true ||  self.config.recordStateValue === 'OPENED') {
   							self.config.isOpen = true;
   					}
   
					if(srdName !== undefined  && srdName.length > 0 && srdName[0].Value !== undefined){
						self.config.recordName = srdName[0].Value;
						fields.splice(self.getIndexOf(fields,'name','Name'),1);
					}
					
					if(srdCategory !== undefined && srdCategory.length > 0 && srdCategory[0].Value !== undefined){
						self.config.category = srdCategory[0].Value;
					}
					
					if(srOpenedDate !== undefined && srOpenedDate.length > 0 && srOpenedDate[0].Value !== undefined){
						self.config.openedDate = srOpenedDate[0].Value;
					}

					var requestFor = $filter('filter')(fields , {Name: 'requestFor'});
					if (requestFor !== undefined && requestFor.length > 0) {
						self.OnBehalfOf.fRefFieldVal = requestFor[0].Value;
					}
					var clientId = $filter('filter')(fields , {Name: 'clientId'});
					if (clientId !== undefined && clientId.length > 0) {
						self.OnBehalfOf.fvalue = clientId[0].Value;
						fields.splice(self.getIndexOf(fields,'clientId','Name'),1);
					}
					self.config.conditionalLabel = self.config.recordName+" | " + self.config.recordStateValue;
				};
				
				self.processDisplayOptions = function(fields, action) {
					var srdTitle = $filter('filter')(fields, {Name : 'title'});
					var srdDescription = $filter('filter')(fields, {Name : 'description'});
					var srdTurnaroundTime = $filter('filter')(fields, {Name : 'turnaroundTime'});
					var srdPrice = $filter('filter')(fields, {Name : 'customerPrice'});
					var srdImage = $filter('filter')(fields, {Name : 'image'});
					var rtfField = $filter('filter')(fields, {Name : 'RichTextDescription'});
					var instructions = $filter('filter')(fields, {Name : 'UserInstructions'});
					var quantity = $filter('filter')(fields, {Name : 'quantity'});
					var assignedTo = $filter('filter')(fields, {Name : 'assignedTo'});

					if (action != 'VIEW') {
						var dateRequired = $filter('filter')(fields, {Name : 'dateRequired'});
						var phone = $filter('filter')(fields, {Name : 'phone'});
						var email = $filter('filter')(fields, {Name : 'email'});
						var attachment = $filter('filter')(fields, {Name : 'Attachment__c'});
						var attachmentRequired = $filter('filter')(fields, {Name : 'AttachmentRequired__c'});
						
						if (attachment !== undefined && attachment.length > 0 && attachment[0].Value)
							self.attachmentData.attachments = new Array();

						if (phone !== undefined && phone.length > 0 && phone[0].Value !== undefined){
							self.OnBehalfOf.fPhone = phone[0].Value;
							self.config.phone = phone[0].Value;
						}
						if (email !== undefined && email.length > 0 && email[0].Value !== undefined){
							self.OnBehalfOf.fEmail = email[0].Value;
							self.config.email = email[0].Value;
						}

						if (attachment !== undefined && attachment.length > 0) {
							self.attachmentData.canHaveAttachments = attachment[0].Value;
						}

						if (attachmentRequired !== undefined && attachmentRequired.length > 0) {
							self.attachmentData.isAttachmentRequired = attachmentRequired[0].Value;
						}
						
						if (action == 'EDIT' && dateRequired !== undefined && dateRequired.length > 0 && typeof dateRequired[0].Value != 'undefined') {
							self.displayOptions.dateRequired = dateRequired[0].Value;
						}
					} else {
						/*-----Handling display option fields as rest service pushing all those fields into map regardless of whether this field is checked in display option or not--*/
						fields.splice(self.getIndexOf(fields,'requestFor','Name'),1);
						fields.splice(self.getIndexOf(fields,'requestedBy','Name'),1);
						if(self.srData.approversInfo !== undefined){
							var approverField = $filter('filter')(fields, {Name : 'approvalRequired'});
							if (approverField !== undefined && approverField.length > 0) {
								approverField[0].Value = self.htmlUnescape(self.srData.approversInfo);
							}
						}else{
							fields.splice(self.getIndexOf(fields,'approvalRequired','Name'),1);
						}
						
						if(assignedTo && assignedTo.length > 0){
							assignedTo[0].Value = self.htmlDecode(assignedTo[0].Value);
						}
						
						/*----As the email field is showing emailid of created user, not the submitted user so adding this code--*/
						var emailField = $filter('filter')(fields, {Name : 'email'});
						if (emailField !== undefined && emailField.length > 0) {
								emailField[0].Value = self.srData.emailIdOfRequestedForUser;
						}
						var phoneField = $filter('filter')(fields, {Name : 'phone'});
						if (phoneField !== undefined && phoneField.length > 0) {
								phoneField[0].Value = self.srData.phoneOfRequestedForUser;
						}
					}

					if (srdTitle !== undefined && srdTitle.length > 0) {
						self.config.Title = self.decodeText(srdTitle[0].Value);
					}
					if (srdDescription !== undefined  && srdDescription.length > 0 && srdDescription[0].Value !== undefined) {
						self.config.description = self.decodeText(srdDescription[0].Value);
					}
					if (instructions !== undefined  && instructions.length > 0 && instructions[0].Value != null && instructions[0].Value != undefined){
						self.config.actualInstr =  self.htmlUnescape(instructions[0].Value);
						self.config.isRichTextInstr = instructions[0].isRichTextInstr;
						if(self.config.actualInstr !== undefined && self.config.actualInstr != null && self.config.actualInstr != ''){
							if(self.config.actualInstr.length > 51){
								self.config.shortInstr = self.config.actualInstr.substring(0, 51) + '...';
								self.config.instructions = self.config.shortInstr;
							}else{
								self.config.shortInstr = self.config.actualInstr;
								self.config.instructions = self.config.shortInstr;
							}
						}
					}
					self.config.icon = 'SRTimeLineIcon';
					if (srdImage !== undefined && srdImage.length > 0) {
						if (srdImage[0].Value !== undefined) {
							self.config.image =getSFDocumentURL('',srdImage[0].Value);	
						}
					}
					if (rtfField !== undefined && rtfField.length > 0) {
						self.config.RTFDescription = rtfField[0].Value;
					}

					self.displayOptions.quantity = 1;
					if (self.config.action != 'NEW' && quantity !== undefined & quantity.length > 0) {
						self.displayOptions.quantity = quantity[0].Value;
					}

					if (srdPrice !== undefined && srdPrice.length > 0){
						var unitPrice = srdPrice[0].Value;
						self.config.price = unitPrice;
						var currencyType = self.decodeText(userModel.userCurrency);
						if(currencyType !== null && currencyType !== ''){
							self.config.price += ' '+currencyType;
							self.config.currencyType = currencyType;
		                } 
		                var priceField1 = $filter('filter')(fields, {Name : 'Price1'});
		                var priceField2 = $filter('filter')(fields, {Name : 'Price2'});
		                if(priceField1 !== undefined && priceField1.length > 0){
		                	self.config.price += ' / '+priceField1[0].Value;
		                }
		                if(priceField2 !== undefined && priceField2.length > 0){
		                	self.config.price += ' / '+priceField2[0].Value;
		                }
		                srdPrice[0].Value = self.config.price;
		                self.config.totalPrice = self.config.price.split('/')[0];
						self.config.priceLocalized = self.config.price;
						self.displayOptions.totalPriceLocalized = unitPrice * self.displayOptions.quantity + ' ' + currencyType;
						if(userModel.enableLocaleNumberFormat){
							self.config.priceLocalized = self.config.priceLocalized.replace('.', userModel.localeDecimalSeparator);
							self.displayOptions.totalPriceLocalized = self.displayOptions.totalPriceLocalized.toString().replace('.', userModel.localeDecimalSeparator);
						}
		                if (action == 'VIEW') {
		                	fields.splice( self.getIndexOf(fields,'customerPrice','Name') + 1,0, 
							{ Editable: false, 
								Label: 'Total Price ', 
								Name:"totalPrice", 
								Type:"textfield", 
								Value: (unitPrice * self.displayOptions.quantity) + ' ' + currencyType
							});
		                }
					}

					if(srdTurnaroundTime !== undefined && srdTurnaroundTime.length > 0) {
						if(srdTurnaroundTime[0].Value !== undefined) {
							var tr = srdTurnaroundTime[0].Value;
							var dayTime= parseInt(tr/24);
							var hourTime = tr%24;
							if(dayTime>0 && hourTime>0){
								self.config.turnaroundTime = dayTime+' '+ selfServiceLabels.days +','+' '+hourTime+' '+selfServiceLabels.hours;
							}else if(dayTime>0 && hourTime<=0){
								self.config.turnaroundTime = dayTime+' '+selfServiceLabels.days;
							}else if(dayTime<=0 && hourTime>0){
								self.config.turnaroundTime = hourTime+' '+selfServiceLabels.hours;
							}
							srdTurnaroundTime[0].Value = self.config.turnaroundTime;
						}
					}
					
				};
				
				self.processSRDQuestions = function (data) {
					var srdHash = {},
						questionsHash = {},
						srds = [],
						questions = [],
						options = [],
						actions = [],
						questionMap = [],
						questionConditionMap = [];

					_.each(data, function (dataItem) {
						if (dataItem.dataSourceName == 'ServiceRequestDefinition' || dataItem.dataSourceName == 'SummaryDefinition') {
							srds = dataItem.items;
						} else if (dataItem.dataSourceName == 'ServiceRequestDefinitionQuestionText'
							|| dataItem.dataSourceName == 'ServiceRequestDefinitionQuestionChoice'
							|| dataItem.dataSourceName == 'ServiceRequestDefinitionQuestionNumber'
							|| dataItem.dataSourceName == 'ServiceRequestDefinitionQuestionDate') {
							questions = questions.concat(dataItem.items);
						} else if (dataItem.dataSourceName == 'ServiceRequestDefinitionQuestionChoiceOption') {
							options = dataItem.items;
						} else if (dataItem.dataSourceName == 'ServiceRequestDefinitionQuestionMap') {
							questionMap = dataItem.items;
						} else if (dataItem.dataSourceName == 'ServiceRequestDefinitionQuestionConditionMap') {
							questionConditionMap = dataItem.items;
						} else if (dataItem.dataSourceName == 'ServiceRequestDefinitionActions') {
							actions = dataItem.items;
						}
					});

					// processing srds
					processSrds(srds, srdHash);

					// processing questions
					processQuestions(questions, questionsHash);

					// processing options (radio, checkbox and list options)
					processOptions(options, questionsHash);

					// processing questions mapping
					processQuestionsMapping(questionMap, srdHash, questionsHash);

					// processing conditional questions mapping
					processQuestionConditionalMapping(questionConditionMap, questionMap, questionsHash, srds, srdHash);

					// processing related question
					processRelatedQuestions(questionsHash);

					// processing srd actions
					processSrdActions(srdHash, questionsHash, actions);
				};

				var processRelatedQuestions = function (questionsHash) {
					_.each(questionsHash, function (question) {
						if (question.format == 6) {
							if (question.relatedQuestions !== ""
								&& question.relatedQuestions !== null
								&& typeof question.relatedQuestions !== "undefined") {
								var relatedQuestionIds = question.relatedQuestions.split("|");
								_.each(relatedQuestionIds, function (id, index) {
									if (question.id !== id) {
										//Check if question exists in the questionHash
										if (questionsHash[relatedQuestionIds[index]]) {
											questionsHash[relatedQuestionIds[index]].affectedQuestionIds.push(question.id);
										}
									}
								});
							}
						}
					});
				};

				self.processDynamicQuestions = function (srd) {
					_.each(srd.questions, function (question) {
						if (question.visibility) {
							if (question.format == 5 || question.format == 6) {
								self.processDynamicQuestion(srd, question);
							}
						}
					});
				};

				
				self.processDynamicQuestion = function (srd, question) {
					var params = [srd.id, question.id];
					if (question.format == 6) {
						params = [srd.id, question.id, srd.questions, question.relatedQuestions];
					}
					question.dynamicOptionAreLoading = true;
					self.getDynamicOptionsByIds(params)
						.then(function (options) {
							question.options = options;
						})
						['finally'](function () {
							question.dynamicOptionAreLoading = false;
						});
				};


				self.refreshDynamicQuestionOptions = function (affectedQuestionId, srd) {
					_.each(srd.questions, function (question) {
						if (question.id === affectedQuestionId) {
							var params = [srd.id, question.id, srd.questions, question.relatedQuestions];
							question.dynamicOptionAreLoading = true;
							self.getDynamicOptionsByIds(params)
								.then(function (options) {
									question.options = options;
									// Reset the answer
									if (question.answer !== "") {
										question.answer = "";
										// Refresh the affected/dependent questions
										if (question.affectedQuestionIds && question.affectedQuestionIds.length > 0) {
											_.each(question.affectedQuestionIds, function (affectedQuestionId) {
												self.refreshDynamicQuestionOptions(affectedQuestionId, srd);
											});
										}
									}
								})
								['finally'](function () {
									question.dynamicOptionAreLoading = false;
								});
						}
					});

				};

				self.processCrossLaunchUrl = function (srd) {
					srd.crossLaunchUrl = angular.restPrefix + 'rest/v2/service_request_definition/' + srd.id + '/cross_launch';
				};
				
				self.decodeLinksWithSpecialChar = function(str){
					var urlString = str.match(/(http[^\s]+)/g);
					var TokenToReplace = "##Token_To_ReplaceLinks##";
					var strValue = str.replace(/(http[^\s]+)/g, TokenToReplace);
					strValue = self.htmlUnescape(unescape(strValue));
					if(urlString != null && urlString.length > 0){
						for(var i =0; i<urlString.length;i++){
							strValue = strValue.replace(TokenToReplace, self.htmlURLUnescape(urlString[i]));
						}
					}
					return strValue;
				};
				self.decodeText = function(str){
					if(str){
						if(typeof str == 'string'){
							return self.decodeLinksWithSpecialChar(str);
						}else
							return self.htmlUnescape(unescape(str));
					}else{
						return '';
					}
                };
                
                self.decodeField = function(obj){
					if(obj.Type !== undefined && obj.Type != null && obj.Type == "hyperlink"){
						for(i=0;i<obj.Text.length;i++){ 
							obj.Text[i] = self.htmlUnescape(unescape(obj.Text[i]));
						}
					}
                	else if(obj.Text !== undefined && obj.Text != null && obj.Text != ''){
                		obj.Text = self.htmlUnescape(unescape(obj.Text));//RemedyForceHTMLProcessor.htmlDecoder(obj.Text);
                	}
                	if(obj.Type !== undefined && obj.Type != null && obj.Type != ''){
	                	if ((obj.Type.toLowerCase() == 'multipicklist' || obj.Type.toLowerCase() == 'picklist') && obj.MultiSelect) {
	                		if (obj.Value != null && typeof(obj.Value) != 'undefined') {
		                		if (typeof(obj.Value) == 'string')
		                			obj.Value = self.htmlUnescape(unescape(obj.Value));//RemedyForceHTMLProcessor.htmlDecoder(obj.Value);
		                		else {
		                			if (obj.Value && obj.Value.length) {
			                			var i = 0;
			                			for(i = 0; i < obj.Value.length; i++){
			                				if(obj.Value[i] !== undefined && obj.Value[i] != null && obj.Value[i] != ''){
			                					obj.Value[i] = self.htmlUnescape(unescape(obj.Value[i]));//RemedyForceHTMLProcessor.htmlDecoder(obj.Values[i].Text);
			                				}
			                			}
			                		}
		                		}
	                		}
	                	} else if(obj.Type.toLowerCase() != 'double' && obj.Type.toLowerCase() != 'number' && obj.Type.toLowerCase() != 'integer' && obj.Type.toLowerCase() != 'currency' && obj.Type.toLowerCase() != 'percent' && obj.Type.toLowerCase() != 'boolean' && obj.Type.toLowerCase() != 'checkbox' && obj.Value !== undefined && obj.Value != null && obj.Value != ''){
	                		obj.Value = self.htmlUnescape(unescape(obj.Value));//RemedyForceHTMLProcessor.htmlDecoder(obj.Value);
							if(obj.fRefFieldVal)
								obj.fRefFieldVal = self.htmlUnescape(unescape(obj.fRefFieldVal));
	                	}
	                }
                	if(obj.Values !== undefined && obj.Values != null && obj.Values.length > 0){
                		var i = 0;
                		for(i = 0; i < obj.Values.length; i++){
                			if(obj.Values[i].Text !== undefined && obj.Values[i].Text != null && obj.Values[i].Text != ''){
                				obj.Values[i].Text = self.htmlUnescape(unescape(obj.Values[i].Text));//RemedyForceHTMLProcessor.htmlDecoder(obj.Values[i].Text);
                			}
                			if(obj.Values[i].Value !== undefined && obj.Values[i].Value != null && obj.Values[i].Value != ''){
                				obj.Values[i].Value = self.htmlUnescape(unescape(obj.Values[i].Value));//RemedyForceHTMLProcessor.htmlDecoder(obj.Values[i].Value);
                			}
                		}
                	}
                	if(obj.depValues !== undefined && obj.depValues != null){
                		var i = 0;
            			angular.forEach(obj.depValues, function(valueObject, key){
            				for(i = 0; i < valueObject.length; i++){
	                			if(valueObject[i].Text !== undefined && valueObject[i].Text != null && valueObject[i].Text != ''){
	                				valueObject[i].Text = self.htmlUnescape(unescape(valueObject[i].Text));//RemedyForceHTMLProcessor.htmlDecoder(obj.Values[i].Text);
	                			}
	                			if(valueObject[i].Value !== undefined && valueObject[i].Value != null && valueObject[i].Value != ''){
	                				valueObject[i].Value = self.htmlUnescape(unescape(valueObject[i].Value));//RemedyForceHTMLProcessor.htmlDecoder(obj.Values[i].Value);
	                			}
	                		}
	                	});
                	}
                	if(obj.Label !== undefined && obj.Label != null && obj.Label != ''){
                		obj.Label = self.htmlUnescape(unescape(obj.Label));//RemedyForceHTMLProcessor.htmlDecoder(obj.Label);
                	}
                	
                	if(obj.InlineHelp !== undefined && obj.InlineHelp != null && obj.InlineHelp != ''){
                		obj.InlineHelp = self.htmlUnescape(unescape(obj.InlineHelp));//RemedyForceHTMLProcessor.htmlDecoder(obj.InlineHelp);
                	}
					if(obj.Tooltip){
                		obj.Tooltip = self.htmlUnescape(unescape(obj.Tooltip));
                	}
                	if(obj.myConditions){
                	 angular.forEach(obj.myConditions, function (condition) {
                	   condition.Value = self.htmlUnescape(condition.Value);
                	 });
                	}
                	if(obj.URL){
                		obj.URL = self.htmlUnescape(obj.URL);
                	}
                }
                
                self.htmlUnescape = function(str){
                	if(typeof(str) != 'undefined' && str != null && str != ''){
				    	str = str.replace(/&quot;/g, '"');
				    	str = str.replace(/&#39;/g, "'");
				    	str = str.replace(/&lt;/g, '<');
				    	str = str.replace(/&gt;/g, '>');
				    	str = str.replace(/&amp;/g, '&');
						str = str.replace(/%2F/g, '/');
						str = str.replace(/&nbsp;/g, ' ');
				        return str;
				    }else{
				    	return '';
				    }
                }
				
				self.htmlURLUnescape = function(str){
                	if(typeof(str) != 'undefined' && str != null && str != ''){
				    	str = str.replace(/&quot;/g, '"');
				    	str = str.replace(/&#39;/g, "'");
				    	str = str.replace(/&lt;/g, '<');
				    	str = str.replace(/&gt;/g, '>');
				        return str;
				    }else{
				    	return '';
				    }
                }

				self.dataLoading = false;
				self.isSrCreating = false;
				self.srCreatedSuccess = false;
				
				
				self.onCategorySelectionChange = function () {
					if ($state.params.categoryId) {
						self.categoriesOrSrds = self.allCategories;
					} else {
						self.selectedCategory = null;
						self.categoriesOrSrds = self.topLevelCategories;
					}
					if($state.params.categoryId){
						self.selectedCategory = $state.params.categoryId;

						self.dataLoading = true;
						self.categoriesOrSrds = [];
						var parentCategoryId;
						if ($state.params.parentCategoryId && $state.params.parentCategoryId !== "0") {
							parentCategoryId = $state.params.parentCategoryId;
						}
						buildChildCategories(self.selectedCategory, parentCategoryId);
					}	
				};

			self.getBrowseCategories = function(categoryId, parentCategoryId){
				var deferred = $q.defer();
				var decodedCategoryId = self.decodeText(categoryId);
				var decodedParentCategoryId = self.decodeText(parentCategoryId);
				var categoryIdWithPId = decodedCategoryId;                              
				if (parentCategoryId) {                 
					categoryIdWithPId = decodedCategoryId + String.fromCharCode(172) + String.fromCharCode(172) + decodedParentCategoryId;
				}
				Visualforce.remoting.Manager.invokeAction(_RemotingActions.getCategoryServiceRequestDefinationMap, categoryIdWithPId,   function(result, event) {
					if(event.status){
						deferred.resolve(result);
						self.browseCategoryHash = {};
						_.each(result, function (srd) {
							self.allSrdHash[srd.id]=srd;
							if (!self.browseCategoryHash[categoryId]) {
								self.browseCategoryHash[categoryId] = [];
							}
							self.browseCategoryHash[categoryId].push(self.allSrdHash[srd.id]);
						});
					}else{
						deferred.reject();
					}
				});
				return deferred.promise;
			}

			self.getCategoryInfo = function(categoryId){
				var deferred = $q.defer();
				Visualforce.remoting.Manager.invokeAction(_RemotingActions.getCategoryInfo, categoryId,   function(result, event) {
					if(event.status){
						deferred.resolve(result);
						result = self.decodeText(result);
						self.categoryInfo = JSON.parse(result);
						self.directLinkBreadCrumbHash = {};
						
						if(self.categoryInfo && self.categoryInfo.length > 0){
							for(var i = 0; i < self.categoryInfo.length; i++){
								var categoryData = self.categoryInfo[i];
								if(categoryData){
									self.directLinkBreadCrumbHash[categoryData.id] = categoryData;
								}
							}
						}
					}else{
						deferred.reject();
					}
				});
				return deferred.promise;
			}

		     self.getSrds= function(categoryId, parentCategoryId){
				var deferred = $q.defer();
				var decodedCategoryId = self.decodeText(categoryId);
				var decodedParentCategoryId = self.decodeText(parentCategoryId);
				var categoryIdWithPId = decodedCategoryId;								
				if (parentCategoryId) {					
					categoryIdWithPId = decodedCategoryId + String.fromCharCode(172) + String.fromCharCode(172) + decodedParentCategoryId;
				}
				 Visualforce.remoting.Manager.invokeAction(_RemotingActions.getCategoryServiceRequestDefinationMap, categoryIdWithPId,   function(result, event) {
					 	if (event.status) {	
							  deferred.resolve(result);
							  self.srdInCache[categoryId]=true;
							  var isOneRecord = false;
							  var srdList= _.filter(result, function (srd) {
								return srd.serviceRequestDefinitionId != undefined;
							  });
							  if(srdList != undefined && srdList.length == 1){
							  	isOneRecord = true;
							  }	
							_.each(result, function (srd) {
							
								srd.descriptionData = {}; 
								srd.descriptionData.isSearch = false;
								self.categoriesDescMap[srd.categoryId] = srd.categoryDescription;
							    if (srd.categoryId) { // is it must category for srd?
									if (!self.srdHash[categoryId]) {
										self.srdHash[categoryId] = [];
									}
									if (srd.desc != undefined && srd.desc != '') {
										srd.descriptionData.value = (srd.isRTFDesc == 'true') ? self.htmlDecode(srd.desc) : srd.desc;
									}
									if (!self.parentCategoryHash[srd.id]) {
										self.parentCategoryHash[srd.id] = [];
									}								
									self.allSrdHash[srd.id]=srd;
									self.srdHash[categoryId].push(self.allSrdHash[srd.id]);
									//instaed of id service request denid
									if(srd.name)
										self.categoryHash[srd.id]=srd;
									srd.descriptionData.name = srd.name;
									srd.descriptionData.showDescriptionEllipses = true;
									srd.descriptionData.showToggle = undefined;
									if (isOneRecord && srd.serviceRequestDefinitionId != undefined)
										srd.descriptionData.descriptionClass = 'support-request__description';
									else {
										if (srd.isRTFDesc == 'true'){ 
											srd.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-maxheight';
										} else {
											srd.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-ellipsis-maxHeight';
										}
									}
									self.parentCategoryHash[srd.id] = self.categoryHash[categoryId];
								}
							});
						}else{
							deferred.reject();
						}
				 });
				 return deferred.promise;	
			}
				self.onSrdSelectionChange = function () {
					if (!$state.params.srdId) {
						self.selectedSRD = null;
					}
					if (self.categoriesOrSrds) {
						var filteredSrds = _.filter(self.categoriesOrSrds, function (srd) {
							return srd.id == $state.params.srdId;
						});
						if (filteredSrds.length > 0) {
							self.selectedSRD = filteredSrds[0];
						}
					}
				};

				self.getQuickPickProblemCategoriesSuccessCallback = function (result) {
					self.quickPickProblemCategoriesCache = result;
					self.srdAndCategoriesIconsHash = {};
					_.each(self.quickPickProblemCategoriesCache[2].items, function (item) {
						self.srdAndCategoriesIconsHash[item.serviceRequestDefinitionId] = item.calculatedIcon;
					});
					_.each(self.quickPickProblemSrds, function (srd) {
						setSrdIcon(srd);
					});
					self.quickPickSrds = self.quickPickProblemSrds;
					self.dataLoading = false;
				};

				self.getQuickPickOtherCategoriesSuccessCallback = function (result) {
					self.quickPickOtherCategoriesCache = result;
					self.srdAndCategoriesIconsHash = {};
					_.each(self.quickPickOtherCategoriesCache[2].items, function (item) {
						self.srdAndCategoriesIconsHash[item.serviceRequestDefinitionId] = item.calculatedIcon;
					});
					_.each(self.quickPickOtherSrds, function (srd) {
						setSrdIcon(srd);
					});
					self.quickPickSrds = self.quickPickOtherSrds;
					self.dataLoading = false;
				};

				self.getQuickPickProblemSRDsSuccessCallback = function (result) {					
					self.quickPickProblemSrdsCache = result;					
					self.quickPickProblemSrds = filterQuickPickSrds(self.quickPickProblemSrdsCache);
					_.each(self.quickPickProblemSrds, self.processGeneralSrdInstructions);					
					self.getProblemCategories(self.getQuickPickProblemCategoriesSuccessCallback);
				};

				self.getQuickPickOtherSRDsSuccessCallback = function (result) {
					self.quickPickOtherSrdsCache = result;
					self.quickPickOtherSrds = filterQuickPickSrds(self.quickPickOtherSrdsCache);
					_.each(self.quickPickOtherSrds, self.processGeneralSrdInstructions);
					self.getOtherCategories(self.getQuickPickOtherCategoriesSuccessCallback);
				};

				self.getAllSrdCategoriesSuccessCallback = function (result) {
					processAllSrdCategoriesData(result);
					self.onCategorySelectionChange(); 
					self.dataLoading = false;
				};

				self.getSrdSettingsSuccessCallback = function (result) {
					self.rawSrdSettingsCache = result;
					if (result && result[0] && result[0].items && result[0].items[0]) {
						self.srdSettings = result[0].items[0];
						var incidentSrdId = self.srdSettings.defaultIncidentSRDId,
							requestSrdId = self.srdSettings.defaultRequestSRDId;
						self.srdSettings.quickRequestEnabled = requestSrdId && requestSrdId !== '0';
						self.srdSettings.quickIncidentEnabled = incidentSrdId && incidentSrdId !== '0';
						// "0" == true, but we don't want it...
						if (self.srdSettings.defaultSRDId && self.srdSettings.defaultSRDId === '0') {
							self.srdSettings.defaultSRDId = null;
						}
					} else {
						self.srdSettings = {
							defaultSRDId: null,
							defaultIncidentSRDId: null,
							defaultRequestSRDId: null,
							defaultRequestSRDMaxChars: 0,
							defaultIncidentSRDMaxChars: 0
						};
					}
				};

				self.getProblemSRDsByCategoryId = function (categoryId) {
					var buildProblemSRDsByCategoryIdParameters = function (categoryId) {
							return $.extend({
								queryName: 'MYIT_ALL_PROBLEM_SRDS_BY_CATEGORY_ID',
								queryParameters: [
									{ name: 'categoryId', value: categoryId },
									{ name: 'supportAIF', value: true },
									{ name: 'loadQuestions', value: 0 }
								]
							}, baseParams);
						},
						failCallback = function () {
							$log.error('Error while getting problem service requests by category');
						};

					return getCachedServerData(
						self.srdAndCategoriesHashCache.problem[categoryId],
						getProblemSRDsByCategorySuccessCallback,
						failCallback);
				};

				self.getOtherSRDsByCategoryId = function (categoryId) {
					var buildOtherSRDsByCategoryIdParameters = function (categoryId) {
							return $.extend({
								queryName: 'MYIT_ALL_OTHER_SRDS_BY_CATEGORY_ID',
								queryParameters: [
									{ name: 'categoryId', value: categoryId },
									{ name: 'supportAIF', value: true },
									{ name: 'loadQuestions', value: 0 }
								]
							}, baseParams);
						},
						failCallback = function () {
							$log.error('Error while getting other service requests by category');
						};

					return getCachedServerData(
						supportService.post,
						buildOtherSRDsByCategoryIdParameters(categoryId),
						self.srdAndCategoriesHashCache.other[categoryId],
						getOtherSRDsByCategorySuccessCallback,
						failCallback);
				};

				self.getQuickPickProblemSRDs = function () {
					var	failCallback = function () {
							$log.error('Error while getting problem quick pick service requests');
						};

					return getCachedServerData(
						self.quickPickProblemSrdsCache,
						self.getQuickPickProblemSRDsSuccessCallback,
						failCallback);
				};

				self.getQuickPickOtherSRDs = function () {
					var	failCallback = function () {
							$log.error('Error while getting other quick pick service requests');
						};

					return getCachedTicketData(
						self.quickPickOtherSrdsCache,
						self.getQuickPickOtherSRDsSuccessCallback,
						failCallback);
				};

				self.getProblemCategories = function (successCallback) {
						var failCallback = function () {
							$log.error('Error while getting problem service requests categories');
						};

					return getCachedServerData(					
						self.quickPickProblemCategoriesCache,
						successCallback,
						failCallback);
				};

				self.getOtherCategories = function (successCallback) {
						var failCallback = function () {
							$log.error('Error while getting other service requests categories');
						};
					return getCachedTicketData(
						self.quickPickOtherSrdsCache,
						successCallback,
						failCallback);
				};

				self.getSrdSettings = function () {
					var params = {
							queryName: 'MYIT_SRD_SETTINGS',
							attributes: {
								ServiceRequestDefinitionSettings: [
									"id",
									"defaultSRDId",
									"defaultIncidentSRDId",
									"defaultRequestSRDId",
									"defaultRequestSRDMaxChars",
									"defaultIncidentSRDMaxChars",
									"maxFileSize"
								]
							}
						},
						failCallback = function () {
							$log.error('Error while getting srd settings');
						};

					return getCachedServerData(
						supportService.post,
						params,
						self.rawSrdSettingsCache,
						self.getSrdSettingsSuccessCallback,
						failCallback
					);
				};

				self.createAttachments = function (id, attachments, notes) {
				promises = [];
				var lightningPromise=[];
					if(attachments !== undefined && attachments !== null && attachments.length > 0){
						$.each(attachments, function (index, attachment) {
							var deferred = $q.defer();
							promises.push(deferred.promise);
							if (isFileEnabled){
								var contentDocumentId;				
								client.createBlob('ContentVersion', {
										PathOnClient: attachment.name,
										Title: attachment.name		              
							        	}, attachment.name, 'VersionData', attachment, 
							        	function(result, source){
							        	  	var versionRecord = sforce.connection.query("SELECT id, ContentDocumentId FROM ContentVersion WHERE Id ='" + result.id + "' LIMIT 1");
											var records = versionRecord.getArray("records");
											var documentLink = new sforce.SObject('ContentDocumentLink'); 
											contentDocumentId = records[0].ContentDocumentId;
											documentLink.ContentDocumentId = contentDocumentId; 
											documentLink.LinkedEntityId = id;
											documentLink.ShareType = 'V';
											sforce.connection.create([documentLink], {
												onSuccess: function(result, source) {
													result[0].contentDocumentId = contentDocumentId;
													lightningPromise.push('AttachmentInserted');
													if(lightningModule=='createInc' && lightningPromise.length>0 && lightningPromise.length==attachments.length){
														var response = {
																message: "Close_After_Save",
																component: cmpId,
																ticket: notes										
															};
														parent.postMessage(response, lexOpenerURL);														
													}	
													return deferred.resolve(result);
												},
												onFailure: function(error, source) {
													return deferred.reject();
												}
											});
								        },
										function(error, source){
											return deferred.reject(error);
										}
								);
							} else {
								client.createBlob('Attachment', {						
									Name: attachment.name,
									ContentType : attachment.type,
									ParentId : id
					        		}, attachment.name, 'Body', attachment, 
					        		function(result, source) {
					        			if (result.success == true) {
					        				lightningPromise.push('AttachmentInserted');
											if(lightningModule=='createInc' && lightningPromise.length>0 && lightningPromise.length==attachments.length){
												var response = {
														message: "Close_After_Save",
														component: cmpId,
														ticket: notes										
													};
												parent.postMessage(response, lexOpenerURL);														
											}	
											deferred.resolve();
										} else {
											deferred.reject();
										}
									},
									function(error, source) {
										deferred.reject(error);
									}
								);
							}
						});
					}
					if(lightningModule=='createInc' && lightningPromise.length>0 && lightningPromise.length==attachments.length){
						return promises;
					}else if(lightningModule!='createInc'){
						return promises;
					}
					
				};


				var openSuccessSRCreatedConfirmationModal = function (ticketNo) {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');					
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/create-sr-modal-success.html',
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
				
				var openSuccessTicketCreatedConfirmationModal = function (ticketNo) {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
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


				var openSRCreatedWithErrorConfirmationModal = function () {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/create-sr-modal-with-error.html',
						ariaLabelledBy:'modal-header__title',
						ariaDescribedBy: 'modal-header__text',
						controller: ['$scope',
							function ($scope) {
								$scope.errorMessage = selfServiceLabels.attachmentUploadError;
							}
						]
					});
				};
				var openTicketError = function () {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/create-sr-modal-with-error-ticket.html',
						ariaLabelledBy:'modal-header__title',
						ariaDescribedBy: 'modal-header__text',
						controller: ['$scope',
							function ($scope) {
								$scope.errorMessage = selfServiceLabels.recordError;
							}
						]
					});
				};
				var openSRError = function (errorMsg) {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/create-sr-modal-with-error-sr.html',
						ariaLabelledBy:'modal-header__title',
						ariaDescribedBy: 'modal-header__text',
						controller: ['$scope',
							function ($scope) {
								if(errorMsg){
									$scope.errorMessage = selfServiceLabels.recordError+'<br/>'+self.htmlDecode(errorMsg).replace('</li>',' ').replace('<li>',' ');
								}									
								else
									$scope.errorMessage = selfServiceLabels.recordError;
							}
						]
					});
				};
				var openTicketCreatedWithErrorConfirmationModal = function () {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/create-ticket-modal-with-error.html',
						ariaLabelledBy:'modal-header__title',
						ariaDescribedBy: 'modal-header__text',
						controller: ['$scope',
							function ($scope) {
								$scope.errorMessage = selfServiceLabels.attachmentUploadError;
							}
						]
					});
				};

				var ticketCreatedWithAttachmentError = function (errorMessage) {
					self.isSrCreating = false;
					self.dataLoading = false;
					
					var error={
						text : errorMessage,
						hide : "5000"
					};
					errorModel.clearAllErrors();
					error.text = self.htmlDecode(error.text);
					errorModel.addModalError(error);
				};


				var srCreationSuccessCallback = function (result/*, SRD, appZoneProduct*/) {
					var isLastSrd = self.remainingSrdCount == 1;
					var activityLog;
					if(!result || !result.success){						
						var error={
							text :result.error,
							hide : "5000"
						};
						errorModel.clearAllErrors();
						error.text = self.htmlDecode(error.text);
						errorModel.addModalError(error);
						self.isSrCreating = false;
						self.dataLoading = false;
						return;
					}
					$q.all(self.createAttachments(result.data.id, self.attachmentData.attachments))
						.then(function () {
							if (isLastSrd && self.modalInstance === self.srCreatingModalInstance) {
								openSuccessSRCreatedConfirmationModal(result.Name);
							}
						})
						['catch'](function () {
							if (isLastSrd && self.modalInstance === self.srCreatingModalInstance) {
								openSRCreatedWithErrorConfirmationModal();
							}
						})
						['finally'](function () {
							if (isLastSrd) {
								if (self.modalInstance === self.srCreatingModalInstance) {
									self.modalInstance && self.modalInstance.close(result);
								}
								delete self.srCreatingModalInstance;
							}
							self.isSrCreating = false;
						});
					if (self.remainingSrdCount) {
						self.remainingSrdCount--;
					}
				};

				
				var incidentCreationSuccessCallback = function (result, attachmentsLength) {
					var activityLog;
					if(!result || !result.Id){
						//clear all error
						var error={
							text : result.errorMessage,
							hide : "5000"
						};
						errorModel.clearAllErrors();
						error.text = self.htmlDecode(error.text);
						errorModel.addModalError(error);
						self.isSrCreating = false;
						return;
					}
					
					if(self.smartSuggestionsData && self.smartSuggestionsData.isSuggestionsOpen==true){
						self.smartSuggestionsData.isSuggestionsOpen = false;
						self.smartSuggestionsData.clearSearchString = true;
					}
					
					if ( self.modalInstance === self.srCreatingModalInstance) {
						$q.all(self.createAttachments(result.Id, self.incident.attachments))
						.then(function () {
							if (lightningModule=='createInc'){
									if(attachmentsLength>0){
										return;
									}
									else{
										var response = {
														message: "Close_After_Save",
														component: cmpId,
														ticket: result.Name										
													};
										parent.postMessage(response, lexOpenerURL);
										return;
									}
									
								}
							if ( self.modalInstance === self.srCreatingModalInstance) {
								self.incident={};
								openSuccessTicketCreatedConfirmationModal(result.Name);
							}
						})
						['catch'](function () {
							if ( self.modalInstance === self.srCreatingModalInstance) {
								openTicketCreatedWithErrorConfirmationModal();
							}
						})
						['finally'](function () {
							if(lightningModule!='createInc'){
									$rootScope.$emit("refreshActivityStream", {});
									if (self.modalInstance === self.srCreatingModalInstance) {
										self.modalInstance && self.modalInstance.close(result);
									}
									delete self.srCreatingModalInstance;							
									self.isSrCreating = false;							
							}
													
							errorModel.clearAllErrors();							
						});
					}	
					
					
				};
				
				var srCreationFailCallback = function (response) {
					self.isSrCreating = false;
					self.baseElementId = '';
					self.baseElementName = '';
					if (self.modalInstance === self.srCreatingModalInstance) {
						var error = processSrCreationErrorResponse(response);
						self.displayExceptionMessage(selfServiceLabels.errorPopupHeader,error.i18nKey);
						//errorModel.addModalError(error);
					}

					delete self.srCreatingModalInstance;
				};
				function getNormalizedVal(val){
					return ((val<9)?(val<0?'-0'+(-val):'0'+val):val)
				}

				/**
				 * Process error response from server
				 * @param response AJAX response object
				 * @returns {Object} Error config object for <code>errorModel</code>
				 */
				function processSrCreationErrorResponse(response) {
					var error = {};

					if (response && response.data && response.data.defaultMessage) {
						error.multiline = true;
						// to clean response.data.defaultMessage from unwanted HTML except for <br/>,
						// DOM element's textContent will be used
						error.html = angular.element('<div>' + response.data.defaultMessage.replace(/<br\s*?\/?>/g, '\\n') + '</div>').text().replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')
							.replace(/\\n/g, '<br />');					   
					} else {
						error.i18nKey = selfServiceLabels.serverError;
					}
					return error;
				}


				var generateUUID = function () {
					var time = new Date().getTime();
					return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
						var r = (time + Math.random() * 16) % 16 | 0;
						time = Math.floor(time / 16);
						return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
					});
				};

				var processTimeAnswer = function (value, date) {
					if (value) {
						var result = moment(value);
						if (date) {
							result = moment(date)
								.hour(result.hour())
								.minute(result.minute());
						}
						return result.unix();
					}
					return null;
				};

				/**
				* Verify if the question is active and not question under
				* conditional question that is not active at the moment.
				**/
				var isQuestionActive = function(question, questions) {
					// Get the parentQuestion
					var parentQuestion = _.findWhere(questions, {id: question.parentId});
					
					if(parentQuestion) {
						//TODO: Refactor as this is a duplicated from matchCondition function.
						if (parentQuestion.format === 1 || parentQuestion.format === 4) {
							var cValues = question.conditionValues.split(';');
							return $.inArray(parentQuestion.answer, cValues) > -1;
						} else if (parentQuestion.format === 2 && parentQuestion.answer) {
							return parentQuestion.answer.sort().join(';') === question.conditionValues.split(';').sort().join(';');
						}
					} else { //If parent is not present, that means it is the top level question
						return true;
					}
				};
				
				var processAnswers = function (srdQuestions) {
					var answers = [],
						answeredQuestions = _.filter(srdQuestions, function (question) {
							if(question.format == 2)
								return true;							
							return question.hasAnswer && isQuestionActive(question, srdQuestions);
						});

					_.each(answeredQuestions, function (question, index) {
						var answer = processAnswer(question);
						
						answers[index] = {
							QuestionId: question.id,
							Values: [answer + ''],
							Order: question.orderIndex
						};
					});
					return answers;
				};
				
				var processAnswersForAction = function (questions) {
					var answers = [];
					
					_.each(questions, function (question, index) {
						var answer = processAnswer(question);
						
						answers[index] = {
							questionId: question.id,
							value: answer + ''
						};
					});
					return answers;
				};
				
				var processAnswer = function (question) {
					var answer = question.answer;
					// special case for multiple answer values
					if (angular.isArray(question.answer)) {
						answer = question.answer.join(';');
					}
					if (question.format == 7) {
						answer = processTimeAnswer(question.answer.time, question.answer.date);
						answer=moment.unix(answer).format('YYYY-MM-DD HH:mm:ss');
					}
					if (question.format == 8) {											
						 answer=moment(answer).format('YYYY-MM-DD');
						
					}
					if (question.format == 9) {
						answer = processTimeAnswer(question.answer);
					}

					if (angular.isUndefined(question.answer) || question.answer === null) {
						answer = "";
					}					
					if (question.format == 2) {	
						if(question.answer === true)
							question.answer = 'True';
						else
							question.answer = 'False';							
					}
					return answer;
				};
				self.processFormFields = function(srdQuestions){
					var isDynamicRenderingEnabled = false;
					if(typeof(userModel.LayoutFldsandCriteria) != 'undefined' && userModel.LayoutFldsandCriteria != null && (JSON.stringify(userModel.LayoutFldsandCriteria) != JSON.stringify({}))){
						isDynamicRenderingEnabled = true;
					}
					var incidentInfo={};
				    _.each(srdQuestions,function(field){						
						if(typeof field.Value != "undefined" &&  field.Value !== '' &&  field.Value != null){
							if(!isDynamicRenderingEnabled || (isDynamicRenderingEnabled && (field.isTemplateHiddenField || field.isVisible))){
								if (field.Type == "datetime") {	
									var delim = field.dateFormat.indexOf('/')==-1?'-':'/';
									var dt=self.stringToDateTime(field.Value,field.dateTimeFormat,delim);
									var dateArray=self.stringToDateTime(field.Value,field.dateTimeFormat,delim).split(' ');
									incidentInfo[field.id] = dateArray[0]+'T'+dateArray[1]+userModel.timeZoneOffset;
								}
								else if (field.Type == "date") {
									var delim = field.dateFormat.indexOf('/')==-1?'-':'/';
									incidentInfo[field.id] = self.stringToDate(field.Value,field.dateFormat,delim);
								} 
								else if ((field.Type == "multipicklist"  || field.Type == "picklist") && field.MultiSelect){
									var userInputValue = '';
									if(typeof field.Value != 'string'){
										if (field.Value != undefined || field.Value != null)
											incidentInfo[field.id] = field.Value.join(';');
										else 
											incidentInfo[field.id] = '';	
									}else{
										incidentInfo[field.id] = field.Value;
									}
								}else if (field.Type == "reference"){
									incidentInfo[field.id] = field.fvalue;
								} else if(field.Type.toLowerCase() == 'number'){
									if (field.Scale != undefined && field.Value != undefined && field.Value != 0) {
										if (field.Scale > 0) {
											field.Value = Math.round(field.Value * Math.pow(10, field.Scale)) / Math.pow(10, field.Scale);
										} else {
											field.Value = parseInt(field.Value);
										}
										incidentInfo[field.id] = field.Value;
									}  else {
										incidentInfo[field.id] = field.Value;
									}
								} else
									incidentInfo[field.id] = field.Value;
							}
						} else {
							if (field.Type.toLowerCase() == 'multipicklist' || field.Type.toLowerCase() == 'picklist')
								incidentInfo[field.id] = '';	
							else if (field.Type.toLowerCase() == 'date' || field.Type.toLowerCase() == 'datetime')
								incidentInfo[field.id] = null;	
							else 
								incidentInfo[field.id] = field.Value;
						}
					});
					return incidentInfo;
				};
				self.arrJunkAttRefIds = [];
				self.createIncident = function (srdQuestions, requestedFor) {					
					if(lightningModule=='createInc'){
						var incidentInfo = self.processFormFields(srdQuestions);
						self.isSrCreating = true;
						self.srCreatingModalInstance = self.modalInstance;
						self.remainingSrdCount = 1;
						var successCallbackWrapper = function (result, attachmentsLength) {
							incidentCreationSuccessCallback(result,attachmentsLength);
						};
						if(requestedFor != undefined && requestedFor.beId != undefined && !incidentInfo.hasOwnProperty(baseElementApiName.toLowerCase())) {
								incidentInfo[baseElementApiName] = requestedFor.beId;
						}
						createRemoteIncident(JSON.stringify(incidentInfo),requestedFor.userId, null).then(function(result){
							self.q.all(self.createAttachments(result.Id, self.attachmentData.attachments, result.Name));
							self.baseElementId = '';
							self.baseElementName = '';
							successCallbackWrapper(result,self.attachmentData.attachments.length);							
						})['catch'](srCreationFailCallback);
					} else {
						var boolAllAttachmentsUploaded = false;
						var idAttRefGen = '';
						
						createAttRefGenerator()
						.then(function(resultAttRef) {
							if(resultAttRef && resultAttRef[0] && resultAttRef[0].id)
								idAttRefGen = resultAttRef[0].id;
							
							return idAttRefGen;
						})['catch'](function() {})
						.then(function(idAttRefGen){
							if(idAttRefGen){
								return new Promise((resolve, reject) => {
									self.q.all(self.createAttachments(idAttRefGen, self.attachmentData.attachments, '')).then(function() {
										boolAllAttachmentsUploaded = true;
										resolve(boolAllAttachmentsUploaded);
									})['catch'](function(error) {
										var msg = JSON.parse(error.response);
										var errMsg = msg[0].message;
										self.arrJunkAttRefIds.push(idAttRefGen);
										ticketCreatedWithAttachmentError(errMsg);
									});
								})
							} else {
								return false;
							}
						})['catch'](function(){})
						.then(function(boolAllAttachmentsUploaded){
							if(boolAllAttachmentsUploaded || (self.attachmentData && self.attachmentData.attachments && self.attachmentData.attachments.length == 0)){
								var additionalInfo = {};
								additionalInfo.AttRefGeneratorID = '' + idAttRefGen;
								if(self.arrJunkAttRefIds.length > 0)
									additionalInfo.arrJunkAttRefGeneratorID = JSON.stringify(self.arrJunkAttRefIds);

								var incidentInfo = self.processFormFields(srdQuestions);
								self.isSrCreating = true;
								self.srCreatingModalInstance = self.modalInstance;
								self.remainingSrdCount = 1;
								var successCallbackWrapper = function (result, attachmentsLength) {
									incidentCreationSuccessCallback(result,attachmentsLength);
								};
								if(requestedFor != undefined && requestedFor.beId != undefined && !incidentInfo.hasOwnProperty(baseElementApiName.toLowerCase())) {
									incidentInfo[baseElementApiName] = requestedFor.beId;
								}
								createRemoteIncident(JSON.stringify(incidentInfo),requestedFor.userId, additionalInfo).then(function(result){
									self.baseElementId = '';
									self.baseElementName = '';
									self.arrJunkAttRefIds = [];
									successCallbackWrapper(result,self.attachmentData.attachments.length);
								})['catch'](srCreationFailCallback);
							}
						})['catch'](function() {
							srCreationFailCallback();
						});
					}
				};
				function createRemoteIncident(params,requestedFor, additionalInfo){
					var deferred = $q.defer();
					if(!requestedFor){
						requestedFor=userModel.userId;
					}
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.createIncident,params,requestedFor, additionalInfo,  function(result, event) {
							if (event.status) {																
								deferred.resolve(result);
								return result;
							}else{
								deferred.reject();
							}
						});	
						return deferred.promise;	
				}

				function createAttRefGenerator() {
					var deferred = $q.defer();

					if(self.attachmentData.attachments.length <= 0){
						deferred.resolve();
						return deferred.promise;
					}

					var refGenearator = new sforce.SObject(namespaceprefix+'__AttachmentRefGenerator__c'); 
					sforce.connection.create([refGenearator], {
						onSuccess : function(result, source) {
							if (result[0].getBoolean("success")) {
								deferred.resolve(result);
							} else {
								deferred.reject(result);
							}
							return result;
						},
						onFailure : function(error, source) {
							deferred.reject(error);
							return error;
						}
					});
					return deferred.promise;
				}

				self.createSR = function (isDraft,rdId){
					var promise = self.saveServiceRequest(isDraft,rdId);
					return promise;
				};
				self.CreateTempAttachment = function (){
					var deferred = $q.defer();
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.createAttachment, function(result, event) {
				        if (event.status) {																
							deferred.resolve(result);
							self.tempAttachmentId = result
							
						}else{
							deferred.reject();
						}
			       }); 
				return deferred.promise;
				};
				
				self.populateDependentField = function(ctrlFieldData) {
						if (self.TicketOrRequest.toLowerCase() == 'request') {
							if (self.srData.SRLeftRightPanelFields != "undefined" && self.srData.SRLeftRightPanelFields != null && self.srData.SRLeftRightPanelFields.fields != "undefined" && self.srData.SRLeftRightPanelFields.fields != null) {
								for (var j=0; j<self.srData.SRLeftRightPanelFields.fields.length; j++) {
									var questions = self.srData.SRLeftRightPanelFields.fields[j];

									for(var k = 0; k < questions.length; k++){
										var question = questions[k];
										if(question.Type.toLowerCase() == "blank")
											continue;
											
										for (i=0; i<ctrlFieldData.dependentFieldList.length; i++) {
											if (question.Name.toLowerCase() == ctrlFieldData.dependentFieldList[i].toLowerCase()) {
												question.Values = question.depValues[ctrlFieldData.Value];
												break;
											}
										}
									}
								}
							}
						} else {
							if (self.incident.questions != "undefined" && self.incident.questions != null) {
								for (i=0; i<ctrlFieldData.dependentFieldList.length; i++) {
									for (var j=0; j<self.incident.questions.length; j++) {
										var question = self.incident.questions[j];
										if (question.id.toLowerCase() == ctrlFieldData.dependentFieldList[i].toLowerCase()) {
											question.Values = question.depValues[ctrlFieldData.Value];
											break;
										}
									}
								}
							}
						}
					};
				
				self.convertDateToString = function(dateObj) {
					var retValue = '';
					if (Object.prototype.toString.call(dateObj) === '[object Date]' && !isNaN(dateObj)) {
						//Setting the data in the followign format yyyy-MM-dd HH:mm:ss
						retValue = dateObj.getFullYear() + '-' + 
								   (("0" + (dateObj.getMonth() + 1)).slice(-2)) + '-' + 
								   ("0" + dateObj.getDate()).slice(-2) + ' ' + 
								   ("0" + dateObj.getHours()).slice(-2) + ':' + 
								   ("0" + dateObj.getMinutes()).slice(-2) + ':' + 
								   ("0" + dateObj.getSeconds()).slice(-2);
					}
					return retValue;
				};
				self.getChatBotUrl	= function(){
									return supportService.getChatBotUrl();
				}
				self.formatDataBeforeSave = function(){
					var response = {};
					response.Fields = self.formatDisplayOptions();
					response.SRInputs = self.formatSRInputs();
					response.LRInputs = self.formatLRInputFields();
					
					return JSON.stringify(response);
				};
				
				self.formatDisplayOptions = function(){
					var Fields = [];
					var jsonObj = {};
					
					angular.forEach(self.srData.SRDisplayFields.fields, function(obj, index){
						jsonObj = {};
						jsonObj.Name = obj.Name;
						if(obj.Name != 'dateRequired' && obj.Name != 'quantity')
							jsonObj.Value = typeof obj.Value == 'undefined' ? '' : obj.Value.toString();
						else if(obj.Name == 'dateRequired'){
							var delim=obj.dateFormat.indexOf('/')==-1?'-':'/';
							jsonObj.Value = self.stringToDateTime(obj.Value,obj.dateTimeFormat,delim);
						}
						else
							jsonObj.Value = typeof self.displayOptions.quantity == 'undefined' ? '' : self.displayOptions.quantity.toString();
						Fields.push(jsonObj);
					});
					
					jsonObj = {};
					jsonObj.Name = 'clientId';
					jsonObj.Value = self.OnBehalfOf.fvalue;
					Fields.push(jsonObj);
					
					if(self.config.action == 'EDIT'){
						jsonObj = {};
						jsonObj.Name = 'serviceRequestId';
						jsonObj.Value = self.config.recordId;
						Fields.push(jsonObj);
						
						jsonObj = {};
						jsonObj.Name = 'requestDetailId';
						jsonObj.Value = self.srData.RequestDetailId;
						Fields.push(jsonObj);
						
					}
					return Fields;
				};
					
				self.formatLRInputFields = function(){
					var LRInputs = [];
					var jsonObj = {};
					
					angular.forEach(self.srData.SRLeftRightPanelFields.fields, function(Fields, key){
						angular.forEach(Fields, function(obj, key){
						jsonObj = {};
						jsonObj.fType = obj.Type;
						jsonObj.isUpdateable = obj.isUpdateable;
						var fValue = obj.Value;
						if(!obj.isFormula){
							if(obj.MultiSelect === true){
								var userInputValue = '';
								if(typeof obj.Value != 'undefined' && typeof obj.Value != 'string'){
									for(var index = 0; index < obj.Value.length; index++)
										userInputValue = userInputValue + ';' + obj.Value[index];
									fValue = userInputValue.slice(1,userInputValue.length);
								}
							}else if(obj.Type == 'lookup'){
								fValue = obj.fvalue;
								obj.Name = obj.fName;
							}
							else if(obj.Type == 'date'){
								try{
									var delim=obj.dateFormat.indexOf('/')==-1?'-':'/';
									fValue = self.stringToDate(obj.Value,obj.dateFormat,delim);
								}catch(e){
									if(self.isdraft)
									fValue = obj.Value;
								}
							}else if(obj.Type == 'date/time'){
								try{
									var delim=obj.dateFormat.indexOf('/')==-1?'-':'/';
									fValue = self.stringToDateTime(obj.Value,obj.dateTimeFormat,delim);
								}catch(e){
									if(self.isdraft)
										fValue = obj.Value;
								}
							} else if (obj.Type == 'number') {
								if (obj.scale != undefined && obj.Value != undefined && obj.Value != 0)
									if (obj.scale > 0) {
										obj.Value = Math.round(obj.Value * Math.pow(10, obj.scale)) / Math.pow(10, obj.scale);
									} else {
										obj.Value = parseInt(obj.Value);
									}
									fValue = obj.Value;
							}
							jsonObj.fValue = fValue;
							jsonObj.fApiName = obj.apiName;
							
							LRInputs.push(jsonObj);
						}
					});
					});

					
					
					return LRInputs;
				};
				
				self.formatSRInputs = function(){
					var SRInputs = [];
					var jsonObj = {};
					//array that stores user input as the first entry & stored value as the second entry.
					var Values = [];
					
					/* For select list, multi select list and radio buttons:
					 Text - user input the value which is displayed to the user
					 Value - value which is stored in the backend for the selected user input.*/
					angular.forEach(self.srData.SRInputs, function(obj, key){
						if(obj.isVisible){
							Values = [];
							jsonObj = {};
							jsonObj.QuestionId = key;
							
							if(obj.Type == 'lookup'){
								 if(obj.fName == 'User') {
			 	                        Values.push(obj.fEmail);
			 	                 }else {
									 Values.push(obj.fRefFieldVal);
								 }
								Values.push(obj.fvalue);
				            }else if(obj.Type == 'picklist'){
								if(obj.MultiSelect === true){
									var userInputValue = '';
									var userInputText = '';
									// iterate over user input to store it in a semicolon separated format if there are multiple values selected.
									if(typeof obj.Value != 'string'){
										userInputValue = obj.Value.join(';');
										//iterate over values of the multi-select list to populate the stored value in semicolon separated format.
										for( var j = 0; j < obj.Value.length; j++ ) {
											for(var i = 0; i < obj.Values.length; i++){
												if( obj.Value[j] == obj.Values[i].Value ){
													userInputText = userInputText + ';' + obj.Values[i].Text;
												}
											}								
										} 
									}else{
										userInputValue = obj.Value;
										//iterate over values of the multi-select list to populate the stored value in semicolon separated format.
										for(var i = 0; i < obj.Values.length; i++){
											if(userInputValue.indexOf(obj.Values[i].Value) != -1){
												userInputText = userInputText + ';' + obj.Values[i].Text;
												if(typeof obj.Value == 'string')
													break;
											}
										}
									}
									
									Values.push(userInputText.slice(1,userInputText.length));
									Values.push(userInputValue);
								}else{
									for(var k in obj.Values){
										if(obj.Values[k].Value == obj.Value){
											if(!obj.Value && obj.Values[k].Text == selfServiceLabels.none){
												Values.push('');
												Values.push('');		
											}else {
												Values.push(obj.Values[k].Text);
												Values.push(obj.Value);
											}
											break;
										}
									}
								}
							}else if(obj.Type == 'radiobutton'){
								for(var j in obj.Values){
									if(obj.Values[j].Value == obj.Value){
										Values.push(obj.Values[j].Text);
										Values.push(obj.Value);
										break;
									}
								}
							}else if(obj.Type == 'date'){
								try{
									var delim=obj.dateFormat.indexOf('/')==-1?'-':'/';
									Values.push(self.stringToDate(obj.Value,obj.dateFormat,delim));
								}catch(e){
									if(self.isDraft)
										Values.push(strValue);
								}
							}else if(obj.Type == 'date/time'){
								try{
									var delim=obj.dateFormat.indexOf('/')==-1?'-':'/';
									Values.push(self.stringToDateTime(obj.Value,obj.dateTimeFormat,delim));
								}catch(e){
									if(self.isDraft)
										Values.push(strValue);
								}
							} else if(obj.Type == 'checkbox'){
								if (typeof(obj.Value) != 'boolean') {
									obj.Value = false;
								}
								Values.push(obj.Value);
							} else if( obj.Type == 'richtextarea' ) {
								var strValue = obj.Value;
								if(typeof strValue != 'undefined' && strValue != ''){
									strValue = strValue.replace(/(\r\n|\n\r|\n|\r)/gm,""); 
									strValue = strValue.replace(/\<br\/\>/g, '<br>');
									strValue = strValue.replace(/\<br \/\>/g, '<br>');
								}
								Values.push(strValue);
							} else {
								Values.push(obj.Value);
							}
							
							jsonObj.Values = Values;
							SRInputs.push(jsonObj);
						}
					});
					
					return SRInputs;
				};
				
				self.stringToDateTime = function(_date,_format,_delimiter)
				{
					if(typeof(_date) != 'undefined' && _date != null && _date != ''){
						var formatLowerCase=_format.substr(0,_format.indexOf(' ')).toLowerCase();
						var timePartFormat=_format.substr(_format.indexOf(' ')+1);
						var formatItems=formatLowerCase.split(_delimiter);
						var datePart=_date.substr(0,_date.indexOf(' '));					
						var timePart=_date.substr(_date.indexOf(' ')+1);
						var dateItems=datePart.split(_delimiter);					
						var monthIndex=formatItems.indexOf("mm");
						var dayIndex=formatItems.indexOf("dd");
						var yearIndex=formatItems.indexOf("yyyy");
						var month=parseInt(dateItems[monthIndex]);
						month-=1;
						var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);	
						if(dateItems[yearIndex].length == 2){
							var currentDate = new Date();
							var century = (currentDate.getFullYear()).toString().substring(0,2);
							formatedDate =  new Date(parseInt(century+dateItems[yearIndex]),month,dateItems[dayIndex]);														
						}
						var formatedDate1= $filter('date')(formatedDate, 'yyyy-MM-dd')+' '+timePart;
						
						return moment(formatedDate1,'YYYY-MM-DD '+timePartFormat).format('YYYY-MM-DD HH:mm:ss');
					}else{
						return _date;
					}
				};
				
				self.stringToDate= function(_date,_format,_delimiter)
				{
					if(typeof(_date) != 'undefined' && _date != null && _date != ''){
						var formatLowerCase=_format.toLowerCase();
						var formatItems=formatLowerCase.split(_delimiter);
						var dateItems=_date.split(_delimiter);
						var monthIndex=formatItems.indexOf("mm");
						var dayIndex=formatItems.indexOf("dd");
						var yearIndex=formatItems.indexOf("yyyy");
						var month=parseInt(dateItems[monthIndex]);
						month-=1;
						var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
						if(dateItems[yearIndex].length == 2){
							var currentDate = new Date();
							var century = (currentDate.getFullYear()).toString().substring(0,2);
							formatedDate =  new Date(parseInt(century+dateItems[yearIndex]),month,dateItems[dayIndex]);														
						}
						return $filter('date')(formatedDate, 'yyyy-MM-dd');
					}else{
						return _date;
					}
				};
				
				self.saveServiceRequest = function(isDraft,rdId){
					self.config.submitted = true;
					var promise;
					if (!isDraft && (self.config.action != 'EDIT' && self.attachmentData.isAttachmentRequired && (!self.attachmentData.attachments || self.attachmentData.attachments.length === 0) && self.config.actionLabel === '')) {
						var error={
							text : selfServiceLabels.attachmentRequired,
							hide : "5000"
						};
						errorModel.clearAllErrors();
						error.text = self.htmlDecode(error.text);
						errorModel.addModalError(error);
					}else{ 
						self.dataLoading = true;
						var additionalParam = {
								id: self.config.recordId, 
								actionLabel: self.config.actionLabel 
							};
						if (self.config.actionLabel === '' || self.config.actionLabel == selfServiceLabels.change){
							additionalParam.srSaveData = self.formatDataBeforeSave();
						}

						if (self.config.action == 'EDIT') {
							additionalParam.isEdit = true;
							additionalParam.requestDetailId = self.srData.RequestDetailId;
						} else {
							additionalParam.isEdit = false;
						}
						additionalParam.isDraft = isDraft;
						additionalParam.requestDetailId = rdId;
						additionalParam.tempAttachmentId = self.tempAttachmentId;
						var filters = {
							viewBy: 'SELF',
							state: 'OPEN'
						};
						if (self.OnBehalfOf.fvalue !== '' && self.OnBehalfOf.fvalue != userId)
							filters.viewBy = 'OTHERS';
						if (self.config.actionLabel == selfServiceLabels.close)
							filters.state = 'CLOSED';
						var filter = [];
						Object.keys(filters).forEach(function (key) {
						    filter.push(key +'=' + filters[key]);
						});
						
						self.isSrCreating = true;
						self.srCreatingModalInstance = self.modalInstance;

						self.remainingSrdCount = 1;

						var successCallbackWrapper = function (result) {
							if(result.success == true){
								if(self.config.action == 'EDIT'){
									self.config.action = 'VIEW';
								}else{
									srCreationSuccessCallback(result);
								}
							}else{
								srCreationFailCallback(result);
							}
						};
						
						promise = supportService.createRemoteSR(additionalParam);			
					}	
					return promise;
				};
				
				
				
				
				self.createMultipleSRs = function (SRDs, requestedFor) {
					self.remainingSrdCount = SRDs.length;
					_.each(SRDs, function (srdData) {
						self.selectedSRD = srdData.srd;
						self.createSR(srdData.srd.id, srdData.srd.questions, requestedFor, srdData.product);
					});
				};

				self.setSearchedSrdIcon = function (item) {
					if (!item.icon) {
						if(item.name)
							item.icon  = 'assistant-categorySRD-storage';	
						else
							item.icon = 'assistant-categorySRD-form';
					}
				};

				self.processGeneralSrdInstructions = function (srd) {
					if (srd.instructions) {
						srd.instructionWithAllowedHtml = $filter('filterHtml')(srd.instructions);
					}
				};
				
				self.setUpToViewSubmittedSR = function(result){
					self.assignDataToModel(result);
				};
				
				self.onGetSrdByIdSuccessCallback = function (result) {
					self.assignDataToModel(result);
					self.dataLoading = false;
					self.isSrCreating = false;
				};
				self.onGetTicketSuccessCallback = function (result) {	
					_.each(result,function(question){
						if(typeof(question.id) != "undefined" && question.id != null && question.id != ''){
							question.apiName = question.id;
						}
						if((question.id.indexOf('incidentdescription__c') == -1) && (question.IsRequired == "false" || question.IsRequired == "False"))
							question.IsRequired = false;
						else
							question.IsRequired = true;
						if (question.Type == 'multipicklist' && question.Value != undefined && question.Value != null && question.Value != '') {
							question.Value = question.Value.split(';');
						} else if (question.Type == 'picklist') {
							question.addNoneInPicklist = ((question.IsRequired && (question.Value == '' || question.Value == undefined)) || (!question.IsRequired ));
						}
					});	
					self.attachmentData = {srId:'', 
											attachments:[], 
											isAttachmentRequired: false,
											canHaveAttachments: true,
											isAttachmentLoading: false
										};
						
					self.incident={
						'questions' :result,
						'attachments':[]
					};						
					self.dataLoading = false;
				};

				self.onGetSrdByIdFailCallback = function (text) {
					var error={
									text : text ? text : selfServiceLabels.ErrorLoadingFeedbackForm
								};
					errorModel.clearAllErrors();
					error.text = self.htmlDecode(error.text);
					errorModel.addModalError(error);
					$log.error('Error while getting SRD by ID');
					self.dataLoading = false;
				};
				self.onGetTicketByIdFailCallback = function () {
					self.attachmentData = {srId:'', 
											attachments:[], 
											isAttachmentRequired: false,
											canHaveAttachments: true
					};
					var error={
									text : selfServiceLabels.ErrorLoadingFeedbackForm
								};
					errorModel.clearAllErrors();
					error.text = self.htmlDecode(error.text);
					errorModel.addModalError(error);
					$log.error('Error while getting SRD by ID');
					self.dataLoading = false;
				};
				
				
				self.getIndexOf = function(arr, val, prop) {
				    for (var k = 0; k < arr.length; k++) {
				      if (arr[k][prop] === val) {
				        return k;
				      }
				    }
				    return false;
				};

				self.selectedFoundSRD = {};
			    self.getSRDById = function (srdId, reqDefId, action, additionalParam) {
					self.dataLoading = true;
						return supportService.getSRDById(srdId, reqDefId, action, additionalParam);//.then(formatSRD);
				};
				self.isActiveSRD = function(srdId){
					return supportService.isActiveSRD(srdId);
				};
				
				function formatSRD(result) {
							   var categoryid=result.CategoryId;
                               var questions=result.Questions;
							   var fields=result.Fields;
							   var conditions = result.Conditions;
							   var conditionalQuestionHash = {};
                               var srdList=[];
                               var questionMaplist=[];
							   var questionConditionalMaplist=[];
                               var questionTextList=[];
							   var questionTextHash={};
                               var questionChoiceList=[];
                               var questionChoiceOptions=[];
                               var srdIconImage;
							   
							   
								 
                               var srDef={
								   attachmentEnabled:true,
								   id:result.Id,
								   image: srdIconImage
                               };
							   
							   _.each(fields,function(field){       
								    if(field.Name== 'image')
										srdIconImage=field.Value;
									if(field.Name== 'title')
										srDef['title']=field.Value;
									if(field.Name== 'description')
										srDef['description']=field.Value;
								});
							   srDef['image']=srdIconImage;
                               srdList.push(srDef);
								 
							     
								_.each(conditions,function(condition){       
									var conditionalQuestion={
										id:condition.Id,
										parentQuestionId:condition.DependentQuestionId,
										questionConditionValues:condition.Value,
										questionnaireId:condition.QuestionId,
										serviceRequestDefinitionId:condition.SRDId		,
										operator:condition.Operator										
									}
									conditionalQuestionHash[condition.QuestionId]=conditionalQuestion;
									questionConditionalMaplist.push(conditionalQuestion);
								});
								
                                _.each(questions,function(question){       
									var parentQuetionId;
								    var conditionalQuestion=conditionalQuestionHash[question.Id];
									
									if(conditionalQuestion){
										parentQuetionId = conditionalQuestion.parentQuetionId;
									}else{
										parentQuetionId = null;
									}	
									
                                    var srdquestionmap={
										id:question.Id,
										questionId:question.Id,
										questionnaireId:question.Id,
										serviceRequestDefinitionId:result.Id,
										order:question.Order
                                    };
                                    questionMaplist.push(srdquestionmap);         
									
                                    var srdquestiontext={
										format:getmyItformat(question.Type),
										id:question.Id,
										isRequired:question.IsRequired,
										label:question.Text,
										parentId: parentQuetionId,
										isSrd:true,
										minValue: question.MinValue,
										maxValue: question.MaxValue,
										maxLength:question.MaxLength,
										isMultiSelect:question.MultiSelect,
										Tooltip:question.Tooltip
                                    };
									if(question.Type=='TEXTAREA'||question.Type=='textarea'||question.Type=='richtextarea'||question.Type=='RICHTEXTAREA'){
										srdquestiontext.numLines =5;
										srdquestiontext.answer='';
									}

									questionTextList.push(srdquestiontext);
									questionTextHash[srdquestiontext.id] = srdquestiontext;
                                    
                                    if(srdquestiontext.format==1||srdquestiontext.format==2||srdquestiontext.format==4){
                                        var srdquestionchoice={
                                            format:getmyItformat(question.Type),
                                            id:question.Id,
                                            label:question.Text,
											isRequired:question.IsRequired,
											isMultiSelect:question.MultiSelect,
											Tooltip:question.Tooltip
                                        };
																				
                                        questionChoiceList.push(srdquestionchoice);
                                        
                                         _.each(question.Values,function(value){
											var srdquestionchoiceOption={}; 
											if(srdquestiontext.format != 2 ){
												srdquestionchoiceOption={
													value:value.Value,
													id:result.id+'_'+question.Id+'_'+value.Value,
													isDefault:value.IsDefault,
													label:value.Text,
													questionId:question.Id
												};											
											}else{
												if(value.Value == 'True'){
													srdquestionchoiceOption={	 
													    value: true,										
														id:result.id+'_'+question.Id+'_'+value.Value,
														isDefault:value.IsDefault,
														label:value.Text,
														questionId:question.Id,
														checked : false
													};		
												}											
												
											}
											questionChoiceOptions.push(srdquestionchoiceOption);
                                    });
                                    
                                }
                                
                            });
							_.each(questionConditionalMaplist,function(conditionalQuestion){
								var parent = questionTextHash[conditionalQuestion.parentQuestionId];
								if(parent && parent.format == 2){
									if(conditionalQuestion.questionConditionValues == 'True' ||
									conditionalQuestion.questionConditionValues	== 'true' 
									|| conditionalQuestion.questionConditionValues == 'TRUE')
										conditionalQuestion.questionConditionValues =true;
									else
										conditionalQuestion.questionConditionValues = false;
								}
							});
                    var dataList=[];
                                
                                var data={
                                dataSourceName: 'ServiceRequestDefinition',
                                items:srdList                             
                                };
                                dataList.push(data);
                                
                                data={
                                dataSourceName: 'ServiceRequestDefinitionQuestionText',
                                items:questionTextList                              
                                };
                                dataList.push(data);
                                
                                data={
                                dataSourceName: 'ServiceRequestDefinitionQuestionNumber',
                                items:[]                                
                                };
                                dataList.push(data);
                                
                                data={
                                dataSourceName: 'ServiceRequestDefinitionQuestionDate',
                                items:[]                                
                                };
                                dataList.push(data);
                                
                                data={
                                dataSourceName: 'ServiceRequestDefinitionQuestionChoice',
                                items:questionChoiceList                                
                                };
                                dataList.push(data);
                                
                                data={
                                dataSourceName: 'ServiceRequestDefinitionQuestionChoiceOption',
                                items:questionChoiceOptions                             
                                };
                                dataList.push(data);
                                
                                data={
                                dataSourceName: 'ServiceRequestDefinitionQuestionMap',
                                items:questionMaplist                               
                                };
                                dataList.push(data);
								
								data={
                                dataSourceName: 'ServiceRequestDefinitionQuestionConditionMap',
                                items:questionConditionalMaplist                               
                                };
                                dataList.push(data);							
								return dataList;
						}
 function getmyItformat(type){
     var format;
         switch (type) {
		 case "BOOLEAN":
         case "checkbox":
          format = 2;
                break;
            case "radiobutton":
                format = 1;
                break;
			case "NUMBER":
            case "number":
                format = 3;
                break;
		    case "PICKLIST":		
            case "picklist":
			case "MULTIPICKLIST":
            case "multipicklist":
                format = 4;
                break;
            case "date":
			case "DATE":
                format = 8;
                break;
			case "DATETIME":
            case "date/time":
                format = 7;
                break;
            case "textfield":
			case "TEXTAREA":
            case "textarea":
            case "richtextarea" :
			case "RICHTEXTAREA" :
                format = 0;
                break;
			case "REFERENCE":
            case "reference":
			case "lookup":
			case "LOOKUP":
                format = 10;
                break;
			case "header section":
				format=11;
				break;
			case "richtextarea" :
			case "RICHTEXTAREA" :
				format = 12;
				break;
            default:
                format = 0;
         
         }
         return format;
     }
				self.getDynamicOptionsByIds = function (params) {
					var queryParams = { srdId: params[0], questionId: params[1] };
					if (typeof params[2] !== "undefined" && typeof params[3] !== "undefined") {
						var questions = params[2];
						var relatedQuestions = params[3];
						_.each(questions, function (question) {
							if (relatedQuestions.indexOf(question.id) !== -1 && question.id !== params[1]) {
								if (question.format == 7) {
									question.answer = processTimeAnswer(question.answer.time, question.answer.date) + '';
								}
								if (question.format == 8) {
									// date in seconds
									question.answer = moment(question.answer).unix() + '';
								}
								if (question.format == 9) {
									question.answer = processTimeAnswer(question.answer) + '';
								}
								if (typeof question.answer === "undefined" || question.answer === null) {
									question.answer = "";
								}
								queryParams[question.id] = question.answer;
							}
						});
					}

					return supportService.getDynamicOptionsByIds(queryParams).$promise
						.then(function (response) {
							if (response && response[0]) {
								_.each(response[0].items, function (option) {
									processDefaultOptionValues({ id: queryParams.questionId }, option);
								});
								return response[0].items;
							}
						});
				};


				self.invokeSrdAction = function (srd, action, userId) {
					var data = {
						customer: userId || userModel.userId,
						ServiceRequestAnswer: processAnswersForAction(action.questions)
					};

					var promise = supportService.invokeSrdAction({ srdId: srd.id, actionId: action.id }, data).$promise;
					
					promise
						.then(function (data) {
							populateAnswers(srd, srd.questions, data);
						});

					return promise;
				};
				
				
				var populateAnswers = function (srd, questions, data) {
					if (data && data[0] && data[0].items) {
						_.each(data[0].items, function (item) {
							var matchedQuestions = _.filter(questions, function (question) {
								return item.questionId == question.id;
							});
							if (matchedQuestions.length > 0) {
								var question = matchedQuestions[0];
								var date;

								if (question.format == 0 || question.format == 12) {
									question.answer = item.displayValue;
								} else if (question.format == 7) {
									date = new Date(item.value * 1000);
									question.answer.date = date;
									question.answer.time = date;
								} else if (question.format == 8) {
									question.answer = new Date(item.value * 1000);
								} else if (question.format == 9) {
									date = new Date(item.value * 1000);
									question.answer = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
								} else {
									question.answer = item.value;
								}
								
								// we need to set this attribute to true, 
								// otherwise answer will not be sent during SR creation
								question.hasAnswer = true;
								
								// triggering dynamic query menus
								_.each(question.affectedQuestionIds, function (affectedQuestionId) {
									self.refreshDynamicQuestionOptions(affectedQuestionId, srd);
								});
							}
						});
					}
				};


				self.createQuickRequest = function (requestText, requestType) {
					return supportService.createQuickRequest({ type: requestType || 'request' }, { text: requestText }).$promise
				};


				self.checkOnBehalfPrivileges = function () {
						return false;
				};


				


				self.getChangeDetails = function (changeId) {
					return supportService.getChangeDetails({ changeId: changeId }).$promise
						.then(function (response) {
							if (response) {
								if (!_.isEmpty(response.activityLogs)) {
									_.each(response.activityLogs, function (activityLog) {
										// Processing attachments
										if (!_.isEmpty(activityLog.attachments)) {
											_.each(activityLog.attachments, function (attachment) {
												attachment.url = angular.restPrefix + 'rest/v2/change/activity_log/' + activityLog.id + '/file/' + attachment.id;
												attachment.contentType = attachmentService
													.recognizeFileType(attachment.contentType, attachment.name);
											});
										}
										// Processing the thumbnail
										if (activityLog.createdByThumbnail) {
											thumbnailCache.put('user', activityLog.submitter, activityLog.createdByThumbnail);
										}
									});
								}
							}
							return response;
						});
				};


			self.getServiceRequestClone = function (request) {
					if (_.isEmpty(self.srClones[request.id])) {
						var srClone={};
						$.extend(srClone,request);
						srClone.id= null;
						self.srClones[request.id] = srClone;
					}
					return $q.when(self.srClones[request.id]);
				};


				self.prepareClonedSrAnswers = function (clonedSr) {
					self.clonedSrAnswers = self.clonedSrAnswers || {};
					if (_.isArray(clonedSr.answers)) {
						clonedSr.answers.forEach(function (answer) {
							// skip answers of date/time formats
							if (answer.format === 7 || answer.format === 8 || answer.format === 9) {
								return false;
							}
							// for checkbox, turn answer into array
							if (answer.format === 2 && !_.isArray(answer.value)) {
								answer.value = answer.value.split(';');
							}
							// for number, convert value to number
							if (answer.format === 3) {
								answer.value = parseInt(answer.value, 10);
							}

							self.clonedSrAnswers[answer.questionId] = answer;
						});
					}
				};


				self.checkClonedSrAnswer = function (questionId) {
					return self.clonedSrAnswers && self.clonedSrAnswers[questionId] && self.clonedSrAnswers[questionId].value;
				};


				self.clearClonedSrAnswers = function () {
					self.clonedSrAnswers = null;
				};
				
				self.openSuccessSRCreatedConfirmationModal = function (ticketNo) {
					if (lightningModule=='createSR'){
						var response = {
										message: "Close_After_Save",
										component: cmpId,
										ticket: ticketNo										
									};
						parent.postMessage(response, lexOpenerURL);
						return;
					}
					if(self.smartSuggestionsData && self.smartSuggestionsData.isSuggestionsOpen==true){
						self.smartSuggestionsData.isSuggestionsOpen = false;
						self.smartSuggestionsData.clearSearchString = true;
					}
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');					
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/create-sr-modal-success.html',
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
				
				self.openSRCreatedWithErrorConfirmationModal = function () {
					var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
					$uibModal.open({
						templateUrl: resourceUrl+'views/support/create-sr-modal-with-error.html',
						ariaLabelledBy:'modal-header__title',
						ariaDescribedBy: 'modal-header__text',
						controller: ['$scope',
							function ($scope) {
								$scope.errorMessage = selfServiceLabels.attachmentUploadError;
							}
						]
					});
				};


				self.getQuickLinks = function () {
					if (self.quickLinks) {
						return $q.when(self.quickLinks);
					}

					if (self.quickLinksLoading) {
						return self.quickLinksLoadingPromise;
					}

					self.quickLinksLoading = true;

					self.quickLinksLoadingPromise = supportService.getQuickLinks().$promise
						.then(function (result) {
							self.quickLinks = result;
							return self.quickLinks;
						})
						['finally'](function () {
							self.quickLinksLoading = false;
						});

					return self.quickLinksLoadingPromise;
				};


				/**
				 * Returns first default option value
				 * @param {Array} options
				 * @returns {*}
				 */
				self.findDefaultQuestionOption = function (options) {
					var result = _.findWhere(options, { isDefault: true });

					return result ? result.value : null;
				};
				
				self.displayExceptionMessage = function( messagetype,message,timeout) {
          			var errorDetails = {
						title : messagetype,
						titleI18nKey : messagetype,
						text : message,
						textI18nKey : message,
						timeout : timeout
					};
					self.errorDialogService.showDialog(errorDetails);
        		};

	self.resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
                /**
                 * Compares question answers by value, label and isDefault fields
                 * returns true only if options have same order (!) even if they are equal
                 * @param {object} question1
                 * @param {object} question2
                 * @returns {boolean}
                 */
				self.questionsHaveSameOptions = function (question1, question2) {
					var options1, options2;

					if (!angular.isObject(question1) || !angular.isObject(question2)
						|| !angular.isArray(question1.options) || !angular.isArray(question2.options)) {
						return false;
					}

					options1 = getOptionsProps(question1.options);
					options2 = getOptionsProps(question2.options);

					return angular.equals(options1, options2);

					function getOptionsProps(optionsArr) {
						return _.map(optionsArr, function (option) {
							return _.pick(option, 'value', 'label', 'isDefault');
						});
					}
				};
				self.getTilesData	= function(){
					return supportService.getTilesData();
				}
				self.categoryFilterConfig ={
					minLimit : 10,
					maxLimit : 21
				};
				self.dropDownBreadCrumbsData ={};
				self.initDropDownBreadCrumbsData = function(){
					self.dropDownBreadCrumbsData ={
						resultsDisplayed : false,
						isForward : true,
						subCategories :[],
						breadCrumbs :[],
						selectedCategory : {}
					};
				};
				self.directLinkBreadCrumbHash = {};
				self.selectItem = function (category,isForward,scope,module) {
					if (category.name) {
						self.dropDownBreadCrumbsData.selectedCategory = category;	
						if(module == 'KA'){
							$state.go('support.howto.all.segregation');
						}else if(module == 'SR'){
							$state.go('support.problem-requests.all.segregation');
						}
						self.dropDownBreadCrumbsData.isForward = isForward; 
						if(self.dropDownBreadCrumbsData.isForward){
							if(categoryIdFromURL){
								var counter = 0;
								var recordCount = Object.keys(self.directLinkBreadCrumbHash).length;
								for(var key in self.directLinkBreadCrumbHash){
									counter ++;
									if(counter < recordCount){
										self.dropDownBreadCrumbsData.breadCrumbs.push(self.directLinkBreadCrumbHash[key]);
									}
								}
								categoryIdFromURL='';
							}else if(isCategoryHierarchyNavEnabled && module == 'SR'){
								self.dropDownBreadCrumbsData.breadCrumbs = [];

								if(self.categoryHash[category.parentCategory]){ // Second Level Category
									self.dropDownBreadCrumbsData.breadCrumbs.push(self.categoryHash[category.parentCategory]);
								}
								else if(self.allSrdHash[category.parentCategory]){ // Third Level Category
									if(self.categoryHash[self.allSrdHash[category.parentCategory].parentCategory])
									{
										self.dropDownBreadCrumbsData.breadCrumbs.push(self.categoryHash[self.allSrdHash[category.parentCategory].parentCategory]);
									}
									self.dropDownBreadCrumbsData.breadCrumbs.push(self.allSrdHash[category.parentCategory]);
								}									
							}
							self.dropDownBreadCrumbsData.breadCrumbs.push(category);
						}	
						self.dataLoading = true;
						var categoryTooltip = $(".popover");
						if(categoryTooltip)    // while jumping to new page, there should not be any existing tootip on page until mouse over on any item
							categoryTooltip.popover('hide');
						if(module == 'KA'){
							var categoryId = category.id + String.fromCharCode(172) + String.fromCharCode(172) + category.parentCategory;
							scope.howToModel.getAllKAForSelectedCategory(categoryId)
							.then(function (items) {
								scope.howToItems = items;
								updateUI(scope);
							});				
							scope.howToModel.fetchKACategories(category.id)					
								.then(function (result) {
									self.dropDownBreadCrumbsData.subCategories = result;
									_.each(result, function (category) {						
										self.categoriesDescMap[category.id] = category.categoryDescription;						
									});
									updateUI(scope);
							});
						}else if (module == 'SR'){
							if(self.srdInCache[category.id]){
								processSRDResults(category.id);
								updateUI(scope);
							}else{
								self.getSrds(category.id, category.parentCategory).then(function(){
									processSRDResults(category.id);
									self.config.isSRD = true;
									updateUI(scope);
								});
							}
						}
						
					} else {
						scope.showSRDDetails(category);
					}					
				};			
				function updateUI(scope){
					self.dropDownBreadCrumbsData.resultsDisplayed = true;
					self.dataLoading = false;		
					self.isProblemRequestAllState = $state.$current.self.name === 'support.problem-requests.all'? true : false;		
					supportService.setFocusToElement('firstElementFocusId');	
				}
				function processSRDResults(categoryId){
					self.dropDownBreadCrumbsData.subCategories = _.filter(self.srdHash[categoryId], function (srd) {
						return srd.name != undefined;
					});
					self.categoriesOrSrds = _.filter(self.srdHash[categoryId], function (srd) {
						if(srd.catImage && srd.catImage != 'useDefaultFromStaticResource') {
							srd.catImage = getSFDocumentURL('', srd.catImage);
						}
						return srd.name == undefined && srd.serviceRequestDefinitionId !=undefined;
					});
					_.each(self.categoriesOrSrds, function (srd) {
						if(srd.calculatedIcon){
							srd.calculatedIcon = getSFDocumentURL('',srd.calculatedIcon);
						}
						if(srd.icon == undefined){
							srd.icon = 'SRFilterIcon';
						}
					});		
				};	
				self.goBackToCategory = function(index,scope,module){
					self.dropDownBreadCrumbsData.breadCrumbs.splice(index+1, ((self.dropDownBreadCrumbsData.breadCrumbs.length-1)-index));
					var parentCategory = self.dropDownBreadCrumbsData.breadCrumbs[self.dropDownBreadCrumbsData.breadCrumbs.length - 1];
					if(parentCategory != undefined){
						self.selectItem(parentCategory,false,scope,module);
					}else{
						self.dropDownBreadCrumbsData.resultsDisplayed = false;
						self.dropDownBreadCrumbsData.breadCrumbs = [];
					}	
					scope.dropDownBreadCrumbsData = self.dropDownBreadCrumbsData;
				};
				self.updateCategoryDropdownUI = function(){
					$("#dropdown-container-div").animate({
						scrollTop: 0
					}, 'fast');
				};
				self.getThaiYearAdjustment = function(){
					var yrAdjustment = 0;
					try{
						if(userModel.userLocale == 'th_TH' || userModel.userLocale == 'th'){
							yrAdjustment = 543;
						}
					}catch(err){
						return yrAdjustment;
					}
					return yrAdjustment;
				}
				self.delAttachment = function(attachmentId) {
				   var deferred = $q.defer();
						Visualforce.remoting.Manager.invokeAction(_RemotingActions.deleteAttachment,attachmentId, null, function(result,event) {
							if (event.status) {	
								deferred.resolve(result);
							}else{
								deferred.reject();
							}
						});
						return deferred.promise;	
				}
				self.showCategory=false;
				self.toggleBrowseCategory = function(){
					self.showCategory = !self.showCategory;
				}
				self.showSecondLevelCategories=false;
				self.secondCategoryData={};
				self.showThirdChildCategories=false;
				self.thirdCategoryData={};
				self.firstParentElement = {};
				self.lastParentElement = {};
				self.isProblemRequestAllState = true;
				return self;
			}
			]);
// IE 11 not support startWIth. So if startsWith not then need to create a prototype
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(search, pos) {
		return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
	};
}

function getSFDocumentURL(relativeURL, id, richtextContent) {
	var returnValue = '';
	if(richtextContent) {
		var imageRexExp   =	/<[Ii][Mm][Gg][^>]+src="?([^"\s]+)"?[^>]*[\/>]/g;
		var currentImage ;
		while ( currentImage = imageRexExp.exec( richtextContent ) ) {
			
			if(currentImage[1] && currentImage[1].indexOf(relativeServletURL) == 0) {
				var src		= currentImage[1];
				var id 		= src.split(relativeServletURL)[1];
				
				if(id && (id.length == 15 || id.length == 18)) {
					var newSrc 	    = baseImageURL.replace(dummyDocumentId,id);
					newImageSRC     = currentImage[1].replace(src,newSrc);
					richtextContent = richtextContent.replace(currentImage[1],newImageSRC);
				}
					
			}
		}
		return richtextContent;
	}
	
	if((relativeURL && relativeURL.indexOf(relativeServletURL) > -1 || id)) {
		
		if(relativeURL && !id) {
			id = relativeURL.split(relativeServletURL)[1];
		} 
		if(id && !id.startsWith('http')) {
			returnValue = baseImageURL.replace(dummyDocumentId, id);
		} 
		
		if(returnValue)
			return returnValue;
	}

	if(relativeURL){
		return relativeURL;
	} else if(id) {
		return id;
	}

	return '';
}
