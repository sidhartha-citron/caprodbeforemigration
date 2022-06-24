/**
 * @FileName: GenerateWorkOrdersController.js
 * @Description: Controller methods for GenerateWorkOrders
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/1/2020        Created
 *-----------------------------------------------------------  
 */
({
    doInit : function(component, event, helper) {
        helper.setContent(component);
    },

    cancel : function(component, event, helper) {
        helper.closeAction(component);
    },

    confirm : function(component, event, helper) {
        helper.generateWorkOrders(component);
    }
});