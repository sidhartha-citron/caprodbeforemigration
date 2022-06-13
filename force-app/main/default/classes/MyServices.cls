public class MyServices {
    
    public class PickList {
        @AuraEnabled
        public List<String> caseType { get; set; }
       
        public PickList() {}
        
        public PickList(List<String> caseType) {
            this.caseType = caseType;
        }
    }
    
    public class LineItem {
        @AuraEnabled
        public String ProductName;       
        @AuraEnabled
        public String Quantity; 
        @AuraEnabled
        public String ItemType;
        @AuraEnabled
        public String RelatedProduct;
        @AuraEnabled
        public String RelatedProductId;
        @AuraEnabled
        public String ProductId;
        @AuraEnabled
        public String OrderItemId;
        @AuraEnabled
        public String OrderId;
        @AuraEnabled
        public String OrderNumber;
        @AuraEnabled
        public String Frequency;
        @AuraEnabled
        public String PricebookEntryId;
        @AuraEnabled
        public Boolean displayFreq;
    }
    
    public class ItemMap{
        @AuraEnabled
        public String serviceType;
        @AuraEnabled
        public List<LineItem> itemsMap;
    }
    
    @AuraEnabled
    public static PickList getValues() {
        List<String> t = new List<String>();
        
        for(Schema.PicklistEntry v : Schema.Case.Type.getDescribe().getPicklistValues()){
            t.add(v.getValue());
        } 
        
        PickList values = new PickList(t);        
        return values;
    }
    
    @AuraEnabled 
    public static User getCaseDetails() {
        Id userId = UserInfo.getUserId();
        try{            
           User u = [SELECT ContactId, AccountId, Contact.Name, Account.Name FROM User WHERE Id=:userId];
           return u;  
        }
        catch(Exception e){
            return null;
        }
    }

    
    @AuraEnabled
    public static Map<String,List<LineItem>> getServicesMap(List<String> queryParams, String recordId) {
        System.debug('Entered the init method ' + recordId);
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        Id userId = UserInfo.getUserId();
        List<String> queryParamsServices = queryParams;
        Map<String,List<OrderItem>> mapServices = new Map<String,List<OrderItem>>();
        
        Map<String,List<LineItem>> mapAggregateItems = new Map<String,List<LineItem>>();
        
        

        mapServices.put('Products', new List<OrderItem>());
        mapServices.put('Services', new List<OrderItem>());
        
        try{
            User currentUser = [SELECT Id, AccountId, ContactId, UserType FROM User WHERE Id=:userId];
            Id accountId = currentUser.AccountId;
            Boolean isPortal = accountId!=null ? true: false;
            
            if(isPortal) {
                List<LineItem> lineItems = new List<LineItem>();
                System.debug(accountId);
                Map<String, Order> orderMap = new Map<String, Order>([SELECT Id, OrderNumber, Status, AccountId FROM Order WHERE Status=:fssetting.Order_Active_Stage__c AND AccountId=:accountId]);
                System.debug(orderMap);
                for(AggregateResult ar : [SELECT OrderId orderId, PricebookEntryId pEntry, Product2.Display_Frequency_In_Portal__c displayFreq, Product2.Item_Type__c itemType, Product2.Name name, 
                                          Related_Product__r.Name relatedProd, Frequency__c freq, Active__c active, sum(Quantity) total FROM OrderItem WHERE Order.AccountId=:accountId AND 
                                          Order.Status=:fssetting.Order_Active_Stage__c AND Frequency__c=:fssetting.Non_Recurring_Frequency_Value__c 
                                          AND (Product2.Item_Type__c='Consumables' OR Product2.Item_Type__c=:fssetting.Item_Type_of_Services__c)
                                          GROUP BY OrderId, Product2.Item_Type__c, Product2.Name, PricebookEntryId, Product2.Display_Frequency_In_Portal__c, Related_Product__r.Name, Frequency__c, Active__c
                                          ORDER BY Frequency__c]) 
                {                   
                    String key = String.valueOf(ar.get('itemType'));
                    String key1 = String.valueOf(ar.get('orderId'));
                    LineItem item = createLineItem(key, ar);
                    item.OrderNumber = orderMap.get(key1).OrderNumber;
                    item.displayFreq = Boolean.valueOf(ar.get('displayFreq'));
                    if(mapAggregateItems.containsKey(key)) {
                        mapAggregateItems.get(key).add(item);
                    } else {
                        mapAggregateItems.put(key, new List<LineItem>{item});
                    }
                }
                System.debug(mapAggregateItems);
                
            } else {
                queryParams.add(' Order.AccountId = \'' + recordId + '\'' + ' AND Order.Status = \'Activated\' ' );  
                List<LineItem> lineItems = new List<LineItem>();
                System.debug(recordId);
                Map<String, Order> orderMap = new Map<String, Order>([SELECT Id, OrderNumber, Status, AccountId FROM Order WHERE Status=:fssetting.Order_Active_Stage__c AND AccountId=:recordId]);
                System.debug(orderMap);
                for(AggregateResult ar : [SELECT OrderId orderId, PricebookEntryId pEntry, Product2.Display_Frequency_In_Portal__c displayFreq, Product2.Item_Type__c itemType, Product2.Name name, 
                                          Related_Product__r.Name relatedProd, Frequency__c freq, Active__c active, sum(Quantity) total FROM OrderItem WHERE Order.AccountId=:recordId AND 
                                          Order.Status=:fssetting.Order_Active_Stage__c GROUP BY OrderId, Product2.Item_Type__c, Product2.Name, PricebookEntryId, Product2.Display_Frequency_In_Portal__c, 
                                          Related_Product__r.Name, Frequency__c, Active__c ORDER BY Frequency__c]) 
                {                   
                    String key = String.valueOf(ar.get('itemType'));
                    String key1 = String.valueOf(ar.get('orderId'));
                    LineItem item = createLineItem(key, ar);
                    item.OrderNumber = orderMap.get(key1).OrderNumber;
                    item.displayFreq = true;
                    if(mapAggregateItems.containsKey(key)) {
                        mapAggregateItems.get(key).add(item);
                    } else {
                        mapAggregateItems.put(key, new List<LineItem>{item});
                    }
                }
                System.debug(mapAggregateItems);
            }
         }
     	catch(Exception e){
            System.debug(e.getLineNumber() + ' -- ' + e.getMessage());   
     	}
      return mapAggregateItems;
    }
    
    public static LineItem createLineItem(String itemType, AggregateResult ar) {
        LineItem newItem = new LineItem();
        newItem.ProductName = String.valueOf(ar.get('name'));    
        newItem.Quantity = (ar.get('total')!=null) ? String.valueOf(ar.get('total')).removeEnd('.0') : '0'; 
        newItem.ItemType = (ar.get('itemType')!=null) ? String.valueOf(ar.get('itemType')) : '';   
        newItem.RelatedProduct = (ar.get('relatedProd')!=null) ? String.valueOf(ar.get('relatedProd')) : ''; 
        newItem.PricebookEntryId = (ar.get('pEntry')!=null) ? String.valueOf(ar.get('pEntry')) : ''; 
        newItem.Frequency = (ar.get('freq')!=null) ? String.valueOf(ar.get('freq')) : '';
        return newItem;
    }
    
    @AuraEnabled
    public static String addToCart(String pricebookEntryId) {
        Order o = getOrder();
        try{
            System.debug(o);
            if(o.Id != null) {
                OrderItem newItem = new OrderItem(
                    OrderId = o.Id,
                    ServiceDate = System.today(),
                    Frequency__c='One-Time',
                    PricebookEntryId = pricebookEntryId,
                    Quantity = 1, 
                    UnitPrice = 0.0,
                    Purchase_Price__c = 0.0
                );
                upsert o ShoppingCartEID__c;
                insert newItem;
                System.debug(o);
            }
            return 'Your item has been added to the shopping Cart.';
        } catch(Exception e) {
            System.debug(e);
            return 'There has been an error, Contact Customer Support.';
        }
    }
    
    public static Order getOrder() {
        Id userId = UserInfo.getUserId();
        Field_Service_Settings__c fssetting = Field_Service_Settings__c.getOrgDefaults();
        User u = [SELECT Id, AccountId, ContactId, Account.Site_Survey__c, Account.ServicePricebookId__c FROM User WHERE Id=:userId];
        
        Order ord;
        try {
            ord = [SELECT Id, ShoppingCartEID__c, OrderNumber FROM Order WHERE ShoppingCartEID__c = :u.ContactId + 'Shopping Cart' LIMIT 1];
        }
        catch (Exception e) {
            ord = new Order(
                BillToContactId = u.ContactId, 
                ShoppingCartEID__c = u.ContactId + 'Shopping Cart', 
                AccountId = u.AccountId, 
                Status = fssetting.Shopping_Cart_Order_Draft_Stage__c, 
                EffectiveDate = Date.today(),  
                PriceBook2Id = (ID)u.Account.ServicePricebookId__c,
                Site_Survey__c = u.Account.Site_Survey__c, 
                RecordTypeId=fssetting.Shopping_Cart_Order_Record_Type_Id__c
            );
        }
        return ord;
    }
}