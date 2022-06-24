/**
* Name: ProductTriggerHandler
* Author: PwC
* Date Created: May 16, 2019
* Purpose: To handle logic based around the Product2 object
*/ 
public class ProductTriggerHandler extends TriggerHandler {
    private Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    private final String DELIMITER = '~';
    public Map<Id, Product2> oldMap {get;private set;}
    public List<Product2> products {get;private set;}
    
    public ProductTriggerHandler(List<Product2> products, Map<Id, Product2> oldMap) {
        this.setMaxLoopCount(5);
        
        this.oldMap = oldMap;
        this.products = products;
    }
    
    public override void beforeInsert() {
        handleProductInsert();
    }
    
    public override void beforeUpdate() {
        handleProductUpdate();
    }
    
    public void handleProductInsert() {
        for (Product2 product : products) {
            //only do these keys for pest controls
            if (!product.IsPestService__c || String.isBlank(product.Treatment_Type__c) || String.isBlank(product.Number_of_Rooms__c) || String.isBlank(product.Infestation_Level__c)) {
                continue;
            }
            
            product.Product_Unique_Key__c = buildProductKey(product);
        }
    }
    
    public void handleProductUpdate() {
        for (Product2 product : products) {
            //only do these keys for pest controls
            if (!product.IsPestService__c || String.isBlank(product.Treatment_Type__c) || (String.isBlank(product.Number_of_Rooms__c) && !product.Number_of_Rooms_NA__c) || String.isBlank(product.Infestation_Level__c)) {
                continue;
            }
            
            String key = buildProductKey(product);
            
            Product2 oldProduct = oldMap.get(product.Id);
            
            if (product.Product_Unique_Key__c != key) {
                product.Product_Unique_Key__c = key;
            }
        }
    }
    
    public String buildProductKey(Product2 product) {
        return product.Number_of_Rooms_NA__c
            ? product.Treatment_Type__c + DELIMITER + product.Infestation_Level__c
            : product.Treatment_Type__c + DELIMITER + product.Number_of_Rooms__c + DELIMITER + product.Infestation_Level__c;
    }
}