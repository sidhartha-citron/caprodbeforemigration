/**
 * Wrapper class for Mass Edit controller encapsulating a set of records and related info.
 * 
 * @author Ahsan Butt
 */
public class RecordSet {
	@AuraEnabled
    public sObject controlRecord;
    @AuraEnabled
    public List<RecordEntry> records;
    @AuraEnabled
    public List<FieldEntry> headers;
    @AuraEnabled
    public String searchField;
    @AuraEnabled
    public String accountId;
    @AuraEnabled
    public String parentName;
}