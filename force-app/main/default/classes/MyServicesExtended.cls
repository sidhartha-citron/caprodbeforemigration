/**
 * Controller for 'Order Items' lightning component appearing on Accounts.
 * Retrieves order items across orders for this account and groups them for easy display.
 *
 * @author Ahsan Butt
 */
public class MyServicesExtended {
    private static String KEY_DELIMITER = ':';
    private static String ITEM_TYPE_SERVICE = 'Service';
    private static String ITEM_TYPE_EQUIPMENT = 'Equipment';
	private static List<Frequency__c> validFrequency = new List<Frequency__c>([select id, Name, Occurrences_In_Year__c from Frequency__c]);
    
    @AuraEnabled
    public static ExtendedPickList getValues() {
        List<String> t = new List<String>();
        
        for(Schema.PicklistEntry v : Schema.Case.Type.getDescribe().getPicklistValues()){
            t.add(v.getValue());
        } 
        
        ExtendedPickList values = new ExtendedPickList(t);

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
    public static ExtendedItemMap getServicesMap(List<String> queryParams, String recordId) {
        Id userId = UserInfo.getUserId();
        Map<String,List<OrderItem>> mapServices = new Map<String,List<OrderItem>>();
        
        Map<String,List<ExtendedLineItem>> mapAggregateItems = new Map<String,List<ExtendedLineItem>>();
        Map<String, Decimal> totalPriceMap = new Map<String, Decimal>();
		Contact mainSiteContact;
        
        mapServices.put('Products', new List<OrderItem>());
        mapServices.put('Services', new List<OrderItem>());
    
        try{
            User currentUser = [SELECT Id, AccountId, ContactId, UserType FROM User WHERE Id = :userId];
            Id accountId = currentUser.AccountId;

            if(String.isNotBlank(accountId)) {
                Map<String, Order> orderMap = new Map<String, Order>([
                        SELECT Id, OrderNumber, Status, AccountId
                        FROM Order
                        WHERE Status = :QueryUtils.fieldServiceSettings.Order_Active_Stage__c
                        AND AccountId = :accountId
                ]);

                // Get main site contact for this account
                List<Contact> cons = [
                        SELECT Id, Name, Email, Phone
                        FROM Contact
                        WHERE AccountId =:accountId
                        AND Main_Site_Contact__c = TRUE
                ];

                for (Contact c: cons) {
                    mainSiteContact = c;
                }

                List<AggregateResult> results = [
                        SELECT OrderId orderId, PricebookEntryId pEntry, Product2.Item_Type__c itemType,
                                Product2.Display_Frequency_In_Portal__c displayFreq, Product2.Name name,
                                Related_Product__r.Name relatedProd, Frequency__c freq, Active__c active,
                                SUM(Quantity) total
                        FROM OrderItem
                        WHERE Order.AccountId=:accountId
                        AND Order.Status = :QueryUtils.fieldServiceSettings.Order_Active_Stage__c
                        AND Frequency__c = :QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c
                        AND (Product2.Item_Type__c = 'Consumables'
                        OR Product2.Item_Type__c = :QueryUtils.fieldServiceSettings.Item_Type_of_Services__c)
                        GROUP BY OrderId, Product2.Item_Type__c, Product2.Name, PricebookEntryId, Product2.Display_Frequency_In_Portal__c, Related_Product__r.Name, Frequency__c, Active__c
                        ORDER BY Frequency__c
                ];

                for(AggregateResult ar : results) {
                    String key = String.valueOf(ar.get('itemType'));
                    String key1 = String.valueOf(ar.get('orderId'));

                    ExtendedLineItem item = createLineItem(ar);
                    item.OrderNumber = orderMap.get(key1).OrderNumber;
                    item.displayFreq = Boolean.valueOf(ar.get('displayFreq'));

                    if(mapAggregateItems.containsKey(key)) {
                        mapAggregateItems.get(key).add(item);
                    } else {
                        mapAggregateItems.put(key, new List<ExtendedLineItem>{item});
                    }
                }
            } else {
                queryParams.add(' Order.AccountId = \'' + recordId + '\'' + ' AND Order.Status = \'Activated\' ' );  
                
                // Get main site contact for this account
                List<Contact> cons = [
                        SELECT Id, Name, Email, Phone
                        FROM Contact
                        WHERE AccountId = :recordId
                        AND Main_Site_Contact__c = TRUE
                ];

                for (Contact c: cons) {
                    mainSiteContact = c;
                }

                Map<String, Order> orderMap = new Map<String, Order>([
                        SELECT Id, OrderNumber, Status, AccountId
                        FROM Order
                        WHERE Status = :QueryUtils.fieldServiceSettings.Order_Active_Stage__c
                        AND AccountId = :recordId
                ]);

                // Query for Order Items across Orders for this account
                Map<String, List<OrderItem>> itemMap = new Map<String, List<OrderItem>>();
                Set<Id> orderIds = new Set<Id>();

                List<OrderItem> ois = [
                        SELECT OrderId, PricebookEntryId, Product2.Display_Frequency_In_Portal__c,
                                Product2.Item_Type__c, Product2.Name, Related_Product__r.Name, Frequency__c,
                                FrequencyInDays__c, Active__c, Quantity, Service_Price_Per_Unit__c,
                                Last_Automation_Created_Date__c, Purchase_Price__c, Product_Item_Number__c, 
                    			product2.id, Service_Plan__r.Schedule_Type__r.name
                    	FROM OrderItem
                        WHERE Order.AccountId=:recordId
                        AND Order.Status = :QueryUtils.fieldServiceSettings.Order_Active_Stage__c
                        AND IsActive__c = TRUE
                        ORDER BY Frequency__c
                ];

                for (OrderItem oi : ois) {
                    if (oi.Frequency__c == QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c
                            && (oi.Product2.Item_Type__c == ITEM_TYPE_SERVICE
                                || oi.Product2.Item_Type__c == ITEM_TYPE_EQUIPMENT))
                    {
                         continue; // filter out non-recurring for Service and Equipment products
                    }
                    
                    String key = getAggregateKey(oi);

                    if (itemMap.containsKey(key)) {
                        itemMap.get(key).add(oi);
                    } else {
                        itemMap.put(key, new List<OrderItem>{oi});
                    }

                    orderIds.add(oi.OrderId);
                }

                // Query for Work Orders for the related Orders
                // Create map from Order product id to list of work orders (will be used below)
                Map<Id, List<WorkOrder>> orderProductToWorkOrderMap = new Map<Id, List<WorkOrder>>();

                List<SObject> relatedWorkOrders = [
                        SELECT Id, WorkOrder__c
                        FROM Related_Work_Order__c
                        WHERE Order__c IN :orderIds
                ];

                Set<Id> workOrderIds = ApexUtils.getIdsFromField(relatedWorkOrders, 'WorkOrder__c');

                List<WorkOrder> workOrders = [
                        SELECT Id, StartDate, EndDate, Completed_Date__c, Status,
                                (SELECT Id, Status, Quantity, Order_Product__c
                                FROM WorkOrderLineItems),
                                (SELECT Id, SchedStartTime
                                FROM ServiceAppointments
                                ORDER BY SchedStartTime DESC)
                        FROM WorkOrder
                        WHERE Id IN :workOrderIds
                        ORDER BY StartDate DESC
                ];

                for (WorkOrder wo : workOrders) {
                    // Optimization: store order product Id to list of work orders
                    for (WorkOrderLineItem woli : wo.WorkOrderLineItems) {
                        Id orderProductId = woli.Order_Product__c;

                        if (orderProductToWorkOrderMap.containsKey(orderProductId)) {
                            orderProductToWorkOrderMap.get(orderProductId).add(wo);
                        } else {
                            orderProductToWorkOrderMap.put(orderProductId, new List<WorkOrder>{wo});
                        }
                    }
                }

                // Iterate over order item lists and produce an aggregate result
                for (String key : itemMap.keySet()) {
                    List<OrderItem> items = itemMap.get(key);
                    String orderId = items.get(0).OrderId;
                    String itemType = items.get(0).Product2.Item_Type__c;

                    // Reduce list of order items into a single ExtendedLineItem (i.e., aggregate result)
                    ExtendedLineItem newItem = itemReduce(items, orderProductToWorkOrderMap);
                    newItem.OrderNumber = orderMap.get(orderId).OrderNumber;
                    newItem.displayFreq = true;

                    if (mapAggregateItems.containsKey(itemType)) {
                        mapAggregateItems.get(itemType).add(newItem);
                    } else {
                        mapAggregateItems.put(itemType, new List<ExtendedLineItem>{newItem});
                    }
                } 
                
                // Sort each list of map aggregate items
                for (String itemType : mapAggregateItems.keySet()) {
                    List<ExtendedLineItem> items = mapAggregateItems.get(itemType);
                    items.sort();
                }
            }
        } catch(Exception e){
            System.debug(e.getLineNumber() + ' -- ' + e.getMessage());   
     	}

        // Tally total price per item type, e.g., 'Service' => $100
        for (String key : mapAggregateItems.keySet()) {
            if (key != ITEM_TYPE_SERVICE) continue;

            List<ExtendedLineItem> lineItems = mapAggregateItems.get(key);
            Decimal totalPrice = 0;

            for (ExtendedLineItem item : lineItems) {
                // Only calculate totals for recurring frequency
                if (item.Frequency != QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c) {
                	totalPrice += getTotalPrice(item.priceAggregates);    
                }
            }

            totalPriceMap.put(key, totalPrice);
        }

        ExtendedItemMap itemMap = new ExtendedItemMap();
        itemMap.mapAggregateItems = mapAggregateItems;
        itemMap.mainSiteContact = mainSiteContact;
        itemMap.totalPriceMap = totalPriceMap;
        return itemMap;
    }
    
    private static String getAggregateKey(OrderItem oi) {
        String key = oi.Product2.Item_Type__c + KEY_DELIMITER + oi.OrderId + KEY_DELIMITER + oi.Product2.Name + KEY_DELIMITER + 
                     oi.PricebookEntryId + KEY_DELIMITER + oi.Product2.Display_Frequency_In_Portal__c + KEY_DELIMITER + 
                     oi.Related_Product__r.Name + KEY_DELIMITER + oi.Frequency__c + KEY_DELIMITER + oi.Active__c;
        return key;
    }

    private static ExtendedLineItem itemReduce(List<OrderItem> items, Map<Id, List<WorkOrder>> orderProductToWorkOrderMap)
    {
        ExtendedLineItem newItem = new ExtendedLineItem();
        OrderItem item = items.get(0);
        
        newItem.ProductName = String.valueOf(item.Product2.Name) + ' (' + String.valueOf(item.Product_Item_Number__c) + ')';
        newItem.ItemType = (item.Product2.Item_Type__c != null) ? String.valueOf(item.Product2.Item_Type__c) : '';
        newItem.RelatedProduct = (item.Related_Product__r.Name !=null) ? String.valueOf(item.Related_Product__r.Name) : '';
        newItem.PricebookEntryId = (item.PricebookEntryId != null) ? String.valueOf(item.PricebookEntryId) : ''; 
        newItem.Frequency = (item.Frequency__c !=null) ? String.valueOf(item.Frequency__c ) : '';
        newItem.OrderId = item.OrderId;
        newItem.isFixedWeekly = newItem.Frequency == QueryUtils.fieldServiceSettings.Fixed_Weekly_Service_Frequency_Value__c;

        // Sum quantity
        newItem.Quantity = String.valueOf(getSumQuantity(items)).removeEnd('.0');
        
        //Frequency
        newItem.ServiceFrequencyAggregates = frequencyAggregate(items, item);
        newItem.ServiceFrequency = appendFrequencyAggregate(newItem.ServiceFrequencyAggregates);
        
        //Service price
        newItem.ServicePricePerUnit = filterServicePriceByFrequency(items, item);
        
        // Get Price Aggregates
        newItem.priceAggregates = getPriceAggregates(items);

        // Get Date Aggregates
        newItem.lastServiceAggregates = getLastServiceAggregates(items, orderProductToWorkOrderMap);

        // Generate Cannot Complete aggregates
        newItem.cannotCompleteAggregates = getCannotCompleteAggregates(items, orderProductToWorkOrderMap);

        // Generate Next Service aggregates
        newItem.nextServiceAggregates = getNextServiceAggregates(items, orderProductToWorkOrderMap);

        return newItem;
    }
    
    private static String filterServicePriceByFrequency(List<orderItem> items, orderItem item){
        
        List<String> returnSerivcePrices = new List<String>();
        Set<Decimal> storeValues = new Set<Decimal>();
        String returnString = null;
        Boolean isService = item.Service_Price_Per_Unit__c != null? true : false;
        
        for(orderItem ois: items){
            
            if(ois.Product2.id == item.Product2.id && isService){
                if (!storeValues.contains(ois.Service_Price_Per_Unit__c) && ois.Frequency__c == item.Frequency__c){
                    if(ois.Service_Price_Per_Unit__c != null){
                    	returnSerivcePrices.add('$'+ String.valueOf(ois.Service_Price_Per_Unit__c.setScale(2)));
                    }
                    else{
                        returnSerivcePrices.add('$0'); 
                    }
                    storeValues.add(ois.Service_Price_Per_Unit__c);
                }
            }
            else{
                if (!storeValues.contains(ois.Purchase_Price__c) && ois.Frequency__c == item.Frequency__c){
                    if(ois.Purchase_Price__c != null){
                        returnSerivcePrices.add('$'+ String.valueOf(ois.Purchase_Price__c.setScale(2)));
                    }
                    else {
                        returnSerivcePrices.add('$0');
                    }
                    storeValues.add(ois.Purchase_Price__c);
                }
        	}
        }
        
        for(String s: returnSerivcePrices){
            if(returnString == null){ 
            	returnString = s;
            }
            else{
                returnString = returnString + ', ' + s;
            }
        }
         
        return returnString;
    } 
    
    private static String appendFrequencyAggregate(List<ExtendedServiceFreqAggregate> ServiceFreqAggregate){
        String serviceTypeNames = null;
        
        for(ExtendedServiceFreqAggregate sfn: ServiceFreqAggregate){
            if(serviceTypeNames == null){
                serviceTypeNames = sfn.frequencyName;
            }
            else{
                serviceTypeNames = serviceTypeNames + ', ' + sfn.frequencyName;
            }
        }
		
        return serviceTypeNames;
    }
    
    private static List<ExtendedServiceFreqAggregate> frequencyAggregate(List<orderItem> items, orderItem item){
        List<ExtendedServiceFreqAggregate> extendedFrequencyList = new List<ExtendedServiceFreqAggregate>();
        List<String> freqNames = new List<String>();
        Map<Id, List<String>> freqNameMap = new Map<Id, List<String>>(); 
        
        for(orderItem oi: items){
            
            if(freqNameMap.containsKey(oi.product2.id)){
                if(!freqNameMap.get(oi.product2.id).contains(oi.Service_Plan__r.Schedule_Type__r.name)){
                    List<String> listOfFreq = freqNameMap.get(oi.product2.id);
                    listOfFreq.add(oi.Service_Plan__r.Schedule_Type__r.name);
                    freqNameMap.remove(oi.product2.id);
                    freqNameMap.put(oi.product2.id, listOfFreq);
                }
            }
            else{
                List<String> listOfFreq = new List<String>();
                listOfFreq.add(oi.Service_Plan__r.Schedule_Type__r.name);
                freqNameMap.put(oi.product2.id, listOfFreq);
            }
        }
        
        for(String fq: freqNameMap.get(item.product2.id)){
           ExtendedServiceFreqAggregate extendedFrequency = new ExtendedServiceFreqAggregate();
           extendedFrequency.frequencyName = fq;
           extendedFrequencyList.add(extendedFrequency);
        }
 
        for(ExtendedServiceFreqAggregate esf: extendedFrequencyList){
            freqNames.add(esf.frequencyName);
        }
        
        set<string> aStringSet = new set<string>(freqNames);
        aStringSet.remove(null);
        
        if(aStringSet.isEmpty()){
        	ExtendedServiceFreqAggregate extendedFrequency = new ExtendedServiceFreqAggregate();
           	extendedFrequency.frequencyName = String.valueOf(item.Frequency__c);
            extendedFrequencyList.add(extendedFrequency);
        }
        return extendedFrequencyList;
    }

    private static Double getSumQuantity(List<OrderItem> items) {
        Double sumQuantity = 0;
        for (OrderItem oi : items) {
            if (oi.Quantity != null) {
                sumQuantity += oi.Quantity;
            }
        }
        return sumQuantity;
    }

    private static List<ExtendedPriceAggregate> getPriceAggregates(List<OrderItem> items) {
        // Get Price Aggregates
        // Generate Price Aggregate Map, which maps a price to the number of items at that price
        // e.g., $100 => 5
        Map<Decimal, Decimal> priceAggMap = new Map<Decimal, Decimal>();
         Map<String, Decimal> freqMap = new Map<String, Decimal>(); 
        
        for(Frequency__c freq: validFrequency){
            freqMap.put(freq.Name, freq.Occurrences_In_Year__c);
        }
        
        for (OrderItem oi : items) {
            // Different price logic for Services
            Decimal price;
            if (oi.Product2.Item_Type__c == ITEM_TYPE_SERVICE) {
                Decimal freqInDays = (oi.FrequencyInDays__c != 0 && oi.FrequencyInDays__c != null) ? oi.FrequencyInDays__c : 30;

                if (oi.Quantity != null && oi.Service_Price_Per_Unit__c != null) {
                	if(freqMap.containsKey(oi.Frequency__c)){
                  		price = (freqMap.get(oi.Frequency__c) * oi.Service_Price_Per_Unit__c  * oi.Quantity) /12;
                    }
                    else{
                        // price = (30/freqInDays)*(oi.Quantity * oi.Service_Price_Per_Unit__c); //Used old logic in the event a frequency is not matched
                    	price = 0;
                    }
                }
            } else {
                price = oi.Purchase_Price__c;
            }

            Decimal newQ = priceAggMap.containsKey(price) ? priceAggMap.get(price) + oi.Quantity : oi.Quantity;
            priceAggMap.put(price, newQ);
        }

        // Convert map to list of price aggregates
        List<ExtendedPriceAggregate> priceAggregates = new List<ExtendedPriceAggregate>();

        for (Decimal price : priceAggMap.keySet()) {
            ExtendedPriceAggregate pa = new ExtendedPriceAggregate();
            pa.price = price;
            pa.num = (Integer) priceAggMap.get(price);
            
            priceAggregates.add(pa);
        }

        return priceAggregates;
    }

    private static List<ExtendedLastServiceAggregate> getLastServiceAggregates(
            List<OrderItem> items,
            Map<Id, List<WorkOrder>> orderProductToWorkOrderMap)
    {
        Map<WorkOrder, Integer> lastServiceWorkOrders = new Map<WorkOrder, Integer>();
        Set<Id> orderItemIds = new Set<Id>();

        for (OrderItem oi : items) {
            // Get last work order
            List<WorkOrder> workOrders = orderProductToWorkOrderMap.get(oi.Id);
            
            // Include Work Orders with these statuses
            Set<String> inclusionStatuses = new Set<String>();
            inclusionStatuses.add(QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c);

            WorkOrder wo = getMostRecentWorkOrderForItem(workOrders, inclusionStatuses);
            
            if (wo != null) {
                Decimal newQ = lastServiceWorkOrders.containsKey(wo) ? lastServiceWorkOrders.get(wo) + oi.Quantity : oi.Quantity;
                lastServiceWorkOrders.put(wo, (Integer) newQ);
            }
            orderItemIds.add(oi.Id);
        }
        
        // Create aggregate per work order
        List<ExtendedLastServiceAggregate> aggregates = new List<ExtendedLastServiceAggregate>();
        for (WorkOrder wo : lastServiceWorkOrders.keySet()) {
            Integer num = lastServiceWorkOrders.get(wo);

            ExtendedLastServiceAggregate agg = new ExtendedLastServiceAggregate();
            agg.theDate = wo.Completed_Date__c;
            agg.num = num;
            agg.workOrderId = wo.Id;

            aggregates.add(agg);
        }

        return aggregates;
    }

    private static List<ExtendedCannotCompleteAggregate> getCannotCompleteAggregates(
            List<OrderItem> items,
            Map<Id, List<WorkOrder>> orderProductToWorkOrderMap)
    {    
        Map<Id, WorkOrder> mostRecentWorkOrders = new Map<Id, WorkOrder>();
        Set<Id> orderItemIds = new Set<Id>();

        for (OrderItem oi : items) {
            // Get most recent work order
			List<WorkOrder> workOrders = orderProductToWorkOrderMap.get(oi.Id);
            
            // Statuses to include
            Set<String> includeStatuses = new Set<String>();
            includeStatuses.add(QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c);

            WorkOrder wo = getMostRecentWorkOrderForItem(workOrders, includeStatuses);
            
            if (wo != null && !mostRecentWorkOrders.containsKey(wo.Id)) {
                mostRecentWorkOrders.put(wo.Id, wo);
            }
            orderItemIds.add(oi.Id);
        }

        // Create aggregate per work order
        List<ExtendedCannotCompleteAggregate> aggregates = new List<ExtendedCannotCompleteAggregate>();
        for (Id woId : mostRecentWorkOrders.keySet()) {
            WorkOrder wo = mostRecentWorkOrders.get(woId);

            // Iterate over work order line items
            Decimal cannotComplete = 0;
            Decimal total = 0;
            for (WorkOrderLineItem woli : wo.WorkOrderLineItems) {
                if (!orderItemIds.contains(woli.Order_Product__c)) continue;

                // Tally
                total += woli.Quantity;

                if (woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c) {
                    cannotComplete += woli.Quantity;
                }
            }
            ExtendedCannotCompleteAggregate agg = new ExtendedCannotCompleteAggregate();
            agg.total = (Integer) total;
            agg.cannotComplete = (Integer) cannotComplete;
            agg.workOrderId = woId;

            aggregates.add(agg);
        }

        return aggregates;
    }

    private static List<ExtendedNextServiceAggregate> getNextServiceAggregates(
            List<OrderItem> items, 
            Map<Id, List<WorkOrder>> orderProductToWorkOrderMap)
    {    
        Map<WorkOrder, Integer> closestUpcomingWorkOrders = new Map<WorkOrder, Integer>();
        Set<Id> orderItemIds = new Set<Id>();
        for (OrderItem oi : items) {
            // Get closest upcoming work order
            List<WorkOrder> workOrders = orderProductToWorkOrderMap.get(oi.Id);
            
            // Exclude Work Orders with these statuses
            Set<String> exclusionStatuses = new Set<String>();
            exclusionStatuses.add(QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c);
            exclusionStatuses.add(QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c);
            exclusionStatuses.add(QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c);
            exclusionStatuses.add(QueryUtils.fieldServiceSettings.Work_Order_Missed_Service_Status__c);
            exclusionStatuses.add(QueryUtils.fieldServiceSettings.Work_Order_Rescheduled_Status__c);

            WorkOrder wo = getClosestUpcomingWorkOrderForItem(workOrders, exclusionStatuses);
            
            if (wo != null) {
                Decimal newQ = closestUpcomingWorkOrders.containsKey(wo) ? closestUpcomingWorkOrders.get(wo) + oi.Quantity : oi.Quantity;
                closestUpcomingWorkOrders.put(wo, (Integer) newQ);
            }
            orderItemIds.add(oi.Id);
        }

        // Create aggregate per work order
        List<ExtendedNextServiceAggregate> aggregates = new List<ExtendedNextServiceAggregate>();
        for (WorkOrder wo : closestUpcomingWorkOrders.keySet()) {
            Integer num = closestUpcomingWorkOrders.get(wo);

            ExtendedNextServiceAggregate agg = new ExtendedNextServiceAggregate();
            agg.startDate = wo.StartDate.date();

            if (wo.Status == QueryUtils.fieldServiceSettings.Work_Order_New_Status__c
                    || wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Scheduled_Status__c)
            {
                if (wo.EndDate != null) {
                	agg.endDate = wo.EndDate.date();
                }
            } else {
                ServiceAppointment appt = getClosestUpcomingAppointment(wo.ServiceAppointments);
                if (appt != null && appt.SchedStartTime != null) {
                    agg.startDate = appt.SchedStartTime.date();
                }
            }
            agg.num = num;
            agg.workOrderId = wo.Id;

            aggregates.add(agg);
        }

        return aggregates;
    }

    private static WorkOrder getMostRecentWorkOrderForItem(List<WorkOrder> workOrders, Set<String> statuses) {
        if (workOrders == null) return null;
        
        WorkOrder mostRecentWO = null;
        for (WorkOrder wo : workOrders) {
            // if not correct status or in the future, then skip
			if (!statuses.contains(wo.Status) || wo.Completed_Date__c > Date.today()) continue;
            
            if (mostRecentWO == null || wo.Completed_Date__c > mostRecentWO.Completed_Date__c) {
            	mostRecentWO = wo;
            }
        }

        return mostRecentWO;
    }

    private static WorkOrder getClosestUpcomingWorkOrderForItem(List<WorkOrder> workOrders, Set<String> exclusionStatuses) {
        if (workOrders == null) return null;
        WorkOrder closestFuture;
        for (WorkOrder wo : workOrders) {
            if (exclusionStatuses.contains(wo.Status)) continue;

            // Since sorted on start date descending, if we're no longer in the future, return what we have thus far
            if (wo.StartDate <= Date.today()) {
                return closestFuture;
            }

            closestFuture = wo;
        }

        return closestFuture;
    }
    
    private static ServiceAppointment getClosestUpcomingAppointment(List<ServiceAppointment> appts) {
        if (appts == null || appts.size() == 0) return null;
        
        ServiceAppointment closestUpcoming;
        for (ServiceAppointment appt : appts) {
            if (appt.SchedStartTime <= Date.today()) return closestUpcoming;
            closestUpcoming = appt;
        }
        
        return closestUpcoming;
    }

    private static Decimal getTotalPrice(List<ExtendedPriceAggregate> pas) {
        if (pas == null) return 0;
        
        Decimal totalPrice = 0;
        for (ExtendedPriceAggregate pa : pas) {
            if (pa.price == null || pa.num == null) continue;
            totalPrice += pa.price * pa.num;
        }
        return totalPrice;
    }

    public static ExtendedLineItem createLineItem(AggregateResult ar) {
        ExtendedLineItem newItem = new ExtendedLineItem();
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
            }
            return 'Your item has been added to the shopping Cart.';
        } catch(Exception e) {
            System.debug(e);
            return 'There has been an error, Contact Customer Support.';
        }
    }
    
    public static Order getOrder() {
        Id userId = UserInfo.getUserId();
        User u = [
                SELECT Id, AccountId, ContactId, Account.Site_Survey__c, Account.ServicePricebookId__c 
                FROM User 
                WHERE Id=:userId
        ];
        
        Order ord;
        
        try {
            ord = [
                    SELECT Id, ShoppingCartEID__c, OrderNumber 
                    FROM Order 
                    WHERE ShoppingCartEID__c = :u.ContactId + 'Shopping Cart' 
                    LIMIT 1
            ];
        }
        catch (Exception e) {
            ord = new Order(
                BillToContactId = u.ContactId, 
                ShoppingCartEID__c = u.ContactId + 'Shopping Cart', 
                AccountId = u.AccountId, 
                Status = QueryUtils.fieldServiceSettings.Shopping_Cart_Order_Draft_Stage__c, 
                EffectiveDate = Date.today(),  
                Pricebook2Id = (Id) u.Account.ServicePricebookId__c,
                Site_Survey__c = u.Account.Site_Survey__c, 
                RecordTypeId = QueryUtils.fieldServiceSettings.Shopping_Cart_Order_Record_Type_Id__c
            );
        }
        
        return ord;
    }
}