global class SLPicklistValue implements Database.AllowsCallouts {
    
    public static void getDependantValues() {
        
        Map<String, List<String>> mapDependency = new Map<String,List<String>>();
        
        //build map of controlling and dependant field values
        Schema.DescribeFieldResult fieldResult = Survey_Location__c.Location_Type__c.getDescribe();
        List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
        for(Schema.PicklistEntry s:ple) {
            mapDependency.put( s.getLabel(), new List<String>() );            
        } 
        
        MetadataService.MetadataPort service = new MetadataService.MetadataPort();
        
        // Read Custom Field (dependent picklist)
        MetadataService.CustomField customField = (MetadataService.CustomField) service.readMetadata('CustomField', new String[] { 'Survey_Location__c.Location_SubType__c' },'').getRecords()[0];
        
        List<MetadataService.PicklistValue> filteredDependentValues = new List<MetadataService.PicklistValue>();
        
        for(String controllingFieldValue : mapDependency.keySet()) {
            System.debug(' Controlling ' + controllingFieldValue);
            //System.debug(' Dependants ' + customField.picklist.picklistValues);
            for (MetadataService.PicklistValue picklistValue : customField.picklist.picklistValues) {
                System.debug('Depended Types Controlling field  ' + picklistValue.controllingFieldValues + ' The dependent field ' + picklistValue.fullName);
                if (( picklistValue.controllingFieldValues != null ) &&  new Set<String>(picklistValue.controllingFieldValues).contains( controllingFieldValue)) {
                    List<String> currValues = mapDependency.get(controllingFieldValue);
                    System.debug(currValues);
                    currValues.add(picklistValue.fullName);
                    //System.debug(' Dependent ' + picklistValue.fullName);
                    mapDependency.put(controllingFieldValue, currValues);
                }
            }
            System.debug(mapDependency);
        }
        
        JSONGenerator gen = JSON.createGenerator(true);
        gen.writeStartObject();
        for(String controllingField : mapDependency.keySet() ){
            gen.writeFieldName(EncodingUtil.urlDecode(controllingField,'UTF-8'));        
            gen.writeStartArray();
            for(String dependantVal : mapDependency.get(controllingField) ){
                gen.writeString(dependantVal);    
            }
            gen.writeEndArray();                
        }
        gen.writeEndObject();
        String s = gen.getAsString().replace('\n','');
        System.debug(s);
        
        insert new Configuration__c(
            Name=String.valueOf(DateTime.now()),
            Content__c = gen.getAsString().replace('\n','') ,
            ControllingFieldName__c = 'Location_Type__c',
            DependantFieldName__c = 'Location_SubType__c',
            ObjectName__c = 'Survey_Location__c'
        );
    }
}