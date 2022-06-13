/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 02-22-2021
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
 * Modifications Log 
 * Ver   Date         Author                               Modification
 * 1.0   02-22-2021   ChangeMeIn@UserSettingsUnder.SFDoc   Initial Version
**/
@isTest
public class ProductConsumedTriggerHandlerTest1 {
    @TestSetup static void setup() {
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        
        TestDataFactory.crtOperatingHrs();
        TestDataFactory.crtSrvTerritory();
        //TestDataFactory.crtTimeZoneSettings();
        //TestDataFactory.crtFieldServiceSetting();
        TestDataFactory.crtFieldSettings();
        TestDataFactory.fssetting.Item_Type_of_Services__c = 'Service';
        TestDataFactory.fssetting.Hygiene_LOB__c = 'Hygiene';
        TestDataFactory.fssetting.Chemical_LOB__c = 'Chemical';
        update TestDataFactory.fssetting;
        
        //TestDataFactory.crtProspectAcctContact(1, 1);
        TestDataFactory.crtAcctContact(1,1);
        TestDataFactory.crtProdWithPE(1);
        TestDataFactory.crtWrkOrdersLines(1, 1);
    }
    
    static testMethod void setProductConsumedFieldsTest() {
        List<Account> accounts = [SELECT Id FROM Account];
        List<PriceBookEntry> priceBookEntries = [SELECT Id, Product2Id FROM PriceBookEntry];
        List<WorkOrderLineItem> workOrderLineItems = [SELECT Id, WorkOrderId FROM WorkOrderLineItem];
        List<Product2> products = [SELECT Id, Family FROM Product2];
        
        ProductConsumed testProdConsumed = new ProductConsumed(
            PricebookEntryId = priceBookEntries[0].Id, 
            QuantityConsumed = 1,
            WorkOrderId = workOrderLineItems[0].WorkOrderId,
            WorkOrderLineItemId = workOrderLineItems[0].Id
        );
        insert testProdConsumed;
        
        ProductConsumed validateProdConsumed = [SELECT Id, Billable__c FROM ProductConsumed];
        System.assertEquals(validateProdConsumed.Billable__c, False);
        //2021-02-22 Darcy: Ice Cube logic removed 
        /*
        products[0].Family = 'Chemical';
        update products;
        update testProdConsumed;
        
        validateProdConsumed = [SELECT Id, Billable__c FROM ProductConsumed];
        System.assertEquals(validateProdConsumed.Billable__c, False);
        
        Asset asset = new Asset();
        asset.Name = 'Asset';
        asset.AccountId = accounts[0].Id;
        asset.Product2Id = products[0].Id;
        
        insert asset;
        
        workOrderLineItems[0].AssetId = asset.Id;
        update workOrderLineItems;
        update testProdConsumed;
        
        validateProdConsumed = [SELECT Id, Billable__c FROM ProductConsumed];
        System.assertEquals(validateProdConsumed.Billable__c, False);
        
        asset.Asset_Ownership__c = 'Citron';
        update asset;
        update testProdConsumed;
        
        validateProdConsumed = [SELECT Id, Billable__c FROM ProductConsumed];
        System.assertEquals(validateProdConsumed.Billable__c, False);
        
        asset.Asset_Ownership__c = 'Customer';
        update asset;
        update testProdConsumed;
        
        validateProdConsumed = [SELECT Id, Billable__c FROM ProductConsumed];
        System.assertEquals(validateProdConsumed.Billable__c, True);
        */
        products[0].Item_Type__c = 'Service';
        update products;
        try {
            update testProdConsumed;
        }
        catch(Exception ex) {
            System.assertEquals(True, ex.getMessage().contains('Service cannot be added!!!'));
        }        
    }
}