public class UploadProductImageController {
    
    public Blob fileData {get;set;}
    public String fileName {get;set;}
    public String fileContentType {get;set;}
    public Document imageFile {get;set;}
    public Product2 prod {get;set;}
    
    public UploadProductImageController(ApexPages.StandardController controller) {
        prod = [Select Id, Name, Product_Image_Id__c From Product2 Where Id =: controller.getId() Limit 1];
        if(!String.isBlank(prod.Product_Image_Id__c)) {
            imageFile = [Select Id, Name, FolderID, Body, Type From Document Where Id =: prod.Product_Image_Id__c Limit 1];  
        }
    }
    
    public PageReference upsertImage() {
        if(imageFile != null) {
            // Update Document
            imageFile.Body = fileData;
            imageFile.Type = fileContentType;
            update imageFile;
        } else {
            // Create Document
            Folder f = [Select Id From Folder Where Name = 'Product Images' Limit 1];
            imageFile = new Document( folderId = f.Id, isPublic = true, name = prod.Name , description = 'Product Image for ' + prod.Name);
            imageFile.Body = fileData;
            imagefile.Type = fileContentType;
            insert imageFile;
            prod.Product_Image_Id__c = imageFile.Id;
            update prod;
        }
        return new PageReference('/' + prod.id);    
    }    
}