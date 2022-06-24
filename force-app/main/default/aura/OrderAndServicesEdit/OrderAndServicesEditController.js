({
    init : function(component, event, helper) {

    },

    changeStateToCaseView: function(component, event, helper) {

        if(helper.validate(component, event, helper)){
            var p = component.get("v.parent");
            p.changeState('CaseView');
        }
    },

    changeStateToSummary: function(component, event, helper) {
        var p = component.get("v.parent");
        p.changeState('Summary');
    }

})