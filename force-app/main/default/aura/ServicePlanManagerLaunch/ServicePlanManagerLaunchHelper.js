/**
 * @FileName: ServicePlanManagerLaunchHelper.js
 * @Description: Helper methods for ServicePlanManagerLaunch
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/22/2019         Created
 *-----------------------------------------------------------  
 */
({
    checkPermissions : function(component) {
        let action = component.get("c.checkPermissions");

        action.setCallback(this, function(response) {
            let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.SPM_Permission_Check_Error"));

            if(success === true) {
                if(response.getReturnValue() !== "None") {
                    this.navigateToServicePlanManager(component);
                }
                else {
                    LightningUtils.setToast($A.get("$Label.c.Error"), $A.get("$Label.c.SPM_Permission_Error"), "error");
                }
            }

            $A.get("e.force:closeQuickAction").fire();
        });
        $A.enqueueAction(action);
    },

    navigateToServicePlanManager : function(component) {
        let pageReference = {
            type : "standard__component",
            attributes : {
                componentName : "c__ServicePlanManager"
            },
            state: {
                c__accountId : String(component.get("v.recordId"))
            }
        };

        let navService = component.find("navService");
        navService.navigate(pageReference);
    }
});