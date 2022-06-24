/**
 * @FileName: WorkOrderLocationTriggerHelper
 * @Description: Helper methods for Work Order Location trigger
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/9/2020         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class WorkOrderLocationTriggerHelper {

    public static List<Asset> getAssets(Set<String> scannedInBarCodes, Set<String> scannedOutBarCodes) {
        return [
                SELECT Id, AccountId, Status, Product2Id, Bar_Code__c, InstallDate
                FROM Asset
                WHERE Bar_Code__c != NULL
                AND (Bar_Code__c IN :scannedInBarCodes
                    OR Bar_Code__c IN :scannedOutBarCodes)
        ];
    }

    public static List<WorkOrderLineItem> getWorkOrderLineItems(Set<Id> workOrderRoomIds) {
        System.debug('In getWorkOrderLineItems these are wol ids'+workOrderRoomIds);
        return [
                SELECT Id, Work_Order_Location__c, Work_Order_Location__r.Work_Order__r.Line_of_Business__c, Status,
                        Completed_Date__c, PricebookEntry.Product2.Family,
                        PricebookEntry.Product2.Does_not_require_scanning__c
                FROM WorkOrderLineItem
                WHERE Status != :QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c
                AND Work_Order_Location__c IN :workOrderRoomIds
                AND ((PricebookEntry.Product2.Family = :QueryUtils.fieldServiceSettings.Pest_LOB__c
                        OR PricebookEntry.Product2.Does_not_require_scanning__c = TRUE)
                    OR (Work_Order_Location__r.Work_Order__r.Line_of_Business__c = :QueryUtils.fieldServiceSettings.Pest_LOB__c
                        AND Work_Order_Location__r.PestAuditable__c = FALSE))
        ];
    }

    public static List<Work_Order_Room__c> getWorkOrderRooms(Set<Id> workOrderRoomIds) {
        return [
                SELECT Id, Work_Order__r.Line_of_Business__c, Work_Order__r.Site_Survey__c, Survey_Location__c,
                        PestAuditable__c, Work_Order__r.Type__c, Work_Order__r.AccountId,
                        Scanned_In_Excess_Bar_Codes__c, Scanned_In_Unknown_Barcodes__c,
                        Scanned_Out_Excess_Bar_Codes__c, Scanned_Out_Unknown_Barcodes__c, Status__c, (
                        SELECT Id, Bar_Code__c, Status, AssetId, Asset.IsReallocated__c, Asset.Last_Scanned_Date__c,
                                Asset.Last_Scanned_Work_Order__c, Asset.Last_Scanned_By__c, WorkOrderId, Product2Id,
                                Type_of_Service__c
                        FROM Work_Order_Line_Items__r
                        WHERE Status != :QueryUtils.fieldServiceSettings.Work_Order_Line_Item_Completed_Status__c
                        OR Type_of_Service__c = :QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c
                        ORDER BY AssetId NULLS LAST
                )
                FROM Work_Order_Room__c
                WHERE Id IN :workOrderRoomIds
        ];
    }
}