angular.module('supportModule').controller('customlink',['$scope', 'customTilesServices', '$interval','$state',
                                                         '$rootScope', '$window',
                                                         function($scope, customTilesServices, $interval,$state,
                                                        		 $rootScope,$window)
    { 	  

	$scope.tiles = [];
	$scope.isShowLoader = false; 
	$scope.isNoLinksFound = true;		 
	$scope.init = function() {			
		$scope.showCustomTiles($scope.customTileName);
	}
	$scope.showCustomTiles = function(tileName) {
		var promise = customTilesServices.getCustomChildrenTilesData(tileName); 
		promise.then(function(result){
			$scope.tiles = result;				
			if($('#firstElementFocusId')){
				$('#firstElementFocusId').focus();
			}
			if(result.length == 0)
				$scope.isNoLinksFound = true;
			
		},function(failure) {
			$scope.isShowLoader = false;
		});
	}
	
	 $rootScope.$on("showCustomTilesFromIndex", function(tileName){
		 $scope.init();
      });

	 $scope.openWindow= function(url){
		var parser = new DOMParser;
		var dom = parser.parseFromString(
		'<!doctype html><body>' + url,
		'text/html');
		var htmldecodedUrl = dom.body.textContent;
		$window.open(htmldecodedUrl, "_blank");
	 }	
	
	$scope.init();
}]);










