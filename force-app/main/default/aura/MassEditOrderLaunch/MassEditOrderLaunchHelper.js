/**
 * @FileName: MassEditOrderLaunchHelper.js
 * @Description:
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       8/20/2020         Created
 *-----------------------------------------------------------  
 */
({
    navigateToMassEdit : function(component) {
        let pageReference = {
            type : "standard__component",
            attributes : {
                componentName : "c__MassEditOrder"
            },
            state: {
                c__orderId : String(component.get("v.recordId"))
            }
        };

        let navService = component.find("navService");
        navService.navigate(pageReference);

        $A.get("e.force:closeQuickAction").fire();
    }
});