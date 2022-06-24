trigger UpdateWorkOrderRoomFields on Work_Order_Room__c (after update) {
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    //21618 variables
    Set<Id> cannotCompleteRoomIds = new Set<Id>();
    Map<Id, Survey_Location__c> updateNumberOfRooms = new Map<Id, Survey_Location__c>();
    
    for (Work_Order_Room__c wor : Trigger.New) {
        Work_Order_Room__c oldRec = Trigger.oldMap.get(wor.Id);
        
        if (oldRec.Number_of_Rooms__c != wor.Number_of_Rooms__c && !String.isEmpty(wor.Number_of_Rooms__c)) {
            updateNumberOfRooms.put(wor.Survey_Location__c, new Survey_Location__c(Id = wor.Survey_Location__c, Number_of_Rooms__c = wor.Number_of_Rooms__c));
        }
        
        if (wor.Status__c == dataSets.Cannot_Complete_Status_Value__c && wor.Status__c != oldRec.Status__c) {
            cannotCompleteRoomIds.add(wor.Id);
        }
    }
    
    updateNumberOfRooms.remove(null);
    cannotCompleteRoomIds.remove(null);
    
    if (!updateNumberOfRooms.isEmpty()) {
        update updateNumberOfRooms.values();
    }
    
    if (!cannotCompleteRoomIds.isEmpty() && !System.isBatch() && !System.isFuture()) {
        WorkOrderUtil.updateWorkOrderRoomsCannotComplete(cannotCompleteRoomIds);
    }
}