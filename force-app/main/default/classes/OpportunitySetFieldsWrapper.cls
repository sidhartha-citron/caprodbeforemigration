/**
 * @FileName: OpportunitySetFieldsWrapper
 * @Description:
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       3/20/2020         Created
 * Darcy             5/18/2021         createCase allows for existing case to 
 *                                     be modified 'New' for frequency change
 *-----------------------------------------------------------------------------  
 */
public inherited sharing class OpportunitySetFieldsWrapper {
    // Trigger Data
    private List<Opportunity> opportunityRecords;
    private Map<Id, Opportunity> oldMap;
    private OpportunityTriggerDataWrapper dataWrapper;

    // DML Data
    private Map<Id, Site_Survey__c> siteSurveysByAccount;
    private List<Case> cases;

    public OpportunitySetFieldsWrapper(List<Opportunity> opportunityRecords, Map<Id,Opportunity> oldMap, OpportunityTriggerDataWrapper dataWrapper) {
        this.opportunityRecords = opportunityRecords;
        this.oldMap = oldMap;
        this.dataWrapper = dataWrapper;
    }

    // Controller Methods

    public void setOpportunityFieldsBeforeInsert() {
        instantiateInsertVariables();
        
       	//Feb 23, 2021
       	for(Opportunity opp : opportunityRecords) {
            Account a = dataWrapper.accountMap.get(opp.AccountId);

            if (a == null) continue;
            setPricebook(opp, a);
            createSiteSurveys(opp);
        }
        
       	/* Original - Feb 23, 2021
        for (Opportunity opp : opportunityRecords) {
            createSiteSurveys(opp);
        }*/

        insertSiteSurveys(siteSurveysByAccount);
    }

    public void setOpportunityFieldsBeforeUpdate() {
        instantiateUpdateVariables();
        Integer approvedTermScore;

        for (Opportunity opp : opportunityRecords) {
            Opportunity oldRec = oldMap.get(opp.Id);

            /*
            assign an approval score based on Contract Term in Years 
            to include with the Ship To Scorce approval formula
            1 - Requires Manager Approval , 2 - Requires Director Approval
            */
            switch on opp.Term_Length_Hygiene_PEST__c {
                when '1' {
                    opp.CPQ2_CTAS__c = 2;
                }
                when '2' {
                    opp.CPQ2_CTAS__c = 1;
                }
                when else {
                    opp.CPQ2_CTAS__c = 0;
                }
            }

            switch on opp.Contract_Term_Approved_At__c {
                when '1' {
                    approvedTermScore = 2;
                }
                when '2' {
                    approvedTermScore = 1;
                }
                when else {
                    approvedTermScore = 0;
                }
            }

            if (approvedTermScore >= opp.CPQ2_CTAS__c) {
                opp.CPQ2_CTAS__c = 0; //term was already approved
            }

            if (opp.StageName != oldRec.StageName) {
                setIsConvertedField(opp);
            }

            Case c = createCase(opp);
            if (c != null) cases.add(c);

            Account a = dataWrapper.accountMap.get(opp.AccountId);

            if (a != null) {
                setSiteSurvey(opp, a);
                setPricebook(opp, a);
            }
        }

        upsert cases;

        
    }

    // Constructor Helpers

    private void instantiateInsertVariables() {
        this.siteSurveysByAccount = new Map<Id, Site_Survey__c>();
    }

    private void instantiateUpdateVariables() {
        this.cases = new List<Case>();
    }

    // Helper Methods

    private void createSiteSurveys(Opportunity opp) {
        Account a = dataWrapper.accountMap.get(opp.AccountId);

        setSiteSurvey(opp, a);

        if(String.isNotBlank(opp.Site_Survey__c) || siteSurveysByAccount.containsKey(opp.AccountId)) return;

        siteSurveysByAccount.put(
                opp.AccountId,
                new Site_Survey__c(
                        Account__c = opp.AccountId,
                        Survey_Date__c = System.today(),
                        Status__c = 'Draft'
                )
        );
    }

    private void insertSiteSurveys(Map<Id, Site_Survey__c> siteSurveysByAccount) {
        upsert siteSurveysByAccount.values();

        Map<Id,Account> accountsToUpdate = new Map<Id,Account>();

        for (Opportunity opp : opportunityRecords) {
            Site_Survey__c ss = siteSurveysByAccount.get(opp.AccountId);

            if (ss == null) continue;

            opp.Site_Survey__c = ss.Id;
            accountsToUpdate.put(opp.AccountId, new Account(Id = opp.AccountId, Site_Survey__c = ss.Id));
        }

        update accountsToUpdate.values();
    }

    private void setIsConvertedField(Opportunity opp) {
        if (opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_To_Order_Creation_Stage_Name__c
                && !opp.isConverted__c)
        {
            opp.isConverted__c = true;
            
            //2021-03-15 removed field update in WF 
            opp.CloseDate = System.today();
        }
    }

    private Case createCase(Opportunity opp) {
        Case c;
        Opportunity oldRec = oldMap.get(opp.Id);

        // get Opportunity record with related data
        Opportunity oppComplete = dataWrapper.opportunityMap.get(opp.Id);

        Quote oppQuote = !oppComplete.Quotes.isEmpty() ? oppComplete.Quotes.get(0) : null;

        String productFamilies = OpportunityTriggerHelper.getProductFamilies(oppComplete);

        if ((opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_Frequency_Change_Stage_Name__c
                || opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_Case_Creation_Stage_Name__c)
                && opp.StageName != oldRec.StageName
                && !opp.isConverted__c
                && !opp.Case_Created__c)
        {
            String subject = opp.Name;

            if (opp.RecordTypeId == QueryUtils.fieldServiceSettings.Opportunity_RecordType_Frequency_Change__c) {
                subject += ' - Awaiting Frequency Change';
            } else {
                subject += ' - Awaiting Survey Approval';
            }

            c = new Case(
                    Subject = subject,
                    RecordTypeId = QueryUtils.fieldServiceSettings.Internal_Data_Review_Case_Record_Type_ID__c,
                    AccountId = opp.AccountId,
                    Opportunity__c = opp.Id,
                    Site_Survey__c = opp.Site_Survey__c,
                    Type = QueryUtils.fieldServiceSettings.Case_Type_for_Internal_Data_Review__c,
                    Modify_Existing_Order__c = opp.RecordTypeId == QueryUtils.fieldServiceSettings.Opportunity_RecordType_Additional__c,
                    Modify_Seasonal_Order__c = opp.Seasonal_Requirements__c,
                    OwnerId = OpportunityTriggerHelper.getOwnerId(opp, productFamilies),
                    Lines_of_Business__c = productFamilies,
                    ContactId = OpportunityTriggerHelper.getContactId(oppComplete, oppQuote),
                    Status = 'New'
            );

            opp.Case_Created__c = true;
        }
        else if (opp.Case_Created__c
                && opp.StageName != oldRec.StageName
                && (opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_Case_Creation_Stage_Name__c
                || opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_Frequency_Change_Stage_Name__c))
        {
            c = dataWrapper.caseByOpportunityId.get(opp.Id);
            c.OwnerId = OpportunityTriggerHelper.getOwnerId(opp, productFamilies);
            c.Lines_of_Business__c = productFamilies;
            c.ContactId = OpportunityTriggerHelper.getContactId(oppComplete, oppQuote);
            c.Status = 'New';
        }
        
        return c;
    }

    private void setSiteSurvey(Opportunity opp, Account a) {
        if (a.Site_Survey__c != null
                && a.Site_Survey__c != opp.Site_Survey__c)
        {
            opp.Site_Survey__c = a.Site_Survey__c;
        }
    }

    private void setPricebook(Opportunity opp, Account a) {
        if (opp.Pricebook2Id == null) {
            opp.Pricebook2Id = a.SalesPricebookId__c;
        }
    }
}