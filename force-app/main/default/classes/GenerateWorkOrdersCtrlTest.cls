/**
 * @FileName: GenerateWorkOrdersCtrlTest
 * @Description:
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/1/2020         Created
 *-----------------------------------------------------------
 */
@IsTest
private class GenerateWorkOrdersCtrlTest {
    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void setContentAccount() {
        User u = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        Account a = [SELECT Id FROM Account LIMIT 1];

        GenerateWorkOrdersHelper.ResponseWrapper res;

        PermissionSet generateWorkOrders = [SELECT Id FROM PermissionSet WHERE Name = 'Generate_Work_Orders' LIMIT 1];

        TestUtils.createSObject(new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = generateWorkOrders.Id), true);

        System.runAs(u) {
            Test.startTest();
            res = (GenerateWorkOrdersHelper.ResponseWrapper) JSON.deserialize(GenerateWorkOrdersCtrl.setContent(a.Id), GenerateWorkOrdersHelper.ResponseWrapper.class);
            Test.stopTest();
        }

        System.assertEquals(Label.WO_Generation_Account_Modal_Content, res.content);
        System.assert(res.isValid);
    }

    @IsTest
    static void setContentOrder() {
        User u = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        PermissionSet generateWorkOrders = [SELECT Id FROM PermissionSet WHERE Name = 'Generate_Work_Orders' LIMIT 1];

        TestUtils.createSObject(new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = generateWorkOrders.Id), true);

        GenerateWorkOrdersHelper.ResponseWrapper res;

        System.runAs(u) {
            Order o = [SELECT Id FROM Order LIMIT 1];
            o.Status = 'Activated';
            update o;

            Test.startTest();
            res = (GenerateWorkOrdersHelper.ResponseWrapper) JSON.deserialize(GenerateWorkOrdersCtrl.setContent(o.Id), GenerateWorkOrdersHelper.ResponseWrapper.class);
            Test.stopTest();
        }

        System.assertEquals(Label.WO_Generation_Order_Modal_Content, res.content);
        System.assert(res.isValid);
    }

    @IsTest
    static void generateWorkOrdersAccount() {
        User u = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        Account a = [SELECT Id FROM Account LIMIT 1];

        System.runAs(u) {
            Test.startTest();
            GenerateWorkOrdersCtrl.generateWorkOrders(a.Id);
            Test.stopTest();
        }
    }

    @IsTest
    static void generateWorkOrdersOrder() {
        User u = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        Order o = [SELECT Id FROM Order LIMIT 1];
        o.Status = 'Activated';
        update o;

        System.runAs(u) {
            Test.startTest();
            GenerateWorkOrdersCtrl.generateWorkOrders(o.Id);
            Test.stopTest();
        }
    }

    @IsTest
    static void checkPermissions() {
        Account a = [SELECT Id FROM Account LIMIT 1];

        GenerateWorkOrdersHelper.ResponseWrapper res;

        User u = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        System.runAs(u) {
            Test.startTest();
            res = (GenerateWorkOrdersHelper.ResponseWrapper) JSON.deserialize(GenerateWorkOrdersCtrl.setContent(a.Id), GenerateWorkOrdersHelper.ResponseWrapper.class);
            Test.stopTest();
        }

        System.assertEquals(Label.WO_Generation_Permission_Error, res.content);
        System.assert(!res.isValid);
    }

    @IsTest
    static void checkActiveOrder() {
        User u = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        PermissionSet generateWorkOrders = [SELECT Id FROM PermissionSet WHERE Name = 'Generate_Work_Orders' LIMIT 1];

        TestUtils.createSObject(new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = generateWorkOrders.Id), true);

        GenerateWorkOrdersHelper.ResponseWrapper res;

        System.runAs(u) {
            Order o = [SELECT Id FROM Order LIMIT 1];
            o.Status = 'Draft';
            update o;

            Test.startTest();
            res = (GenerateWorkOrdersHelper.ResponseWrapper) JSON.deserialize(GenerateWorkOrdersCtrl.setContent(o.Id), GenerateWorkOrdersHelper.ResponseWrapper.class);
            Test.stopTest();
        }

        System.assertEquals(Label.WO_Generation_Order_Error, res.content);
        System.assert(!res.isValid);
    }

    @IsTest
    static void checkUnknownRecord() {
        User u = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        ServiceResource sr = [SELECT Id FROM ServiceResource LIMIT 1];

        PermissionSet generateWorkOrders = [SELECT Id FROM PermissionSet WHERE Name = 'Generate_Work_Orders' LIMIT 1];

        TestUtils.createSObject(new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = generateWorkOrders.Id), true);

        GenerateWorkOrdersHelper.ResponseWrapper res;

        System.runAs(u) {
            Test.startTest();
            res = (GenerateWorkOrdersHelper.ResponseWrapper) JSON.deserialize(GenerateWorkOrdersCtrl.setContent(sr.Id), GenerateWorkOrdersHelper.ResponseWrapper.class);
            Test.stopTest();
        }

        System.assertEquals(Label.WO_Generation_Unknown_Modal_Content, res.content);
        System.assert(!res.isValid);
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new Field_Service_Settings__c(), true);

        List<Frequency__c> frequencies = new List<Frequency__c>{
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Weekly', Occurrences_In_Year__c = 52)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Monthly', Occurrences_In_Year__c = 12)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Bi-Monthly', Occurrences_In_Year__c = 6)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Quarterly', Occurrences_In_Year__c = 4)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = '14 Days', Occurrences_In_Year__c = 26))
        };

        insert frequencies;

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(20);
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper);
        TestUtilsWrapperServiceResource resourceWrapper = new TestUtilsWrapperServiceResource(accountWrapper);

        new TestUtilsWrapperServicePlan(
                accountWrapper.account,
                resourceWrapper.serviceResource,
                orderWrapper.orderItems
        );

        User u = (User) TestUtils.createSObject(new User(
                ProfileId = QueryUtils.profileMap.get('Field Service Dispatcher').Id,
                Email = 'testdispatcher@test.com'
        ), true);
    }
}