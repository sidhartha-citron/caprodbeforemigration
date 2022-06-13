@isTest private class UploadProductImageControllerTest {
    
    static testMethod void test1() {
        Product2 product1 = new Product2(
            Name='Product1',
            ProductCode='Code',
            isActive=true
        );
        insert product1;
        
        UploadProductImageController con = new UploadProductImageController(new ApexPages.StandardController(product1));
        
        con.upsertImage();
    }
    
    static testMethod void test2() {
        Document d = new Document(Name='test');
        d.AuthorId = UserInfo.getUserId();
        d.FolderId = UserInfo.getUserId();
        insert d;
        
        Product2 product1 = new Product2(
            Name='Product1',
            ProductCode='Code',
            Product_Image_Id__c=d.Id,
            isActive=true
        );
        insert product1;
        
        UploadProductImageController con = new UploadProductImageController(new ApexPages.StandardController(product1));
        
        con.upsertImage();
    }
}