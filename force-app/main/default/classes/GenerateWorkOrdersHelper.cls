/**
 * @FileName: GenerateWorkOrdersHelper
 * @Description: helper methods for the Generate Work Orders lightning component
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       2/1/2020        Created
 *-----------------------------------------------------------  
 */
public inherited sharing class GenerateWorkOrdersHelper {

    public static String setContent(String recordIdString) {
        Id recordId = (Id) recordIdString;
        String recordType = String.valueOf(recordId.getSobjectType());

        if (!FeatureManagement.checkPermission('Generate_Work_Orders')) {
            return JSON.serialize(new ResponseWrapper(Label.WO_Generation_Permission_Error, false));
        }

        switch on recordType {
            when 'Account' {
                return JSON.serialize(new ResponseWrapper(Label.WO_Generation_Account_Modal_Content, true));
            }
            when 'Order' {
                Order o = [SELECT Id, Status FROM Order WHERE Id = :recordId];

                if (o.Status != 'Activated') {
                    return JSON.serialize(new ResponseWrapper(Label.WO_Generation_Order_Error, false));
                }

                return JSON.serialize(new ResponseWrapper(Label.WO_Generation_Order_Modal_Content, true));
            }
        }

        return JSON.serialize(new ResponseWrapper(Label.WO_Generation_Unknown_Modal_Content, false));
    }

    public static void generateWorkOrders(String recordIdString) {
        Id recordId = (Id) recordIdString;
        String recordType = String.valueOf(recordId.getSobjectType());

        SpawnWorkOrdersUtility spwnWOUtil = new SpawnWorkOrdersUtility();

        switch on recordType {
            when 'Account' {
                Database.executeBatch(new GenerateWOBatch(recordId));
            }
            when 'Order' {
                Order o = [
                        SELECT Id, AccountId
                        FROM Order
                        WHERE Id = :recordId
                ];

                spwnWOUtil.onDemandWOs(o.AccountId, recordId);
            }
        }
    }

    // WRAPPER CLASSES
    public class ResponseWrapper {
        public String content;
        public Boolean isValid;

        public ResponseWrapper(String content, Boolean isValid) {
            this.content = content;
            this.isValid = isValid;
        }
    }
}