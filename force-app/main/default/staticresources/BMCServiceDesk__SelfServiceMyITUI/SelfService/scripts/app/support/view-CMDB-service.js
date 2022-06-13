  angular.module('supportModule')
    .factory('viewCMDBService', ['$timeout', '$uibModal','$q','urlSanitizerService', 'errorDialogService','userModel','supportModel', 
      function ( $timeout,$uibModal,$q,urlSanitizerService, errorDialogService,userModel,supportModel) {

        var self = {};
		self.getAssetsCIs=function (currentPageNo){
		     var deferred = $q.defer();
		     var requests;
			 var params = {};
			 params['pageIndex'] = currentPageNo;
			 Visualforce.remoting.Manager.invokeAction(_RemotingActions.getCMDBData,params,function(result, event) {
			  if (event.status) { 
				  deferred.resolve(result);
			  }else if(event.type == 'exception'){
				supportModel.displayExceptionMessage(selfServiceLabels.errorPopupHeader, event.message); 
			  }else{
				deferred.reject();
			  }
			}); 
			return deferred.promise;  
		}
		self.getCMDBDetails=function (beId){
		     var deferred = $q.defer();
		     var requests;
			 Visualforce.remoting.Manager.invokeAction(_RemotingActions.getCMDBDetails,beId,function(result, event) {
			  if (event.status) { 
				  deferred.resolve(result);
			  }else if(event.type == 'exception'){
				supportModel.displayExceptionMessage(selfServiceLabels.errorPopupHeader, event.message); 
			  }else{
				deferred.reject();
			  }
			}); 
			return deferred.promise;  
		}
		
        return self;
	}]
);