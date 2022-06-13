/**
 * @description Service class to handle SOQL and DML for the Quote SObject and related SObjects
 */
public with sharing class QuoteService {

    /**
     * @description get quote by target Id
     *
     * @param targetId - quote Id
     *
     * @return quote based on Id
     */
    public static Quote getQuoteById(Id targetId){
        List<Quote> targetList = getQuoteByIds(new Set<Id>{targetId});

        if(!targetList.isEmpty()){
            return targetList[0];
        } else {
            return null;
        }
    }

    /**
     * @description get quotes by target ids
     *
     * @param targetIds - quote ids
     *
     * @return list of quotes based on target ids
     */
    public static List<Quote> getQuoteByIds(Set<Id> targetIds) {
        return [
            SELECT Id,
                Name,
                OpportunityId,
                Opportunity.SyncedQuoteId
            FROM Quote
            WHERE Id IN:targetIds
        ];
    }
}