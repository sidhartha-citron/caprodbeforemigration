({  
    fetchExistingRecord: function(component, existingVMIProducts, record) {
        console.log('Helper method on Skill Reuqirement Section to identify existing Record');
        
        var theItem = existingVMIProducts.find(function(item){
            if(item.Id === record.Id) {
                return item;
            }
        });
        
        return theItem;
        
    }
})