/**
 * Encapsulates logic for merging Work Orders to their parent order's Surviving Order.
 * (Related to OrderMerger functionality)
 * 
 * @author Ahsan Butt
 */
public class WorkOrderMerger {
    private WorkOrder wo;
    private List<WorkOrderLineItem> wolis;
    public Id sourceOrder;
    private Map<Id, Id> woliToSrcOI;
    private Map<Id, OrderItem> woliToSurvivingOI;
    private boolean doNotProceed;
    public String err;
    
    private static final String ERR_PREFIX_REPARENT_WO = 'Error reparenting work order -- ';
    private static final String ERR_PREFIX_REPARENT_WOLI = 'Error reparenting work order line item -- ';
    
    private final static String MERGE_STATUS_PROCESSED = 'Processed';
    
    public WorkOrderMerger(WorkOrder wOrder, Map<Id, OrderItem> allWoliToSurviving) {
    	wo = wOrder;
        wolis = new List<WorkOrderLineItem>();
        sourceOrder = wo.Order__c;
        woliToSrcOI = new Map<Id, Id>();
        woliToSurvivingOI = new Map<Id, OrderItem>();
        doNotProceed = false;
        
        for (WorkOrderLineItem woli : wo.WorkOrderLineItems) {
            if (woli.Order_Product__c == null) continue; // skip, if Order Product deleted
            wolis.add(woli);
        }
        
        // Populate woli -> src Order Item map (needed in case of a rollback) and
        // Populate woli -> surviving Order Item map (needed for merge)
        for (WorkOrderLineItem woli : wolis) {
            woliToSrcOI.put(woli.Id, woli.Order_Product__c);
            woliToSurvivingOI.put(woli.Id, allWoliToSurviving.get(woli.Id));
        }
        
    }
    
    public static void doMerges(List<WorkOrder> wos) {
        // 1. Retrieve 'Surviving' Order Items and generate map from WOLI -> Surviving OI
        List<Id> srcOrderItems = new List<Id>();
        List<WorkOrderLineItem> allWOLIs = new List<WorkOrderLineItem>();
        for (WorkOrder wo : wos) {
            for (WorkOrderLineItem woli : wo.WorkOrderLineItems) {
                if (woli.Order_Product__c == null) continue; //OI has probably been deleted at some point
                srcOrderItems.add(woli.Order_Product__c);
                allWOLIs.add(woli);
            }
        }
        
        Map<Id, OrderItem> woliToSurvivingOI = getSurvivingOIs(allWOLIs, srcOrderItems);
        
        // 2. Instantiate Work Order Mergers -- generate wo -> Merger map and woli -> Merger map
        Map<Id, WorkOrderMerger> woToMerger = new Map<Id, WorkOrderMerger>();
        Map<Id, WorkOrderMerger> woliToMerger = new Map<Id, WorkOrderMerger>();
        for (WorkOrder wo : wos) {
            WorkOrderMerger wom = new WorkOrderMerger(wo, woliToSurvivingOI);
            
            woToMerger.put(wo.Id, wom);
            
            for (WorkOrderLineItem woli : wo.WorkOrderLineItems) {
                woliToMerger.put(woli.Id, wom);
            }
        }
        
        // 3. Do reparenting
        reparent(wos, woToMerger, woliToMerger);
            
        // 4. Handle Rollbacks
		handleRollbacks(wos, woToMerger);		
        
        // 5. Update src Order merge job status (and job msg, if any errors)
        updateSourceOrders(wos, woToMerger);
    }
    
    /* Instance methods */
    
    public void setRollback(String errMsg) {
        doNotProceed = true;
        err = errMsg;
    }
    
    public List<sObject> reparent() {
        if (doNotProceed) {
            return new List<sObject>(); // return empty list
        }
        
        System.debug('--WO REPARENT--');
        System.debug('wo:' + wo);
        System.debug('woliToSurvivingOI: ' + woliToSurvivingOI);
        
       	List<sObject> allObjs = new List<sObject>(); 
        
        // Reparent work order to surviving order
        wo.Order__c = wo.Order__r.Surviving_Order__c;
        
        // reparent WOLI to surviving order item (and also set its order to surviving order)
        for (WorkOrderLineItem woli : wolis) {
            
            System.debug('woli: ' + woli);
            
            woli.OrderId = wo.Order__c;
            if (woli.Order_Product__c != null && woliToSurvivingOI.containsKey(woli.Id)) {
                woli.Order_Product__c = woliToSurvivingOI.get(woli.Id).Id;    
            }
            
            allObjs.add(woli);
            
        }
        allObjs.add(wo);

       
        return allObjs;
    }
    
    private List<sObject> rollback() {
        if (doNotProceed == false) {
            return new List<sObject>(); // return empty list
        }
        
       	List<sObject> allObjs = new List<sObject>(); 
        
        // Reparent work order back to src order
        wo.Order__c = sourceOrder;
       
        // reparent WOLI to src order item (and also set its order back to sourceOrder order) 
        for (WorkOrderLineItem woli : wolis) {
            woli.OrderId = wo.Order__c;
            if (woli.Order_Product__c != null && woliToSrcOI.containsKey(woli.Id)) {
                woli.Order_Product__c = woliToSrcOI.get(woli.Id);    
            }
            
            allObjs.add(woli);
            
        }
        allObjs.add(wo);

        return allObjs;        
    }
    
