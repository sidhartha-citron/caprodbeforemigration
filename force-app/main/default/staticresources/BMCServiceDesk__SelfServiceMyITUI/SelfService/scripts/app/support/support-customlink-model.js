angular.module('supportModule').factory('customTilesServices',['$q',function($q){
  	return {
  		getCustomChildrenTilesData : function(tileName){
  			var deferred = $q.defer();
  			Visualforce.remoting.Manager.invokeAction( 
  				_RemotingActions.getCustomChildrenTilesData, tileName, null, getStandardCallback(deferred),{escape: true});
  			return deferred.promise;
  		}
  	}
  }]);

  var getStandardCallback = function(deferred){
  	var callback = function (result,event) {
  		if(event.status){
  			deferred.resolve(result);
  		} else {
  			deferred.reject(event.message);
  		}   
  	};
  	return callback;
  };
















