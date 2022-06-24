	angular.module('supportModule')
		.controller('SupportBrowserController', ['$scope', 'supportModel', 'rebrandingModel', '$state', '$filter',
			function ($scope, supportModel, rebrandingModel, $state, $filter) {
				$scope.$state = $state;
				$scope.supportModel = supportModel;
				$scope.rebrandingModel = rebrandingModel;
				$scope.menu = [
					{
						statePrefix: 'problem-requests',
						state: 'support.problem-requests.quick-pick',
						title: rebrandingModel.data.toBeFixed,
						icon: 'i-i_need_something_fixed_tab'
					},
					{
						statePrefix: 'other-requests',
						state: 'support.other-requests.quick-pick',
						title: rebrandingModel.data.smthNeed,
						icon: 'i-i_need_something_else_tab'
					},
					{
						statePrefix: 'how-to',
						state: 'support.howto.quick-pick',
						title: rebrandingModel.data.howToNeed,
						icon: 'i-how_to_resources_tab'
					}
				];

				$scope.getTitle = function () {
					if ($state.$current.data.type === 'problem-requests') {
						return rebrandingModel.data.toBeFixed;
					}
					if ($state.$current.data.type === 'other-requests') {
						return rebrandingModel.data.smthNeed;
					}
					if ($state.$current.data.type === 'how-to') {
						return rebrandingModel.data.howToNeed;
					}
				};

				$scope.goBack = function () {
					var currCategoryId = $state.params.categoryId;
					if (currCategoryId) {
						$scope.prevState = getPrevCategoryState($state.$current.data.type);
					}
					$state.go($scope.prevState, $scope.prevStateParams);
				};

				var getPrevCategoryState = function (viewType) {
					var parentCategory = supportModel.parentCategoryHash[$state.params.categoryId];
					if (parentCategory) {
						$scope.prevStateParams = { categoryId: parentCategory.id };
						return 'support.' + viewType + '.all.category';
					} else {
						return 'support.' + viewType + '.all';
					}
				};

				var handlePrevState = function () {
					var backLinkTitle,
						viewType = $state.$current.data.type;

					$scope.prevStateParams = {};

					switch (viewType) {
						case 'problem-requests':
							if ($state.current.name === 'support.problem-requests.all') {
								backLinkTitle='';$scope.showBackLink=false;
								//backLinkTitle = $filter('i18n')('support.navigation.backToQuickPick');
								//$scope.prevState = 'support.problem-requests.quick-pick';
							} else if ($state.params.categoryId) {
								//backLinkTitle = $filter('i18n')('common.navigation.back');
							} else {
								backLinkTitle = '';
							}
							break;
						case 'other-requests':
							if ($state.current.name === 'support.other-requests.all') {
								//backLinkTitle = $filter('i18n')('support.navigation.backToQuickPick');
								$scope.prevState = 'support.other-requests.quick-pick';
							} else if ($state.params.categoryId) {
								//backLinkTitle = $filter('i18n')('common.navigation.back');
							} else {
								backLinkTitle = '';
							}
							break;
						case 'how-to':
							if ($state.current.name === 'support.howto.all') {
								//backLinkTitle = $filter('i18n')('support.navigation.backToQuickPick');
								$scope.prevState = 'support.howto.quick-pick';
							} else {
								backLinkTitle = '';
								$scope.showBackLink=false;
							}
							break;
						default:
							backLinkTitle = '';
							$scope.showBackLink=false;
					}
					$scope.backLinkTitle = backLinkTitle;
				};

				$scope.$watch('$state.current.name', handlePrevState);

			}
		]);
