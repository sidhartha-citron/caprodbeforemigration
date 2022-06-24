public class CasePicklistValue {
    
	 public class RecType{
        String developerName {get; set;}
        String label {get; set;}    
    }
     
     public static void getPicklistValues() {
        
        //Start JSON generator
        JSONGenerator gen = JSON.createGenerator(true);
   
        //Get all case record types and their labels
        Map<Id,RecType> options = new Map<Id,RecType>();
        for(RecordType a : [SELECT DeveloperName,Name,Id  FROM RecordType WHERE SobjectType='Case']){
             RecType r = new RecType();
             r.developerName = 'Case.' + a.developerName;
             r.label = a.Name;            
             options.put(a.Id, r);
        }
        
        //Read metadata service to get all values for field sub type 
        MetadataService.MetadataPort service = new MetadataService.MetadataPort();
           
        gen.writeStartObject();
        //for each case record type
        for(Id i : options.keySet()){             
          MetadataService.RecordType recordType = (MetadataService.RecordType) service.readMetadata('RecordType', new String[] { options.get(i).developerName },'').getRecords()[0];    
            //write the key // start the nested object (Types) // first key value pair RecordTypeId  
            gen.writeFieldName(options.get(i).label);
            // for each picklist fields in the record type -  if picklist field is 'Type'
            for ( MetadataService.RecordTypePicklistValue rpk : recordType.picklistValues ) {                
                if ('Type' == rpk.picklist ) { 
                    gen.writeStartArray();
                    for ( MetadataService.PicklistValue pkv : rpk.values ) {    
                        gen.writeString(EncodingUtil.urlDecode(pkv.fullName,'UTF-8'));  
                    }
                    gen.writeEndArray();                
                }
            }
        } 
        gen.writeEndObject();         
        system.debug(gen.getAsString().replace('\n',''));
         
        insert new Configuration__c(
            Name=String.valueOf(DateTime.now()),
            Content__c = gen.getAsString().replace('\n','') ,
            ControllingFieldName__c = 'Type',
            ObjectName__c = 'Case'
        );

    }
}