/**
 * @FileName: ServicePlanManagerFieldChangeModalHelper.js
 * @Description: Helper methods for ServicePlanManagerFieldChangeModal
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       12/13/2019         Created
 *-----------------------------------------------------------  
 */
({
    confirmed : function(component, event) {
        let evt = component.getEvent("ServicePlanManagerConfirmation");

        evt.setParams({
            "confirmationType" : component.get("v.confirmationType"),
            "confirmationValue" : event.getSource().get("v.value")
        });

        evt.fire();

        this.closeModal(component);
    },

    closeModal : function(component) {
        component.destroy();
    }
});