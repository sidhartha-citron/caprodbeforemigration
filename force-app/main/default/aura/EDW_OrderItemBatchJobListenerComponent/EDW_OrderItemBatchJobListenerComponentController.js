({
    doInit : function(component, event, helper) {
        helper.handleInit(component, event, helper);
    },
    
    killComponentListener: function(component, event, helper) {
        helper.handleKillComponentListener(component, event, helper);
    }
})