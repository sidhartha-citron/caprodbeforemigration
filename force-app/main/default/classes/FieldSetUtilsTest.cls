/**
 * Test class for FieldSetUtils class.
 * @author Ahsan Butt
 */

@isTest
public class FieldSetUtilsTest {
    // Tests rely on test field on TEST_FIELD_SET_OBJ object called TEST_FIELD_SET_NAME
    public static String TEST_FIELD_SET_OBJ = 'Lead';
    public static String TEST_FIELD_SET_NAME = 'Field_Set_Utils_Test';
    private static String TEST_FIELD_SET_FIELD = 'CreateDate';
    
	static testMethod void testGetFieldSet(){
        Schema.FieldSet fs = FieldSetUtils.getFieldSet(TEST_FIELD_SET_OBJ, TEST_FIELD_SET_NAME);
        
        // Assert more than 0 fields returned
        System.assert(fs.getFields().size() > 0, TEST_FIELD_SET_OBJ + '.' + TEST_FIELD_SET_NAME + ' field set should return more 0 fields.');
    }
    
    static testMethod void getFieldsCommaDelimitedString() {
        Schema.FieldSet fs = FieldSetUtils.getFieldSet(TEST_FIELD_SET_OBJ, TEST_FIELD_SET_NAME);
        String commaDelimitedFields = FieldSetUtils.getFieldsCommaDelimitedString(fs);
        
        // Assert number of fields in comma delimited string equals number of fields in field set
        List<String> fields = commaDelimitedFields.split(',');
        System.assertEquals(fs.getFields().size(), fields.size(), 'Comma-delimited fields should match field set fields.');
    }
    
    static testMethod void getFieldsCommaDelimitedStringMultiFieldSet() {
        Schema.FieldSet fs = FieldSetUtils.getFieldSet(TEST_FIELD_SET_OBJ, TEST_FIELD_SET_NAME);
        String commaDelimitedFields = FieldSetUtils.getFieldsCommaDelimitedString(new List<Schema.FieldSet>{fs});
        
        // Assert number of fields in comma delimited string equals number of fields in field set
        List<String> fields = commaDelimitedFields.split(',');
        System.assertEquals(fs.getFields().size(), fields.size(), 'Comma-delimited fields should match field set fields.');
    }
    
    static testMethod void hasFieldTest() {
        Schema.FieldSet fs = FieldSetUtils.getFieldSet(TEST_FIELD_SET_OBJ, TEST_FIELD_SET_NAME);
        
        // Assert garbage field name returns false
        System.assertEquals(false, FieldSetUtils.hasField(fs, 'garbagefoo'));
        
        // Assert actual existing field name returns true
        System.assertEquals(false, FieldSetUtils.hasField(fs, TEST_FIELD_SET_FIELD));
    }
}