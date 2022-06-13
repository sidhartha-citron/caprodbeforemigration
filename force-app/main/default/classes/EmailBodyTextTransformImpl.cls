/**
 * Performs transform to extract email body from text.
 * 
 * @author Ahsan Butt
 */
public class EmailBodyTextTransformImpl implements ITextTransform {
	private static final String BODY_LABEL = 'Body';
    
    public List<String> transform(List<String> texts) {
        IndicoTextLabelProviderImpl provider = new IndicoTextLabelProviderImpl();
        List<List<IndicoTextLabelProviderImpl.IndicoLabelResult>> labelResults = provider.labelText(texts, IndicoTextLabelProviderImpl.TextType.EMAIL);
        
        // if response was empty for some reason, return texts un-transformed (or fail?)
        if (labelResults == null || labelResults.size() == 0) return texts;
        
        List<String> transformedTexts = new List<String>();
        for (Integer i = 0; i < texts.size(); i++) {
            List<IndicoTextLabelProviderImpl.IndicoLabelResult> labelResultsForText = labelResults.get(i);
            String text = texts.get(i);
            
            String transformedText = getBodyText(labelResultsForText);
            
            // if results from label returns blank body, then return text un-transformed
            if (String.isNotBlank(transformedText)) {
            	transformedTexts.add(transformedText);    
            } else {
                transformedTexts.add(text);
            }
            
        }
        
        return transformedTexts;
    }
    
    private String getBodyText(List<IndicoTextLabelProviderImpl.IndicoLabelResult> labelResultsForText) {
        // return first body text
        for (IndicoTextLabelProviderImpl.IndicoLabelResult labelResult : labelResultsForText) {
            if (labelResult.label == BODY_LABEL) {
                return labelResult.text;
            }
        }
        
        return null;
    }
}