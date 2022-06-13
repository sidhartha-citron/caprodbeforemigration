/**
 * Created by timothychiang on 2018-10-26.
 */
({
    /**
    * form init function
    *
    */
    init: function(component, event, helper) {

    },

    /**
    * handle spinner events captured
    *
    */
    handleSpinnerEvent: function(component, event, helper) {
        var action = event.getParam("action");

        switch (action) {
            case 'Spinner Show':
                helper.showSpinner(component);
                break;
            case 'Spinner Hide':
                helper.hideSpinner(component);
                break;
        }
    },
})