/**
 * Test class for Issue Scorer
 * @author: Ahsan Butt 
 */

@isTest
public class TestIssueScorer {
    
    private static Issue_Scoring_Settings__c createScoreSetting(String source, String target, Decimal weight, String overrideField) {        
        Issue_Scoring_Settings__c setting = new Issue_Scoring_Settings__c();
        setting.Name = source;
        setting.Source_Field__c = source;
        setting.Target_Field__c = target;
        setting.Weight__c = weight;
        setting.Override_Field__c = overrideField;
        
        return setting;
    }
    
    static testMethod void testScoreSettings() {
    	// Insert score settings
        List<Issue_Scoring_Settings__c> settings = new List<Issue_Scoring_Settings__c>();
        settings.add(createScoreSetting('Cost_One_Time__c', 'Business_Impact_Score__c', 0.25, ''));
        settings.add(createScoreSetting('Cost_Recurring_Annual__c', 'Business_Impact_Score__c', 0.75, ''));
        insert settings;
        
        // Insert issue
		Issue__c i = new Issue__c();
        i.Name = 'Test Issue';
        i.Cost_One_Time__c = '1 - <$5K';
        i.Cost_Recurring_Annual__c = '5 - >$100K';
        
        insert i;
        
        // Retrieve the issue
        List<Issue__c> issueAfterScoring = [SELECT Id, Business_Impact_Score__c
                                           	FROM Issue__c
                                            WHERE Id =: i.Id];
        
        Decimal expectedScore = (0.25 * 1) + (0.75 * 5);
        
        System.assertEquals(expectedScore, issueAfterScoring.get(0).Business_Impact_Score__c, 'Score should match.');
    }
    
        static testMethod void testOverrideSettings() {
    	// Insert score settings
        List<Issue_Scoring_Settings__c> settings = new List<Issue_Scoring_Settings__c>();
        settings.add(createScoreSetting('Cost_One_Time__c', 'Business_Impact_Score__c', 0.25, ''));
        settings.add(createScoreSetting('Cost_Recurring_Annual__c', 'Business_Impact_Score__c', 0.75, 'Business_Impact_Score_Override__c'));
        insert settings;
        
        // Insert issue
		Issue__c i = new Issue__c();
        i.Name = 'Test Issue';
        i.Cost_One_Time__c = '1 - <$5K';
        i.Cost_Recurring_Annual__c = '5 - >$100K';
        i.Business_Impact_Score_Override__c = 50;
        
        insert i;
        
        // Retrieve the issue
        List<Issue__c> issueAfterScoring = [SELECT Id, Business_Impact_Score__c
                                           	FROM Issue__c
                                            WHERE Id =: i.Id];
        
        
        System.assertEquals(i.Business_Impact_Score_Override__c, issueAfterScoring.get(0).Business_Impact_Score__c, 'Score should match override.');
    }
}