({
    doInit: function(component, event, helper)
    {        
        
    },
    
    setAllocationDetails : function(component, event, helper) {
        if(event) {            
            var product = event.getParam('arguments').draggedProduct;
            var location = event.getParam('arguments').roomToAllocate;
            var parentRecordId = event.getParam('arguments').parentRecord;
            //var seasonalOrder = event.getParam('arguments').orderSeasonal;
            
            console.log('product:' + product);
            console.log('product:' + product.relatedProdId);
            console.log('location:' + location);
            console.log('parentRecordId:' + parentRecordId);
            //console.log('seasonalOrder:' + seasonalOrder);
            
            component.set("v.selectedProduct", product);
            component.set("v.surveyLocation", location);
            component.set("v.parentRecordId", parentRecordId);
            //component.set("v.seasonalOrder", seasonalOrder);
            component.set("v.allocatedQty", component.get("v.selectedProduct.availqty"));
        }
    },
    handleAllocate: function(component, event, helper) { 
        helper.saveAllocation(component);
    },
    
    validateAllocateQty: function(component, event, helper)
    {        
        var txtAllocateQty = component.find("allocatedQty");
        var btnAllocateQty = component.find("btnAllocateQty");
        if(txtAllocateQty.get("v.validity").valid)
        {
            btnAllocateQty.set("v.disabled",""); 
        } else {
            btnAllocateQty.set("v.disabled","true"); 
        }
    },
    
    closeModal: function(component, event, helper)
    {
        // fire the event
        var modalCloseEvt = component.getEvent("ModalCloseEvent"); 
        modalCloseEvt.setParams({"modalComponentId":"modalAllocateProduct"});
        modalCloseEvt.fire(); 
    }
})