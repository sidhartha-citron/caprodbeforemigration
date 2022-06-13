angular.module('supportModule').factory('draftService', ['$q','$uibModal', 'supportModel', function ($q, $uibModal, supportModel){
	var self = {};
	
	self.supportModel = supportModel;
	self.data={loading : true};
 	self.savedDrafts = {};
	
	self.fetchDrafts = function(fetchCount){ 
		var deferred = $q.defer();
		var additionalParam = {};
		if(fetchCount) {
			additionalParam.fetchCount = fetchCount;
		}
        Visualforce.remoting.Manager.invokeAction(_RemotingActions.fetchDrafts, additionalParam, function(result, event) {
	         if (event.status) { 
	              deferred.resolve(result);
	       	 }else{
	          	deferred.reject();
	       	 }
       }); 
       return deferred.promise;  	   
    }
	
	self.fetchSavedDraftCount = function() {
		return self.fetchDrafts(true);
	}
	
	self.deleteDrafts = function (recordId){
        var deferred = $q.defer();
        Visualforce.remoting.Manager.invokeAction(_RemotingActions.deleteDraft, recordId, null, function(result, event) {
	         if (event.status) { 
	              deferred.resolve(result);
	              supportModel.requestDetailId = null;
	              supportModel.savedDraftCount--;
	       	 }else{
	          	deferred.reject();
	       	 }
       }); 
       return deferred.promise;  
	}
 	self.loadDrafts = function() {
 		self.fetchDrafts().then(function(result){
 	 		self.data.loading = false;
			self.savedDrafts = result;
			if($('#firstElementFocusId')){
				$('#firstElementFocusId').focus();
			}
 	 		var isOneRecord = false;
 	 		if(self.savedDrafts != undefined && self.savedDrafts.length == 1){
			  	isOneRecord = true;
 	 		}	
 	 		_.each(self.savedDrafts, function (item) {
 	 			supportModel.setSrdAndCategoryIcon(item);
				if(item.calculatedIcon)
					item.calculatedIcon = getSFDocumentURL('',item.calculatedIcon);
 	 			item.descriptionData = {}; 
 	 			item.descriptionData.isSearch = false;
			    item.descriptionData.name = item.title;
 	 			item.descriptionData.showDescriptionEllipses = true;
 	 			item.descriptionData.showToggle = undefined;
 	 			item.descriptionData.isDraftDescription = true;
 	 			if (item.desc) {
 	 				item.descriptionData.value = supportModel.htmlDecode(item.desc);
				}
				if (isOneRecord && item.serviceRequestDefinitionId != undefined)
					item.descriptionData.descriptionClass = 'support-request__description';
				else {
					if (item.isRTFDesc == 'true'){ 
						item.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-maxheight';
					} else {
						item.descriptionData.descriptionClass = 'support-request__description-ellipsis support-request__description-ellipsis-maxHeight';
					}
				}
			});
 		});
		
 	}
	self.openDeleteConfirmationDialog = function(recordId){
		var resourceUrl=$("a[id*='selfServiceResourcesUrl']").attr('href');
		$uibModal.open({
			templateUrl: resourceUrl + 'views/common/confirmation-dialog.html',
			ariaDescribedBy: 'modal-header__text',
			ariaLabelledBy:'modal-header__title',
			controller: ['$scope', '$uibModalInstance','$q', 'draftService', function ($scope, $uibModalInstance, $q, draftService) {
				$scope.title = selfServiceLabels.SSDeleteDraft;
				$scope.titleI18nKey = 'support.srd.drafts';
				$scope.text = selfServiceLabels.deleteAttachmentMsg;
			  	
				$scope.confirm = function () {
					$uibModalInstance.close();
					self.data.loading = true;
					draftService.deleteDrafts(recordId).then(function(result){
						self.data.loading = false;
						self.loadDrafts();
					});
				}
				
				$scope.dismiss = function () {
					$uibModalInstance.dismiss();								
				}
			}]
		});
	}
	return self;
}]);

angular.module('supportModule').controller('SaveDraftContorller',  ['$scope','$window','$q', '$uibModal', 'draftService', 'srDetailsService', 'supportModel', 'srdCreateService','supportService', function($scope,  $window, $q, $uibModal, draftService, srDetailsService, supportModel, srdCreateService,supportService){
 	$scope.draftService = draftService;
 	
 	draftService.loadDrafts();
 	
 	$scope.supportServiceModel = supportService;
	$scope.deleteDraft = function(recordId, event) {
		draftService.openDeleteConfirmationDialog(recordId); 
		event.stopPropagation();
	};
	
	$scope.selectDraft = function(item) {
		var additionalParam = {isDraft : true}
		item.action = 'COPY';
		$scope.supportModel.isDraft = true;
		$scope.supportModel.isDraftFormLoading = true;
		$scope.supportModel.requestDetailId = item.id;
		srdCreateService.showSupportSrdCreateDialog(item, additionalParam);
	}
}]);	