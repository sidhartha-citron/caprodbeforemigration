/**
 * @FileName: ServicePlanCtrlTest
 * @Description: Test methods for ServicePlanCtrl
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       12/10/2019         Created
 *-----------------------------------------------------------  
 */
@IsTest
private class ServicePlanCtrlTest {
    private static Integer NUM_OF_PRODUCTS = 20;

    @TestSetup
    static void setupTest() {
        setupHelper();
    }

    @IsTest
    static void checkPermissionsNone() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        String permissionLevel;

        System.runAs(testUser) {
            Test.startTest();
            permissionLevel = ServicePlanCtrl.checkPermissions();
            Test.stopTest();
        }

        System.assertEquals('None', permissionLevel);
    }

    @IsTest
    static void checkPermissionsReadOnly() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];
        PermissionSet readOnly = [SELECT Id FROM PermissionSet WHERE Name = 'Service_Plan_Manager_Read_Only' LIMIT 1];

        TestUtils.createSObject(new PermissionSetAssignment(AssigneeId = testUser.Id, PermissionSetId = readOnly.Id), true);

        String permissionLevel;

        System.runAs(testUser) {
            Test.startTest();
            permissionLevel = ServicePlanCtrl.checkPermissions();
            Test.stopTest();
        }

        System.assertEquals('Read Only', permissionLevel);
    }

    @IsTest
    static void checkPermissionsReadWrite() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];
        PermissionSet readWrite = [SELECT Id FROM PermissionSet WHERE Name = 'Service_Plan_Manager_Read_Write' LIMIT 1];

        TestUtils.createSObject(new PermissionSetAssignment(AssigneeId = testUser.Id, PermissionSetId = readWrite.Id), true);

        String permissionLevel;

        System.runAs(testUser) {
            Test.startTest();
            permissionLevel = ServicePlanCtrl.checkPermissions();
            Test.stopTest();
        }

        System.assertEquals('Read/Write', permissionLevel);
    }

    @IsTest
    static void getAccountData() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];
        Account a = [SELECT Id FROM Account LIMIT 1];

        ServicePlanCtrlHelper.DataWrapper wrapper;

        System.runAs(testUser){
            Test.startTest();
            wrapper = (ServicePlanCtrlHelper.DataWrapper)
                    JSON.deserialize(ServicePlanCtrl.getAccountData(a.Id), ServicePlanCtrlHelper.DataWrapper.class);
            Test.stopTest();
        }

        String jobTypes = JSON.serialize(ApexUtils.getFieldPicklistValues('Service_Plan__c', 'Job_Type__c', true));
        String linesOfBusiness = JSON.serialize(ApexUtils.getFieldPicklistValues('Service_Plan__c', 'Line_of_Business__c', true));

        List<ApexUtils.OptionWrapper> frequencies = new List<ApexUtils.OptionWrapper>();

        for(ApexUtils.OptionWrapper option : ApexUtils.getFieldPicklistValues('Service_Plan__c', 'Frequency__c', true)) {
            if(option.key != 'One-Time') frequencies.add(option);
        }

        String frequencyString = JSON.serialize(frequencies);

        System.assertEquals(jobTypes, JSON.serialize(wrapper.picklistOptions.jobTypes), 'Job type picklist values should match');
        System.assertEquals(linesOfBusiness, JSON.serialize(wrapper.picklistOptions.linesOfBusiness), 'Line of business picklist values should match');
        System.assertEquals(frequencyString, JSON.serialize(wrapper.picklistOptions.frequencies), 'Frequency picklist values should match');
    }

    @IsTest
    static void getAccountDataError() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        String errorMessage;

        System.runAs(testUser){
            Test.startTest();
            try {
                ServicePlanCtrl.getAccountData('Error');
            } catch(Exception e) {
                errorMessage = e.getMessage();
            }
            Test.stopTest();
        }

        System.assert(String.isNotBlank(errorMessage));
    }

    @IsTest
    static void getServicePlan() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        Service_Plan__c plan;

        System.runAs(testUser) {
            Test.startTest();
            plan = (Service_Plan__c) JSON.deserialize(ServicePlanCtrl.getServicePlan(), Service_Plan__c.class);
            Test.stopTest();
        }

        System.assertNotEquals(null, plan);
    }

    @IsTest
    static void getOrderItemsAutoAssignRecurringService() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        Account a = [SELECT Id FROM Account LIMIT 1];
        Service_Plan__c sp = [
                SELECT Id, Job_Type__c, Line_of_Business__c, Frequency__c,
                (SELECT Id
                FROM Order_Products__r)
                FROM Service_Plan__c
                LIMIT 1
        ];

        Integer assignedItemsBefore = sp.Order_Products__r.size();

        for(OrderItem item : sp.Order_Products__r) {
            item.Service_Plan__c = null;
        }

        update sp.Order_Products__r;

        ServicePlanCtrlHelper.FilterWrapper wrapper = new ServicePlanCtrlHelper.FilterWrapper();
        wrapper.dataWrapper = new ServicePlanCtrlHelper.DataWrapper(a.Id);
        wrapper.variety = 'Auto Assign';
        wrapper.accountId = a.Id;
        wrapper.servicePlanId = sp.Id;
        wrapper.jobType = sp.Job_Type__c;
        wrapper.lineOfBusiness = sp.Line_of_Business__c;
        wrapper.frequency = sp.Frequency__c;

        Map<String,ServicePlanAssetWrapper> filteredAssets;

        System.runAs(testUser){
            Test.startTest();
            filteredAssets = (Map<String,ServicePlanAssetWrapper>) JSON.deserialize(
                    ServicePlanCtrl.getOrderItems(JSON.serialize(wrapper)),
                    Map<String,ServicePlanAssetWrapper>.class
            );
            Test.stopTest();
        }

        Integer availableItemsAfter = 0;

        for(ServicePlanAssetWrapper assetWrapper : filteredAssets.values()) {
            availableItemsAfter += assetWrapper.items.size();
        }

        System.assertEquals(assignedItemsBefore, availableItemsAfter);
    }

    @IsTest
    static void getOrderItemsError() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        String errorMessage;

        System.runAs(testUser){
            Test.startTest();
            try {
                ServicePlanCtrl.getOrderItems('Error');
            } catch(Exception e) {
                errorMessage = e.getMessage();
            }
            Test.stopTest();
        }

        System.assert(String.isNotBlank(errorMessage));
    }

    @IsTest
    static void checkForDuplicateServicePlan() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        Service_Plan__c sp = [SELECT Id, Route__c, Account__c, Job_Type__c, Line_of_Business__c, Frequency__c, Schedule_Type__c FROM Service_Plan__c LIMIT 1];

        ServicePlanCtrlHelper.ServicePlanWrapper wrapper = new ServicePlanCtrlHelper.ServicePlanWrapper();
        wrapper.servicePlan = sp.clone(false, true);

        List<Service_Plan__c> plans;

        System.runAs(testUser){
            Test.startTest();
            plans = (List<Service_Plan__c>) JSON.deserialize(
                    ServicePlanCtrl.checkForDuplicateServicePlans(JSON.serialize(wrapper)),
                    List<Service_Plan__c>.class
            );
            Test.stopTest();
        }

        System.assert(!plans.isEmpty());
    }

    @IsTest
    static void checkForDuplicateServicePlansError() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        String errorMessage;

        System.runAs(testUser){
            Test.startTest();
            try {
                ServicePlanCtrl.checkForDuplicateServicePlans('Error');
            } catch(Exception e) {
                errorMessage = e.getMessage();
            }
            Test.stopTest();
        }

        System.assert(String.isNotBlank(errorMessage));
    }

    @IsTest
    static void upsertServicePlanKeyFieldChange() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        Service_Plan__c sp = [
                SELECT Id, Job_Type__c, Line_of_Business__c, Frequency__c, Account__c, Route__c,
                (SELECT Id
                FROM Order_Products__r)
                FROM Service_Plan__c
                LIMIT 1
        ];

        ServicePlanCtrlHelper.ServicePlanWrapper wrapper = new ServicePlanCtrlHelper.ServicePlanWrapper();
        wrapper.servicePlan = sp;
        wrapper.assets = new List<ServicePlanAssetWrapper>();
        wrapper.keyFieldChange = true;

        System.runAs(testUser){
            Test.startTest();
            ServicePlanCtrl.upsertServicePlan(JSON.serialize(wrapper));
            Test.stopTest();
        }

        List<OrderItem> itemsAfter = [SELECT Id FROM OrderItem WHERE Service_Plan__c = :sp.Id];

        System.assert(!sp.Order_Products__r.isEmpty());
        System.assert(itemsAfter.isEmpty());
    }

    @IsTest
    static void upsertServicePlanItemDeselected() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        Account a = [SELECT Id FROM Account LIMIT 1];
        Service_Plan__c sp = [
                SELECT Id, Job_Type__c, Line_of_Business__c, Frequency__c, Account__c, Route__c,
                (SELECT Id
                FROM Order_Products__r)
                FROM Service_Plan__c
                LIMIT 1
        ];

        ServicePlanCtrlHelper.FilterWrapper filterWrapper = new ServicePlanCtrlHelper.FilterWrapper();
        filterWrapper.dataWrapper = new ServicePlanCtrlHelper.DataWrapper(a.Id);
        filterWrapper.variety = 'Manage';
        filterWrapper.accountId = a.Id;
        filterWrapper.servicePlanId = sp.Id;
        filterWrapper.jobType = sp.Job_Type__c;
        filterWrapper.lineOfBusiness = sp.Line_of_Business__c;
        filterWrapper.frequency = sp.Frequency__c;

        Map<String,ServicePlanAssetWrapper> filteredAssets = (Map<String,ServicePlanAssetWrapper>) JSON.deserialize(
                ServicePlanCtrl.getOrderItems(JSON.serialize(filterWrapper)),
                Map<String,ServicePlanAssetWrapper>.class
        );

        filteredAssets.values()[0].items[0].selected = false;

        ServicePlanCtrlHelper.ServicePlanWrapper wrapper = new ServicePlanCtrlHelper.ServicePlanWrapper();
        wrapper.servicePlan = sp;
        wrapper.assets = filteredAssets.values();
        wrapper.keyFieldChange = true;

        System.runAs(testUser){
            Test.startTest();
            ServicePlanCtrl.upsertServicePlan(JSON.serialize(wrapper));
            Test.stopTest();
        }

        List<OrderItem> itemsAfter = [SELECT Id, Service_Plan__c FROM OrderItem WHERE Id IN :sp.Order_Products__r AND Service_Plan__c = NULL];

        System.assertEquals(1, itemsAfter.size());
    }

    @IsTest
    static void upsertServicePlanError() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        String errorMessage;

        System.runAs(testUser){
            Test.startTest();
            try {
                ServicePlanCtrl.upsertServicePlan('Error');
            } catch(Exception e) {
                errorMessage = e.getMessage();
            }
            Test.stopTest();
        }
    }

    @IsTest
    static void assignOrderItems() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        Account a = [SELECT Id FROM Account LIMIT 1];
        Service_Plan__c sp = [
                SELECT Id, Job_Type__c, Line_of_Business__c, Frequency__c,
                (SELECT Id
                FROM Order_Products__r)
                FROM Service_Plan__c
                LIMIT 1
        ];

        ServicePlanCtrlHelper.FilterWrapper wrapper = new ServicePlanCtrlHelper.FilterWrapper();
        wrapper.dataWrapper = new ServicePlanCtrlHelper.DataWrapper(a.Id);
        wrapper.variety = 'Manage';
        wrapper.accountId = a.Id;
        wrapper.servicePlanId = sp.Id;
        wrapper.jobType = sp.Job_Type__c;
        wrapper.lineOfBusiness = sp.Line_of_Business__c;
        wrapper.frequency = sp.Frequency__c;

        Map<String,ServicePlanAssetWrapper> filteredAssets = (Map<String,ServicePlanAssetWrapper>) JSON.deserialize(
                ServicePlanCtrl.getOrderItems(JSON.serialize(wrapper)),
                Map<String,ServicePlanAssetWrapper>.class
        );

        for(OrderItem item : sp.Order_Products__r) {
            item.Service_Plan__c = null;
        }

        update sp.Order_Products__r;

        System.runAs(testUser){
            Test.startTest();
            ServicePlanCtrl.assignOrderItems(JSON.serialize(filteredAssets.values()));
            Test.stopTest();
        }

        List<OrderItem> itemsAfter = [SELECT Id, Service_Plan__c FROM OrderItem WHERE Id IN :sp.Order_Products__r];

        Boolean itemsAssigned = true;

        for(OrderItem oi : itemsAfter) {
            if(oi.Service_Plan__c != sp.Id) itemsAssigned = false;
        }

        System.assert(itemsAssigned);
    }

    @IsTest
    static void assignOrderItemsError() {
        User testUser = [SELECT Id FROM User WHERE Email = 'testdispatcher@test.com'];

        String errorMessage;

        System.runAs(testUser){
            Test.startTest();
            try {
                ServicePlanCtrl.assignOrderItems('Error');
            } catch(Exception e) {
                errorMessage = e.getMessage();
            }
            Test.stopTest();
        }
    }

    // HELPER METHODS
    static void setupHelper() {
        TestUtils.createSObject(new User(
                ProfileId = QueryUtils.profileMap.get('Field Service Dispatcher').Id,
                Email = 'testdispatcher@test.com'
        ), true);

        TestUtils.createSObject(new Field_Service_Settings__c(), true);

        List<Frequency__c> frequencies = new List<Frequency__c>{
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Weekly', Occurrences_In_Year__c = 52)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Monthly', Occurrences_In_Year__c = 12)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Bi-Monthly', Occurrences_In_Year__c = 6)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = 'Quarterly', Occurrences_In_Year__c = 4)),
                (Frequency__c) TestUtils.createSObject(new Frequency__c(Name = '14 Days', Occurrences_In_Year__c = 26))
        };

        insert frequencies;

        TestUtilsWrapperPricebook pricebookWrapper = new TestUtilsWrapperPricebook(NUM_OF_PRODUCTS);
        TestUtilsWrapperAccount accountWrapper = new TestUtilsWrapperAccount();
        TestUtilsWrapperOrder orderWrapper = new TestUtilsWrapperOrder(accountWrapper, pricebookWrapper);
        TestUtilsWrapperServiceResource resourceWrapper = new TestUtilsWrapperServiceResource(accountWrapper);
        new TestUtilsWrapperServicePlan(accountWrapper.account, resourceWrapper.serviceResource, orderWrapper.orderItems);
    }
}