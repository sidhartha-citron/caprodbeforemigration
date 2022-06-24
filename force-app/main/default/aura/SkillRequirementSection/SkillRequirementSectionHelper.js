({
    resetValues : function(component) {
        var pickLists = component.get("v.pickList");
        
        for (var x in pickLists) {
            console.log(" In helper to rest marking selected x-- " + x ); 
            pickLists[x].isChosen = false;
        } 
        component.set("v.pickList", pickLists);
    }, 
    
    fetchExistingRecord: function(component, existingSkills, record) {
        console.log('Helper method on Skill Reuqirement Section to identify existing Record');
        
        var theItem = existingSkills.find(function(item){
            if(item.EID__c === record.EID__c) {
                return item;
            }
        });
        
        console.log('Found Existing Skill ');
        console.log(theItem);
        
        return theItem;
        
    }
})