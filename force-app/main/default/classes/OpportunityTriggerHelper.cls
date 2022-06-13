/**
* @FileName: OpportunityTriggerHelper
* @Description: Helper methods for the Opportunity Trigger
* @Author: Graeme Ward
* @ModificationLog:
*-----------------------------------------------------------
* Author            Date            Modification
* Graeme Ward       3/20/2020         Created
* 
*-----------------------------------------------------------  
*/
public inherited sharing class OpportunityTriggerHelper {
    
    public static String getProductFamilies(Opportunity opp) {
        Set<String> families = new Set<String>();
        
        for (OpportunityLineItem ol : opp.OpportunityLineItems) {
            families.add(ol.Line_of_Business__c);
        }
        
        List<String> productFamilies = new List<String>(families);
        
        return String.join(productFamilies, ';');
    }
    
    public static Id getContactId(Opportunity opp, Quote oppQuote) {
        Id contactId;
        
        if (opp.OpportunityContactRoles.isEmpty()) {
            if (opp.SyncedQuoteId == null) {
                if (oppQuote == null) {
                    contactId = null;
                }
                else {
                    contactId = oppQuote.ContactId;
                }
            }
            else {
                contactId = opp.SyncedQuote.ContactId;
            }
        }
        else {
            contactId = opp.OpportunityContactRoles[0].ContactId;
        }
        
        return contactId;
    }
    
    public static String getOwnerId(Opportunity opp, String productFamilies) {
        Id ownerId;
        system.debug('opp ownerId ' + opp.RecordTypeId);
        if(opp.RecordTypeId == QueryUtils.fieldServiceSettings.Opportunity_RecordType_Frequency_Change__c) {
            ownerId = QueryUtils.fieldServiceSettings.Customer_Service_Queue__c;
            system.debug('case ownerId ' + ownerId);
        }
        else if (productFamilies.contains('Pest Control')) {
            ownerId = QueryUtils.fieldServiceSettings.Pest_Site_Survey_Approval_Queue__c;
            system.debug('case ownerId ' + ownerId);
        }
        else {
            ownerId = QueryUtils.fieldServiceSettings.Hygiene_Site_Survey_Approval_Queue__c;
            system.debug('case ownerId ' + ownerId);
        }
        
        return ownerId;
    }
    
    public static Survey_Asset_Delete__c createSurveyAssetDeleteRecords(Survey_Asset_Location__c sal) {
        return new Survey_Asset_Delete__c(
            Survey_Asset_Location_Id__c = sal.Id,
            Deletion_Reason__c = 'Opportunity Deleted',
            Deleted_By__c = UserInfo.getUserId(),
            Site_Survey__c = sal.Site_Survey__c,
            Originating_Parent_ID__c = sal.Originating_Parent_ID__c,
            Originating_Record_ID__c = sal.Originating_Record_ID__c
        );
    }
}