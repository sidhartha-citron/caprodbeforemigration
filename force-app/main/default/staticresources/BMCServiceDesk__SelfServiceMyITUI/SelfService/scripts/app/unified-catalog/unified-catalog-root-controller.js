
	angular.module('unifiedCatalogModule')
		.controller('UnifiedCatalogRootController', UnifiedCatalogRootController);

	UnifiedCatalogRootController.$inject = ['unifiedCatalogModel'];

	function UnifiedCatalogRootController(unifiedCatalogModel) {

		unifiedCatalogModel.getAllSections();

	}
