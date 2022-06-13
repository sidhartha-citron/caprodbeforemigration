({
    validate : function(component, event, helper) {
        var viewData = component.get('v.viewData');
        var differences = [];
        var negativeValuesDetected = false;

        viewData.roomList.forEach(function(room) {
            if(room){
                room.services.forEach(function(service) {
                    service.families.forEach(function(family) {
                        family.lineItems.forEach(function(lineItem) {
                            if(parseInt(lineItem.quantity) !== parseInt(lineItem.newQuantity) ||
                                lineItem.frequency !== lineItem.newFrequency){
                                differences.push(lineItem);
                                console.log('found diff: ' + lineItem.quantity + 'vs ' + lineItem.newQuantity);
                                if(lineItem.newQuantity < 1){
                                    negativeValuesDetected = true;
                                }
                            }                        
                        });
                    });
                });
            }
        });

        if(negativeValuesDetected){
            this.fireErrorMsg(component, event, helper, 'Please make sure all quantities have valid values.');
            return false;
        }

        if(differences.length === 0){
            this.fireErrorMsg(component, event, helper, 'There have been no changes made.');
            return false;
        }

        return true;
    },

    fireErrorMsg : function(component, event, helper, msg) {
        var resultsToast = $A.get("e.force:showToast");
        resultsToast.setParams({
            "title": "Creating Ticket",
            "type": "error",
            "message": msg  
        });
        resultsToast.fire();
    }


})