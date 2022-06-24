({
	clearItem : function(component, event, helper){
        var currentItem = component.get("v.selectedProd");
        
        var clearEvent = component.getEvent("clearProd");
        clearEvent.setParams({
            record: currentItem
        }).fire();
    },
    
    changeQty : function(component, event, helper){
        var currentItem = component.get("v.selectedProd"); 
        var qty = component.find("qty").get("v.value");
        console.log("Quantity: " + qty);
        console.log("Previous Quantity: " + currentItem.prevQuantity);
        
        if (qty == null || qty <= 0) {
            qty = 1;
            component.find("qty").set("v.value", qty);
        }
        
        var freqItem = component.get("v.frequencyOptions").find(function(item){
            if (item.option.value === currentItem.item.Frequency__c){
                return item;
            }                                  
        });
        
        
        currentItem.discountedPrice = currentItem.item.UnitPrice * (1-freqItem.discount/100);
        console.log('Cartkey from Cart ' +  currentItem.cartKey);
        var qtyEvent = component.getEvent("changeQty");
        qtyEvent.setParams({
            record: currentItem,
            quantity: qty,
            adjust: true
        }).fire();
    },
    
})