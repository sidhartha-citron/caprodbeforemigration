/**
 * Contains utility methods for dealing with field sets.
 * 
 * @author Ahsan Butt
 */
public class FieldSetUtils {
    /*
     * @Name        getfieldListFromFieldSet
     * @Description The purpose of this method is to get the list of fields given an Object and its fieldSet Name
     * @Author      Sanchivan Sivadasan
     * @Params      objectName: The Object Name 
     *              fieldSetName: The Field Set Name for that Object
     * @Return      Set<String>: Set of String that contains the fields
     */
    public static Set<String> getfieldListFromFieldSet(String objectName, String fieldSetName) {
        Schema.FieldSet fieldSet = FieldSetUtils.getFieldSet(objectName, fieldSetName);
        Set<String> fields = new Set<String>();
        for (Schema.FieldSetMember field : fieldSet.getFields()) {
            fields.add(field.getFieldPath());
        }
        
        return fields;
    }
    
    public static Schema.FieldSet getFieldSet(String objName, String fieldSetName) {
        Schema.SObjectType SObjectTypeObj = Schema.getGlobalDescribe().get(objName);
        Schema.DescribeSObjectResult descResult = sObjectTypeObj.getDescribe();
        Schema.FieldSet fieldSetObj = descResult.FieldSets.getMap().get(fieldSetName);
        
        return fieldSetObj;
    }
    
    public static String getFieldsCommaDelimitedString(Schema.FieldSet fs) {
        String fieldsString = '';
        List<String> fields = new List<String>();
        for (Schema.FieldSetMember field : fs.getFields()) {
            fields.add(field.getFieldPath());
        }
        
        fieldsString = String.join(fields, ', ');

        return fieldsString;
    }

    public static String getFieldsCommaDelimitedString(List<Schema.FieldSet> fieldSets) {
        String fieldsString = '';
        List<String> fields = new List<String>();
        for (Schema.FieldSet fs : fieldSets) {
            for (Schema.FieldSetMember field : fs.getFields()) {
                fields.add(field.getFieldPath());
            }
        }
             
        fieldsString = String.join(fields, ', ');
        
        return fieldsString;
    }
    
    public static boolean hasField(Schema.FieldSet fs, String fieldName) {
        for (Schema.FieldSetMember field : fs.getFields()) {
            if (field.getFieldPath().equalsIgnoreCase(fieldName)) return true;
        } 
        
        return false;
    }
}