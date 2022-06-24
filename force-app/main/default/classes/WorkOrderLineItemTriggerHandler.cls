/**
 * WorkOrderLineItemTriggerHandler: 
 * @author Varun
 * @version 2.0 
 * @since 01-02-2020 
 **/
/*
 1. Before Insert
 1.1 setWorkOrderLineItemFields();-BI
	The setWorkOrderLineItemFields method is used to set the fields of the Work Order Line Item object on creation of a new work order line item
 1.2 deactivateWOLI();-BI
 	The deactivateWOLI method is used to deactivate Work Order Line Item Records if they are created on Cannot Complete status
 2. Before Update 
 2.1	updateWorkOrderLineItemFields();-BU
	The updateWorkOrderLineItemFields method is used to set the fields of the Work Order Line Item object on update of an existing work order line item
 2.2 deactivateWOLIOnStatusUpdate();-BU
	The deactivateWOLIOnStatusUpdate is used to deactivate Work Order Line Item Records if status is updated to Cannot complete
 3. After Insert
 3.1 manageWOL();-AI
 	The manageWOL method is used to manage Work order location records on creation of Work Order Line Items 
 4. After Update
  4.1 manageWOLChanges();
 	The manageWOLChanges method is used to manage Work order location records on update of Work Order Line Items 
  4.2 updateOrders()
	The updateOrders method is used to update orders during update of Work Order Line Items  
 * 
 */
public class WorkOrderLineItemTriggerHandler extends TriggerHandler {
    private List<WorkOrderLineItem> lineItems;
    private List<WorkOrderLineItem> oldList;
    private Map<Id, WorkOrderLineItem> lineItemMap;
    private Map<Id, WorkOrderLineItem> oldMap;

    public WorkOrderLineItemTriggerHandler() {
        //this.setMaxLoopCount(20);

        lineItems = Trigger.new;
        oldList = Trigger.old;
        lineItemMap = (Map < Id, WorkOrderLineItem >) Trigger.newMap;
        oldMap = (Map < Id, WorkOrderLineItem >) Trigger.oldMap;
    }

    /** TRIGGER EVENTS **/
    protected override void beforeInsert() {
        WorkOrderLineItemSetFieldsWrapper wrapper = new WorkOrderLineItemSetFieldsWrapper(lineItems);
    }

    protected override void beforeUpdate() {
        if(!System.isBatch()){
        	WorkOrderLineItemSetFieldsWrapper wrapper = new WorkOrderLineItemSetFieldsWrapper(lineItems, oldMap);
        }
    }

    protected override void afterInsert() {
        WorkOrderLineItemSetFieldsWrapper wrapper = new WorkOrderLineItemSetFieldsWrapper();
        wrapper.prepManageWOLI(lineItems, null);
        updateWLocCounter(wrapper,null);
        statusChagesWOLI(wrapper);
    }

    protected override void afterUpdate() {
        if(!System.isBatch()){
            WorkOrderLineItemSetFieldsWrapper wrapper = new WorkOrderLineItemSetFieldsWrapper();
            wrapper.prepManageWOLI(lineItems, oldMap);
            updateWLocCounter(wrapper,oldMap);
            wrapper.deactiveOrderItems(lineItems, oldMap);
            wrapper.WORoomUpdates();
            statusChagesWOLI(wrapper);
        } else {
            WorkOrderLineItemSetFieldsWrapper wrapper1 = new WorkOrderLineItemSetFieldsWrapper();
            for (WorkOrderLineItem li : lineItems) {
                if(li.Work_Order_Location__c!=null){wrapper1.workOrderLocationIds.add(li.Work_Order_Location__c);}
            }
        	wrapper1.WORoomUpdates();
        }
    }
    
    protected override void afterDelete(){
        WorkOrderLineItemSetFieldsWrapper wrapper = new WorkOrderLineItemSetFieldsWrapper();
        wrapper.getWOLOConDelete(oldList);
        wrapper.WORoomUpdates();
    }
    
    private void updateWLocCounter(WorkOrderLineItemSetFieldsWrapper wrapper, Map<Id,WorkOrderLineItem> isMapOld){
        wrapper.workOrderLocationIds.remove(null);
        if (!System.isBatch() && !System.isFuture()) { // 21530 - MD
            try {
                 FutureCalls.futureUpdateRoom(wrapper.futureWolis, wrapper.futureRooms, isMapOld == null, wrapper.conditionCheck);
            } catch (Exception e) {
                System.debug('Work Order Location Update Failed: ' + e.getMessage());
            }
        }
    }
    
    private void statusChagesWOLI(WorkOrderLineItemSetFieldsWrapper wrapper){
        //21618 logic
    	wrapper.cannotCompleteWOLIIds.remove(null);
    	wrapper.pestCommercialPriceChangeWOLIIds.remove(null);
    
        if (!System.isBatch() && !System.isFuture()) {
            if (!wrapper.cannotCompleteWOLIIds.isEmpty()) {
                WorkOrderUtil.updateWorkOrderLineItemsCannotComplete(wrapper.cannotCompleteWOLIIds);
            }
            
            if (!wrapper.pestCommercialPriceChangeWOLIIds.isEmpty()) {
                WorkOrderUtil.setOrderItemServicePricePerUnit(wrapper.pestCommercialPriceChangeWOLIIds);
            }
        }
    }
}