({
	validateQuantity : function(component, quantity) {
        
        if($A.util.isUndefinedOrNull(quantity) || quantity<=0) {
            var toastEvent = $A.get("e.force:showToast");
            toastEvent.setParams({
                title : 'Error',
                message: "Quantity Should be Greater than Zero(0)",
                duration:'2500',
                key: 'info_alt',
                type: 'error',
                mode: 'pester'
            });
            toastEvent.fire();
            return false;
        } else {
            return true;
        }
		
	}
})