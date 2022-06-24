/**
 * @FileName: TechCapacityTechnicianDetailController.js
 * @Description: Controller for TechCapacityTechnicianDetail
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/18/2019         Created
 *-----------------------------------------------------------  
 */
({
    setTechnicianDetails : function(component, event, helper) {
        helper.setTechnician(component, event);
    },

    refreshTechnicianDetails : function(component, event, helper) {
        helper.setTechnicianDetails(component);
    }
});