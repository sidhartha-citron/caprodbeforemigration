trigger SyncQuoteLineItemDetails on QuoteLineItem (before insert, before update, after update) {
    
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    System.debug(' The QuoteSync Invoker from Quote Line Item: ' + QuoteLineItemSyncState.invoker);
    /* Syncing block starts */
    if (Trigger.isBefore && Trigger.isInsert) {
        System.debug(' The Quote Sync Trigger from Quote Line Item: Before & Insert ' + QuoteLineItemSyncState.invoker);
        Map<Id, QuoteLineItem> qliSync = new Map<Id, QuoteLineItem>();
        Set<Id> oliIds = new Set<Id>();
        for (QuoteLineItem qli : Trigger.new) {
            if (qli.OpportunityLineItemId__c != null) {
                qliSync.put(qli.OpportunityLineItemId__c, qli);
                oliIds.add(qli.OpportunityLineItemId__c);
            }
        }
        
        if (!oliIds.isEmpty()) {
            System.debug(' The Quote Sync Trigger from Quote Line Item: Insert ' + QuoteLineItemSyncState.invoker);
            for (OpportunityLineItem oli : [SELECT Id, Service_Frequency__c, Service_Price_Per_Unit__c, Installation_Price__c, 
                                                    Purchase_Price__c, Related_Product__c, Description, Installation_Status__c, 
                                                    Areas_of_Coverage__c, Areas_of_Coverage_Other__c, Covered_Pests__c, Covered_Pests_Other__c 
                                            FROM OpportunityLineItem 
                                            WHERE Id IN :oliIds]) {
                QuoteLineItem qli = qliSync.get(oli.Id);
                // map custom fields here and update query
                qli.Service_Frequency__c = oli.Service_Frequency__c;
                qli.Service_Price_Per_Unit__c = oli.Service_Price_Per_Unit__c;
                qli.Installation_Price__c = oli.Installation_Price__c;
                qli.Purchase_Price__c = oli.Purchase_Price__c;
                qli.Related_Product__c = oli.Related_Product__c;
                qli.Description = oli.Description;
                qli.Installation_Status__c = oli.Installation_Status__c;
                qli.Areas_of_Coverage__c = oli.Areas_of_Coverage__c;
                qli.Areas_of_Coverage_Other__c = oli.Areas_of_Coverage_Other__c;
                qli.Covered_Pests__c = oli.Covered_Pests__c;
                qli.Covered_Pests_Other__c = oli.Covered_Pests_Other__c;
            }
        }
    } else if (Trigger.isAfter && Trigger.isUpdate && QuoteLineItemSyncState.invoker == null) {
        /*
         * This is where magic code happens that no one will understand. DO NOT TOUCH IT OR IT WILL BREAK THE ENTIRE ORG
         */
        System.debug(' The Quote Sync Trigger from Quote Line Item: Update');
        List<OpportunityLineItem> oliSync = new List<OpportunityLineItem>();
        for (QuoteLineItem qli : Trigger.new) {
            System.debug('>>QuoteLineItem from QuoteLineItem Trigger, Quantity: ' + qli.quantity);
            if (qli.OpportunityLineItemId__c != null) {
                oliSync.add(new OpportunityLineItem(
                    Id = qli.OpportunityLineItemId__c,
                    Service_Frequency__c = qli.Service_Frequency__c,
                    Service_Price_Per_Unit__c = qli.Service_Price_Per_Unit__c,
                    Installation_Price__c = qli.Installation_Price__c,
                    Purchase_Price__c = qli.Purchase_Price__c,
                    Related_Product__c = qli.Related_Product__c,
                    Description = qli.Description, 
                    Installation_Status__c = qli.Installation_Status__c,
                    Quantity = qli.Quantity
                ));
            }
        }
        if (!oliSync.isEmpty()) {
            for (OpportunityLineItem oli : oliSync) {
                System.debug('from quote to oli: ' + oli);
            }
            QuoteLineItemSyncState.invoker = 'QLI'; 
            System.debug('**Quote Sync from QLI before updating OLI ** ' + QuoteLineItemSyncState.invoker);
            update oliSync;
        }
        System.debug('**Quote Sync from QLI After Updating OLI ** ' + QuoteLineItemSyncState.invoker);
    }
    
    if (QuoteLineItemSyncState.invoker == null) {
        System.debug('**Quote Sync from QLI After Updating OLI ** ' + QuoteLineItemSyncState.invoker);
    }
    /* Syncing block ends */
    
    if (Trigger.isBefore) {
        Set<Id> quoteIds = new Set<Id>();
        Set<Id> oppAccounts = new Set<Id>();
        Map<Id,Product2> prodMap = new Map<Id,Product2>();
        Map<String, QuoteLineItem> productMap = new Map<String, QuoteLineItem>();
        Map<Id, QuoteLineItem> itemProductMap = new Map<Id, QuoteLineItem>();
        
        for (QuoteLineItem qli : Trigger.new) {
            prodMap.put(qli.Product2Id,null);
            itemProductMap.put(qli.Product2Id, qli);
            quoteIds.add(qli.QuoteId);
        }
        
        quoteIds.remove(null);
        prodMap.remove(null);
        itemProductMap.remove(null);
        
        for (Product2 p : [SELECT Id, Allowable_Frequencies__c, Name, ExternalId__c FROM Product2 WHERE Id IN :prodMap.keyset()]) {
            prodMap.put(p.Id,p);
            //drew
            productMap.put(p.ExternalId__c, itemProductMap.get(p.Id));
        }
        
        productMap.remove(null);
            
        for (Quote q : [SELECT Opportunity.AccountId FROM Quote WHERE Id IN: quoteIds]) {
            oppAccounts.add(q.Opportunity.AccountId);
        }
        
        oppAccounts.remove(null);
        
        Map<String,Frequency__c> freqMap = Frequency__c.getAll();
        
        for (QuoteLineItem qli : Trigger.new) {
            Product2 prod = prodMap.get(qli.Product2Id);
            
            if(prod!=null) {
                if (prod.Allowable_Frequencies__c != null) {
                    Set<String> allowableFreq = new Set<String>(); 
                    allowableFreq.addAll(prod.Allowable_Frequencies__c.split(';'));
                    if (qli.Service_Price_Per_Unit__c != null && qli.Service_Frequency__c != null && !allowableFreq.contains(qli.Service_Frequency__c)) {
                        qli.Service_Frequency__c.addError(qli.Service_Frequency__c + ' is not applicable for the product.Applicable frequencies are: ' + prod.Allowable_Frequencies__c);
                    }
                } else if(qli!=null && qli.Service_Frequency__c!=null && !qli.Service_Frequency__c.equalsIgnoreCase('One-Time')){
                    qli.Service_Frequency__c.addError(prod.Name + ' cannot be a recurring service/delivery');
                }
            }
            
            Frequency__c frequency = freqMap.get(qli.Service_Frequency__c);
            //Unit Price = (# of Occurrences * Service Price + Installation Price + Purchase Price)
            qli.UnitPrice = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (qli.Service_Price_Per_Unit__c != null ? qli.Service_Price_Per_Unit__c : 0) : 0) 
                		 	+ (qli.Installation_Price__c != null ? qli.Installation_Price__c : 0) + (qli.Purchase_Price__c != null ? qli.Purchase_Price__c : 0);
            
            //Monthly Revenue = (# of Occurrences * Service Price / 12) 
            qli.Monthly_Revenue__c = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (qli.Service_Price_Per_Unit__c != null ? qli.Service_Price_Per_Unit__c : 0) : 0)/12;
            
            //Installtion Picklist and Installation Price validation block
            QuoteLineItem oldRec = Trigger.isInsert ? new QuoteLineItem() : Trigger.oldMap.get(qli.Id);
            
            Boolean isValid = oldRec.Installation_Price__c!=qli.Installation_Price__c || qli.Installation_Status__c!=oldRec.Installation_Status__c;
            if(isValid) {
                // Please do not change to Installation__c formula field, as this logic needs to work during quote sync
                Boolean isConsumableOneTime = (qli.Installation_Status__c != null && qli.Installation_Status__c != dataSets.Status_Value_for_Install_of_a_Product__c) /*&& qli.Service_Frequency__c.equalsIgnoreCase(dataSets.Non_Recurring_Frequency_Value__c )*/ && qli.Item_Type__c.equalsIgnoreCase(dataSets.Item_Type_for_Consumables__c);
                System.debug('isConsumableOneTime ' + isConsumableOneTime);
                
                if(isConsumableOneTime) {
                    qli.addError(' You cannot provide Installation Price or Installation Status for a Consumable Product. ');   
                } else {
                    Boolean requireStatus = qli.Installation_Price__c!=NULL /*&& oldRec.Installation_Price__c!=qli.Installation_Price__c*/ && (qli.Installation_Status__c!=dataSets.Status_Value_for_Install_of_a_Product__c && qli.Installation_Status__c!=dataSets.Status_Value_for_Replace_of_a_Product__c) ;
                    if(requireStatus) {
                        qli.addError('Please choose either Install/Replace values from Installation Status picklist for this item');
                    }
                    Boolean requireInstallPrice = String.isNotBlank(qli.Installation_Status__c) /*&& qli.Installation_Status__c!=oldRec.Installation_Status__c*/ && qli.Installation_Price__c==NULL; 
                    
                    System.debug('>>Require Price: ' + requireInstallPrice);
                    
                    if(requireInstallPrice && (qli.Installation_Status__c==dataSets.Status_Value_for_Install_of_a_Product__c || qli.Installation_Status__c==dataSets.Status_Value_for_Replace_of_a_Product__c)) {
                        qli.addError('Please enter a value for the Installation Price field for Installation Statuses of ' + dataSets.Status_Value_for_Install_of_a_Product__c +' or ' + dataSets.Status_Value_for_Replace_of_a_Product__c +', zero dollars are accepted, if customer should not be charged. ');
                    }
                }
            }
        }
    }
    
}