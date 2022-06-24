/**
 * @FileName: TechCapacityTechnicianDetailHelper.js
 * @Description: Helper methods for TechCapacityTechnicianDetail
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/18/2019         Created
 *-----------------------------------------------------------  
 */
({
    /*
     * @Name        setTechnician
     * @Description Retrieves a Technician id from an application event and sets it on the component
     * @Author      Graeme Ward
     * @Params      component
     *              event
     * @Return      void
     */
    setTechnician : function(component, event) {
        component.set("v.technicianId", event.getParam("technicianId"));
        this.setTechnicianDetails(component);
    },

    /*
     * @Name        setTechnicianDetails
     * @Description Fetches all required details using the Technician id and sets them on the component
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    setTechnicianDetails : function(component) {
        let action = component.get("c.getTechnician");

        action.setParams({"technicianId" : component.get("v.technicianId")});

        action.setCallback(this, function(response) {
            let success = LightningUtils.handleCalloutResponse(response, $A.get("$Label.c.TCW_Retrieve_Technician_Error"));

            if(success === true) {
                let technician = JSON.parse(response.getReturnValue());

                component.set("v.technician", technician);

                let travelTime = (technician.travelTime / 60).toFixed(2) + ' hr (' + technician.travelTime + ' min)';
                component.set("v.travelTime", travelTime);

                this.refreshCalendar(component, technician);
            }
        });
        $A.enqueueAction(action);
    },

    /*
     * @Name        refreshCalendar
     * @Description Fires an application event that refreshes any listening components
     * @Author      Graeme Ward
     * @Params      component
     *              technician: wrapper containing Technician information
     * @Return      void
     */
    refreshCalendar : function(component, technician) {
        let evt = $A.get("e.c:TechCapacityCalendarRefreshEvt");
        evt.setParams({
            "technician" : technician
        });
        evt.fire();
    }
});