/**
 * @FileName: OpportunityValidationWrapper
 * @Description: Wrapper class for validating opportunity records and related data
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       3/18/2020         Created
 * Sidhartha		 04/21/2021		   Moved validateAccount() logic to validation rule
 * Darcy             5/5/2021          Bugfix in validateOpportunitiesBeforeUpdate for Existing Service Subcategory record type
 * Darcy             6/21/2021         validation for contact role, inactive products and invalid freq bypassed for System Administrator profile 
 *                                     replaced error message strings with custom labels
 *-----------------------------------------------------------  
 * 
 */
public inherited sharing class OpportunityValidationWrapper {
    // Trigger Data
    private List<Opportunity> opportunityRecords;
    private Map<Id, Opportunity> oldMap;
    private Map<Id, Opportunity> opportunityMap;
    private OpportunityTriggerDataWrapper dataWrapper;

    // Comparison Data
    private Set<Id> siteSurveyErrors;
    private Set<Id> accountIds;

    public OpportunityValidationWrapper(List<Opportunity> opportunityRecords, Map<Id, Opportunity> oldMap, OpportunityTriggerDataWrapper dataWrapper) {
        this(opportunityRecords, oldMap, dataWrapper, null);
    }

    public OpportunityValidationWrapper(List<Opportunity> opportunityRecords, Map<Id, Opportunity> oldMap, OpportunityTriggerDataWrapper dataWrapper, Map<Id,Opportunity> opportunityMap) {
        this.opportunityRecords = opportunityRecords;
        this.oldMap = oldMap;
        this.opportunityMap = opportunityMap;
        this.dataWrapper = dataWrapper;

        this.siteSurveyErrors = new Set<Id>();
        this.accountIds = new Set<Id>();
    }

    // Controller Methods

    public void validateOpportunitiesBeforeInsert() {
        TriggerHelper.checkIfInsert = true;
        for (Opportunity opp : opportunityRecords) {
            if(opp.RecordTypeId != QueryUtils.fieldServiceSettings.Opportunity_RecordType_Frequency_Change__c) {
                if (opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_To_Order_Creation_Stage_Name__c) {
                    validateClosedWonStage(opp);
                    validateSiteSurvey(opp);
                }
            }
            else {
                checkOrderCreationStage(opp);
            }
        }

        for(Opportunity opp : opportunityRecords) {
            Account a = dataWrapper.accountMap.get(opp.AccountId);

            if (a == null) continue;

            //validateAccount(opp, a);
        }
    }
    
    
    List<OpportunityContactRole> lstOcr = new  List<OpportunityContactRole>();
    Boolean checkEmptyRole = false;
    public void validateIfOCRisPresent(List<Opportunity> opportunityRecords, Map<Id, Opportunity> oldMap) {
        if(QueryUtils.fieldServiceSettings.System_Administrator_Profile_Id__c == UserInfo.getProfileId()){
        	return;
        }
        for(OpportunityContactRole ocr: [SELECT Id, Role FROM OpportunityContactRole WHERE OpportunityId IN :opportunityRecords]) {
            lstOcr.add(ocr);
            If(ocr.Role == null) {
                checkEmptyRole = true;
            }
        }
        if(lstOcr.size() == 0 || checkEmptyRole) {
            for (Opportunity opp : opportunityRecords) { 
                //Darcy 2021-05-27 exception for ownership changes
               	Opportunity oldRec = oldMap.get(opp.Id);
            	Boolean ownerChange = opp.OwnerId != oldRec.OwnerId;
                if(!TriggerHelper.checkIfInsert && !ownerChange)
                    opp.addError(Label.OCREmptyCheck);
            }
        }
    }

    public void validateOpportunitiesBeforeUpdate() {
        for (Opportunity opp : opportunityRecords) {
            Opportunity oldRec = oldMap.get(opp.Id);

            Boolean stageChange = opp.StageName != oldRec.StageName;

            if(QueryUtils.fieldServiceSettings.System_Administrator_Profile_Id__c != UserInfo.getProfileId()){
                checkForInactiveLineItems(opp);

                if(stageChange) {
                    checkPrimaryContact(opp);
                    validateLineItemFrequency(opp);
                }
            }

            if (opp.RecordTypeId != QueryUtils.fieldServiceSettings.Opportunity_RecordType_Frequency_Change__c) {
                if(stageChange) {
                    if (opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_To_Order_Creation_Stage_Name__c) {
                        validateClosedWonStage(opp);

                        if(oldRec.StageName != QueryUtils.fieldServiceSettings.Opportunity_Case_Creation_Stage_Name__c) {
                            validateSiteSurveyApproval(opp);
                        }

                        validateSiteSurvey(opp);
                    }
                }
            }
            else if (oldRec.StageName != QueryUtils.fieldServiceSettings.Opportunity_Frequency_Change_Stage_Name__c
                    && oldRec.StageName != QueryUtils.fieldServiceSettings.Opportunity_To_Order_Creation_Stage_Name__c) {
                //Darcy 2021-05-05 previously signed opp will not trigger the checkOrderCreationStage validation for Freq Change Stage name 
                checkOrderCreationStage(opp);
            }
        }

        checkSiteSurveyErrors(siteSurveyErrors);

        for(Opportunity opp : opportunityRecords) {
            Account a = dataWrapper.accountMap.get(opp.AccountId);

            if (a == null) continue;

            Opportunity oldRec = oldMap.get(opp.Id);


            if(opp.Pricebook2Id != oldRec.Pricebook2Id) {
                validatePricebookChange(opp, a);
            }
        }
    }

    // Constructor Helpers

    private void instantiateInsertVariables() {}
    private void instantiateUpdateVariables() {}

    // Helper Methods

    private void checkForInactiveLineItems(Opportunity opp) {
        Opportunity oppComplete = dataWrapper.opportunityMap.get(opp.Id);

        if(oppComplete.OpportunityLineItems.isEmpty()) return;

        if (checkLineItems(oppComplete)) {
            opp.addError(System.Label.Inactive_Products);
        }
    }

    //Deactivated Products Validation Rule - Irfan - 22-Oct-2019
    private Boolean checkLineItems(Opportunity opp) {
        for (OpportunityLineItem oppLineItem : opp.OpportunityLineItems) {
            if (!oppLineItem.Product2.IsActive
                    || (oppLineItem.Related_Product__c != null
                        && !oppLineItem.Related_Product__r.IsActive))
            {
                return true;
            }
        }

        return false;
    }

    private void checkPrimaryContact(Opportunity opp) {
        if (opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_Case_Creation_Stage_Name__c
                || opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_Frequency_Change_Stage_Name__c) {        
            if(dataWrapper.opportunityMap.get(opp.Id).OpportunityContactRoles.isEmpty()) {
                //Please associate at least one contact from this ship-to account to the
                //Contact Roles Related List and mark them as primary,
                //before moving to one of the closed won stages
                String error = System.Label.Contact_Role_Missing;

                opp.addError(error);
            }

            siteSurveyErrors.add(opp.Id);
        }
    }

    private void checkOrderCreationStage(Opportunity opp) {
        system.debug('Opportunity_To_Order_Creation_Stage_Name__c ' + opp.StageName);
        if (opp.StageName != QueryUtils.fieldServiceSettings.Opportunity_To_Order_Creation_Stage_Name__c) return;

        String error = 'Please choose the stage: ' +
                QueryUtils.fieldServiceSettings.Opportunity_Frequency_Change_Stage_Name__c +
                ' to indicate that Opportunity is closed won';

        opp.addError(error);
    }

    private void validateClosedWonStage(Opportunity opp) {
        if (OpportunityConstants.SIGNED_STAGE_ACCESSIBLE.contains(UserInfo.getProfileId())) return;

        String error = 'Please use Closed/Won Stage: ' +
                QueryUtils.fieldServiceSettings.Opportunity_Case_Creation_Stage_Name__c +
                ' to indicate Opportunity is Closed/Won';

        opp.addError(error);
    }

    private void validateSiteSurveyApproval(Opportunity opp) {
        String error = 'You cannot choose ' +
                QueryUtils.fieldServiceSettings.Opportunity_To_Order_Creation_Stage_Name__c +
                ' stage without undergoing Site Survey Approval Process. Choose stage ' +
                QueryUtils.fieldServiceSettings.Opportunity_Case_Creation_Stage_Name__c +
                ' to submit for Site Survey Approval';

        opp.addError(error);
    }


    private void validateSiteSurvey(Opportunity opp) {
        if (opp.StageName != QueryUtils.fieldServiceSettings.Opportunity_Case_Creation_Stage_Name__c
                || opp.Site_Survey__c != null)
        {
        	return;
        }
        String error = System.Label.Site_Survey_Missing;
        opp.addError(error);
    }

    private void checkSiteSurveyErrors(Set<Id> oppIds) {
        List<AggregateResult> results = [
                SELECT COUNT(Id) c, Originating_Parent_ID__c opp
                FROM Survey_Asset_Location__c
                WHERE Originating_Parent_ID__c != NULL
                AND Originating_Parent_ID__c IN :oppIds
                AND Status__c = 'Unallocated'
                GROUP BY Originating_Parent_ID__c
        ];

        for (AggregateResult a : results) {

            String error = String.format(System.Label.Site_Survey_Incomplete, new List<String>{String.valueOf(a.get('c'))});
            /*
            'There are ' +
            String.valueOf(a.get('c')) +
            ' Survey Asset Locations that are unallocated for this Opportunity. ' +
            'Please allocate these items before selecting this Stage.';
            */
            opportunityMap.get(String.valueOf(a.get('opp'))).addError(error);
        }
    }

    private void validateLineItemFrequency(Opportunity opp) {
        Opportunity oppComplete = dataWrapper.opportunityMap.get(opp.Id);

        Integer count = 0;

        for(OpportunityLineItem oli : oppComplete.OpportunityLineItems) {
            if(String.isBlank(oli.Service_Frequency__c)) count++;
        }

        if(count > 0) {
            opp.addError(String.format(System.Label.OLI_Missing_Frequency, new List<String>{String.valueOf(count)}));
                /*'There are ' +
                    count +
                    ' Opportunity Line Items with no Frequency. ' +
                    'Please fill in frequency for all line items before selecting this stage. '
                */
        }
    }

    private void validatePricebookChange(Opportunity opp, Account a) {
        if (opp.Pricebook2Id != null
                && opp.Pricebook2Id != a.SalesPricebookId__c
                && QueryUtils.fieldServiceSettings.System_Administrator_Profile_Id__c != UserInfo.getProfileId()
                && QueryUtils.fieldServiceSettings.Integration_User_Profile__c != UserInfo.getProfileId())
        {
            opp.addError(System.Label.Pricebook_Cannot_Be_Changed);
        }
    }
}