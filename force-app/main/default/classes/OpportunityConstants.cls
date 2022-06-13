/**
 * @FileName: OpportunityConstants
 * @Description: Constants for Opportunity related functionality
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       3/18/2020       Created
 *-----------------------------------------------------------  
 */
public inherited sharing class OpportunityConstants {
    public static final Set<String> PARENT_BILLIING_ADDRESS_FIELDS = new Set<String>{
            'Parent.BillingStreet',
            'Parent.BillingCity',
            'Parent.BillingCountry',
            'Parent.BillingPostalCode',
            'Parent.BillingState'
    };

    public static final Set<String> ACCOUNT_BILLING_ADDRESS_FIELDS = new Set<String>{
            'BillingStreet',
            'BillingCity',
            'BillingCountry',
            'BillingPostalCode',
            'BillingState'
    };

    public static final Set<String> ACCOUNT_SHIPPING_ADDRESS_FIELDS = new Set<String>{
            'ShippingStreet',
            'ShippingCity',
            'ShippingCountry',
            'ShippingPostalCode',
            'ShippingState'
    };

    public static final Set<Id> SIGNED_STAGE_ACCESSIBLE = new Set<Id>{
            QueryUtils.fieldServiceSettings.System_Administrator_Profile_Id__c,
            QueryUtils.fieldServiceSettings.Integration_User_Profile__c,
            QueryUtils.fieldServiceSettings.Customer_Service_Profile_Id__c
    };
}