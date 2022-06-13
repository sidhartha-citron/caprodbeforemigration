  angular.module('supportModule')
    .controller('manageApprovalsController', ['manageApprovalsModel', '$modal', '$scope', '$state', 'supportModel','manageApprovalService','$sce','srDetailsService',
      function (manageApprovalsModel,  $modal, $scope, $state, supportModel,manageApprovalService, $sce, srDetailsService) {
        $scope.selectedItem = {};
          $scope.manageApprovalsModel = manageApprovalsModel;
          $scope.supportModel = supportModel;
          $scope.showApprovalHistory = showApprovalHistory;
		  $scope.showRecordDetail = showRecordDetail;
          var manageApprovalState = {};
          manageApprovalsModel.resetManageApprovalData();
		  $scope.getManageApprovals = function() {
			  manageApprovalService.getApprovals($scope.manageApprovalsModel.currentPageNo, $scope.manageApprovalsModel.strRFObjectsAPIFieldSetPresent, $scope.manageApprovalsModel.strRFObjectsAPIName, $scope.manageApprovalsModel.strNonRFObjectsAPIFieldSetPresent)
					.then(function (items) {
	      	            $scope.manageApprovalsModel.dataLoading = false;
	      	            $scope.manageApprovalsModel.approvalItems = items.Records;
	      	            $scope.manageApprovalsModel.requests = items.Records;
	      	            $scope.manageApprovalsModel.isPreviousEnabled = items.isPreviousEnabled;
	      	            $scope.manageApprovalsModel.isNextEnabled = items.isNextEnabled;
	      	            $scope.manageApprovalsModel.currentPageNo = items.currentPageNo;
	      	            $scope.manageApprovalsModel.totalPages = items.totalPages;
						$scope.manageApprovalsModel.strRFObjectsAPIFieldSetPresent = items.strRFObjectsAPIFieldSetPresent;
						$scope.manageApprovalsModel.strRFObjectsAPIName = items.strRFObjectsAPIName;
						$scope.manageApprovalsModel.strNonRFObjectsAPIFieldSetPresent = items.strNonRFObjectsAPIFieldSetPresent;
			  });
		  }
		  $scope.getManageApprovals();
          $scope.openItem = function (item) {
          var itemID = item.TargetObjectId;
          var hashKey = item.$$hashKey;
          var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
          item.dataLoading = true;
              $scope.manageApprovalState=manageApprovalState;
              manageApprovalService.getSelectedApproval(itemID).then(function(result){
        	  item.dataLoading = false;
              if(typeof(result) != 'undefined' && result != null && result.length > 0){              
                result.hashKey = hashKey;
                $scope.selectedItem.selectedApproval = result;
                $scope.approvalRequest = item;
                }
                else
                {
                  $scope.selectedItem.selectedApproval.hashKey = '';
                  $scope.selectedItem.selectedApproval.itemID = '';
				  var error = selfServiceLabels.InsufficientPrivilegeContactAdministrator;
				  $scope.supportModel.displayExceptionMessage(selfServiceLabels.errorPopupHeader, error, 5000);
                }                             
              });
              return true;
          };

		$scope.goToNextPage = function() {
			$scope.manageApprovalsModel.currentPageNo = $scope.manageApprovalsModel.currentPageNo + 1;
			$scope.changePage();
		}
			
		$scope.goToPrevPage = function() {
		    $scope.manageApprovalsModel.currentPageNo = $scope.manageApprovalsModel.currentPageNo - 1;
		    $scope.changePage();
		}

		$scope.goToFirstPage = function() {
			$scope.manageApprovalsModel.currentPageNo = 1;
			$scope.changePage();
		}
			
		$scope.goToLastPage = function() {
		    $scope.manageApprovalsModel.currentPageNo = $scope.manageApprovalsModel.totalPages;
		    $scope.changePage();
		}
		
		$scope.changePage = function() {
			$scope.manageApprovalsModel.dataLoading = true;
		    $scope.manageApprovalsModel.isPreviousEnabled = false;
            $scope.manageApprovalsModel.isNextEnabled = false;
            manageApprovalsModel.requests = [];
		    $scope.getManageApprovals();
		}
          $scope.approveRejectSelectedApproval = function(item){
            if(item){
              manageApprovalService.showApproveReject(item);

            }
          }

          $scope.reassignSelectedApproval = function(item){
            if(item){
              manageApprovalService.showReassignModal(item, null);

            }
          }
          
          $scope.loadApprovalHistory = function(item) {
        	  if(item) {
        		  manageApprovalService.loadApprovalHistory(item);
        	  }
          }
		  
		  $scope.showDialog = function(item) {
        	  if(item) {
				  if(typeof(item.TargetObjectType) !== 'undefined' && (item.TargetObjectType == selfServiceLabels.IncidentLabel || item.TargetObjectType == selfServiceLabels.ServiceRequestLabel)) {
					srDetailsService.showDialog({
							srId: item.TargetObjectId,
							parentScope: $scope,
							isRequest: ( (typeof(item.TargetObjectType) !== 'undefined' && item.TargetObjectType == selfServiceLabels.ServiceRequestLabel) ? true : false ),
							isTicket: ( (typeof(item.TargetObjectType) !== 'undefined' && item.TargetObjectType == selfServiceLabels.IncidentLabel) ? true : false ),
							isDisableEdit: true
						});
				  } else {
					  manageApprovalService.loadApprovalrecordDetails(item);
				  }
        	  }
          }
          
          $scope.to_trustURL = function(html_code) {
            if(html_code != undefined && html_code.indexOf('script') > -1) {
              return html_code;
            } else
              return $scope.to_trusted(html_code);
          }
          $scope.to_trusted = function(html_code) {
			    return html_code?$sce.trustAsHtml($('<textarea />').html(html_code).text()):"";
			};

		  $scope.showHideDetails = function(activityItem){
			if($scope.selectedItem.selectedApproval == undefined || $scope.selectedItem.selectedApproval.hashKey == '0'){
				$scope.openItem(activityItem); 
			}else{
				$scope.selectedItem.selectedApproval.hashKey ='0';
			}
		  }
		  
		  $scope.selectAll = function() {
			  manageApprovalsModel.disableSelectAllBtn = true;
			  manageApprovalsModel.disableClearAllBtn = false;
			  manageApprovalsModel.disableReassignBtn = false;
			  manageApprovalsModel.disableApproveRejectBtn = false;
			  
			  _.each(manageApprovalsModel.requests, function(item){
				  item.selected = true;
				  item.checkboxClass = 'checkmark checkmark-checked';
				  if(typeof(item.isRecordAccessible) != 'undefined' && item.isRecordAccessible == false){
				  	manageApprovalsModel.disableApproveRejectBtn = true;
				  }
			  });
		  }
		  
		  $scope.clearAll = function() {
			  manageApprovalsModel.disableSelectAllBtn = false;
			  manageApprovalsModel.disableClearAllBtn = true;
			  manageApprovalsModel.disableReassignBtn = true;
			  manageApprovalsModel.disableApproveRejectBtn = true;
			  _.each(manageApprovalsModel.requests, function(item){
				  item.selected = false;
				  item.checkboxClass ='checkmark';
			  });
		  }
		  
		  $scope.approvalCheckBoxClicked = function(chekboxItem) {
			  var isAllItemSelected = true;
			  var isAnyItemSelected = false;
			  var isAnyItemSelectedNotAccessible = false;
			 if(chekboxItem.selected) {
			   chekboxItem.selected = false;
			   chekboxItem.checkboxClass ='checkmark';
			 } else {
			   chekboxItem.selected = true;
			   chekboxItem.checkboxClass = 'checkmark checkmark-checked';
			 } 
			  
			  _.each(manageApprovalsModel.requests, function(item){
				  if(item.selected == true){
				  	isAnyItemSelected = true;
					if(typeof(item.isRecordAccessible) != 'undefined' && item.isRecordAccessible == false){
						isAnyItemSelectedNotAccessible = true;
					}
				  } else {
					isAllItemSelected = false;
				  }
			  });
			  
			  manageApprovalsModel.disableSelectAllBtn = isAllItemSelected;
			  manageApprovalsModel.disableClearAllBtn = !isAnyItemSelected;
			  manageApprovalsModel.disableReassignBtn = !isAnyItemSelected;
			  manageApprovalsModel.disableApproveRejectBtn = (!isAnyItemSelected || isAnyItemSelectedNotAccessible) ? true : false;
		  }
		  
		  $scope.massApproveReject = function() {
			  var processIds = [];
			  var approvalRecord;
			  _.each(manageApprovalsModel.requests, function(item){
				  if(item.selected) {
					  processIds.push(item.Id);
					  approvalRecord = item;
				  }
			  });
			  
			  if(processIds.length > 1) {
				  approvalRecord = {Id : processIds.join()};
			  }
			  manageApprovalService.showApproveReject(approvalRecord);
		  }
		  
		  $scope.massReassign = function(){
			  var arrApprovalRequestIds = [];
			  _.each(manageApprovalsModel.requests, function (request) { 
				  if(typeof(request.selected) != 'undefined' && request.selected == true){
					  arrApprovalRequestIds.push(request.Id);
				  }
				});
				manageApprovalService.showReassignModal(null, arrApprovalRequestIds);
		  }
		  
		  $scope.isLinkVisible = function(activityItem, flag){
			  
			  if(flag == 'show-record' && (activityItem.isRecordAccessible == true && activityItem.isRFObjectFieldSetPresent == true)){
				  return true;
			  }
			  
			  if(flag == 'record-accessible' && activityItem.isRecordAccessible == true){
				  return true;
			  }
			  
			  if(flag == 'show-detail' && activityItem.isRecordAccessible == true && (activityItem.isRFObjectFieldSetPresent == true || activityItem.isNonRFObjectFieldSetPresent == true)){
				  return true;
			  }
			  
			  if(flag == 'show-record-non-rf-object' && activityItem.isNonRFObject == true){
				  return true;
			  }
			  
			  return false;
		  }
        }
    ]);
