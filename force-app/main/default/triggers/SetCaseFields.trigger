trigger SetCaseFields on Case (before insert, before update) {
    Field_Service_Settings__c fssettings = Field_Service_Settings__c.getOrgDefaults();
    List<Id> idListCLP = new List<Id>();
    Map<Id,Account> accMap = new Map<Id,Account>();
    Map<Id,Opportunity> oppMap = new Map<Id,Opportunity>();
    
    List<Opportunity> opUpdates = new List<Opportunity>();
    List<Site_Survey__c> ssUpdates = new List<Site_Survey__c>();
    Id coreListPriceRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Core List Pricing Change Request').getRecordTypeId();
    
    /*Database.DMLOptions dmlOptions = new Database.DMLOptions();
    dmlOptions.assignmentRuleHeader.useDefaultRule = false;*/
    
    for(Case c : Trigger.new) {
        System.debug(c.Opportunity__c);
        Case oldRec = (Trigger.isInsert ? new Case() : Trigger.oldMap.get(c.Id));
        
        //CPQCN-322 : Shashi 12/02/2020 : Core List Pricing Ticket request
        if(Trigger.isInsert){
            if(c.RecordTypeId == coreListPriceRecordTypeId){
                if(c.AccountId!=null){ idListCLP.add(c.AccountId); }
                if(c.CPQ2_Contract__c!=null){ idListCLP.add(c.CPQ2_Contract__c); }
            }
        }
        //End
 
        if(Trigger.isUpdate) {
            if(fssettings.Internal_Data_Review_Case_Record_Type_ID__c != null && 
               fssettings.Internal_Data_Review_Case_Record_Type_ID__c.equalsIgnoreCase(String.valueOf(c.RecordTypeId)) && 
               c.Status==fssettings.Internal_Case_Accepted_Status__c && 
               !oldRec.IsClosed && c.Type==fssettings.Case_Type_for_Internal_Data_Review__c) 
            {
                System.debug('Case ' + c.Opportunity__c);
                //Order cannot be empty only for Opportunity Record Type Additional Subcategories - Penetration 
                if(c.Modify_Existing_Order__c && c.Order__c==null && c.Opportunity_Record_Type_Id__c==fssettings.Opportunity_RecordType_Additional__c){
                    c.Order__c.addError('This Opportunity modifies an existing Order, fill in the Order to be modified before closing this ticket');
                }
                //Seasonality Requirements and Check ?
                if(c.Opportunity__c!=null) {
                    oppMap.put(c.Opportunity__c, null);
                }
            }
        }
    }
    
    //CPQCN-322 : Shashi 12/02/2020 : Core List Pricing Ticket request
    if(Trigger.isInsert){
        if(idListCLP.size()>0){
            List<Contract> contractList = [SELECT ID,AccountId FROM Contract 
                                           WHERE (AccountId IN:idListCLP OR Id IN:idListCLP) AND Status = 'Activated'];
            Map<Id,Id> mpIdId = new Map<Id,Id>();
            for(Contract ct:contractList){ 
                mpIdId.put(ct.AccountId,ct.Id); 
                mpIdId.put(ct.Id,ct.AccountId);
            }
            for(Case c : Trigger.new){
                if(c.RecordTypeId == coreListPriceRecordTypeId){
                   if(c.CPQ2_Contract__c==null){
                        if(mpIdId.containsKey(c.AccountId)){ 
                            c.CPQ2_Contract__c = mpIdId.get(c.AccountId);
                        }
                	}
                    if(c.AccountId==null){
                        if(mpIdId.containsKey(c.CPQ2_Contract__c)){ 
                            c.AccountId = mpIdId.get(c.CPQ2_Contract__c);
                        }
                	}
                }
            }
        }
    }
    //End
    
    oppMap = new Map<Id, Opportunity>([SELECT Id, AccountId, StageName, Name, Order__c, RecordTypeId, IsConverted__c FROM Opportunity WHERE Id IN :oppMap.keyset() 
                                   AND (StageName=:fssettings.Opportunity_Case_Creation_Stage_Name__c OR StageName=:fssettings.Opportunity_Frequency_Change_Stage_Name__c )]);
    
    System.debug(accMap);
    System.debug(oppMap);
    
    for(Case c : Trigger.new){
        Opportunity op = oppMap.get(c.Opportunity__c);
        System.debug('>>Before Closing the Case: ' + c);
        if(op!=null) {
            System.debug('Found Opportunity');    
            if(op.RecordTypeId==fssettings.Opportunity_RecordType_Frequency_Change__c) {
                opUpdates.add(new Opportunity(
                    Id = c.Opportunity__c,
                    StageName = fssettings.Opportunity_To_Order_Creation_Stage_Name__c, 
                    Order__c = c.Order__c //check if conditions as in line 55 are required. 
                    //IsCOnverted Change made for Opportunity Record Type Label Change
                    //IsConverted__c = TRUE
                ));
            } else {
                opUpdates.add(new Opportunity(
                    Id = c.Opportunity__c,
                    StageName = fssettings.Opportunity_To_Order_Creation_Stage_Name__c, 
                    Order__c = c.Order__c, //check if conditions as in line 55 are required. 
                    Is_Order_to_be_Emergency__c = c.Is_Pest_Emergency__c//21618 amendment
                ));
                if (c.Site_Survey__c != null) {
                    ssUpdates.add(new Site_Survey__c(
                        Id = c.Site_Survey__c,
                        Status__c = fssettings.Site_Survey_Reviewed_Status__c
                    ));
                }
            }
        }
    }
    
    if (!ssUpdates.isEmpty()) {
        update ssUpdates;
    }
    
    Map<Id, String> opportunityErrorMessages = new Map<Id, String>();
    System.debug('>>Case Trigger OpUpdates: ' + opUpdates);
    if (!opUpdates.isEmpty()) {
        Savepoint sp = Database.setSavepoint();
        try {
            update opUpdates;
        } catch(DmlException de) {
            for(Integer i=0; i<de.getNumDml(); i++) {
                System.debug('>>Dml Message: ' + i + ' ' + de.getDmlMessage(i) + ' RecordId ' + de.getDmlId(i));
                opportunityErrorMessages.put(de.getDmlId(i), de.getDmlMessage(i));
            }
            for(Case c : Trigger.new) {
                String errorMessage = opportunityErrorMessages.get(c.Opportunity__c);
                if(String.isNotBlank(errorMessage)) {
                    c.addError(Label.DML_Error_Message + ' ' + errorMessage); 
                }
            }
            Database.rollback(sp);
            System.debug('** Exception On Opportunity Closure ** ' + de.getLineNumber() + ' Message ' + de.getMessage());
        }
    }
}