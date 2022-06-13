public class InputOrderController{
    @AuraEnabled
    public static SObject loadDefault(String s, String sObjectType) {
        try {
            String query;

            if (sObjectType =='Order') {
                System.debug('We are in order');
                query = 'SELECT Id, Name, OrderNumber FROM {1} WHERE Id={0}'; 
            } else {
                query = 'SELECT Id, Name FROM {1} WHERE Id={0}'; 
            }
            System.debug(Database.query(String.format(query, new List<String> { '\''+s+'\'', sObjectType })));
            return Database.query(String.format(query, new List<String> { '\''+s+'\'', sObjectType }));
        } catch (Exception e) {            
        }     
        return null;
    }

    @AuraEnabled
    public static List<SObject> searchLookup(String s, String sObjectType, Id orderId) {
        try {
            Order ord = [SELECT Id, AccountId FROM Order WHERE Id =: orderId];
            Id acctId = ord.AccountId;

            String query;

            query = 'FIND {0} IN Name FIELDS RETURNING {1}(OrderNumber WHERE AccountId = {2} AND Id != {3} ORDER BY OrderNumber) LIMIT 50'; 
            System.debug((String.format(query, new List<String> { '\''+s+'\'', sObjectType, '\''+acctId+'\'', '\''+orderId+'\'' })));
            List<List <SObject>> results = Search.query(String.format(query, new List<String> { '\''+s+'\'', sObjectType, '\''+acctId+'\'', '\''+orderId+'\'' }));
            System.debug('VEHICLE: ' + results[0]);
            return results[0];
            
        } catch (Exception e){
            System.debug(e);
        }
        return null;
    }
}