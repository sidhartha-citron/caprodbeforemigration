/**
 * Encapsulates logic for merging an Order into its surviving Order. 
 * (Though, Work Order merging has been broken out into another class -- WorkOrderMerger -- and is invoked from a different batch context).
 * 
 * @author Ahsan Butt
 */
public class OrderMerger {
	private Order srcOrder;
    private Order survivingOrder;
    private List<OrderItem> srcItems;
    private List<IOrderItemFilter> itemFilters;
    
    private boolean doNotProceed;
    private String err;
    
    private List<Order_Item_Location__c> itemLocs;
    private List<Survey_Asset_Location__c> sals;
    private Map<Id, OrderItem> itemLocToSrcItem;
    private Map<Id, OrderItem> salToSrcItem;
    private Map<Id, OrderItem> srcItemToSurvivingItem;
    
    public static List<String> ORDER_ITEM_FILTER_PRODUCT_CODES;
    
    private final static String MERGE_STATUS_FILTERED = 'Filtered';
    private final static String MERGE_STATUS_ERROR = 'Error';
    private final static String MERGE_STATUS_READY_FOR_WO_REPARENTING = 'Ready for Work Order Reparenting';
    
    private final static String ORDER_STATUS_DEACTIVATED = 'Draft';
    private final static String ORDER_STATUS_ACTIVATED = 'Activated';
    
    private final static String ROLLBACK_MAP_DELETE = 'Delete';
    private final static String ROLLBACK_MAP_UPDATE = 'Update';
    private final static String ROLLBACK_MAP_FINAL_UPDATE = 'Final_Update';
    
    private final static String ERR_PREFIX_DEACTIVATE_SURVIVING_ORDER = 'Error deactivating surviving order -- ';
    private final static String ERR_PREFIX_FILTERED_OI = 'Order has an OrderItem that caused it to be filtered -- ';
    private final static String ERR_PREFIX_CLONE_ITEMS = 'Error cloning source Order Item -- '; 
    private final static String ERR_PREFIX_REPARENT_ITEM_LOC = 'Error reparenting Order Item Location -- ';
    private final static String ERR_PREFIX_REPARENT_SAL = 'Error reparenting Survey Asset Location -- '; 

    private final static String ERR_PREFIX_COMPLETE = 'Error completing merge -- ';

    
    public OrderMerger(Order src, Order surviving, List<OrderItem> sItems, List<Survey_Asset_Location__c> salList, List<IOrderItemFilter> iFilters) {
        srcOrder = src;
        survivingOrder = surviving;
        srcItems = sItems != null ? sItems : new List<OrderItem>();
        itemFilters = iFilters != null ? iFilters : new List<IOrderItemFilter>();
        doNotProceed = false;
        
        itemLocToSrcItem = new Map<Id, OrderItem>();
        salToSrcItem = new Map<Id, OrderItem>();
        srcItemToSurvivingItem = new Map<Id, OrderItem>();

        // Iterate over srcItems and get order item locations and sals
        itemLocs = new List<Order_Item_Location__c>();   
        sals = salList != null ? salList : new List<Survey_Asset_Location__c>();
        
        for (OrderItem srcItem : srcItems) {
            for (Order_Item_Location__c itemLoc : srcItem.Order_Item_Locations__r) {
                itemLocs.add(itemLoc);
                itemLocToSrcItem.put(itemLoc.Id, srcItem);
            }
            
            for (Survey_Asset_Location__c sal : sals) {
            	if (sal.Originating_Record_ID__c == srcItem.Id) {
                    salToSrcItem.put(sal.Id, srcItem);
                    break;
                }
        	}
        }

    }
    
