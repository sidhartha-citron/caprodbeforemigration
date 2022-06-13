/**
 * Unit tests for SearchAndSelectController.
 * @author Ahsan Butt
 */
@isTest
private class SearchAndSelectControllerTest {
	static testMethod void testSearch() {
        // Insert acct to search against
        TestDataFactory.crtAcctContact(1, 1);
        
        String phone = '1231231234';
                
        // SOSL queries return an empty list in test contexts
        // this method sets a deterministic set of results
        Test.setFixedSearchResults(new List<Id>{TestDataFactory.accounts[0].Id});
        
        List<SearchAndSelectController.SearchResult> results = SearchAndSelectController.search(phone);
        
        System.assertEquals(TestDataFactory.accounts[0].Id, results.get(0).acct.Id, 'Results should include acct with matching phone number');
    }
}