/**
 * @FileName: TechCapacityRouteViewController.js
 * @Description: Controller for TechCapacityRouteView
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/18/2019         Created
 *-----------------------------------------------------------
 */
({
    doInit : function(component, event, helper) {
        helper.loadCalendar(component);
    },

    getRouteDetails : function(component, event, helper) {
        helper.getServicePlans(component, event);
    },

    showDayDetails : function(component, event, helper) {
        helper.showDayDetails(component, event);
    }
});