({
    doInit: function(component, event, helper) {
        helper.setPrice(component);
        //component.set("v.orderItem", record.item);
        //
        var getStatus = component.get("c.getOrderStatus");
        
        getStatus.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {                
                component.set("v.orderActiveStatus", response.getReturnValue());
                
                var orderStatus = component.get("v.orderStatus"); 
                var orderActiveStatus = component.get("v.orderActiveStatus");
                console.log("Catalog Item Order Status " + orderStatus);
                console.log("Catalog Item Order Active Status " + orderActiveStatus);
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(getStatus);
    },
    
    imagePopup : function(component, event) {
        console.log('mouseover');
        //console.log(event.target);
        //console.log(event.target.src);
        console.log(event.target.nextSibling);
        console.log(event.target.nextSibling);
        
        /*if(event.target.src != 'https://citronhygiene--test.lightning.force.com/s.gif') {
            $A.util.removeClass(event.target.nextSibling, 'slds-hide');
        } else {
            console.log('No Image');
        }*/
        if ($A.get("$Browser.formFactor") == 'DESKTOP') {
        	$A.util.removeClass(component.find("theModal"), 'slds-hide');
        }
        
    },
    
    hidePopup : function(component, event) {
        console.log('mouseout');
        console.log(event.target);
        console.log(event.target.src);
        console.log(event.target.nextSibling);
        /*if(event.target.src != '/s.gif') {
            $A.util.addClass(event.target.nextSibling, 'slds-hide');
        } else {
            console.log('No Image');
        }*/
        $A.util.addClass(component.find("theModal"), 'slds-hide');
    },
    
    showModal : function(component, event) { //removed the mouse over functions temporarily aleena
        //if ($A.get("$Browser.formFactor") != 'DESKTOP') {
        	$A.util.removeClass(component.find("theModal"), 'slds-hide');
        //}
    },
    
    closeModal : function(component, event) {
        $A.util.addClass(component.find("theModal"), 'slds-hide');
    },
    
    checkBounds : function(component, event, helper) {
        var qty = component.find("qty").get("v.value");
        if (qty == null || qty <= 0) {
            qty = 1;
            component.find("qty").set("v.value", qty);
        }
    },
    
    changeFreq : function(component, event, helper) {
        helper.setPrice(component);
    },
    
    addButtonClick : function(component, event, helper){
        var qty = component.find("qty").get("v.value");
        var record = component.get("v.record");
        var freq = component.find("prodFreq").get("v.value");
        console.log('Frequency from CatalogItem ' + freq);
      
        var freqItem = component.get("v.frequencyOptions").find(function(item){
            if (item.option.value === freq){
                return item;
            }                                  
        });
        
          /*record.item.Frequency__c = freq;*/
        console.log('Discounted Price from CatalogItem before calculation: ' + record.discountedPrice);
        //apply freq discount
        if(record.discountedPrice === null || typeof record.discountedPrice === "undefined") {
            record.discountedPrice = record.item.UnitPrice * (1-freqItem.discount/100);
        }
        //record.discountedPrice = record.item.UnitPrice * (1-freqItem.discount/100);
        console.log('Price from CatalogItem ' + record.item.UnitPrice);
        console.log('Discounted Price from CatalogItem ' + record.discountedPrice);
        
        //record.cartKey = record.pbeId + record.item.Frequency__c;
        console.log('Cartkey from Catalog ' +  record.cartKey);
        var qtyEvent = component.getEvent("addProd");
        qtyEvent.setParams({
            record: record,
            quantity: qty
        }).fire();
        
        component.find("qty").set("v.value", 1);
    },
})