    public static void doMerges(List<Order> allSrcOrders, String orderItemFieldSet, List<String> filterClasses, List<String> filterProductCodes) {
        // 1. Deactivate all src orders and set Prevent Invoice Change Ticket flag
        List<Order> srcOrders = deactivateSrcOrders(allSrcOrders);

        // 2. Instantiate filters
        List<IOrderItemFilter> filters = getFilters(filterClasses);
        OrderMerger.ORDER_ITEM_FILTER_PRODUCT_CODES = filterProductCodes;
        
        // Obtain OI fields required by filters
        List<String> filterRequiredFields = new List<String>();
        for (IOrderItemFilter filter : filters) {
            filterRequiredFields.addAll(filter.getFields());
      	}
        
        // 3. Get Order Id -> OI map and Order Id -> List<Survey Asset Location> map
        Map<Id, List<OrderItem>> srcItemsMap = getOrderItems(srcOrders, orderItemFieldSet, filterRequiredFields);
		Map<Id, List<Survey_Asset_Location__c>> salsMap = getSALs(srcOrders);
        
        // 4. Get Surviving Orders, instantiate Order Merge objects, create orderId (whether src or surviving order) -> OrderMerge map
    	Map<Id, Order> survivingOrders = getSurvivingOrders(srcOrders);
        Map<Id, List<OrderMerger>> orderToMergers = instantiateOrderMergers(srcOrders, survivingOrders, srcItemsMap, salsMap, filters);
 
        // Get unique mergers
        Set<OrderMerger> uniqueMergers = new Set<OrderMerger>();
        for (List<OrderMerger> mergers : orderToMergers.values()) {
        	uniqueMergers.addAll(mergers);
        }
        
        // 5. Deactivate surviving orders
       	deactivateSurvivingOrders(survivingOrders.values(), orderToMergers);
        
		// Start merging
		
        // 6. Clone OLIs
        Schema.FieldSet fs = FieldSetUtils.getFieldSet('OrderItem', orderItemFieldSet);
        cloneItems(uniqueMergers, orderToMergers, fs);
        
        // 7. Re-parent Item Locations
        reparentItemLocs(uniqueMergers, orderToMergers);
       
        // 8. Re-parent Survey Asset Locations
        reparentSALs(uniqueMergers, orderToMergers);
        
        // 9. Re-Activate Surviving Orders and Update Source Order Merge Status
		completeMerges(uniqueMergers, orderToMergers);        
        
        // 10. Handle Rollbacks
		handleRollbacks(uniqueMergers);
    }
    
     /* Instance methods */
    
    public void setRollback(String errMsg) {
        doNotProceed = true;
        err = errMsg;
    }
    
    public List<OrderItem> cloneItems(Schema.FieldSet fs) {
        List<OrderItem> clonedItems = new List<OrderItem>();
        
        if (doNotProceed) return clonedItems; // if rollback has been set, return empty list
	
        
        for (OrderItem srcItem : srcItems) {
			System.debug('srcItem:' + srcItem);
            if (filter(srcItem)) {
                // Passed filter, so clone/merge
                OrderItem clonedItem = cloneItem(srcItem, fs, survivingOrder);
                clonedItems.add(clonedItem);
                srcItemToSurvivingItem.put(srcItem.Id, clonedItem);
            } else {
                // Failed the filter, therefore not cloning this order, set rollback
                setRollback(ERR_PREFIX_FILTERED_OI + srcItem.Id);
                return new List<OrderItem>(); // return empty list
            }            
        }
        
        return clonedItems;
    }
    
    public List<Order_Item_Location__c> getOrderItemLocationsToReparent() {
        if (doNotProceed) {
            return new List<Order_Item_Location__c>(); // return empty list
        }
        
        // Re-parent Order Item Locations
        for (Order_Item_Location__c itemLoc : itemLocs) {
            OrderItem srcItem = itemLocToSrcItem.get(itemLoc.Id);
            OrderItem survivingItem = srcItemToSurvivingItem.get(srcItem.Id);
            
            itemLoc.Order__c = survivingItem.OrderId;
            itemLoc.Order_Product__c = survivingItem.Id;
        }
        
        return itemLocs;
    }
    
