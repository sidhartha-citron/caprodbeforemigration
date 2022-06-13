var ciAssetSlideInModule = angular.module('ciAssetSlideInModule',['rf.ng.tooltip','rf.ang.column.sort', 'rfmodal','ui.bootstrap'])
.config(['rfModalProvider', function (rfModelProvider) {
	rfModelProvider.setDefaults({ });
}]);
ciAssetSlideInModule.controller('ciAssetSlideInController', [ '$scope', '$q','$window','ciAssetSlideInService','$filter','$modal','$rootScope','confirmationDialogService',
		function ($scope,$q,$window,ciAssetSlideInService,$filter,$modal,$rootScope,confirmationDialogService) {
			$scope.primaryClicked = true;
			$scope.isViewMode=true;
			$scope.additionalCIClicked = true;
			$scope.sortColumnName = '';
			$scope.sortDirection = true;
			$scope.isFilterHidden = true;
			$scope.parentRecordId=pageLoadData['nodeID'];
			$scope._labels = _Labels;
			$scope.parentObject= pageLoadData['objectName'];
			$scope.instanceDetails;
			$scope.instanceDetailsWithoutName = [];
			$scope.instanceDisplayLabels = [];
			$scope.instanceDetailName = '';
			$scope.instanceDetailNameLabel = '';
			$scope.filterJSON={};
			$scope.isServerSideFilter = false;
			$scope.counter = 1;
			$scope.AdditionalCICount='';
			$scope.TotalCount='';
			$scope.isPrimaryVisible = false;
			$scope.isDisabled=false;
			$scope.isBEAccessible=true;
			$scope.PrimaryTooltipPosition='left';
			$scope.filterCriteria={
				filterOperationInstanceName : 'Contains',
				filterOperationClassName : 'Contains',
				isFilterAppliedForInstanceName : false,
				isFilterAppliedForClassName : false,
			};
			var init = function () {
				if(userLanguage && userLanguage == 'iw'){
					$scope.PrimaryTooltipPosition = 'right';
				}
				if ($scope.parentObject.indexOf('Incident__c') != -1) {
					$scope.SelectAndLinkLabel = _Labels.SelectAndLinkToIncident;
				}else if ($scope.parentObject.indexOf('Task__c') != -1) {
					$scope.SelectAndLinkLabel = _Labels.SelectAndLinkToTask;
				}if ($scope.parentObject.indexOf('Change_Request__c') != -1) {
					$scope.SelectAndLinkLabel = _Labels.SelectAndLinkToChangeRequest;
				}if ($scope.parentObject.indexOf('Problem__c') != -1) {
					$scope.SelectAndLinkLabel = _Labels.SelectAndLinkToProblem;
				}if ($scope.parentObject.indexOf('Release__c') != -1) {
					$scope.SelectAndLinkLabel = _Labels.SelectAndLinkToRelease;
				}
				$scope.primaryCiData = primaryCIsDataJSON.PrimaryCIsData;
				$scope.setPrimaryCIsDetails($scope.primaryCiData);
				$scope.setParentRecordState();
				$scope.setAdditionalCIsDetails(additionalCIsJSON);
			}
			
			$scope.getAdditionalCIsDetails = function(filterJson) {
				var configParams = {};
				if ($scope.sortColumnName && $scope.sortDirection) {
					configParams.sortColumnName = $scope.sortColumnName;
					configParams.sortDirection = $scope.sortDirection;
				}
				ciAssetSlideInService.getAdditionalCIsDetails($scope.parentRecordId,$scope.parentObject,filterJson,configParams).then(function(result){
					$scope.setAdditionalCIsDetails(result);
					if (typeof(filterJson) === 'undefined' || filterJson == null) {
						if($scope.filterCriteria.isFilterAppliedForInstanceName) {
							$scope.ApplyFilter('InstanceName');
						}
						if($scope.filterCriteria.isFilterAppliedForClassName) {
							$scope.ApplyFilter('ClassName');
						}
					}
				}).catch(this.failCallbackMethod);
			};
			$scope.setAdditionalCIsDetails=function(result) {
					$scope.originalAdditionalData = result.additionalCIsList;
					$scope.additionalCiData = $scope.originalAdditionalData;
					$scope.TotalCount=result.totalcount;
					if($scope.isServerSideFilter == false && $scope.TotalCount > 100){
						$scope.isServerSideFilter = true;
					}
					$scope.setAdditionalPanelHeight();
					if($window.parent != null && $window.parent != undefined && typeof $window.parent.RelatedCIDataLoadStarted == 'function'){
						$window.parent.RelatedCIDataLoadStarted();
					}
					$scope.setTotalCount()
					$scope.hideMask();
					if(!$scope.additionalCiData) 
						$scope.additionalCiData =[];
			}
			$scope.setPrimaryCIsDetails = function(result) {
				if(result != null && Object.keys(result).length > 0){
					$scope.isPrimaryVisible = true;
				}else{
					$scope.isPrimaryVisible = false;	
				}
			}
			$scope.setTotalCount = function(){
				if($scope.isServerSideFilter == true){
					if ($scope.TotalCount > 100) {
						$scope.AdditionalCICount='100 '+_Labels.Of+' '+$scope.TotalCount;
					} else {
						$scope.AdditionalCICount=$scope.TotalCount;
					}
				}else{
					$scope.AdditionalCICount=$scope.additionalCiData.length;
				}
				if($scope.isPrimaryVisible==false && $window.parent.document.getElementById('servicesAndCIsId')!=undefined){
					var servicesAndCIDiv=$window.parent.document.getElementById('servicesAndCIsId');
					if(servicesAndCIDiv){
						RemedyForceHTMLProcessor.setText(servicesAndCIDiv, _Labels.ServicesAndCIs + ' (' + $scope.AdditionalCICount+ ')');
					}
				}
			};
			$scope.showMask = function(){
				$('#sideBarloader').css('display','block');	
				$('#sideBarActionMask').css('display','block');
			};
			$scope.hideMask = function(){
				$('#sideBarloader').css('display','none');	
				$('#sideBarActionMask').css('display','none');
			};
			$scope.showHidePrimarySection= function(){
				$scope.primaryClicked = !$scope.primaryClicked;
				$scope.setAdditionalPanelHeight();
			};
			$scope.showHideAdditionalCISection= function(){
				$scope.additionalCIClicked = !$scope.additionalCIClicked;
			} ;
			$scope.toggleViewMode= function(){
				$scope.isViewMode = !$scope.isViewMode;
				$scope.refreshAll(false);
				var primaryCIPanel= document.getElementById('primaryCI');
				if(primaryCIPanel){
					if(!$scope.isViewMode){
						if(primaryCIsDataJSON.PrimaryCIsData!=null && primaryCIsDataJSON.PrimaryCIsData.length > 0){
							var panelHeight = primaryCIsDataJSON.PrimaryCIsData.length*50;
							primaryCIPanel.style.maxHeight = panelHeight + "px";
						}
					}else{
						primaryCIPanel.style.maxHeight = "90px";
					}
				}
			} ;
			$scope.clearPrimaryDetails=function(lkpFieldApi){
				document.getElementById(lkpFieldApi+'_name_lkid').value='';
				document.getElementById(lkpFieldApi+'_name').value='';
			}
			$scope.savePrimaryDetails= function(){
				var configParams={};
				angular.forEach($scope.primaryCiData, function(data,index){
					var fieldApi=data['fieldApi'];
					var lkpHiddenObj=document.getElementById(fieldApi+'_name_lkid');
					var refRecordId='';
					if(lkpHiddenObj && lkpHiddenObj.value){
						refRecordId=lkpHiddenObj.value;
					}
					configParams[fieldApi]=refRecordId;
					configParams.objectName=$scope.parentObject;
				});
				ciAssetSlideInService.savePrimaryDetails($scope.parentRecordId,configParams).then(function(result){
					$scope.primaryCiData = result.PrimaryCIsData;
					$scope.setPrimaryCIsDetails(result.PrimaryCIsData);
					angular.forEach($scope.primaryCiData, function(data,index){
						$scope.eventTriggerFunction(data['fieldApi'],data['fieldId'],data['fieldValue']);
					});
					$scope.toggleViewMode();
				});
			};
			(function () {

				if ( typeof window.CustomEvent === "function" ) return false;
				
				function CustomEvent ( event, params ) {
					params = params || { bubbles: false, cancelable: false, detail: null };
					var evt = document.createEvent( 'CustomEvent' );
					evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
					return evt;
				 }
				
				CustomEvent.prototype = window.Event.prototype;
				
				window.CustomEvent = CustomEvent;
				})();
			$scope.eventTriggerFunction = function(fieldAPI,fieldId,fieldValue) {
				var lookupNameElement=document.getElementById(fieldAPI+'_name');
				var lookupIdElement=document.getElementById(fieldAPI+'_name_lkid');
				if(lookupNameElement && lookupIdElement) {
					var eventData = {
						fieldAPIName : fieldAPI,
						recName : fieldValue,
						recId : fieldId
					};
					var event = new CustomEvent('ciChangeFromChild', { bubbles: true,detail: eventData });
					window.parent.document.dispatchEvent(event);
				}
			}
			$scope.linkCI = function() {
				if ($scope.isDisabled) {
					return;
				}
				var baseURL='';
				var parentName = pageLoadData['objectName'];
				var orgNamespace=pageLoadData['orgNamespace'];
				var nameSpaceLen = orgNamespace.length;
				if(orgNamespace && parentName.indexOf(orgNamespace) != -1){
					parentName = parentName.substring(nameSpaceLen,parentName.length);
				}
				var businessServiceId = '';
				var baseCIId = '';
				var additionalCIs = [];
				angular.forEach($scope.primaryCiData, function(data,index){
					var fieldApi=data['fieldApi'];
					if (fieldApi.indexOf('FKBusinessService__c') != -1) {
						businessServiceId = data['fieldId'];
					} else if (fieldApi.indexOf('FKBMC_BaseElement__c') != -1) {
						baseCIId = data['fieldId'];
					} 
					var lookupIdElement=document.getElementById(data['fieldApi']+'_name_lkid');
					if(lookupIdElement) {
						var idValue = lookupIdElement.value;
						if(idValue != businessServiceId && idValue != baseCIId) {
							additionalCIs.push(lookupIdElement.value);
						}	
					}
					
				});
				if ($scope.parentObject.indexOf('Incident__c') != -1) {
				 baseURL ='/apex/'+orgNamespace+'SearchAndLink?filterObjectId='+pageLoadData['nodeID']+'&parentName='+parentName+'&childName=BMC_BaseElement__c&filterId=active_be&clientId='
				 			+pageLoadData['ClientId']+'&accountId='+pageLoadData['AccountId']+'&FKBusinessService__c='
				 			+businessServiceId+'&baseId='+baseCIId+'&isCalledFromConsole=true'+'&additionalCIFilterIds='+additionalCIs;
				}else{
				 baseURL ='/apex/'+orgNamespace+'SearchAndLink?filterObjectId='+pageLoadData['nodeID']+'&parentName='+parentName+'&childName=BMC_BaseElement__c&filterId=active_be&isCalledFromConsole=true'
				 			+'&additionalCIFilterIds='+additionalCIs;
				}
				$scope.openRFlookup(baseURL,600,1000);
			};
			$scope.unlinkCI = function(adCiData) {
				if ($scope.isDisabled) {
					return;
				}
				$rootScope.adCiData=adCiData;
				confirmationDialogService.showDialog({
					title: _Labels.Delete,
					titleI18nKey: 'support.sr.reopen.errorHeader',
					text: _Labels.DeleteConfirmMessage,
					callBackFn: $scope.removeCILink
				});
			};
			$scope.removeCILink = function() {
				adCiData=$rootScope.adCiData;
				ciAssetSlideInService.removeCILink(pageLoadData['nodeID'],adCiData.linkId).then(function(result){
					if(result){
						if($scope.originalAdditionalData.indexOf(adCiData) >= 0) {
							$scope.originalAdditionalData.splice($scope.originalAdditionalData.indexOf(adCiData),1);
						}
						$scope.TotalCount--;
						if($scope.additionalCiData.indexOf(adCiData) >= 0) {
							$scope.additionalCiData.splice($scope.additionalCiData.indexOf(adCiData),1);
						}
						$scope.setTotalCount();
					}
				});
			}
			$scope.fetchTypeAheadData = function(refobj,apiname,$event) {
				fetchTypeAheadData($event.currentTarget,refobj,apiname,$event);
			};
			$scope.hideTypeAheadDiv = function(refobj,apiname,$event) {
				disableDiv('autocompleteDiv');
			};
			$scope.refreshAll = function(isRefreshAddtionalCIs) {
				if($scope.isPrimaryVisible){
					var configparam={};
					configparam.objectName=$scope.parentObject;
					ciAssetSlideInService.getPrimaryCIsDetails($scope.parentRecordId,configparam).then(function(result){
						$scope.primaryCiData = result.PrimaryCIsData;
						$scope.setPrimaryCIsDetails($scope.primaryCiData);
						angular.forEach($scope.primaryCiData, function(data,index){
							var fieldApi=data['fieldApi'];
							document.getElementById(fieldApi+'_name_lkid').value=data['fieldId'];
							document.getElementById(fieldApi+'_name').value=data['fieldValue'];
						});
					});
				}
				if(isRefreshAddtionalCIs){
					$scope.filterCriteria={
						filterOperationInstanceName : 'Contains',
						filterOperationClassName : 'Contains',
						isFilterAppliedForInstanceName : false,
						isFilterAppliedForClassName : false,
					};
					$scope.filterJSON = {};
					$scope.getAdditionalCIsDetails(null);
				}
				
			};
			$scope.showHideFilter= function(column) {
				  if(column == 'InstanceName'){
					document.getElementById("InstanceFilter").classList.toggle("show");
				  }else{
					document.getElementById("ClassFilter").classList.toggle("show"); 
				  }
			}
			$scope.ApplyFilter = function(column) {
				var selectedData={};
				if ($scope.isServerSideFilter == true) {
					delete $scope.filterJSON.instanceName;
					delete $scope.filterJSON.className;
					selectedData.type='String';
					if (column == 'InstanceName') {
						selectedData.operator=$scope.filterCriteria.filterOperationInstanceName;
						selectedData.value=$scope.filterCriteria.filterTextInstanceName;
						$scope.filterJSON.Instance_Name__c = selectedData;
						$scope.filterCriteria.isFilterAppliedForInstanceName=true;
					} else {
						selectedData.operator=$scope.filterCriteria.filterOperationClassName;
						selectedData.value=$scope.filterCriteria.filterTextClassName;
						$scope.filterJSON.Class_Name__c = selectedData;
						if ($scope.parentObject.indexOf('Task__c') != -1) {
							$scope.filterJSON.ClassName__c = selectedData;
						}else{
							$scope.filterJSON.Class_Name__c = selectedData;
						}
						$scope.filterCriteria.isFilterAppliedForClassName=true;
					}
					$scope.getAdditionalCIsDetails(angular.toJson($scope.filterJSON));
				} else {
					if (column == 'InstanceName') {
						selectedData.filterText = {};
						selectedData.isclientSide = true;
						selectedData.filterText.instanceName = $scope.getFilterText($scope.filterCriteria.filterOperationInstanceName,
																					$scope.filterCriteria.filterTextInstanceName);
						selectedData.isStartsWith = ($scope.filterCriteria.filterOperationInstanceName == 'StartsWith');
						selectedData.isStrictSearch = ($scope.filterCriteria.filterOperationInstanceName == 'Equals'
										|| $scope.filterCriteria.filterOperationInstanceName == 'NotEqualTo');
						$scope.filterJSON.instanceName = selectedData;
						$scope.filterCriteria.isFilterAppliedForInstanceName=true;
					} else {
						selectedData.filterText = {};
						selectedData.isclientSide = true;
						selectedData.filterText.className = $scope.getFilterText($scope.filterCriteria.filterOperationClassName,
																				$scope.filterCriteria.filterTextClassName);
						selectedData.isStartsWith = ($scope.filterCriteria.filterOperationClassName == 'StartsWith');
						selectedData.isStrictSearch = ($scope.filterCriteria.filterOperationClassName == 'Equals'
										|| $scope.filterCriteria.filterOperationClassName == 'NotEqualTo');
						$scope.filterJSON.className = selectedData;
						$scope.filterCriteria.isFilterAppliedForClassName=true;
					}

					$scope.additionalCiData = $scope.originalAdditionalData;
					angular.forEach($scope.filterJSON,function(value, key){
						if(value.isclientSide == true) {
							if(value.isStartsWith) {
								$scope.additionalCiData = $filter('filter')($scope.additionalCiData,value.filterText,$scope.filterStartsWith,value.isStrictSearch);
							} else {
								$scope.additionalCiData = $filter('filter')($scope.additionalCiData,value.filterText,value.isStrictSearch);
							}
						}
					});
					$scope.setTotalCount();
				}
			}
			$scope.filterStartsWith = function(actual,expected) {
				var lowerStr = (actual + "").toLowerCase();
    			return lowerStr.indexOf(expected.toLowerCase()) === 0;
			}
			$scope.getFilterText = function(operation,searchText) {
				var strictSearch = false;
				if(operation == 'NotEqualTo' || operation == 'DoesNotContain') {
					searchText = '!' + searchText;
				}
				return searchText;
			}
			$scope.ClearFilter = function(column) {
				if (column == 'InstanceName') {
					$scope.filterCriteria.filterOperationInstanceName = 'Contains';
					$scope.filterCriteria.filterTextInstanceName='';
					$scope.filterCriteria.isFilterAppliedForInstanceName=false;
					delete $scope.filterJSON.instanceName;
					delete $scope.filterJSON.Instance_Name__c;
				} else {
					$scope.filterCriteria.filterOperationClassName='Contains';
					$scope.filterCriteria.filterTextClassName='';
					$scope.filterCriteria.isFilterAppliedForClassName=false;
					delete $scope.filterJSON.className;
					delete $scope.filterJSON.Class_Name__c;
					delete $scope.filterJSON.ClassName__c;
				}
				if ($scope.isServerSideFilter == true) {
					$scope.getAdditionalCIsDetails(angular.toJson($scope.filterJSON));
				} else{
					$scope.additionalCiData = $scope.originalAdditionalData;
					angular.forEach($scope.filterJSON,function(value, key){
						if(value.isclientSide == true) {
							if(value.isStartsWith) {
								$scope.additionalCiData = $filter('filter')($scope.additionalCiData,value.filterText,$scope.filterStartsWith,value.isStrictSearch);
							} else {
								$scope.additionalCiData = $filter('filter')($scope.additionalCiData,value.filterText,value.isStrictSearch);
							}
						}
					});
					$scope.setTotalCount();
				}
			}
			$scope.populateLookupField = function(recId,recName){
				document.getElementById($scope.currentPrimaryFieldId).value=recId;
				document.getElementById($scope.currentPrimaryFieldName).value=recName;
			}
			$scope.validateReserveCharactersForSOSL = function(value){
				var chars = new Array('\\', '?', '&', '|', '!', '{', '}', '[', ']', '(', ')', '^', '~', '*', ':', '"', '+', '-');
				for(var j = 0 ; j < chars.length; j++)
				{
					value = value.split(chars[j]).join('\\'+chars[j]);
				}	 
				return value;
			}
			$scope.openCIlookup = function(lkpFieldApi){
				$scope.currentPrimaryFieldId=lkpFieldApi+'_name_lkid';
				$scope.currentPrimaryFieldName=lkpFieldApi+'_name';
				var filterClause = $scope.getFilterClause(lkpFieldApi);
				var typeParam ='';
				
				var txtId=$scope.currentPrimaryFieldName,searchLookUpStr='',LKFclause='',NewLookUpType='';
				var accountId=pageLoadData['AccountId'],clientId=pageLoadData['ClientId'];
				var currentPrimaryObj= document.getElementById($scope.currentPrimaryFieldName);
				if(currentPrimaryObj){
					var searchText=$scope.validateReserveCharactersForSOSL(currentPrimaryObj.value);
					searchLookUpStr=encodeURIComponent(searchText);
				}
				var orgNamespace=pageLoadData['orgNamespace'];
				var nameSpaceLen = orgNamespace.length;
				var fieldApiName=lkpFieldApi;
				if(orgNamespace && lkpFieldApi.indexOf(orgNamespace) != -1){
					fieldApiName = lkpFieldApi.substring(nameSpaceLen,lkpFieldApi.length);
				}
				fieldApiName = fieldApiName.toLowerCase(); 
				if(window.parent!=null && window.parent!=undefined && typeof(window.parent.getLookupFilterQuery)  == "function" ){
					LKFclause = window.parent.getLookupFilterQuery(fieldApiName);
				}
				var baseURL = "/apex/SearchConfigItem?txt=" + txtId;
				var width = 1000,height=600;
				var lookupObject='BMC_BaseElement__c';
				if(lkpFieldApi.indexOf('FKBusinessService__c') != -1){
					lookupObject = 'BMC_BusinessService__c';
					typeParam = '&type=service';
				}else if(lkpFieldApi.indexOf('FKServiceOffering__c') != -1 ){
					lookupObject = 'BMC_BusinessService__c';
				}else{
					lookupObject = 'BMC_BaseElement__c';
					lkpFieldApi=orgNamespace+'FKBMC_BaseElement__c';
				}
				var parentObjName=$scope.parentObject;
				if(orgNamespace && parentObjName.indexOf(orgNamespace) != -1){
					parentObjName = parentObjName.substring(nameSpaceLen,lkpFieldApi.length);
				}
				if(parentObjName.indexOf('Incident__c') != -1 && lkpFieldApi.indexOf(orgNamespace+'FKBMC_BaseElement__c') != -1){
					 var idval='',assetCoreActive=false,discoveryActive=false;
					 if(window.parent!=null && window.parent!=undefined){
						var parentWindow=window.parent;
						if(parentWindow.parent!=null && parentWindow.parent!=undefined){
							assetCoreActive=parentWindow.parent._ServerVariables.assetCoreActive;
							discoveryActive= parentWindow.parent._ServerVariables.discoveryActive
						}
					 }
					if(assetCoreActive ==true || discoveryActive == true){
						baseURL = "/apex/"+orgNamespace+"SearchConfigItem?txt=" + txtId;
						baseURL =  baseURL +"&IncidentID="+$scope.parentRecordId+"&isCalledFromConsole=true&filterObjectId="+clientId+'&searchLookUpStr='+searchLookUpStr + "&accountId=" + accountId + "&idValstr=" + LKFclause;
						baseURL = baseURL +'&frmCiSlideIn=true';
						$scope.openRFlookup(baseURL, "721", width);
					}else{
						baseURL = "/apex/"+pageLoadData['orgNamespace']+"SearchAndLink?txt=" + txtId;
						baseURL =  baseURL +"&filterObjectId="+$scope.parentRecordId+"&parentName="+parentObjName+"&childName="+lookupObject+"&isLookUp="+lookupObject+"&NewLookUpType="+NewLookUpType+"&filterId=active_be&FKBusinessService__c="+idval+"&clientId="+clientId+"&accountId="+accountId+typeParam +"&idValstr=" + LKFclause+'&searchLookUpStr='+searchLookUpStr;
						baseURL = baseURL +'&frmCiSlideIn=true';
						$scope.openRFlookup(baseURL, height, width);
					}	
						
				}else{
					baseURL = "/apex/"+orgNamespace+"SearchAndLink?txt=" + txtId;
					baseURL =  baseURL +"&filterObjectId="+$scope.parentRecordId+"&parentName="+parentObjName+"&childName="+lookupObject+"&isLookUp="+lookupObject+"&NewLookUpType="+NewLookUpType+"&filterId="+filterClause+'&searchLookUpStr='+searchLookUpStr+"&isCustomLookup=false"+typeParam + "&idValstr=" + LKFclause;
					baseURL = baseURL +'&frmCiSlideIn=true';
					$scope.openRFlookup(baseURL,height,width);
				}
			}
			$scope.openCIRecord = function(cmdbRecordId){
				if($scope.isBEAccessible) {
					if(isLightningExperience == true){
						window.open('/one/one.app#/alohaRedirect/apex/'+orgNamespace+'CMDBManager?cmdbRecordId='+cmdbRecordId+'&isReadOnly=true','CMDB'+cmdbRecordId);
					} else {
						window.open('CMDBManager?cmdbRecordId='+cmdbRecordId+'&isReadOnly=true','CMDB'+cmdbRecordId);
					}
				}
			}
			$scope.openRFlookup = function(baseURL,height,width){
				var winLeft = (screen.width/2)-(400);
				var winTop = (screen.height/2)-(350);
				var windowPopup=window.open(baseURL, "lookup","width="+width+",height="+height+",toolbar=no,status=no,left= "+winLeft+",top="+winTop+",directories=no,menubar=no,resizable=yes,scrollable=no, true");
				if (windowPopup.focus) {windowPopup.focus() ;}
			}
			$scope.getFilterClause = function(lkpFieldApi){
				var filterclause = '';
				var serviceNameField=lkpFieldApi+'_name';
				var serviceEleForName= document.getElementById(orgNamespace+'FKBusinessService__c_name');
				if(serviceEleForName){
				  var serviceValue= serviceEleForName.value;
					if(serviceValue && serviceValue.trim()!=''){
						var hiddenServiceId=orgNamespace+'FKBusinessService__c_name_lkid';
						if(hiddenServiceId){
							var serviceEleForId= document.getElementById(hiddenServiceId);
							if(serviceEleForId){
								buisnessServiceId=serviceEleForId.value;
							}else{
								buisnessServiceId='';
							}
						}
					}else{
						buisnessServiceId='';
					}
				}
				if(lkpFieldApi.indexOf('FKServiceOffering__c') != -1){
					if(buisnessServiceId != null && buisnessServiceId != '' && buisnessServiceId != 'undefined' && buisnessServiceId != '000000000000000'){
						filterclause = 'active_be&addlFilterId=flat_offering_bsid&param1='+buisnessServiceId;
					}else {
						filterclause = 'active_be&addlFilterId=flat_offering';
					}
				}else if(lkpFieldApi.indexOf('FKBusinessService__c') != -1){
					filterclause = 'active_be_parent&addlFilterId=service';
				}else{
					filterclause = 'active_be';
				}
				return filterclause;
			}
			$scope.getInstanceDetails = function(instanceId) {
				$scope.instanceDetails={};
				$scope.instanceDetails.instanceDetailsWithoutName = [];
				$scope.instanceDetails.instanceDisplayLabels=[];
				$scope.instanceDetailId = instanceId;
				var orgNamespace=pageLoadData['orgNamespace'];
				ciAssetSlideInService.getInstanceDetails(instanceId).then(function(result){
					$scope.instanceDetails={};
					$scope.instanceDetails.instanceDetailsWithoutName = [];
					$scope.instanceDetails.instanceDisplayLabels=[];
					$scope.instanceDetails.result = result;
					$scope.instanceDetails.instanceDetailId = $scope.instanceDetailId;
					$scope.instanceDetailId = '';
					var displayLabels = result.displayFieldLabels.split('ф');
					var apiNames = result.oblectFieldLabels.split(";");
					for(var i=0; i<apiNames.length; i++) {
						apiName = apiNames[i];
						if(apiName && (apiName == 'Name__c' || apiName == 'Name' || apiName.toLowerCase() == orgNamespace.toLowerCase()+'name__c')){
							$scope.instanceDetails.instanceDetailName = apiName;
							$scope.instanceDetails.instanceDetailNameLabel = displayLabels[i];
							var nameString = $scope.instanceDetails.result[apiName];
							if(nameString.length > 45)
								$scope.instanceDetails.result[apiName] = nameString.slice(0,45) + '...';
						} else if(apiName !== '' && typeof result[apiName] !== 'undefined' && result[apiName] !== '') {
							$scope.instanceDetails.instanceDetailsWithoutName.push(apiName);
							$scope.instanceDetails.instanceDisplayLabels.push(displayLabels[i]);
							var nameString = $scope.instanceDetails.result[apiName];
							if(nameString.length > 25)
								$scope.instanceDetails.result[apiName] = nameString.slice(0,25) + '...';
						}
					}
				});
			};
			$scope.setAdditionalPanelHeight = function() {
				var screenHeight=screen.height;
				if($scope.isPrimaryVisible && $scope.primaryClicked){
					if(screenHeight<800){
						$('#addtionalListId').css('height',screenHeight*0.185+'px');
					}else{
						$('#addtionalListId').css('height',screenHeight*0.29+'px');
					}
				}else{
					if(screenHeight<800 && $scope.isPrimaryVisible && !$scope.primaryClicked){
						$('#addtionalListId').css('height',screenHeight*0.32+'px');
					}else if(screenHeight<800){
						$('#addtionalListId').css('height',screenHeight*0.42+'px');
					}else if($scope.isPrimaryVisible && !$scope.primaryClicked){
						$('#addtionalListId').css('height',screenHeight*0.39+'px');
					}else{
						$('#addtionalListId').css('height',screenHeight*0.48+'px');
					}
				}
			}
			$scope.setParentRecordState = function() {
			   if(window.parent!=null && window.parent!=undefined){
					if(window.parent._ServerVariables.ObjectMetadata.isUpdateable!=undefined){
						$scope.isDisabled= !parent._ServerVariables.ObjectMetadata.isUpdateable;
						
					}
					if(window.parent.isRecordLock && window.parent.isRecordLock.indexOf('true') > -1 ) { 
						$scope.isDisabled= true;
					}
				}
				if(pageLoadData['state']!=null && pageLoadData['state']!=undefined && pageLoadData['state']==false ){
					$scope.isDisabled= true;
				}
				if(pageLoadData['isBEAccessible']!=null && pageLoadData['isBEAccessible']!=undefined  && pageLoadData['isBEAccessible'] == false){
					$scope.isBEAccessible=false;
				}
			}
			$scope.tooltipIconShowCondition = function(pdata) {
				var elem = document.getElementById(pdata.fieldApi+'_name_lkid');
				return (elem && elem.value != '');
					
			}
			$scope.tooltipPrimaryCIContentId = function(pdata) {
				var elem = document.getElementById(pdata.fieldApi+'_name_lkid');
				if (elem) {
					return elem.value;
				}
				return null;
			}
			$scope.isServerSideSort = function() {
				return $scope.isServerSideFilter;
			}
			$scope.serverSideSortCallback = function(colName, colDir) {

				if(colName == 'instanceName') {
					$scope.sortColumnName = 'Instance_Name__c';
				} else {
					$scope.sortColumnName = 'Class_Name__c';
				}
				if(colDir) {
					$scope.sortDirection = 'DESC';
				} else {
					$scope.sortDirection = 'ASC';
				}
				$scope.getAdditionalCIsDetails(angular.toJson($scope.filterJSON));
			}
			this.failCallbackMethod = function () {
				$scope.hideMask();
			};
			init();
		}	
	]);

