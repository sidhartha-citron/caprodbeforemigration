/**
 * @FileName: TestUtilsWrapperOrder
 * @Description: Wrapper class for default Order test data
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/7/2020         Created
 *-----------------------------------------------------------  
 */
public with sharing class TestUtilsWrapperOrder {
    public Order order;
    public List<OrderItem> orderItems;
    public List<Survey_Asset_Location__c> surveyAssetLocations;
    public List<Order_Item_Location__c> itemLocations;

    public TestUtilsWrapperOrder(TestUtilsWrapperAccount accountWrapper, TestUtilsWrapperPricebook pricebookWrapper) {
       this(accountWrapper, pricebookWrapper, true);
    }
    
    public TestUtilsWrapperOrder(TestUtilsWrapperAccount accountWrapper, TestUtilsWrapperPricebook pricebookWrapper, Boolean doInsert) {
        createTestData(accountWrapper, pricebookWrapper, doInsert);
    }

    private void createTestData(TestUtilsWrapperAccount accountWrapper, TestUtilsWrapperPricebook pricebookWrapper, Boolean doInsert) {
        List<String> frequencies = pricebookWrapper.products[0].Allowable_Frequencies__c.split(';');

        order = (Order) TestUtils.createSObject(new Order(
                AccountId = accountWrapper.account.Id,
                Site_Survey__c = accountWrapper.survey.Id
        ));
        
        orderItems = (List<OrderItem>)TestUtils.createSObjectList(new OrderItem(), pricebookWrapper.pricebookEntries.size());

        for (Integer i = 0; i < orderItems.size(); i++) {
            orderItems[i].Product2Id = pricebookWrapper.pricebookEntries[i].Id;

            Integer frequencyCount = frequencies.size();

            while(Math.mod(i, frequencyCount) != 0) {
                frequencyCount -= 1;
            }

            orderItems[i].Frequency__c = frequencies[frequencyCount - 1];
        }

        surveyAssetLocations = (List<Survey_Asset_Location__c>) TestUtils.createSObjectList(
                new Survey_Asset_Location__c(
                        Survey_Location__c = accountWrapper.surveyLocation.Id
                ),
                pricebookWrapper.pricebookEntries.size()
        );

        for (Integer i = 0; i < surveyAssetLocations.size(); i++) {
            surveyAssetLocations[i].Product__c = pricebookWrapper.products[i].Id;
            surveyAssetLocations[i].Service_Frequency__c = orderItems[i].Frequency__c;
        }

        itemLocations = (List<Order_Item_Location__c>) TestUtils.createSObjectList(
                new Order_Item_Location__c(),
                pricebookWrapper.pricebookEntries.size()
        );

        if (doInsert) doInsert();
    }
    
    public void doInsert() {
        insert order;

        for (Integer i = 0; i < orderItems.size(); i++) {
            orderItems[i].OrderId = order.Id;
        }

        insert orderItems;

        for (Integer i = 0; i < surveyAssetLocations.size(); i++) {
            surveyAssetLocations[i].Originating_Parent_ID__c = order.Id;
            surveyAssetLocations[i].Site_Survey__c = order.Site_Survey__c;
            surveyAssetLocations[i].Originating_Record_ID__c = orderItems[i].Id;
            surveyAssetLocations[i].Service_Frequency__c = orderItems[i].Frequency__c;
        }

        insert surveyAssetLocations;

        for (Integer i = 0; i < itemLocations.size(); i++) {
            itemLocations[i].Order__c = order.Id;
            itemLocations[i].Order_Product__c = orderItems[i].Id;
            itemLocations[i].Survey_Asset_Location__c = surveyAssetLocations[i].Id;
        }

        insert itemLocations;
    }
}