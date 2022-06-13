/**
 * @FileName: ServicePlanManagerConfirmationModalHelper.js
 * @Description: Helper methods for ServicePlanManagerConfirmationModal
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/22/2019         Created
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