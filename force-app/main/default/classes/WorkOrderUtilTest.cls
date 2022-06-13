@IsTest
public class WorkOrderUtilTest {


    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void updateWorkOrderLineItemsCannotComplete() {
        List<SObject> wolis = [SELECT Id, Order_Product__c FROM WorkOrderLineItem];

        Set<Id> lineItemIds = ApexUtils.getIdsFromField(wolis, 'Id');
        Set<Id> orderProductIds = ApexUtils.getIdsFromField(wolis, 'Order_Product__c');

        List<OrderItem> itemsBefore = [SELECT Id, Active__c FROM OrderItem WHERE Id IN :orderProductIds AND Active__c = TRUE];

        Test.startTest();
        WorkOrderUtil.updateWorkOrderLineItemsCannotComplete(lineItemIds);
        Test.stopTest();

        List<OrderItem> itemsAfter = [SELECT Id, Active__c FROM OrderItem WHERE Id IN :orderProductIds AND Active__c = FALSE];

        System.assertEquals(itemsBefore.size(), itemsAfter.size());
    }

    @IsTest
    static void updateWorkOrderRoomsCannotComplete() {
        List<SObject> wors = [SELECT Id FROM Work_Order_Room__c];

        Set<Id> roomIds = ApexUtils.getIdsFromField(wors, 'Id');

        List<WorkOrderLineItem> wolisBefore = [
                SELECT Id, Status
                FROM WorkOrderLineItem
                WHERE Work_Order_Location__c IN :roomIds
                AND Status != :QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c
        ];

        Test.startTest();
        WorkOrderUtil.updateWorkOrderRoomsCannotComplete(roomIds);
        Test.stopTest();

        List<WorkOrderLineItem> wolisAfter = [
                SELECT Id, Status
                FROM WorkOrderLineItem
                WHERE Work_Order_Location__c IN :roomIds
                AND Status = :QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c
        ];

        System.assertEquals(wolisBefore.size(), wolisAfter.size());
    }

    @IsTest
    static void updateWorkOrderCannotComplete() {
        List<WorkOrder> wos = [SELECT Id, Status, Cannot_Complete_Reason__c FROM WorkOrder LIMIT 1];
		
        Set<Id> workOrderIds = ApexUtils.getIdsFromField(wos, 'Id');
		
        for(WorkOrder wo : wos){
            wo.Cannot_Complete_Reason__c = 'Closed';
        }
        
        update wos;
        
        List<Work_Order_Room__c> worsBefore = [
                SELECT Id, Status__c
                FROM Work_Order_Room__c
                WHERE Work_Order__c IN :workOrderIds
                AND Status__c != :QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c
        ];

        Test.startTest();
        WorkOrderUtil.updateWorkOrderCannotComplete(workOrderIds);
        Test.stopTest();

        List<Work_Order_Room__c> worsAfter = [
                SELECT Id, Status__c
                FROM Work_Order_Room__c
                WHERE Work_Order__c IN :workOrderIds
                AND Status__c = :QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c
        ];

        System.assertEquals(worsBefore.size(), worsAfter.size());
    }

    @IsTest
    static void updateOrderStatusToActiveFromNotInvoicing() {
        Test.setMock(HttpCalloutMock.class, new CongaCalloutMock());

        WorkOrder wo = [SELECT Id, Order__c, Status FROM WorkOrder LIMIT 1];
        wo.Status = QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c;
        update wo;

        List<Product2> products = [SELECT Id, Family FROM Product2];
        for(Product2 product : products){
            product.Family = 'Pest Control';
        }
        update products;
        
        Order o = [SELECT Id FROM Order WHERE Id = :wo.Order__c LIMIT 1];
        o.Emergency__c = true;
        o.Line_of_Businesses__c = 'Pest Control';
        o.Pest_Emergency_Not_Invoicing__c = true;
        update o;
		
        Test.startTest();
        WorkOrderUtil.updateOrderStatusToActiveFromNotInvoicing(new Set<Id>{wo.Id});
        Test.stopTest();

        Order oAfter = [SELECT Id, Pest_Emergency_Not_Invoicing__c, Status FROM Order WHERE Id = :o.Id];

        System.assertEquals(QueryUtils.fieldServiceSettings.Order_Active_Stage__c, oAfter.Status);
        System.assert(!oAfter.Pest_Emergency_Not_Invoicing__c);
    }

