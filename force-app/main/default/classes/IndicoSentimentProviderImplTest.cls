/**
 * Unit tests for IndicoSentimentProviderImpl. Also includes some test utility methods for mocking
 * Indico sentiment call-outs.
 * 
 * @author Ahsan Butt
 */
@isTest
public class IndicoSentimentProviderImplTest {

    static testmethod void testGetSentiment() {
        // Insert custom settings
        createSentimentProviderCustomSettings();
                
        // Set up mock with valid response
        Test.setMock(HttpCalloutMock.class, getSentimentMock());
        
        // Invoke sentiment
        Test.startTest();
        
        IndicoSentimentProviderImpl sentimentProvider = new IndicoSentimentProviderImpl();
        List<SentimentResults> results = sentimentProvider.getSentiment(new List<String>{'foo', 'bar', 'test'});
        
        Test.stopTest();
        
        System.assertEquals(3, results.size(), 'Should return 3 sentiment results');
        System.assert(0.98888812 == results.get(0).score, 'Sentiment score should match');
        System.assert(0.51 == results.get(1).score, 'Sentiment score should match');
        System.assert(0.01 == results.get(2).score, 'Sentiment score should match');
    }
    
    public static IndicoAPICredentials__c createSentimentProviderCustomSettings() {
        IndicoAPICredentials__c credentials = new IndicoAPICredentials__c();
        credentials.Name = 'Sentiment API';
        credentials.API_Key__c = '1234';
        credentials.Sentiment_Endpoint_URL__c = 'http://foobar.com/sentiment/batch';

        insert credentials;
        
        return credentials;
    }
    
    public static RequestMock getSentimentMock() {
        RequestMock mockResponse = new RequestMock(
            200,
            'OK',
            '{"results" :[0.98888812, 0.51, 0.01]}',
            null
        );
        
        return mockResponse;
    }
}