@isTest
global class TestMetadataClasses implements WebServiceMock{
    global void doInvoke(Object stub, Object request, Map<String, Object> response, String endpoint, String soapAction, String requestName, String responseNS, String responseName,
                         String responseType) 
    {
        MetadataService.readMetadata_element request_x = (MetadataService.readMetadata_element) request;
        if (request_x.type_x == 'CustomField') {
            
            MetadataService.readCustomFieldResponse_element response_x = new MetadataService.readCustomFieldResponse_element();
            response_x.result = new MetadataService.ReadCustomFieldResult();
            response_x.result.records = new List<MetadataService.CustomField> {new MetadataService.CustomField()};
            response_x.result.records[0].fullName = 'Dependend Field';
            response_x.result.records[0].picklist = new MetadataService.Picklist();
            response_x.result.records[0].picklist.picklistValues = new List<MetadataService.PicklistValue>{new MetadataService.PicklistValue()};
            response_x.result.records[0].picklist.picklistValues[0].fullName = 'DependendValue';
            response_x.result.records[0].picklist.picklistValues[0].controllingFieldValues = new List<String>{'Washroom'};
            response.put('response_x', response_x);
            
        } else if (request_x.type_x == 'RecordType') {
            
            MetadataService.readRecordTypeResponse_element response_x = new MetadataService.readRecordTypeResponse_element();
            response_x.result = new MetadataService.ReadRecordTypeResult();
            response_x.result.records = new List<MetadataService.RecordType> {new MetadataService.RecordType()};
            response_x.result.records[0].fullName = 'Record Type';
            response_x.result.records[0].picklistValues = new List<MetadataService.RecordTypePicklistValue> 
            														{new MetadataService.RecordTypePicklistValue(),new MetadataService.RecordTypePicklistValue()};
            response_x.result.records[0].picklistValues[0].picklist = 'Type';
            response_x.result.records[0].picklistValues[0].values = new List<MetadataService.PicklistValue> {new MetadataService.PicklistValue()};
            response_x.result.records[0].picklistValues[0].values[0].fullName = 'Type1';
            /*response_x.result.records[0].picklistValues[1].picklist = 'Sub_Type__c';
            response_x.result.records[0].picklistValues[1].values = new List<MetadataService.PicklistValue> {new MetadataService.PicklistValue()};
            response_x.result.records[0].picklistValues[1].values[0].fullName = 'SubType1';*/
            response.put('response_x', response_x);      
            
        }
    }
}