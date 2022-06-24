@isTest
public class TestSiteSurveyVMIController {
    
	static testMethod void testVMI() {
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
        insert a;
        Site_Survey__c ss = new Site_Survey__c(
                    Account__c=a.Id, 
                    Survey_Date__c = System.today(),
                    Status__c = 'Draft'
                );
        insert ss;
		Product2 prd = new Product2(name='testProd', VMI_Product__c = true);
		insert prd;        
        VMI_Product__c vmi = new VMI_Product__c(Par_Level__c = 1, Notes__c='test', Account__c=a.Id, Product__c = prd.Id);
        insert vmi;
        List<VMI_Product__c> vmiProds = SiteSurveyVMIController.getVMIProducts(ss.Id);
        SiteSurveyVMIController.saveNewProduct(vmi);
        List<SiteSurveyVMIController.vmiFlaggedProduct> vmiflagged = SiteSurveyVMIController.getVMIFlaggedProducts(vmiProds);
        SiteSurveyVMIController.deleteSingleVMI(vmi);
        List<String> cols = new List<String>{'VMI_Product__c.Product__c'};
        SiteSurveyVMIController.getColumns(cols); 
        SiteSurveyVMIController.saveNewVMIProduct(JSON.serialize(vmiflagged), vmiProds, ss.Id);
    }
}