({
    showToast : function(component) {
        var isTimeOut = component.get("v.toastTimeOut"); 
        console.log('Toast Time Out ' + isTimeOut); 
        var divToHide = component.find("divToHide");
        $A.util.toggleClass(divToHide, "slds-hide");
        
        if(isTimeOut) {
            divToHide.getElement().focus();   
            window.setTimeout(
                function(){
                    var divToHide = component.find("divToHide");
                    divToHide.getElement().focus();  
                },1);
            
            window.setTimeout(
                $A.getCallback(function(){
                    var divToHide = component.find("divToHide");
                    $A.util.removeClass(divToHide, "slds-show");
                    $A.util.addClass(divToHide, "slds-hide");  
                }),2000); 
        }   
    },
    
    hideToast: function(component) {
        var divToHide = component.find("divToHide");
        $A.util.removeClass(divToHide, "slds-show");
        $A.util.addClass(divToHide, "slds-hide");  
    }
})