    /* Static helpers */
    private static Map<Id, OrderItem> getSurvivingOIs(List<WorkOrderLineItem>  wolis, List<Id> srcOrderItems) {
        Map<Id, OrderItem> woliToSurvivingOI = new Map<Id, OrderItem>();
        
        // Generate a map from srcOI (which is on the woli) -> Surviving OI
        System.debug('--SRC ORDER ITEMS--');
        System.debug(srcOrderItems);
        List<OrderItem> survivingOIs = [SELECT Id, Cloned_From_Order_Line__c FROM OrderItem WHERE Cloned_From_Order_Line__c IN :srcOrderItems];
        Map<Id, OrderItem> srcToSurviving = new Map<Id, OrderItem>();
        
        for (OrderItem oi : survivingOIs) {
            srcToSurviving.put(oi.Cloned_From_Order_Line__c, oi);
        }
        
        for (WorkOrderLineItem woli : wolis) {
            OrderItem survivingOI = srcToSurviving.get(woli.Order_Product__c);
            woliToSurvivingOI.put(woli.Id, survivingOI);
        }
        
        return woliToSurvivingOI;
    }
    
    private static void reparent(List<WorkOrder> wos, Map<Id, WorkOrderMerger> woToMerger, Map<Id, WorkOrderMerger> woliToMerger) {
        List<sObject> recordsToReparent = new List<sObject>();
        for (WorkOrder wo : wos) {
            WorkOrderMerger wom = woToMerger.get(wo.Id);
            
            recordsToReparent.addAll(wom.reparent());
        }
        
        // Sorting to avoid too many chunks (optimization for db)
        recordsToReparent.sort();
        
         // Persist records
        List<Database.SaveResult> reparentResults = Database.update(recordsToReparent, false);
        
        for (Integer i = 0; i < reparentResults.size(); i++) {
            Database.SaveResult reparentResult = reparentResults.get(i);
            sObject record = recordsToReparent.get(i);
            
            if (!reparentResult.isSuccess()) {
            	// Set rollback
            	WorkOrderMerger wom = woToMerger.containsKey(record.Id) ? woToMerger.get(record.Id) : woliToMerger.get(record.Id);
                String errMsgPrefix = woToMerger.containsKey(record.Id) ? ERR_PREFIX_REPARENT_WO : ERR_PREFIX_REPARENT_WOLI; // if false, persist occurred on woli
                
                String errMsg = getError(errMsgPrefix + record.Id, reparentResult);
                wom.setRollback(errMsg);
                
            }
        }
    }
    
    private static void handleRollbacks(List<WorkOrder> wos, Map<Id, WorkOrderMerger> woToMerger) {
        List<sObject> rollbackRecords = new List<sObject>();
        for (WorkOrder wo : wos) {
            WorkOrderMerger wom = woToMerger.get(wo.Id);
            rollbackRecords.addAll(wom.rollback());
        }
        
        // Sorting to avoid too many chunks (optimization for db)
        rollbackRecords.sort();
        
         // Persist records
         Database.update(rollbackRecords, false);
    }
    
    private static void updateSourceOrders(List<WorkOrder> wos, Map<Id, WorkOrderMerger> woToMerger) {
    	List<Id> srcOrderIds = new List<Id>();
        for (WorkOrder wo : wos) {
            WorkOrderMerger wom = woToMerger.get(wo.Id);
            srcOrderIds.add(wom.sourceOrder);
        }
        
        // Get source orders
        Map<Id, Order> srcOrders = new Map<Id, Order>([SELECT Id, Order_Merge_Job_Status__c, Order_Merge_Job_Message__c, (SELECT Id FROM Work_Orders__r) FROM Order WHERE Id IN :srcOrderIds]);
        
        for (WorkOrder wo : wos) {
            WorkOrderMerger wom = woToMerger.get(wo.Id);
           
            Order srcOrder = srcOrders.get(wom.sourceOrder);
            
            if (srcOrder.Work_Orders__r == null || srcOrder.Work_Orders__r.size() == 0) {
                srcOrder.Order_Merge_Job_Status__c = MERGE_STATUS_PROCESSED;
            } else if (String.isNotBlank(wom.err)) {
                // It's possible another work order for this same source order was the one that failed -- so only add err msg if this was *the* merger
                srcOrder.Order_Merge_Job_Message__c = wom.err;
            }
        }
        
        Database.update(srcOrders.values(), false);
    }
    
    private static String getError(String prefix, Database.SaveResult sr) {
        String errMsg = prefix + ': ';
        for (Database.Error err : sr.getErrors()) {
            errMsg += err.getMessage();
        }
        
        return (errMsg.length() > 250) ? errMsg.substring(0, 250) : errMsg;
    }
}