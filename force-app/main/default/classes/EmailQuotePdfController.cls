public class EmailQuotePdfController {
@AuraEnabled
   public static QuoteDocument getDocId(Id quoteId){
      return ([SELECT id FROM quotedocument WHERE quoteid=:quoteId ORDER BY createdDate DESC LIMIT 1]);
   }
   
@AuraEnabled    
   public static Quote getContactId(Id quoteId){
       system.debug('The quote id is ' + quoteId);
      return ([SELECT contactid FROM quote WHERE id=:quoteId LIMIT 1]);
   }
   
@AuraEnabled
   public static String  getTemplateId(){
       
       return String.valueOf('');
   }
   
}