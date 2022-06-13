public class OrderProductHistoryCntl {
    public static Id OrderId {get; set;}
    
    private static Map<String, Schema.SObjectField> oihFieldMap { 
        get {
            if( oihFieldMap == null) {
                oihFieldMap = Schema.getGlobalDescribe().get('OrderItem').getDescribe().fields.getMap();
            }
            return oihFieldMap;
        }
    }        

    @auraEnabled
    public static List<OPHistory> getOrderProductHistory(String orderId, Boolean bFilter)
    {
        // system.debug( '*** ' + orderId + ', ' + bFilter);
         List<OPHistory> listOPHistory = new List<OPHistory>();
         String orderNumber;
         Set<Id> orderProductId = new Set<Id>();
        
        DateTime deactivatedDate = null;
        if( bFilter) {
            Order o = [select Id, LastDeactivatedDate__c, CreatedDate from Order where Id =: orderId limit 1];
			deactivatedDate = o.LastDeactivatedDate__c != null ? o.LastDeactivatedDate__c : o.CreatedDate;
            system.debug( '*** ' + deactivatedDate);
        }

         // create a list of order and order items
         Map<Id, OrderItem> mapOrderItems = new Map<Id, OrderItem>([select id, Product2.Name,Product2Id, Order.OrderNumber, OrderItemNumber  from OrderItem where OrderId = :orderId ]);

         // for those order items get the order history records and create wrapper records
         Set<Id> keys = mapOrderItems.keySet();
         String q = 'SELECT Id,CreatedById,CreatedBy.Name,CreatedDate,Field,NewValue,OldValue,OrderItemId FROM OrderItemHistory where OrderItemid in :keys';
        if( deactivatedDate != null) {
            q+=' and CreatedDate >= :deactivatedDate';
        }
        system.debug('q>>' + q);
        System.debug('keys: ' + mapOrderItems);
		
        List<OrderItemHistory> lsOrderItemHistory = Database.query(q);
        System.debug(lsOrderItemHistory);
         for(OrderItemHistory oiHistory : lsOrderItemHistory) {
            OrderItem oi = mapOrderItems.get(oiHistory.OrderItemId);
            listOPHistory.add(new OPHistory(oiHistory, oi.OrderItemNumber, oi.Product2.Name, oi.Product2Id));
        }

         return listOPHistory;
    } 

    public Class OPHistory {
        @AuraEnabled public DateTime createdDate {get; set;}
        @AuraEnabled public String fieldName {get; set;}
        @AuraEnabled public String orderProductName {get; set;}
        @AuraEnabled public String orderProductId {get; set;}
        @AuraEnabled public String orderNumber {get; set;}
        @AuraEnabled public String originalValue {get; set;}
        @AuraEnabled public String newValue {get; set;}
        @AuraEnabled public String userId {get; set;}
        @AuraEnabled public String userName {get; set;} 
        @AuraEnabled public String orderItemHistoryId {get; set;}

        public OPHistory(OrderItemHistory itemHistory, String orderName, String orderProductName, String orderProductId) {
            this.createdDate = itemHistory.CreatedDate;
            // this.fieldName = itemHistory.Field;
            this.fieldName = itemHistory.Field == 'created' ? 'Created' : oihFieldMap.get( itemHistory.Field).getDescribe().getLabel();   // use label rather than api name
            this.orderProductName = orderProductName;
            this.orderNumber = orderName;
            this.originalValue = String.valueOf(itemHistory.OldValue);
            this.newValue = String.valueOf(itemHistory.NewValue);
            this.userId = itemHistory.CreatedById;
            this.userName = itemHistory.CreatedBy.Name;
            this.orderProductId = orderProductId;
            this.orderItemHistoryId = itemHistory.id;
        }
    }
}