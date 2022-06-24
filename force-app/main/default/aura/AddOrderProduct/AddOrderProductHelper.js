({
    validateForm : function(component) {
        
        var isValidated = true;
        var pricePresent = false;
        var servicePrice = true;
        var purchasePrice = true;
        var installationPrice = true;
        
        if(component.get("v.theRecord.Product2Id") == null) {
            console.log('product null');
            var eCmp = component.find("Product");
            $A.util.removeClass(eCmp, 'slds-hide');
        } else {
            var eCmp = component.find("Product");
            $A.util.addClass(eCmp, 'slds-hide');
        }

        var sCmp = component.find('Service');
        var sValue = sCmp.get('v.value');
        if($A.util.isEmpty(sValue)) {
            servicePrice = false;
            //sCmp.set('v.errors', [{message: 'Please enter the Quantity'}]);
        }
        
        var sCmp = component.find('Installation');
        var sValue = sCmp.get('v.value');
        if($A.util.isEmpty(sValue)) {
            installationPrice = false;
            //sCmp.set('v.errors', [{message: 'Please enter the Quantity'}]);
        }
        
        var sCmp = component.find('Purchase');
        var sValue = sCmp.get('v.value');
        if($A.util.isEmpty(sValue)) {
            purchasePrice = false;
            //sCmp.set('v.errors', [{message: 'Please enter the Quantity'}]);OrderProduct_Price_Fill_In
        }
        pricePresent = servicePrice || installationPrice || purchasePrice;
        if(!pricePresent) {
            var customToast = component.find("customToast");    
            customToast.setCloseType(false);
            customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                     $A.get("$Label.c.OrderProduct_Price_Fill_In"), 'ERROR');
            
        } else {
            var customToast = component.find("customToast");    
            customToast.setCloseType(true);
            customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Success_Title"), 
                                    $A.get("$Label.c.Record_Creation_Success"), 'SUCCESS');
        }
        console.log(' validation helper  : pricePresent ' + pricePresent + ' isvalidated: ' + isValidated)
        
        return isValidated && pricePresent;
    }, 
    
    fetchColumnNames : function(component) {
        var initColumns = component.get("c.getColumns");
        initColumns.setParams({
            "columnAPINames": component.get("v.columnAPINames")
        });   
        initColumns.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS"){
                component.set("v.columns", response.getReturnValue());
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(initColumns);
    }
})