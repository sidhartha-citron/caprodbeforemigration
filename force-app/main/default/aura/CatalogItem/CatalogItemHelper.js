({
    setPrice : function(component) {
    	var record = component.get("v.record");
        var freq = component.find("prodFreq").get("v.value");
        var prevProdMap = component.get("v.prevProds")[record.item.PricebookEntry.Product2Id];
        var previous = false;
        for (var key in prevProdMap){
            if (key == freq && freq != 'One-Off'){
                previous = true;
            }
        }
            
        var freqItem = component.get("v.frequencyOptions").find(function(item){
            if (item.option.value === freq){
                return item;
            }                                  
        });
        
        record.item.Frequency__c = freq;
        
        var thePrice = component.find('thePrice');
        if (previous){
            record.discountedPrice = prevProdMap[freq].UnitPrice;
            $A.util.addClass(thePrice, 'discPrice');
            $A.util.removeClass(thePrice, 'unitPrice');
        }
        else {
        	record.discountedPrice = record.item.UnitPrice * (1-freqItem.discount/100);
            $A.util.addClass(thePrice, 'unitPrice');
            $A.util.removeClass(thePrice, 'discPrice');
        }
        
        component.set("v.record", record);
    }
})