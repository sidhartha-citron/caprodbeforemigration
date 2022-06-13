/**
 * @FileName: TechCapacityTechnicianListHelper.js
 * @Description: Helper for TechCapacityTechnicianList
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/18/2019         Created
 *-----------------------------------------------------------
 */
({
    /*
     * @Name        doInit
     * @Description Construct search parameters
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    doInit : function(component) {
        let lookupFilter = {
            "ServiceResource" : "Id, Name"
        };

        component.set("v.lookupFilter", lookupFilter);
        component.set("v.queryFilter", "AND IsActive = TRUE");
        component.set("v.comparisonField", "Name");
        component.set("v.displayFields", ["Name"]);
    },


    /*
     * @Name        selectTechnician
     * @Description Fires an application event to inform other components when a Technician is selected
     * @Author      Graeme Ward
     * @Params      component
     *              event
     * @Return      void
     */
    selectTechnician : function(component, event) {
        let technicianId = component.get("v.selectedId");

        if(technicianId) {
            let evt = $A.get("e.c:TechCapacityTechnicianSelectEvt");
            evt.setParams({
                "technicianId" : technicianId
            });
            evt.fire();
        }
    }
});