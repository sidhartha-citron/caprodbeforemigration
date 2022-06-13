@isTest
public class EDW_ConfigureAppointmentControllerTest {
    @testSetup
    static void setup() {
        List<Group> groups = new List<Group> { new Group(Name='Customer_Success', type='Queue'), new Group(Name='Multi_Res', type='Queue') };
            
        insert groups;
        
        List<QueueSObject> queues = new List<QueueSObject> { new QueueSobject(QueueId = groups[0].Id, SObjectType = 'Case'), new QueueSobject(QueueId = groups[1].Id, SObjectType = 'Case') };
        
        System.runAs(new User(Id = UserInfo.getUserId())) {            
            insert queues;
        }
        
        Field_Service_Settings__c fssetting = new Field_Service_Settings__c();
        fssetting.Account_Ship_To_Record_Type_Id__c = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Customer Ship To').getRecordTypeId();
        fssetting.Customer_Success_Queue__c = groups[0].Id;
        fssetting.Standard_Pricebook_Id__c = Test.getStandardPricebookId();
        fssetting.Regular_Order_Draft_Stage__c = 'Draft';
        fssetting.Pest_LOB__c = 'Pest Control';
        fssetting.Non_Recurring_Frequency_Value__c = 'One-Time';
        fssetting.Work_Order_Dispatched_Status__c = 'Dispatched';
        fssetting.Work_Order_Scheduled_Status__c = 'Scheduled';
        fssetting.Duration_Type_Minutes__c = 'Minutes';
        fssetting.Ticket_Emergency_Record_Type__c = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Emergency').getRecordTypeId();
        fssetting.Multi_Res_Queue_Id__c = groups[1].Id;
        fssetting.Work_Order_New_Status__c = 'New';
        
        insert fssetting;
        
        Emergency_Dispatch_Wizard_Setttings__c edws = new Emergency_Dispatch_Wizard_Setttings__c();
        edws.Order_Name__c = 'test order ';
        edws.Maximum_Number_of_Resources__c = 10;
        edws.Order_Item_Batch_Threshold__c = 10;
        edws.Pagination_Limit__c = 25;
        edws.Activate_Warranty_Logic__c = true;
        edws.Work_Order_Multi_Res_Advance_Days__c = 40;
        edws.Service_Appointment_Minimum_Duration__c = 6;
        edws.SSRS_Multi_Res_Pest_Skill_Id__c = '0C5f1000000PB3QCAW';
        edws.SSRS_Pest_Commercial_Skill_Id__c = '0C5f1000000PB3RCAW';
        
        insert edws;
        
        List<Skill> skills = [SELECT Id FROM Skill WHERE Id = :edws.SSRS_Pest_Commercial_Skill_Id__c];
        
        TestDataFactory.crtBillToAcctContact(1,1); 
        Account a = TestDataFactory.accounts[0]; 
        Contact c = TestDataFactory.contacts[0]; 
        
        
        Site_Survey__c ss = new Site_Survey__c(
            Account__c=a.Id, 
            Survey_Date__c = System.today(),
            Status__c = 'Draft'
        );
        insert ss;
        
        SiteSurvey_RequiredSkills__c rs = new SiteSurvey_RequiredSkills__c();
        rs.Name = 'test skills';
        rs.Skill_Level__c = 1;
        rs.Site_Survey__c = ss.Id;
        rs.Line_of_Business__c = 'Pest Control';
        rs.Skill_Name__c = 'test skill name';
        rs.Skill_Record_Id__c = skills[0].Id;
        
        insert rs;
        
        Survey_Location__c location = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Number_of_Rooms__c = '1',
            Name='Location'
        );
        insert location;
        
        Survey_Location__c location2 = new Survey_Location__c(
            Site_Survey__c=ss.Id, 
            Building__c = 'Building',
            Floor__c = 'Floor', 
            Location_Type__c='Washroom', 
            Location_SubType__c='Unisex',
            Number_of_Rooms__c = 'Garden Home',
            Name='Location'
        );
        insert location2;
        
        a.Site_Survey__c = ss.Id;
        update a;
        
