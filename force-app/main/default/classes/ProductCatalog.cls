public with sharing class ProductCatalog {
    
    public class CartItem {
        @AuraEnabled public OrderItem item { get; set; }
        @AuraEnabled public String imageURL { get; private set;}
        @AuraEnabled public String prodRichText { get; private set;}
        @AuraEnabled public String name { get; private set;}
        @AuraEnabled public Decimal totalPrice { get; set;}
        @AuraEnabled public String pbeId { get; private set;}
        @AuraEnabled public Integer quantity { get; set;}
        @AuraEnabled public Integer prevQuantity { get; set;}
        @AuraEnabled public Id itemId { get; private set; }
        @AuraEnabled public String cartKey { get; set; }
        @AuraEnabled public Decimal discountedPrice { get; set; }
        
        public CartItem(OrderItem item, String prodRichText, String imageURL, String name, Decimal totalPrice, String pbeId, Integer quantity) {
            this.item = item;
            this.imageURL = imageURL;
            this.name = name;
            this.totalPrice = totalPrice;
            this.pbeId = pbeId;
            this.quantity = quantity;
            this.prodRichText = prodRichText;
        }
        
        public CartItem(OrderItem item, String prodRichText, String imageURL, String name, Decimal totalPrice, String pbeId, Integer quantity, String cartkey, Integer prevQuantity) {
            this.item = item;
            this.imageURL = imageURL;
            this.name = name;
            this.totalPrice = totalPrice;
            this.pbeId = pbeId;
            this.quantity = quantity;
            this.cartKey = cartKey;
            this.prodRichText = prodRichText;
            this.prevQuantity = prevQuantity;
        }
    }
    
    public class AuraSelectOption {
        @AuraEnabled
        public String label { get; private set; }
        @AuraEnabled
        public String value { get; private set; }
        
        public AuraSelectOption(String value, String label) {
            this.label = label;
            this.value = value;
        }
        
    }
    
    public class FrequencySelectOption {
        @AuraEnabled
        public AuraSelectOption option { get; private set; }
        @AuraEnabled
        public Decimal discount { get; private set; }
        
        public FrequencySelectOption(AuraSelectOption option, Decimal discount) {
            this.option = option;
            this.discount = discount;
        }
    }
    
    public class pagerWrapper {
        @AuraEnabled public Integer pageSize { get; set; }
        @AuraEnabled public Integer page { get; set; }
        @AuraEnabled public Integer total { get; set; }
        @AuraEnabled public Map<Id, CartItem> entryMap { get; set; }
        @AuraEnabled public List<CartItem> entries { 
            get {
                return entryMap.values();
            }
        }
        @AuraEnabled public boolean queryEnd { get; set; }
        
        public pagerWrapper() {
            entryMap = new Map<Id, CartItem>();
        }
    }
    
    public static Network customerCommunity = [SELECT Id FROM Network WHERE Name ='customer'];
    public static String customerCommunityURL = Network.getLoginUrl(customerCommunity.Id);
    
    @AuraEnabled
    public static List<FrequencySelectOption> getFrequencyOptions() {
        List<FrequencySelectOption> options = new List<FrequencySelectOption>();
        Map<String, Frequency__c> discounts = Frequency__c.getAll();
        System.debug('>>Discounts Line 89: ' + discounts);
        for(Schema.PicklistEntry f : Schema.OrderItem.Frequency__c.getDescribe().getPicklistValues()){
            if(discounts.containsKey(f.getValue())){
            	options.add(new FrequencySelectOption(new AuraSelectOption(f.getValue(), f.getLabel()), discounts.get(f.getValue()).Discount_Percent__c));
            }
        } 
        System.debug('Options ' + options);
        return options;
    }
    
    private static User getUser() {
        Id userId = UserInfo.getUserId();
        return [SELECT Id, ContactId, AccountId, Contact.Name, Account.Name, Account.Site_Survey__c, Account.ServicePricebookId__c FROM User WHERE id=:userId];
    }
    
    private static Id getUserServicePricebookId() {
    	return getUser().Account.ServicePricebookId__c;
    }    
    
    @AuraEnabled
    public static List<AuraSelectOption> getProductFamily(String recordId){
        System.debug('getProductFamily ' + recordId);
        Map<String, Integer> prodCountMap = new Map<String, Integer>();
        List<PricebookEntry> pbEntries = new List<PricebookEntry>();
        
        for(Schema.PicklistEntry v : Schema.Product2.Family.getDescribe().getPicklistValues()){
            prodCountMap.put(v.getValue(), 0); 
        }
        
        User u = getUser(); 
        Boolean isInternal = u.AccountId == null ? true:false; 
        
        Id thePricebook = getUserServicePricebookId();
        if(thePricebook==null && recordId!=null){
            Order o = [SELECT Id, Account.ServicePricebookId__c, AccountId FROM Order WHERE Id=:recordId];
            if(o!=null){
                System.debug('Get products, Order: ' + o);
                thePricebook = o.Account.ServicePricebookId__c;
            }
        }
        System.debug( '*** ProductFamily: ' + thePricebook);
        
        String queryString = 'SELECT ID, Product2.Family, Product2.Display_Record_In_Portal__c, Product2.isConsumable__c, Pricebook2Id FROM PricebookEntry WHERE IsActive=true AND Pricebook2Id=:thePricebook ';
        if(isInternal) {
            queryString = queryString + ' AND Product2.isConsumable__c=TRUE ';
        } else {
            queryString = queryString + ' AND Product2.Display_Record_In_Portal__c=TRUE ';
        }
        pbEntries = Database.query(queryString);
        
        for (PricebookEntry pbe : pbEntries) {        
            Integer count = prodCountMap.get(pbe.Product2.Family);
            prodCountMap.put(pbe.Product2.Family, count + 1);
        }
        
        List<AuraSelectOption> f = new List<AuraSelectOption>();
        
        for(Schema.PicklistEntry v : Schema.Product2.Family.getDescribe().getPicklistValues()){
            f.add(new AuraSelectOption(v.getValue(), v.getLabel() + ' (' + prodCountMap.get(v.getValue()) + ')'));
        }
        return f;
    }
    
    @AuraEnabled 
    public static List<CartItem> getShoppingCart(String recordId){
        Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        System.debug('Apex getShoppingCart Order '+recordId);
        User u = getUser(); 
        Boolean isInternal = u.AccountId == null ? true:false; 
        
        List<OrderItem> orderItems = new List<OrderItem>(); 
        
        List<CartItem> shoppingCart = new List<CartItem>();
        
        if(isInternal) {
            orderItems.addAll([SELECT Id, PriceBookEntryId, PriceBookEntry.Product2.Name, PriceBookEntry.Product2.Display_Record_In_Portal__c, Quantity, TotalPrice, Active__c, PriceBookEntry.Product2.isConsumable__c, 
                               UnitPrice, Frequency__c, OrderId FROM OrderItem WHERE Order.Status !=:dataSets.Order_Active_Stage__c AND PriceBookEntry.Product2.isConsumable__c=TRUE 
                               AND OrderId=:recordId AND Active__c=TRUE /* AND BillToContactID = User's Contact*/]);
        } else {
            orderItems.addAll([SELECT Id, PriceBookEntryId, PriceBookEntry.Product2.Name, PriceBookEntry.Product2.Display_Record_In_Portal__c, Quantity, TotalPrice, Order.AccountId, Active__c,
                               UnitPrice, Frequency__c, OrderId FROM OrderItem WHERE Order.Status =:dataSets.Shopping_Cart_Order_Draft_Stage__c AND PriceBookEntry.Product2.Display_Record_In_Portal__c=TRUE 
                               AND Order.AccountId=:u.AccountId AND Active__c=TRUE /* AND BillToContactID = User's Contact*/]);
        }
        for(OrderItem oi: orderItems)
        {
            shoppingCart.add(new CartItem(
                new OrderItem(
                    Id = oi.Id, 
                    PriceBookEntryId = oi.PriceBookEntryId, 
                    Quantity = oi.Quantity, 
                    UnitPrice = oi.UnitPrice, 
                    Frequency__c = oi.Frequency__c,
                    ServiceDate = Date.today()
                ), 
                null, 
                null,
                oi.PriceBookEntry.Product2.Name, 
                oi.TotalPrice, 
                oi.PriceBookEntryId, 
                Integer.valueOf(oi.Quantity),
                oi.PricebookEntryId + oi.Frequency__c, 
                Integer.valueOf(oi.Quantity)
            ));
        }
        return shoppingCart;
    }
    
    @AuraEnabled
    public static List<CartItem> deleteOrderItem(String theItem, String record) {
        Order ord = (Order)JSON.Deserialize(record, Order.class);
        System.debug(theItem);
        CartItem cItem = (CartItem)JSON.Deserialize(theItem, CartItem.class);
        if(cItem.item.Id!=null) {
            System.debug('DeleteOrder Class: ' + cItem);
            delete [SELECT Id FROM OrderItem WHERE Id=:cItem.item.Id];
        }
        
        List<CartItem> cartItems = getShoppingCart(ord.Id);
        return cartItems;
    }
    
    @AuraEnabled
    public static PagerWrapper getProducts(String searchString, List<String> filterValues, Boolean isSearch, Decimal pageNumber, Boolean isPrevProdSearch, Map<Id, Map<String,OrderItem>> prevProductMap, String recordId){
        Integer pageSize = 8;
        Integer offset = ((Integer)pageNumber - 1) * pageSize;
        System.debug(searchString);
        System.debug(isSearch);
        System.debug('userId ' + UserInfo.getUserId());
        
        List<PriceBookEntry> pList = new List<PriceBookEntry>();
        Set<Id> productIds = new Set<Id>();
        Map<Id, Decimal> priceMap = new Map<Id, Decimal>();
        Map<Id, PricebookEntry> productMap = new Map<Id, PriceBookEntry>();
        User u = getUser();
        Id accountId = u.AccountId;
        Boolean isInternal = accountId == null ? true:false;
        System.debug('Is Internal ' + isInternal);
        
        Field_Service_Settings__c settings = Field_Service_Settings__c.getOrgDefaults();
        
        Id thePricebook = getUserServicePricebookId();
        if(thePricebook==null && recordId!=null){
            Order o = [SELECT Id, Account.ServicePricebookId__c, AccountId FROM Order WHERE Id=:recordId];
            if(o!=null){
                System.debug('Get products, Order: ' + o);
                thePricebook = o.Account.ServicePricebookId__c;
            }
        }
        system.debug( '*** ProductCatalog: ' + thePricebook);
        
        String queryString = 'SELECT Id, IsActive, Pricebook2Id, Product2Id, Product2.Id, Product2.Name, Product2.isConsumable__c, ';
        queryString += 'Product2.Family, Name, Product2.Item_Type__c, Product2.Display_Record_In_Portal__c, Product2.Category_Description__c, ';
        queryString += 'Product2.Product_Image_URL__c, Product2.GL_Title__c, UnitPrice, UseStandardPrice, Product2.Product_Description_Rich_Text__c ';
        
        if(isInternal) {
            queryString += 'FROM PricebookEntry WHERE IsActive=true AND Pricebook2Id=:thePricebook AND Product2.isConsumable__c=TRUE ';
        } else {
            queryString += 'FROM PricebookEntry WHERE IsActive=true AND Pricebook2Id=:thePricebook AND Product2.Display_Record_In_Portal__c=TRUE ';
        }
        
        
        if(!String.isBlank(searchString)) {
            String searchCriteria = '%' + searchString + '%';
            queryString += 'AND (Name LIKE \'' + searchCriteria + '\' OR Product2.Family LIKE \'' + searchCriteria + '\') ';
        }
        
        if (filterValues != null && !filterValues.isEmpty()) {
            queryString += 'AND (Product2.Family = ';
            for(String filter : filterValues)  {
                queryString += '\'' + filter + '\' OR Product2.Family = ';
            }
            queryString = queryString.removeEnd(' OR Product2.Family = ');
            queryString += ') ';
        }
        
        if (isPrevProdSearch && prevProductMap != null) {
            Set<Id> temp = prevProductMap.keySet();
            System.debug('Prev Prod Values from getProducts: ' + prevProductMap.values());
            queryString += 'AND Product2Id IN :temp ';
        }
        
        Integer pageLimit = pageSize + 1;
        queryString += 'ORDER BY Name LIMIT :pageLimit OFFSET :offset';
        
        pList = Database.query(queryString);
        System.debug('** Page Limit ' + pageLimit + ' ** offset ' + offset + ' **size ' + pList.size());
        for(PriceBookEntry p: pList) {
            if(!productIds.contains(p.Product2Id)) {
                productIds.add(p.Product2Id);
                productMap.put(p.Id, p);
            }
        }
        
        PagerWrapper wrap = new PagerWrapper();
        
        if (productMap.size() > pageSize) {
           wrap.queryEnd = false; 
           plist.remove(pageSize);
        }
        else {
            wrap.queryEnd = true;
        }

        for (PriceBookEntry pbe : plist) {
            wrap.entryMap.put(pbe.Id, new CartItem(
                new OrderItem(
                    PriceBookEntryId = pbe.Id, 
                    Quantity = 0, 
                    UnitPrice = pbe.UnitPrice,
                    Frequency__c = settings.Default_Frequency_on_Shopping_Cart__c,
                    ServiceDate = Date.today(),
                    PriceBookEntry = pbe
                ), 
                pbe.Product2.Product_Description_Rich_Text__c,
                pbe.Product2.Product_Image_URL__c, 
                pbe.Product2.Name, 
                0, 
                pbe.Id, 
                1
            ));
        }
        
        wrap.pageSize = pageSize;
        wrap.page = (Integer) pageNumber;
        return wrap;
    }
    
    @AuraEnabled
    public static Order getOrder(String recordId) {
        Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        //dataSets.Shopping_Cart_Order_Record_Type_Id__c
        System.debug('Inside GetOrder, recordId--> ' + recordId);
        User u = getUser();
        Order ord;
        Account acc;
        Id accountId = u.AccountId;
        Boolean isInternal = accountId == null ? true:false;
        System.debug('Is Internal ' + isInternal);
        try {
            if(isInternal) {
                //acc = [SELECT Id, Site_Survey__c FROM Account WHERE Id=:recordId];
                ord = [SELECT Id, ShoppingCartEID__c, Status, RecordTypeId, Order.AccountId, RecordType.Name FROM Order
                       WHERE /*RecordTypeId=:dataSets.Shopping_Cart_Order_Record_Type_Id__c AND*/  Id=:recordId];
            } else {
                ord = [SELECT Id, ShoppingCartEID__c, RecordTypeId, Status, Order.AccountId FROM Order 
                       WHERE ShoppingCartEID__c = :u.ContactId + 'Shopping Cart' AND Status=:dataSets.Shopping_Cart_Order_Draft_Stage__c AND RecordTypeId=:dataSets.Shopping_Cart_Order_Record_Type_Id__c LIMIT 1];
            }
        }
        catch (Exception e) {
            if(!isInternal) {
                ord = new Order(
                    BillToContactId = u.ContactId, 
                    ShipToContactId = u.ContactId, 
                    ShoppingCartEID__c = u.ContactId + 'Shopping Cart', 
                    AccountId = u.AccountId, 
                    Status = dataSets.Shopping_Cart_Order_Draft_Stage__c, 
                    EffectiveDate = Date.today(), 
                    
                    //PriceBook2Id = dataSets.Default_Order_Price_Book_ID__c, 
                    PriceBook2Id = getUserServicePricebookId(),
                    
                    Site_Survey__c = u.Account.Site_Survey__c
                );
            } 
            System.debug('External Order Generated ' + ord);
            System.debug(e.getLineNumber() + ' -- '+e.getMessage());
        }
        System.debug(' Order Returned ' + ord);
        return ord;
        //return null;
    }
    
    @AuraEnabled
    public static Map<Id, Map<String, OrderItem>> getPreviousOrderedProds(String recordId) {
        Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        Map<Id, Map<String, OrderItem>> returnIdMap = new Map<Id, Map<String,OrderItem>>();
        User u = getUser();
        Id accountId = u.AccountId; 
        Boolean isInternal = accountId == null ? true:false;
        System.debug('getPreviousProducts ' + isInternal + ' recordId ' + recordId);
        if(isInternal) {
            Order record = [SELECT Id, AccountId FROM Order WHERE Id=:recordId];
            System.debug(record);
            for (OrderItem oi : [SELECT PriceBookEntry.Product2Id, UnitPrice, Frequency__c, PriceBookEntry.Product2.Display_Record_In_Portal__c, PriceBookEntry.Product2.isConsumable__c, 
                                 Order.AccountId, Active__c FROM OrderItem WHERE Order.AccountId = :record.AccountId AND Order.Status =:dataSets.Order_Active_Stage__c
                                 AND PriceBookEntry.Product2.isConsumable__c=TRUE AND Active__c=TRUE ORDER BY CreatedDate DESC]) 
            {
                System.debug('OrderItem ' + oi);
                /* 
                 * get rid of the limit 50
                 * Last Order Product Product with a recent flag. query is searching for all products with the recent flag or something that makes sense. 
				*/
                Map<String, OrderItem> temp = returnIdMap.get(oi.PriceBookEntry.Product2Id);
                if (temp == null) {
                    temp = new Map<String,OrderItem>();
                    returnIdMap.put(oi.PriceBookEntry.Product2Id, temp);
                }
                temp.put(oi.Frequency__c, oi);
            }
        }else {
            for (OrderItem oi : [SELECT PriceBookEntry.Product2Id, UnitPrice, Frequency__c, PriceBookEntry.Product2.Display_Record_In_Portal__c, Active__c FROM OrderItem 
                                 WHERE Order.CreatedById=:u.Id AND Order.Status!=:dataSets.Order_Active_Stage__c AND PriceBookEntry.Product2.Display_Record_In_Portal__c=TRUE 
                                 AND Active__c=TRUE ORDER BY CreatedDate]) 
            {
                Map<String, OrderItem> temp = returnIdMap.get(oi.PriceBookEntry.Product2Id);
                if (temp == null) {
                    temp = new Map<String,OrderItem>();
                    returnIdMap.put(oi.PriceBookEntry.Product2Id, temp);
                }
                temp.put(oi.Frequency__c, oi);
            }
        }
        System.debug('getPreviousProducts ' + isInternal + ' returnIdMap ' + returnIdMap);
        return returnIdMap;
    }
    
    @AuraEnabled
    public static String getBannerValue() {
        String value = Product_Discounts__c.getOrgDefaults().Banner_Value__c;
        return value;
    }
    
    @AuraEnabled
    public static String getOrderStatus() {
        String value = Field_Service_Settings__c.getOrgDefaults().Order_Active_Stage__c;
        return value;
    }
    
    
    @AuraEnabled
    public static List<CartItem> saveOrder(String o, String items) {
        Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
        Order ord = (Order)JSON.Deserialize(o, Order.class);
        System.debug('Order from Save Order JSON' + o);
        System.debug('Cart Items from Save Order ' + items);
        List<CartItem> cItems = (List<CartItem>)JSON.Deserialize(items, List<CartItem>.class);
        Map<String, Integer> quantityMap = new Map<String, Integer>();
        System.debug(cItems);
        //ord.Status=dataSets.Shopping_Cart_Order_Draft_Stage__c;
        System.debug('Order from Save Order ' + ord);
        //upsert ord;
        User u = getUser(); 
        Boolean isInternal = u.AccountId == null ? true:false;
        List<OrderItem> oItems = new List<OrderItem>();
        Set<Id> existingIds = new Set<Id>();
        /*if(isInternal) {
            List<OrderItem> allOrderItems = new List<OrderItem>([SELECT Id, PriceBookEntryId, PriceBookEntry.Product2.Name, PriceBookEntry.Product2.Display_Record_In_Portal__c, Quantity, TotalPrice, 
                                                                 Active__c, PriceBookEntry.Product2.isConsumable__c, UnitPrice, Frequency__c, OrderId, Related_Product__c FROM OrderItem 
                                                                 WHERE OrderId=:ord.Id AND Active__c=TRUE ]);
        }*/
        System.debug(cItems);
        for (CartItem item : cItems) {
            System.debug('The Item : ' + item);
            oItems.add(new OrderItem(
                Id = item.item.Id, 
                OrderId = ord.Id, 
                Quantity = item.item.Quantity, 
                UnitPrice = item.discountedPrice == null ? item.item.UnitPrice : item.discountedPrice, 
                PriceBookEntryId = item.item.PriceBookEntryId, 
                Frequency__c = item.item.Frequency__c, 
                Purchase_Price__c = item.discountedPrice == null ? item.item.UnitPrice : item.discountedPrice
            ));
            if (item.item.Id != null){
                existingIds.add(item.item.Id);
            }
        }
        System.debug(existingIds);
        if(!isInternal) {
            List<OrderItem> deleteItems = new List<OrderItem>();
            for (OrderItem oi : [SELECT Id, Active__c FROM OrderItem WHERE OrderID = : ord.Id AND Id NOT IN :existingIds]) {
                oi.Active__c = FALSE;
                deleteItems.add(oi);
            }
            System.debug(deleteItems);
            if (!deleteItems.isEmpty()) {
                delete deleteItems;
            }
        }
        System.debug(oItems);
        if (!oItems.isEmpty()) {
            upsert oItems ;//Id;
        }
        
        List<CartItem> cartItems = getShoppingCart(ord.Id);
        
        return cartItems;
        
    }

}