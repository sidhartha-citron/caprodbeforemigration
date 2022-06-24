trigger CreateQuotePDF on Attachment (after insert) {
    String quotePrefix = Quote.sobjecttype.getDescribe().getKeyPrefix();
    List<QuoteDocument> quotePdfs = new List<QuoteDocument>();
    
    for (Attachment a : Trigger.new) {
        System.debug('-- attachment parent: ' + a.ParentId);
        if (a.ParentId != null && ((String)a.ParentId).left(3) == quotePrefix) {
            quotePdfs.add(new QuoteDocument(
                          QuoteId = a.ParentId,
                          Document = a.Body
                         ));
        }
    }
    
    if (!quotePdfs.isEmpty()) {
        database.insert(quotePdfs,false);
    }
}