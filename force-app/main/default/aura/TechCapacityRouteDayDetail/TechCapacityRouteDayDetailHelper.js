/**
 * @FileName: TechCapacityRouteDayDetailHelper.js
 * @Description: Helper methods for TechCapacityRouteDayDetail
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/31/2019         Created
 *-----------------------------------------------------------  
 */
({
    /*
     * @Name        doInit
     * @Description Sets the list of Account wrappers for the given day
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    doInit : function(component) {
        let day = component.get("v.day");
        component.set("v.accounts", Object.values(day.accounts));
    },

    /*
     * @Name        navigateToRecord
     * @Description Opens the record detail page in a new tab
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    navigateToRecord : function(component, event) {
        let evt = $A.get("e.force:navigateToSObject");

        evt.setParams({
            "recordId" : event.getSource().get("v.value")
        });

        evt.fire();
    },

    /*
     * @Name        closeModal
     * @Description Closes the day detail modal
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    closeModal : function(component) {
        component.destroy();
    }
});