    @IsTest
    static void cancelWorkOrderAndServiceAppointments() {
        WorkOrder wo = [SELECT Id FROM WorkOrder LIMIT 1];

        Test.startTest();
        WorkOrderUtil.cancelWorkOrderAndServiceAppointments(new Set<Id>{wo.Id});
        Test.stopTest();

        WorkOrder woAfter = [SELECT Id, Status FROM WorkOrder WHERE Id = :wo.Id];

        System.assertEquals(QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c, woAfter.Status);
    }

    @IsTest
    static void createOrderProductsOnCompletedWorkOrders() {
        WorkOrder wo = [SELECT Id, Status, Order__c FROM WorkOrder LIMIT 1];
        wo.Status = 'Completed';

        Work_Order_Room__c wor = [SELECT Id FROM Work_Order_Room__c WHERE Work_Order__c = :wo.Id LIMIT 1];
        Product2 product = [SELECT Id FROM Product2 LIMIT 1];
        PricebookEntry pbe = [SELECT Id FROM PricebookEntry WHERE Product2Id = :product.Id LIMIT 1];

        WorkOrderLineItem woli = new WorkOrderLineItem();
        woli.Work_Order_Location__c = wor.Id;
        woli.Product__c = product.Id;
        woli.PricebookEntryId = pbe.Id;
        woli.Status = 'Completed';
        woli.WorkOrderId = wo.Id;
        woli.Requires_Order_Product_to_be_Created__c = true;
        woli.Product_Service_Price_Per_Unit__c = 25.99;

        ServiceAppointment sa = new ServiceAppointment(
                ParentRecordId = wo.Id,
                Status = 'Dispatched',
                EarliestStartTime = System.now(),
                DueDate = System.today().addDays(5)
        );

        Test.setMock(HttpCalloutMock.class, new CongaCalloutMock());

        Test.startTest();

        insert woli;
        insert sa;

        Database.update(wo, false);

        Test.stopTest();
    }

    @IsTest
    static void testActivateNotInvoicingOrderOnCompleteWithoutAllLineItemPOs() {
        Test.setMock(HttpCalloutMock.class, new CongaCalloutMock());

        WorkOrder wo = [SELECT Id, Status, Order__c FROM WorkOrder LIMIT 1];
        wo.Status = 'Completed';
		
        List<Product2> products = [SELECT Id, Family FROM Product2];
        for(Product2 product : products){
            product.Family = 'Pest Control';
        }
        update products;     
        
        Order o = [SELECT Id, Pest_Emergency_Not_Invoicing__c, AccountId FROM Order WHERE Id = :wo.Order__c LIMIT 1];
        o.Pest_Emergency_Not_Invoicing__c = true;
        o.Line_of_Businesses__c = 'Pest Control'; //order update trigger will set this to the order products' LOB so this is probably unnecessary 
        o.Emergency__c = true;
        o.PoNumber = '897893';
        
        Account a = [SELECT Id FROM Account WHERE Id = :o.AccountId];
        a.PO_Required_on_Line_Item__c = true;

        Test.startTest();

        update a;
        update o;

        Database.update(wo, false);

        Test.stopTest();
    }

    @IsTest
    static void testActivateNotInvoicingOrderOnCompleteWithAllLineItemPOs() {
        Test.setMock(HttpCalloutMock.class, new CongaCalloutMock());

        WorkOrder wo = [SELECT Id, Status, Order__c FROM WorkOrder LIMIT 1];
        wo.Status = 'Completed';
        
        List<Product2> products = [SELECT Id, Family FROM Product2];
        for(Product2 product : products){
            product.Family = 'Pest Control';
        }
        update products;

        Order o = [SELECT Id, Pest_Emergency_Not_Invoicing__c, AccountId FROM Order WHERE Id = :wo.Order__c LIMIT 1];
        o.Pest_Emergency_Not_Invoicing__c = true;
        o.Line_of_Businesses__c = 'Pest Control';
        o.Emergency__c = true;
        o.PoNumber = '897893';

        List<OrderItem> items = [SELECT Id, PO_Number__c, Line_of_Business__c FROM OrderItem WHERE OrderId = :o.Id];

        for (OrderItem item : items) {
            item.PO_Number__c = '123';
        }

        update items;

        System.debug(items);

        Account a = [SELECT Id FROM Account WHERE Id = :o.AccountId];
        a.PO_Required_on_Line_Item__c = true;

        Test.startTest();

        update a;
        update o;

        Database.update(wo, false);

        Test.stopTest();
    }

