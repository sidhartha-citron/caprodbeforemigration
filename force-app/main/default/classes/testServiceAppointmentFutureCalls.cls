@isTest//(SeeAllData=true)
public class testServiceAppointmentFutureCalls {
    
    static testMethod void testFutureCalls() {
        Field_Service_Settings__c datasets = new Field_Service_Settings__c(ServiceReportTemplateId__c='00X2C000000M6czUAC', Org_Wide_Email_Address__c='0D22C0000008OiISAU');
        Id pBook = Test.getStandardPricebookId();
        OperatingHours oh = new OperatingHours(
            Name='TestHours', 
            Operating_Hours_Type__c='Account Operating Hours', 
            TimeZone='America/New_York'
        );
        insert oh;
        ServiceTerritory st = new ServiceTerritory(
            IsActive=TRUE,
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country', 
            OperatingHoursId=oh.Id, 
            Name='TerritoryForCaseTestScenarios'
        );
        insert st;
        Account a = new Account(
            Name='TestAccount', 
            AccPac_Account__c='223412-', 
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
            //OperatingHoursId = oh.Id,
            //Service_Territory__c = st.Id,
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
        WorkOrder testWorkOrder = new WorkOrder(
            AccountId=a.Id,
            StartDate=System.today(), 
            Line_of_Business__c='Hygiene', 
            Pricebook2Id=pBook, 
            Suite_Number__c='1', 
            Street='Street', 
            City = 'City', 
            State = 'State', 
            PostalCode = 'PostalCode',
            Country = 'Country'
        );
        insert testWorkOrder;
        ServiceAppointment testSA = new ServiceAppointment(
            ParentRecordId=testWorkOrder.Id, 
            DueDate=System.today().addDays(2), 
            EarliestStartTime=System.today().addDays(-1), 
            Status='New', 
            ServiceTerritoryId=testWorkOrder.ServiceTerritoryId
        );
        insert testSA;
        Contact cnt = new Contact(
            lastName='test',
            AccountId = a.Id
        );
        insert cnt;
        Set<String> saIds = new set<String>();
        Set<Id> saFutureIds = new Set<Id>();
        Set<Id> woIds = new set<Id>();
        woIds.add(testWorkOrder.Id);
        saIds.add(testSA.Id);
        saFutureIds.add(testSA.Id);
        //ServiceAppointmentFutureCalls.statusSyncMethod(saIds);
        //ServiceAppointmentFutureCalls.lastInFlightDateUpdates(woIds);
        Test.setMock(HttpCalloutMock.class, new ExampleCalloutMock(testSA.Id));
        
        Test.startTest();
        
        ServiceAppointmentFutureCalls.createSendServiceReport(saFutureIds, woIds, UserInfo.getSessionId());
        
        Test.stopTest();
        
        //ServiceAppointmentFutureCalls.createServiceReport(datasets.HygieneDetailedReportingId__c, testSA.Id, userinfo.getSessionId(), cnt.Id, datasets.ServiceReportTemplateId__c, datasets.CitronDoNotReply__c, true);
        //ServiceAppointmentFutureCalls.createServiceReport(datasets.HygieneDetailedReportingId__c, testSA.Id, userinfo.getSessionId(), null, datasets.ServiceReportTemplateId__c, datasets.CitronDoNotReply__c, true);
    }
    
    public class ExampleCalloutMock implements HttpCalloutMock{
        private Id saId;
        
        public ExampleCalloutMock(Id saId) {
            this.saId = saId;
        }
        
        public HttpResponse respond(HTTPRequest req){
            /*ServiceReport sr = [SELECT Id FROM ServiceReport LIMIT 1];
            HttpResponse res = new HttpResponse();
            res.setStatus('OK');
            res.setStatusCode(200);
            res.setBody('"serviceReportId":"' + sr.Id + '","contentVersionId"');
            return res;*/
            
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json;charset=UTF-8');
            res.setBody('{"example":"test", "contentVersionId":"' + saId + '","entityId":"' + saId + '"}');
            res.setStatusCode(200);
            return res;
        }
    }
}