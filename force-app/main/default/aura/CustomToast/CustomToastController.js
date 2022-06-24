({
    setType : function(component, event, helper) {
        component.set("v.toastTimeOut", event.getParam('arguments').toastTimeOut);
    },
    
    showMessage : function(component, event, helper) {
        component.set("v.toastTitle", event.getParam('arguments').title);
        component.set("v.message", event.getParam('arguments').msg);
        component.set("v.toastType", event.getParam('arguments').toastType);
        
       helper.showToast(component);
       
    },
    
    closeToast: function(component, event, helper)
    {
        helper.hideToast(component);
    }
})