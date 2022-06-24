/**
 * @FileName: ServicePlanManagerController.js
 * @Description: Controller methods for ServicePlanManager
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/22/2019         Created
 *-----------------------------------------------------------  
 */
({
    doInit : function(component, event, helper) {
        helper.checkPermissions(component);
    },

    refresh : function(component, event, helper) {
        helper.getAccountData(component);
    },

    setTabLabel : function(component, event, helper) {
        helper.setTabLabel(component);
    },

    handleActive : function(component, event, helper) {
        helper.handleActive(component, event);
    }
});