ciAssetSlideInModule.factory('SSLocalDataStore',['$q',function($q){
    var appMetadata = {};
    return{
        setAppMetadata: function(key, value) {
            appMetadata[key] = value;
        },
        getAppMetadata: function(key) {
            if(key)
                return appMetadata[key];
            else
                return appMetada;
        }
    }
}]);

ciAssetSlideInModule.factory('dataServices',['$rootScope','$q',function($rootScope,$q){    
    return {
    	getLookupresult:function(params){
          var deferred = $q.defer();
            return deferred.promise;
        }
    };
}]);
ciAssetSlideInModule.factory('confirmationDialogService', ['$modal', '$rootScope', 
	function ($modal, $rootScope) {
		var self = {};
		self.showDialog = function (options) {
			return $modal.open({
				templateUrl: resourceUrl+'templates/confirmation-dialog.html',
				controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
					$scope.title = options.title;
					$scope.titleI18nKey = options.titleI18nKey;
					$scope.text = options.text;
					$scope.textI18nKey = options.textI18nKey;
					$scope.confirmationYes = _Labels.Yes;
					$scope.confirmationNo = _Labels.No;
					
					$scope.confirm = function () {
						if(options.callBackFn){
			        		options.callBackFn();
			        	}
						
						$modalInstance.close();
					};

					$scope.dismiss = function () {
						$modalInstance.dismiss();
						
					};
				}]
			});
		};
		return self;
	}]
);
	

