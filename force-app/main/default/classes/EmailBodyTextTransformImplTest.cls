/**
 * Unit tests for EmailBodyTextTransformImpl. Also includes some test utility methods for mocking
 * Indico sentiment call-outs.
 * 
 * @author Ahsan Butt
 */
@isTest
public class EmailBodyTextTransformImplTest {

    static testmethod void testTransform() {
        // Insert custom settings
        createTextLabelProviderCustomSettings();
                
        // Set up mock with valid response
        Test.setMock(HttpCalloutMock.class, getLabelMock());
        
        // Invoke sentiment
        Test.startTest();
        
        List<String> texts = new List<String>{'Good Evening All. Best Regards, Foo'};
        EmailBodyTextTransformImpl impl = new EmailBodyTextTransformImpl();
        List<String> transformedTexts = impl.transform(texts);
        
        Test.stopTest();
        
        System.assertEquals('Good evening All.', transformedTexts.get(0), 'Body should match.');
    }
    
    public static IndicoAPICredentials__c createTextLabelProviderCustomSettings() {
        IndicoAPICredentials__c credentials = new IndicoAPICredentials__c();
        credentials.Name = 'Sentiment API';
        credentials.API_Key__c = '1234';
        credentials.Email_Text_Model_Id__c = 'ABC123';
        credentials.Text_Labeling_Endpoint_URL__c = 'http://foobar.com/custom/batch';
        credentials.Sentiment_Endpoint_URL__c = 'http://foobar.com/sentiment/batch';

        insert credentials;
        
        return credentials;
    }
    
    public static RequestMock getLabelMock() {
        RequestMock mockResponse = new RequestMock(
            200,
            'OK',
            '{"results" :[[{"confidence": 0.4127319124009874, "end": 17, "label": "Body", "start": 0, "text": "Good evening All."}, {"confidence": 0.39, "end": 5, "label": "Body", "start": 0, "text": "Good "}]]}',
            null
        );
        
        return mockResponse;
    }
}