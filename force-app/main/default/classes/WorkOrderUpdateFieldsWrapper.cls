/**
 * @FileName: WorkOrderUpdateFieldsWrapper
 * @Description: Wrapper class to contain Work Order related data for update fields trigger method
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       1/6/2020         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class WorkOrderUpdateFieldsWrapper {
    public Set<String> cannotCompleteLinesOfBusiness;
    public Set<Id> workOrderPestCannotCompleteIds;
    public Set<Id> workOrderCompletedIds;
    public Set<Id> workOrderCancelledIds;
    public Set<Id> workOrderResetAppointmentIds;
    public Set<Id> workOrderPONumberCase;
    public Set<Id> workOrderSwappedProductIds;
    public Set<Id> completedWOs;
    public Set<Id> cannotCompleteWorkOrderIds;

    public WorkOrderUpdateFieldsWrapper(List<WorkOrder> lstNewWorkOrders, Map<Id,WorkOrder> mapOldWorkOrders) {
        this.cannotCompleteLinesOfBusiness = WorkOrderUtil.activeLinesOfBusinessForCannotComplete();
        this.workOrderPestCannotCompleteIds = new Set<Id>();
        this.workOrderCompletedIds = new Set<Id>();
        this.workOrderCancelledIds = new Set<Id>();
        this.workOrderResetAppointmentIds = new Set<Id>();
        this.workOrderPONumberCase = new Set<Id>();
        this.workOrderSwappedProductIds = new Set<Id>();
        this.completedWOs = new Set<Id>();
        this.cannotCompleteWorkOrderIds = new Set<Id>();

        filterWorkOrdersById(lstNewWorkOrders, mapOldWorkOrders);
    }

    private void filterWorkOrdersById(List<WorkOrder> lstNewWorkOrders, Map<Id,WorkOrder> mapOldWorkOrders) {
        for (WorkOrder wo : lstNewWorkOrders) {
            WorkOrder oldWorkOrder = mapOldWorkOrders.get(wo.Id);
			System.debug('--Status--' + wo.Status + '--LOB--' + wo.Line_of_Business__c + '--EMERGENCY--' + wo.Emergency__c);
            if(oldWorkOrder.Status != wo.Status
                    && wo.Type__c != QueryUtils.fieldServiceSettings.Type_Value_for_FollowUp_WorkOrder__c
                    && (wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c
                        || wo.Status == QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c))
            {
                completedWOs.add(wo.Id);
            }

            //filtering out pest control since it now behaves differently, 21618 [dk]
            if (wo.Cannot_Complete_Reason__c != oldWorkOrder.Cannot_Complete_Reason__c
                    && wo.Line_of_Business__c != QueryUtils.fieldServiceSettings.Pest_LOB__c)
            {
                cannotCompleteWorkOrderIds.add(wo.Id);
            }

            //21618
            if (wo.Status != oldWorkOrder.Status
                    && wo.Status == QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c
                    && cannotCompleteLinesOfBusiness.contains(wo.Line_of_Business__c))
            {
                workOrderPestCannotCompleteIds.add(wo.Id);
            } else if (wo.Status != oldWorkOrder.Status
                    && wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c
                    && wo.Line_of_Business__c == QueryUtils.fieldServiceSettings.Pest_LOB__c
                    && wo.Emergency__c)
            {
                workOrderSwappedProductIds.add(wo.Id);
                workOrderCompletedIds.add(wo.Id);
                System.debug('--Completed WOs--' + wo.WorkOrderNumber);
            } else if (wo.Status != oldWorkOrder.Status
                    && wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c
                    && wo.Line_of_Business__c == QueryUtils.fieldServiceSettings.Pest_LOB__c
                    && wo.Emergency__c)
            {
                workOrderCancelledIds.add(wo.Id);
            }
            //21618
            if (wo.Create_PO_Number_Case__c && wo.Create_PO_Number_Case__c != oldWorkOrder.Create_PO_Number_Case__c) {
                workOrderPONumberCase.add(wo.Id);
            }
            //21618
            if (wo.Is_Work_Order_Valid_for_Reset_SAs__c
                    && wo.Is_Work_Order_Valid_for_Reset_SAs__c != oldWorkOrder.Is_Work_Order_Valid_for_Reset_SAs__c)
            {
                workOrderResetAppointmentIds.add(wo.Id);
            }
        }

        workOrderPestCannotCompleteIds.remove(null);
        workOrderCompletedIds.remove(null);
        workOrderCancelledIds.remove(null);
        completedWOs.remove(null);
        workOrderPONumberCase.remove(null);
        workOrderSwappedProductIds.remove(null);
        workOrderResetAppointmentIds.remove(null);
    }
}