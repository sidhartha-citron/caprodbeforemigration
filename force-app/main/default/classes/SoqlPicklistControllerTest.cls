/**
 * @description
 *
 * Created by Sanchivan Sivadasan on 2020-10-01.
 *
 */
@IsTest
public with sharing class SoqlPicklistControllerTest {
    @IsTest
    static void getPicklistOptionsTest() {
        List<WorkType> workTypesToInsert = new List<WorkType>();
		WorkType workType1 = new WorkType(
			Name='TestWorkType1',
			DurationType='Minutes',
			EstimatedDuration=1.7
		);
        
        workTypesToInsert.add(workType1);        

		WorkType workType2 = new WorkType(
			Name='TestWorkType2',
			DurationType='Minutes',
			EstimatedDuration=1
		);
        
        workTypesToInsert.add(workType2);
        
        insert workTypesToInsert;
        
        Product2 product1 = new Product2(
			Name='TestProduct1',
			Allowable_Frequencies__c='One-Time;Monthly;Weekly;Annually',
			IsActive=TRUE,
			Family='Hygiene',
			ExternalId__c = 'TestProduct1',
			CPQ_Price_Model__c = 'Hygiene Pricing Model',
			Item_Type__c = 'Service',
            Service_Work_Type__c = workType1.Id,
			CPQ_Cost__c = 0.93,
			CPQ_Amortization__c = 4,
			CPQ_Capital_Cost__c = 0
		);

		Product2 product2 = new Product2(
			Name='TestProduct2',
			Allowable_Frequencies__c='One-Time;Monthly;Weekly;Annually',
			IsActive=TRUE,
			Family='Hygiene',
			Item_Type__c = 'Service',
            Service_Work_Type__c = workType2.Id,
			ExternalId__c = 'TestProduct2',
			CPQ_Price_Model__c = 'Hygiene Pricing Model',
			CPQ_Cost__c =  57.33,
			CPQ_Amortization__c = 4,
			CPQ_Capital_Cost__c = 0
		);
        
        List<Product2> products = new List<Product2>();
        products.add(product1);
        products.add(product2);
        
        insert products;
        
        CPQ2_Related_Product__c relatedProduct = new CPQ2_Related_Product__c();
        relatedProduct.Name = 'related Product';
        relatedProduct.CPQ2_Parent_Product__c = products[0].Id;
        relatedProduct.CPQ2_Related_Product__c = products[1].Id;
        
        insert relatedProduct;
        
        SoqlPicklistController.getPicklistOptions('CPQ2_Related_Product__c', 'Id', 'Name', 'Name = \'related Product\'', 'Name');
        SoqlPicklistController.getPicklistOptions('CPQ2_Related_Product__c', 'Id', '', 'Name = \'related Product\'', 'Name');
    }
}