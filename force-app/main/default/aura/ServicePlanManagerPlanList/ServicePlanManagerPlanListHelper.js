/**
 * @FileName: ServicePlanManagerPlanListHelper.js
 * @Description:
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/15/2019         Created
 *-----------------------------------------------------------  
 */
({
    selectPlan : function(component, event) {
        let plan = event.getSource().get("v.value");
        component.set("v.selectedPlan", plan);
    }
});