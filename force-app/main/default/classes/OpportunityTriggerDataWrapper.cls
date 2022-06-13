/**
 * @FileName: OpportunityTriggerDataWrapper
 * @Description:
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       3/20/2020         Created
 * Darcy             5/18/2021         caseByOpportunityId now returns existing
 *                                     case for frequency change
 *----------------------------------------------------------------------------- 
 */
public inherited sharing class OpportunityTriggerDataWrapper {
    // Trigger Data
    private List<Opportunity> opportunityRecords;
    private Map<Id, Opportunity> oldMap;

    public OpportunityTriggerDataWrapper(List<Opportunity> opportunityRecords, Map<Id,Opportunity> oldMap) {
        this.opportunityRecords = opportunityRecords;
        this.oldMap = oldMap;
    }

    public Map<Id,Opportunity> opportunityMap {get {
        if (opportunityMap == null) {
            opportunityMap = new Map<Id, Opportunity>([
                    SELECT Id, Name, AccountId, OwnerId, SyncedQuoteId, SyncedQuote.ContactId, CloseDate, Site_Survey__c,
                            PO_Number__c, PO_Expiry_Date__c, Seasonal_Requirements__c, Description, Community_Contact__c,
                            Community_Contact__r.Email, Community_Contact__r.FirstName, Community_Contact__r.LastName,
                            Account.OperatingHours.TimeZone, Account.ServicePricebookId__c, Account.Invoice_Frequency__c,RecordTypeId,
                            Is_Order_to_be_Emergency__c, Order__c, Order__r.Id, Order__r.EffectiveDate, Order__r.EndDate,
                            Order__r.Status, Order__r.RecordTypeId, Order__r.OpportunityId, StageName, isConverted__c, CPQ2_HC__c,
                        (SELECT Id, ContactId
                        FROM OpportunityContactRoles
                        WHERE IsPrimary = TRUE),
                        (SELECT Id, Line_of_Business__c, Product2.IsActive, Product2.isConsumable__c, PricebookEntryId,
                                Quantity, UnitPrice, Service_Frequency__c, Service_Price_Per_Unit__c,
                                Opportunity.Account.ServicePricebookId__c, OpportunityId, Installation_Price__c,
                                Purchase_Price__c, Description, Category_Description__c, isPurchaseOnly__c,
                                Installation_Status__c, Installation_Notes__c, Service_Notes__c,Related_Product__c,
                                Related_Product__r.IsActive
                        FROM OpportunityLineItems),
                        (SELECT Id, ContactId
                        FROM Quotes
                        WHERE Status = 'Accepted'
                        ORDER BY QuoteNumber DESC
                        LIMIT 1)
                    FROM Opportunity
                    WHERE Id IN :opportunityRecords
            ]);
        }

        return opportunityMap;
    } set;}

    public Map<Id, Case> caseByOpportunityId {get {
        if (caseByOpportunityId == null) {
            caseByOpportunityId = new Map<Id, Case>();

            Set<Id> oppIds = new Set<Id>();

            for(Opportunity opp : opportunityRecords) {
                Opportunity oldRec = oldMap.get(opp.Id);
                
                if (opp.Case_Created__c
                    && opp.StageName != oldRec.StageName
                    && (opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_Case_Creation_Stage_Name__c
                    || opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_Frequency_Change_Stage_Name__c))
                {
                    oppIds.add(opp.Id);
                }
            }

            List<Case> cases = [SELECT Id, Status, OwnerId, Opportunity__c FROM Case WHERE Opportunity__c = :oppIds];

            for (Case c : cases) {
                caseByOpportunityId.put(c.Opportunity__c, c);
            }
        }

        return caseByOpportunityId;
    } set;}


    public Map<Id, Account> accountMap {get {
        if (accountMap == null) {
            Set<Id> accountIds = ApexUtils.getIdsFromField(opportunityRecords, 'AccountId');

            accountMap = new Map<Id, Account>([
                    SELECT Id, Billing_Suite_Number__c, BillingStreet, BillingCity, BillingState, BillingPostalCode,
                            BillingCountry, Shipping_Suite_Number__c, ShippingStreet, ShippingCity, ShippingState,
                            ShippingPostalCode, ShippingCountry, Site_Survey__c, ParentId, Parent.Billing_Suite_Number__c,
                            Parent.BillingStreet, Parent.BillingCity, Parent.BillingState, Parent.BillingPostalCode,
                            Parent.BillingCountry, Parent.Shipping_Suite_Number__c, Parent.ShippingStreet,
                            Parent.ShippingCity, Parent.ShippingState, Parent.ShippingPostalCode, Parent.ShippingCountry,
                            OperatingHoursId, Service_Territory__c, SalesPricebookId__c
                    FROM Account
                    WHERE Id IN :accountIds
            ]);
        }

        return accountMap;
    } set;}
}