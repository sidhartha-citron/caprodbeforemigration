public class AddOrderProduct {

    public class ColumnRecord {
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public String name { get; set; }

        public ColumnRecord(String label, String name) {
            this.label = label;
            this.name = name;
        }
    }

    @AuraEnabled
    public static List<ColumnRecord> getColumns(List<String> columnAPINames) {
        List<ColumnRecord> columns = new List<ColumnRecord>();

        for (String s : columnAPINames) {
            List<String> ss = s.split('\\.');

            columns.add(new ColumnRecord(
                    Schema.getGlobalDescribe().get(ss[0]).getDescribe().fields.getMap().get(ss[1]).getDescribe().getLabel(),
                    ss[1]));
        }

        return columns;
    }

    @AuraEnabled
    public static List<String> addOrderItem(OrderItem record) {
        List<String> result = new List<String>{'', '', ''};
        PricebookEntry pEntry;

        try {
            if (record != null) {
                Order o = [
                        SELECT Id, Pricebook2Id
                        FROM Order
                        WHERE Id = :record.OrderId
                ];

                pEntry = [
                        SELECT Id, UnitPrice, Name
                        FROM PricebookEntry
                        WHERE Pricebook2Id = :o.Pricebook2Id
                        AND Product2Id = :record.Product2Id
                ];

                if (pEntry != null) {
                    OrderItem newOrderItem = new OrderItem(
                            OrderId = record.OrderId,
                            PricebookEntryId = pEntry.Id,
                            Quantity = 1,
                            UnitPrice = 0.0,
                            ServiceDate = System.today(),
                            Service_Price_Per_Unit__c = record.Service_Price_Per_Unit__c,
                            Installation_Price__c = record.Installation_Price__c,
                            Purchase_Price__c = record.Purchase_Price__c,
                            Frequency__c = record.Frequency__c,
                            Related_Product__c = record.Related_Product__c,
                            Active__c = true

                    );

                    insert newOrderItem;

                    result[0] = Label.Site_Survey_Save_Success_Title;
                    result[1] = 'success';
                    result[2] = Label.Record_Creation_Success;
                }
                else {
                    result[0] = Label.Record_Creation_Caution;
                    result[1] = 'caution';
                    result[2] = Label.Record_Creation_Failure;
                }
            }
        } catch (DmlException de) {
            System.debug('DML ' + de.getMessage() + ' ' + de.getLineNumber());
            result[0] = Label.Site_Survey_Save_Error_Title;
            result[1] = 'error';
            result[2] = Label.Record_Creation_Exception;
        } catch (Exception e) {
            System.debug('Exception ' + e.getMessage() + ' ' + e.getLineNumber());
            result[0] = Label.Site_Survey_Save_Error_Title;
            result[1] = 'error';
            result[2] = Label.Record_Creation_Exception;
        }

        return result;
    }
}