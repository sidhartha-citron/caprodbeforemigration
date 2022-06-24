({
    doInit: function(component){
        var recordId = component.get("v.recordId");
        if(recordId == null || typeof recordId == "undefined"){
            console.log('recordId null ');
            component.set("v.isPortal", true); 
        }
        
        var initServices = component.get("c.getServicesMap");
        initServices.setParams({
            "queryParams": component.get("v.queryParams"), 
            "recordId":component.get("v.recordId")
        });   
        initServices.setCallback(this, function(response){
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS" && response.getReturnValue()!=null ){
                // if(response.getReturnValue().length>0){
                // Aggregate object
                var itemMap = response.getReturnValue();
 
                // Set main site contact
                var mainSiteContact = itemMap.mainSiteContact;
                component.set("v.mainSiteContact", mainSiteContact);
                
                // Set total price map
                var totals = itemMap.totalPriceMap;
                var listOfTotals = [];
                for ( var key in totals ) { 
                    listOfTotals.push({value:totals[key], key:key});
                }
                component.set("v.totalPriceMap", listOfTotals);
                console.log(component.get("v.totalPriceMap"));
                // Populate aggregate items
                var lines = itemMap.mapAggregateItems;
                
                var listOfitems = [];
                // Need to sort reverse alphabetically
                var listOfKeys = [];
                for ( var key in lines ) { 
                    listOfKeys.push(key);
                    //listOfitems.push({value:lines[key], key:key});
                }
                
                listOfKeys.sort();
                listOfKeys.reverse();
                
                for (var i = 0; i < listOfKeys.length; i++) {
                    var key = listOfKeys[i];
                    listOfitems.push({value:lines[key], key:key});
                }
                
                component.set("v.orderProductsMap", listOfitems );
                var orderProductsMap = component.get("v.orderProductsMap");
                var productsLength = orderProductsMap!=null && orderProductsMap!='' ? orderProductsMap[0].value.length : 0; //productsSize                
                component.set("v.productsSize", productsLength );
                $A.util.addClass(component.find("theSpinner"), 'slds-hide');
                $A.util.removeClass(component.find("orderProductList"), 'slds-hide');
                $A.util.removeClass(component.find("orderProductTiles"), 'slds-hide');
                
                // }
                //else{
                /* console.log('not found');
                    $A.util.addClass(component.find("theSpinner"), 'slds-hide');*/
                
                // }
                
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(initServices);
    }, 
    
    openSection : function(component, event, helper) {
        console.log('Section Controller');
        var source = event.getSource();
        var section = source.get("v.label");
        var closed = source.get("v.value");
        console.log(section);
        console.log(closed);
        var s = document.getElementById(section);
        console.log(s);
        if(closed == true){
            source.set("v.iconName","utility:chevrondown");
            source.set("v.value", false);
            $A.util.addClass(s , 'slds-is-open');
            
        }
        else {
            source.set("v.iconName","utility:chevronright");
            source.set("v.value", true);
            $A.util.removeClass(s , 'slds-is-open');
        }
    },
    
    addItemToCart : function(component, event, helper) {
        
        var target = event.getSource();
        var val = target.get("v.value");        
    
        var action = component.get("c.addToCart");
        action.setParams({
            "pricebookEntryId": value
        });  
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                var successString = response.getReturnValue();
                component.set("v.returnValue", successString);
                if(successString !== null) {
                    //$A.util.removeClass(component.find("added"), 'slds-hide');
                    window.location.assign('/s/product-catalog/');
                } else {
                    $A.util.removeClass(component.find("error"), 'slds-hide');
                    console.log(successString);
                }
            } else {
                $A.util.removeClass(component.find("error"), 'slds-hide');
                console.log(response.getError());
            } 
        });
        $A.enqueueAction(action);
    }
})