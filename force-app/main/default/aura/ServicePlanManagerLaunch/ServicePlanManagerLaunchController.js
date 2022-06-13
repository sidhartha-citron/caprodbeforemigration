/**
 * @FileName: ServicePlanManagerLaunchController.js
 * @Description: Controller methods for ServicePlanManagerLaunch
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
    }
});