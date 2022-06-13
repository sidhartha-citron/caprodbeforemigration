({
    doInit : function(component, event, helper) {
        helper.handleInit(component, event, helper);
    },
        
    openNewSurveyLocationForm : function(component, event, helper) {
        helper.handleOpenNewSurveyLocationForm(component, event, helper);
    },
    
    hidePopup: function(component, event, helper) {
        helper.handleHidePopup(component, event, helper);
    },
    
    newSurveyLocationCreated: function(component, event, helper) {
        helper.handleUpdateSurveyLocations(component, event, helper);
        helper.handleHidePopup(component, event, helper);
    },
            
    navigateBack: function(component, event, helper) {
        helper.handleNavigateBack(component, event, helper);
    },
        
    saveAndNext: function (component, event, helper) {
        helper.handleSaveAndNext(component, event, helper);
    },
    
    updateTableOrderItemList: function (component, event, helper) {
        helper.handleUpdateTableOrderItemList(component, event, helper);
    },
    
    updateListOfSelectedOrderItems: function (component, event, helper) {
        helper.handleUpdateListOfSelectedOrderItems(component, event, helper);
    },
    
    navigateToNextScreen: function (component, event, helper) {
        helper.handleNavigateToNextScreen(component, event, helper);
    },
    
    orderCancelledPopup: function (component, event, helper) {
        helper.handleOrderCancelledPopup(component, event, helper);
    }
})