@isTest
public class TestStockSummary {
    
    static testMethod void testNotGrouped() {
        FSL.GlobalAPIS.addStatusTransition('New','Scheduled');
        FSL.GlobalAPIS.addStatusTransition('Scheduled','Dispatched');
        
        TestDataFactory.crtFieldSettings();
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        
        TestDataFactory.crtAcctContact(1, 0); 
        Account a = TestDataFactory.accounts.get(0); 
        a.OperatingHoursId = TestDataFactory.opthours[1].Id;
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
        update a;            
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene',
                    ExternalId__c = '3-55-7-02-1' + i
                )       
            );
        }
        products.add( new Product2(Name = fssetting.VMI_Product_Name__c, Allowable_Frequencies__c='One-Time;Monthly;Weekly', IsActive=TRUE, Available_As_Related_Product__c=TRUE, Family= 'Pest Control', ExternalId__c = 'test', VMI_Product__c = true));
        insert products;
        
        for(Integer i=0; i<5; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id=pBook, 
                    Product2Id=products.get(i).Id, 
                    UnitPrice=1.0, 
                    IsActive=TRUE
                )
            );
        }
        pEntries.add( new PricebookEntry(Pricebook2Id=pBook, Product2Id=products.get(5).Id, UnitPrice=1.0, IsActive=TRUE));
        insert pEntries; 
        
        User newUser = new User(
            Alias = 'testAB', 
            Email = 'testAB@UserTechnicianForTest.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'testAB1',
            LastName = 'testAB2', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testAB@UserTechnicianForTest.com', 
            Employee_Number__c = 'testAB12344'
        );
        insert newUser;
        
        
            
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
            
            WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
                WorkOrderId=testWorkOrder.Id, 
                Type_of_Service__c='Service', 
                QUantity=1,
                PricebookEntryId=pEntries.get(0).Id
            );
            insert testWorkOrderItem;
            WorkOrderLineItem testWorkOrderItem2 = new WorkOrderLineItem(
                WorkOrderId=testWorkOrder.Id, 
                Type_of_Service__c='Service', 
                QUantity=1,
                PricebookEntryId=pEntries.get(5).Id
            );
            insert testWorkOrderItem2;
            
            ServiceAppointment testSA = new ServiceAppointment(
                ParentRecordId=testWorkOrder.Id, 
                DueDate=System.today().addDays(2), 
                EarliestStartTime=System.today().addDays(-1), 
                Status='New', 
                ServiceTerritoryId=testWorkOrder.ServiceTerritoryId
            );
            insert testSA;
            
            ServiceResource testResource = new ServiceResource(
                Name='TestResource', 
                RelatedRecordId=newUser.Id,
                ResourceType='T', 
                isActive=TRUE
            );
            insert testResource;
            
            ServiceTerritoryMember stm = new ServiceTerritoryMember(
                OperatingHoursId=TestDataFactory.opthours[2].Id, 
                ServiceResourceId=testResource.Id, 
                ServiceTerritoryId=TestDataFactory.srvTers[1].Id, 
                EffectiveStartDate=System.today().addDays(-10),
                Street='Street', 
                City = 'City', 
                State = 'State', 
                PostalCode = 'PostalCode',
                Country = 'Country',
                TerritoryType='P'
            );
            insert stm;
            
            VMI_Product__c vmi = new VMI_Product__c(
                Account__c = a.Id,
                Product__c = products[5].Id,
                Quantity_Per_Visit__c = 10
            );
            insert vmi;
            System.debug(stm);
            
            testSA.SchedStartTime = System.today();//SchedStartTime
            testSA.SchedEndTime = System.today().addDays(1);
            update testSA;
            
            AssignedResource newResource = new AssignedResource(
                ServiceAppointmentId = testSA.Id,
                ServiceResourceId = testResource.Id
            );
            
            insert newResource;
        
        
        test.startTest();
    	System.runAs(newUser){
        	StockSummary.getWorkOrderItems('This_Month', null, null);
        }
        test.stopTest();
    }
    
    static testMethod void testGrouped() {
        FSL.GlobalAPIS.addStatusTransition('New','Scheduled');
        FSL.GlobalAPIS.addStatusTransition('Scheduled','Dispatched');
        
        TestDataFactory.crtFieldSettings();
        
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults(); 
        List<Product2> products = new List<Product2>();
        List<PricebookEntry> pEntries = new List<PricebookEntry>();
        List<String> frequencies = new List<String>{'One-Time','Monthly','Weekly'};
        Id pBook = Test.getStandardPricebookId();
        
        TestDataFactory.crtAcctContact(1, 0); 
        Account a = TestDataFactory.accounts.get(0); 
        a.OperatingHoursId = TestDataFactory.opthours[1].Id;
        a.Service_Territory__c = TestDataFactory.srvTers[1].Id;
        update a;
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        for(Integer i=0; i<5; i++){
            products.add(
                new Product2(
                    Name='TestProduct'+i,
                    Allowable_Frequencies__c='One-Time;Monthly;Weekly', 
                    IsActive=TRUE, 
                    Available_As_Related_Product__c=TRUE, 
                    Family= (i==1) ? 'Pest Control' : 'Hygiene'
                )       
            );
        }
        products.add( new Product2(Name = fssetting.VMI_Product_Name__c, Allowable_Frequencies__c='One-Time;Monthly;Weekly', IsActive=TRUE, Available_As_Related_Product__c=TRUE, Family= 'Pest Control', ExternalId__c = 'test', VMI_Product__c = true));
        insert products;
        
        for(Integer i=0; i<5; i++) {
            pEntries.add(
                new PricebookEntry(
                    Pricebook2Id=pBook, 
                    Product2Id=products.get(i).Id, 
                    UnitPrice=1.0, 
                    IsActive=TRUE
                )
            );
        }
        pEntries.add( new PricebookEntry(Pricebook2Id=pBook, Product2Id=products.get(5).Id, UnitPrice=1.0, IsActive=TRUE));
        insert pEntries; 
        
        User newUser = new User(
            Alias = 'testAB', 
            Email = 'testAB@UserTechnicianForTest.com', 
            EmailEncodingKey = 'ISO-8859-1', 
            FirstName = 'TestFirstName1',
            LastName = 'TestLastName1', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_CA', 
            ProfileId = UserInfo.getProfileId(),
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'testAB@UserTechnicianForTest.com', 
            Employee_Number__c = 'testAB1234'
        );
        insert newUser;
        
        
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
            
            WorkOrderLineItem testWorkOrderItem = new WorkOrderLineItem(
                WorkOrderId=testWorkOrder.Id, 
                Type_of_Service__c='Service', 
                QUantity=1,
                PricebookEntryId=pEntries.get(0).Id 
            );
            insert testWorkOrderItem;
            
            WorkOrderLineItem testWorkOrderItem2 = new WorkOrderLineItem(
                WorkOrderId=testWorkOrder.Id, 
                Type_of_Service__c='Service', 
                QUantity=1,
                PricebookEntryId=pEntries.get(5).Id
            );
            insert testWorkOrderItem2;
            
            
            ServiceAppointment testSA = new ServiceAppointment(
                ParentRecordId=testWorkOrder.Id, 
                DueDate=System.today().addDays(1), 
                EarliestStartTime=System.today(), 
                Status='New', 
                ServiceTerritoryId=testWorkOrder.ServiceTerritoryId
            );
            insert testSA;
            
            ServiceResource testResource = new ServiceResource(
                Name='TestResource', 
                RelatedRecordId=newUser.Id,
                ResourceType='T', 
                isActive=TRUE
            );
            insert testResource;
            
            ServiceTerritoryMember stm = new ServiceTerritoryMember(
                OperatingHoursId=TestDataFactory.opthours[2].Id, 
                ServiceResourceId=testResource.Id, 
                ServiceTerritoryId=TestDataFactory.srvTers[1].Id, 
                EffectiveStartDate=System.today().addDays(-10),
                Street='Street', 
                City = 'City', 
                State = 'State', 
                PostalCode = 'PostalCode',
                Country = 'Country',
                TerritoryType='P'
            );
            insert stm;
            System.debug(stm);
            
            VMI_Product__c vmi = new VMI_Product__c(
                Account__c = a.Id,
                Product__c = products[5].Id,
                Quantity_Per_Visit__c = 10
            );
            insert vmi;
            
            testSA.SchedStartTime = System.today();//SchedStartTime
            testSA.SchedEndTime = System.today().addDays(1);
            update testSA;
            
            AssignedResource newResource = new AssignedResource(
                ServiceAppointmentId = testSA.Id,
                ServiceResourceId = testResource.Id
            );
            
            insert newResource;
            
        
        test.startTest();
    	System.runAs(newUser){
        	StockSummary.getWorkOrderItemsGrouped('This_Month', null, null);
        }
        test.stopTest();
    }
    
    static testMethod void testGetColumns() {
        List<String> columnAPINames = new List<String>{'WorkOrderLineItem.Product_Name__c','WorkOrderLineItem.Related_Product__c.Name','WorkOrderLineItem.Type_of_Service__c','WorkOrderLineItem.Quantity'};
            StockSummary.getColumns(columnAPINames);
    }
    
}