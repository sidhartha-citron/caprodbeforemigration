/**
 * @FileName: Util_LightningLookupResultHelper.js
 * @Description: Helper methods for Util_LightningLookupResult
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/15/2019         Created
 *-----------------------------------------------------------  
 */
({
    /*
     * @Name        selectResult
     * @Description Fires an event when a lookup result record is selected
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    selectResult : function(component) {
        let evt = component.getEvent("selectResultEvt");
        evt.setParams({"result" : component.get("v.result")});
        evt.fire();
    }
});