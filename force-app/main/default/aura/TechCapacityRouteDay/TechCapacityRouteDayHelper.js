/**
 * @FileName: TechCapacityRouteDayHelper.js
 * @Description: Helper methods for TechCapacityRouteDay
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       10/31/2019         Created
 *-----------------------------------------------------------  
 */
({
    /*
     * @Name        showDayDetails
     * @Description Fires a component event for the parent component to construct the day detail modal
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    showDayDetails : function(component) {
        let day = component.get("v.day");

        if(day.calls > 0) {
            let evt = component.getEvent("showDayDetails");
            evt.setParams({
                "day" : day
            });
            evt.fire();
        }
    }
});