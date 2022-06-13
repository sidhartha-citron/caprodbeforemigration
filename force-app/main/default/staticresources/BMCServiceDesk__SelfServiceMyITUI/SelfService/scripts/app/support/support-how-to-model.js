	angular.module('selfServiceApp')
		.factory('howToModel', ['$q', 'supportService', 'urlSanitizerService','rkmDetailsService',
			function ($q, supportService, urlSanitizerService,rkmDetailsService) {
				var self = {};
				

				self.dataLoading = false;

				self.getAllHowTos = function () {					

					if (self.allHowTos) {
						return $q.when(self.allHowTos);
					}

					if (self.dataLoading) {
						return self.allItemsLoadingPromise;
					}

					self.dataLoading = true;

					self.allItemsLoadingPromise = rkmDetailsService.getKASetails(null)
						.then(function (result) {
							self.allHowTos = result;
							processHowToItems(self.allHowTos);
							return self.allHowTos;
						})
						['finally'](function () {
							self.dataLoading = false;
						});

					return self.allItemsLoadingPromise;
				};

				function processHowToItems(items) {
					_.each(items, function (item) {
						rkmDetailsService.processRkmTextFields(item);
					});
				}

				self.fetchKACategories= function(categoryId){	
					var categoryNodeId = '0';
					if(categoryId != undefined)
						categoryNodeId = categoryId;
					var deferred = $q.defer();  
					  Visualforce.remoting.Manager.invokeAction(_RemotingActions.fetchKACategories,categoryNodeId,null, function(result, event) {
							if (event.status) {
								_.each(result, function (category) {
									if(category.catImage) {
										category.catImage = category.catImage != 'useDefaultFromStaticResource' ? getSFDocumentURL(relativeServletURL + category.catImage): category.catImage;	;
									}
									category.icon = 'i-assistant-categorySRD-storage';
								});									
								deferred.resolve(result);
							}else{
								deferred.reject();
							}
						});	
					return deferred.promise;							
				}; 		
				self.getAllKAForSelectedCategory = function (categoryId) {	
					var deferred = $q.defer();
					Visualforce.remoting.Manager.invokeAction(_RemotingActions.getKAForCategory,categoryId,null,function(result, event) {
							if (event.status) {
								processHowToItems(result);
								self.allHowTos = result;
								deferred.resolve(result);
							}else{
								deferred.reject();
							}
					});	
					return deferred.promise;
				};	
				return self;
			}
		]);



















