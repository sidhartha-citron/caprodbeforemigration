/**
 * @FileName: GenerateWorkOrdersHelper.js
 * @Description: Helper methods for GenerateWorkOrders
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/1/2020        Created
 *-----------------------------------------------------------  
 */
({
    setContent : function(component) {
        component.set("v.spinner", true);

        let action = component.get("c.setContent");

        action.setParams({"recordId" : component.get("v.recordId")});
        
        action.setCallback(this, function(response) {
            let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.WO_Generation_Content_Error"));

            if(success === true) {
                let res = JSON.parse(response.getReturnValue());
                component.set("v.content", res.content);
                component.set("v.isValid", res.isValid);
            } else {
                this.closeAction(component);
            }

            component.set("v.spinner", false);
        });
        $A.enqueueAction(action);
    },

    closeAction : function(component) {
        $A.get("e.force:closeQuickAction").fire();
    },

    generateWorkOrders : function(component) {
        component.set("v.spinner", true);

        let action = component.get("c.generateWorkOrders");

        action.setParams({"recordId" : component.get("v.recordId")});
        
        var recid = component.get("v.recordId");
        var isacct = recid.startsWith("001");
        console.log("--" + isacct);

        action.setCallback(this, function(response) {
            let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.WO_Generation_Error"));

            if(success === true) {
                if(isacct){
                    LightningUtils.setToast("Success", "WO Generation Jobs scheduled for the account. Check in a few minutes. Contact Admin for help in case of failure.", "success");
                } else {
                	LightningUtils.setToast("Success", $A.get("$Label.c.WO_Generation_Success"), "success");
                }
            }

            this.closeAction(component);
            component.set("v.spinner", false);
        });
        $A.enqueueAction(action);
    }
});