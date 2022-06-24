
	angular.module('profileModule')
		.controller('ProfileController', ProfileController);

	ProfileController.$inject = ['$filter','$modal', 'profileModel','activityStreamModel','errorDialogService',
		'$q', '$scope', 'srDetailsService', 'supportModel', '$timeout', 'userModel','$state','$location','$rootScope','supportService'];

	function ProfileController($filter, $modal, profileModel,activityStreamModel, errorDialogService, $q,
		 $scope, srDetailsService, supportModel, $timeout, userModel,$state,$location,$rootScope,supportService) {
		var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
		$scope.selectedElementIndex = -1;
		var statusVsStateMap = JSON.parse(statusVsStateJSON);
		// default values
		var defaultStatus = $.cookie("selectedStatus");
		if(!showStatus || typeof defaultStatus == 'undefined'){
			defaultStatus = 'all';
		}
		var defaultState = $.cookie("selectedState");
		if(!showState || typeof defaultState == 'undefined'){
			defaultState = 'All';
		}
		var defaultRecords = $.cookie("selectedRecords");
		if(typeof defaultRecords == 'undefined'){
			defaultRecords = 'All';
		}
		var csvDataList = []; 
		$scope.isCsvCreation = false;
		$scope.supportServiceModel = supportService;
		var profileCtrlState = {
				showSuperbox: true,
				timelineLoadingFlagsByType: {},
				currentTimelineFilter: {},
				isScopeDestroyed: false,
				quickRequestEnabled: false,
				quickIncidentEnabled: false,
				currentPageNo:1,
				filterByField:'',
				searchStr:'',
				records:defaultRecords,
				showSearchDiv:false,
				showFilterDiv:false,
				status:defaultStatus,
				state:defaultState,
				relevantStatusValues:[],
				beId:'',
				beName: ''
			},
			activityStreamRefreshTimeout;
		$scope.currentPageNo = profileCtrlState.currentPageNo;
		$scope.showStatus = showStatus;
		$scope.showState = showState;
		$scope.isRelatedTicketsLoading = false;
		$scope.isCsvEnabled = true;
		$scope.ciTabPageNo = 0;
        var templateUrls={
			filterUrl:resourceUrl+'views/profile/timeline-toolbar-filter.html',
			srFilter:resourceUrl+'views/social/service-request-filter.html'
		};
		//$scope.followingModel = followingModel;
		$scope.activityStreamModel = activityStreamModel;
		$scope.profileModel = profileModel;
		$scope.userModel = userModel;
		$scope.templateUrls=templateUrls;
		$scope.isSelfActivity = true;
		$scope.activityStreamModel.isSelfActivity=true;
		$scope.searchStr = '';
		//$scope.pageBreadcrumbsModel = pageBreadcrumbsModel;
	//	$scope.locationModel = locationModel;
		$scope.showMyProfile = showMyProfile;
		$scope.showMyProfileModal = function(sourceId){
			if($scope.showMyProfile){
				userModel.showClientFormDialog(null, sourceId);
			}
		};
		$scope.timelineFilterItems = [
			{
				id: 'Tickets',
				type: 'appointment',
				iconClass: 'incidentFilterIcon',
				enabled: true,
				name:selfServiceLabels.Tickets
			},
			{
				id: 'Requests',
				type: 'request',
				iconClass: 'SRFilterIcon',
				enabled: true,
				name:selfServiceLabels.ServiceRequests
			}		
		];
		$scope.uploadClick = function(e) {
            profileModel.openProfileImageUploadModel();
 	    }
		$scope.profileCtrlState = profileCtrlState;
		//profileCtrlState.srFilterStatuses = activityStreamModel.serviceRequestFilter.filterByStatus;
		profileCtrlState.isNewSrFilterStatusSelected = false;
		
		$scope.goToNextPage = function () {				
			$scope.currentPageNo=$scope.currentPageNo+1;
			$scope.refreshActivityStream($scope.isSelfActivity,$scope.currentPageNo,null,null,$scope.$stateParams.searchStr);
			if($('#activity-stream-all')){
				$('#activity-stream-all').focus();
			}
		};
		$scope.goToPrevPage = function () {					
			$scope.currentPageNo=$scope.currentPageNo-1;
			$scope.refreshActivityStream($scope.isSelfActivity,$scope.currentPageNo,null,null,$scope.$stateParams.searchStr);
			if($('#activity-stream-all')){
				$('#activity-stream-all').focus();
			}
		};
		$scope.goHome = function () {					
					$state.go('support');
		};
		$scope.goToDrafts = function () {					
			$state.go('support.draft-requests.all');
		};
		$scope.goBack = function (state) {					
			$state.go(state, {currentPageNo : $scope.ciTabPageNo});
		};
		$rootScope.$on("refreshActivityStream", function(){
			profileCtrlState.beId = ($scope.$stateParams.beId != undefined) ? $scope.$stateParams.beId : '';
			$scope.refreshActivityStream($scope.isSelfActivity,$scope.currentPageNo, null,null,$scope.$stateParams.searchStr);
		});
		function init() {
			/*supportModel.getSrdSettings()
				.then(processSrdSettings);*/
			// set search string from state params
			$scope.profileCtrlState.searchStr = $scope.$stateParams.searchStr;
			// If no filter is present, or it is pointing to disabled feature - destroy the filter
			if (!profileCtrlState.currentTimelineFilter
				|| profileCtrlState.currentTimelineFilter && !profileCtrlState.currentTimelineFilter.enabled) {
				destroyCurrentTimelineFilter();
			}
			
			if($scope.$stateParams.activityTab == 'Requets')
				profileCtrlState.filterByField='isRequest';
			else
				profileCtrlState.filterByField='isTicket';
			
			if($state.params.beId && $state.params.beName && $state.params.pageNo){
				profileCtrlState.beId = $state.params.beId;
				profileCtrlState.beName = decodeURIComponent($state.params.beName);
				$scope.ciTabPageNo = $state.params.pageNo;
			}
			
			var idParam = $location.search().id;
			if(idParam){
				Visualforce.remoting.Manager.invokeAction(_RemotingActions.incidentDetails,idParam,function (result,event) {
					
					if(event.status){ 
					
						if(result.toUpperCase()=='INC')
							showSrDetailsModalWithSR(idParam,'INC');
						
						
						else if(result.toUpperCase()=='SR')
							showSrDetailsModalWithSR(idParam,'SR');
						
						else {
							errorDialogService.showDialog({
								title:selfServiceLabels.Error,
								text: selfServiceLabels.ErrorLoadingFeedbackForm,
								timeout: 10000,
							});
						}
					}
				},{escape: true});
			}
			
			profileModel.getProfileData(userModel.userId)
				.then(function () {
					if($('#backLink')){
						$('#backLink').focus();
					}
					if (profileModel.user) {
					/*	pageBreadcrumbsModel.setItems([
							{ label: $scope.profileModel.user.displayName }
						]);*/
					}
				});

			loadProfileImage();

			/*userModel.getUserPreferences()
				.then(userModel.updateHomeLocationInfo);*/

			/*followingModel.getFollowingList()
				.then(function (followingList) {
					profileCtrlState.followingList = followingList;
				});*/

			//activityStreamModel.clearCacheForElement('user', userModel.userId);
			$scope.refreshActivityStream($scope.isSelfActivity,$scope.currentPageNo, null,null,$scope.$stateParams.searchStr); 

			$scope.$on('myit.appointment.create', function () {
				$scope.refreshActivityStream($scope.isSelfActivity,$scope.currentPageNo, null,null,$scope.$stateParams.searchStr);
			});

			$scope.$on('$destroy', function () {
				profileCtrlState.isScopeDestroyed = true;
				destroyActivityStreamRefreshTimeout();
			});

			// if SR ID passed - run it
			if ($scope.$stateParams.requestId) {
				showSrDetailsModal($scope.$stateParams.requestId);
			}
		}


		function processSrdSettings() {
			profileCtrlState.quickRequestEnabled = supportModel.srdSettings.quickRequestEnabled;
			profileCtrlState.quickIncidentEnabled = supportModel.srdSettings.quickIncidentEnabled;
		}



		function startActivityStreamRefreshTimeout() {
			/*if (profileCtrlState.isScopeDestroyed) { return; }
			destroyActivityStreamRefreshTimeout();
			activityStreamRefreshTimeout = $timeout($scope.refreshActivityStream, $scope.timelineRefreshTimeout);*/
		}


		function destroyActivityStreamRefreshTimeout() {
			$timeout.cancel(activityStreamRefreshTimeout);
		}


		/**
		 * Runs SR by ID
		 * @param id
		 * @returns {*} modal promise
		 */
		function showSrDetailsModal(id) {
			return srDetailsService.showDialog({
				srId: id,
				parentScope: $scope
			}).result
				.finally(function (response) {
					// requestId is removed from URL to prevent reopening of SR when user navigates to another profile tab
					$scope.$stateParams.requestId = null;

					return response;
				});
		}

		/**
		 * Runs SR by ID
		 * @param id
		 * @returns {*} modal promise
		 */
		function showSrDetailsModalWithSR(id,type) {
			return srDetailsService.showDialog({
				srId: id,
				parentScope: $scope,
				isRequest: type=='SR'?true:undefined, 
				isTicket: type=='INC'?true:undefined
			});
		}

		/**
		 * Apply selected filter option
		 * @param index index of the option
		 */
		$scope.applySrFilter = function (index) {
			var selectedFilterStatus = profileCtrlState.srFilterStatuses[index];
			if (selectedFilterStatus) {
				selectedFilterStatus.enabled = !selectedFilterStatus.enabled;
			}
			profileCtrlState.isNewSrFilterStatusSelected = true;
			//activityStreamModel.saveServiceRequestFilterToLocalStorage();

			refreshActivityStreamDebounced(false, true);
			$scope.disableActivityStreamUpdates();
		};


		var refreshActivityStreamDebounced = _.debounce(function (past, forceOneTimeCall) {
			$scope.refreshActivityStream($scope.isSelfActivity,$scope.currentPageNo,$scope.isSelfActivity,past, forceOneTimeCall,$scope.profileCtrlState.searchStr);
		}, 900);


		$scope.setTimelineOptions = function () {
			activityStreamModel.setTimelineOptions(
				$filter('filter')(profileCtrlState.timelineItems, $scope.filterActivityItems),true
			);
		};

	//	$scope.$watch('profileCtrlState.timelineFilterText', _.throttle($scope.setTimelineOptions, 200));

	//	$scope.activityItemDeletedCallback = $scope.setTimelineOptions;

		$scope.refreshFromDirective = function () {
			profileCtrlState.showSuperbox = false;
		};

		$scope.refreshActivityStream = function (isSelfActivity,currentPageNo,past, forceOneTimeCall, searchStrInput) {
			if(typeof isSelfActivity != 'undefined'){
				$scope.isSelfActivity=isSelfActivity;
				$scope.activityStreamModel.isSelfActivity=isSelfActivity;
			}
			if(typeof currentPageNo != 'undefined'){
				$scope.currentPageNo=currentPageNo;
			}
			if (profileCtrlState.currentTimelineFilter.id === 'approvals') {
				return $q.reject();
			}
			if(typeof searchStrInput == 'undefined'){
				searchStrInput = '';
			}
			
			// The activity stream will not be refreshed if updates are disabled, except
			// when called for past items or if the one-time refresh is forced.
			if (!past && !forceOneTimeCall && profileCtrlState.activityStreamUpdatesDisabled) {
				return $q.when(1);
			}

			var typeFilter = profileCtrlState.currentTimelineFilter.type;

			if (typeFilter) {
				profileCtrlState.timelineLoadingFlagsByType[typeFilter] = true;
			}
			var showTickets = profileCtrlState.showTickets;
			var showServiceRequests = profileCtrlState.showServiceRequests;
			if(profileCtrlState.records == 'Service Requests'){
				typeFilter = 'request';
			}else if(profileCtrlState.records == 'Tickets'){
				typeFilter = 'Tickets';
			}else{ 
				typeFilter = '';
			}
			//activityStreamModel.serviceRequestsFitlerStatusesString = extractSelectedSrStatuses(profileCtrlState.srFilterStatuses);

			return activityStreamModel.getActivityStream({
					type: 'user',
					elementId: userModel.userId,
					loadMorePastItems: past || false,
					typeFilter: typeFilter,
					serviceRequestsStatuses: activityStreamModel.serviceRequestsFitlerStatusesString,
					isCacheResetNeeded: profileCtrlState.isNewSrFilterStatusSelected,
					currentPageNo: currentPageNo,
					selfActivity: $scope.isSelfActivity,
					searchStr: searchStrInput,
					state: profileCtrlState.state,
					status: profileCtrlState.status,
					beId: profileCtrlState.beId,
					isCsvCreation : $scope.isCsvCreation
				})
				.then(function (activityStreamCache) {
					if(!$scope.isCsvCreation){
						profileCtrlState.timelineItems = activityStreamCache.items;
						
						$scope.isNextEnabled=activityStreamModel.isNextEnabled;
						$scope.isPreviousEnabled=activityStreamModel.isPreviousEnabled;
						if (typeFilter) {
							profileCtrlState.allowMorePastItemsByType = activityStreamCache.allowMorePastItemsByType;
						} else {
							profileCtrlState.allowMorePastItems = activityStreamCache.allowMorePastItems;
						}
						if (profileCtrlState.isNewSrFilterStatusSelected) {
							profileCtrlState.isNewSrFilterStatusSelected = false;
							$scope.enableActivityStreamUpdates();
						}
						
						if(activityStreamCache.items.length > 0){
							$('.timeline-toolbar-csvDownload').removeClass('csvDisable');
							$('.timeline-toolbar-csvDownload').addClass('csvDownload');
						}
						else{
							$('.timeline-toolbar-csvDownload').addClass('csvDisable');
							$('.timeline-toolbar-csvDownload').removeClass('csvDownload');
						}
	
						$scope.setTimelineOptions();
					}else{
						//csvDataList = [];
						activityStreamCache.items.forEach(function(item){
							var csvData = {};
							csvData[selfServiceLabels.Number] = item.feedText;
							if($scope.showStatus)
								csvData[selfServiceLabels.status] = item.dispStatus;
							
							item.dynamicFields.forEach(function(data){
								var dataVal = data.value;
								var addToCsv = true;
								if(dataVal != 'undefined' && dataVal != null){
									dataVal = String(dataVal);	
									dataVal = dataVal.replace(/"/g, '""').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '""').replace(/&#39;/g, "'");//Replacing Special encoded characters
									//remove image tag
									if(data.type == 'FORMULA' || data.type == 'URL'){
										dataVal = dataVal.replace(/<[^>]*>/g, '');//extract text and remove HTML tag
										if(dataVal == ''){ 
											dataVal = '';
											addToCsv = false;
										}
										
									}
									if(data.type == 'ENCRYPTEDSTRING'){
										addToCsv = false;
									}
									if(data.type == 'RICHTEXTAREA' || data.type == 'FORMULA'){
										dataVal = dataVal.replace(/\n\s*\n/g, '');//remove new line characters
									}
									
									//Add a Limit of 5000 to characters per field
									if(dataVal.length > 5000)
										dataVal = dataVal.substring(0, 4999);
								}else{
									dataVal = '';
								}

								if(addToCsv)
									csvData[data.label] =  dataVal;
							});
							
							csvData[selfServiceLabels.SSApprovalListColumnHeaderType] = item.isRequest && !item.isTicket ? selfServiceLabels.ServiceRequests : selfServiceLabels.Tickets; 
							
							if($scope.showState)
								csvData[selfServiceLabels.State] = item.dispState ? selfServiceLabels.Opened: selfServiceLabels.Closed;
							if(!$scope.isSelfActivity)
								csvData[selfServiceLabels.ClientName] = item.clientName;
							
							csvDataList.push(csvData); 
						});
						if(csvDataList.length < 2000 && activityStreamModel.isNextEnabled){
							profileCtrlState.currentPageNo = profileCtrlState.currentPageNo+1;
							$scope.generateCSVLink(false);
						}else{
							if(activityStreamModel.isNextEnabled){
								var csvData = {};
								csvData[selfServiceLabels.Number] = 'Results are truncated as maximum limit is reached';
								csvDataList.push(csvData);
							}
							profileCtrlState.currentPageNo = 1;	
							var csvColumnDelimiter = ',';
							if($scope.userModel && $scope.userModel.localeDecimalSeparator && $scope.userModel.localeDecimalSeparator == ','){
								csvColumnDelimiter = ';';
							}
							downloadCsv(csvColumnDelimiter);
							$scope.isCsvCreation = false;
							$('.timeline-toolbar-csvDownload').removeClass('csvDisable');
							$('.timeline-toolbar-csvDownload').addClass('csvDownload');
							csvDataList = [];
						}
						//downloadCsv();
						//$scope.isCsvCreation = false;
					}
				})
				.finally(function () {
					if (typeFilter) {
						profileCtrlState.timelineLoadingFlagsByType[typeFilter] = false;
					}
					// No need to activate subsequent automatic refresh if items from the past are requested
					// or if one-time call for the activity stream refresh was made
					if (!past || !forceOneTimeCall) {
						//startActivityStreamRefreshTimeout();
					}
					$scope.isRelatedTicketsLoading = false;
				});
		};


		/** Disable updating of activity stream (i.e. when post with attachments is submitted */
		$scope.disableActivityStreamUpdates = function () {
			profileCtrlState.activityStreamUpdatesDisabled = true;
		};


		/** Enable updating of activity stream back (i.e. when post with attachments finished submitting */
		$scope.enableActivityStreamUpdates = function () {
			profileCtrlState.activityStreamUpdatesDisabled = false;
		};


		$scope.newActivityItem = function (itemType) {
			itemType = itemType || profileCtrlState.currentTimelineFilter.type;

			if (itemType === 'microblog' || itemType === 'request') {
				profileCtrlState.currentSuperboxType = itemType;
				profileCtrlState.showSuperbox = true;
			} else {
				profileCtrlState.showSuperbox = false;
			}

			if (itemType === 'appointment') {
				//appointmentCreateService.showCreationDialog();
			}

			if (itemType === 'reservation') {
				//reservationSearchService.showDialog();
			}
		};


		$scope.filterActivityItems = function (activityItem) {
			var show,
				currentSrStatuses = _.pluck(_.where(profileCtrlState.srFilterStatuses, { enabled: true }), 'status');

			function checkFieldMatch(field) {
				if (_.isString(field)) {
					fieldMathes.push(field.toLowerCase().indexOf(filterText) !== -1);
				}
			}

			if (profileCtrlState.currentTimelineFilter.id) {
				if (profileCtrlState.currentTimelineFilter.type === 'request') {
					show = activityItem.isRequest;
				} else {
					show = activityItem.isTicket;
				}
			} else {
				show = true;
			}

			var filterText = profileCtrlState.timelineFilterText;
			if (_.isString(filterText) && (filterText.length == 0 || filterText.length > 2)) {
				filterText = filterText.toLowerCase();
				/** For text filtering, just one field match will be enough */
				var fieldMathes = [];

				checkFieldMatch(activityItem.feedText);
				checkFieldMatch(activityItem.createdByFirstName);
				checkFieldMatch(activityItem.createdByLastName);
				if (activityItem.feedData) {
					checkFieldMatch(activityItem.feedData.msg);
					checkFieldMatch(activityItem.feedData.requestor);
					checkFieldMatch(activityItem.feedData.summary);
					if (activityItem.isRequest) {
						checkFieldMatch(activityItem.feedData.requestId);
					}
				}
				if (activityItem.appointmentLocation) {
					checkFieldMatch(activityItem.appointmentLocation.shortLocationString);
					checkFieldMatch(activityItem.appointmentLocation.locationString);
				}
				if (activityItem.onBehalf) {
					checkFieldMatch(activityItem.onBehalf.displayName);
				}
				if (activityItem.referencedBy) {
					checkFieldMatch(activityItem.referencedBy.createdByFirstName);
					checkFieldMatch(activityItem.referencedBy.createdByLastName);
				}
				if (activityItem.location) {
					checkFieldMatch(activityItem.location.name);
					checkFieldMatch(activityItem.location.address);
				}

				show = show && _.contains(fieldMathes, true);
			}

			return show;
		};


		$scope.showEditModal = function () {
			var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
			$modal.open({
					templateUrl: resourceUrl+'views/profile/profile-edit-modal.html',
					controller: 'ProfileEditController',
					backdrop: 'static'
				}).result
				.then(function (result) {
				/*	if (result.image) {
						thumbnailCache.remove('user', userModel.userId);
						thumbnailCache.get('user', userModel.userId);
						thumbnailCache.queryServer();

						if (result.image.base64) {
							profileModel.profileImage = result.image.base64
						} else {
							// reload profile picture manually
							loadProfileImage(true);
						}
					}*/
				});
		};


		$scope.enterTimelineSearchMode = function () {
			profileCtrlState.timelineSearchMode = true;
		};


		$scope.leaveTimelineSearchMode = function () {
			profileCtrlState.timelineSearchMode = false;
			profileCtrlState.timelineFilterText = '';
		};


		function destroyCurrentTimelineFilter() {
			profileCtrlState.currentTimelineFilter = {};
		}


		function loadProfileImage(noCache) {
			/*$scope.profileImageIsUpdating = true;
			attachmentService.getProfileImage('user', userModel.userId)
				.then(function () {
					$scope.profileModel.profileImage = attachmentService.getProfileImageUrl('user', userModel.userId, noCache);
				})
				.catch(function () {
					$scope.profileModel.profileImage = "";
				})
				.finally(function () {
					$scope.profileImageIsUpdating = false;
				});*/
		}


		/**
		 * Gets statuses that are selected in the SRs dropdown filter
		 * @param srFilter filter entity
		 * @returns {string} a string of selected status numbers which are separated by a comma delimiter
		 */
		function extractSelectedSrStatuses(srFilter) {
			var selectedStatusesArray = _.chain(srFilter).where({ enabled: true }).pluck('status').value();

			return selectedStatusesArray.join(',');
		}


		init();
		
		$scope.searchService = function() {
			var searchStr = $('#searchTxt').val();
			$scope.$stateParams.searchStr = $scope.profileCtrlState.searchStr;
			searchStr = $scope.profileCtrlState.searchStr ? $scope.profileCtrlState.searchStr.trim() : '';
			if(typeof searchStr == 'undefined' || searchStr.length == 1){
				return;
			}
			$scope.refreshActivityStream($scope.isSelfActivity,$scope.currentPageNo,false, true,searchStr);
		}
		
		var typingTimer;                //timer identifier
		$scope.searchWithTimer = function (){
			$timeout.cancel(typingTimer);
			typingTimer = $timeout($scope.searchService, 1000);
		};
		
		$scope.clearSearchText = function () {
			$scope.profileCtrlState.searchStr = '';
			$scope.$stateParams.searchStr = '';
			$scope.refreshActivityStream($scope.isSelfActivity,$scope.currentPageNo,false, true,'');
			if($('#searchTxt')){
				$('#searchTxt').focus();
			}
		};
		
		$scope.toggleSearchDiv = function () {
			if($scope.profileCtrlState.showSearchDiv){
				$('.profile-search-input').slideUp(0);
			}else{
				$('.profile-search-input').slideDown('fast');
			}
			$scope.profileCtrlState.showSearchDiv = !$scope.profileCtrlState.showSearchDiv;
			$scope.profileCtrlState.showFilterDiv = false;
			timelineContentDiv = $('#activity-stream-all');
			searchIcon = $('.srchIcon');
			$('#searchTxt').focus();
			if($scope.profileCtrlState.showSearchDiv){
				timelineContentDiv.addClass('activity-stream-all');
				searchIcon.removeClass('search-icon-gray');
				searchIcon.addClass('search-icon');
			}else{
				searchIcon.removeClass('search-icon');
				searchIcon.addClass('search-icon-gray');
				timelineContentDiv.removeClass('activity-stream-all');
			}
		};
		$scope.toggleFilterDiv = function(event){
			profileCtrlState.showFilterDiv = !profileCtrlState.showFilterDiv;
			profileCtrlState.showSearchDiv = false;
			$('.profile-search-input').slideUp(0);
			searchIcon = $('.srchIcon');			
			searchIcon.removeClass('search-icon');
			searchIcon.addClass('search-icon-gray');
			$('#activity-stream-all').removeClass('activity-stream-all');
			if(profileCtrlState.showFilterDiv == false){
				$('.timeline-toolbar-filter').removeClass('noBottomBorder');
			}else{
				$('.timeline-toolbar-filter').addClass('noBottomBorder');
				$scope.setWidthOfMask();
				setTimeout($scope.focusDivElement, 100);
			}
			event.preventDefault();
			event.stopPropagation();
		};
		$scope.focusDivElement = function(){
			if($('#filterTableDiv')){
				$('#filterTableDiv').focus();
			}
		}
		$scope.createStatusArrayBasedOnState = function(){
			statusVsStateMap = JSON.parse(statusVsStateJSON);
			profileCtrlState.relevantStatusValues = []; 
			profileCtrlState.relevantStatusValues.push({
							Id: 'all',
							Status: selfServiceLabels.all
						});
			var isDefaultStatusValid = false;
			for(var key in statusVsStateMap){
				 if (statusVsStateMap.hasOwnProperty(key)){
					var compValue = ($scope.profileCtrlState.state == 'false')?false:true;
					if(($scope.profileCtrlState.state == 'All') || (compValue == statusVsStateMap[key])){
						 profileCtrlState.relevantStatusValues.push({
							Id: key.split(',')[0],
							Status: key.split(',')[1]
						});
						// check if the default status which is obtained from cookie is valid as per the state
						if(profileCtrlState.status == key.split(',')[0]){
							isDefaultStatusValid = true;
						}
					}
				}
			}
			if(isDefaultStatusValid == false)
				profileCtrlState.status = 'all';
		};
		$scope.createStatusArrayBasedOnState();
		$scope.setCookieValues = function(){
			var oneYr = new Date();
			oneYr.setYear(new Date().getFullYear() + 1);
			setRFCookies("selectedState", $scope.profileCtrlState.state,{ expires: oneYr });
			setRFCookies("selectedStatus", $scope.profileCtrlState.status,{ expires: oneYr });
			setRFCookies("selectedRecords", $scope.profileCtrlState.records,{ expires: oneYr });
		}
		$scope.setWidthOfMask = function(){
			$('.mask').css('width',(parseInt($('.timeline-toolbar-filter').css('width')) - 2) + "px");
		}
		$scope.filterChangeHandler = function(){
			$('.timeline-toolbar-filter__selection').html($scope.profileCtrlState.records == "Service Requests" ? selfServiceLabels.ServiceRequests : $scope.profileCtrlState.records == "Tickets" ? selfServiceLabels.Tickets : selfServiceLabels.all); 
			$scope.setWidthOfMask();
		}
		window.onclick = function(event) {
			var eventTarget = $(event.target);
			if (eventTarget.attr('class') == 'filterDiv' || $('.filterDiv').find(eventTarget).length){
				event.stopPropagation();
			}
			else if (profileCtrlState.showFilterDiv) {
				profileCtrlState.showFilterDiv = false;
				$scope.$apply();
			}
		};
		$scope.applyChanges = function(){
			$scope.setCookieValues(); 
			$scope.searchService(); 
			$scope.profileCtrlState.showFilterDiv = false; 
			$('.timeline-toolbar-filter').removeClass('noBottomBorder');
			if($('#timelineToolbarFilter')){
				$('#timelineToolbarFilter').focus();
			}
		}
		
		var getHeader = function(inputArray) {
            var columnHeader = [];
            for (var i in inputArray) {
                var keys = Object.keys(inputArray[i]);
                if(keys.length > 0){
                	for (var j in keys) {
                		if(j != 'remove'){
                			var key = keys[j];
                            columnHeader[key] = key
                		}
                    }
                }
                
            }
            return columnHeader
        }
        convertArrayOfObjectsToCSV = function(inputArray, csvColumnDelimiter) {
            var result, ctr, keys, columnDelimiter, lineDelimiter, header = getHeader(inputArray) || null;
            return null === header ? null : (columnDelimiter = csvColumnDelimiter, lineDelimiter = "\n", keys = Object.keys(header), result = "", keys.forEach(function(key) {
                var dataVal = header[key];
                void 0 === dataVal && (dataVal = ""), result += '"' + dataVal + '"' + columnDelimiter
            }), result += columnDelimiter, result += lineDelimiter, inputArray.forEach(function(item) {
                ctr = 0, keys.forEach(function(key) {
                    ctr > 0 && (result += columnDelimiter);
                    var dataVal = item[key];
                    void 0 === dataVal && (dataVal = ""), result += '"' + dataVal + '"', ctr++
                }), result += lineDelimiter
            }), result)
        }
        downloadCsv = function(csvColumnDelimiter){
        	var today = new Date();
            var filename = "My_Activity_Export_"+today.getFullYear() + "-"+ (today.getMonth() + 1)+ "-"+today.getDate() +"_"+ today.getHours() +"-"+ today.getMinutes() +"-"+ today.getSeconds() +".csv";
            
            var csv = convertArrayOfObjectsToCSV(csvDataList, csvColumnDelimiter);
            var charset = "utf-8" , bom = '\ufeff';//Byte Order Sequence and Character encoding
            var userAgent = navigator.userAgent.toLowerCase();
            var blob = new Blob([bom + csv], {
              type: "text/csv;charset="+ charset + ";"
            });

            if (window.navigator.msSaveOrOpenBlob) {
              navigator.msSaveBlob(blob, filename);
            }else{
            	var link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.style = "visibility:hidden";
                link.download = filename;
                if (!(userAgent.indexOf('safari') != -1 && userAgent.indexOf('chrome') == -1))
                	link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } 
            
        }
        $scope.generateCSVLink = function(callFromSS) {
        	if($('.timeline-toolbar-csvDownload').hasClass('csvDisable') && (!$scope.isCsvCreation || callFromSS)){
        		return;
        	}
        	$('.timeline-toolbar-csvDownload').addClass('csvDisable');
			$('.timeline-toolbar-csvDownload').removeClass('csvDownload');
        	$scope.isCsvCreation = true;
            var searchStr = $('#searchTxt').val();
			$scope.$stateParams.searchStr = $scope.profileCtrlState.searchStr;
			searchStr = $scope.profileCtrlState.searchStr ? $scope.profileCtrlState.searchStr.trim() : '';
            $scope.refreshActivityStream($scope.isSelfActivity,profileCtrlState.currentPageNo,false, true,searchStr);
            
        };
		$scope.closeFilterPopup = function(event){
			var focusElementId;
			if(event.which === 9 && event.shiftKey && event.target.id == 'filterTableDiv'){
				focusElementId = 'timelineToolbarFilter';
			}else if(event.target.nodeName == 'BUTTON' && event.target.id == 'applyFilterButton' && event.which === 9 && !event.shiftKey){
				var isSelfButtonDisabled = $('#selfButton').prop('disabled');
				var isOthersButtonDisabled = $('#othersButton').prop('disabled');
				var searchButton = $('#searchButton');
				if(isSelfButtonDisabled){
					focusElementId = 'othersButton';
				}else if(isOthersButtonDisabled){
					focusElementId = 'selfButton';
				}else if(searchButton){
					focusElementId = 'searchButton';
				}
			}
			if(focusElementId && $('#'+focusElementId)){
				$('#'+focusElementId).focus();
				$scope.toggleFilterDiv(event);
			}
		}
		$scope.profileDetailsNavigation = function(event,elementId){
			var allSelectableElements;
			var stopPreventDefault = false;
			var eventKeyCode = event.which;
			allSelectableElements = $('#'+elementId).find("[selectable]");
			if(allSelectableElements && allSelectableElements.length > 0){
				if(eventKeyCode === 40 && $scope.selectedElementIndex < (allSelectableElements.length - 1)){//DOWN
					allSelectableElements[++$scope.selectedElementIndex].focus();
				}else if(eventKeyCode === 38 && $scope.selectedElementIndex > 0){//UP
					allSelectableElements[--$scope.selectedElementIndex].focus();
				}else if(eventKeyCode === 35){//End
					$scope.selectedElementIndex = allSelectableElements.length - 1;
					allSelectableElements[$scope.selectedElementIndex].focus();
				}else if(eventKeyCode === 36){//Home
					$scope.selectedElementIndex = 0;
					allSelectableElements[$scope.selectedElementIndex].focus();
				}else if(eventKeyCode === 13 || eventKeyCode === 32){//Space or Enter
					allSelectableElements[$scope.selectedElementIndex].click();
				}else if(eventKeyCode === 9 && !event.shiftKey){//Tab Key
					$scope.selectedElementIndex = -1;
					stopPreventDefault = true;
				}else if(eventKeyCode === 9 && event.shiftKey){//Shift + Tab Key
					$scope.selectedElementIndex = -1;
					stopPreventDefault= true;
				}
				if(!stopPreventDefault){
					event.preventDefault();
				}
			}
		}
	}
	