/**
 * @FileName: Util_LightningLookupHelper.js
 * @Description: Helper methods for Util_LightningLookup
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/14/2019         Created
 *-----------------------------------------------------------  
 */
({
    /*
     * @Name        search
     * @Description Searches for records that match the search string using the defined search parameters
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    search : function(component) {
        component.set("v.selectedResultId", null);
        component.set("v.message", "");

        let input = component.find("inputField");
        input.setCustomValidity("");
        input.reportValidity();

        let searchString = component.get("v.searchString");

        let parent = component.get("v.parent");

        if(parent) {
            parent.onChange(parent, event);
        }

        if(searchString.length > 2) {
            component.set("v.isLoading", true);

            let action = component.get("c.executeSearch");

            let criteria = {
                "searchString" : searchString,
                "filtersByObject" : component.get("v.filtersByObject"),
                "queryFilters" : component.get("v.queryFilters"),
                "comparisonField" : component.get("v.comparisonField"),
                "displayFields" : component.get("v.displayFields"),
                "resultLimit" : component.get("v.resultLimit"),
                "searchSOQL" : component.get("v.searchSOQL"),
                "noSharing" : component.get("v.noSharing")
            };

            action.setParams({
                "criteriaJSON" : JSON.stringify(criteria)
            });

            action.setCallback(this, function(response) {
                let success = LightningUtils.handleCalloutResponse(response, "Error Retrieving Search Results");

                if(success === true) {
                    let results = JSON.parse(response.getReturnValue());

                    if(results.length > 0) {
                        component.set("v.showResults", true);
                        component.set("v.message", "");
                    } else {
                        component.set("v.showResults", false);
                        component.set("v.message", "No Results Found...");
                    }

                    component.set("v.searchResults", JSON.parse(response.getReturnValue()));
                }

                component.set("v.isLoading", false);
            });
            $A.enqueueAction(action);
        } else {
            component.set("v.searchResults", null);
            component.set("v.showResults", false);
            component.set("v.message", "");
        }
    },

    /*
     * @Name        blur
     * @Description Hides the search results when the search input is no longer focused
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    blur : function(component) {
        if(component.get("v.cancelBlur") === true) {
            component.set("v.cancelBlur", false);
        } else {
            component.set("v.showResults", false);
        }
    },

    /*
     * @Name        focus
     * @Description Shows previous search results and hides any messaging when the search input is re-focused
     * @Author      Graeme Ward
     * @Params      component
     * @Return      void
     */
    focus : function(component) {
        component.set("v.showResults", true);
        component.set("v.message", "");
    },

    /*
     * @Name        handleSelectEvt
     * @Description Sets the selected record details to pass back to the parent component
     * @Author      Graeme Ward
     * @Params      component
     *              event
     * @Return      void
     */
    handleSelectEvt : function(component, event) {
        let result = event.getParam("result");
        component.set("v.selectedResultId", result.record.Id);
        component.set("v.searchString", result.displayValue);
        component.set("v.searchResults", null);
        component.set("v.showResults", false);
        component.set("v.message", "");

        let parent = component.get("v.parent");

        if(parent) {
            parent.onChange(parent, event);
        }
    }
});