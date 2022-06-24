trigger SetOpportunityFields on Opportunity (before insert, before update, before delete) {
    
    Field_Service_Settings__c custSetting = Field_Service_Settings__c.getOrgDefaults();
    Map<Id, Account> accMap = new Map<Id,Account>();
    Map<Id, String> opportunityAddressErrors = new Map<Id, String>();
    Map<Id, String> opportunityOperatingHoursErrors = new Map<Id, String>();
    Map<Id, String> opportunityproductlineitemErrors = new Map<Id, String>();
    Map<Id, String> opportunityServiceTerritoryErrors = new Map<Id, String>();
    Map<Id, String> opportunityItemFrequencyErrors = new Map<Id, String>();
    Map<Id, OpportunityContactRole> opportunityContactMap = new Map<Id, OpportunityContactRole>();
    Map<Id, Opportunity> OpportunityContainingInActiveProd = new Map<Id, Opportunity>(); 
    
    
    
    String loggedInUserProfileId = UserInfo.getProfileId();
    
    Set<Id> signedStageAccessible = new Set<Id>{custSetting.System_Administrator_Profile_Id__c, custSetting.Integration_User_Profile__c, custSetting.Customer_Service_Profile_Id__c};
    
    if(Trigger.isDelete) {
        System.debug('Before Deleting Opp Trigger to clear Site Survey');
        Set<Id> idsToDelete = Trigger.oldMap.keySet();
        for(Opportunity o : Trigger.old) {
            if(o.isConverted__c) {
                idsToDelete.remove(o.Id);
            }
        }
        
        /**
         * Creating audit record of Survey_Asset_Location__c deletion
         * @author Ahsan Butt 10/30/2018
        **/
        List<Survey_Asset_Location__c> salsToDelete = [SELECT Id, Status__c, Originating_Parent_ID__c, Originating_Record_ID__c, Site_Survey__c FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c IN:idsToDelete]; 
        List<Survey_Asset_Delete__c> salDeletes = new List<Survey_Asset_Delete__c>();
        for (Survey_Asset_Location__c sal : salsToDelete) {
            Survey_Asset_Delete__c salDelete = new Survey_Asset_Delete__c();
            salDelete.Survey_Asset_Location_Id__c = sal.Id;
            salDelete.Deletion_Reason__c = 'Opportunity Deleted';
            salDelete.Deleted_By__c = UserInfo.getUserId();
            salDelete.Site_Survey__c = sal.Site_Survey__c;
            salDelete.Originating_Parent_ID__c = sal.Originating_Parent_ID__c;
            salDelete.Originating_Record_ID__c = sal.Originating_Record_ID__c;
            
            salDeletes.add(salDelete);
        }
        
        insert salDeletes;
        delete salsToDelete;
        
    } else {
        Map<Id, String> siteSurveyErrors = new Map<Id, String>();
       List<id> oppids = new List<id>();         
        
        for (Opportunity op : Trigger.new) {
            
            if(op.RecordTypeId!=custSetting.Opportunity_RecordType_Frequency_Change__c) {
                Opportunity oldRec = (Trigger.isInsert ? new Opportunity() : Trigger.oldMap.get(op.Id));
                if (op.StageName == custSetting.Opportunity_Case_Creation_Stage_Name__c && (trigger.isInsert || (trigger.isUpdate && op.StageName!=Trigger.oldMap.get(op.Id).StageName))) {
                    siteSurveyErrors.put(op.Id, null);
                    opportunityContactMap.put(op.Id, null);
                    opportunityItemFrequencyErrors.put(op.Id, null);
                }
                if ((op.ForecastCategoryName=='Closed' || op.ForecastCategoryName=='Commit') && (trigger.isInsert || (op.ForecastCategoryName!=oldRec.ForecastCategoryName))) {
                    accMap.put(op.AccountId, null);
                }
            }
            
           oppids.add(op.Id); 
            
        }
        
        siteSurveyErrors.remove(null);
        
        if(!siteSurveyErrors.isEmpty()) {
            for(AggregateResult a : [Select COUNT(Id) c, Originating_Parent_ID__c opp from Survey_Asset_Location__c where Originating_Parent_ID__c<>null AND Originating_Parent_ID__c in: siteSurveyErrors.keySet() AND Status__c='Unallocated' GROUP BY Originating_Parent_ID__c]) {
                siteSurveyErrors.put(String.valueOf(a.get('opp')), 'There are ' + String.valueOf(a.get('c')) + ' Survey Asset Locations that are unallocated for this Opportunity. Please allocate these items before selecting this Stage.');
            }
        }
        
        opportunityContactMap.remove(null);
        
        if(!opportunityContactMap.isEmpty()) {
            for(OpportunityContactRole oc : [SELECT ContactId, OpportunityId FROM OpportunityContactRole WHERE IsPrimary=TRUE AND OpportunityId IN:opportunityContactMap.keySet()]) {
                if(opportunityContactMap.containsKey(oc.OpportunityId)) {
                    opportunityContactMap.remove(oc.OpportunityId);
                }
            }
        }
        
        opportunityItemFrequencyErrors.remove(null);
        
        if(!opportunityItemFrequencyErrors.isEmpty()) {
            for(AggregateResult a : [SELECT COUNT(Id) c, OpportunityId opportunity, Service_Frequency__c frequency FROM OpportunityLineItem
                                     WHERE OpportunityId IN :opportunityItemFrequencyErrors.keySet() AND Service_Frequency__c=NULL GROUP BY OpportunityId, Service_Frequency__c]) {
                opportunityItemFrequencyErrors.put(String.valueOf(a.get('opportunity')), 'There are ' + String.valueOf(a.get('c')) + ' Opportunity Line Items with no Frequency. Please fill in frequency for all line items before selecting this stage. ');
            }
        }
        
            
//Start here

       Set<OpportunityLineItem> Opportunity_with_rejectedLineItem = new Set<OpportunityLineItem>();
        //Set<OpportunityLineItem> Opportunity_with_rejectedLineItem = new Set<OpportunityLineItem>([select  opportunityid, product2id, Related_Product__c from OpportunityLineItem where OpportunityId In:oppids and product2.isActive = false]); 
        Set<OpportunityLineItem> search_return = new Set<OpportunityLineItem>([select opportunityid, product2id, Product2.IsActive, Related_Product__c,Related_Product__r.IsActive from OpportunityLineItem where OpportunityId In:oppids]);
        
        for(OpportunityLineItem opl_obj: search_return){
            if(opl_obj.Product2.isActive == false){
                Opportunity_with_rejectedLineItem.add(opl_obj);
            }
            else{
               if(opl_obj.Related_Product__c != Null && opl_obj.Related_Product__r.IsActive == false){
                    Opportunity_with_rejectedLineItem.add(opl_obj);
                }
            }
        }
        
        Map<Id, String> Rejected_Opportunities = new Map<Id, String>();

        for(OpportunityLineItem opl : Opportunity_with_rejectedLineItem){   
            System.debug('Value in OpportunityLineItem(opli):' +opl.Product2Id);    
        }
        
        for(opportunitylineitem oplis : Opportunity_with_rejectedLineItem ){
            Rejected_Opportunities.put(oplis.opportunityid, 'One or more products are inActive in this opportunity');
        }

        for(Id a: Rejected_Opportunities.keySet()){
           system.debug('Opportunity Error Found In ' + a);
        }


//End here
        
        for (Opportunity op : Trigger.new) {
            Opportunity oldRec = (Trigger.isInsert ? new Opportunity() : Trigger.oldMap.get(op.Id));
            if(op.RecordTypeId!=custSetting.Opportunity_RecordType_Frequency_Change__c) {
                if(op.StageName==custSetting.Opportunity_To_Order_Creation_Stage_Name__c) {
                    if(op.StageName!=oldRec.StageName && !signedStageAccessible.contains(loggedInUserProfileId)) {
                        op.addError('Please use Closed/Won Stage: ' + custSetting.Opportunity_Case_Creation_Stage_Name__c + ' to indicate Opportunity is Closed/Won');
                    }
                    if(op.StageName!=oldRec.StageName && oldRec.StageName!=custSetting.Opportunity_Case_Creation_Stage_Name__c) {
                        op.addError('You cannot choose ' + custSetting.Opportunity_To_Order_Creation_Stage_Name__c + ' stage without undergoing Site Survey Approval Process. Choose stage ' + custSetting.Opportunity_Case_Creation_Stage_Name__c + ' to submit for Site Survey Approval');
                    }
                }
                
                if (op.StageName == custSetting.Opportunity_Case_Creation_Stage_Name__c && op.StageName != oldRec.StageName) {
                    if(op.Site_Survey__c==null) {
                        op.addError('Please complete the Site Survey Approval Process before closing this Opportunity.');
                    }
                }
            
                
                if(siteSurveyErrors.containsKey(op.Id) && siteSurveyErrors.get(op.Id)!=null) {
                    op.addError(siteSurveyErrors.get(op.Id));
                }  
                if(opportunityContactMap.containsKey(op.Id)) {
                    op.addError('Please associate atleast one contact from this ship-to account to Contact Roles Related List and mark them as primary, before moving to one of the closed won stages');
                }
                if(opportunityItemFrequencyErrors.containsKey(op.Id) && opportunityItemFrequencyErrors.get(op.Id)!=null) {
                    op.addError(opportunityItemFrequencyErrors.get(op.Id));
                }
            } else {
                if(op.StageName!=oldRec.StageName && oldRec.StageName!=custSetting.Opportunity_Frequency_Change_Stage_Name__c && op.StageName==custSetting.Opportunity_To_Order_Creation_Stage_Name__c) {
                    op.addError('Please choose the stage: ' + custSetting.Opportunity_Frequency_Change_Stage_Name__c + ' to indicate that Opportunity is closed won');
                }
            }
             
            if(op.Site_Survey__c == null || op.Site_Survey__c!=oldRec.Site_Survey__c || op.Pricebook2Id == null || op.Pricebook2Id!=oldRec.Pricebook2Id) {
                accMap.put(op.AccountId, null);
            }
        }
        
        accMap = new Map<Id, Account>([SELECT Id, Billing_Suite_Number__c, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry, Shipping_Suite_Number__c, 
                              ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry, Site_Survey__c, 
                              ParentId, Parent.Billing_Suite_Number__c, Parent.BillingStreet, Parent.BillingCity, Parent.BillingState, Parent.BillingPostalCode, 
                              Parent.BillingCountry, Parent.Shipping_Suite_Number__c, Parent.ShippingStreet, Parent.ShippingCity, Parent.ShippingState, 
                              Parent.ShippingPostalCode, Parent.ShippingCountry, OperatingHoursId, Service_Territory__c, SalesPricebookId__c                              
                              FROM Account WHERE Id IN :accMap.keyset()]);
        
       
        
        for(Opportunity op : Trigger.new) {
            Account a = accMap.get(op.AccountId); 
            Opportunity oldRec = (Trigger.isInsert ? new Opportunity() : Trigger.oldMap.get(op.Id));
            
            if(a!=null) {
                System.debug(' Found Parent Account ' + op.ForecastCategoryName);
                if(a.Site_Survey__c !=null && a.Site_Survey__c != op.Site_Survey__c) {
                    op.Site_Survey__c = a.Site_Survey__c;
                }
                if(op.Pricebook2Id == null) {
                    op.Pricebook2Id = a.SalesPricebookId__c;
                    System.debug( '>>> ' + op.Pricebook2Id);
                } 
                Boolean isValid = (op.ForecastCategoryName=='Closed' || op.ForecastCategoryName=='Commit') && (trigger.isInsert || (op.ForecastCategoryName!=oldRec.ForecastCategoryName));
                  
                
                if (op.RecordTypeId!=custSetting.Opportunity_RecordType_Frequency_Change__c && isValid) {
                    System.debug(' ** Opportunity address trigger unit ** ' + op.Name);
                    System.debug(' Found Parent Account ');
                    if(a.ParentId!=null) {
                        if(a.Parent.BillingStreet==null || a.Parent.BillingCity==null || a.Parent.BillingCountry==null || a.Parent.BillingPostalCode==null || a.Parent.BillingState==null) {
                            opportunityAddressErrors.put(op.Id, ' Please ensure that associated Billing Account has all Billing Address Fields filled in before switching Opportunity to Commit/Closed Forecast Categories');
                        } 
                    } else {
                        if(a.BillingStreet==null || a.BillingCity==null || a.BillingCountry==null || a.BillingPostalCode==null || a.BillingState==null) {
                            opportunityAddressErrors.put(op.Id, ' Please ensure that the associated Account has all Billing Address Fields filled in before switching Opportunity to Commit/Closed Forecast Categories');
                        }
                    }
                    if(a.ShippingStreet==null || a.ShippingCity==null || a.ShippingCountry==null || a.ShippingPostalCode==null || a.ShippingState==null) {
                        if(opportunityAddressErrors.containsKey(op.Id)) {
                            opportunityAddressErrors.put(op.Id, ' Please ensure that associated Shipping Account and Billing Account has all Shipping Address Fields and Billing Address Fields filled in, respectively, before switching Opportunity to Commit/Closed Forecast Categories');
                        }
                        else {
                            opportunityAddressErrors.put(op.Id, ' Please ensure that associated Shipping Account has all Shipping Address Fields filled in before switching Opportunity to Commit/Closed Forecast Categories');
                        }
                    }
                    if(a.Service_Territory__c==null){
                        opportunityServiceTerritoryErrors.put(op.Id, 'Please fill in the Service Territory field of the associated Shipping Account');
                    }
                    if(a.OperatingHoursId==null){
                        opportunityOperatingHoursErrors.put(op.Id, 'Please fill in the Operating Hours (Standard field) field of the associated Shipping Account');
                    }
                    //Testing
                    if(Rejected_Opportunities.containsKey(op.id)){
                        opportunityproductlineitemErrors.put(op.id, 'Product(s) in your list are not set as Active');
                    }
                    if(opportunityAddressErrors.containsKey(op.Id)) {
                        op.addError(opportunityAddressErrors.get(op.Id));
                    }
                    if(opportunityServiceTerritoryErrors.containsKey(op.Id)) {
                        op.addError(opportunityServiceTerritoryErrors.get(op.Id));
                    }
                    if(opportunityOperatingHoursErrors.containsKey(op.Id)) {
                        op.addError(opportunityOperatingHoursErrors.get(op.Id));
                    }
                    //Test/Testing
                    if(opportunityproductlineitemErrors.containsKey(op.Id)) {
                        op.addError(opportunityproductlineitemErrors.get(op.Id));
                    }
                }  
                
                if (Trigger.isUpdate && op.Pricebook2Id != oldRec.Pricebook2Id && op.Pricebook2Id != null && op.Pricebook2Id!=a.SalesPricebookId__c && custSetting.System_Administrator_Profile_Id__c!=loggedInUserProfileId && custSetting.Integration_User_Profile__c != loggedInUserProfileId) {
                    op.addError('Error: The pricebook cannot be changed except by a system administrator.');
                }
            }
        }
    }
}