public class CreateChildOrder {
    
    @AuraEnabled
    public static List<String> createChildOrder(Id recordId) {
        List<String> result = new List<String>{'','','',''};
        List<OrderItem> orderItems = new List<OrderItem>();
        Order newOrder;
        Savepoint sp = Database.setSavepoint();
        try {
            if(recordId != null) {
                System.debug(recordId);
                //Installation_Status__c
                Order record = [SELECT Id, AccountId, Site_Survey__c, OrderNumber, Parent_Order__c, Pricebook2Id, EndDate, EffectiveDate, ShipToContactId, BillToContactId,
                                (SELECT Asset__c, Active__c, Annual__c, Description, PricebookEntryId, Quantity, UnitPrice, Frequency__c, PricebookEntry.Product2.Item_Type__c,
                                 Category__c, Installation_Price__c, Purchase_Price__c, Product_Type__c, Related_Product__c, Service_Price_Per_Unit__c, ServiceDate,
                                 HasSurveyAssets__c, SurveyAssetCountChecker__c, Survey_Location__c, Installation_Status__c FROM OrderItems where Active__c = true)
                                FROM Order WHERE Id=:recordId
                               ];
                if (record != null) {
                    if (record.Parent_Order__c != null) {
                        result[0] = 'Error';
                        result[1] = 'error';
                        result[2] = 'This order is already a child of another order and cannot have a child order.';
                        result[3] = null;
                    } else {
                        newOrder = record.clone(false,true,false,false);
                        newOrder.Status = 'Draft';
                        newOrder.Parent_Order__c = record.Id;
                        insert newOrder;
                        
                        System.debug(newOrder);
                        for(OrderItem oi : record.OrderItems) {
                            OrderItem newItem = oi.clone(false,true,false,false);
                            newItem.ServiceDate = newOrder.EffectiveDate;
                            newItem.OrderId = newOrder.Id;
                            newItem.Parent_Order_Product__c = oi.Id;
                            orderItems.add(newItem);
                        }
                        insert orderItems;
                        
                        System.debug(orderItems);
                        result[0] = 'Success';
                        result[1] = 'success'; 
                        result[2] = 'Order ' + record.OrderNumber + ' has been copied';
                        result[3] = newOrder.Id;
                    }
                }
            } else {
                result[0] = 'Error';
                result[1] = 'error';
                result[2] = 'Action must be related to an order record.';
                result[3] = null;
            }
        } catch(DmlException de) {
            Database.rollback(sp);
            result[0] = 'Error';
            result[1] = 'error';
            result[2] = de.getMessage() + ' No New Orders generated';
            result[3] = null;
            System.debug(de);
        } catch(Exception e) {
            Database.rollback(sp);
            result[0] = 'Error';
            result[1] = 'error';
            result[2] = 'An unexpected error has occured. Please refresh your page. No New Orders generated';
            result[3] = null;
            System.debug(e);
        }
        
        return result;
    }

}