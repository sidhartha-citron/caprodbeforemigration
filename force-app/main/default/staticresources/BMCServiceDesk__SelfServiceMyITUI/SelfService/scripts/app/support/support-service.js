	angular.module('supportModule')
		.factory('supportService', ['$q','$filter','userModel','enhanceduiService',
			function ($q, $filter, userModel, enhanceduiService) {
				var self={};
				self.moduleIcons=enhanceduiService.getModuleIcons();
				self.converDatetoLocale = function (milliseconds){
					var dt = new Date();
					var timezoneOffset = dt.getTimezoneOffset() * 60000;
					var utc = parseInt(milliseconds) + (dt.getTimezoneOffset() * 60000);
					var newdt = new Date(utc + parseInt(timezoneOffset));
					return newdt;
				}
				self.objectToDate= function(obj){
				  obj.dateTimeFormat=userModel.dateTimeFormat;
				  obj.dateFormat=userModel.dateFormat;
				  obj.currentTime=userModel.currentTime;
				  
				  var dateVal;
				  if(obj.value !== undefined && obj.value != null && obj.value != ''){
						dateVal = new Date(moment.tz(obj.value,userTimeZone).format('YYYY-MM-DD HH:mm:ss'));
						if(obj.type.toLowerCase() == 'date')
							  obj.value=$filter('date')(dateVal, userModel.dateFormat);
						else
							  obj.value=$filter('date')(dateVal, userModel.dateTimeFormat).replace('a.m.', 'AM').replace('p.m.','PM').replace('??', 'AM').replace('vorm.', 'AM').replace('??', 'PM').replace('nachm.', 'PM');
				  }else{
						dateVal=new Date(moment(obj.currentTime,'YYYY-MM-DD HH:mm:ss'));                                
						var diff = Math.abs((new Date() - dateNow)/60000);
						dateVal.setMinutes(dateVal.getMinutes()+diff);
						
				  }
				  if(obj.type.toLowerCase() == 'date'){
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
				self.getSRDCategories= function(){	
					var deferred = $q.defer();  
					  Visualforce.remoting.Manager.invokeAction(_RemotingActions.getSRDCategories,function(result, event) {
							if (event.status) {
								deferred.resolve(result);
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;							
				}; 	
                self.getChatBotUrl= function(){
					var deferred = $q.defer();  
					  Visualforce.remoting.Manager.invokeAction(_RemotingActions.getChatBotUrl, function(result, event) {
							if (event.status) {
								deferred.resolve(result);
							}else{
								deferred.reject();
							}
						},{escape:false});	
					return deferred.promise;							
				};  	
				
				self.getSRDById = function (srdId, reqDefId, action, additionalParam) {	
					if(!additionalParam) {
						additionalParam = null;
					}
					 var deferred = $q.defer();  
					  Visualforce.remoting.Manager.invokeAction(_RemotingActions.getNewSRDDetails,srdId,reqDefId,action,'SS3', additionalParam, function(result, event) {
							if (event.status) {
								if(lightningModule){
									result.SRColumnLayoutForSS3 = 1;
								}
									
								for(key in result.SRInputs){
									var srInputField = result.SRInputs[key];
									if(srInputField.Type == 'hyperlink'){
										var inputString = srInputField.Text;
										var size = inputString.length;
										var hyperlinkStringArray = [];
										var hyperlinkSplitString = '##';
										var firstHash = -1, secondHash = -1;
										firstHash = inputString.indexOf(hyperlinkSplitString);
										if(firstHash != -1){
											firstHash += hyperlinkSplitString.length;
											secondHash = inputString.indexOf(hyperlinkSplitString, firstHash);
										}
										if(firstHash != -1 && secondHash != -1 && inputString.substring(firstHash,secondHash).trim().length != 0)
										{
											hyperlinkStringArray = [inputString.substring(0,firstHash-hyperlinkSplitString.length),inputString.substring(firstHash,secondHash).trim(),inputString.substring(secondHash+hyperlinkSplitString.length, size)];
										}
										else{
											hyperlinkStringArray = ['',inputString,''];
										}
										srInputField.Text = hyperlinkStringArray;
									}
								}
								result.resourceUrl = $("a[id*='selfServiceResourcesUrl']").attr('href');
								deferred.resolve(result);	
							}else{
								deferred.reject(event.message);
							}
						},{escape: true} );	
					return deferred.promise;						
				};
				
				self.searchOnBehalfUsers = function (searchText,recordId) {
					if(typeof(searchText) == 'undefined' || searchText == null){
						searchText = '';
					}
					var fieldParam = {
						refObject: 'User', 
						searchText: searchText,
						whereClause: 'ONBEHALFOF',
						showMore:'false',
						recordId: recordId
					};
					var deferred = $q.defer();  
					 Visualforce.remoting.Manager.invokeAction(_RemotingActions.getReferenceFieldData,fieldParam,function(result, event) {
							if (event.status) {																
								deferred.resolve(result);
								return result;
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;	
				}; 
				
				
				self.getDefaultValuesForUser = function(selectedUserId, currentSRDId){
					var deferred = $q.defer();  
					 Visualforce.remoting.Manager.invokeAction(_RemotingActions.getSRInputDefaultValues,currentSRDId,selectedUserId,'false',function(result, event) {
							if (event.status) {																
								deferred.resolve(result);
								return result;
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;	
					
				}
				
				self.searchReferenceFields = function (obj, field, searchText, lookupFilter, requestedForUser, recordId) {
					var deferred = $q.defer();  
					var whereClause=self.getWhereclause(obj, field);
					var lookupFilterCondition = '';
					if (lookupFilter != undefined && lookupFilter.conditions != undefined) {
						lookupFilterCondition = lookupFilter.conditions.replace(/&#39;/g, '\'');
						lookupFilterCondition = lookupFilterCondition.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
						lookupFilterCondition = lookupFilterCondition.replace(/&amp;/g, '&');
						lookupFilterCondition = lookupFilterCondition.replace(/&quot;/g, '"');
					}
					if (lookupFilterCondition.length > 0 ) {
						if (whereClause.length > 0) 
							whereClause = whereClause + encodeURIComponent (' AND ' + lookupFilterCondition);
						else 
							whereClause = encodeURIComponent(lookupFilterCondition);
					}
					// recordId is passed only when '+' icon is clicked
					if(typeof recordId != 'undefined' && recordId != ''){
						if (whereClause.length > 0)
							whereClause = whereClause + escape (' AND id = \''+recordId+'\'');
						else	
							whereClause = escape (' id = \''+recordId+'\'');
					}
						
					var fieldParam = {
						refObject: obj, 
						searchText: searchText,
						whereClause: whereClause,
						showMore:'false',
						fieldAPIName: field.isSRInput ? '': field.apiName,
						sourceObj: (field.isFromRDFieldSet || field.isSRInput)?'SRM_RequestDetail__c':'Incident__c',
						requestedForUser: requestedForUser ? requestedForUser: '',
						recordId: recordId
					};
					if(lookupFilter != undefined && lookupFilter.cmdbSSFilter != undefined){
						fieldParam.cmdbSSFilter = lookupFilter.cmdbSSFilter;
					}					
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getReferenceFieldData, fieldParam, function(result, event) {
							if (event.status) {																
								deferred.resolve(result);
								return result;
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;	
				};
				self.getObjectName = function (field,isSR) {
					var deferred = $q.defer();  
					var fieldName;
					var inputId;
					if(isSR){
						inputId=field;
						fieldName=null;
					}else{
						inputId=null;
						fieldName=field;
					}	
					 Visualforce.remoting.Manager.invokeAction(_RemotingActions.getObjectName,fieldName,inputId, null, function(result, event) {
							if (event.status) {																
								deferred.resolve(result);								
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;	
				};
				self.createRemoteSR=function(params){
					var deferred = $q.defer();  
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.saveSRDData,params, function(result, event) {
							if (event.status) {																
								deferred.resolve(result);
								return result;
							}else{
								deferred.reject();
							}
						});	
						return deferred.promise;	
				}
				self.getWhereclause = function (refObject, field){   
						var refObjectLowCase = refObject.toLowerCase();
						var namespaceprefixLowCase = namespaceprefix.toLowerCase() + '__';
						if(refObjectLowCase == 'queuesobject' || refObjectLowCase == 'user') {						
							return escape('Isactive = true');
						} else if(refObjectLowCase == 'account') {
							return escape('Inactive__c = false');
						} else if(refObjectLowCase == namespaceprefixLowCase+'impact__c' 
							 || refObjectLowCase == namespaceprefixLowCase+'priority__c' 
							 || refObjectLowCase == namespaceprefixLowCase+'urgency__c'
							 || (field.isSRInput && (refObjectLowCase == 'impact__c' || refObjectLowCase == 'priority__c'|| refObjectLowCase == 'urgency__c'))) {
							return escape('Inactive__c = false'); 
						} else if (refObjectLowCase == namespaceprefixLowCase+'broadcasts__c'
						 	   || refObjectLowCase == namespaceprefixLowCase+'task__c'
						 	   || refObjectLowCase == namespaceprefixLowCase+'incident__c'
						 	   || refObjectLowCase == namespaceprefixLowCase+'release__c'
						 	   || refObjectLowCase == namespaceprefixLowCase+'change_request__c'
						 	   || refObjectLowCase == namespaceprefixLowCase+'problem__c'
						 	   || (field.isSRInput && (refObjectLowCase == 'broadcasts__c' || refObjectLowCase == 'task__c'|| refObjectLowCase == 'incident__c' || refObjectLowCase == 'change_request__c' || refObjectLowCase == 'problem__c' || refObjectLowCase == 'release__c'))) {
							if(field.isFromRDFieldSet)
								return escape('Inactive__c = false AND state__c = true'); 
							else
								return escape('Inactive__c = false');
						} else if (refObjectLowCase == namespaceprefixLowCase+'category__c' 
							   || (field.isSRInput && refObjectLowCase == 'category__c')) {
							if (field.isSRInput) {
								return escape('Inactive__c = false ');						
							}else if(field.isFromRDFieldSet){
								return escape('Inactive__c = false AND Display_In_SelfService__c = true AND AvailableForServiceCatalog__c = true');
							}else{
								return escape('Inactive__c = false AND Display_In_SelfService__c = true AND AvailableForIncidents__c = true');
							}
						} else if(refObjectLowCase == namespaceprefixLowCase+'systemplate__c'
							  || (field.isSRInput && refObjectLowCase == 'systemplate__c')) {
							if (field.isSRInput) {
								return escape('Inactive__c = false '); 
							} else {
								return escape('Inactive__c = false and templateFor__c =\'Incident\''); 
							}
						} else if(refObjectLowCase == namespaceprefixLowCase+'status__c'
							 || (field.isSRInput && refObjectLowCase == 'status__c')) {
							return escape('Inactive__c = false and appliesToIncident__c = true'); 
						} else if(refObjectLowCase == namespaceprefixLowCase+'bmc_baseelement__c'
							   || (field.isSRInput && refObjectLowCase == 'bmc_baseelement__c')) {
							if(!field.isSRInput && typeof field.apiName !='undefined'){
								if(field.apiName.toLowerCase() == (namespace+'fkbusinessservice__c').toLowerCase()){
							   		return escape('MarkAsDeleted__c=false and servicetype__c != \'offering\' and Class__c = \'BMC_BusinessService\' ');
								}else if(field.apiName.toLowerCase() == (namespace+'fkserviceoffering__c').toLowerCase()){
							   		return escape('MarkAsDeleted__c=false and servicetype__c = \'offering\' and Class__c = \'BMC_BusinessService\' ');
								}
							}
							  return escape('MarkAsDeleted__c=false ');
						}
						
						return '';
					}
				self.getTilesData= function(){	
					var deferred = $q.defer();  
					  Visualforce.remoting.Manager.invokeAction(_RemotingActions.getTilesData, null, function(result, event) {
							if (event.status) {
								deferred.resolve(result);
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;							
				}; 		
				self.htmlDecode = function (input) {
					if (input)
						return angular.element('<div>' + input + '</div>').text().replace(/&amp;/g, '&').replace(/(?:\\[rn]|[\r\n]+)+/g, '');
					return '';
				};
				self.replaceFieldValuesInLookupConditions = function (questions, cond, depOn, namespace) {

					for (var i = 0; i < depOn.length; i++) {
						for (var j = 0; j < questions.length; j++) {
							if (depOn[i] != undefined && depOn[i] != null && questions[j].apiName != undefined) {
								var depOnFieldWithNamespace = namespace + depOn[i];
								if (questions[j].apiName != null && (depOn[i].toLowerCase() == questions[j].apiName.toLowerCase() || depOnFieldWithNamespace.toLowerCase() == questions[j].apiName.toLowerCase())) {
									var replaceValRef = questions[j].fvalue;
									var replaceVal = self.htmlDecode(questions[j].Value);
									replaceVal = replaceVal.replace(/\\/g, '\\\\');
									replaceVal = replaceVal.replace(/'/g, '\\\'');

									var strToReplace;
									if (replaceValRef != null && replaceValRef != undefined) {
										strToReplace = String.fromCharCode(172) + depOn[i] + ':reference' + String.fromCharCode(172);
										cond = cond.replace(new RegExp(strToReplace, 'g'), replaceValRef);
									}
									strToReplace = String.fromCharCode(172) + depOn[i] + String.fromCharCode(172);
									cond = cond.replace(new RegExp(strToReplace, 'g'), replaceVal);
									break;
								}
							}
						}
					}
					return cond;
				};
				self.isActiveSRD=function(SrdId){
					var deferred = $q.defer();  
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.isActiveSRD,SrdId, function(result, event) {
							if (event.status) {																
								deferred.resolve(result);
								return result;
							}else{
								deferred.reject();
							}
						});	
						return deferred.promise;	
				};
				self.setFocusToFirstElement= function(event,sectionID){
					if (event && event.which === 40) {
						var elementId = document.getElementById(sectionID);
						var noRecordFoundElement = document.getElementById('noRecordFound');
						if(elementId){
							elementId.firstElementChild.focus();
						}else if(noRecordFoundElement){
							noRecordFoundElement.focus();
						}
					}
				};
				self.setFocusToElement = function(elementId){
					var elementObj = document.getElementById(elementId);
					if(elementObj){
						elementObj.focus();
					}
				};
				return self;
			}
		]);
		
		angular.module('supportModule').directive('ariaShifttabnavigation', function () {
			return {
				scope: {
					select: "&"
				},
				link: function (scope, element, attrs) {
					element.on("keydown", function (event) {
						scope.$apply(function () {
							var elementObj=document.getElementById(attrs.ariaShifttabnavigation);
							if (event.shiftKey && event.which == 9 && elementObj) {//Shift + Tab
								scope.select({
									element: elementObj
								});
								elementObj.focus();
								event.preventDefault();
							}
						});
					});
				}
			}
		});
		
		angular.module('supportModule').directive('ariaButton', function (){
			return {
				link: function(scope, element, attrs){
					if(isAccessibilityMode) {
						element.attr('tabindex','0');
						element.attr('role','button');
						element.on('keydown',function(){
							if(event.which === 13 || event.which === 32){
							event.preventDefault();
								element.trigger('click');
							}
						});
					}
				}
			}
		});

		angular.module('supportModule').directive('ariaListnavigation', function () {
			return {
				scope: {
					select: "&",
					list:"@"
				},
				link: function (scope, element, attrs) {
					element.on("keydown","[selectable]", function (event) {
						var eventTarget = $(this);
						var selectedElement = {};
						var eventTargetParent = eventTarget.parent();
						scope.$apply(function () {
							if (event.which === 40) {//Down Key
								selectedElement = eventTarget.next("[selectable]");
								while(selectedElement.length > 0 && selectedElement[0].offsetHeight == 0){
									selectedElement = selectedElement.next("[selectable]");
								};
								if (selectedElement.length > 0) {
									scope.select({
										element: selectedElement
									});
								}
							} else if (event.which === 38) {//UP Key
								selectedElement = eventTarget.prev("[selectable]");
								while(selectedElement.length > 0 && selectedElement[0].offsetHeight == 0){
									selectedElement = selectedElement.prev("[selectable]");
								};
								if (selectedElement.length > 0) {
									scope.select({
										element: selectedElement
									});
								}
							} else if (event.which === 35) {//End Key
								if(!scope.list && eventTargetParent && eventTargetParent.children('li') && eventTargetParent.children('li').last("[selectable]")){
									selectedElement = eventTargetParent.children('li').last("[selectable]");
									while(selectedElement.length > 0 && selectedElement[0].offsetHeight == 0){
										selectedElement = selectedElement.prev("[selectable]");
									};
								}else if(scope.list && eventTargetParent && eventTargetParent.children('div') && eventTargetParent.children('div').last("[selectable]")){
									selectedElement = eventTargetParent.children('div').last("[selectable]");//This will work for list = profile
									if((scope.list=='tiles' || scope.list=='draft') && selectedElement.prev()){
										selectedElement = selectedElement.prev();
									}
								}
								if (selectedElement.length > 0) {
									scope.select({
										element: selectedElement
									});
								}
							} else if (event.which === 36) {//Home Key
								if(!scope.list && eventTargetParent && eventTargetParent.children('li')&& eventTargetParent.children('li').first("[selectable]")){
									selectedElement = eventTargetParent.children('li').first("[selectable]");
									while(selectedElement.length > 0 && selectedElement[0].offsetHeight == 0){
										selectedElement = selectedElement.next("[selectable]");
									};
						}else if((scope.list=='profile' || scope.list=='draft' || scope.list=='tiles') && eventTargetParent && eventTargetParent.children('div') && eventTargetParent.children('div').first("[selectable]")){
									selectedElement = eventTargetParent.children('div').first("[selectable]");
								}
								if (selectedElement.length > 0) {
									scope.select({
										element: selectedElement
									});
								}
							} else if (event.which === 13 || event.which === 32) {
								eventTarget.trigger("click");
					}else if(event.which === 46 && scope.list=='draft'){//delete key
						if(eventTarget && eventTarget.children()){
							eventTarget.children()[1].click();
						}
							} 
						});

						if (selectedElement.length > 0) {
							eventTarget.blur();
							selectedElement.focus();
							event.preventDefault();
						}
						if(eventTargetParent && eventTargetParent.parent() && eventTargetParent.parent().length > 0 && eventTargetParent.parent()[0].attributes['aria-shifttabnavigation']){
							//do nothing
						}else{
							event.stopPropagation();
						}
					});
				}
			}
		});
