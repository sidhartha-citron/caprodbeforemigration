({
    createSummaryView : function(component, event, helper) {

        var summary = component.get('v.viewData');

        var serviceMap = new Map();
        var summaryMap = new Map();
        var summaryList = [];

        // creates a duplicate view while removing the top level room grouping
        for(var r=0; r< summary.roomList.length; r++){

            summary.roomList[r].recCount = 0;

            for(var s=0; s < summary.roomList[r].services.length; s++){
                var service = summary.roomList[r].services[s];

                if(!summaryMap.has(service.serviceName)){
                    var copyService = JSON.parse(JSON.stringify(service));
                    copyService.families = [];
                    copyService.familyMap = new Map();
                    copyService.recCount = 0;

                    summaryMap.set(service.serviceName, copyService);
                    summaryList.push(copyService);
                }

                for(var f=0; f < summary.roomList[r].services[s].families.length; f++){

                    var family = summary.roomList[r].services[s].families[f];
                    var familyMap = summaryMap.get(service.serviceName).familyMap;

                    if(!familyMap.has(family.familyName)){
                        var copyFamily = JSON.parse(JSON.stringify(family));
                        copyFamily.lineItems = [];

                        familyMap.set(family.familyName, copyFamily);
                        summaryMap.get(service.serviceName).families.push(copyFamily);
                    }                    

                    for(var l=0; l < summary.roomList[r].services[s].families[f].lineItems.length; l++){
                        var lineItem = summary.roomList[r].services[s].families[f].lineItems[l];

                        //reset the view
                        lineItem.newQuantity = lineItem.quantity;
                        lineItem.newFrequency = lineItem.frequency;
                        lineItem.notes = '';

                        var key = lineItem.pEntry + '-' + lineItem.frequency;
                        if(serviceMap.has(key)){
                            serviceMap.get(key).quantity += lineItem.quantity;
                        } else {
                            var copyLineItem = JSON.parse(JSON.stringify(lineItem));
                            serviceMap.set(key, copyLineItem);
                            summaryMap.get(service.serviceName).familyMap.get(family.familyName).lineItems.push(copyLineItem);
                            summaryMap.get(service.serviceName).recCount += 1;
                        }

                        if(service.serviceName == 'Service'){
                            summary.roomList[r].recCount += 1;
                        }
                        
                        
                    }
                    // Sort the LineItems
                    this.sortLineItems(component, event, helper, summary.roomList[r].services[s].families[f].lineItems);
                    this.sortLineItems(component, event, helper, summaryMap.get(service.serviceName).familyMap.get(family.familyName).lineItems);
                }
                // Sort the Families
                this.sortFamilies(component, event, helper, summary.roomList[r].services[s].families);
                this.sortFamilies(component, event, helper, summaryMap.get(service.serviceName).families);
            }

            // Sort the Services
            this.sortServices(component, event, helper, summary.roomList[r].services);
            this.sortServices(component, event, helper, summaryList);
        }
        // Sort the Rooms
        this.sortRooms(component, event, helper, summary.roomList);

        component.set('v.dataSummary', summaryList);
    },

    sortLineItems : function(component, event, helper, target){
        target.sort(function(a,b) {

            var summary = component.get('v.viewData');
            var frequencyWeightingMap = summary.frequencyWeightingMap;

            if (a.productName > b.productName) return 1;
            if (a.productName < b.productName) return -1;

            if (frequencyWeightingMap[a.frequency] > frequencyWeightingMap[b.frequency]) return 1;
            if (frequencyWeightingMap[a.frequency] < frequencyWeightingMap[b.frequency]) return -1;
            
            return 0;
        });
    },

    sortFamilies : function(component, event, helper, target){
        target.sort(function(a,b) {
            var summary = component.get('v.viewData');
            var familyWeightingMap = summary.familyWeightingMap;
    
            if (familyWeightingMap[a.familyName] > familyWeightingMap[b.familyName]) return 1;
            if (familyWeightingMap[a.familyName] < familyWeightingMap[b.familyName]) return -1;
            return 0;
        });
    },


    sortServices : function(component, event, helper, target){
        target.sort(function(a,b) {
            var summary = component.get('v.viewData');
            var serviceWeightingMap = summary.serviceWeightingMap;
    
            if (serviceWeightingMap[a.serviceName] > serviceWeightingMap[b.serviceName]) return 1;
            if (serviceWeightingMap[a.serviceName] < serviceWeightingMap[b.serviceName]) return -1;
            return 0;
        });
    },

    sortRooms : function(component, event, helper, target){
        target.sort(function(a,b) {
            if (a.locationName > b.locationName) return 1;
            if (a.locationName < b.locationName) return -1;
            return 0;
        });
    },

})