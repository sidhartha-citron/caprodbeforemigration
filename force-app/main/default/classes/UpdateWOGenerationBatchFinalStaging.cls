global class UpdateWOGenerationBatchFinalStaging implements Database.Batchable<SObject>{
    
     global Database.QueryLocator Start(Database.BatchableContext bc){                      
        return Database.getQueryLocator([Select Id,Status__c from Work_Order_Generation_Status_Staging__c where status__c = '']);                     
    }
    global void execute(Database.BatchableContext BC, List<SObject> scope) {
        system.debug('a3a3a3a3a3a3');
        Set<Id> listWOGSL = new Set<Id>();
        List<Work_Order_Generation_Status_Staging__c> updateWogs = new List<Work_Order_Generation_Status_Staging__c>();
        List<Work_Order_Generation_Status_Staging__c> deleteWogs = new List<Work_Order_Generation_Status_Staging__c>();
        
        for(SObject s : scope){
            listWOGSL.add(s.Id);
        }
    
        for(Work_Order_Generation_Status_Staging__c wogs : [Select Expected_WO_Start_Date__c,Order_Product__r.Order.Season_Start_Date__c,Order_Product__r.Order.Season_End_Date__c,Status__c,Order_Product__r.Order.Inventory_Allocated__c,Order_Product__r.Last_Automation_Created_Date__c,Order_Product__r.Valid_for_Install_Remove_Replace__c,
                                                    Order_Product__r.Installation_Status__c,Order_Product__r.Frequency__c,Order_Product__r.Product2.Allowable_Frequencies__c,Order_Product__r.Last_InFlight_WO_Date__c,
                                                    Order_Account_Inactive__c,Order_Account_On_Hold__c,Order_Inventory_Allocated__c, Order_Product_Active__c,
                                                    Order_Product_Installation_Status__c,Order_Product_Inventory_Allocated__c,Order_Product_IsActive__c,
                                                    Order_Product_Valid_for_Install_Replace__c,Order_Status_Stamp__c from Work_Order_Generation_Status_Staging__c where id in : listWOGSL]){
                 
                system.debug('a4a4a4a4a4a4' + wogs);
                List<String> freqList = new List<String>();    
                freqList = wogs.Order_Product__r.Product2.Allowable_Frequencies__c.split(';');
                       
                String stamp = ''; 
                
                List<String> listMultiSelect = new List<String>();
                if(((wogs.Expected_WO_Start_Date__c >= wogs.Order_Product__r.Order.Season_Start_Date__c && wogs.Expected_WO_Start_Date__c <= wogs.Order_Product__r.Order.Season_End_Date__c) && (wogs.Order_Product__r.Order.Season_Start_Date__c <> null && wogs.Order_Product__r.Order.Season_End_Date__c <> null)) ||
                    (wogs.Order_Product__r.Order.Season_Start_Date__c == null && wogs.Order_Product__r.Order.Season_End_Date__c == null)){
                    if(wogs.Order_Account_Inactive__c == 'True'){listMultiSelect.add('Account Inactive |'); }    
                    if(wogs.Order_Account_On_Hold__c == 'True'){listMultiSelect.add('Account On Hold |'); }  
                    if(wogs.Order_Product_Active__c == 'False'){listMultiSelect.add('Order Product not Active |'); }
                    if(wogs.Order_Status_Stamp__c == 'Draft'){listMultiSelect.add('Order is not active |'); }
                    if(wogs.Order_Product_IsActive__c == 'false'){listMultiSelect.add('Either Price Book Entry or Product or Order Product is inactive |'); }
                    if(wogs.Order_Product__r.Valid_for_Install_Remove_Replace__c == false && (wogs.Order_Product__r.Installation_Status__c == 'Install' || wogs.Order_Product__r.Installation_Status__c == 'Remove' || wogs.Order_Product__r.Installation_Status__c == 'Replace')
                        && wogs.Order_Product__r.Last_Automation_Created_Date__c == null){listMultiSelect.add('Pending Install/Remove/Replace|'); }
                    if(!freqList.contains(wogs.Order_Product__r.Frequency__c)){listMultiSelect.add('Order Product’s frequency Not in Allowable frequency |'); }
                    if(wogs.Order_Inventory_Allocated__c == 'False' && wogs.Order_Product_Inventory_Allocated__c == 'false'){listMultiSelect.add('Order Product and Order Inventory not allocated |'); }
                    
                    wogs.Reasons_for_failures__c = String.join(listMultiSelect,';');
                    wogs.Status__c = 'WORK ORDER NOT GENERATED';
                    wogs.Last_InFlight_WO_Date_stamp__c = String.valueOf(wogs.Order_Product__r.Last_InFlight_WO_Date__c);
                    wogs.Last_Automation_Created_Date_stamp__c = String.valueOf(wogs.Order_Product__r.Last_Automation_Created_Date__c);
                    updateWogs.add(wogs);
                    system.debug('a5a5a5a5a5a'  + updateWogs);
                }else{
                    deleteWogs.add(wogs);
                    system.debug('a6a6a6a6a6a'  + deleteWogs);
                }
                
                                                        
        }
        Database.SaveResult[] WogsStagingErrorFinalUpdate = Database.update(updateWogs,false);
        system.debug('sysysysysysy' + WogsStagingErrorFinalUpdate);
        //Database.update(updateWogs,false);
        //Database.delete(deleteWogs,false);
        Database.DeleteResult[] WogsStagingErrorFinalDelete = Database.delete(deleteWogs,false);
        system.debug('sxsxsxsxsxsx' + WogsStagingErrorFinalDelete);
    }
     global void finish(Database.BatchableContext bc){}
}