/**
 * Wrapper class used in Mass Edit Controller to encapsulate field info.
 * 
 * @author Ahsan Butt
 */
public class FieldEntry {
	@AuraEnabled
    public string name;
    @AuraEnabled
    public string label;
    @AuraEnabled
    public String type;
    @AuraEnabled
    public boolean isEditable;
    @AuraEnabled
    public List<String> opts;
}