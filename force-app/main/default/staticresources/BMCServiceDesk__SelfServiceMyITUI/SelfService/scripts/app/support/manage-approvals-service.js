  angular.module('supportModule')
    .factory('manageApprovalService', ['$timeout', '$uibModal','$q','urlSanitizerService', 'errorDialogService','supportModel', 'manageApprovalsModel', '$sce',
      function ( $timeout,$uibModal,$q,urlSanitizerService, errorDialogService,supportModel, manageApprovalsModel, $sce) {

        var self = {};
        var manageApprovalState = {};
        var searchResultsAreLoading={};
		self.errorDialogService = errorDialogService;

        self.openItem = function (item) {
          if(item)
            self.showDialog(item);      
        };


        self.showReassignModal = function (item, arrApprovalReqIds) {
          var itemName = '';
          var itemID = '';
		  
		  if(item != null){
			  itemName = item.TargetObjectName;
			  itemID = item.TargetObjectId;
			  var processWorkItemId = item.Id;
		  } else {
			  var processWorkItemId = arrApprovalReqIds;
		  }
		  
		  var lastSelectedIndex = -1;
          var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
          return $uibModal.open({
            templateUrl: resourceUrl+'views/support/reassignRequest-modal.html',
            backdrop: 'static',
			ariaLabelledBy:'support-modal-header__title',
            controller: ['$location','$uibModalInstance','$scope','manageApprovalsModel', function ($location,$uibModalInstance,$scope,manageApprovalsModel) {   
              $scope.searchVar = {};
              $scope.searchVar.usersSearchText ='';
              $scope.showUsersTypeAheadDiv = true;

              $scope.selectOptionVal = function (optionVal) {
               $scope.searchVar.usersSearchText = optionVal.itemName;
               $scope.searchVar.usersSearchText= angular.element('<div>' + $scope.searchVar.usersSearchText + '</div>').text();
               $scope.selectedUserId = optionVal.itemId;
               $scope.showUsersTypeAheadDiv = false;
               $scope.searchResults = null;
              };

              $scope.getUsersOnFocus = function() {
              	if(!$scope.searchResults) {
              		$scope.getUsersBySearch($scope.searchVar.usersSearchText);
              	}
              }
			  $scope.showLabelsInDefaultLookupView = showLabelsInDefaultLookupView;
			  $scope.showLabelsInExpandedLookupView = showLabelsInExpandedLookupView;
              $scope.getUsersBySearch=function(searchStr,recordId){
            	  searchResultsAreLoading=true;  
            	  $scope.showUsersTypeAheadDiv = true;
                  $scope.selectedUserId = '';
                  $scope.searchResultsAreLoading=searchResultsAreLoading;
				  var fieldParam = {
						refObject: 'User', 
						searchText: searchStr,
						whereClause: 'IsActive = true AND UserType = \'Standard\'',
						showMore:'false',
						recordId: recordId
					};
                  self.getUsersBySearch(fieldParam).then(function(result){    
                     _.each(result.items, function (item) { 
                      if(!item.itemName)
                        item.itemName='';
                    });
                    $scope.searchResults = result;
                    $scope.approvalRequest = item;                    
                  })
                  ['finally'](function () {
                    $scope.searchResultsAreLoading=false;  
                  });
              };
              $scope.getUsersBySearch('');
              $scope.reassign = function (userId) {
                self.reassignRecord(processWorkItemId,userId).then(function(result){    
                  if(result = 'true')
                    {
                      displayReassignConfirmationModal(itemName,$scope.searchVar.usersSearchText);
                      self.getApprovals(manageApprovalsModel.currentPageNo, manageApprovalsModel.strRFObjectsAPIFieldSetPresent, manageApprovalsModel.strRFObjectsAPIName, manageApprovalsModel.strNonRFObjectsAPIFieldSetPresent).then(function(resp){
                      $scope.refreshResults(resp);
                    });
                    }
                    $scope.cancel();
                });
              };
              $scope.refreshResults = function (resp) {
                manageApprovalsModel.approvalItems = resp.Records;
                manageApprovalsModel.requests  = resp.Records;
                manageApprovalsModel.isPreviousEnabled = resp.isPreviousEnabled;
                manageApprovalsModel.isNextEnabled = resp.isNextEnabled;
                manageApprovalsModel.currentPageNo = resp.currentPageNo;
                manageApprovalsModel.totalPages = resp.totalPages;
				manageApprovalsModel.strRFObjectsAPIFieldSetPresent = resp.strRFObjectsAPIFieldSetPresent;
				manageApprovalsModel.strRFObjectsAPIName = resp.strRFObjectsAPIName;
				manageApprovalsModel.strNonRFObjectsAPIFieldSetPresent = resp.strNonRFObjectsAPIFieldSetPresent;
  	            
                manageApprovalsModel.dataLoading = false;
              };

              $scope.cancel = function () {
                dismissApprovalModal($uibModalInstance);
              };     
			  $scope.getMoreFields = function (index, recordId){
					var fieldParam = {
						refObject: 'User', 
						searchText: '',
						whereClause: 'ReassignLookup',
						showMore:'false',
						recordId: recordId
					};
					
                  self.getUsersBySearch(fieldParam).then(function(data){    
						$scope.searchResults[index].extraInfoList = data[0].extraInfoList;
						$scope.searchResults[index].showMore=false;
                    })
					['finally'](function () {
						$scope.searchResults[index].resultsAreLoading = false;
					});
				}
				$scope.expandLookupData = function(optionVal,index){
					$scope.searchResults[index].isShowMoreAvailable = true;
					if(typeof optionVal.extraInfoList == 'undefined' || optionVal.extraInfoList.length == 0){ 
						$scope.searchResults[index].resultsAreLoading = true;
						$scope.getMoreFields(index,optionVal.itemId);
					}else{
						$scope.searchResults[index].showMore=false;
					}
					var lastCollapsedDivHeight = 0;
					//collapse the previously opened item
					if(lastSelectedIndex != -1 && lastSelectedIndex != index){
						$scope.searchResults[lastSelectedIndex].showMore=true;
						lastCollapsedDivHeight = $('#outerDiv-'+lastSelectedIndex).height();
					}
					lastSelectedIndex = index;
					
					var scrollTo = $('#outerDiv-'+index);
					var container = scrollTo.closest('.srd-question-reference-container');
					$(container).animate({
						scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop() - lastCollapsedDivHeight
					}, 'fast');
				}
				$scope.collapseLookupData = function(itemId,index){
					$scope.searchResults[index].showMore=true;
				}
				$scope.selectRow = function(index){
					$scope.selectedRow = index;
				}
				$scope.getNumber = function(num) {
					return new Array(num);   
				}
				$scope.htmlUnescape = function(str){
					return supportModel.decodeText(str);
				}
            }],
            windowClass: 'modal_Action-Approvals'
          });
        };

        self.loadApprovalHistory = function(item) {
            var resourceUrl = $("a[id*='selfServiceResourcesUrl']").attr('href');
            return $uibModal.open({
                templateUrl: resourceUrl + 'views/support/approval-history.html',
                backdrop: 'static',
				ariaLabelledBy:'support-modal-header__title',
                controller: ['$uibModalInstance', '$scope', '$rootScope', function($uibModalInstance, $scope, $rootScope) {
                    manageApprovalState.isLoading = true;
                    $scope.manageApprovalState = manageApprovalState;
                    $scope.nodeApprovals;
                    self.getApprovalHistory(item.TargetObjectId).then(function(result) {
                        if (result) {
                            $scope.nodeApprovals = result;
                            var header = document.getElementById("tableheader");
                            var fixedtable = document.getElementById("fixedtable");
                            var sticky = header.offsetTop + 9;
                            $('#approvalHistoryDiv').on("scroll", function() { 
                            	// Setting the width for each fixed table header column
                            	$(fixedtable).find("th").each(function(index) {
                            		$(this).css("width", $(header).find("th")[index].getBoundingClientRect().width + "px");
                                });
                            	var offset = $(this).scrollTop();
                            	if (offset > sticky) {
                            		$(fixedtable).show();
	                        	} else {
	                        	    $(fixedtable).hide();
	                        	}
                        	});
                        } else {
                        	$scope.nodeApprovals = [];
                        }
                        $scope.approvalRequest = item;
                        $scope.manageApprovalState.isLoading = false;
                    });
                    $scope.cancel = function() {
                        dismissApprovalModal($uibModalInstance);
                    };
                }],
                windowClass: 'modal-approval-history'
            });
        }
		
		self.loadApprovalrecordDetails = function(item) {
           
            var resourceUrl = $("a[id*='selfServiceResourcesUrl']").attr('href');
            return $uibModal.open({
                templateUrl: resourceUrl + 'views/support/ShowApprovalRecord.html',
                backdrop: 'static',
                controller: ['$uibModalInstance', '$scope', '$rootScope', function($uibModalInstance, $scope, $rootScope) {
                    manageApprovalState.isLoading = true;
                    $scope.manageApprovalState = manageApprovalState;
                    $scope.nodeApprovals;
                    $scope.isDetailSectionCollapsed = false;
                    $scope.isAttachmentSectionCollapsed = true;
                    $scope.isNotesSectionCollapsed = true;
                    $scope.comments = {};
                    $scope.dataDetail={};
                    $scope.selectedItem = {};
                    $scope.attachmentData = { srId:'', 
                      attachments:[], 
                      isAttachmentRequired: false,
                      canHaveAttachments: false,
					  hideList: true
                    };
                    
                   
                    self.getSelectedApproval(item.TargetObjectId,item.TargetObjectType).then(function(result){
                      if(typeof(result) != 'undefined' && result != null && result.length > 0)
                      {              
                        $scope.selectedItem.selectedApproval = result;
                        $scope.approvalRequest = item;
                        
                      }
                      else
                      {
                       
                        var error = selfServiceLabels.InsufficientPrivilegeContactAdministrator;
                        $scope.supportModel.displayExceptionMessage(selfServiceLabels.errorPopupHeader, error, 5000);
                      }
					  $scope.manageApprovalState.isLoading = false;					  
                    }); 
                    
                    self.getNoteDetails(item.TargetObjectId,item.TargetObjectType).then(function(result){
                      $scope.comments = result;
                      $scope.manageApprovalState.isLoading = false;
                    });
                    $scope.resetSections = function(){
                      $scope.isDetailSectionCollapsed = true;
                      $scope.isAttachmentSectionCollapsed = true;
                      $scope.isNotesSectionCollapsed = false;
                      
                      }
                    $scope.goToRequestActivity = function () {
                      
                      $scope.dataDetail={};
                    };

                    $scope.showDetails = function (type, data) {
                      $scope.manageApprovalState.isLoading = true;
                      
                      $scope.dataDetail.type = type;
                      $scope.dataDetail.data = data;
                      $scope.manageApprovalState.isLoading = false;
                      $scope.isDetailSectionCollapsed = true;
                      $scope.isAttachmentSectionCollapsed = true;
                      $scope.isNotesSectionCollapsed = true;

                    };
                    $scope.attachmentData.srId = item.TargetObjectId;
                    self.getAttachmentDetails(item.TargetObjectId).then(function(result){
                      $scope.attachmentData.attachments = result;
                    });

                    $scope.cancel = function() {
                        dismissApprovalModal($uibModalInstance);
                    };
                    $scope.showHideDetailSection = function(type){
                        if(type == 'detail'){
                          $scope.isDetailSectionCollapsed = !$scope.isDetailSectionCollapsed;
                        }else if(type == 'attachment'){
                          $scope.isAttachmentSectionCollapsed = !$scope.isAttachmentSectionCollapsed;
                        }else if(type == 'note'){
                          $scope.isNotesSectionCollapsed = !$scope.isNotesSectionCollapsed;
                        }
                    }
                    $scope.reduceTheString = function(data){
                      if(data !== undefined && data != null && data != '' && data.length > 51){
                        data = data.substring(0, 51) + '...';
                      }
                      return data;
                    }
					$scope.htmlUnescape = function(str) {
						return supportModel.htmlUnescape(str);
					}
					$scope.to_trustURL = function(html_code) {
						if(html_code != undefined && html_code.indexOf('script') > -1) {
							return html_code;
						} else {
							return $scope.to_trusted(html_code);
						}
					}
					$scope.to_trusted = function(html_code) {
						return html_code?$sce.trustAsHtml($('<textarea />').html(html_code).text()):"";
					}

                }],
                windowClass: 'toggle-incident-modal-window'
            });
        }

        self.showApproveReject = function (item) {
        	var isMassApproveReject = false
        	if(item.Id) {
        		isMassApproveReject = (item.Id.split(',').length) > 1;
        	}
            self.showApproveRejectModal(item,isMassApproveReject);
        };
        
        self.showApproveRejectModal = function(item, isMassApproveReject) {
            var itemID = item.TargetObjectId;
            var lastSelectedIndex = -1;
            var resourceUrl = $("a[id*='selfServiceResourcesUrl']").attr('href');
            return $uibModal.open({
                templateUrl: resourceUrl + 'views/support/approve-reject-modal.html',
                backdrop: 'static',
				ariaLabelledBy:'support-modal-header__title',
                controller: ['$location', '$uibModalInstance', '$scope', 'manageApprovalsModel', '$rootScope', 'errorModel', function($location, $uibModalInstance, $scope, manageApprovalsModel, $rootScope, errorModel) {
                    $scope.manageApprovalState = manageApprovalState;
                    $scope.CommentLimitExceeded = '';
                    $scope.approvalRequest = item;
                    $scope.nextApproverIds ='';
                    $scope.isMassApproveReject = isMassApproveReject;
                    // Next approval
                    $scope.selectedUserId = '';
                    $scope.isNextApproverRequired = false;
                    $scope.searchVar = {};
                    $scope.searchVar.usersSearchText = '';
                    $scope.showLabelsInDefaultLookupView = showLabelsInDefaultLookupView;
                    $scope.showLabelsInExpandedLookupView = showLabelsInExpandedLookupView;
                    errorModel.clearAllErrors();
                    $scope.showUsersTypeAheadDiv = false;
                    
                    $scope.selectOptionVal = function(optionVal) {
                        $scope.searchVar.usersSearchText = optionVal.itemName;
                        $scope.searchVar.usersSearchText = angular.element('<div>' + $scope.searchVar.usersSearchText + '</div>').text();
                        $scope.nextApproverIds = optionVal.itemId;
                        $scope.showUsersTypeAheadDiv =false;
                        $scope.searchResults = null;
                    };
                    $scope.getUsersBySearch = function(searchStr, recordId) {
                        searchResultsAreLoading = true;
                        $scope.nextApproverIds = '';
                        $scope.searchResultsAreLoading = searchResultsAreLoading;
                        $scope.showUsersTypeAheadDiv = true;
                        var fieldParam = {
                            refObject: 'User',
                            searchText: searchStr,
                            whereClause: 'IsActive = true AND UserType = \'Standard\'',
                            showMore: 'false',
                            recordId: recordId
                        };
                        self.getUsersBySearch(fieldParam).then(function(result) {
                            _.each(result.items, function(item) {
                                if (!item.itemName)
                                    item.itemName = '';
                            });
                            $scope.searchResults = result;
                        })['finally'](function() {
                            $scope.searchResultsAreLoading = false;
                        });
                    };
                    $scope.getUsersOnFocus = function() {
                    	if(!$scope.searchResults) {
                    		$scope.getUsersBySearch($scope.searchVar.usersSearchText);
                    	}
                    }

                    $scope.getMoreFields = function(index, recordId) {
                        var fieldParam = {
                            refObject: 'User',
                            searchText: '',
                            whereClause: 'ReassignLookup',
                            showMore: 'false',
                            recordId: recordId
                        };

                        self.getUsersBySearch(fieldParam).then(function(data) {
                            $scope.searchResults[index].extraInfoList = data[0].extraInfoList;
                            $scope.searchResults[index].showMore = false;
                        })['finally'](function() {
                            $scope.searchResults[index].resultsAreLoading = false;
                        });
                    }
                    $scope.expandLookupData = function(optionVal, index) {
                        $scope.searchResults[index].isShowMoreAvailable = true;
                        if (typeof optionVal.extraInfoList == 'undefined' || optionVal.extraInfoList.length == 0) {
                            $scope.searchResults[index].resultsAreLoading = true;
                            $scope.getMoreFields(index, optionVal.itemId);
                        } else {
                            $scope.searchResults[index].showMore = false;
                        }
                        var lastCollapsedDivHeight = 0;
                        //collapse the previously opened item
                        if (lastSelectedIndex != -1 && lastSelectedIndex != index) {
                            $scope.searchResults[lastSelectedIndex].showMore = true;
                            lastCollapsedDivHeight = $('#outerDiv-' + lastSelectedIndex).height();
                        }
                        lastSelectedIndex = index;

                        var scrollTo = $('#outerDiv-' + index);
                        var container = scrollTo.closest('.srd-question-reference-container');
                        $(container).animate({
                            scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop() - lastCollapsedDivHeight
                        }, 'fast');
                    }
                    $scope.collapseLookupData = function(itemId, index) {
                        $scope.searchResults[index].showMore = true;
                    }
                    $scope.selectRow = function(index) {
                        $scope.selectedRow = index;
                    }
                    $scope.getNumber = function(num) {
                        return new Array(num);
                    }
                    $scope.htmlUnescape = function(str) {
                        return supportModel.decodeText(str);
                    }
                    
                    $scope.calculateExceedCharacter = function(comment) {
                        if (comment != undefined)
                            $scope.CommentLimitExceeded = $rootScope.selfServiceLabels.CommentLimitExceeded.replace('{0}', comment.length - 4000);
                    }
                    $scope.cancel = function() {
                        dismissApprovalModal($uibModalInstance);
                    };

                    $scope.approveRejectBtnClicked = function(itemName, itemID, comment, action) {
                        if (comment != undefined && comment.length > 4000) {
                            return false
                        }
                        manageApprovalState.isLoading = true;
                        self.setApprovalAction(itemID, action, comment, $scope.nextApproverIds).then(function(result) {
                        	$scope.manageApprovalState.isLoading = false;
                        	$scope.handleApproveRejectSuccessCallback(result, itemName, action);
                        	
                        }, $scope.handleApproveRejectFailureCallback);
                    };
                    
                    $scope.handleApproveRejectFailureCallback = function (event) {
                    	$scope.manageApprovalState.isLoading = false;
                    	var error={
							text : supportModel.htmlDecode(event.message),
							hide : "5000"
						};
						errorModel.clearAllErrors();
						errorModel.addModalError(error);
                    }
                    
                    $scope.handleApproveRejectSuccessCallback = function(result, itemName, actionName) {
                    	if(result.status) {
                            $scope.cancel();
                    		displayConfirmationModal(itemName, actionName);
                            manageApprovalsModel.dataLoading = true;
                            self.getApprovals(manageApprovalsModel.currentPageNo, manageApprovalsModel.strRFObjectsAPIFieldSetPresent, manageApprovalsModel.strRFObjectsAPIName, manageApprovalsModel.strNonRFObjectsAPIFieldSetPresent).then(function(resp) {
                                $scope.refreshResults(resp);
                            });
                    	} else {
                    		if(result.errorNextApprover) {
                    			var error={
    								text : supportModel.htmlDecode($rootScope.selfServiceLabels.ErrorMsgNextApprover),
    								hide : "5000"
    							};
                    			$scope.isNextApproverRequired = true;
    							errorModel.clearAllErrors();
    							errorModel.addModalError(error);
                    		} else {
                    			var error={
        								text : supportModel.htmlDecode($rootScope.selfServiceLabels.InsufficientPrivilegeContactAdministrator),
        								hide : "5000"
    							};
    							errorModel.clearAllErrors();
    							errorModel.addModalError(error);
                    		}
                    	}
                    }
                    
                    $scope.refreshResults = function(resp) {
                        manageApprovalsModel.approvalItems = resp.Records;
                        manageApprovalsModel.requests = resp.Records;
                        manageApprovalsModel.isPreviousEnabled = resp.isPreviousEnabled;
                        manageApprovalsModel.isNextEnabled = resp.isNextEnabled;
                        manageApprovalsModel.currentPageNo = resp.currentPageNo;
                        manageApprovalsModel.strRFObjectsAPIFieldSetPresent = resp.strRFObjectsAPIFieldSetPresent;
						manageApprovalsModel.strRFObjectsAPIName = resp.strRFObjectsAPIName;
						manageApprovalsModel.strNonRFObjectsAPIFieldSetPresent = resp.strNonRFObjectsAPIFieldSetPresent;
                        manageApprovalsModel.dataLoading = false;
                    };
                }],
                windowClass: 'modal_Action-Approvals'
            });
        }

        function dismissApprovalModal(uibModalInstance) {
          uibModalInstance.dismiss('cancel');
        }

        function displayConfirmationModal(ticketNo,action) {
          var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
          $uibModal.open({
            templateUrl: resourceUrl+'views/support/Approve-reject-modal-success.html',
            ariaDescribedBy: 'support-modal-header__description',
			ariaLabelledBy:'support-modal-header__title',
            controller: ['$timeout','$scope', '$uibModalInstance',
              function ($timeout,$scope, $uibModalInstance) {
                $scope.ticketNo = ticketNo;
                $scope.action = action;
                $timeout(function () {$uibModalInstance.dismiss('cancel');}, 5000);
              }
            ]
          });
        };

        function displayReassignConfirmationModal(ticketNo,userName) {
          var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
          $uibModal.open({
            templateUrl: resourceUrl+'views/support/reassign-modal-success.html',
            ariaDescribedBy: 'support-modal-header__description',
			ariaLabelledBy:'support-modal-header__title',
            controller: ['$timeout','$scope', '$uibModalInstance',
              function ($timeout,$scope, $uibModalInstance) {
                $scope.ticketNo = ticketNo;
                $scope.userName = userName;
                $timeout(function () {$uibModalInstance.dismiss('cancel');}, 5000);
              }
            ]
          });
        };

        self.getUsersBySearch=function (fieldParam){
            var deferred = $q.defer();  
               Visualforce.remoting.Manager.invokeAction(_RemotingActions.getReferenceFieldData,fieldParam,function(result, event) {
                if (event.status) { 
                  deferred.resolve(result);
                }else if(event.type == 'exception'){
                  displayExceptionMessage(selfServiceLabels.errorPopupHeader, event.message); 
                }
                else{
                  deferred.reject();
                }
              }); 
              return deferred.promise;  
          }

        function displayExceptionMessage( messagetype,message,timeout) {
			var errorDetails = {
						title : messagetype,
						titleI18nKey : messagetype,
						text : message,
						textI18nKey : message,
						timeout : timeout
					};
					self.errorDialogService.showDialog(errorDetails);
        };


        self.reassignRecord=function (recordId,userId){
          var deferred = $q.defer();  
		  
		  if(Array.isArray(recordId)){
			Visualforce.remoting.Manager.invokeAction(_RemotingActions.reassignForMultipleRequests,recordId,userId,null,function(result, event) {
              if (event.status) { 
                deferred.resolve(result);
              }else if(event.type == 'exception'){
                displayExceptionMessage(selfServiceLabels.errorPopupHeader, event.message); 
              }else{
                deferred.reject();
              }
            });
		  } else {
			Visualforce.remoting.Manager.invokeAction(_RemotingActions.callReassignRecord,recordId,userId,null,function(result, event) {
              if (event.status) { 
                deferred.resolve(result);
              }else if(event.type == 'exception'){
                displayExceptionMessage(selfServiceLabels.errorPopupHeader, event.message); 
              }else{
                deferred.reject();
              }
            });  
		  }
          return deferred.promise;  
        }



        self.getSelectedApproval=function (id){
          var deferred = $q.defer();  
             Visualforce.remoting.Manager.invokeAction(_RemotingActions.getSelectedApproval,id, null, function(result, event) {
              if (event.status) { 
                deferred.resolve(result);
              }else if(event.type == 'exception'){
                displayExceptionMessage(selfServiceLabels.errorPopupHeader, event.message); 
              }else{
                deferred.reject();
              }
            }); 
            return deferred.promise;  
        }
        
        self.getApprovalHistory = function(recordId) {
            var deferred = $q.defer();
            Visualforce.remoting.Manager.invokeAction(_RemotingActions.getApprovalHistory, recordId, null, function(result, event) {
                if (event.status) {
                    deferred.resolve(result);
                } else if (event.type == 'exception') {
                    displayExceptionMessage(selfServiceLabels.errorPopupHeader, event.message);
                } else {
                    deferred.reject();
                }
            });
            return deferred.promise;
        }
		self.getAttachmentDetails = function(selectedObjId){
          var deferred = $q.defer();
          Visualforce.remoting.Manager.invokeAction(_RemotingActions.getAttachmentlist,selectedObjId, null, function(result,event) {
            if (event.status) { 
              
              deferred.resolve(result);
            }else{
              deferred.reject();
            }
          });
          return deferred.promise;  
        }
        self.getNoteDetails = function(selectedId,objectType){
          var deferred = $q.defer();
          Visualforce.remoting.Manager.invokeAction(_RemotingActions.getActionHistory,selectedId,objectType, null, function(result, event) {
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
        self.getApprovals=function (currentPageNo, strRFObjectsAPIFieldSetPresent, strRFObjectsAPIName, strNonRFObjectsAPIFieldSetPresent){
          var deferred = $q.defer();
		  var requests;
		  var additionalParam = {};
		  additionalParam.currentPageNo = currentPageNo;
		  additionalParam.strRFObjectsAPIFieldSetPresent = strRFObjectsAPIFieldSetPresent;
		  additionalParam.strRFObjectsAPIName = strRFObjectsAPIName;
		  additionalParam.strNonRFObjectsAPIFieldSetPresent = strNonRFObjectsAPIFieldSetPresent;
             Visualforce.remoting.Manager.invokeAction(_RemotingActions.manageApprovals, additionalParam, function(result, event) {
              if (event.status) { 
				  requests = self.handleResponse(result);
                  deferred.resolve(requests);
              }else if(event.type == 'exception'){
                displayExceptionMessage(selfServiceLabels.errorPopupHeader, event.message); 
              }else{
                deferred.reject();
              }
            }); 
            return deferred.promise;  
        }
		self.handleResponse = function(result){
			var result = angular.element('<div>' + supportModel.htmlUnescape(unescape(result)) + '</div>').text();
			var resultData = eval("("+result+")");
			
			var result = resultData.Records;
			var requestData = {};
			var requests=[];
			requestData.isNextEnabled = resultData.isNextEnabled;
			requestData.isPreviousEnabled = resultData.isPreviousEnabled;
			requestData.currentPageNo = resultData.currentPageNo;
			requestData.totalPages = resultData.totalPages;
			requestData.strRFObjectsAPIFieldSetPresent = resultData.strRFObjectsAPIFieldSetPresent;
			requestData.strRFObjectsAPIName = resultData.strRFObjectsAPIName;
			requestData.strNonRFObjectsAPIFieldSetPresent = resultData.strNonRFObjectsAPIFieldSetPresent;
			
			for (var i = 0, l = result.length; i < l; i++) {
			  var item = result[i];
			  var request={};
			  request.Id = item[0];
			  request.TargetObjectId = item[1];
			  request.TargetObjectName = item[2];
			  request.TargetObjectType = item[3];
			  request.Actorname = item[5];
			  request.CreatedBy = item[6];
			  request.CreatedDateTime = item[8].split(' ');
			  if(request.CreatedDateTime.length == 3)
				{
				  request.CreatedDate = request.CreatedDateTime[0];
				  request.CreatedTime = request.CreatedDateTime[1]+ ' ' + request.CreatedDateTime[2];
				}
			  else if(request.CreatedDateTime.length == 2)
				{
				  request.CreatedDate = request.CreatedDateTime[0];
				  request.CreatedTime = request.CreatedDateTime[1];
				}
			  request.SubmitedDate = item[8];
			  if (request.CreatedDate.split(" ")[0] == todayDateVal.split(" ")[0]) {
				  request.isToday = true;
				  request.relativeDateLabel = selfServiceLabels.today;
			  }
			  // if previous item's date differs from current item's, set a flag
			  if (!result[i - 1] || result[i - 1][8].split(" ")[0] != request.CreatedDate) {
				request.isFirstInGroup = true;
			  }

			  // if next item's date differs from current item's, set a flag
			  if (!result[i + 1] || result[i + 1][8].split(" ")[0] != request.CreatedDate) {
					request.isLastInGroup = true;
				}
				
				//item[9]  object API name...
				if(requestData.strRFObjectsAPIName != null && requestData.strRFObjectsAPIName.indexOf(item[9]) !== -1) {
					request.isNonRFObject = false;
					if(requestData.strRFObjectsAPIFieldSetPresent != null && requestData.strRFObjectsAPIFieldSetPresent.indexOf(item[9]) !== -1){
						request.isRFObjectFieldSetPresent = true;
					} else {
						request.isRFObjectFieldSetPresent = false;
					}
				} else {
					request.isNonRFObject = true;
				}
				
				if(requestData.strNonRFObjectsAPIFieldSetPresent != null && requestData.strNonRFObjectsAPIFieldSetPresent.indexOf(item[9]) !== -1){
					request.isNonRFObjectFieldSetPresent = true;
				} else {
					request.isNonRFObjectFieldSetPresent = false;
				}
				
				//item[10] check User record accessibility...
				if(item[10] == 'true'){
					request.isRecordAccessible = true;
				} else {
					request.isRecordAccessible = false;
				}
				
				requests.push(request);
			}
			requestData.Records = requests;
			
			manageApprovalsModel.resetMassActionBtnValues();
			
			return requestData;
		}
		
		self.setApprovalAction = function(itemID, action, comment, nextApproverIds) {
		    var deferred = $q.defer();
		    if (!comment) comment = '';
		    var additionalParam = {};
		    if (nextApproverIds) {
		        additionalParam = {
		            'nextApproverIds': nextApproverIds
		        };
		    }
		    Visualforce.remoting.Manager.invokeAction(_RemotingActions.performMassApproveReject, itemID, action, comment, additionalParam, function(result, event) {
		        if (event.status) {
		            deferred.resolve(result);
		        } else {
		            deferred.reject(event);
		        }
		    });
		    return deferred.promise;
		}
        
        return self;
      }]
    );  