public class InputLookup {
    @AuraEnabled
    public static SObject loadDefault(String s, String sObjectType) {
        try {
            String query;
            if(sObjectType =='Skill') {
                query = 'SELECT Id, MasterLabel, DeveloperName FROM {1} WHERE Id={0}';//-- changed for skill sobject
            } else {
                query = 'SELECT Id, Name FROM {1} WHERE Id={0}'; 
            }
            return Database.query(String.format(query, new List<String> { '\''+s+'\'', sObjectType }));
        } catch (Exception e) {            
        }     
        return null;
    }

    @AuraEnabled
    public static List<SObject> searchLookup(String s, String sObjectType) {
        try {
            String query;
            String MV = 'Mobile Vehicle';
            if(sObjectType =='Skill') {
                //SELECT id, developerName FROM Skill where developerName LIKE 'SS_%'
                Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
                s = dataSets.Site_Survey_Skills_Prefix__c + '_' + s;
                query = 'SELECT Id, MasterLabel, DeveloperName FROM Skill WHERE DeveloperName LIKE \'' + s + '%\' LIMIT 50';
                List <SObject> results = Database.query(query);
                return results;
            }
            else if (sObjectType =='Location'){
                 query = 'SELECT Id, Name FROM Location WHERE Name LIKE \'' + s + '%\' AND LocationType= \'' + MV + '\' LIMIT 50';
                 List <SObject> results = Database.query(query);
                 System.debug('results: ' + results);
                 return results;
            }
            else {
               query = 'FIND {0} IN Name FIELDS RETURNING {1}(Id,Name) LIMIT 50'; 
               List<List <SObject>> results = Search.query(String.format(query, new List<String> { '\''+s+'\'', sObjectType }));
               System.debug('VEHICLE: ' + results[0]);
               return results[0];
            }
        } catch (Exception e){
            System.debug(e);
        }
        return null;
    }
}