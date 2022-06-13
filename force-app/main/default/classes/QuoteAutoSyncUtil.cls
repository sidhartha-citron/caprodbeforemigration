public class QuoteAutoSyncUtil
{
    @future
    public static void syncQuote(Set<Id> quoteIds){
        if (!quoteIds.isEmpty()) {
            Map<Id, Opportunity> oppMap = new Map<Id, Opportunity>();
            
            for (Quote q : [SELECT Id, OpportunityId FROM Quote WHERE Id IN :quoteIds ORDER BY Name]) {
                if (oppMap.get(q.OpportunityId) == null) {
                    oppMap.put(q.opportunityId, new Opportunity(
                        Id = q.OpportunityId,
                        SyncedQuoteId = q.Id
                    ));
                }
            }
            
            if (!oppMap.isEmpty()) {
                database.update(oppMap.values(), false);
            }
        }
    }
    
    @future
    public static void signedQuote(Set<Id> quoteIds){
        if (!quoteIds.isEmpty()) {
            Map<Id, Opportunity> oppMap = new Map<Id, Opportunity>();
            
            for (Quote q : [SELECT Id, OpportunityId FROM Quote WHERE Id IN :quoteIds]) {
                oppMap.put(q.Id, new Opportunity(
                    Id = q.OpportunityId,
                    //SyncedQuoteId = q.Id,
                    StageName = 'Signed'
                ));
            }
            
            if (!oppMap.isEmpty()) {
                database.update(oppMap.values(), false);
            }
        }
    }
}