({
    doInit: function(component, event, helper) {
        $A.util.addClass(component.find("spinner"), "customMargin");
        var initFrequencyOptions = component.get("c.getFrequencyOptions");
        initFrequencyOptions.setCallback(this, function(response) {
            var state = response.getState();
            if (state === "SUCCESS") {
                component.set("v.frequencyOptions", response.getReturnValue());
            } else {
                console.log(response.getError());
            }
        });
        
        $A.enqueueAction(initFrequencyOptions);
        
        helper.pullShoppingCartOrder(component);
        //helper.pullShoppingCart(component);
        helper.pullPreviousProducts(component);
        helper.pullOrderData(component, 1);
        var action = component.get("c.getProductFamily");
        var theRecordId = component.get("v.recordId");
        if(theRecordId === null || typeof theRecordId === "undefined" || theRecordId === "") {
            action.setParams({
                "recordId": ""
            });
        } else {
            action.setParams({
                "recordId": component.get("v.recordId")
            });
        }
        
        
        // Add callback behavior for when response is received
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                console.log(response.getReturnValue());
          		console.log("Successful with state: " + state);
                component.set("v.productFamilyList", response.getReturnValue());
            } else {
                console.log("Failed with state: " + state);
            }
        });

        $A.enqueueAction(action);
        
        // Get banner Value
		 var banner = component.get("c.getBannerValue");
         banner.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {                
                component.set("v.bannerValue", response.getReturnValue());
                var result = response.getReturnValue();
                if (result!=='' && result!==null && typeof result!=="undefined"){
                   $A.util.removeClass(component.find("banner"), 'slds-hide');
                }
            } else {
                console.log("Failed with state: " + state);
            }
        });

        $A.enqueueAction(banner);
    },
    
    
    clicked : function(component, event, helper) {
        var theIcon = component.find('crossIcon');
        $A.util.removeClass(theIcon, 'slds-hide');
    },
    
    clear : function(component, event, helper) {
        console.log(event.target);
        console.log(component.get('v.searchString'));
        var iRecords = component.find('initRecords');
        var fRecords = component.find('fsRecords');
        var theIcon = component.find('crossIcon');
        
        //var theRecords = component.get('v.records');
        
        if(component.get('v.searchString') != '') {
            component.set('v.searchString', '');
            $A.util.addClass(fRecords, 'slds-hide');
            $A.util.removeClass(iRecords, 'slds-hide');
            $A.util.addClass(theIcon, 'slds-hide');
            helper.pullOrderData(component, 1, component.get("v.theFilter")); 
        } else {
            $A.util.addClass(fRecords, 'slds-hide');
            $A.util.removeClass(iRecords, 'slds-hide');
            $A.util.addClass(theIcon, 'slds-hide');
        }
         
    },
    
    searchName: function (component, event, helper) {
        console.log('searchfunction');
        console.log(component.find('searchValue').get('v.value'));
        
        var searchTerm = component.find('searchValue').get('v.value');
        var theSpinner = component.find('spinner');
        var iRecords = component.find('initRecords');
        var fRecords = component.find('fsRecords');
        var theIcon = component.find('crossIcon');
        
        $A.util.removeClass(theSpinner, 'slds-hide');
        
        if(searchTerm === "" || searchTerm.replace(/\s/g,'') === "" || typeof searchTerm === "undefined") {
            console.log('searchterm absent');
            component.set('v.isFilterSearch', false);
            $A.util.addClass(theSpinner, 'slds-hide');
            $A.util.removeClass(iRecords, 'slds-hide');
            $A.util.addClass(theIcon, 'slds-hide');
        } else {
            $A.util.removeClass(theIcon, 'slds-hide');
            helper.filterArray(component, component.get("v.theFilter"), event, component.get('v.records'), 1);
        }
    }, 
    
    clearFilters : function(component, event, helper) {
        var clearFiltersEvent = $A.get("e.c:clearFiltersEvent");
        clearFiltersEvent.fire();
        helper.filterArray(component, [], event, component.get('v.records'), 1);
    },

    applyFilter : function(component, event, helper){
        component.set("v.thefilter", event.getParam("filterValues"))
        helper.filterArray(component, event.getParam("filterValues"), event, component.get('v.records'), 1);
    },
    
    filterProds : function(component, event, helper){
		helper.filterArray(component, component.get("v.theFilter"), event, component.get('v.records'), 1);    	                     
    },
    
    addProd : function(component, event, helper){
        var record = event.getParam("record");
        var quantity = event.getParam("quantity");
        var adjust = event.getParam("adjust");
        helper.addRemoveItem(component, record, quantity, adjust);
        var selectedItems = component.get("v.selectedProducts");
        console.log(selectedItems);
        console.log('Selected Items Size: ' + selectedItems);
        helper.saveOrder(component, selectedItems);
    },
    
    clearItem : function(component, event, helper){
        var currentItem = event.getParam("record");
        var order = component.get("v.shoppingCart");
        console.log("ClearItem : " + currentItem);
        /*var selectedItems = component.get("v.selectedProducts");
        var selectedIndex = selectedItems.findIndex(function(item){
            //console.log(item.pbeId);
            //console.log(currentItem.item.PricebookEntryId);
            if(item.pbeId === currentItem.item.PricebookEntryId){
                console.log(item.pbeId);
                return item;
            } 
        });
        console.log("selectedItems before splice : " + selectedItems.length);
        selectedItems.splice(selectedIndex, 1);
        console.log("selectedItems after splice : " + selectedItems.length);
        component.set("v.selectedProducts", selectedItems);
        
        var subTotal = 0;
        for (var i = 0; i < selectedItems.length; i++) {
            subTotal += selectedItems[i].totalPrice;
        }
        component.set("v.subTotal", subTotal);
        
        helper.saveOrder(component, selectedItems);*/
        
        var action = component.get("c.deleteOrderItem");
        action.setParams({
            'theItem':JSON.stringify(currentItem),
            'record':JSON.stringify(order),
        });
        // Add callback behavior for when response is received
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                //$A.get('e.force:refreshView').fire();
                var selectedProducts = response.getReturnValue();
                component.set("v.selectedProducts", selectedProducts);
                var subTotal = 0;
                for (var i = 0; i < selectedProducts.length; i++) {
                    //subTotal += selectedProducts[i].totalPrice;
                    subTotal = parseFloat(subTotal) + parseFloat(selectedProducts[i].totalPrice);
                }
                component.set("v.subTotal", subTotal);
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(action);
    },
    
    toggleFilters : function(component, event, helper) {

        var filterHidden = component.get("v.filterHidden");
        
        if(filterHidden){
            $A.util.removeClass(component.find("mobileFilters") , 'slds-hide');
            component.set("v.filterHidden",false);
            
          	$A.util.addClass(component.find("mobileCart") , 'slds-hide');
            component.set("v.cartHidden",true);
            
            $A.util.addClass(component.find("theList") , 'slds-hide');
        }
        else{
            $A.util.addClass(component.find("mobileFilters") , 'slds-hide');
            component.set("v.filterHidden",true);
            $A.util.removeClass(component.find("theList") , 'slds-hide');
        }
    },
    
    toggleCart : function(component, event, helper) {

        var cartHidden = component.get("v.cartHidden");
        
        if(cartHidden){
            $A.util.removeClass(component.find("mobileCart") , 'slds-hide');
            component.set("v.cartHidden",false);
            
            $A.util.addClass(component.find("mobileFilters") , 'slds-hide');
            component.set("v.filterHidden",true);
            
            $A.util.addClass(component.find("theList") , 'slds-hide');
        }
        else{
          	$A.util.addClass(component.find("mobileCart") , 'slds-hide');
            component.set("v.cartHidden",true);
            $A.util.removeClass(component.find("theList") , 'slds-hide');
        }
    },
    
    checkout : function(component, event, helper) {
        var selectedItems = component.get("v.selectedProducts");
        //helper.saveOrder(component, selectedItems);
        helper.pullShoppingCartOrder(component);
        //helper.pullShoppingCart(component);
        helper.pullPreviousProducts(component);
        helper.pullOrderData(component, 1);
        $A.util.removeClass(component.find("theModal") , 'slds-hide');
        component.set("v.selectedProducts", "");
    },
    
    closeModal : function(component, event, helper) {
        $A.util.addClass(component.find("theModal") , 'slds-hide');
    },
    
})