/**
 * @FileName: OpportunityTriggerHandler
 * @Description: Consolidated Trigger Handler Class
 * @Author: Irfan Tarique
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Irfan Tarique     Oct 22, 2019    Added Validation For Inactive Products
 * Graeme Ward       Mar 18, 2020    Refactored trigger to resolve recursion issue, and code quality
 * Sidhartha		 Mar 11, 2021	 Commneted deleteChildSurveyAssetLocations() method in afterDelete() as there is no after
 * 									 Delete context in OpportunityTrigger
 * Sidhartha		 Mar 15, 2021	 UnCommneted deleteChildSurveyAssetLocations() method in afterDelete() and added after
 * 									 Delete context in OpportunityTrigger
 *-----------------------------------------------------------
 **/

public class OpportunityTriggerHandler extends TriggerHandler {
    private OpportunityTriggerDataWrapper dataWrapper;
    private List<Opportunity> opportunityRecords;
    private List<Opportunity> oldList;
    private Map<Id, Opportunity> opportunityMap;
    private Map<Id, Opportunity> oldMap;

    public OpportunityTriggerHandler() {
        opportunityRecords = Trigger.new;
        oldList = Trigger.old;
        opportunityMap = (Map<Id, Opportunity>) Trigger.newMap;
        oldMap = (Map<Id, Opportunity>) Trigger.oldMap;
        dataWrapper = new OpportunityTriggerDataWrapper(opportunityRecords, oldMap);
    }

    protected override void beforeInsert() {
        validateOpportunitiesBeforeInsert();
        setOpportunityFieldsBeforeInsert();
    }

    protected override void beforeUpdate() {
        System.debug('OpportunityTriggerHandler beforeUpdate before validateOpportunitiesBeforeUpdate soql limit : ' + Limits.getQueries());
        validateOpportunitiesBeforeUpdate();
        OpportunityValidationWrapper wrapper = new OpportunityValidationWrapper(opportunityRecords, oldMap, dataWrapper, opportunityMap);
        wrapper.validateIfOCRisPresent(opportunityRecords, oldMap);
        System.debug('OpportunityTriggerHandler beforeUpdate after validateOpportunitiesBeforeUpdate soql limit : ' + Limits.getQueries());

        System.debug('OpportunityTriggerHandler beforeUpdate before setOpportunityFieldsBeforeUpdate soql limit : ' + Limits.getQueries());
        setOpportunityFieldsBeforeUpdate();
        System.debug('OpportunityTriggerHandler beforeUpdate after setOpportunityFieldsBeforeUpdate soql limit : ' + Limits.getQueries());

        CPQ2_Service.setShipToScoreSignedAt(opportunityRecords, oldMap);
    }
    
    protected override void afterInsert(){
        system.debug('after insert');
        createOLiOnLeadConversion(opportunityRecords);
        
    }

    protected override void afterUpdate() {
        /* Ice Cube function - comment out for production SOQL fix - Feb 22nd, 2021
        System.debug('OpportunityTriggerHandler|afterUpdate|updateInsertBillToShipToAccounts|BEGIN');
        updateInsertBillToShipToAccounts();
        System.debug('OpportunityTriggerHandler|afterUpdate|updateInsertBillToShipToAccounts|END');
		*/
        
        System.debug('OpportunityTriggerHandler afterUpdate before createRelatedDataAfterUpdate soql limit : ' + Limits.getQueries());
        createRelatedDataAfterUpdate();
        System.debug('OpportunityTriggerHandler afterUpdate after createRelatedDataAfterUpdate soql limit : ' + Limits.getQueries());

        CPQ2_Service.approveThresholds(opportunityRecords, oldMap);
        CPQ2_Service.convertOpportunityCoreListPriceRequests(opportunityRecords, oldMap);
    }

    protected override void afterDelete() {
        System.debug('OpportunityTriggerHandler|afterDelete|isDeleteFunc|BEGIN');
        deleteChildSurveyAssetLocations();
        System.debug('OpportunityTriggerHandler|afterDelete|isDeleteFunc|END');
    }

    private void createOLiOnLeadConversion(List<Opportunity> opp){
       OpportunityCreateRelatedDataWrapper wrapper = new OpportunityCreateRelatedDataWrapper(opportunityRecords, oldMap, dataWrapper);
        wrapper.createOLiOnLeadConversion(opp);
    }
    private void setOpportunityFieldsBeforeInsert() {
        OpportunitySetFieldsWrapper wrapper = new OpportunitySetFieldsWrapper(opportunityRecords, oldMap, dataWrapper);
        wrapper.setOpportunityFieldsBeforeInsert();
    }

    private void validateOpportunitiesBeforeInsert() {
        OpportunityValidationWrapper wrapper = new OpportunityValidationWrapper(opportunityRecords, oldMap, dataWrapper);
        wrapper.validateOpportunitiesBeforeInsert();
    }

    private void setOpportunityFieldsBeforeUpdate() {
        OpportunitySetFieldsWrapper wrapper = new OpportunitySetFieldsWrapper(opportunityRecords, oldMap, dataWrapper);
        wrapper.setOpportunityFieldsBeforeUpdate();
    }

    private void validateOpportunitiesBeforeUpdate() {
        OpportunityValidationWrapper wrapper = new OpportunityValidationWrapper(opportunityRecords, oldMap, dataWrapper, opportunityMap);
        wrapper.validateOpportunitiesBeforeUpdate();
    }

    private void createRelatedDataAfterUpdate() {
        OpportunityCreateRelatedDataWrapper wrapper = new OpportunityCreateRelatedDataWrapper(opportunityRecords, oldMap, dataWrapper);
        wrapper.createRelatedDataAfterUpdate();
    }

    /* TODO: check if this can move to createRelatedDataOnUpdate - Ice Cube - comment out on Feb 22nd, 2021
    private void updateInsertBillToShipToAccounts() {
        new OpportunityBillToShipToWrapper(opportunityRecords, oldMap);
    }*/
	
    private void deleteChildSurveyAssetLocations() {
        Set<Id> idsToDelete = new Set<Id>();
        
        for (Opportunity o : oldList) {
            if (!o.isConverted__c) idsToDelete.add(o.Id);
        }

        /**
         * Creating audit record of Survey_Asset_Location__c deletion
         * @author Ahsan Butt 10/30/2018
		 */
        List<Survey_Asset_Location__c> surveyLocationsToDelete = [
            SELECT Id, Status__c, Originating_Parent_ID__c, Originating_Record_ID__c, Site_Survey__c
            FROM Survey_Asset_Location__c
            WHERE Originating_Parent_ID__c IN :idsToDelete
        ];
        
        List<Survey_Asset_Delete__c> surveyAssetDeletes = new List<Survey_Asset_Delete__c>();
        
        for (Survey_Asset_Location__c sal : surveyLocationsToDelete) {
            surveyAssetDeletes.add(OpportunityTriggerHelper.createSurveyAssetDeleteRecords(sal));
        }
        
        insert surveyAssetDeletes;
        delete surveyLocationsToDelete;
    }
}