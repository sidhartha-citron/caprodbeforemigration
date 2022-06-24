({
    pullShoppingCartOrder : function(component) {
        var action = component.get("c.getOrder");
        var theRecordId = component.get("v.recordId");
        if(theRecordId === null || typeof theRecordId === "undefined" || theRecordId === "") {
            console.log("Record Id pullShoppingCartOrder RecordId Null" + component.get("v.recordId"));
            action.setParams({
                "recordId": ""
            });
        } else {
            console.log("Record Id pullShoppingCartOrder RecordId not Null" + component.get("v.recordId"));
            action.setParams({
                "recordId": component.get("v.recordId")
            }); 
        }
        
        console.log("Record Id pullShoppingCartOrder " + component.get("v.recordId"));
        
        action.setCallback(this, function(orderResponse) {
            var state = orderResponse.getState();
            if (component.isValid() && state === "SUCCESS") {
                component.set("v.shoppingCart",orderResponse.getReturnValue());
                console.log("Shopping cart attribute " + orderResponse.getReturnValue());
                
                var getStatus = component.get("c.getOrderStatus");
                getStatus.setCallback(this, function(response) {
                    var state = response.getState();
                    if (component.isValid() && state === "SUCCESS") {                
                        component.set("v.orderActiveStatus", response.getReturnValue());
                        var orderStatus = component.get("v.shoppingCart.Status");
                        var orderId = component.get("v.shoppingCart.Id");
                        var orderActiveStatus = component.get("v.orderActiveStatus");
                        console.log("Order Status " + orderStatus);
                        console.log("Order Active Status " + orderActiveStatus);
                        if(orderStatus === orderActiveStatus) {
                            var customToast = component.find("customToast"); 
                            customToast.setCloseType(false);
                            customToast.showMessage($A.get("$Label.c.Site_Survey_Save_Error_Title"), 
                                                    $A.get("$Label.c.OrderActive"), 'ERROR');
                        }
                        
                        var cartAction = component.get("c.getShoppingCart");
                        var theRecordId = component.get("v.recordId");
                        console.log("Order Status Shopping Cart Id " + orderId);
                        console.log(component.get("v.shoppingCart"));
                        if(theRecordId === null || typeof theRecordId === "undefined" || theRecordId === "") {
                            console.log("Record Id pullShoppingCart RecordId Null" + component.get("v.recordId"));
                            cartAction.setParams({
                                "recordId": ""
                            });
                        } else {
                            console.log("Record Id pullShoppingCart RecordId not Null" + component.get("v.recordId"));
                            cartAction.setParams({
                                "recordId": component.get("v.recordId")
                            }); 
                        }
                        
                        cartAction.setCallback(this, function(response) {
                            var state = response.getState();
                            if (component.isValid() && state === "SUCCESS") {
                                //console.log("Shopping cart attribute from pullShoppingCart " + component.get("v.shoppingCart.Status"));
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
                        $A.enqueueAction(cartAction);
                        
                    } else {
                        console.log("Failed with state: " + state);
                    }
                });
                $A.enqueueAction(getStatus);
                
            } else {
                console.log("Failed with state: " + state);
            }
        });
        $A.enqueueAction(action);
    },
    
    /*pullShoppingCart : function(component) {
        var cartAction = component.get("c.getShoppingCart");
        var theRecordId = component.get("v.recordId");
        console.log("Shopping cart attribute from pullShoppingCart " + component.get("v.shoppingCart.Id"));
        
        if(theRecordId === null || typeof theRecordId === "undefined" || theRecordId === "") {
            console.log("Record Id pullShoppingCart RecordId Null" + component.get("v.recordId"));
            cartAction.setParams({
                "recordId": ""
            });
        } else {
            console.log("Record Id pullShoppingCart RecordId not Null" + component.get("v.recordId"));
            cartAction.setParams({
                "recordId": component.get("v.recordId")
            }); 
        }
       
        cartAction.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
            	var selectedProducts = response.getReturnValue();
                component.set("v.selectedProducts", selectedProducts);
                var subTotal = 0;
                for (var i = 0; i < selectedProducts.length; i++) {
                    subTotal += selectedProducts[i].totalPrice;
                }
                component.set("v.subTotal", subTotal);
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(cartAction);
    },*/
    
    pullOrderData : function(component, pageNum, theFilter, searchString) { 
        //component.find('searchValue').set('v.value',"");
        var theSpinner = component.find('spinner');
        $A.util.removeClass(theSpinner, 'slds-hide');
        var listCmp = component.find('theList');
        
        var action = component.get('c.getProducts');
        action.setParams({
            'searchString':searchString,
            'filterValues':theFilter,
            'isSearch':false,
            'pageNumber': pageNum,
            'isPrevProdSearch': false, 
            'recordId':component.get("v.recordId")
        });
        // Add callback behavior for when response is received
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                console.log(state + ' first action');
                var res = response.getReturnValue();
                var records = component.get("v.records");
                if (pageNum == 1) {
                    records = res.entries;
                }
                else {
                	records = records.concat(res.entries);
                }
                component.set("v.records", records); 
                $A.util.addClass(theSpinner, 'slds-hide');
                $A.util.removeClass(listCmp, 'slds-hide');
                //component.set('v.end', res.entries.length);
                component.set("v.queryEnd", res.queryEnd);
                component.set("v.pageNum", res.page);
                component.set("v.searchString", searchString);
                component.set("v.theFilter", theFilter);
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(action);
    }, 
    
    pullPreviousProducts : function(component) {
        var action = component.get('c.getPreviousOrderedProds');
        var theRecordId = component.get("v.recordId");
        if(theRecordId === null || typeof theRecordId === "undefined" || theRecordId === "") {
            console.log("Record Id pullPreviousProducts RecordId Null" + component.get("v.recordId"));
            action.setParams({
                "recordId": ""
            });
        } else {
            console.log("Record Id pullPreviousProducts RecordId not Null" + component.get("v.recordId"));
            action.setParams({
                "recordId": component.get("v.recordId")
            }); 
        }
        
        // Add callback behavior for when response is received
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
				var prevProds = response.getReturnValue();
                component.set("v.prevProdIds", prevProds);
                console.log("Previously Ordered Products " + prevProds);
                var numPrevProds = 0;
                for (var key in prevProds){
                	numPrevProds++;   
                }
                component.set("v.numberPreviousProds", numPrevProds);
                console.log('Previous Ordered Products: ' + numPrevProds);
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(action);                  
    },
    
	filterArray : function(component, filterValues, event, theRecords, pageNum) {
        console.log('filter helper');
        console.log(filterValues);
        
        var iRecords = component.find('initRecords');
        var fRecords = component.find('fsRecords');
        var theSpinner = component.find('spinner');
        $A.util.removeClass(theSpinner, 'slds-hide');
        
        var action = component.get('c.getProducts');
        action.setParams({
            'searchString':component.get("v.searchString"),
            'filterValues':filterValues,
            'isSearch':false,
            'pageNumber':pageNum,
            'isPrevProdSearch':component.get("v.filterPrevProds"),
            'prevProductMap': component.get("v.prevProdIds"), 
            'recordId':component.get("v.recordId")
        });
        // Add callback behavior for when response is received
        action.setCallback(this, function(response) {
            var state = response.getState();
            if (component.isValid() && state === "SUCCESS") {
                console.log(state + ' first action');
                var res = response.getReturnValue();
                component.set("v.records", res.entries); 
                $A.util.addClass(theSpinner, 'slds-hide');
                //$A.util.removeClass(listCmp, 'slds-hide');
                component.set('v.end', res.entries.length);
                component.set("v.queryEnd", res.queryEnd);
                component.set("v.pageNum", res.page);
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(action);
    },
    
    addRemoveItem : function(component, currentItem, quantity, adjust) {
        console.log("addRemoveItem: " + ' quantity: ' + quantity);
        console.log("addRemoveItem: " + ' item.quantity: ' + currentItem.item.Quantity);
        console.log("addRemoveItem: " + ' currentitem.quantity: ' + currentItem.quantity);
        currentItem.item.Quantity = quantity;
        currentItem.quantity = quantity;
        currentItem.totalPrice = quantity * currentItem.discountedPrice;
        var selectedItems = component.get("v.selectedProducts");
        var itemNotPresent = true;
        var theItem = selectedItems.find(function(item){
            if (item.cartKey === currentItem.cartKey){
                itemNotPresent = false;
            	return item;
        	}                                  
        });
        if (itemNotPresent && currentItem.quantity > 0) {
            selectedItems.push(currentItem);
        }
        else {
            var theIndex = selectedItems.findIndex(function(item){
                if(item.cartKey === currentItem.cartKey){
                    return item;
                } 
            });
            if (theIndex != -1) {
                if (currentItem.item.Quantity == 0) {
                    selectedItems.splice(theIndex, 1);
                }
                else {
                    if (adjust) {
                        console.log('Adjust: ' + adjust);
                        selectedItems[theIndex].item.Quantity = currentItem.item.Quantity;
                        selectedItems[theIndex].totalPrice = currentItem.totalPrice
                    }
                    else {
                        console.log('Adjust: ' + adjust);
                        selectedItems[theIndex].item.Quantity = parseInt(selectedItems[theIndex].item.Quantity) + parseInt(currentItem.item.Quantity);
                        selectedItems[theIndex].totalPrice += currentItem.totalPrice;
                    }
                }
            }
        }
        component.set("v.selectedProducts",selectedItems);
        
        /*var subTotal = 0;
        for (var i = 0; i < selectedItems.length; i++) {
            subTotal += selectedItems[i].totalPrice;
        }
        component.set("v.subTotal", subTotal);*/

        var records = component.get("v.records");
        var productIndex = records.findIndex(function(item){
            if(item.pbeId === currentItem.pbeId){
                return item;
            } 
        });
        if (productIndex >= 0) {
            records[productIndex].item.Quantity = 0;
            records[productIndex].quantity = null;
            records[productIndex].totalPrice = 0;
            //records[productIndex].item.Frequency__c = 'One-Off';
            component.set("v.records",records);
        }
        //var selectedItems = component.get("v.selectedProducts");
        //helper.saveOrder(component, selectedItems);
    },
    
    saveOrder : function(component, selectedItems) {
        var order = component.get("v.shoppingCart");
        console.log("Shopping cart attribute " + component.get("v.shoppingCart"));
        //order.Status = status;
        //
        
        var action = component.get("c.saveOrder");
        action.setParams({
            'o':JSON.stringify(order),
            'items':JSON.stringify(selectedItems)
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
                    console.log('Subtotal:Individual Items ' + selectedProducts[i].totalPrice);
                    //subTotal += selectedProducts[i].totalPrice;
                    subTotal = parseFloat(subTotal) + parseFloat(selectedProducts[i].totalPrice);
                }
                component.set("v.subTotal", subTotal);
                console.log('Subtotal: ' + subTotal);
            } else {
                console.log("Failed with state: " + state);
            }
        });
        
        $A.enqueueAction(action);
    },

})