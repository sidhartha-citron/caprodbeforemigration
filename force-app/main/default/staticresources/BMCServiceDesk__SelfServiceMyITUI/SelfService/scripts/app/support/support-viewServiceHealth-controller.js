angular.module('supportModule').controller('ViewServiceHealth',['$scope', 'dataServices', 'decodeResponseModel', '$interval', function($scope, dataServices, decodeResponseModel, $interval)
    { 	  
	
	$scope.tiles = [];
	$scope.outages = [];
	$scope.outageHistory = [];	
	$scope.isFromSS = isCalledFromSS; 
	$scope.isNoServicesFound = false;
	$scope.isTileClicked = false;
	$scope.isShowHistory = true;
	$scope.isFutureClicked = true;
	$scope.selectedTab = 'current'; 
	$scope.tileWidth = '0px';
	$scope.screensWidth = '0px';
	$scope.detialsMaxHeight = '0px';
	$scope.tilesDivHeight = '0px';
	$scope.isFilterClicked = false;
	$scope.searchStr = '';
	$scope.outageStatuses = [];
	$scope.selectedStatusArr = [];
	$scope.selectedStatusCurrentTabArr = [];
	$scope.accountInterval;
	$scope.accountName = '';
	$scope.isShowLoader = false;
	 $scope.gridOptions = {	};
	$scope.selectedServiceTile = {};		
	
	//Controller function declaration and definition
	
	$scope.init = function() {
		
		$scope.isShowLoader = true;
		
		//Set outage statuses
		angular.forEach(statusValues, function(status){			
				$scope.selectedStatusArr.push(status.value);
		});
		$scope.outageStatuses = statusValues;
		
		//Set main Div and tile width as per screen
		if($scope.isFromSS){
			$('#mainDiv').width(screen.width - 80);
		}
		var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
		var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
		if (isChrome || isSafari) 
			$scope.tileWidth = '223px';
		else		
			$scope.tileWidth = '223px';
		$scope.detialsMaxHeight = ((screen.height / 2) - 100) + 'px';
		$scope.tilesDivHeight = (screen.height / 2) + 'px';
		$scope.screensWidth =((screen.width / 2)-40) + 'px';
		//Set current tab feature
		$scope.selectedTab = 'current';
		$('#currentTab').addClass('fontWithBold');
		$scope.isNoServicesFound = false;
		$scope.showServiceTiles('current', '');
	}
	
	$scope.showServiceTiles = function(selectedTab, accountId) {
		var promise = dataServices.getTileDataForServices(true, [selectedTab, accountId]); 
		promise.then(function(result){
			
			angular.forEach(result, function (obj, index){
				obj.title = decodeResponseModel.htmlUnescape(obj.title);
				obj.serviceDescription = decodeResponseModel.htmlUnescape(obj.serviceDescription);
            	obj.status = decodeResponseModel.htmlUnescape(obj.status);
            	obj.statusLabel = decodeResponseModel.htmlUnescape(obj.statusLabel);
			});
			$scope.isShowLoader = false;
			$scope.tiles = result;
			$scope.isTileClicked = false;
			
			if(result.length == 0)
				$scope.isNoServicesFound = true;
			
		},function(failure) {
			$scope.isShowLoader = false;
		});
	}	
	
	$scope.showServiceTileDetails = function(selectedTile) {
	
		// Re-initialize
		$scope.outageHistory = [];
		$scope.isShowHistory = true;
		$scope.outages = {};
		$scope.gridOptions ={};
		//Show History btn
		$('#historyBtn').val(selfServiceLabels.showHistoryLbl);
		
		$scope.selectedServiceTile = selectedTile;		
	
		var promise = dataServices.getServiceOutageDetails(true, [selectedTile.serviceId, $scope.selectedTab],true); 
		promise.then(function(result){
			$scope.isTileClicked = true;
			var data=[];
			result.rootCause =  decodeResponseModel.htmlUnescape(result.rootCause);
            result.outageDescription = decodeResponseModel.htmlUnescape(result.outageDescription);
			angular.forEach(result.outageActionList,function(value,key){
				value.action = decodeResponseModel.htmlUnescape(value.action);
				value.note = decodeResponseModel.htmlUnescape(value.note);
				var obj={};
				obj[selfServiceLabels.actionHistoryDate] = value.noteDateTime;
				obj[selfServiceLabels.actionHistoryAction] = value.action;
				obj[selfServiceLabels.actionHistoryNote] = value.note;
				data.push(obj);
			});
			$scope.outages = result;
			
			var cDefinition = [{ field: selfServiceLabels.actionHistoryDate, displayName: selfServiceLabels.actionHistoryDate, width: "*", minWidth : 150, maxWidth : 200 },
                     { field: selfServiceLabels.actionHistoryAction, displayName: selfServiceLabels.actionHistoryAction, width: "*", minWidth : 150, maxWidth : 200},
                     { field: selfServiceLabels.actionHistoryNote, displayName: selfServiceLabels.actionHistoryNote, width: "*" }];
					 
			$scope.gridOptions ={data:data, columnDefs: cDefinition, enableColumnResizing: true,enableCellEdit: false,
					enablePinning: false,enableRowSelection: false, enableSorting: false,
					enableCellEditOnFocus: false,
			        enableColumnMenus: false,
			        enableSelectAll: false,
			        enableHorizontalScrollbar: false,
			        enableVerticalScrollbar: false,rowHeight: 25};			
		},function(failure) {});	
		
	}
	
	$scope.checkChangeDetails = function(outageid) {	
		var promise = dataServices.changeSubscription(outageid, $scope.outages.isSubscriptionChecked); 	
	}
	
	
	$scope.getTableHeight  = function() {	
		var rowHeight = 25; // your row height
		var headerHeight = 25; // your header height
		var dataLength=$scope.gridOptions.data.length+1;		
		
		if(dataLength>8){
			dataLength=8;
		}
		
		return {
			height: (dataLength * rowHeight + headerHeight) + "px"
		}; 	
	}
	
	$scope.getServiceOutagesPerTab = function(tab) {
	
		$scope.clearSearch();
		$scope.isShowLoader = true;
		$('#tileNavDiv').empty();
		$scope.accountName = '';		
	
		if(tab == '')
			tab = $scope.selectedTab;
		else
			$scope.selectedTab = tab;
			
		if(tab == 'current') {			
			$scope.isFutureClicked=true;
			if ($scope.selectedStatusCurrentTabArr.length !=0 && $scope.selectedStatusCurrentTabArr.length != $scope.selectedStatusArr.length)
			{
				$scope.selectedStatusArr = $scope.selectedStatusCurrentTabArr;
			}
		}
		else {			
			$scope.isFutureClicked=false;
			$scope.selectedStatusCurrentTabArr = $scope.selectedStatusArr;
			$scope.selectedStatusArr = [];
			angular.forEach(statusValues, function(status){				
					$scope.selectedStatusArr.push(status.value);
			});
		}
		
		$scope.tiles = [];
		$scope.isNoServicesFound = false;
		$scope.showServiceTiles(tab, '');
		
		
	}
	
	$scope.showOutageHistory = function() {
		var serviceId = $scope.selectedServiceTile.serviceId;
		var outageId = '';
		$scope.isShowLoader = true;
		if($scope.outages[0] != undefined)
			outageId = $scope.outages[0].outageId;
		
		if($scope.isShowHistory == true) {
			
			var promise = dataServices.getServiceOutageHistory(true, [serviceId, outageId]); 
			promise.then(function(result){
				angular.forEach(result, function(obj, index){
					obj.rootCause = decodeResponseModel.htmlUnescape(obj.rootCause);
		            obj.outageDescription = decodeResponseModel.htmlUnescape(obj.outageDescription);
		        });
			
				$scope.outageHistory = result;
				$scope.isShowLoader = false;
				$scope.isShowHistory = false;
				$('#historyBtn').val(selfServiceLabels.hideHistoryLbl);
				
			},function(failure) {$scope.isShowLoader = false;});
		}
		else {			
			$('#historyBtn').val(selfServiceLabels.showHistoryLbl);
			$scope.isShowHistory = true;
			$scope.isShowLoader = false;
		}
	}
	
	$scope.searchService = function() {		
		$scope.searchStr = $('#searchTxt').val();		
	}
	
	
	
	$scope.clearSearch = function() {
		$('#searchTxt').val('');
		$scope.searchStr = '';
	}
	
	$scope.clearAccount = function() {
		$scope.accountName = '';
		$scope.isShowLoader = true;
		$scope.showServiceTiles($scope.selectedTab, '');
	}
	
	$scope.getIconClass = function(val) {
		if(val=='Available')
			return 'd-icon-check_circle statusAvailableIconCls';
		else if(val=='Degraded')
			return 'd-icon-exclamation_circle statusDegradedIconCls';
		else if(val=='Disrupted')
			return 'd-icon-cross_circle statusDisruptedIconCls';
		else 
			return 'd-icon-gear statusMaintenanceIconCls';
		
	}
	
	
	$scope.setSelectedStatus = function(selectedStatus, $event) {		
		//If 'All' is checked, set all other statuses selected
		if(selectedStatus == 'All' && $scope.selectedStatusArr.indexOf('All') == -1) {
			$scope.selectedStatusArr = [];
			angular.forEach($scope.outageStatuses, function(status){
				$scope.selectedStatusArr.push(status.value);
			});
		}
		else {
			//If 'All' is unchecked, set all other statuses unchecked
			if(selectedStatus == 'All' && $scope.selectedStatusArr.indexOf('All') > -1) {
				$scope.selectedStatusArr = [];
			}
			else {
				
				var idx = $scope.selectedStatusArr.indexOf(selectedStatus);
		 
				//If other than 'All' is unchecked, remove it from an array
				if (idx > -1) {
				
					//If other than 'All' is unchecked, set 'All' unchecked
					if(selectedStatus != 'All' && $scope.selectedStatusArr.indexOf('All') > -1) {
						var idx = $scope.selectedStatusArr.indexOf('All');
						$scope.selectedStatusArr.splice(idx, 1);
					}
				
					$scope.selectedStatusArr.splice($scope.selectedStatusArr.indexOf(selectedStatus), 1);
				}

				//If other than 'All' is checked, push it in an array
				else {
					$scope.selectedStatusArr.push(selectedStatus);
					if ($scope.selectedStatusArr.length == 4)
					{
						$scope.selectedStatusArr.push('All');
					}
				}
			}
		}
		
		$event.stopPropagation();
	}
	
	$scope.goBackToServices = function() {
		$('#tileNavDiv').empty();
		$scope.isTileClicked = false;
	}
	
	$scope.showStatusFilter = function($event) {		
		$scope.isFilterClicked = !$scope.isFilterClicked;
		$event.stopPropagation();
	}
	
	$scope.init();
	window.onclick = function(event) {
		var eventTarget = $(event.target);
		if (eventTarget.attr('id') == 'filterDiv' || $('#filterDiv').find(eventTarget).length){
			event.stopPropagation();
		}
		else if($scope.isFilterClicked) {
			$scope.isFilterClicked = false;
			$scope.$apply();
		}
	};
	
}]);

angular.module('supportModule').filter('filterServicesByStatus', function () {
	return function (tiles, selectedStatusArr, scope) {
	
		var filteredTiles = [];
		
		angular.forEach(tiles, function(tile){
			if(selectedStatusArr.indexOf('All') > -1)
				filteredTiles = tiles;
			else if(selectedStatusArr.indexOf(tile.status) > -1){
				filteredTiles.push(tile);
			}
		});  
		if(filteredTiles.length == 0){
			scope.$parent.isNoServicesFound = true;
		}else{
			scope.$parent.isNoServicesFound = false;
		}		
		return filteredTiles;
	};
});


angular.module('supportModule').filter('truncateString', function() {
	return function(input, endIndex) {
		
		if(input != null && input != '' && input.length > endIndex) {
			return (input.substring(0,endIndex) + '...');
		}
		else 
			return input;
	}
});





