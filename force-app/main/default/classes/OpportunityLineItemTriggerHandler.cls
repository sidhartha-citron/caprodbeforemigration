/**
 * @FileName: OpportunityLineItemTriggerHandler
 * @Description: Consolidated Trigger Handler Class
 * @Author: Irfan Tarique
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification 
 * Irfan Tarique     Nov 5th, 2019   Fixed Line Item Update Validations - Added 'validateOpportunityLineItems()' 
 *-----------------------------------------------------------  
 **/
public class OpportunityLineItemTriggerHandler extends TriggerHandler {
	
     /** TRIGGER EVENTS **/
    protected override void afterDelete(){
    	System.debug('OpportunityLineItemTriggerHandler|AfterDelete|opliDelete|BEGIN');
    	opliDelete(); 
        System.debug('OpportunityLineItemTriggerHandler|AfterDelete|opliDelete|END');
        
        CPQ2_Service.handleBeforeDeleteTrigger(listOppOld);
    }
    protected override void beforeInsert(){
       
        System.debug('OpportunityLineItemTriggerHandler|beforeInsert|beforeInsertFunction|BEGIN');
    	  beforeInsertFunction();   	 
        System.debug('OpportunityLineItemTriggerHandler|beforeInsert|beforeInsertFunction|END');
    	
        //Validate inserted data
        System.debug('OpportunityLineItemTriggerHandler|beforeInsert|validateOpportunityLineItems|BEGIN');
        validateOpportunityLineItems();
        System.debug('OpportunityLineItemTriggerHandler|beforeInsert|validateOpportunityLineItems|END');
        
        CPQ2_Service.handleBeforeInsertTrigger(listOppNew);
    }
    protected override void afterInsert(){
        
        System.debug('OpportunityLineItemTriggerHandler|afterInsert|insertOppLineItems|BEGIN');
        insertOppLineItems(); 
      	System.debug('OpportunityLineItemTriggerHandler|afterInsert|insertOppLineItems|END');
     	
        System.debug('OpportunityLineItemTriggerHandler|afterInsert|afterInsertUpdateFunction|BEGIN');
        afterInsertUpdateFunction();
        System.debug('OpportunityLineItemTriggerHandler|afterInsert|afterInsertUpdateFunction|END');
    }
    protected override void afterUpdate(){ 
       
        System.debug('OpportunityLineItemTriggerHandler|afterUpdate|CheckSyncState|BEGIN');
        CheckSyncState();
        System.debug('OpportunityLineItemTriggerHandler|afterUpdate|CheckSyncState|END');
        
       	System.debug('OpportunityLineItemTriggerHandler|afterUpdate|afterInsertUpdateFunction|BEGIN');
        afterInsertUpdateFunction();   
       	System.debug('OpportunityLineItemTriggerHandler|afterUpdate|afterInsertUpdateFunction|END');
        
    }
    protected override void beforeUpdate(){
     	
        System.debug('OpportunityLineItemTriggerHandler|beforeUpdate|beforeUpdateFunction|BEGIN');
        beforeUpdateFunction(); 
        System.debug('OpportunityLineItemTriggerHandler|beforeUpdate|beforeUpdateFunction|END');
        
        //Validate updated data
        System.debug('OpportunityLineItemTriggerHandler|beforeUpdate|validateOpportunityLineItems|BEGIN');
        validateOpportunityLineItems();
        System.debug('OpportunityLineItemTriggerHandler|beforeUpdate|validateOpportunityLineItems|END');
        
        stampOverrideValues();
        
        CPQ2_Service.handleBeforeUpdateTrigger(listOppNew, mapOppOld);
    }
    
    /**Variables**/
    Map<Id, OpportunityLineItem> validOppProds = new Map<Id, OpportunityLineItem>();
    Map<Id, Decimal> assetsToDeleteIds = new Map<Id, Decimal>();
    Map<Id, List<Survey_Asset_Location__c>> assetsToDelete = new Map<Id, List<Survey_Asset_Location__c>>();
    Map<Id, OpportunityLineItem> updateSurveyAssetsIds = new Map<Id, OpportunityLineItem>();
    List<Survey_Asset_Location__c> updateSurveyAssets = new List<Survey_Asset_Location__c>();
    Set<Id> hasAllocatedAssets = new Set<Id>();
    
    static Map<Id, Product2> prodMap = new Map<Id, Product2>();
    static Map<String,Frequency__c> freqMap = Frequency__c.getAll();
   
    Private List<OpportunityLineItem> listOppNew; 
    Private List<OpportunityLineItem> listOppOld;
    
  	Private Map<Id, OpportunityLineItem> mapOppNew; 
    Private Map<Id, OpportunityLineItem> mapOppOld; 
    /*Transfered Variabled from SetOpp*/
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
   	// System.debug(' The QuoteSync Invoker from Opportunity Line Item: ' + QuoteLineItemSyncState.invoker);
    
    public OpportunityLineItemTriggerHandler(){ 
        listOppNew = Trigger.new; 
        listOppOld = Trigger.old;
      	mapOppNew = (map<Id, OpportunityLineItem>)Trigger.newMap;
       	mapOppOld = (map<Id, OpportunityLineItem>)Trigger.oldMap;
    
    }
  
