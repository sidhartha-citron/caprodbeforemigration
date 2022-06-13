/**
 * @FileName: WorkOrderTrigger
 * @Description: Trigger on Work Order
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       12/24/2019      Created
 *-----------------------------------------------------------  
 */
trigger WorkOrderTrigger on WorkOrder (before insert, before update, after insert, after update) {
    new WorkOrderTriggerHandler().run();
}