/**
 * @FileName: ServicePlanManagerFormController.js
 * @Description: Controller methods for ServicePlanManagerController
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       12/4/2019         Created
 *-----------------------------------------------------------  
 */
({
    doInit : function(component, event, helper) {
        helper.initializeLookupFilters(component);
        helper.initializeServicePlan(component);
    },

    checkFields : function(component, event, helper) {
        helper.checkFields(component, event)
    },

    confirmation : function(component, event, helper) {
        helper.confirmation(component, event);
    },

    createOrUpdateServicePlan : function(component, event, helper) {
        helper.upsertServicePlan(component);
    },

    refresh : function(component, event, helper) {
        helper.refresh(component);
    }
});