    public void opliDelete(){
        Set<Id> idsToDelete = mapOppOld.keySet();
        for(OpportunityLineItem o : listOppOld) {
            if(o.isConverted__c) {
                idsToDelete.remove(o.Id);
            }
        }
        
        /**
         * Creating audit record of Survey_Asset_Location__c deletion
         * @author Ahsan Butt 10/30/2018
   		**/
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
    
    public void insertOppLineItems(){
        List<OpportunityLineItem> oliSync = new List<OpportunityLineItem>();
            System.debug(' The Quote Sync Trigger from Opportunity Line Item: Insert ' + + QuoteLineItemSyncState.invoker);
            for (QuoteLineItem qli : [SELECT Id, OpportunityLineItemId__c, Service_Frequency__c, Service_Price_Per_Unit__c, Installation_Price__c, Purchase_Price__c, Related_Product__c, Description, Installation_Status__c
                                      FROM QuoteLineItem WHERE OpportunityLineItemId__c  IN : mapOppNew.keySet() AND Quote.IsSyncing=TRUE])
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
    }
       
    public void CheckSyncState(){
        if(QuoteLineItemSyncState.invoker == null){
            /*
             * This is where magic code happens that no one will understand. DO NOT TOUCH IT OR IT WILL BREAK THE ENTIRE ORG
             */
            System.debug(' The Quote Sync Trigger from Opportunity Line Item: Update ' + + QuoteLineItemSyncState.invoker);
            List<QuoteLineItem> qliSync = [SELECT Id, OpportunityLineItemId__c FROM QuoteLineItem WHERE OpportunityLineItemId__c IN :mapOppNew.keySet() AND Quote.IsSyncing=TRUE];
            for (QuoteLineItem qli : qliSync) {
                OpportunityLineItem oli = mapOppNew.get(qli.OpportunityLineItemId__c);
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
    }
    
   
    public void beforeInsertFunction(){
          
       for (OpportunityLineItem oli : listOppNew) {
          if(Trigger.isInsert && oli.SurveyAssetCountChecker__c==null) {
                oli.SurveyAssetCountChecker__c = 0;
            }
            prodMap.put(oli.Product2Id,null);
        }

        for (Product2 p : [SELECT Id, Allowable_Frequencies__c, Name FROM Product2 WHERE Id IN :prodMap.keySet()]) {
            prodMap.put(p.Id,p);
        }


        System.debug(prodMap);
    }
    
    public void beforeUpdateFunction(){
		System.debug(' The Before Section of Opportunity Line Item for SS : ' + QuoteLineItemSyncState.invoker);
        
        for(OpportunityLineItem ol : listOppNew)
        {
            //CPQCN-538
            if(ol.CPQ_Commission_Status__c!=null && ol.CPQ_Commission_Status__c=='Locked'){
                ol.Ship_To_Score_on_Locked_Date__c = ol.Ship_To_Score__c;
            }
            OpportunityLineItem oldRec = mapOppOld.get(ol.Id);
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

            for(OpportunityLineItem ol : listOppNew)
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
    
    public void afterInsertUpdateFunction() {
        
        System.debug(' The After Section of Opportunity Line Item for SS : ' + QuoteLineItemSyncState.invoker);
        System.debug('Custom Setting: ' + dataSets.Opportunity_RecordType_Frequency_Change__c);
        
        for(OpportunityLineItem ol : [SELECT Id, OpportunityId, Quantity, Product2Id, Related_Product__c, Opportunity.Site_Survey__c, SurveyAssetCountChecker__c, IsConverted__c,
                                      isPurchaseOnly__c, Opportunity.isConverted__c, Service_Frequency__c, Opportunity_Record_Type__c FROM OpportunityLineItem WHERE Id IN:listOppNew
                                      AND Opportunity.Site_Survey__c!=null])
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

	/*
	     * @Name        validateOpportunityLineItems
	     * @Description Enforces Validation Rules
	     * @Author      Irfan Tarique
	     * @Params      None
	     * @Return      None
	*/
    
	public void validateOpportunityLineItems(){
	  for (OpportunityLineItem oli : listOppNew) {
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

            //***Add #of occurrances
            oli.CPQ_Number_Of_Visits_Per_Year__c  = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0):0);          
          
            //Installtion Picklist and Installation Price validation block
            OpportunityLineItem oldRec = Trigger.isInsert ? new OpportunityLineItem() : mapOppOld.get(oli.Id);

            Boolean isValid = oldRec.Installation_Price__c!=oli.Installation_Price__c || oli.Installation_Status__c!=oldRec.Installation_Status__c;
            //opp sycn quote condition to stop syncing fail

            if(isValid) {
                system.debug('oli ' + oli);
                system.debug('dataSets ' + dataSets.Status_Value_for_Install_of_a_Product__c);
                 system.debug('dataSets ' + dataSets.Item_Type_for_Consumables__c);
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
	}
    
   /*
    *   Responsible for handling the stamping of new overrides and original values
    */
    private void stampOverrideValues(){
        for (OpportunityLineItem oli : listOppNew){

            // override quantity
            if(oli.CPQ_Commission_Override_Quantity__c != null &&  
                oli.Quantity != oli.CPQ_Commission_Override_Quantity__c){
                    oli.CPQ_Original_Quantity__c = oli.Quantity;
                    oli.Quantity = oli.CPQ_Commission_Override_Quantity__c;
            }

            // override frequency
            if(String.isNotEmpty(oli.CPQ_Commission_Override_Frequency__c) &&  
                oli.Service_Frequency__c != oli.CPQ_Commission_Override_Frequency__c){
                    oli.CPQ_Original_Frequency__c = oli.Service_Frequency__c;
                    oli.Service_Frequency__c = oli.CPQ_Commission_Override_Frequency__c;
            }

            // override service price
            if(oli.CPQ_Commission_Override_Service_Price__c != null &&  
                oli.Service_Price_Per_Unit__c != oli.CPQ_Commission_Override_Service_Price__c){
                    oli.CPQ_Original_Service_Price_Per_Unit__c = oli.Service_Price_Per_Unit__c;
                    oli.Service_Price_Per_Unit__c = oli.CPQ_Commission_Override_Service_Price__c;
            }
        }
    }
    
 }