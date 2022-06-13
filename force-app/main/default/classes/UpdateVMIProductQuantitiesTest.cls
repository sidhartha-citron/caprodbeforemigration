@isTest
public class UpdateVMIProductQuantitiesTest {
		@TestSetup static void setup() {
            Field_Service_Settings__c dataSets = new Field_Service_Settings__c(VMI_Product_Name__c = 'VMI Vendor Managed Inventory Service');
            insert dataSets;
            Account a = new Account(
                    Name='TestAccount',
                    AccPac_Account__c='1234-', 
                    A_P_Contact_Name__c='TestContactName', 
                    Credit_Check__c='Completed', 
                    Industry='Institutions', 
                    Industry_Code_Accpac__c='000-00 UNKNOWN', 
                    Invoice_Preference__c='Email',
                    Invoicing_Email_Address__c='Test@test.com', 
                    LEED_Customer__c='No', 
                    On_Hold__c=FALSE, 
                    Type='Customer', 
                    Phone='123456789',
                    Billing_Suite_Number__c='1', 
                    BillingStreet='Street', 
                    BillingCity = 'City', 
                    BillingState = 'State', 
                    BillingPostalCode = 'PostalCode',
                    BillingCountry = 'Country',
                    Shipping_Suite_Number__c = '1',
                    ShippingStreet = 'Street', 
                    ShippingCity = 'City', 
                    ShippingState = 'State', 
                    ShippingPostalCode = 'PostalCode', 
                    ShippingCountry = 'Country'
                );
            Account a2 = new Account(
                    Name='TestAccount2',
                    AccPac_Account__c='1234-2', 
                    A_P_Contact_Name__c='TestContactName2', 
                    Credit_Check__c='Completed', 
                    Industry='Institutions', 
                    Industry_Code_Accpac__c='000-002 UNKNOWN', 
                    Invoice_Preference__c='Email',
                    Invoicing_Email_Address__c='Test@test.com2', 
                    LEED_Customer__c='No', 
                    On_Hold__c=FALSE, 
                    Type='Customer', 
                    Phone='123456782',
                    Billing_Suite_Number__c='2', 
                    BillingStreet='Street2', 
                    BillingCity = 'City2', 
                    BillingState = 'State2', 
                    BillingPostalCode = '2PostalCode',
                    BillingCountry = 'Country2',
                    Shipping_Suite_Number__c = '12',
                    ShippingStreet = 'Street2', 
                    ShippingCity = 'City2', 
                    ShippingState = 'State2', 
                    ShippingPostalCode = '2PostalCode', 
                    ShippingCountry = 'Country2'
                );
            Product2 vmiprod = new Product2(Name='test', VMI_Product__c = true, IsActive = true,Item_Type__c = 'Consumables');
			Id pricebookId = Test.getStandardPricebookId();
            Product2 woliVMI = new Product2(Name='VMI Vendor Managed Inventory Service', IsActive = true,Item_Type__c = 'Consumables');
            List<Product2> prods = new List<Product2>();
            prods.add(vmiprod);
            prods.add(woliVMI);
            List<Account> accounts = new List<Account>();
            accounts.add(a);
            accounts.add(a2);
            insert accounts;
            WorkOrder wo = new WorkOrder(AccountId = a.Id, startDate = date.today() - 2, endDate = date.today() - 1, Pricebook2Id=pricebookId);
            WorkOrder wo2 = new WorkOrder(AccountId = a2.Id, startDate = date.today() - 4, endDate = date.today() - 3, Pricebook2Id=pricebookId);
            WorkOrder wo3 = new WorkOrder(AccountId = a2.Id, startDate = date.today() - 501, endDate = date.today() - 500, Pricebook2Id=pricebookId);
            insert prods;
            PriceBookEntry woliPBE = new PriceBookEntry(PriceBook2Id=pricebookId, Product2Id = woliVMI.Id, UnitPrice = 10, IsActive = true);
            PriceBookEntry PBE = new PriceBookEntry(PriceBook2Id=pricebookId, Product2Id = vmiprod.Id, UnitPrice = 10, IsActive = true);
            List<PriceBookEntry> PriceBookEntrys = new List<PriceBookEntry>();
            PriceBookEntrys.add(PBE);
            PriceBookEntrys.add(woliPBE);
            insert PriceBookEntrys;
            List<WorkOrder> wos = new List<WorkOrder>();
            wos.add(wo);
            wos.add(wo2);
            wos.add(wo3);
            insert wos;
            WorkOrderLineItem woli = new WorkOrderLineItem(PricebookEntryId = woliPBE.Id, WorkOrderId = wo.Id);
            WorkOrderLineItem woli2 = new WorkOrderLineItem(PricebookEntryId = woliPBE.Id, WorkOrderId = wo2.Id);
            ProductConsumed pc = new ProductConsumed(PricebookEntryId = PBE.Id, QuantityConsumed = 1, WorkOrderId = wo.Id);
            ProductConsumed pc2 = new ProductConsumed(PricebookEntryId = PBE.Id, QuantityConsumed = 1, WorkOrderId = wo2.Id);
            List<WorkOrderLineItem> wolis = new List<WorkOrderLineItem>();
            wolis.add(woli);
            wolis.add(woli2);
            insert wolis;
           	List<ProductConsumed> pcs = new List<ProductConsumed>();
            pcs.add(pc);
            pcs.add(pc2);
            insert pcs;
            VMI_Product__c vmiProdrec = new VMI_Product__c(Account__c = a.Id, Par_Level__c = 10, Product__c = vmiprod.Id, Quantity_Per_Visit__c = 9);
            VMI_Product__c vmiProdrec2 = new VMI_Product__c(Account__c = a2.Id, Par_Level__c = 10, Product__c = vmiprod.Id, Quantity_Per_Visit__c = 8);
            List<VMI_Product__c> vmiRecs = new List<VMI_Product__c>();
            vmiRecs.add(vmiProdrec);
            vmiRecs.add(vmiProdrec2);
            insert vmiRecs;
        }
        static testMethod void testVMIUpdate(){
            Database.executeBatch(new UpdateVMIProductQuantities());
        }
}