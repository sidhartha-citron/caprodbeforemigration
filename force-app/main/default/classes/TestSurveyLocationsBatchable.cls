@isTest
public class TestSurveyLocationsBatchable {
    
    @TestSetup static void setup() {
        List<Product2> products = new List<Product2>();
        List<Survey_Asset_Location__c> surveyAssetLocations = new List<Survey_Asset_Location__c>();
        
        Id pBook = Test.getStandardPricebookId();
        Id devRecordTypeId = Schema.SObjectType.Order.getRecordTypeInfosByName().get('Regular Order').getRecordTypeId();
        Id caseRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Invoice Information').getRecordTypeId();
        
        Province_Time_Zones_Operating_Hours__c setting = new Province_Time_Zones_Operating_Hours__c();
        setting.Name = 'ON';
        setting.Province_Territory_Code__c = 'ON';
        setting.TimeZone__c = 'America/New_York';
        insert setting;
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c(Service_Start__c = 4);
        fssetting.Status_Value_for_Install_of_a_Product__c = 'Install';
        fssetting.Status_Value_for_Replace_of_a_Product__c = 'Replace';
        fssetting.Operating_Hours_Type_Account__c = 'Account Operating Hours';
        fssetting.Service_Start__c = 3;
        fssetting.Item_Type_of_Services__c='Service';
        fssetting.Hygiene_LOB__c = 'Hygiene';
        fssetting.Chemical_LOB__c = 'Chemical';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Life_Safety_LOB__c = 'Life Safety';
        fssetting.Work_Order_Completion_Status__c = 'Completed';
        fssetting.Scanned_In_Status__c = 'Installed';
        fssetting.Work_Order_Line_Item_Completed_Status__c = 'Completed';
        fssetting.DeInstall_Work_Order_Type__c = 'DeInstall';
        fssetting.Scanned_Out_Status__c = 'Remove';
        fssetting.Order_Active_Stage__c = 'Activated';
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Shopping_Cart_Order_Draft_Stage__c = 'Shopping Cart';
        fssetting.Work_Orders_In_Advance__c = 20;
        fssetting.Item_Type_of_Services__c='Service';
        fssetting.Emergency_Service_Start_Time__c = '4:30';
        fssetting.Emergency_Service_End_Time__c = '4:31';
        fssetting.System_Administrator_Profile_Id__c = UserInfo.getProfileId();
        fssetting.Regular_Order_Record_Type_Id__c = devRecordTypeId;
        insert fssetting;
        
        OperatingHours oh = new OperatingHours(
        	Name='TestHours', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        );
        insert new List<OperatingHours>{oh};
            
        TimeSlot testSlot = new TimeSlot(
        	DayOfWeek='Monday', 
            StartTime = Time.newInstance(07, 00, 00, 00), 
            EndTime = Time.newInstance(17, 00, 00, 00),
            OperatingHoursId = oh.Id
        );
        insert testSlot;
        
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
            Inactive__c=FALSE,
            Type='Customer', 
            Phone='123456789',
            OperatingHoursId = oh.Id,
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
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Name='Location'
        );
        insert location;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==0) ? 'Hygiene' : 'Pest Control', 
                    Item_Type__c= (i==0) ? 'Consumables' : 'Service',
                    ExternalId__c = 'test'+i
                )       
            );
        }
        
        insert products;
        
        for(Integer i=0; i<3; i++) {
            surveyAssetLocations.add(
                new Survey_Asset_Location__c(
                    Product__c=products.get(i).Id, 
                    Quantity__c=1, 
                    Site_Survey__c=ss.Id, 
                    Survey_Location__c = location.Id
                )
            );
        } 
        insert surveyAssetLocations;
    }
    
    static testMethod void testAllRecords() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        
        Test.startTest();
        
        SurveyLocationsBatchable testRun = new SurveyLocationsBatchable();
        Database.executeBatch(testRun);
        
        Test.stopTest();
    }
    
    static testMethod void testOneRecord() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        Account a = [SELECT Id, Site_Survey__c FROM Account WHERE Name='TestAccount' LIMIT 1].get(0);
        Survey_Location__c sl = [SELECT Id FROM Survey_Location__c WHERE Site_Survey__c= :a.Site_Survey__c LIMIT 1].get(0);
        
        Test.startTest();
        
        SurveyLocationsBatchable testRun = new SurveyLocationsBatchable(sl.Id);
        Database.executeBatch(testRun);
        
        Test.stopTest();
    }

}