    @IsTest
    static void testActivateNotInvoicingOrderOnCompleteWithPONotRequired() {
        WorkOrder wo = [SELECT Id, Status, Order__c FROM WorkOrder LIMIT 1];
        wo.Status = 'Completed';

        List<Product2> products = [SELECT Id, Family FROM Product2];
        for(Product2 product : products){
            product.Family = 'Pest Control';
        }
        update products;
        
        Order o = [SELECT Id, Pest_Emergency_Not_Invoicing__c, AccountId FROM Order WHERE Id = :wo.Order__c LIMIT 1];
        o.Pest_Emergency_Not_Invoicing__c = true;
        o.Line_of_Businesses__c = 'Pest Control';
        o.Emergency__c = true;

        Account a = [SELECT Id FROM Account WHERE Id = :o.AccountId];
        a.PO_Required_for_Orders__c = null;

        Test.setMock(HttpCalloutMock.class, new CongaCalloutMock());

        Test.startTest();

        update a;
        update o;

        Database.update(wo, false);

        Test.stopTest();
    }

    @IsTest
    static void testValidateServiceAppointmentsAgainstPONumber() {
        WorkOrder wo = [SELECT Id, Status, Order__c FROM WorkOrder LIMIT 1];
        Order o = [SELECT Id, PoNumber FROM Order WHERE Id = :wo.Order__c LIMIT 1];

        o.PoNumber = null;

        ServiceAppointment sa = new ServiceAppointment(
            ParentRecordId = wo.Id,
            Status = 'Scheduled',
            EarliestStartTime = System.now(),
            DueDate = System.today().addDays(5),
            Is_Pest_Emergency__c = true
        );

        Test.startTest();

        insert sa;

        update o;

        sa.Status = 'Dispatched';

        try {
        	update sa;
        } catch (Exception e) {
            System.debug(e);
        }

        Test.stopTest();
    }

    @IsTest
    static void testSetAllServiceAppointmentsToSpecificStatus() {
        WorkOrder wo = [SELECT Id, Status, Order__c FROM WorkOrder LIMIT 1];

        ServiceAppointment sa = new ServiceAppointment(
            ParentRecordId = wo.Id,
            Status = 'Scheduled',
            EarliestStartTime = System.now(),
            DueDate = System.today().addDays(5),
            Is_Pest_Emergency__c = true
        );

        Test.startTest();

        insert sa;

        wo.Is_Work_Order_Valid_for_Reset_SAs__c = true;

        update wo;

        Test.stopTest();
    }

    @IsTest
    static void testDoAllServiceAppointmentStatusesMatch() {
        WorkOrder wo = [SELECT Id FROM WorkOrder LIMIT 1];

        ServiceAppointment sa = new ServiceAppointment(
            ParentRecordId = wo.Id,
            Status = 'Scheduled',
            EarliestStartTime = System.now(),
            DueDate = System.today().addDays(5),
            Is_Pest_Emergency__c = true,
            Status_UnSync_WO_SA__c = false
        );

        Test.startTest();

        insert sa;

        sa.Status = 'Dispatched';

        update sa;

        Test.stopTest();
    }

    @IsTest
    static void testClosePOConfirmationTickets() {
        Order o = [SELECT Id, AccountId, ShipToContactId FROM Order LIMIT 1];

        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();

        Case c = new Case();
        c.AccountId = o.AccountId;
        c.ContactId = o.ShipToContactId;
        c.Pest_Emergency_Order_Draft_Override__c = true;
        c.Origin = 'Web';
        c.Priority = 'Medium';
        c.Type = 'Pest Special';
        c.Status = 'New';
        c.RecordTypeId = fssetting.Ticket_Emergency_Record_Type__c;

        Test.startTest();

        insert c;

        WorkOrderUtil.closePOConfirmationTickets(new Map<Id, Case>{ c.Id => c });

        Test.stopTest();
    }

    @IsTest
    static void testSetWorkOrdersToSpecificStatus() {
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();

        Order o = [SELECT Id, AccountId, ShipToContactId FROM Order LIMIT 1];
        WorkOrder wo = [SELECT Id, Status FROM WorkOrder WHERE Order__c = :o.Id LIMIT 1];

        Test.startTest();

        WorkOrderUtil.setWorkOrdersToSpecificStatus(new Set<Id> { wo.Id }, fssetting.Work_Order_New_Status__c);

        Test.stopTest();
    }

