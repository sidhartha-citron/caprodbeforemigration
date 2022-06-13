angular.module('supportModule').factory('dataServices',['$q',function($q){
  	return {
  		getTileDataForServices : function(isCalledFromSS, strArguments){
  			var deferred = $q.defer();
  			Visualforce.remoting.Manager.invokeAction(
  				_RemotingActions.getTileDataForServices, isCalledFromSS, strArguments, getStandardCallback(deferred),{escape: true});
  			return deferred.promise;
  		},
  		getServiceOutageDetails : function(isCalledFromSS, strArguments){
  			var deferred = $q.defer();
  			Visualforce.remoting.Manager.invokeAction(
  				_RemotingActions.getServiceOutageDetails, isCalledFromSS, strArguments, getStandardCallback(deferred),{escape: true});
  			return deferred.promise;
  		},
  		getServiceOutageHistory : function(isCalledFromSS, strArguments){
  			var deferred = $q.defer();
  			Visualforce.remoting.Manager.invokeAction(
  				_RemotingActions.getServiceOutageHistory, isCalledFromSS, strArguments, getStandardCallback(deferred),{escape: true});
  			return deferred.promise;
  		},
  		changeSubscription : function(outageid,ischecked){
  			var deferred = $q.defer();
  			Visualforce.remoting.Manager.invokeAction(
  				_RemotingActions.changeSubscription, outageid,ischecked, getStandardCallback(deferred),{escape: true});
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
















