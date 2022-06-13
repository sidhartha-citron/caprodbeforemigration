public class AuraStatusResponse {
    @AuraEnabled public Boolean isSuccessful {get;set;}
    @AuraEnabled public String responseType {get;set;}
    @AuraEnabled public String responseMessage {get;set;}
    @AuraEnabled public SObject record {get;set;}
    
    public AuraStatusResponse(Boolean isSuccessful, String responseType, String responseMessage, SObject record) {
        this.isSuccessful = isSuccessful;
        this.responseType = responseType;
        this.responseMessage = responseMessage;
        this.record = record;
    }
}