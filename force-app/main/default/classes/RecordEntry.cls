/**
 * Wrapper class for Mass Edit controller encapsulating a record and related info. Also, is comparable/sortable.
 * 
 * @author Ahsan Butt
 */
public class RecordEntry implements Comparable {
	@AuraEnabled
    public sObject record;
    @AuraEnabled
    public List<FieldEntry> fields;
    @AuraEnabled
    public Boolean isSelected;
    @AuraEnabled
    public Boolean isActive;
    public String sortImpl;

    public Integer compareTo(Object compareTo) {
        // Use sort impl, if given
        if (String.isNotBlank(sortImpl)) {
            Type sorterType = Type.forName(sortImpl);
            IComparator sorter = (IComparator) sorterType.newInstance();
            return sorter.compare(this, compareTo);
        }

        // Default to ids (can't be sure 'Name' has been loaded on the records)
        RecordEntry other = (RecordEntry) compareTo;
        if (record.Id > other.record.Id) {
            return 1;
        } else if (record.Id < other.record.Id) {
            return -1;
        }
        return 0;
    }
}