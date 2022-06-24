/**
 * OrderItem-specific sort implementation for RecordEntry.
 * @author: Ahsan Butt
 */
public class RecordEntryOrderItemSorter implements IComparator {
    private static String productNameField = 'Product_Name__c';

    public Integer compare(Object obj, Object otherObj) {
        RecordEntry entry = (RecordEntry) obj;
        RecordEntry otherEntry = (RecordEntry) otherObj;

        if (entry.record == null && otherEntry.record == null) {
            return 0;
        } else if (otherEntry.record == null) {
            return 1;
        } else if (entry.record == null) {
            return -1;
        }

        String productName = (String) entry.record.get(productNameField);
        String otherProductName = (String) otherEntry.record.get(productNameField);

        if (productName > otherProductName) {
            return 1;
        } else if (productName < otherProductName) {
            return -1;
        }

        return 0;
    }

}