    public List<Survey_Asset_Location__c> getSalsToReparent() {
        if (doNotProceed) {
            return new List<Survey_Asset_Location__c>(); // return empty list
        }
        
        // Re-parent SALs
        for (Survey_Asset_Location__c sal : sals) {
            OrderItem srcItem = salToSrcItem.get(sal.id);
            OrderItem survivingItem = srcItemToSurvivingItem.get(srcItem.Id);
            
            sal.Originating_Parent_ID__c = survivingItem.OrderId;
            sal.Originating_Record_ID__c = survivingItem.Id;
        }
        
        return sals;
    }

    
    public List<Order> completeMerge() {
        if (doNotProceed) return new List<Order>(); // return empty list
        
        srcOrder.Order_Merge_Job_Status__c = MERGE_STATUS_READY_FOR_WO_REPARENTING;
        srcOrder.Prevent_Invoice_Change_Ticket__c = false;
        srcOrder.Order_Merge_Job_Message__c = '';

        survivingOrder.Status = ORDER_STATUS_ACTIVATED;
        survivingOrder.Prevent_Invoice_Change_Ticket__c = false;
        survivingOrder.Upsert_Date__c = DateTime.now().addMinutes(30);
        
        return new List<Order>{srcOrder, survivingOrder};
    }
    
    public Map<String, List<sObject>> rollback() {
       Map<String, List<sObject>> rollbackMap = new Map<String, List<sObject>>();
       List<sObject> recordsToDelete = new List<sObject>();
       List<sObject> recordsToUpdate = new List<sObject>();
       List<sObject> recordsToUpdateLast = new List<sObject>();
       
        rollbackMap.put(ROLLBACK_MAP_DELETE, recordsToDelete);
        rollbackMap.put(ROLLBACK_MAP_UPDATE, recordsToUpdate);
        rollbackMap.put(ROLLBACK_MAP_FINAL_UPDATE, recordsToUpdateLast);
        
        if (doNotProceed == false) return rollbackMap; // return empty map since doesn't need rollback
        
        // Activate source order, set merge job status and error
        srcOrder.Status = ORDER_STATUS_ACTIVATED;
        srcOrder.Order_Merge_Job_Status__c = MERGE_STATUS_ERROR;
        srcOrder.Order_Merge_Job_Message__c = err;
        srcOrder.Prevent_Invoice_Change_Ticket__c = false;
        
        // Activate surviving order etc.
        survivingOrder.Status = ORDER_STATUS_ACTIVATED;
        survivingOrder.Prevent_Invoice_Change_Ticket__c = false;
     	
        recordsToUpdateLast.add(srcOrder);
        recordsToUpdateLast.add(survivingOrder);
        
        // Revert Order Item Locations to srcItem and srcOrder
        for (Order_Item_Location__c itemLoc : itemLocs) {
            OrderItem srcItem = itemLocToSrcItem.get(itemLoc.Id);
            
            itemLoc.Order__c = srcOrder.Id;
            itemLoc.Order_Product__c = srcItem.Id;
            
            recordsToUpdate.add(itemLoc);
        }
        
        // Revert SALs to srcItem and srcOrder
        for (Survey_Asset_Location__c sal : sals) {
            OrderItem srcItem = salToSrcItem.get(sal.Id);
            
            sal.Originating_Parent_ID__c = srcOrder.Id;
            sal.Originating_Record_ID__c = srcItem.Id;
            
            recordsToUpdate.add(sal);
        }
        
        // Delete all cloned items, if they exist
        if (srcItemToSurvivingItem.values() != null && srcItemToSurvivingItem.values().size() > 0) {
            for (OrderItem oi : srcItemToSurvivingItem.values()) {
                if (oi.Id != null) {
                    recordsToDelete.add(oi);
                }
            }
        }
        
        return rollbackMap;
    }

