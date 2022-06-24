/**
 * @FileName: LightningUtils
 * @Description: Utility methods for lightning components
 * @Author: Graeme Ward
 * @ModificationLog:
 *----------------------------------------------------------------
 * Author           Date          Modification
 * Graeme Ward      10/18/2019    Created
 *----------------------------------------------------------------
 */
window.LightningUtils = (function() {

    return {
        handleCalloutResponse : function(response, errorTitle, errorMessage) {
            let state = response.getState();
            let responseValue = response.getReturnValue();

            // parse if response value is JSON, otherwise continue
            try {
                responseValue.JSON.parse(responseValue);
            } catch (e) {}

            if (state === "SUCCESS") return true;

            let error = (typeof errorMessage === "undefined") ? response.getError() : errorMessage;

            if(state === "ERROR") {
                errorMessage = this.handleCalloutError(errorTitle, error);
            }
            else {
                errorMessage = this.handleCalloutError("An unknown error has occurred", response.getError());
            }

            return errorMessage;
        },

        handleCalloutError : function(title, error) {
            let message = $A.util.isArray(error) ? this.parseError(error) : error;

            this.setToast(title, message, "error");

            return message;
        },

        parseError : function(error) {
            let message = "";

            for(let e of error) {
                if(e) message += e.message + "\n";
            }

            return message;
        },

        setToast : function(title, message, toastType, mode) {
            mode = (typeof mode === "undefined") ? "dismissable" : mode;

            let toast = $A.get("e.force:showToast");
            toast.setParams({
                "title": title,
                "message": message,
                "type": toastType,
                "mode": mode
            })
            toast.fire();
        },

        checkFormValidity : function(component) {
            let isValid = true;

            // validate lightning:input
            let inputs = component.find("inputField");

            if(inputs !== undefined) {
                if(inputs.length !== undefined) {
                    for(let i of inputs) {
                        if(!i.checkValidity()) {
                            isValid = false;
                            i.reportValidity();
                        }
                    }
                } else {
                    if(!inputs.checkValidity()) {
                        isValid = false;
                        inputs.reportValidity();
                    }
                }
            }

            // validate lightning:select
            let selects = component.find("selectField");

            if(selects !== undefined) {
                if(selects.length !== undefined) {
                    for(let s of selects) {
                        if(!s.checkValidity()) {
                            isValid = false;
                            s.showHelpMessageIfInvalid();
                        }
                    }
                } else {
                    if(!selects.checkValidity()) {
                        isValid = false;
                        selects.showHelpMessageIfInvalid();
                    }
                }
            }

            // validate ui:inputSelect
            let inputSelects = component.find("inputSelectField");

            if(inputSelects !== undefined) {
                if(inputSelects.length !== undefined) {
                    for(let is of inputSelects) {
                        if($A.util.isEmpty(is.get("v.value"))) {
                            isValid = false;
                            is.set("v.errors", [{message:"Complete this field."}]);
                        }
                    }
                } else {
                    if($A.util.isEmpty(inputSelects.get("v.value"))) {
                        isValid = false;
                        inputSelects.set("v.errors", [{message:"Complete this field."}]);
                    }
                }
            }

            // validate custom lightning lookup
            let lookups = component.find("lookupField");

            if(lookups !== undefined) {
                if(lookups.length !== undefined) {
                    for(let l of lookups) {
                        let lookup = l.find("inputField");

                        if(l.get("v.searchString") && !l.get("v.selectedResultId")) {
                            lookup.setCustomValidity("An invalid option has been chosen.");
                        } else {
                            lookup.setCustomValidity("");
                        }

                        if(!lookup.checkValidity()) {
                            isValid = false;
                            lookup.reportValidity();
                        }
                    }
                } else {
                    let lookup = lookups.find("inputField");

                    if(lookups.get("v.searchString") && !lookups.get("v.selectedResultId")) {
                        lookup.setCustomValidity("An invalid option has been chosen.");
                    } else {
                        lookup.setCustomValidity("");
                    }

                    if(!lookup.checkValidity()) {
                        isValid = false;
                        lookup.reportValidity();
                    }
                }
            }

            if(!isValid) {
                // display alert for user to review errors
                LightningUtils.setToast("Error", "Please review all errors on the form.", "error");
            }

            return isValid;
        },

        selectAll : function(component, event) {
            let checked = event.getSource().get("v.checked");

            let checkboxes = component.find("checkbox");

            if(checkboxes !== undefined) {
                if(checkboxes.length !== undefined) {
                    for(let c of checkboxes) {
                        if(!c.get("v.disabled")) {
                            c.set("v.checked", checked);
                        }
                    }
                } else {
                    if(!checkboxes.get("v.disabled")) {
                        checkboxes.set("v.checked", checked);
                    }
                }
            }
        },

        deselectSelectAll : function(component, event) {
            component.find("checkboxAll").set("v.checked", false);
        }
    }
}());