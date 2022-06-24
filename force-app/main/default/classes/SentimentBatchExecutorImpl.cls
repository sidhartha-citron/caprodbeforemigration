/**
 * Batch Executor implementation for Sentiment retrieval. Given a list of records, the source field
 * and target field -- will retrieve and persist sentiment scores.
 * 
 * @author Ahsan Butt
 */
public class SentimentBatchExecutorImpl implements IBatchExecutor {
    private String notes = '';
    private Integer totalRecords = 0;
    private Integer numErrors = 0;
    
    private static final String SENTIMENT_PROVIDER_IMPL = 'IndicoSentimentProviderImpl';
    private static final String SOURCE_FIELD_PARAM_NAME = 'Source_Field__c';
    private static final String TARGET_FIELD_PARAM_NAME = 'Target_Field__c';
    private static final String TEXT_TRANSFORMS_PARAM_NAME = 'Text_Transforms__c';
        
    public void execute(List<sObject> scope, Map<String, String> params) {
        totalRecords += scope.size();
        
        try {
            // Instantiate sentiment provider impl class
            Type providerImpl = Type.forName(SENTIMENT_PROVIDER_IMPL);
            ISentimentProvider provider = (ISentimentProvider) providerImpl.newInstance();
            
            // Get source texts
            List<String> texts = new List<String>();
            String sourceField = params.get(SOURCE_FIELD_PARAM_NAME);
            String targetField = params.get(TARGET_FIELD_PARAM_NAME);
            String textTransformsParam = params.get(TEXT_TRANSFORMS_PARAM_NAME);
            
            // Filter out blanks
            List<sObject> filteredRecords = new List<sObject>();
            for (sObject obj : scope) {
                String text = (String) obj.get(sourceField);
                if (String.isNotBlank(text)) {
                    texts.add(text);
                    filteredRecords.add(obj);
                }
            }
            
            for (String text : texts) {
                System.debug('before transform');
                System.debug(text);
            }
            
            List<ITextTransform> textTransforms = getTextTransforms(textTransformsParam);
            
            // Apply text transforms
            if (textTransforms != null && textTransforms.size() != 0) {
                for (ITextTransform textTransform : textTransforms) {
                    texts = textTransform.transform(texts);
                }
            }
            
            for (String text : texts) {
                System.debug('after transform');
                System.debug(text);
            }
            
            List<SentimentResults> results = provider.getSentiment(texts);
            
            System.debug(results);

            // Update record with sentiment score score
            for (Integer i = 0; i < results.size(); i++) {
                sObject obj = filteredRecords.get(i);
                SentimentResults result = results.get(i);
                
                obj.put(targetField, result.score);
            }
            
            update scope;

        } catch (Exception e) {
            numErrors += totalRecords;
            notes += e.getMessage();
            System.debug(e);
        }  
    }
    
    private List<ITextTransform> getTextTransforms(String textTransformsParam) {
        List<ITextTransform> textTransforms = new List<ITextTransform>();
        
        if (String.isNotBlank(textTransformsParam)) {
            for (String textTransform : textTransformsParam.split(',')) {
                // Instantiate instance
                Type textTransformType = Type.forName(textTransform);
                ITextTransform textTransformInstance = (ITextTransform) textTransformType.newInstance();  
                
                textTransforms.add(textTransformInstance);
            }
        }
        
        return textTransforms;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public Integer getTotalRecords() {
        return totalRecords;
    }
    
    public Integer getNumErrors() {
        return numErrors;
    }
}