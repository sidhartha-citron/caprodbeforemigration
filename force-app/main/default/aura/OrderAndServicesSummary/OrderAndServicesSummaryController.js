({
    init : function(component, event, helper) {
        helper.createSummaryView(component, event, helper);
    },

    changeStateToEdit: function(component, event, helper) {
        var p = component.get("v.parent");
        p.changeState('Edit');
    }
})