    private OrderItem cloneItem(OrderItem srcItem, Schema.FieldSet fs, Order survivingOrder) {
        OrderItem cloneItem = new OrderItem();
            
        // Iterate over field set and populate new OrderItem with fields from src item's values
        for (Schema.FieldSetMember fsm : fs.getFields()) {
            String fieldName = fsm.getFieldPath();
            cloneItem.put(fieldName, srcItem.get(fieldName));
        }
        
        // Populate with necessarily different values
        cloneItem.OrderId = survivingOrder.Id;
        cloneItem.Cloned_From_Order_Line__c = srcItem.Id;
        cloneItem.Inventory_Allocated__c = true;
        cloneItem.ServiceDate = survivingOrder.EffectiveDate;
        cloneItem.Active__c = true;
        cloneItem.Last_Automation_Created_Date__c = getLastAutomationCreatedDate(cloneItem, survivingOrder);
        cloneItem.Last_InFlight_WO_Date__c = getLastInFlightWODate(cloneItem, survivingOrder);
        cloneItem.SurveyAssetCountChecker__c = srcItem.SurveyAssetCountChecker__c;
        cloneItem.HasSurveyAssets__c = srcItem.HasSurveyAssets__c;
        
        return cloneItem;
    }
    
    private boolean filter(OrderItem item) {
        for (IOrderItemFilter itemFilter : itemFilters) {
            if (!itemFilter.filter(item)) return false;
        }
        
        return true;
    }
    
    private Date getLastAutomationCreatedDate(OrderItem fallbackOI, Order order) {
       	// If work orders exist, use fallbackOI (srcOI) value
        //if (workOrders != null && workOrders.size() > 0) return fallbackOI.Last_Automation_Created_Date__c;
        
        for (OrderItem oi : order.OrderItems) {
            //if (oi.Product2Id == fallbackOI.Product2Id && oi.Frequency__c == fallbackOI.Frequency__c) {
            if (oi.Frequency__c == fallbackOI.Frequency__c) {
                return oi.Last_Automation_Created_Date__c;
            }
        }
        return fallbackOI.Last_Automation_Created_Date__c;
    }
    
    private Date getLastInFlightWODate(OrderItem fallbackOI, Order order) {
        // If work orders exist, use fallbackOI (srcOI) value
        //if (workOrders != null && workOrders.size() > 0) return fallbackOI.Last_InFlight_WO_Date__c;
        
        for (OrderItem oi : order.OrderItems) {
            //if (oi.Product2Id == fallbackOI.Product2Id && oi.Frequency__c == fallbackOI.Frequency__c) {
            if (oi.Frequency__c == fallbackOI.Frequency__c) {
                return oi.Last_InFlight_WO_Date__c;
            }
        }
        return fallbackOI.Last_InFlight_WO_Date__c;
    }   
    
    /* Static helpers */
    private static List<Order> deactivateSrcOrders(List<Order> all) {
        for (Order o : all) {
            o.Status = ORDER_STATUS_DEACTIVATED;
            o.Prevent_Invoice_Change_Ticket__c = true;
        }
        
        // Try persist
        List<Database.SaveResult> deactivateSrcs = Database.update(all, false);
        List<Order> srcOrders = new List<Order>(); // filtered list
        
        // Return successfully updated orders
        // Filter out those that fail to persist (nothing to be done w/them if they fail at this step)
        for (Integer i = 0; i < deactivateSrcs.size(); i++) {
            Database.SaveResult deactivateSrc = deactivateSrcs.get(i);
            Order o = all.get(i);
          
            if (deactivateSrc.isSuccess()) {
                srcOrders.add(o);
            } 
        }
        
        return srcOrders;
    }
    
    private static Map<Id, Order> getSurvivingOrders(List<Order> srcOrders) {
        Set<Id> survivingIds = new Set<Id>();
        
        for (Order srcOrder : srcOrders) {
            if (srcOrder.surviving_Order__c != null) {
                survivingIds.add(srcOrder.surviving_Order__c);
            }
        }
        
        return new Map<Id, Order>([SELECT Id, Name, EffectiveDate, Upsert_Date__c, (SELECT Id, Product_Name__c, Frequency__c,  Product2Id, Last_Automation_Created_Date__c, Last_InFlight_WO_Date__c FROM OrderItems) 
                FROM Order 
                WHERE Id IN :survivingIds]);
    }
    
