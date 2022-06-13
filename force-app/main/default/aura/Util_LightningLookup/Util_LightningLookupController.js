/**
 * @FileName: Util_LightningLookupController.js
 * @Description: Controller methods for Util_LightningLookup
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/14/2019         Created
 *-----------------------------------------------------------  
 */
({
    search : function(component, event, helper) {
        helper.search(component);
    },

    blur : function(component, event, helper) {
        helper.blur(component);
    },

    focus : function(component, event, helper) {
        helper.focus(component);
    },

    handleSelectEvt : function(component, event, helper) {
        helper.handleSelectEvt(component, event);
    }
});