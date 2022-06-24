	angular.module('selfServiceApp')
		.factory('globalSearchModel', ['activityStreamModel', 'attachmentService', 'globalSearchService', '$q', 'rkmDetailsService', 'srdCreateService', 'supportModel',
			function (activityStreamModel, attachmentService, globalSearchService, $q, rkmDetailsService, srdCreateService, supportModel) {
				var self = {};
				self.supportModel = supportModel;
				self.requestedRKM = [];
				self.globalSearchPromises = [];

				self.search = function (text) {
					return globalSearchService.RunGlobalSearch({ term: text, supportAIF: true }).$promise
						.then(function (response) {
							if (response && response.results) {

								if (!self.latestRequestTime) {
									self.latestRequestTime = response.requestTime;
								}

								if (response.requestTime && (response.requestTime < self.latestRequestTime)) {
									return self.globalSearchResults;
								}

								self.latestRequestTime = response.requestTime;
								var searchId = response.searchId,
									results = response.results,
									filteredResults = [];

								for (var i = 0, l = results.length; i < l; i++) {
									var
										item = results[i],
										source = item.id.split(":");

									item.searchId = searchId;

									if (source.length > 0) {
										switch (source[0]) {
											case "social":
												item.type = source[0];
												item.subType = source[1];
												if (item.subType == "user") {
													var userId = source[2].split("@");
													item.itemId = userId[0];
												} else {
													item.itemId = source[2];
												}
												// for "text" items, replace mention format with just @name
												if (item.subType === 'microblog' || item.subType === 'checkin' || item.subType === 'checkout' || item.subType === 'reservation') {
													item.title = activityStreamModel.replaceMentionsWithPlainText(item.title);
												}
												filteredResults.push(item);
												break;
											case "global":
												if (source[1]) {
													item.type = source[0];
													item.subType = source[1];
													item.itemId = source[2];
													if (item.subType === 'Location') { item.subType = 'location'; }
													if (item.subType === 'LocationFloorMapAsset') { item.subType = 'asset'; }
													if (item.subType === 'ServiceAvailability') { item.subType = 'service'; }
													filteredResults.push(item);
												}
												break;
											case "ks":
												item.type = source[0];
												item.subType = source[1].toLocaleLowerCase();
												item.itemId = source[2];
												rkmDetailsService.processRkmTextFields(item);
												filteredResults.push(item);
												break;
											case "srd":
											case "cloud_service":
												item.type = source[0];
												item.itemId = source[1];
												filteredResults.push(item);
												break;
										}

										var
											resultTypesWithThumbnails = ['user', 'microblog', 'checkin', 'checkout', 'reservation', 'group', 'location', 'asset', 'service', 'application'],
											userResultTypes = ['user', 'microblog', 'checkin', 'checkout', 'reservation'];

										if (resultTypesWithThumbnails.indexOf(item.subType) !== -1) {
											item.profileType = item.subType;
											item.profileId = item.itemId;
											item.thumbnail = attachmentService.normalizeDataUrlString(item.thumbnail, item.thumbnailMime);
										}
										if (userResultTypes.indexOf(item.subType) !== -1) {
											item.profileType = 'user';
											if (item.source) {
												item.profileId = item.source;
											}
										}
									}
								}
								self.globalSearchResults = filteredResults;
								self.globalSearchResults.searchTerm = response.requestedTerm;

								return self.globalSearchResults;
							}
						});
					/*self.globalSearchPromises.push(promise);
					return promise;*/
				};

				self.storeUserSelection = function (selectedItem) {
					return globalSearchService.SaveMatchingResult({ searchId: selectedItem.searchId, itemId: selectedItem.id }, { searchId: selectedItem.searchId, itemId: selectedItem.id });
				};


				self.openRkmItem = function (rkm) {
					return rkmDetailsService.showDialog({
						cleanTitle: rkm.cleanTitle,
						id: rkm.itemId,
						source: rkm.source,
						title: rkm.title
					});
				};

				self.selectSrd = function (srd) {
					return supportModel.getSRDById(srd.id)
						.then(function (result) {
							var selectedSRD = result[0].items[0];
							if (selectedSRD.hasCrossLaunchUrl) {
								return srdCreateService.showAifSrdCreateDialog(selectedSRD).result;
							} else {
								return srdCreateService.showServiceResourceSrdCreateDialog(selectedSRD, result).result;
							}
						})
						.catch(supportModel.onGetSrdByIdFailCallback);
				};


				return self;
			}
		]);