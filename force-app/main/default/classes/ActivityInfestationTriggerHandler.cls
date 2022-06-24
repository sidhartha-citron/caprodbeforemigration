/**
 * @FileName: ActivityInfestationTriggerHandler
 * @Description: Handler for Activity Infestation trigger
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/16/2020       Created
 *-----------------------------------------------------------  
 */
public class ActivityInfestationTriggerHandler extends TriggerHandler {
    private List<Activity_Infestation__c> activityInfestations;
    private List<Activity_Infestation__c> oldList;
    private Map<Id,Activity_Infestation__c> activityInfestationsMap;
    private Map<Id,Activity_Infestation__c> oldMap;

    public ActivityInfestationTriggerHandler() {
        this.setMaxLoopCount(5);

        this.activityInfestations = (List<Activity_Infestation__c>) Trigger.new;
        this.oldList = (List<Activity_Infestation__c>) Trigger.old;
        this.activityInfestationsMap = (Map<Id,Activity_Infestation__c>) Trigger.newMap;
        this.oldMap = (Map<Id,Activity_Infestation__c>) Trigger.oldMap;
    }

    protected override void beforeInsert() {
        setActivityInfestationFields();
    }

    protected override void beforeUpdate() {
        setActivityInfestationFields();
    }
    
    private void setActivityInfestationFields() {
        Map<String,Asset> assetMap = new Map<String,Asset>();
        Map<Id,WorkOrderLineItem> woliMap = new Map<Id,WorkOrderLineItem>();
        Map<Id,Work_Order_Room__c> worMap = new Map<Id,Work_Order_Room__c>();

        for (Activity_Infestation__c a : activityInfestations) {
            if (String.isNotBlank(a.Asset_Bar_Code__c)) {
                assetMap.put(a.Asset_Bar_Code__c, null);
            }
            if (String.isNotBlank(a.Work_Order_Line_Item__c)) {
                woliMap.put(a.Work_Order_Line_Item__c, null);
            } else if (String.isNotBlank(a.Work_Order_Room__c)) {
                worMap.put(a.Work_Order_Room__c, null);
            }
        }

        if (!assetMap.isEmpty()) {
            List<Asset> assets = [SELECT Id, Bar_Code__c FROM Asset WHERE Bar_Code__c IN :assetMap.keySet()];

            for (Asset a : assets) {
                assetMap.put(a.Bar_Code__c, a);
            }
        }

        if (!woliMap.isEmpty()) {
            woliMap = new Map<Id,WorkOrderLineItem>([
                    SELECT Id, WorkOrderId, WorkOrder.AccountId, OrderId, WorkOrder.Site_Survey__c,
                            Work_Order_Location__r.Survey_Location__c, Work_Order_Location__c
                    FROM WorkOrderLineItem
                    WHERE Id IN :woliMap.keySet()
            ]);
        }

        if (!worMap.isEmpty()) {
            worMap = new Map<Id,Work_Order_Room__c>([
                    SELECT Id, Work_Order__c, Site_Survey__c, Survey_Location__c, AccountId__c, Work_Order__r.Order__c
                    FROM Work_Order_Room__c
                    WHERE Id IN :worMap.keySet()
            ]);
        }

        for (Activity_Infestation__c a : activityInfestations) {
            Asset scannedAsset = assetMap.get(a.Asset_Bar_Code__c);

            if (scannedAsset != null) {
                a.Asset__c = scannedAsset.Id;
            }

            if (String.isNotBlank(a.Work_Order_Line_Item__c)) {
                WorkOrderLineItem li = woliMap.get(a.Work_Order_Line_Item__c);

                if (li != null) {
                    a.Work_Order__c = li.WorkOrderId;
                    a.Account__c = li.WorkOrder.AccountId;
                    a.Order__c = li.OrderId;
                    a.Site_Survey__c = li.WorkOrder.Site_Survey__c;
                    a.Work_Order_Room__c = li.Work_Order_Location__c;
                    a.Survey_Location__c = li.Work_Order_Location__r.Survey_Location__c;
                }
            } else if (String.isNotBlank(a.Work_Order_Room__c)) {
                Work_Order_Room__c wor = worMap.get(a.Work_Order_Room__c);

                if (wor != null) {
                    a.Work_Order__c = wor.Work_Order__c;
                    a.Account__c = wor.AccountId__c;
                    a.Order__c = wor.Work_Order__r.Order__c;
                    a.Site_Survey__c = wor.Site_Survey__c;
                    a.Work_Order_Room__c = wor.Id;
                    a.Survey_Location__c = wor.Survey_Location__c;
                }
            }
        }
    }
}