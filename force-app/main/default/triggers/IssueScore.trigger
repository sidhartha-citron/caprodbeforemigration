/**
 * Updates an issue's score, as configured in custom settings.
 * @author: Ahsan Butt
 */
trigger IssueScore on Issue__c (before insert, before update) {
    IssueScorer.score(Trigger.new);
}