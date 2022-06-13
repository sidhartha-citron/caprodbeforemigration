({
	doInit : function(component, event, helper) {     
        component.set('v.columns', [
            {label: $A.get('$Label.c.Order_Product_History_Date'), fieldName: 'createdDate', type: 'text', sortable:true},
            {label: $A.get('$Label.c.Order_Product_History_Field'), fieldName: 'fieldName', type: 'text', sortable:true},
            {label: $A.get('$Label.c.Order_Product_History_Product_Name'), fieldName: 'orderProductName', type: 'text', sortable:true},
            {label: $A.get('$Label.c.Order_Product_History_Product_Number'), fieldName: 'orderNumber', type: 'text', sortable:true},
            {label: $A.get('$Label.c.Order_Product_History_Original_Value'), fieldName: 'originalValue', type: 'text', sortable:true},
            {label: $A.get('$Label.c.Order_Product_History_New_Value'), fieldName: 'newValue', type: 'text', sortable:true},
            {label: $A.get('$Label.c.Order_Product_History_User'), fieldName: 'userName', type: 'text', sortable:true},
        ]);
            
		helper.toggleSpinner(component);  		   
        helper.getOPHistory(component);
    },           
    refresh : function(component, event, helper) {
		helper.toggleSpinner( component);   
        helper.getOPHistory(component);
	},
    updateColumnSorting: function (component, event, helper) {
		helper.toggleSpinner( component);   
        var fieldName = event.getParam('fieldName');
        var sortDirection = event.getParam('sortDirection');
            
        // assign the latest attribute with the sorted column fieldName and sorted direction
        component.set("v.sortedBy", fieldName);
        component.set("v.sortedDirection", sortDirection);
        setTimeout( function() {         
        	helper.sortData(component, fieldName, sortDirection); 
        }, 1000);
    },
    next: function (component, event, helper) {
        helper.next(component, event);
    },
    previous: function (component, event, helper) {
        helper.previous(component, event);
    },     
	first: function( component, event, helper) {
		helper.first( component);           
	},
	last: function( component, event, helper) {
		helper.last( component);         
	},
	pageSizeSelect: function( component, event, helper) {
		helper.pageSizeSelect( component, event);
	},
            
})