    @IsTest
    static void getRelatedWorkOrders() {
        List<SObject> wos = [SELECT Id, Status FROM WorkOrder LIMIT 1];
        List<SObject> orders = [SELECT Id FROM Order LIMIT 1];

        Set<Id> workOrderIds = ApexUtils.getIdsFromField(wos, 'Id');
        Set<Id> orderIds = ApexUtils.getIdsFromField(orders, 'Id');

        List<Related_Work_Order__c> rwosWorkOrder;
        List<Related_Work_Order__c> rwosWorkOrderList;
        List<Related_Work_Order__c> rwosOrder;

        Test.startTest();
        rwosWorkOrder = WorkOrderUtil.getRelatedWorkOrders(wos[0].Id);
        rwosWorkOrderList = WorkOrderUtil.getRelatedWorkOrders(workOrderIds);
        rwosOrder = WorkOrderUtil.getRelatedWorkOrders(orderIds, false);
        Test.stopTest();

        System.assert(!rwosWorkOrder.isEmpty());
        System.assert(!rwosWorkOrderList.isEmpty());
        System.assert(!rwosOrder.isEmpty());
    }

    @IsTest
    static void getRelatedServiceAppointments() {
        WorkOrder wo = [SELECT Id FROM WorkOrder LIMIT 1];
        List<Related_Work_Order__c> rwos = WorkOrderUtil.getRelatedWorkOrders(wo.Id);

        ServiceAppointment sa = (ServiceAppointment) TestUtils.createSObject(new ServiceAppointment(ParentRecordId = wo.Id), true);

        Map<Id, List<ServiceAppointment>> serviceAppointmentMap;

        Test.startTest();
        serviceAppointmentMap = WorkOrderUtil.getRelatedServiceAppointments(rwos);
        Test.stopTest();

        System.assertEquals(sa.Id, serviceAppointmentMap.get(wo.Id)[0].Id);
    }

    @IsTest
    static void getWorkOrderIdsFromRelatedWorkOrders() {
        WorkOrder wo = [SELECT Id FROM WorkOrder LIMIT 1];

        List<Related_Work_Order__c> rwos = [SELECT Id, WorkOrder__c FROM Related_Work_Order__c WHERE WorkOrder__c = :wo.Id];

        Set<Id> workOrderIds;

        Test.startTest();
        workOrderIds = WorkOrderUtil.getWorkOrderIdsFromRelatedWorkOrders(rwos);
        Test.stopTest();

        List<Id> workOrderIdList = new List<Id>();
        workOrderIdList.addAll(workOrderIds);

        System.assertEquals(1, workOrderIdList.size());
        System.assertEquals(wo.Id, workOrderIdList[0]);
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new Field_Service_Settings__c(), true);
        TestUtils.createSObject(new Emergency_Dispatch_Wizard_Setttings__c(), true);
        TestUtils.createSObject(new Province_Time_Zones_Operating_Hours__c(), true);
        TestUtils.createSObject(new Work_Order_Cannot_Complete_LoBs__c(), true);

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(20);
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();

        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper, false);
        orderWrapper.order.Service_Territory__c = accountWrapper.serviceTerritories[0].Id;
        orderWrapper.order.Emergency__c = true;
        orderWrapper.order.Line_of_Businesses__c = 'Pest Control';

        for(OrderItem item : orderWrapper.orderItems) {
            item.Frequency__c = 'One-Time';
        }

        orderWrapper.doInsert();

        TestUtilsWrapperWorkOrder workOrderWrapper = new TestUtilsWrapperWorkOrder(accountWrapper, orderWrapper, false);
        workOrderWrapper.workOrder.Emergency__c = true;
        workOrderWrapper.workOrder.Line_of_Business__c = 'Pest Control';
        workOrderWrapper.workOrder.Type__c = 'Delivery';
        workOrderWrapper.doInsert();

        TestUtils.createSObject(new Contact(AccountId = accountWrapper.account.Id));
    }

    public class CongaCalloutMock implements HttpCalloutMock {
        private String contentId;

        public CongaCalloutMock() {
            this.contentId = 'test';
        }

        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json;charset=UTF-8');
            res.setBody('{"contentVersionId":"' + contentId + '","entityId"}');
            res.setStatusCode(200);
            return res;
        }
    }
}