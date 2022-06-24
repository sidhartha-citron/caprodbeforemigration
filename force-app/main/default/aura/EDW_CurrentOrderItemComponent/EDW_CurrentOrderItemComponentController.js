({
	deleteOrderItem : function(component, event, helper) {
        helper.handleDeleteOrderItem(component, event, helper);
	},
    
    bindSurveyLocation: function(component, event, helper) {
        helper.handleBindSurveyLocation(component, event, helper);
    },
        
    updateOrderItem: function(component, event, helper) {
        helper.handleUpdateOrderItem(component, event, helper);
    },
    
    openNewSurveyLocationForm: function(component, event, helper) {
        helper.handleOpenNewSurveyLocationForm(component, event, helper);
    },
    
    openEditSurveyLocationForm: function(component, event, helper) {
        helper.handleOpenEditSurveyLocationForm(component, event, helper);
    },
    
    updatePOToOrderItem: function(component, event, helper) {
        helper.handleUpdatePOToOrderItem(component, event, helper);
    },
    
    rowSelected: function(component, event, helper) {
        helper.handleRowSelected(component, event, helper);
    }
})