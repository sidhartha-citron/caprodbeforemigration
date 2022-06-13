/**
 * @FileName: TestUtilsWrapperPricebook
 * @Description: Wrapper class for default Pricebook test data
 * @Author: Graeme Ward
 * @ModificationLog:
 *-----------------------------------------------------------
 * Author            Date            Modification
 * Graeme Ward       11/11/2019         Created
 *-----------------------------------------------------------  
 */
public inherited sharing class TestUtilsWrapperPricebook {
    public List<Product2> products;
    public List<PricebookEntry> pricebookEntries;

    public TestUtilsWrapperPricebook(Integer numberOfProducts) {
        this(numberOfProducts, true);
    }

    public TestUtilsWrapperPricebook(Integer numberOfProducts, Boolean doInsert) {
        createTestData(numberOfProducts, doInsert);
    }

    private void createTestData(Integer numberOfProducts, Boolean doInsert) {
        products = (List<Product2>) TestUtils.createSObjectList(new Product2(), numberOfProducts);
        pricebookEntries = (List<PricebookEntry>) TestUtils.createSObjectList(new PricebookEntry(), numberOfProducts);

        if (doInsert) doInsert();
    }

    public void doInsert() {
        insert products;

        for (Integer i = 0; i < products.size(); i++) {
            pricebookEntries[i].Product2Id = products[i].Id;
        }

        insert pricebookEntries;
    }
}