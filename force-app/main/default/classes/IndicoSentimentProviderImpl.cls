/**
 * Sentiment Provider implementation that retrieves sentiment scores from Indico API.
 * 
 * @author Ahsan Butt
 */
public class IndicoSentimentProviderImpl implements ISentimentProvider {
    private static String API_KEY;
    private static String SENTIMENT_ENDPOINT_URL;
    private static String EMAIL_TEXT_MODEL_ID;
    private static String TEXT_LABELING_ENDPOINT_URL;
    
    static {
        IndicoAPICredentials__c credentials = [SELECT API_Key__c, Sentiment_Endpoint_URL__c FROM IndicoAPICredentials__c WHERE Name = 'Sentiment API'];
        API_KEY = credentials.API_Key__c;
        SENTIMENT_ENDPOINT_URL = credentials.Sentiment_Endpoint_URL__c;
    }
    
    public List<SentimentResults> getSentiment(List<String> texts) {
        // Create request
        HttpRequest request = createSentimentRequest(texts);
        
        // Make request
        Http http = new Http(); 
        HttpResponse resp = http.send(request);
    
        // Check status and against null -- throw exception
        if (resp.getStatusCode() != 200 || resp.getBody() == null || String.isBlank(resp.getBody())) {
            throw new SentimentProviderException('Error calling API:\n' + resp.getStatus());
        }
        
        System.debug('RESP: ' + resp.getBody());
        
        // Parse response
        IndicoSentimentResponse response = (IndicoSentimentResponse)JSON.deserialize(resp.getBody(), IndicoSentimentResponse.class);
        List<Decimal> scores = response.results;
        
        List<SentimentResults> sentimentResults = new List<SentimentResults>();
        for (Integer i = 0; i < scores.size(); i++) {
            SentimentResults sentiment = new SentimentResults();
            sentiment.text = texts.get(i);
            sentiment.score = scores.get(i);
            
            sentimentResults.add(sentiment);
        }
        
        return sentimentResults;
    }
    
    private HttpRequest createSentimentRequest(List<String> texts) {
        Map<String, String> requestMap = new Map<String, String>();
        requestMap.put('api_key', API_KEY);
        requestMap.put('language', 'detect');
        
        // Generate JSON request body
        JSONGenerator gen = JSON.createGenerator(true);

        gen.writeStartObject();
        
        for (String key : requestMap.keySet()) {
            gen.writeStringField(key, requestMap.get(key));     
        }
        
        gen.writeObjectField('data', texts);
        
        gen.writeEndObject();
        
        String requestData = gen.getAsString();
        
        // Create request
        HttpRequest request = new HttpRequest();
        request.setMethod('POST');
        request.setBody(requestData);
		request.setEndpoint(SENTIMENT_ENDPOINT_URL);     
        
        return request;
    }
    
    public class IndicoSentimentResponse {
        public List<Decimal> results;
    }
}