    private static List<IOrderItemFilter> getFilters(List<String> filterClasses) {
        if (filterClasses == null || filterClasses.size() == 0) return new List<IOrderItemFilter>();
        
        List<IOrderItemFilter> filters = new List<IOrderItemFilter>();
        for (String filterClass : filterClasses) {
            Type filterType = Type.forName(filterClass);
        	IOrderItemFilter filter = (IOrderItemFilter) filterType.newInstance();
            
            filters.add(filter);
        }
        
        return filters;
    }
    
    private static Map<Id, List<OrderItem>> getOrderItems(List<Order> orders, String fieldSetName, List<String> additionalFields) {
        Map<Id, List<OrderItem>> orderItemMap = new Map<Id, List<OrderItem>>();
            
        // Get all needed fields
        Schema.FieldSet fs = FieldSetUtils.getFieldSet('OrderItem', fieldSetName);
        String fields = FieldSetUtils.getFieldsCommaDelimitedString(fs);
        
        for (String additionalField : additionalFields) {
            if (!fields.containsIgnoreCase(additionalField)) {
                fields += ', ' + additionalField;
            }
        }
        
        if (!fields.containsIgnoreCase('OrderId')) {
            fields += ', OrderId';
        }
        
        if (!fields.containsIgnoreCase('Product2Id')) {
            fields += ', Product2Id';
        }
        
        if (!fields.containsIgnoreCase('HasSurveyAssets__c')) {
            fields += ', HasSurveyAssets__c';
        }
        
        if (!fields.containsIgnoreCase('SurveyAssetCountChecker__c')) {
            fields += ', SurveyAssetCountChecker__c';
        }
        
        // Get order ids
        List<Id> ids = new List<Id>();
        for (Order order : orders) {
            ids.add(order.Id);
        }
        
        // Construct query string
        String query = 'SELECT ' + fields + ', (SELECT Id, Order__c, Order_Product__c FROM Order_Item_Locations__r) FROM OrderItem WHERE OrderId IN :ids';
        
        List<OrderItem> orderItems = Database.query(query);
        
        // Create Order Id -> OrderItem map
        for (OrderItem oi : orderItems) {
            if (orderItemMap.containsKey(oi.OrderId)) {
            	orderItemMap.get(oi.OrderId).add(oi); 
            } else {
                orderItemMap.put(oi.OrderId, new List<OrderItem>{oi});
            }
        }
        
        return orderItemMap;
    }
    
    private static Map<Id, List<Survey_Asset_Location__c>> getSALs(List<Order> orders) {
    	List<Id> orderIds = new List<Id>();
        for (Order o : orders) {
            orderIds.add(o.Id);
        }  
        
        List<Survey_Asset_Location__c> sals = [SELECT Id, Originating_Parent_ID__c, Originating_Record_ID__c FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c IN :orderIds];
		Map<Id, List<Survey_Asset_Location__c>> orderToSALS = new Map<Id, List<Survey_Asset_Location__c>>();
        for (Survey_Asset_Location__c sal : sals) {
			if (orderToSALS.containsKey(sal.Originating_Parent_ID__c)) {
                orderToSALS.get(sal.Originating_Parent_ID__c).add(sal);
            } else {
            	orderToSALS.put(sal.Originating_Parent_ID__c, new List<Survey_Asset_Location__c>{sal}); 
            }          
        }
        
        return orderToSALS;
    }
 
    
    private static void deactivateSurvivingOrders(List<Order> orders, Map<Id, List<OrderMerger>> orderToMergersMap) {
        for (Order o : orders) {
            o.Status = ORDER_STATUS_DEACTIVATED;
            o.Prevent_Invoice_Change_Ticket__c = true;
        }        
        
        // Try persist
        List<Database.SaveResult> deactivateSurvivors = Database.update(orders, false);
        
        // Set roll back on failures
        for (Integer i = 0; i < deactivateSurvivors.size(); i++) {
            Database.SaveResult deactivateResult = deactivateSurvivors.get(i);
            Order o = orders.get(i);
            
            if (!deactivateResult.isSuccess()) {
                for (OrderMerger om : orderToMergersMap.get(o.Id)) {
                	String errMsg = getError(ERR_PREFIX_DEACTIVATE_SURVIVING_ORDER + o.Id, deactivateResult);
                	om.setRollback(errMsg);    
                }
            } 
        }
    } 
    
