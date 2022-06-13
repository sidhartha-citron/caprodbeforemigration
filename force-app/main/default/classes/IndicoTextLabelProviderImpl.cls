/**
 * Indico Provider implementation that labels text via Indico API.
 * 
 * @author Ahsan Butt
 */
public class IndicoTextLabelProviderImpl {
    private static String API_KEY;
    private static String EMAIL_TEXT_MODEL_ID;
    private static String TEXT_LABELING_ENDPOINT_URL;
    
    static {
        IndicoAPICredentials__c credentials = [SELECT API_Key__c, Text_Labeling_Endpoint_URL__c, Email_Text_Model_Id__c FROM IndicoAPICredentials__c WHERE Name = 'Sentiment API'];
        API_KEY = credentials.API_Key__c;
        EMAIL_TEXT_MODEL_ID = credentials.Email_Text_Model_Id__c;
        TEXT_LABELING_ENDPOINT_URL = credentials.Text_Labeling_Endpoint_URL__c;
    }
    
    public enum TextType {EMAIL}
    
    public List<List<IndicoLabelResult>> labelText(List<String> texts, TextType t) {
        // Create request
        HttpRequest request = createLabelRequest(texts);
        
        // Make request
        Http http = new Http(); 
        HttpResponse resp = http.send(request);
    
        // Check status and against null -- throw exception
        if (resp.getStatusCode() != 200 || resp.getBody() == null || String.isBlank(resp.getBody())) {
            throw new TextLabelProviderException('Error calling API:\n' + resp.getStatus());
        }
        
        System.debug(resp.getBody());
        
        IndicoLabelResponse response = (IndicoLabelResponse)JSON.deserialize(resp.getBody(), IndicoLabelResponse.class);
        
        System.debug(response);
        
        if (response.results !=null && response.results.size() > 0) return response.results;
        
        return null;
        
    }
    
    private HttpRequest createLabelRequest(List<String> texts) {
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
		gen.writeObjectField('collection', EMAIL_TEXT_MODEL_ID);

        gen.writeEndObject();
        
        String requestData = gen.getAsString();
        
        // Create request
        HttpRequest request = new HttpRequest();
        request.setMethod('POST');
        request.setBody(requestData);
		request.setEndpoint(TEXT_LABELING_ENDPOINT_URL);     

        System.debug(requestData);
        
        return request;
    }
   
    public class IndicoLabelResult {
    	public Decimal confidence;
        public String label;
        public String text;
    }
    
    private class IndicoLabelResponse {
        public List<List<IndicoLabelResult>> results;
    }
}