        WorkType wt = new WorkType();
        wt.DurationType = 'Minutes';
        wt.EstimatedDuration = 2;
        wt.Name = 'test work type';
        
        insert wt;
        
        Product2 product = new Product2();
        product.Name = 'test product';
        product.Allowable_Frequencies__c = 'One-Time';
        product.Family = 'Pest Control';
        product.ExternalID__c = '01-10-10-01';
        product.Item_Type__c = 'Service';
        product.Infestation_Level__c = 'General';
        product.Treatment_Type__c = 'Bed Bug';
        product.Number_of_Rooms__c = '1';
        product.IsActive = true;
        product.Service_Work_Type__c = wt.Id;
        
        insert product;
        
        Product2 product2 = new Product2();
        product2.Name = 'test product2';
        product2.Allowable_Frequencies__c = 'One-Time';
        product2.Family = 'Pest Control';
        product2.ExternalID__c = '01-10-10-02';
        product2.Item_Type__c = 'Service';
        product2.Infestation_Level__c = 'General';
        product2.Treatment_Type__c = 'Bed Bug';
        product2.Number_of_Rooms__c = 'Garden Home';
        product2.IsActive = true;
        product2.Service_Work_Type__c = wt.Id;
        
        insert product2;
        
        PricebookEntry pbe = new PricebookEntry();
        pbe.UnitPrice = 5;
        pbe.Pricebook2Id = fssetting.Standard_Pricebook_Id__c;
        pbe.ExternalID__c = 'fgds';
        pbe.Product2Id = product.Id;
        pbe.IsActive = true;
        
        insert pbe;
        
        PricebookEntry pbe2 = new PricebookEntry();
        pbe2.UnitPrice = 5;
        pbe2.Pricebook2Id = fssetting.Standard_Pricebook_Id__c;
        pbe2.ExternalID__c = 'fgds2';
        pbe2.Product2Id = product2.Id;
        pbe2.IsActive = true;
        
        insert pbe2;
        
        Case theCase = new Case();
        theCase.AccountId = c.AccountId;
        theCase.ContactId = c.Id;
        theCase.Type = 'Pest Control';
        theCase.RecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get('Emergency').getRecordTypeId();
        theCase.Subject = 'test case';
        
