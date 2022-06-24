    angular.module('selfServiceApp')
		.factory('globalSearchService', ['$resource',
			function ($resource) {
				return $resource(angular.restPrefix + 'rest/v2/global_search',
					{},
					{
						RunGlobalSearch: {
							method: 'GET',
							transformRequest: function (data, headerGetter) {
								var headers = headerGetter();
								headers.requestedTime = (function () { return new Date().getTime() })();
							},
							interceptor: {
								response: function (requestInfo) {
									if (requestInfo.status == 200) {
										try {
											requestInfo.data.requestTime = requestInfo.config.headers.requestedTime;
											requestInfo.data.requestedTerm = requestInfo.config.params.term;
											if (requestInfo.data) {
												return requestInfo.data;
											}
										} catch (err) {
											return requestInfo;
										}
									}
								}
							}
						},
						SearchRKMItem: {
							url: angular.restPrefix + 'rest/knowledgesearch/full',
							isArray: true,
							method: "POST"
						},
						SaveMatchingResult: {
							method: 'POST',
							isArray: true
						}
					});
			}
		]);
