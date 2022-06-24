/**
 * @FileName: ServicePlanManagerItemListController.js
 * @Description: Controller methods for ServicePlanManagerItemList
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/22/2019      Created
 *-----------------------------------------------------------  
 */
({
    doInit : function(component, event, helper) {
        helper.setMessage(component);
        helper.getOrderItemsInit(component);
    },

    getItems : function(component, event, helper) {
        helper.getOrderItems(component);
    },

    setMessage : function(component, event, helper) {
        helper.setMessage(component, event);
    },

    selectAll : function(component, event, helper) {
        helper.selectAll(component, event);
    },

    selectOne : function(component, event, helper) {
        helper.selectOne(component, event);
    },

    showItemDetail : function(component, event, helper) {
        helper.showItemDetail(component, event);
    },

    confirmItemDetailSelections : function(component, event, helper) {
        helper.confirmItemDetailSelections(component, event);
    },

    assignItems : function(component, event, helper) {
        helper.assignItems(component);
    }
});