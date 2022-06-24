trigger SetActivityInfestationFields on Activity_Infestation__c (before insert, before update) {
    Map<Id,WorkOrderLineItem> woliMap = new Map<Id,WorkOrderLineItem>();
    Map<Id,Work_Order_Room__c> wolMap = new Map<Id,Work_Order_Room__c>();
    Map<String,Asset> assetMap = new Map<String,Asset>(); 
    
    for (Activity_Infestation__c a : Trigger.new) {
        if (a.Asset_Bar_Code__c != null) {
            assetMap.put(a.Asset_Bar_Code__c, null);
        }
        if (a.Work_Order_Line_Item__c != null) {
            woliMap.put(a.Work_Order_Line_Item__c, null);
        } else if (a.Work_Order_Room__c != null) {
            wolMap.put(a.Work_Order_Room__c, null);
        }
    }
    
    if (!assetMap.isEmpty()) {
        for (Asset a : [SELECT Id, Bar_Code__c FROM Asset WHERE Bar_Code__c IN :assetMap.keyset()]) {
            assetMap.put(a.Bar_Code__c, a);
        }
    }
    
    if (!woliMap.isEmpty()) {
        for (WorkOrderLineItem li : [SELECT Id, WorkOrderId, WorkOrder.AccountId, WorkOrder.Order__c, WorkOrder.Site_Survey__c, Work_Order_Location__r.Survey_Location__c, Work_Order_Location__c FROM WorkOrderLineItem WHERE Id IN :woliMap.keyset()]) {
            woliMap.put(li.Id,li);
        }
    }
    
    if (!wolMap.isEmpty()) {
        for (Work_Order_Room__c  wol : [SELECT Id, Work_Order__c, Site_Survey__c, Survey_Location__c, AccountId__c, Work_Order__r.Order__c FROM Work_Order_Room__c WHERE Id IN :wolMap.keyset()]) {
            wolMap.put(wol.Id, wol);
        }
    }
    
    for (Activity_Infestation__c a : Trigger.new) {
        Asset scannedAsset = assetMap.get(a.Asset_Bar_Code__c);
        
        if (scannedAsset != null) {
            a.Asset__c = scannedAsset.Id;
        }
        
        if (a.Work_Order_Line_Item__c != null) {
            WorkOrderLineItem li = woliMap.get(a.Work_Order_Line_Item__c);
            
            if (li != null) {
                a.Work_Order__c = li.WorkOrderId;
                a.Account__c = li.WorkOrder.AccountId;
                a.Order__c = li.WorkOrder.Order__c;
                a.Site_Survey__c = li.WorkOrder.Site_Survey__c;
                //a.Work_Order_Asset__c = li.Work_Order_Asset__c;
                a.Work_Order_Room__c = li.Work_Order_Location__c;
                //a.Survey_Asset_Location__c = li.Work_Order_Asset__r.Survey_Asset_Location__c;
                a.Survey_Location__c = li.Work_Order_Location__r.Survey_Location__c;//li.Work_Order_Asset__r.Survey_Asset_Location__r.Survey_Location__c;
            }
        } else if (a.Work_Order_Room__c != null) {
            Work_Order_Room__c wol = wolMap.get(a.Work_Order_Room__c);
            
            if (wol != null) {
                a.Work_Order__c = wol.Work_Order__c;
                a.Account__c = wol.AccountId__c;
                a.Order__c = wol.Work_Order__r.Order__c;
                a.Site_Survey__c = wol.Site_Survey__c;
                a.Work_Order_Room__c = wol.Id;
                a.Survey_Location__c = wol.Survey_Location__c;
            }
        }
    }
}