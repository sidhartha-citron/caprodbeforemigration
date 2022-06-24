/**
 * @FileName: WorkOrderLocationTriggerHandler
 * @Description: Consolidated Trigger Handler Class 
 * @Author: Irfan Tarique
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification 
 * Irfan Tarique 	 06-Jan-20		 Created
 * Graeme Ward       04-Feb-20       Refactored to improve code quality, cyclomatic complexity
 *                                   No logic changes
 *-----------------------------------------------------------  
 **/

public class WorkOrderLocationTriggerHandler extends TriggerHandler {
    private List<Work_Order_Room__c> workOrderRooms;
    private List<Work_Order_Room__c> oldList;
    private Map<Id, Work_Order_Room__c> workOrderRoomsMap;
    private Map<Id, Work_Order_Room__c> oldMap;

    public WorkOrderLocationTriggerHandler() {
        workOrderRooms = Trigger.new;
        oldList = Trigger.old;
        workOrderRoomsMap = (Map<Id, Work_Order_Room__c>) Trigger.newMap;
        oldMap = (Map<Id, Work_Order_Room__c>) Trigger.oldMap;
    }

    /** TRIGGER EVENTS **/
    protected override void beforeInsert() {
        if(TriggerHandler.isBypassed('WorkOrderLocationTriggerHandler')){return;}
        new WorkOrderLocationValidateItemsWrapper(workOrderRooms);
    }

    protected override void beforeUpdate() {
        if(TriggerHandler.isBypassed('WorkOrderLocationTriggerHandler')){return;}
        new WorkOrderLocationValidateItemsWrapper(workOrderRooms, oldMap);
    }

    protected override void afterUpdate() {
        if(TriggerHandler.isBypassed('WorkOrderLocationTriggerHandler')){return;}
        new WorkOrderLocationLineItemsWrapper(workOrderRooms, oldMap);
        updateNumberOfRooms();
    }



    private void updateNumberOfRooms() {
        //21618 variables
        Set<Id> cannotCompleteRoomIds = new Set<Id>();
        Map<Id, Survey_Location__c> updateNumberOfRooms = new Map<Id, Survey_Location__c>();

        //Darcy 2021-05-11 Location Notes update to Survey Location https://trello.com/c/VNiuU0sn
        Map<Id, Survey_Location__c> updateLocationNotes = new Map<Id, Survey_Location__c>();

        for (Work_Order_Room__c wor : workOrderRooms) {
            Work_Order_Room__c oldRec = oldMap.get(wor.Id);

            if (oldRec.Number_of_Rooms__c != wor.Number_of_Rooms__c
                    && !String.isEmpty(wor.Number_of_Rooms__c)
                    && String.isNotBlank(wor.Survey_Location__c))
            {
                updateNumberOfRooms.put(wor.Survey_Location__c, new Survey_Location__c(Id = wor.Survey_Location__c, Number_of_Rooms__c = wor.Number_of_Rooms__c));
            }

            if (wor.Status__c == QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c
                    && wor.Status__c != oldRec.Status__c
                    && String.isNotBlank(wor.Id))
            {
                cannotCompleteRoomIds.add(wor.Id);
            }

            if (wor.Location_Notes__c != oldRec.Location_Notes__c) {
                updateLocationNotes.put(wor.Survey_Location__c, new Survey_Location__c(Id = wor.Survey_Location__c, Notes__c = wor.Location_Notes__c));
            }
        }

        update updateNumberOfRooms.values();
        update updateLocationNotes.values();

        if (!cannotCompleteRoomIds.isEmpty() && !System.isBatch() && !System.isFuture()) {
            WorkOrderUtil.updateWorkOrderRoomsCannotComplete(cannotCompleteRoomIds);
        }
    }
}