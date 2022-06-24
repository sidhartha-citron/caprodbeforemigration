public class PriceCalculationUtility {
    static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    static final String KEY_DELIMITER = '.';
    static final String ITEM_NUMBER_DELIMITER = '-';
    static final Integer EXPECTED_NUMBER_OF_DELIMITED_VALUES = 3;
    static final String PEST_SPECIAL = 'PEST_SPECIAL';
    static final String PEST_SPECIAL_CODE = '1-55';//put in code, not in a custom setting because this value should not change - please don't change this value
    
    public static Map<String, Decimal> buildStandingOrderPriceMap(Set<Id> accountIds) {
        if (accountIds.isEmpty()) {
			System.debug('accountsIds is empty');
            return null;
        }
        
        Map<String, Decimal> standingOrderLinePriceItemMapWithFrequency = new Map<String, Decimal>();
        
        for (Standing_Order_Line_Item__c item : [SELECT Price__c, Item_Number__c, Standing_Order__r.Account__c, Frequency_Picklist__c, Service_Price_Per_Visit__c FROM Standing_Order_Line_Item__c 
                                                 WHERE Standing_Order__r.Account__c IN:accountIds AND Standing_Order__r.Active__c=TRUE AND Active__c=TRUE
                                                 AND Price__c!= NULL ORDER BY Price__c ASC])
        {
            
            String[] delimitedValues = item.Item_Number__c.split(ITEM_NUMBER_DELIMITER);
            String allOtherKey = item.Item_Number__c + KEY_DELIMITER + item.Standing_Order__r.Account__c;
            
            if (delimitedValues.size() >= EXPECTED_NUMBER_OF_DELIMITED_VALUES) {
                String serviceKey;
                
                if (item.Item_Number__c.startsWith(PEST_SPECIAL_CODE)) {
                    System.debug(item.Item_Number__c);
                    serviceKey = item.Item_Number__c + KEY_DELIMITER + item.Standing_Order__r.Account__c + KEY_DELIMITER + PEST_SPECIAL;
                } else {
                    serviceKey = delimitedValues[0] + ITEM_NUMBER_DELIMITER + delimitedValues[1] + ITEM_NUMBER_DELIMITER + delimitedValues[2] + KEY_DELIMITER + item.Standing_Order__r.Account__c + KEY_DELIMITER + item.Frequency_Picklist__c;
                }
                
                System.debug('~~ServiceKey:' + serviceKey);
                
                //price ordered by descending so the first one is the one we want (highest)
                if (!standingOrderLinePriceItemMapWithFrequency.containsKey(serviceKey)) {
                    standingOrderLinePriceItemMapWithFrequency.put(serviceKey, item.Service_Price_Per_Visit__c);
                } else {
                    Decimal currentPrice = standingOrderLinePriceItemMapWithFrequency.get(serviceKey);
                    if (currentPrice > item.Service_Price_Per_Visit__c) {
                        standingOrderLinePriceItemMapWithFrequency.put(serviceKey, item.Service_Price_Per_Visit__c);
                    }
                }
            } else {
                System.debug('bad data >>> ' + delimitedValues);
            }
            
            if (!standingOrderLinePriceItemMapWithFrequency.containsKey(allOtherKey)) {
                standingOrderLinePriceItemMapWithFrequency.put(allOtherKey, item.Price__c);
            } else {
                Decimal currentPrice = standingOrderLinePriceItemMapWithFrequency.get(allOtherKey);
                
                if (currentPrice > item.Service_Price_Per_Visit__c) {
                    standingOrderLinePriceItemMapWithFrequency.put(allOtherKey, item.Service_Price_Per_Visit__c);
                }
            }
        }
        return standingOrderLinePriceItemMapWithFrequency;
    }
}