public class OrderValidation {
    
    @AuraEnabled
    public static List<String> findStatus(String recordId) {
        List<String> result = new List<String>{'', '', ''};
        if(String.isNotBlank(recordId)) {
            try {
                Order record = [SELECT Id, StatusCode FROM Order WHERE Id=:recordId];
                if(record.StatusCode=='D') {
                    result[0]='warning';
                    result[1]='Warning!'; 
                    result[2]='Please Activate this order to ensure that Work Orders and Service Appointments are created';
                    return result;
                }
                return null;
            }catch(Exception e) {
                System.debug(e.getLineNumber() +' -- ' + e.getMessage());
                return null;
            } 
        }
        return null;
    }
}