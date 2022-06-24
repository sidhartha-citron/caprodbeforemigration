({
    expandContractSection: function(component, event, helper) {
		helper.handleExpandContractSection(component, event, helper);
	},
    
    newRowsRequest: function(component, event, helper) {
		helper.handleNewRowsRequest(component, event, helper);
	},
        
    removeRow : function(component, event, helper) {
        helper.handleRemoveRow(component, event, helper);
    },
    
    rebuildOrderItemList: function (component, event, helper) {
        helper.handleRebuildOrderItemList(component, event, helper);
    },
    
    updatePageNumber: function (component, event, helper) {
        helper.handleUpdatePageNumber(component, event, helper);
    },
    
    updateSelectedOrderItems: function (component, event, helper) {
        helper.handleUpdateSelectedOrderItems(component, event, helper);
    },
    
    validateSurveyLocations: function (component, event, helper) {
        helper.handleValidateSurveyLocations(component, event, helper);
    },
    
    toggleTableSpinner: function(component, event, helper) {
        helper.handleToggleTableSpinner(component, event, helper);
    }
})