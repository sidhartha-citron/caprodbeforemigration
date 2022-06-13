({
    init : function(component, event, helper) {
        helper.getSummary(component, event, helper);
    },

    changeState: function(component, event, helper) {
        var params = event.getParam('arguments');
        if (params) {
            var state = params.state;

            component.set('v.viewState', state);
        }
    },
})