    private static String getError(String prefix, Database.SaveResult sr) {
        String errMsg = prefix + ': ';
        for (Database.Error err : sr.getErrors()) {
            errMsg += err.getMessage();
        }
        
        return (errMsg.length() > 255) ? errMsg.substring(0, 255) : errMsg;
    }
    
    private static Map<Id, List<OrderMerger>> instantiateOrderMergers(List<Order> srcOrders, Map<Id, Order> survivingOrders, Map<Id, List<OrderItem>> srcItemsMap, Map<Id, List<Survey_Asset_Location__c>> salsMap, List<IOrderItemFilter> filters) {
        Map<Id, List<OrderMerger>> orderToMergers = new Map<Id, List<OrderMerger>>();
        
        for (Integer i = 0; i < srcOrders.size(); i++) {
            Order srcOrder = srcOrders.get(i);
            Order survivingOrder = survivingOrders.get(srcOrder.Surviving_Order__c);
            
            OrderMerger om = new OrderMerger(srcOrder, survivingOrder, srcItemsMap.get(srcOrder.Id), salsMap.get(srcOrder.Id), filters);
            
            // Map src order to merger
            orderToMergers.put(srcOrder.Id, new List<OrderMerger>{om});
            // Also, map surviving order to merger (add to existing list if necessary)
            if (orderToMergers.containsKey(survivingOrder.Id)) {
            	orderToMergers.get(survivingOrder.Id).add(om);    
            } else {
            	orderToMergers.put(survivingOrder.Id, new List<OrderMerger>{om});    
            }
            
        }
        
        return orderToMergers;
    }
    
    private static void cloneItems(Set<OrderMerger> uniqueMergers, Map<Id, List<OrderMerger>> orderToMergers, Schema.FieldSet fs)  {
        List<OrderItem> clonedItems = new List<OrderItem>();
        for (OrderMerger m : uniqueMergers) {
            clonedItems.addAll(m.cloneItems(fs));
        }
        
         // Persist Order Items
        List<Database.SaveResult> oiResults = Database.insert(clonedItems, false);
        
        for (Integer i = 0; i < oiResults.size(); i++) {
            Database.SaveResult oiResult = oiResults.get(i);
            OrderItem oi = clonedItems.get(i);
            
            if (!oiResult.isSuccess()) {
            	// Set rollback
                for (OrderMerger om : orderToMergers.get(oi.OrderId)) {
                    String errMsg = getError(ERR_PREFIX_CLONE_ITEMS + oi.Id, oiResult);
                    om.setRollback(errMsg);
                }
            }
        }
    }
    
    private static void reparentItemLocs(Set<OrderMerger> uniqueMergers, Map<Id, List<OrderMerger>> orderToMergers) {       
        List<Order_Item_Location__c> itemLocsToReparent = new List<Order_Item_Location__c>();
        for (OrderMerger m : uniqueMergers) { 
        	itemLocsToReparent.addAll(m.getOrderItemLocationsToReparent());
        }
          
        List<Database.SaveResult> reparentResults = Database.update(itemLocsToReparent, false);
        
        for (Integer i = 0; i < itemLocsToReparent.size(); i++) {
            Database.SaveResult reparentResult = reparentResults.get(i);
            Order_Item_Location__c itemLoc = itemLocsToReparent.get(i);
          
            if (!reparentResult.isSuccess()) {
                for (OrderMerger om : orderToMergers.get(itemLoc.Order__c)) {
                    String errMsg = getError(ERR_PREFIX_REPARENT_ITEM_LOC + itemLoc.Id, reparentResult);
                    om.setRollback(errMsg);
                }
            }
        }
    }
    
