  angular.module('supportModule')
    .factory('viewMyAssetsCIModel', ['$q', 'supportService', 'urlSanitizerService','viewCMDBService',
      function ($q, supportService, urlSanitizerService,viewCMDBService) {
        var self = {};
			
          self.dataLoading = true;
		  self.recordDataLoading = true;
		  self.currentPageNo = 1;
          self.getAllAssetsAndCIs = function (){ 
              return viewCMDBService.getAssetsCIs(self.currentPageNo).then(function(resp){ self.dataLoading = false; return resp});
           }
		   
		   self.getCMDBDetails = function (beId){ 
              return viewCMDBService.getCMDBDetails(beId).then(function(resp){ self.recordDataLoading = false; return resp});
           }
           return self;
        }
    ]);



















