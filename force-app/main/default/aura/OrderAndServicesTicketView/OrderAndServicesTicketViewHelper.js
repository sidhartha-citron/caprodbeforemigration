({
    determineDifferences : function(component, event, helper) {
        var viewData = component.get('v.viewData');
        var differences = [];

        viewData.roomList.forEach(function(room) {
            if(room){
                room.services.forEach(function(service) {
                    service.families.forEach(function(family) {
                        family.lineItems.forEach(function(lineItem) {
                            if(lineItem.quantity !== lineItem.newQuantity ||
                                lineItem.frequency !== lineItem.newFrequency){
                                    differences.push(lineItem);
                            }                        
                        });
                    });
                });
            }
        });
        component.set('v.differences', differences);
        this.formTicket(component, event, helper);
        
    },

    determineIfDecrease: function(component, event, helper) {
        var view = component.get('v.viewData');
        var frequencyValueMap = view.frequencyWeightingMap;
        console.log(view.frequencyWeightingMap);
        console.log(frequencyValueMap);
        console.log(frequencyValueMap['14 Days']);
        // frequencyValueMap.set('One-Time', 1200);
        // frequencyValueMap.set('Weekly', 1100);
        // frequencyValueMap.set('14 Days', 1000);
        // frequencyValueMap.set('Twice Monthly', 900);
        // frequencyValueMap.set('28 Days', 800);
        // frequencyValueMap.set('Monthly', 700);
        // frequencyValueMap.set('Bi-Monthly', 600);
        // frequencyValueMap.set('Quarterly', 500);
        // frequencyValueMap.set('120 Days', 400);
        // frequencyValueMap.set('Semi-Annually', 300);
        // frequencyValueMap.set('Annually', 200);
        // frequencyValueMap.set('Fixed Weekly', 100);

        var decreaseFound = false;
        var differences = component.get('v.differences');
        for(var i=0; i < differences.length; i++){
            var diff = differences[i];

            if(diff.newQuantity < diff.quantity){
                decreaseFound = true;
            }

            if(frequencyValueMap[diff.newFrequency] < frequencyValueMap[diff.frequency]){
                decreaseFound = true;
            }
        }

        return decreaseFound;

    },


    formTicket : function(component, event, helper) {

        var ticket = {
            'sobjectType' :'Case',
            'Type': 'Frequency Change',
            'Subject': 'Quantity and Frequency Change',
            'Description': 'Change current services from: \n\n',
            'AccountId': component.get('v.accountId'),
            'ContactId': component.get('v.viewData.currentUserContact'),
            'Origin': 'Community',
            'Status': 'New'
        };


        var differences = component.get('v.differences');

        for(var i=0; i < differences.length; i++){
            var diff = differences[i];
            ticket.Description += diff.surveyLocationName + ' -- ' + diff.productName + '\n';
            ticket.Description += 'Quantity: ' + diff.quantity + '==>' + diff.newQuantity + '\n';
            ticket.Description += 'Frequency: ' + diff.frequency + '==>' + diff.newFrequency + '\n';
            ticket.Description += 'Notes: ' + diff.notes + '\n\n';
        }

        ticket.Decrease_Detected__c = this.determineIfDecrease(component, event, helper);
        console.log('DECREASE DETECTED: ' + ticket.Decrease_Detected__c);

        component.set("v.simpleNewCase", ticket);  
    },

    navigateToTicket: function(component, event, helper) {
        var navService = component.find("navService");

        var pageReference = {
            type: 'standard__recordPage',
            attributes: {
                objectApiName: 'Case',
                recordId: component.get('v.simpleNewCase.Id'),
                actionName: "view"
            }
        };
        
        event.preventDefault();
        navService.navigate(pageReference);
    }
})