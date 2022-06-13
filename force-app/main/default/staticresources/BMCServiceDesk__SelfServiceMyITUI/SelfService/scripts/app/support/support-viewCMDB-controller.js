  angular.module('supportModule')
    .controller('viewCMDBController', ['viewMyAssetsCIModel', '$uibModal', '$scope', '$state', 'supportModel','viewCMDBService', 'incidentCreateService', '$sce',
      function (viewMyAssetsCIModel,  $uibModal, $scope, $state, supportModel,viewCMDBService, incidentCreateService, $sce) {
        $scope.selectedItem = {};
          $scope.viewMyAssetsCIModel = viewMyAssetsCIModel;
          $scope.supportModel = supportModel;
		  $scope.selectedItem = {};
		  $scope.isPreviousEnabled = false;
		  $scope.isNextEnabled = false;
		  $scope.isShowDetailLoading = false;
		  $scope.currentPageNo = 1;
		  $scope.lastExpandedBEIndex = -1;
		  $scope.viewMyAssetsCIModel.currentPageNo = ($state.params.currentPageNo) ? parseInt($state.params.currentPageNo) : 1;
		  
		  $scope.viewMyAssetsCIModel.getAllAssetsAndCIs($scope.currentPageNo)
				.then(function (items) {
				  $scope.viewMyAssetsCIModel.data = processResponse(items);
		  });
		  
			$scope.openSubmitATicketModel =  function(beId, beName) {
				//$state.go(state);
				incidentCreateService.showSupportSrdCreateDialog('',beId, beName);
			};
			$scope.goToStateReatedTickets = function(state, beId, beName) {
				$state.go(state, {beId: beId, beName: encodeURIComponent(beName), pageNo : $scope.currentPageNo });
				
			}; 
			
			$scope.goToNextPage = function () {				
				$scope.viewMyAssetsCIModel.currentPageNo=$scope.viewMyAssetsCIModel.currentPageNo+1;
				$scope.lastExpandedBEIndex = -1;
				$scope.viewMyAssetsCIModel.getAllAssetsAndCIs().then(function (items) {$scope.viewMyAssetsCIModel.data = processResponse(items)});
			};
			$scope.goToPrevPage = function () {					
				$scope.viewMyAssetsCIModel.currentPageNo=$scope.viewMyAssetsCIModel.currentPageNo-1;
				$scope.lastExpandedBEIndex = -1;
				$scope.viewMyAssetsCIModel.getAllAssetsAndCIs().then(function (items) {$scope.viewMyAssetsCIModel.data = processResponse(items)});
			};
		$scope.goHome = function () {					
					$state.go('support');
		};
		  if (!String.prototype.endsWith) {
			  String.prototype.endsWith = function(searchString, position) {
				  var subjectString = this.toString();
				  if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
					position = subjectString.length;
				  }
				  position -= searchString.length;
				  var lastIndex = subjectString.indexOf(searchString, position);
				  return lastIndex !== -1 && lastIndex === position;
			  };
		  }
		  function processResponse(result){
			  $scope.viewMyAssetsCIModel.dataLoading = true;
			  var columnInfoList = result.headerInfo;
			  $scope.currentPageNo = $scope.viewMyAssetsCIModel.currentPageNo;
			  var feedItems=[];
			  $scope.isPreviousEnabled = result.isPreviousEnabled;
			  $scope.isNextEnabled = result.isNextEnabled;
			  _.each(result.recordInfo,function(record,keyRecord){
				 var fieldsToDisplay=[];
				 var extraFields=[];
				 var feedData={};	
				 var rowData = record;
				 _.each(record,function(value,key){
				if(value != ''){
					if(key.endsWith("__Name__c") ){
						feedData['feedText'] = value;
						feedData['title']=value;
					} else if(key.indexOf('Id')>-1 && key != 'OwnerId' && key != 'CreatedById' && key != 'LastModifiedById' && key != 'RecordTypeId'){ 
						feedData['id']=value;
						feedData['srId']=value;
					} else {
						var fieldInfo = processField(rowData,columnInfoList,value,key);
						if(!isEmpty(fieldInfo))
							fieldsToDisplay.push(fieldInfo);
						//fieldsToDisplay.push(processField(rowData,columnInfoList,value,key));
					}
				}
			  });
				feedData['dynamicFields']=fieldsToDisplay;	
				feedData['showMore']=false;
				feedItems.push(feedData);	
			});
			$scope.viewMyAssetsCIModel.dataLoading = false;
			return feedItems;			
		  }
		$scope.showDetails = function(index,record){
			if($scope.lastExpandedBEIndex != -1 && $scope.lastExpandedBEIndex != index){
				$scope.viewMyAssetsCIModel.data[$scope.lastExpandedBEIndex].showMore = false;
			}
			$scope.lastExpandedBEIndex = index;
			var recordId = record.id;
			var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
			if(typeof $scope.viewMyAssetsCIModel.data[index].extraFields != 'undefined' && $scope.viewMyAssetsCIModel.data[index].extraFields.length > 0){
				$scope.viewMyAssetsCIModel.data[index].showMore = true;
			}else{
				$scope.viewMyAssetsCIModel.recordDataLoading = true;
				$scope.viewMyAssetsCIModel.getCMDBDetails(recordId)
					.then(function (result) {
						if(typeof(result) != 'undefined' && result != null){
							//result.hashKey = hashKey;
							var columnInfoList = result.headerInfo;
							var extraFields = [];
							_.each(result.recordInfo,function(value,key){
								if(value != ''){
									var fieldInfo = processField(result.recordInfo,result.headerInfo,value,key)
										if(!isEmpty(fieldInfo))
											extraFields.push(fieldInfo);
								}
							});
							$scope.viewMyAssetsCIModel.data[index].extraFields = extraFields;
							$scope.viewMyAssetsCIModel.data[index].showMore = true;
							$scope.viewMyAssetsCIModel.recordDataLoading = false;
						} 
			  });	
			}
		};
		
		$scope.showHideDetails = function(index,record){
			if($scope.viewMyAssetsCIModel.data[index].showMore == false){
				$scope.showDetails(index,record);
			}else{
				$scope.viewMyAssetsCIModel.data[index].showMore = false;
			}
		}
		
		function processField(rowData,columnInfoList,value,key){
			var fieldInfo = {};
			var columnInfo = columnInfoList[key];
			if (columnInfo != undefined && ( columnInfo.colDataType != "REFERENCE" || (columnInfo.colDataType == "REFERENCE" && key.indexOf('__r')<=-1))) {
				fieldInfo.type = columnInfo.colDataType;
				fieldInfo.label = columnInfo.colLabel;
				fieldInfo.key = key;

				if(fieldInfo.type == "REFERENCE"){
					var referenceKey=key.replace('__c','__r');
					if (key == 'OwnerId') {referenceKey = 'Owner';}													
					else if (key == 'CreatedById') {referenceKey = 'CreatedBy';}
					else if (key == 'LastModifiedById') {referenceKey = 'LastModifiedBy';}
					if(rowData[referenceKey].Name) {
						fieldInfo.value = rowData[referenceKey].Name;
					}
				} else if (fieldInfo.type == "STRING") {
					fieldInfo.type = "TEXTAREA";
					fieldInfo.value = value;
				} else if (fieldInfo.type == "FORMULA" || fieldInfo.type == "RICHTEXTAREA") {
						value = value.replace(/&quot;/g, '"');
						value = value.replace(/&#39;/g, "'");
						value = value.replace(/&lt;/g, '<');
						value = value.replace(/&gt;/g, '>');
						value = value.replace(/&amp;/g, '&');
						fieldInfo.value=value;
				} else if (fieldInfo.type == "URL") {
						fieldInfo.value=value.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/(http[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
				} else {
						fieldInfo.value=value;
				}
			}
			return fieldInfo;
		}
		
		function isEmpty(obj) {
			for(var key in obj) {
				if(obj.hasOwnProperty(key))
					return false;
			}
			return true;
		}
		$scope.to_trusted = function(html_code) {
			return html_code?$sce.trustAsHtml($('<textarea />').html(html_code).text()):"";
		};
		$scope.to_trustedHTML = function(html_code) {
			return $sce.trustAsHtml(html_code);
		};
	  }  
    ]);
