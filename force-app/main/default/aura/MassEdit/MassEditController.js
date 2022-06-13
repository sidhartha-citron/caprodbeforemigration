({
	doInit : function(component, event, helper) {
		helper.loadRecords(component);
    },
    
    save : function(component, event, helper) {
        helper.saveRecords(component, helper);
    },
   
    movetoOrder : function(component, event, helper) {
        helper.movetoOrder(component, helper);
        
    },
    
    closeModal : function(component, event, helper) {
        helper.toggleModal(component);
        $A.get('e.force:refreshView').fire();
    },
    
    clear : function(component, event, helper) {
        component.set('v.searchTerm', '');
      	component.set('v.isLoading', true);
        helper.loadRecords(component);  
    },
    
    back : function(component, event, helper) {
        //window.history.back();
        //$A.get("e.force:closeQuickAction").fire();
        //window.location ="/"+component.get("v.recordId");
        //window.close();

        var workspaceAPI = component.find("workspace");
        workspaceAPI.getFocusedTabInfo().then(function(response) {
            var focusedTabId = response.tabId;
            workspaceAPI.closeTab({tabId: focusedTabId});
        })
        .catch(function(error) {
            console.log(error);
        });
    },
    
    onSelectAll : function(component, event, helper) {
        helper.select(true, component);
    },
    
    onSelectNone : function(component, event, helper) {
        helper.select(false, component);
    },
    
    onInvert : function(component, event, helper) {
        helper.invert(component);
    },
    
    onActive : function(component, event, helper) {
        helper.active(component);
    },
    
    applyControl : function(component, event, helper) {
        // Update selected records with non-empty values from control row
        var headers = component.get('v.headers'); // control row
        var records = component.get('v.displayRecords');
        for (var x = 0; x < records.length; x++) {
            var record = records[x];
            if (!record.isSelected) continue;
            var fields = record.fields;
            
            // update fields
            for (var y = 0; y < fields.length; y++) {                
                if (headers[y].value == null || headers[y].value == undefined) continue;
                fields[y].value = headers[y].value;
            }

        }
        component.set('v.displayRecords', records);
    },
    
    search : function(component, event, helper) {
        helper.search(component, helper);
    },
    

    
    handleUpdatePage : function(component, event, helper) {
        var newCurrPg = parseInt(event.getParam("currPage"));
        helper.loadPage(component, newCurrPg);
    }
})