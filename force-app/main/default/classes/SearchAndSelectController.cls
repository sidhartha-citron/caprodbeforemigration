/**
 * Controller for SearchAndSelect lightning component.
 * 
 * @author Ahsan Butt
 */
public class SearchAndSelectController {

    @AuraEnabled
    public static List<SearchResult> search(String searchTerm) {
        List<SearchResult> searchResults = new List<SearchResult>();
        
        List<List<sObject>> resultsList = [FIND :searchTerm IN ALL FIELDS RETURNING 
           Account (Id, Name, Parent.Name, AccPac_Account__c, Recurring_SO__c, On_Hold__c, BillingAddress, Type, Owner.Name)];
        
        if (resultsList != null && resultsList.size() == 1) {
            List<Account> accts = (List<Account>) resultsList.get(0);
            
            for (Account acct : accts) {
                SearchResult sr = new SearchResult();
                sr.acct = acct;
                sr.isSelected = false;
                searchResults.add(sr);
            }
        }
        
        return searchResults;
    }
    
    public class SearchResult {
        @AuraEnabled public Boolean isSelected;
        @AuraEnabled public Account acct;
    }
}

/*
    @AuraEnabled
    public static String getPluralLabel(String objectName) {
        List<Schema.DescribeSobjectResult> results = Schema.describeSObjects(new List<String>{objectName});

        if (results == null || results.size() != 1) return null;
        
        return results.get(0).getLabelPlural();
    }
*/

        /*
        // For non-OrderItem cases, use SOSL
        String query = composeSearchQuery(objName, searchTerm);
        
        List<List<sObject>> resultsList = search.query(query);

        if (resultsList != null && resultsList.size() == 1) {
            List<sObject> results = resultsList.get(0);

            for (sObject result : results) {
                resultIds.put(result.Id, true);
            }
        }

        */

    /*
    private static String composeSearchQuery(String objName, String searchTerm) {
        return 'FIND {' + searchTerm + '} IN ALL FIELDS RETURNING ' + objName + ' ( Id WHERE ID IN :ids )';
    }
    */