    private static void reparentSALs(Set<OrderMerger> uniqueMergers, Map<Id, List<OrderMerger>> orderToMergers) {
        List<Survey_Asset_Location__c> salsToReparent = new List<Survey_Asset_Location__c>();
        for (OrderMerger m : uniqueMergers) { 
        	salsToReparent.addAll(m.getSalsToReparent());
        }
         
        System.debug('SALS TO REPARENT: ' + salsToReparent);
        
        List<Database.SaveResult> reparentResults = Database.update(salsToReparent, false);
        
        for (Integer i = 0; i < salsToReparent.size(); i++) {
            Database.SaveResult reparentResult = reparentResults.get(i);
            Survey_Asset_Location__c sal = salsToReparent.get(i);
          
            if (!reparentResult.isSuccess()) {
                for (OrderMerger om : orderToMergers.get(sal.Originating_Parent_ID__c)) {
                    String errMsg = getError(ERR_PREFIX_REPARENT_SAL + sal.Id, reparentResult);
                    om.setRollback(errMsg);
                }
            }
        }
    }
   
    
    private static void completeMerges(Set<OrderMerger> uniqueMergers, Map<Id, List<OrderMerger>> orderToMergers) {
        // Initially use a set to ensure no duplicate Orders (in the case a surviving order appears twice)
        Set<Order> ordersToUpdateSet = new Set<Order>();
        
        for (OrderMerger m : uniqueMergers) { 
        	ordersToUpdateSet.addAll(m.completeMerge());
        }
        
        List<Order> ordersToUpdate = new List<Order>();
        ordersToUpdate.addAll(ordersToUpdateSet);

        List<Database.SaveResult> orderResults = Database.update(ordersToUpdate, false);
        
        for (Integer i = 0; i < orderResults.size(); i++) {
            Database.SaveResult orderResult = orderResults.get(i);
            Order order = ordersToUpdate.get(i);
            
            if (!orderResult.isSuccess()) {
                for (OrderMerger om : orderToMergers.get(order.Id)) {
                    String errMsg = getError(ERR_PREFIX_COMPLETE + order.Id, orderResult);
                    om.setRollback(errMsg);    
                }
            }
        }
    }
    
    private static void handleRollbacks(Set<OrderMerger> uniqueMergers) {
        Set<sObject> recordsToDeleteSet = new Set<sObject>();
        Set<sObject> recordsToUpdateSet = new Set<sObject>();
        Set<sObject> recordsToUpdateLastSet = new Set<sObject>();
        
        for (OrderMerger m : uniqueMergers) { 
        	Map<String, List<sObject>> rollbackMap = m.rollback();
            
            recordsToDeleteSet.addAll(rollbackMap.get(ROLLBACK_MAP_DELETE));
            recordsToUpdateSet.addAll(rollbackMap.get(ROLLBACK_MAP_UPDATE));
            recordsToUpdateLastSet.addAll(rollbackMap.get(ROLLBACK_MAP_FINAL_UPDATE));
        }
        
        if (recordsToUpdateSet.size() > 0 ) {
            List<sObject> recordsToUpdate = new List<sObject>();
            recordsToUpdate.addAll(recordsToUpdateSet);
            // Sorting to avoid too many chunks (optimization for db)
            recordsToUpdate.sort();
            List<Database.SaveResult> rollbackUpdate = Database.update(recordsToUpdate, false);
        } 
        
        if (recordsToDeleteSet.size() > 0) {
            List<sObject> recordsToDelete = new List<sObject>();
            recordsToDelete.addAll(recordsToDeleteSet);
            // Sorting to avoid too many chunks (optimization for db)
            recordsToDelete.sort();
        	List<Database.DeleteResult> rollbackDelete = Database.delete(recordsToDelete, false);    
        }
        
        if (recordsToUpdateLastSet.size() > 0 ) {
            List<sObject> recordsToUpdateLast = new List<sObject>();
            recordsToUpdateLast.addAll(recordsToUpdateLastSet);
            // Sorting to avoid too many chunks (optimization for db)
            recordsToUpdateLast.sort();
            List<Database.SaveResult> rollbackFinalUpdate = Database.update(recordsToUpdateLast, false);
        }
    }
    
}