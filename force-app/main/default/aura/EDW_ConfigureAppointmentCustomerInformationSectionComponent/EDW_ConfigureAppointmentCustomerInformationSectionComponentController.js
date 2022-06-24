({
    expandContractSection: function(component, event, helper) {
        helper.handleExpandContractSection(component, event, helper);
    },
    
    savePONumber: function(component, event, helper) {
        helper.handleSavePONumber(component, event, helper);
    },
    
    validateDuration: function(component, event, helper) {
        helper.handleValidateDuration(component, event, helper);
    },
    
    workTypeEstimatedDurationListener: function(component, event, helper) {
        helper.handleWorkTypeEstimatedDurationListener(component, event, helper);
    },
    
    changeNumberOfResources: function(component, event, helper) {
        helper.handleChangeNumberOfResources(component, event, helper);
    },
    
    changeEffectiveDate: function(component, event, helper) {
        helper.handleChangeEffectiveDate(component, event, helper, true);
    },
    
    changeEffectiveTime: function(component, event, helper) {
        helper.handleChangeEffectiveDate(component, event, helper, false);
    },
    
    saveDescription: function(component, event, helper) {
        helper.handleSaveDescription(component, event, helper);
    },
    
    saveOrderName: function(component, event, helper) {
        helper.handleSaveOrderName(component, event, helper);
    },
    
    switchOperatingHoursRequirement: function(component, event, helper) {
        helper.handleSwitchOperatingHoursRequirement(component, event, helper);
    }
})