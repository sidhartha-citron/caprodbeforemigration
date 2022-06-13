/**
 * Interface for sentiment providers.
 * 
 * @author Ahsan Butt
 */
public interface ISentimentProvider {
    List<SentimentResults> getSentiment(List<String> texts);
}