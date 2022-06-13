global class FutureCalls {

    @future(callout=true)
    global static void deleteOrderItems(Set<Id> orderItems) { 
        System.debug('future handler order item deletes: ' + orderItems);  
        if (!orderItems.isEmpty()) {
            delete [SELECT Id FROM OrderItem WHERE Id IN :orderItems];
        }
    }
    
    @future
    global static void futureUpdateRoom(List<Id> Wolis, List<Id> WoliRooms, Boolean isInsert, Integer conditionCheck){ //21530 - MD
		Map<Id, Work_Order_Room__c> validWoliRooms = new Map<Id, Work_Order_Room__c>([SELECT Id, Number_of_Products_Serviced__c, Number_of_Products_to_be_Serviced__c FROM Work_Order_Room__c 
                                                                                      WHERE Id IN: WoliRooms]);
        List<WorkOrderLineItem> woliRecords = [SELECT Id, Status, Work_Order_Location__c FROM WorkOrderLineItem WHERE Id IN: Wolis];

        //System.debug('~~ROOMS: ' + validWoliRooms);
        for (WorkOrderLineItem li : woliRecords) {
           if (li.Work_Order_Location__c != null){
               Work_Order_Room__c liRoom = validWoliRooms.get(li.Work_Order_Location__c);
               if (isInsert){
                   liRoom.Number_of_Products_to_be_Serviced__c = (liRoom.Number_of_Products_to_be_Serviced__c == null ? 1 : liRoom.Number_of_Products_to_be_Serviced__c + 1); 
                   if (li.Status == 'Completed'){
                       liRoom.Number_of_Products_Serviced__c = (liRoom.Number_of_Products_Serviced__c == null ? 1 : liRoom.Number_of_Products_Serviced__c + 1); 
                   }
               }
               else if (!isInsert){
                    if (conditionCheck == 1){
                        liRoom.Number_of_Products_Serviced__c = (liRoom.Number_of_Products_Serviced__c == null ? 1 : liRoom.Number_of_Products_Serviced__c + 1);
                    }      
                    else if (conditionCheck == 2){
                        if(liRoom.Number_of_Products_Serviced__c > 0 && liRoom.Number_of_Products_Serviced__c != null){
                        	liRoom.Number_of_Products_Serviced__c -= 1; 
                        }
                    }
           	   }
           }
        }
        //System.debug('~~ROOMS AFTER: ' + validWoliRooms);
        TriggerHandler.bypass('WorkOrderLocationTriggerHandler');
        update validWoliRooms.values();
        TriggerHandler.clearBypass('WorkOrderLocationTriggerHandler');
    }	
}