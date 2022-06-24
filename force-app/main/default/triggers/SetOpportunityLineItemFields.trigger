trigger SetOpportunityLineItemFields on OpportunityLineItem (before insert, before update, after insert, after update, after delete) {
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    System.debug(' The QuoteSync Invoker from Opportunity Line Item: ' + QuoteLineItemSyncState.invoker);
    
    if(Trigger.isDelete) {
        Set<Id> idsToDelete = Trigger.oldMap.keySet();
        for(OpportunityLineItem o : Trigger.old) {
            if(o.isConverted__c) {
                idsToDelete.remove(o.Id);
            }
        }
        
        /**
         * Creating audit record of Survey_Asset_Location__c deletion
         * @author Ahsan Butt 10/30/2018
     */
        List<Survey_Asset_Location__c> salsToDelete = [SELECT Id, Status__c, Originating_Parent_ID__c, Originating_Record_ID__c, Site_Survey__c FROM Survey_Asset_Location__c WHERE Originating_Record_ID__c IN:idsToDelete]; 
        List<Survey_Asset_Delete__c> salDeletes = new List<Survey_Asset_Delete__c>();
        for (Survey_Asset_Location__c sal : salsToDelete) {
            Survey_Asset_Delete__c salDelete = new Survey_Asset_Delete__c();
            salDelete.Survey_Asset_Location_Id__c = sal.Id;
            salDelete.Deletion_Reason__c = 'Opportunity Line Item Deleted';
            salDelete.Deleted_By__c = UserInfo.getUserId();
            salDelete.Site_Survey__c = sal.Site_Survey__c;
            salDelete.Originating_Parent_ID__c = sal.Originating_Parent_ID__c;
            salDelete.Originating_Record_ID__c = sal.Originating_Record_ID__c;
            
            salDeletes.add(salDelete);
        }
        
        insert salDeletes;
        delete salsToDelete;
    }
    
    System.debug(Trigger.isAfter && QuoteLineItemSyncState.invoker == null && !Trigger.isDelete);
    
    if(Trigger.isAfter) {
        if(Trigger.isInsert && !Trigger.isDelete) {
            List<OpportunityLineItem> oliSync = new List<OpportunityLineItem>();
            System.debug(' The Quote Sync Trigger from Opportunity Line Item: Insert ' + + QuoteLineItemSyncState.invoker);
            for (QuoteLineItem qli : [SELECT Id, OpportunityLineItemId__c, Service_Frequency__c, Service_Price_Per_Unit__c, Installation_Price__c, Purchase_Price__c, Related_Product__c, Description, Installation_Status__c 
                                      FROM QuoteLineItem WHERE OpportunityLineItemId__c LIKE :Trigger.newMap.keySet() AND Quote.IsSyncing=TRUE]) 
            {
                oliSync.add(new OpportunityLineItem(
                    Id = qli.OpportunityLineItemId__c,
                    Service_Frequency__c = qli.Service_Frequency__c,
                    Service_Price_Per_Unit__c = qli.Service_Price_Per_Unit__c,
                    Installation_Price__c = qli.Installation_Price__c,
                    Purchase_Price__c = qli.Purchase_Price__c,
                    Related_Product__c = qli.Related_Product__c,
                    Description = qli.Description, 
                    Installation_Status__c = qli.Installation_Status__c
                ));
            }
            if (!oliSync.isEmpty()) {
                update oliSync;
            }
            //} else if (Trigger.isAfter && Trigger.isUpdate && QuoteLineItemSyncState.invoker == null) {
        } else if (QuoteLineItemSyncState.invoker == null && !Trigger.isDelete) {
            /*
             * This is where magic code happens that no one will understand. DO NOT TOUCH IT OR IT WILL BREAK THE ENTIRE ORG
             */
            System.debug(' The Quote Sync Trigger from Opportunity Line Item: Update ' + + QuoteLineItemSyncState.invoker);
            List<QuoteLineItem> qliSync = [SELECT Id, OpportunityLineItemId__c FROM QuoteLineItem WHERE OpportunityLineItemId__c LIKE :Trigger.newMap.keySet() AND Quote.IsSyncing=TRUE];
            for (QuoteLineItem qli : qliSync) {
                OpportunityLineItem oli = Trigger.newMap.get(qli.OpportunityLineItemId__c);
                System.debug('>>OpportunityLineItem from OpportunityItem Trigger, Quantity: ' + oli.quantity);
                qli.Service_Frequency__c = oli.Service_Frequency__c;
                qli.Service_Price_Per_Unit__c = oli.Service_Price_Per_Unit__c;
                qli.Installation_Price__c = oli.Installation_Price__c;
                qli.Purchase_Price__c = oli.Purchase_Price__c;
                qli.Related_Product__c = oli.Related_Product__c;
                qli.Description = oli.Description;
                qli.Installation_Status__c = oli.Installation_Status__c;
                qli.Quantity = oli.Quantity; //added this line to make quote sync function
                qli.UnitPrice = oli.UnitPrice; //added this line to make quote sync function
            }
            System.debug(qliSync);
            if (!qliSync.isEmpty()) {
                for (QuoteLineItem qli : qliSync) {
                    System.debug('from oli to qli: ' + qli);
                }
                System.debug('**Quote Sync from OLI Before Updating QLI** ' + QuoteLineItemSyncState.invoker);
                update qliSync;
            }
            
        }
        
        if (QuoteLineItemSyncState.invoker == null) {
            QuoteLineItemSyncState.invoker = 'OLI'; 
            System.debug('**Quote Sync from OLI After Updating QLI** ' + QuoteLineItemSyncState.invoker);
        }
    }

    /* Syncing block ends */
    //if(Trigger.isBefore /*&& !TriggerHelper.hasRun*/) {
    /*if(Trigger.isBefore) {
        //TriggerHelper.hasRun = true;
        
        Map<Id,Product2> prodMap = new Map<Id,Product2>();
        
        for (OpportunityLineItem oli : Trigger.new) {
            if(Trigger.isInsert && oli.SurveyAssetCountChecker__c==null) {
                oli.SurveyAssetCountChecker__c = 0; 
            } 
            prodMap.put(oli.Product2Id,null);
        }
        
        Map<String,Frequency__c> freqMap = Frequency__c.getAll();
        
        for (OpportunityLineItem oli : Trigger.new) {
            Product2 prod = prodMap.get(oli.Product2Id);
            
            if (prod != null) {
                if(prod.Allowable_Frequencies__c != null) {
                    Set<String> allowableFreq = new Set<String>();
                    allowableFreq.addAll(prod.Allowable_Frequencies__c.split(';'));
                    if (oli.Service_Price_Per_Unit__c != null && oli.Service_Frequency__c != null && !allowableFreq.contains(oli.Service_Frequency__c)) {
                        oli.Service_Frequency__c.addError(oli.Service_Frequency__c + ' is not applicable for the product. Applicable frequencies are ' + prod.Allowable_Frequencies__c);
                    }
                } else if(!oli.Service_Frequency__c.equalsIgnoreCase('One-Time')){
                    oli.Service_Frequency__c.addError(prod.Name + ' cannot be a recurring service/delivery');
                }
            }
            
            // Price calculation
            Frequency__c frequency = freqMap.get(oli.Service_Frequency__c);
            
            //Standard UnitPrice, represents total first year cost for quantity of 1
            oli.UnitPrice = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (oli.Service_Price_Per_Unit__c != null ? oli.Service_Price_Per_Unit__c : 0) : 0) 
                    + (oli.Installation_Price__c != null ? oli.Installation_Price__c : 0) + (oli.Purchase_Price__c != null ? oli.Purchase_Price__c : 0);
            
            System.debug(oli.UnitPrice);
            
            //Monthly Revenue =  ((# of Occurrences * Service Price / 12)
            oli.Monthly_Revenue__c = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (oli.Service_Price_Per_Unit__c != null ? oli.Service_Price_Per_Unit__c : 0) : 0)/12;
            
            //Installtion Picklist and Installation Price validation block
            OpportunityLineItem oldRec = Trigger.isInsert ? new OpportunityLineItem() : Trigger.oldMap.get(oli.Id);
            
            Boolean isValid = oldRec.Installation_Price__c!=oli.Installation_Price__c || oli.Installation_Status__c!=oldRec.Installation_Status__c;
            //opp sycn quote condition to stop syncing fail
            
            if(isValid) {
                Boolean isConsumableOneTime = (oli.Installation_Status__c != null && oli.Installation_Status__c != dataSets.Status_Value_for_Install_of_a_Product__c) && oli.Item_Type__c.equalsIgnoreCase(dataSets.Item_Type_for_Consumables__c);
                
                if(isConsumableOneTime) {
                    oli.addError(' You cannot provide Installation Price or Installation Status for a Consumable Product. ');
                } else {
                    // Please do not change to Installation__c formula field, as this logic needs to work during quote sync
                    Boolean requireStatus = oli.Installation_Price__c!=NULL && (oli.Installation_Status__c!=dataSets.Status_Value_for_Install_of_a_Product__c && oli.Installation_Status__c!=dataSets.Status_Value_for_Replace_of_a_Product__c) ;
                    
                    if(requireStatus) {
                        oli.addError('Please choose either Install/Replace values from Installation Status picklist for this item');
                    }
                    
                    Boolean requireInstallPrice = String.isNotBlank(oli.Installation_Status__c) && oli.Installation_Price__c==NULL; 
                    
                    if(requireInstallPrice && (oli.Installation_Status__c==dataSets.Status_Value_for_Install_of_a_Product__c || oli.Installation_Status__c==dataSets.Status_Value_for_Replace_of_a_Product__c)) {
                        oli.addError('Please enter a value for the Installation Price field for Installation Statuses of ' + dataSets.Status_Value_for_Install_of_a_Product__c +' or ' + dataSets.Status_Value_for_Replace_of_a_Product__c +', zero dollars are accepted, if customer should not be charged. ');
                    }
                }
            }
        }
    }  */
    
    if(Trigger.isBefore) {
        Map<Id, Product2> prodMap = new Map<Id, Product2>();

        for (OpportunityLineItem oli : Trigger.new) {
            if(Trigger.isInsert && oli.SurveyAssetCountChecker__c==null) {
                oli.SurveyAssetCountChecker__c = 0;
            }
            prodMap.put(oli.Product2Id,null);
        }
        
        for (Product2 p : [SELECT Id, Allowable_Frequencies__c, Name FROM Product2 WHERE Id IN :prodMap.keySet()]) {
            prodMap.put(p.Id,p);
        }

        Map<String,Frequency__c> freqMap = Frequency__c.getAll();

        System.debug(prodMap);
        
        for (OpportunityLineItem oli : Trigger.new) {
            Product2 prod = prodMap.get(oli.Product2Id);

            if (prod != null) {
                if(prod.Allowable_Frequencies__c != null) {
                    Set<String> allowableFreq = new Set<String>();
                    allowableFreq.addAll(prod.Allowable_Frequencies__c.split(';'));
                    
                    System.debug(oli.Service_Price_Per_Unit__c);
                    System.debug(oli.Service_Frequency__c);
                    System.debug(allowableFreq.contains(oli.Service_Frequency__c));
                    
                    if (oli.Service_Price_Per_Unit__c != null && oli.Service_Frequency__c != null && !allowableFreq.contains(oli.Service_Frequency__c)) {
                        oli.Service_Frequency__c.addError(oli.Service_Frequency__c + ' is not applicable for the product. Applicable frequencies are ' + prod.Allowable_Frequencies__c);
                    }
                } else if(!oli.Service_Frequency__c.equalsIgnoreCase('One-Time')){
                    oli.Service_Frequency__c.addError(prod.Name + ' cannot be a recurring service/delivery');
                }
            }

            // Price calculation
            Frequency__c frequency = freqMap.get(oli.Service_Frequency__c);

            //Standard UnitPrice, represents total first year cost for quantity of 1
            oli.UnitPrice = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (oli.Service_Price_Per_Unit__c != null ? oli.Service_Price_Per_Unit__c : 0) : 0)
                    + (oli.Installation_Price__c != null ? oli.Installation_Price__c : 0) + (oli.Purchase_Price__c != null ? oli.Purchase_Price__c : 0);

            System.debug(oli.UnitPrice);

            //Monthly Revenue =  ((# of Occurrences * Service Price / 12)
            oli.Monthly_Revenue__c = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (oli.Service_Price_Per_Unit__c != null ? oli.Service_Price_Per_Unit__c : 0) : 0)/12;

            //Installtion Picklist and Installation Price validation block
            OpportunityLineItem oldRec = Trigger.isInsert ? new OpportunityLineItem() : Trigger.oldMap.get(oli.Id);

            Boolean isValid = oldRec.Installation_Price__c!=oli.Installation_Price__c || oli.Installation_Status__c!=oldRec.Installation_Status__c;
            //opp sycn quote condition to stop syncing fail

            if(isValid) {
                Boolean isConsumableOneTime = (oli.Installation_Status__c != null && oli.Installation_Status__c != dataSets.Status_Value_for_Install_of_a_Product__c) /*&& oli.Service_Frequency__c.equalsIgnoreCase(dataSets.Non_Recurring_Frequency_Value__c)*/ && oli.Item_Type__c.equalsIgnoreCase(dataSets.Item_Type_for_Consumables__c);

                if(isConsumableOneTime) {
                    oli.addError(' You cannot provide Installation Price or Installation Status for a Consumable Product. ');
                } else {
                    // Please do not change to Installation__c formula field, as this logic needs to work during quote sync
                    Boolean requireStatus = oli.Installation_Price__c!=NULL && (oli.Installation_Status__c!=dataSets.Status_Value_for_Install_of_a_Product__c && oli.Installation_Status__c!=dataSets.Status_Value_for_Replace_of_a_Product__c) ;

                    if(requireStatus) {
                        oli.addError('Please choose either Install/Replace values from Installation Status picklist for this item');
                    }

                    Boolean requireInstallPrice = String.isNotBlank(oli.Installation_Status__c) && oli.Installation_Price__c==NULL;

                    if(requireInstallPrice && (oli.Installation_Status__c==dataSets.Status_Value_for_Install_of_a_Product__c || oli.Installation_Status__c==dataSets.Status_Value_for_Replace_of_a_Product__c)) {
                        oli.addError('Please enter a value for the Installation Price field for Installation Statuses of ' + dataSets.Status_Value_for_Install_of_a_Product__c +' or ' + dataSets.Status_Value_for_Replace_of_a_Product__c +', zero dollars are accepted, if customer should not be charged. ');
                    }
                }
            }
        }
    }
   
    /* site survey asset creation, executed only for opp line items with a site survey attached to parent opp and has either installation/service price filled in
    * If opportunity is converted to an order, changes made to opp line items after that stage is ignored -- indicated by the flag isConverted__c on opp and opp line items. 
    * Opp qty can only be decreased if there are unallocated site survey assets. If not, user would have to unallocate assets before decreasing qty
    * if opp line items are deleted then all associated site survey information is deleted -- done in the beginning of this trigger
    */
    
    Map<Id, OpportunityLineItem> validOppProds = new Map<Id, OpportunityLineItem>();
    Map<Id, Decimal> assetsToDeleteIds = new Map<Id, Decimal>();
    Map<Id, List<Survey_Asset_Location__c>> assetsToDelete = new Map<Id, List<Survey_Asset_Location__c>>();
    Map<Id, OpportunityLineItem> updateSurveyAssetsIds = new Map<Id, OpportunityLineItem>();
    List<Survey_Asset_Location__c> updateSurveyAssets = new List<Survey_Asset_Location__c>();
    Set<Id> hasAllocatedAssets = new Set<Id>();
    
    if(Trigger.isBefore && Trigger.isUpdate) {        
        System.debug(' The Before Section of Opportunity Line Item for SS : ' + QuoteLineItemSyncState.invoker);
        for(OpportunityLineItem ol : Trigger.new) 
        {
            OpportunityLineItem oldRec = Trigger.oldMap.get(ol.Id);
            Boolean isValid = ! (ol.IsConverted__c || ol.isPurchaseOnly__c) && ol.Opportunity_Record_Type__c!=dataSets.Opportunity_RecordType_Frequency_Change__c;
            
            if(isValid) {
                if(oldRec.Related_Product__c != ol.Related_Product__c || oldRec.Service_Frequency__c != ol.Service_Frequency__c) {
                    System.debug(' -- Changed Related Prod or Frequency -- ' + ol.Name);
                    updateSurveyAssetsIds.put(ol.Id, ol);
                }
                Decimal difference = ol.Quantity - (ol.SurveyAssetCountChecker__c != null ? ol.SurveyAssetCountChecker__c : 0);
                System.debug(' qty ' + ol.Quantity + ' isValid ' + isValid + ' difference ' + difference + ' countfield ' + ol.SurveyAssetCountChecker__c);
                if(difference < 0) {
                    System.debug(' qty ' + ol.Quantity + ' isValid ' + isValid + ' difference ' + difference + ' countfield ' + ol.SurveyAssetCountChecker__c);
                    assetsToDeleteIds.put(ol.Id, Integer.valueOf(-difference));
                } 
            }             
        }
        
        if(!updateSurveyAssetsIds.isEmpty()) {
            for(Survey_Asset_Location__c sl : [SELECT Id, Status__c, Originating_Record_ID__c, Service_Frequency__c, Related_Product__c FROM Survey_Asset_Location__c WHERE 
                                               Originating_Record_ID__c IN:updateSurveyAssetsIds.keySet() ORDER BY Originating_Record_ID__c]) 
            {
                OpportunityLineItem ol = updateSurveyAssetsIds.get(sl.Originating_Record_ID__c);
                sl.Related_Product__c = ol.Related_Product__c; 
                sl.Service_Frequency__c = ol.Service_Frequency__c;
                updateSurveyAssets.add(sl);
            }
            if(!updateSurveyAssets.isEmpty()) {
                System.debug(updateSurveyAssets);
                update updateSurveyAssets;
            }
        }
        
        if(!assetsToDeleteIds.isEmpty()) {
            System.debug(' Trigger entered here assets not empty  ');
            /**
            * Further audit record of Survey_Asset_Location__c deletion
            * @author Ahsan Butt 11/06/2018
        */
            for(Survey_Asset_Location__c sl : [SELECT Id, Status__c, Originating_Record_ID__c, Originating_Parent_ID__c, Site_Survey__c FROM Survey_Asset_Location__c WHERE Originating_Record_ID__c IN:assetsToDeleteIds.keySet() 
                                               ORDER BY Originating_Record_ID__c]) 
            {
                if(sl.Status__c.equalsIgnoreCase('Unallocated')) {
                    if(assetsToDelete.containsKey(sl.Originating_Record_ID__c)){
                        assetsToDelete.get(sl.Originating_Record_ID__c).add(sl);
                    } else {
                        assetsToDelete.put(sl.Originating_Record_ID__c, new List<Survey_Asset_Location__c>{sl});
                    }
                } else {
                    hasAllocatedAssets.add(sl.Originating_Record_ID__c);
                }
            }
            
            List<Survey_Asset_Location__c> assetsToDeleteList = new List<Survey_Asset_Location__c>();
            
            for(OpportunityLineItem ol : Trigger.new)
            {
                if(assetsToDeleteIds.containsKey(ol.Id) && ol.Opportunity_Record_Type__c!=dataSets.Opportunity_RecordType_Frequency_Change__c){
                    System.debug(' Trigger entered here assets not empty  ');
                    if(assetsToDelete.containsKey(ol.Id)) {
                        System.debug(assetsToDeleteIds.get(ol.Id) + ' > ' + assetsToDelete.get(ol.Id).size());
                        if(assetsToDeleteIds.get(ol.Id)>assetsToDelete.get(ol.Id).size()) {
                            ol.Quantity.addError('Unallocate Site Survey Assets before decreasing the quantity');
                        } else {
                            validOppProds.put(ol.Id, ol); 
                            ol.SurveyAssetCountChecker__c -= assetsToDelete.get(ol.Id).size();
                            assetsToDeleteList.addAll(assetsToDelete.get(ol.Id));
                        }
                    } else if(hasAllocatedAssets.contains(ol.Id)){
                        ol.Quantity.addError('Unallocate Site Survey Assets before decreasing the quantity');
                    }
                }
            }
            if(!assetsToDeleteList.isEmpty()) {
                /**
                 * Further audit record of Survey_Asset_Location__c deletion
                 * @author Ahsan Butt 11/06/2018
                 */
                List<Survey_Asset_Delete__c> salDeletes = new List<Survey_Asset_Delete__c>();
                for (Survey_Asset_Location__c sal : assetsToDeleteList) {
                    Survey_Asset_Delete__c salDelete = new Survey_Asset_Delete__c();
                    salDelete.Survey_Asset_Location_Id__c = sal.Id;
                    salDelete.Deletion_Reason__c = 'Opportunity Line Item Quantity Reduced';
                    salDelete.Deleted_By__c = UserInfo.getUserId();
                    salDelete.Site_Survey__c = sal.Site_Survey__c;
                    salDelete.Originating_Parent_ID__c = sal.Originating_Parent_ID__c;
                    salDelete.Originating_Record_ID__c = sal.Originating_Record_ID__c;
                    
                    salDeletes.add(salDelete);
                }
                
                insert salDeletes;
                
                System.debug('--> unallocated assets are being deleted');
                delete assetsToDeleteList;
            }
        }     
    } 
    
    if(Trigger.isAfter && !Trigger.isDelete) {
        System.debug(' The After Section of Opportunity Line Item for SS : ' + QuoteLineItemSyncState.invoker);
        System.debug('Custom Setting: ' + dataSets.Opportunity_RecordType_Frequency_Change__c);
        for(OpportunityLineItem ol : [SELECT Id, OpportunityId, Quantity, Product2Id, Related_Product__c, Opportunity.Site_Survey__c, SurveyAssetCountChecker__c, IsConverted__c,
                                      isPurchaseOnly__c, Opportunity.isConverted__c, Service_Frequency__c, Opportunity_Record_Type__c FROM OpportunityLineItem WHERE Id IN:Trigger.new 
                                      AND Opportunity.Site_Survey__c!=null AND Opportunity_Record_Type__c!=:dataSets.Opportunity_RecordType_Frequency_Change__c]) 
        {
            System.debug('Record Type Opp: ' + ol.Opportunity_Record_Type__c);
            Boolean isValid = ! (ol.IsConverted__c || ol.isPurchaseOnly__c);
            if(isValid) {
                Decimal difference = ol.Quantity - (ol.SurveyAssetCountChecker__c != null ? ol.SurveyAssetCountChecker__c : 0);
                if(difference > 0) {
                    System.debug(' qty ' + ol.Quantity + ' isValid ' + isValid + ' difference ' + difference + ' countfield ' + ol.SurveyAssetCountChecker__c);
                    validOppProds.put(ol.Id, ol);  
                }  
            }             
        }
        
        List<Survey_Asset_Location__c> newAssets = new List<Survey_Asset_Location__c>();  
        
        for(OpportunityLineItem ol : validOppProds.values()) {
            for(Integer i=Integer.valueOf((ol.SurveyAssetCountChecker__c != null ? ol.SurveyAssetCountChecker__c : 0)+1); i<=Integer.valueOf(ol.Quantity); i++) {
                Survey_Asset_Location__c newAsset = new Survey_Asset_Location__c(
                    Site_Survey__c = ol.Opportunity.Site_Survey__c, 
                    Product__c = ol.Product2Id, 
                    Related_Product__c = ol.Related_Product__c, 
                    Originating_Record_ID__c = ol.Id, 
                    Originating_Parent_ID__c = ol.OpportunityId, 
                    Quantity__c = 1, 
                    Service_Frequency__c = ol.Service_Frequency__c
                );
                newAssets.add(newAsset);
            }
            ol.SurveyAssetCountChecker__c = ol.Quantity;
        }
        
        if(!newAssets.isEmpty()) {
            insert newAssets;
            System.debug(newAssets);
            update validOppProds.values();
            System.debug(validOppProds.values());
        }
    }
}