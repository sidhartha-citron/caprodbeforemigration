	angular.module('selfServiceApp')
		.factory('thumbnailCache', ['attachmentService', '$http', '$interval',
			function (attachmentService, $http, $interval) {
				var
					self = {},
					cache = {},
					queue = [],
					loadingFlags = {},
					/** Flags to see if thumbnail was already requested from server */
					responseFlags = {},
					allowedItemTypes = ['user', 'group', 'location', 'asset', 'service', 'application', 'service_offering'];


				self.get = function (itemType, itemId) {
					var cachedThumbnail = cache[itemType + itemId];

					// If type and ID are not empty, and there is no thumbnail, it is not in queue currently, it is not loading currently, and it was not loaded in current session...
					if (itemType && itemId && !cachedThumbnail && !_.findWhere(queue, { type: itemType, id: itemId }) &&  !loadingFlags[itemType + itemId] && !responseFlags[itemType + itemId]) {
						// ...add thumbnail to the quere, which will be passed to server by
						queue.push({
							type: itemType,
							id: itemId
						})
					}

					return cachedThumbnail;
				};


				self.put = function (itemType, itemId, thumbnail, thumbnailMime) {
					switch (itemType) {
						case 'resource':
							itemType = 'asset';
							break;
						case 'building':
							itemType = 'location';
							break;
					}

					if (~allowedItemTypes.indexOf(itemType)) {
						cache[itemType + itemId] = attachmentService.normalizeDataUrlString(thumbnail, thumbnailMime);
						responseFlags[itemType + itemId] = true;
					}
				};


				self.remove = function (itemType, itemId) {
					cache[itemType + itemId] = null;
					responseFlags[itemType + itemId] = false;
				};


				/**
				 * Use <code>query</code> with types and IDs to retrieve thumbnails from server in bulk
				 */
				self.queryServer = function () {
					if (!queue.length) { return; }

					var itemsPerPage = 500;
					var currentQueue = queue.splice(0, queue.length);

					// Walk query by type
					_.each(_.groupBy(currentQueue, 'type'), function (currentTypeProfiles, currentType) {
						// Set up loading flags for requested thumbnails
						for (var i = 0, l = currentTypeProfiles.length; i < l; i++) {
							loadingFlags[currentTypeProfiles[i].type + currentTypeProfiles[i].id] = true;
						}

						var pages = Math.ceil(currentTypeProfiles.length / itemsPerPage);

						// Since response is paged, requests are made based on number of items in queue, and itemsPerPage
						_.times(pages, function (i) {
							$http({
								url: angular.restPrefix + 'rest/v2/profile',
								method: 'POST',
								params: {
									type: currentType,
									items_per_page: itemsPerPage,
									page: i + 1
								},
								data: _.pluck(currentTypeProfiles, 'id')
							})
								.then(function (response) {
									if (response.data && response.data[0] && angular.isArray(response.data[0].items)) {
										for (var i = 0, l = response.data[0].items.length; i < l; i++) {
											var item = response.data[0].items[i];
											self.put(item.profileType, item.elementId, item.thumbnail, item.thumbnailMime);
											loadingFlags[item.profileType + item.elementId] = false;
										}
									}
								});
						});
					});
				};


				// Queue will be checked every second, and query will be done if needed
				$interval(self.queryServer, 1000);


				return self;
			}
		]);