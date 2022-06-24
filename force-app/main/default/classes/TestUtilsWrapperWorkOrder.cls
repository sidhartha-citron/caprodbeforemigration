/**
 * @FileName: TestUtilsWrapperWorkOrder
 * @Description: Wrapper class for default Work Order test data
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/27/2020         Created
 *-----------------------------------------------------------  
 */
public with sharing class TestUtilsWrapperWorkOrder {
    public WorkOrder workOrder;
    public Work_Order_Room__c location;
    public Related_Work_Order__c relatedWorkOrder;
    public List<WorkOrderLineItem> lineItems;

    public TestUtilsWrapperWorkOrder(TestUtilsWrapperAccount accountWrapper, TestUtilsWrapperOrder orderWrapper) {
        this(accountWrapper, orderWrapper, true);
    }

    public TestUtilsWrapperWorkOrder(TestUtilsWrapperAccount accountWrapper, TestUtilsWrapperOrder orderWrapper, Boolean doInsert) {
        createTestData(accountWrapper, orderWrapper, doInsert);
    }

    private void createTestData(TestUtilsWrapperAccount accountWrapper, TestUtilsWrapperOrder orderWrapper, Boolean doInsert) {
        workOrder = (WorkOrder) TestUtils.createSObject(new WorkOrder(
                AccountId = accountWrapper.account.Id,
                Order__c = orderWrapper.order.Id,
                Pricebook2Id = orderWrapper.order.Pricebook2Id,
                ServiceTerritoryId = accountWrapper.account.Service_Territory__c
        ));

        relatedWorkOrder = (Related_Work_Order__c) TestUtils.createSObject(new Related_Work_Order__c(
                Order__c = orderWrapper.order.Id
        ));

        location = (Work_Order_Room__c) TestUtils.createSObject(new Work_Order_Room__c(
                Site_Survey__c = accountWrapper.survey.Id,
                Survey_Location__c = accountWrapper.surveyLocation.Id,
                Name = accountWrapper.surveyLocation.Name,
                Building__c = accountWrapper.surveyLocation.Building__c,
                Floor__c = accountWrapper.surveyLocation.Floor__c,
                Location_Type__c = accountWrapper.surveyLocation.Location_Type__c,
                Location_SubType__c = accountWrapper.surveyLocation.Location_SubType__c
        ));

        lineItems = (List<WorkOrderLineItem>) TestUtils.createSObjectList(
                new WorkOrderLineItem(),
                orderWrapper.orderItems.size()
        );

        for(Integer i = 0; i < lineItems.size(); i++) {
            lineItems[i].Order_Product__c = orderWrapper.orderItems[i].Id;
            lineItems[i].PricebookEntryId = orderWrapper.orderItems[i].Product2Id;
            lineItems[i].Product__c = orderWrapper.surveyAssetLocations[i].Product__c;
        }

        if (doInsert) doInsert();
    }

    public void doInsert() {
        insert workOrder;

        relatedWorkOrder.WorkOrder__c = workOrder.Id;
        insert relatedWorkOrder;

        location.Work_Order__c = workOrder.Id;
        insert location;

        for (WorkOrderLineItem li : lineItems) {
            li.WorkOrderId = workOrder.Id;
            li.Work_Order_Location__c = location.Id;
        }

        insert lineItems;
    }
}