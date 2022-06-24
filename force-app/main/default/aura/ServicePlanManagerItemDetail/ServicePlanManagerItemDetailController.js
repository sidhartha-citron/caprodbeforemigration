/**
 * @FileName: ServicePlanManagerItemDetailController.js
 * @Description: Controller methods for ServicePlanManagerItemDetail
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       12/6/2019         Created
 *-----------------------------------------------------------  
 */
({
    selectAll : function(component, event, helper) {
        helper.selectAll(component, event);
    },

    cancel : function(component, event, helper) {
        helper.cancel(component);
    },

    confirm : function(component, event, helper) {
        helper.confirm(component);
    }
});