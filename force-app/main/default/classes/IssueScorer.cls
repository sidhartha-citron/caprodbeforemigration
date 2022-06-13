/**
 * Contains Issue Scoring logic.
 * @author: Ahsan Butt
 */
public class IssueScorer {

    private static Map<String, List<Issue_Scoring_Settings__c>> getScoreSettings() {
        Map<String, List<Issue_Scoring_Settings__c>> settingsMap = new Map<String, List<Issue_Scoring_Settings__c>>();

        List<Issue_Scoring_Settings__c> settings = [SELECT Source_Field__c, Target_Field__c, Weight__c, Override_Field__c
                                                    FROM Issue_Scoring_Settings__c];
        

        for (Issue_Scoring_Settings__c setting : settings) {
            if (settingsMap.containsKey(setting.Target_Field__c)) {
                settingsMap.get(setting.Target_Field__c).add(setting);
            } else {
                settingsMap.put(setting.Target_Field__c, new List<Issue_Scoring_Settings__c>{setting});
            }
        }

        return settingsMap;
    }

    private static Integer parseScore(String val) {
        if (String.isBlank(val)) return 0;

        return Integer.valueOf(val.substring(0, 1));

    }

    public static void score(List<Issue__c> issues) {
        // Get map from target score field to list of source fields (and weights)
        Map<String, List<Issue_Scoring_Settings__c>> scoreSettings = getScoreSettings();

        for (Issue__c issue : issues) {
            // Iterate over all scores (i.e., target fields) to calc 
            for (String targetField : scoreSettings.keySet()) {
                List<Issue_Scoring_Settings__c> settings = scoreSettings.get(targetField);

                // Tally sum of every source field value multipled by its appropriate weight
                Decimal score = 0;
                for (Issue_Scoring_Settings__c setting : settings) {
                    if (String.isNotBlank(setting.Override_Field__c) && issue.get(setting.Override_Field__c) != null) {
                        score = (Decimal) issue.get(setting.Override_Field__c);
                        break;
                    }
                    
                    Integer sourceScore = parseScore((String) issue.get(setting.Source_Field__c));
                    score += (Decimal) sourceScore * setting.Weight__c;
                }

                // Store score in target field on record
                issue.put(targetField, score);
            }
        }
    }
}