        insert theCase;
    }
    
    @isTest
    static void initializeConfigureAppointmentScreenNewModeNoOrder() {
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        Test.stopTest();
    }
    
    @isTest
    static void initializeConfigureAppointmentScreenNewModeWithOrder() {
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(modelJsonToUse);
        
        Test.stopTest();
    }
    
    @isTest
    static void initializeConfigureAppointmentScreenEditMode() {
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        initModel.mode = 'EDIT';
        initModel.recordId = returnedOrder.Id;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(modelJsonToUse);
        
        Test.stopTest();
    }
    
    @isTest
    static void testGenerateOrderProducts() {
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String modelWithOrder = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        EDW_ConfigureAppointmentController.generateOrderProducts(selectedFields, modelWithOrder, false);
        
        Test.stopTest();
    }
    
    @isTest
    static void testGenerateOrderProductsWithBadProduct() {
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String modelWithOrder = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"3"}';
        
        EDW_ConfigureAppointmentController.generateOrderProducts(selectedFields, modelWithOrder, false);
        
        Test.stopTest();
    }
    
    @isTest
    static void testRemoveOrderItem() {
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonWithOrderItems = generateOrderProducts(selectedFields, modelJsonToUse, false);
        
        EDW_ViewModels.MainViewModel initDataWithOrderDeserialized = EDW_ViewModels.parseInitData(jsonWithOrderItems);
        EDW_ViewModels.MainViewModel modelWithOrderDeserialized = EDW_ViewModels.parseInitData(modelJsonToUse);
        
        modelWithOrderDeserialized.tableRows = EDW_ViewModels.parseTableOrderItemList(System.JSON.serialize(initDataWithOrderDeserialized.tableRows));
        
        String jsonWithOrderItemsToDelete = System.JSON.serialize(modelWithOrderDeserialized);
        
        OrderItem oi = [SELECT Id FROM OrderItem LIMIT 1];
        
        EDW_ConfigureAppointmentController.removeOrderItem(jsonWithOrderItemsToDelete, oi.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateOrderItemSurveyLocation() {
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        Survey_Location__c location = [SELECT Id, Number_of_Rooms__c FROM Survey_Location__c WHERE Number_of_Rooms__c = 'Garden Home' LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonWithOrderItems = generateOrderProducts(selectedFields, modelJsonToUse, false);
                
        EDW_ViewModels.MainViewModel initDataWithOrderDeserialized = EDW_ViewModels.parseInitData(jsonWithOrderItems);
        EDW_ViewModels.MainViewModel modelWithOrderDeserialized = EDW_ViewModels.parseInitData(modelJsonToUse);
        
        modelWithOrderDeserialized.tableRows = EDW_ViewModels.parseTableOrderItemList(System.JSON.serialize(initDataWithOrderDeserialized.tableRows));
        
        EDW_ViewModels.TableOrderItem row = modelWithOrderDeserialized.tableRows[0];
        
        String surveyLocationJson = System.JSON.serialize(row.surveyLocation);
        String jsonWithRowToUpdate = System.JSON.serialize(row);
        
        System.debug(surveyLocationJson);
        //test with null location
        EDW_ConfigureAppointmentController.updateOrderItemSurveyLocation(jsonWithRowToUpdate, surveyLocationJson, model.account.Id);
        
        row.surveyLocation = location;
        jsonWithRowToUpdate = System.JSON.serialize(row);
        surveyLocationJson = System.JSON.serialize(row.surveyLocation);
        
        //test with defined location
        EDW_ConfigureAppointmentController.updateOrderItemSurveyLocation(jsonWithRowToUpdate, surveyLocationJson, model.account.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateOrderItemProduct() {
        Contact contact = [SELECT Id, AccountId FROM Contact LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonWithOrderItems = generateOrderProducts(selectedFields, modelJsonToUse, false);
        
        EDW_ViewModels.MainViewModel initDataWithOrderDeserialized = EDW_ViewModels.parseInitData(jsonWithOrderItems);
        EDW_ViewModels.MainViewModel modelWithOrderDeserialized = EDW_ViewModels.parseInitData(modelJsonToUse);
        
        modelWithOrderDeserialized.tableRows = EDW_ViewModels.parseTableOrderItemList(System.JSON.serialize(initDataWithOrderDeserialized.tableRows));
        
        EDW_ViewModels.TableOrderItem row = modelWithOrderDeserialized.tableRows[0];
        row.orderItem.UnitPrice = 10;
        
        String jsonWithRowToUpdate = System.JSON.serialize(row);
        
        EDW_ConfigureAppointmentController.updateOrderItemProduct(jsonWithRowToUpdate, contact.AccountId);
        
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateOrderItemProductWithBadProduct() {
        Contact contact = [SELECT Id, AccountId FROM Contact LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonWithOrderItems = generateOrderProducts(selectedFields, modelJsonToUse, false);
        
        EDW_ViewModels.MainViewModel initDataWithOrderDeserialized = EDW_ViewModels.parseInitData(jsonWithOrderItems);
        EDW_ViewModels.MainViewModel modelWithOrderDeserialized = EDW_ViewModels.parseInitData(modelJsonToUse);
        
        modelWithOrderDeserialized.tableRows = EDW_ViewModels.parseTableOrderItemList(System.JSON.serialize(initDataWithOrderDeserialized.tableRows));
        
        EDW_ViewModels.TableOrderItem row = modelWithOrderDeserialized.tableRows[0];
        row.numberOfRooms = '6';
        
        String jsonWithRowToUpdate = System.JSON.serialize(row);
        
        EDW_ConfigureAppointmentController.updateOrderItemProduct(jsonWithRowToUpdate, contact.AccountId);
        
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateTableRowList() {
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonWithOrderItems = generateOrderProducts(selectedFields, modelJsonToUse, true);
        
        EDW_ViewModels.MainViewModel modelWithOrderDeserialized = EDW_ViewModels.parseInitData(modelJsonToUse);
        
        EDW_ViewModels.MainViewModel initDataWithOrderDeserialized = EDW_ViewModels.parseInitData(jsonWithOrderItems);
        modelWithOrderDeserialized.tableRows = EDW_ViewModels.parseTableOrderItemList(System.JSON.serialize(initDataWithOrderDeserialized.tableRows));
        
        EDW_ViewModels.TableOrderItem row = modelWithOrderDeserialized.tableRows[0];
        
        String jsonWithRowToUpdate = System.JSON.serialize(row);
        
        OrderItem oi = [SELECT Id FROM OrderItem LIMIT 1];
        
        EDW_ConfigureAppointmentController.updateTableRowList(jsonWithRowToUpdate, oi.Id, modelJsonToUse);
        
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateSurveyLocations() {
        Survey_Location__c location = [SELECT Id, Number_of_Rooms__c, Site_Survey__c FROM Survey_Location__c WHERE Number_of_Rooms__c = '1' LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonWithOrderItems = EDW_ConfigureAppointmentController.generateOrderProducts(selectedFields, modelJsonToUse, true);
        
        EDW_ViewModels.MainViewModel initDataWithOrderDeserialized = EDW_ViewModels.parseInitData(jsonWithOrderItems);
        EDW_ViewModels.MainViewModel modelWithOrderDeserialized = EDW_ViewModels.parseInitData(modelJsonToUse);
        
        modelWithOrderDeserialized.tableRows = EDW_ViewModels.parseTableOrderItemList(System.JSON.serialize(initDataWithOrderDeserialized.tableRows));
        
        location.Number_of_Rooms__c = 'Garden Home';
        update location;
        
        String jsonWithRowToUpdate = System.JSON.serialize(modelWithOrderDeserialized);
        
        EDW_ConfigureAppointmentController.updateSurveyLocations(jsonWithRowToUpdate, location.Id);
        
        Test.stopTest();
    }
    
    @isTest
    static void testRefreshTableData() {
        Survey_Location__c location = [SELECT Id FROM Survey_Location__c LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonWithOrderItems = generateOrderProducts(selectedFields, modelJsonToUse, false);
        
        EDW_ViewModels.MainViewModel initDataWithOrderDeserialized = EDW_ViewModels.parseInitData(jsonWithOrderItems);
        EDW_ViewModels.MainViewModel modelWithOrderDeserialized = EDW_ViewModels.parseInitData(modelJsonToUse);
        
        modelWithOrderDeserialized.tableRows = EDW_ViewModels.parseTableOrderItemList(System.JSON.serialize(initDataWithOrderDeserialized.tableRows));
        
        for (EDW_ViewModels.TableOrderItem row : modelWithOrderDeserialized.tableRows) {
			row.surveyLocation = location;
        }
        
        String jsonWithRowToUpdate = System.JSON.serialize(modelWithOrderDeserialized.tableRows);
        
        EDW_ViewModels.TableOrderItem row = modelWithOrderDeserialized.tableRows[0];
        
        String jsonWithSurveyLocation = System.JSON.serialize(modelWithOrderDeserialized.tableRows[0]);
        String surveyLocationJson = System.JSON.serialize(row.surveyLocation);
        
        String finalJson = System.JSON.serialize(modelWithOrderDeserialized);
        
        EDW_ConfigureAppointmentController.refreshTableData(finalJson);
        
        Test.stopTest();
    }
    
    @isTest
    static void testSavePoToOrderHeader() {
        Contact contact = [SELECT Id, AccountId FROM Contact LIMIT 1];
        Survey_Location__c location = [SELECT Id FROM Survey_Location__c LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        initModel.order.PoNumber = 'test123';
        
        EDW_ConfigureAppointmentController.saveOrder(System.JSON.serialize(initModel.order));
        
        Test.stopTest();
    }
    
    @isTest
    static void testSavePoToOrderProduct() {
        Account a = [SELECT Id, PO_Required_on_Line_Item__c FROM Account LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        a.PO_Required_on_Line_Item__c = true;
        
        Test.startTest();
        update a;
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonWithOrderProducts = generateOrderProducts(selectedFields, modelJsonToUse, false);
        
        EDW_ViewModels.MainViewModel modelWithOrderProducts = EDW_ViewModels.parseInitData(jsonWithOrderProducts);
        
        List<OrderItem> items = new List<OrderItem>();
        
        for (EDW_ViewModels.TableOrderItem row : modelWithOrderProducts.tableRows) {
            row.orderItem.PO_Number__c = '123';
            items.add(row.orderItem);
        }
        
        EDW_ConfigureAppointmentController.saveOrderProduct(System.JSON.serialize(items[0]));
        
        Test.stopTest();
    }
    
    @isTest
    static void testPaginateTable() {
        Account a = [SELECT Id, PO_Required_on_Line_Item__c FROM Account LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        a.PO_Required_on_Line_Item__c = true;
        
        Test.startTest();
        update a;
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFields = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonToPaginate = EDW_ConfigureAppointmentController.generateOrderProducts(selectedFields, modelJsonToUse, false);
        
        EDW_ConfigureAppointmentController.paginateTable(jsonToPaginate);
        
        Test.stopTest();
    }
    
    @isTest
    static void testUpdateAllASelectedOrderItems() {
        Account a = [SELECT Id, PO_Required_on_Line_Item__c FROM Account LIMIT 1];
        Survey_Location__c location = [SELECT Id FROM Survey_Location__c WHERE Number_of_Rooms__c = '1' LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        a.PO_Required_on_Line_Item__c = true;
        
        Test.startTest();
        update a;
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFieldsToGenerate = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonModelWithOrderProducts = EDW_ConfigureAppointmentController.generateOrderProducts(selectedFieldsToGenerate, modelJsonToUse, false);//problem here
        
        Map<Id, OrderItem> oiIds = new Map<Id, OrderItem>([SELECT Id FROM OrderItem]);
        
        List<Id> orderItemIds = new List<Id>(oiIds.keySet());
        
        String selectedFieldsToReplace = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"Garden Home"}';
        
        location.Number_of_Rooms__c = 'Garden Home';
        update location;
        
        EDW_ConfigureAppointmentController.updateAllSelectedOrderItems(selectedFieldsToReplace, orderItemIds, jsonModelWithOrderProducts);
        
        Test.stopTest();
    }
    
    @isTest
    static void testGenerateWorkOrder() {
        Account a = [SELECT Id, PO_Required_on_Line_Item__c FROM Account LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        a.PO_Required_on_Line_Item__c = true;
        
        Test.startTest();
        update a;
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFieldsToGenerate = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonModelWithOrderProducts = EDW_ConfigureAppointmentController.generateOrderProducts(selectedFieldsToGenerate, modelJsonToUse, false);
        
        String orderJson = System.JSON.serialize(returnedOrder);
        
        EDW_ConfigureAppointmentController.generateWorkOrder(orderJson, 2, 1, System.JSON.serialize(theCase));
        
        Test.stopTest();
    }
    
    @isTest
    static void testGenerateWorkOrderRebuilding() {
        Account a = [SELECT Id, PO_Required_on_Line_Item__c FROM Account LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        a.PO_Required_on_Line_Item__c = true;
        
        Test.startTest();
        update a;
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFieldsToGenerate = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonModelWithOrderProducts = EDW_ConfigureAppointmentController.generateOrderProducts(selectedFieldsToGenerate, modelJsonToUse, false);
        
        String orderJson = System.JSON.serialize(returnedOrder);
        
        EDW_ConfigureAppointmentController.generateWorkOrder(orderJson, 2, 1, System.JSON.serialize(theCase));
        //called a second time to "rebuild" the data
        EDW_ConfigureAppointmentController.generateWorkOrder(orderJson, 2, 1, System.JSON.serialize(theCase));
        
        Test.stopTest();
    }
    
    @isTest
    static void testSaveOrderEffectiveDate() {
        Contact contact = [SELECT Id, AccountId FROM Contact LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        EDW_ViewModels.MainViewModel modelWithOrderDeserialized = EDW_ViewModels.parseInitData(modelJsonToUse);
        
        String orderDateTimeWrapper = '{"order":' + System.JSON.serialize(modelWithOrderDeserialized.order) + '}';
        
        EDW_ConfigureAppointmentController.saveOrderEffectiveDate(orderDateTimeWrapper, System.today().addDays(1), modelWithOrderDeserialized.order.EffectiveDate, String.valueOf(System.now().time().addHours(1)), String.valueOf(System.now().time()), false, true);
        
        Test.stopTest();
    }
    
    @isTest
    static void testReinitializeConfigureAppointmentScreen() {
        Contact contact = [SELECT Id, AccountId FROM Contact LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String modelWithOrder = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(modelWithOrder);
        
        Test.stopTest();
    }
    
    @isTest
    static void testIsOrderItemBatchJobCompleted() {
        Account a = [SELECT Id, PO_Required_on_Line_Item__c FROM Account LIMIT 1];
        Contact contact = [SELECT Id, AccountId FROM Contact LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        Test.startTest();
        update a;
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFieldsToGenerate = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"10","numberOfRooms":"1"}';
        
        String modelWithOrderProducts = generateOrderProducts(selectedFieldsToGenerate, modelJsonToUse, false);
        
        EDW_ViewModels.MainViewModel modelWithBatchId = EDW_ViewModels.parseInitData(modelWithOrderProducts);
        
        EDW_ConfigureAppointmentController.isOrderItemBatchJobCompleted(modelWithBatchId.orderItemBatchJobId);
        
        Test.stopTest();
    }
    
    @isTest
    static void testCancelOrder() {
        Account a = [SELECT Id, PO_Required_on_Line_Item__c FROM Account LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        a.PO_Required_on_Line_Item__c = true;
        
        Test.startTest();
        update a;
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        initModel.order = returnedOrder;
        
        String modelJsonToUse = System.JSON.serialize(initModel);
        
        String selectedFieldsToGenerate = '{"treatmentType":"Bed Bug","infestationLevel":"General","numberOfUnits":"1","numberOfRooms":"1"}';
        
        String jsonModelWithOrderProducts = generateOrderProducts(selectedFieldsToGenerate, modelJsonToUse, false);
        
        String orderJson = System.JSON.serialize(returnedOrder);

        EDW_ConfigureAppointmentController.generateWorkOrder(orderJson, 2, 1, System.JSON.serialize(theCase));
        
        EDW_ConfigureAppointmentController.cancelOrder(orderJson);
        
        Test.stopTest();
    }
    
    @isTest
    static void testLoadCustomerInformationSection() {
        Account a = [SELECT Id, PO_Required_on_Line_Item__c FROM Account LIMIT 1];
        Case theCase = [SELECT Id FROM Case LIMIT 1];
        
        a.PO_Required_on_Line_Item__c = true;
        
        Test.startTest();
        update a;
        
        EDW_ViewModels.MainViewModel model = EDW_SelectCustomerController.initializeSelectCustomer(theCase.Id);
        model.mode = 'NEW';
        
        String json = System.JSON.serialize(model);
        
        String initModelJson = EDW_ConfigureAppointmentController.initializeConfigureAppointmentScreen(json);
        
        EDW_ViewModels.MainViewModel initModel = EDW_ViewModels.parseInitData(initModelJson);
        initModel.order.PoNumber = 'test123';
        
        String createdOrderJson = System.JSON.serialize(initModel.order);
        
        String orderInsertedJson = EDW_ConfigureAppointmentController.insertOrder(createdOrderJson);
        
        String returnedOrderJson = EDW_ConfigureAppointmentController.saveOrder(orderInsertedJson);
        
        Order returnedOrder = (Order)System.JSON.deserialize(returnedOrderJson, Order.class);
        
        EDW_ConfigureAppointmentController.loadCustomerInformationSection(returnedOrder.Id);
        
        Test.stopTest();
    }
    
    /**
     * Creates OrderItem records as specified by the user, and returns them to the view
     *
     * @param json  the data provided to find the correct Product for the new OrderItems
     * @param initDataJson  all data stringified
     * @param isSurveyLocationRequested  notifies the logic whether to automatically assign Survey_Location__c records to each OrderItem
     */
    public static String generateOrderProducts(String json, String initDataJson, Boolean isSurveyLocationRequested) {
        //removing timestamp because of a salesforce deserialization bug
        initDataJson = initDataJson.replace('T00:00:00.000Z', '');
        Emergency_Dispatch_Wizard_Setttings__c edwSettings = Emergency_Dispatch_Wizard_Setttings__c.getOrgDefaults();
    	Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        string NOT_APPLICABLE = 'N/A';
        
        EDW_ViewModels.OrderProductRequest request = EDW_ViewModels.parseOrderProductRequest(json);
        EDW_ViewModels.MainViewModel mainData = EDW_ViewModels.parseInitData(initDataJson);
        
        try {
            String numberOfRooms = mainData.account.Is_Multi_Res__c ? request.numberOfRooms : NOT_APPLICABLE;
            String productKey = EDW_UtilityClass.buildProductKey(request.treatmentType, request.infestationLevel, request.numberOfRooms, null);
            EDW_ViewModels.ProductWrapper selectedProduct = EDW_UtilityClass.getAllPestServiceProducts().get(productKey);
            
            if (selectedProduct == null) {
                mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, Label.No_Product_Found, null);
                
                return System.JSON.serialize(mainData);
            }
            
            Integer numOfUnits = Integer.valueOf(request.numberOfUnits);
            List<OrderItem> orderItemsToInsert = new List<OrderItem>();
            Decimal workTypeEstimatedDuration = mainData.workTypeEstimatedDuration;
            List<Survey_Location__c> locations;
            
            if (isSurveyLocationRequested) {
                String locationQuery = 'SELECT Id FROM Survey_Location__c WHERE Site_Survey__c = \'' + mainData.account.Site_Survey__c + '\' ';
                if (!String.isBlank(numberOfRooms)) { locationQuery += 'AND Number_of_Rooms__c = :numberOfRooms '; }
                locationQuery += 'ORDER BY Floor__c ASC LIMIT :numOfUnits';
                
                locations = Database.query(locationQuery);
            }
            
            Map<String, Warranty__c> allWarranties = EDW_UtilityClass.getAllActiveWarrantiesOnAccount(mainData.account.Id, mainData.order.EffectiveDate);
            Warranty__c warranty = allWarranties.get(productKey);
            
            if (String.isBlank(mainData.order.Id)) {
            	mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, 'The Order ID was found to be null. If the Order Product was added to the row, it`s because the logic fired again as a backup and the Order ID was located.', null);
                
        		return System.JSON.serialize(mainData);
                //insert mainData.order;
            }
            
            for (Integer i = 0; i < numOfUnits; i++) {            
                orderItemsToInsert.add(new OrderItem(
                    Active__c = true,
                    OrderId = mainData.order.Id,
                    Frequency__c = dataSets.Non_Recurring_Frequency_Value__c,
                    Product2Id = selectedProduct.productId,
                    PricebookEntryId = selectedProduct.pricebookEntryId,
                    Requested_Price_Approved__c = false,
                    Service_Price_Per_Unit__c = 0,
                    UnitPrice=0,
                    Quantity = 1,
                    Has_Warranty__c = warranty != null,
                    Survey_Location__c = locations == null 
                    ? null 
                    : (locations.size() - 1) >= i 
                    ? locations[i].Id 
                    : null
                ));
            }
                       
            if (!orderItemsToInsert.isEmpty()) {
                Double threshold = edwSettings.Order_Item_Batch_Threshold__c == null 
                    ? 0 
                    : edwSettings.Order_Item_Batch_Threshold__c;
                
                if (orderItemsToInsert.size() >= threshold) {
                    mainData.orderItemBatchJobId = Database.executeBatch(new CreateOrderProductsBatch(orderItemsToInsert));
                    mainData.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, null, null);
                    
                    return System.JSON.serialize(mainData);
                } else {
                    insert orderItemsToInsert;
                }
                
                Map<Id, EDW_ViewModels.TableOrderItem> rows = new Map<Id, EDW_ViewModels.TableOrderItem>();
                Set<Id> oiIds = new Set<Id>();
                
                for (OrderItem oi : orderItemsToInsert) {
                    oiIds.add(oi.Id);
                }
                
                Integer pageLimit = edwSettings.Pagination_Limit__c == null ? 10 : Integer.valueOf(edwSettings.Pagination_Limit__c);
                
                for (OrderItem oi : Database.query(QueryGenerator.queryOrderItems('Id IN :oiIds AND Active__c = TRUE ORDER BY CreatedDate DESC LIMIT :pageLimit'))) {
                    Product2 product = new Product2(Id = oi.Product2Id, Treatment_Type__c = oi.Product2.Treatment_Type__c, Infestation_Level__c = oi.Product2.Infestation_Level__c, Number_of_Rooms__c = oi.Product2.Number_of_Rooms__c);
                    Survey_Location__c location = new Survey_Location__c(Id = oi.Survey_Location__c, Floor__c = oi.Survey_Location__r.Floor__c, Building__c = oi.Survey_Location__r.Building__c, Number_of_Rooms__c = oi.Survey_Location__r.Number_of_Rooms__c, Name = oi.Survey_Location__r.Name);
                   
                    rows.put(oi.Id, new EDW_ViewModels.TableOrderItem(oi.Survey_Location__c == null ? null : location, request.infestationLevel, product, request.numberOfRooms, selectedProduct, warranty, oi.Id, oi.Id, oi, request.treatmentType));
                }
                
                mainData.tableRows.addAll(rows.values());
                mainData = refreshTableData(System.JSON.serialize(mainData));
                
                String response = Label.Order_Product_Insert_Success_Part_One + EDW_UtilityClass.EMPTY_SPACE + orderItemsToInsert.size() + EDW_UtilityClass.EMPTY_SPACE + Label.Order_Product_Insert_Success_Part_Two;
                
                mainData.auraResponse = new AuraStatusResponse(true, EDW_UtilityClass.SUCCESS, response, null);
            } else {
                mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, 'No Order Products were processed', null);
            }
            
            return System.JSON.serialize(mainData);
        } catch (Exception e) {
            mainData.auraResponse = new AuraStatusResponse(false, EDW_UtilityClass.ERROR, e.getMessage(), null);
        }
        
        return System.JSON.serialize(mainData);
    }
    
    public static EDW_ViewModels.MainViewModel refreshTableData(String json) {
        EDW_ViewModels.MainViewModel mainData = EDW_ViewModels.parseInitData(json);
        
        Order o = EDW_UtilityClass.getUpdatedOrderInformation(mainData.order.Id);
        
        mainData.tableRows.clear();
        mainData.tableRows.addAll(EDW_UtilityClass.buildTableOrderItemMap(mainData).values());
        mainData.isValidToGenerateWorkOrder = isOrderValidForWorkOrderGeneration(mainData.order.Id);
        mainData.pageNumber = 1;
        mainData.totalOrderAmount = o.TotalAmount;
        mainData.orderItemCount = o.OrderItems.size();
        mainData.workTypeEstimatedDuration = EDW_UtilityClass.calculateWorkTypeDuration(o.OrderItems);
        mainData.orderItemBatchJobId = null;
        mainData.orderEffectiveDate = o.EffectiveDate;
        mainData.disableNext = EDW_UtilityClass.isNextDisabled(mainData);
        mainData.totalEstimatedDuration = o.User_Specified_Estimated_Duration__c;
        mainData.numberOfResources = Integer.valueOf(o.Number_of_Resources__c);
        mainData.orderNumber = o.OrderNumber;
        mainData.order = o;
        
        return mainData;
    }
    
    public static Boolean isOrderValidForWorkOrderGeneration(String orderId) {
        return [SELECT COUNT() FROM OrderItem WHERE OrderId = :orderId AND Survey_Location__c = NULL] == 0;
    }
}