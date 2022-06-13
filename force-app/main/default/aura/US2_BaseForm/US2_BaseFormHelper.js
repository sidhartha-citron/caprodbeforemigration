/**
 * Created by timothychiang on 2018-10-26.
 */
({
    /**
    * show spinner
    *
    */
    showSpinner: function(component) {
        component.set('v.showSpinner', true);
    },

    /**
    * hide spinner
    *
    */
    hideSpinner: function(component) {
        component.set('v.showSpinner', false);
    },
})