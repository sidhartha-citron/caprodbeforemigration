({
    doInit : function(component, event, helper) {
        var toast = component.get("v.toastType"); 
        
        if (toast == 'error') {
           component.set("v.toastCss",'slds-notify slds-notify_toast slds-theme_error');
        } else if (toast == 'success') {
            component.set("v.toastCss",'slds-notify slds-notify_toast slds-theme_success');
        } else if (toast == 'warning') {
            component.set("v.toastCss",'slds-notify slds-notify_toast slds-theme_warning');
        }
 	},
    
 	closeIcon : function(component, event, helper) {
        var toastCmp = component.find("toastCmp");
        $A.util.toggleClass(toastCmp, "slds-hide");
 	}
})