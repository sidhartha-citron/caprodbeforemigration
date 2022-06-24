public class OrderItemUtilityClass {
    static Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    static final String KEY_DELIMITER = '.';
    static final String ITEM_NUMBER_DELIMITER = '-';
    static final String PEST_SPECIAL = 'PEST_SPECIAL';
    static final String PEST_SPECIAL_CODE = '1-55';
    public static Set<Id> OrderInvFlagList = new Set<Id>();
    public static Map<Id, Order> mapOrders = new Map<Id, Order>();
    
    public static void setActiveLookupToOrder(List<OrderItem> orderItems) {
        for (OrderItem oi : orderItems) {
            oi.Order__c = oi.Active__c && String.isBlank(oi.PO_Number__c) ? oi.OrderId : null;
        }
    }
    
    public static List<OrderItem> orderItemPriceController(List<OrderItem> orderItems, Map<Id, OrderItem>oldItems) {
        List<OrderItem> orderItemsToReturn = new List<OrderItem>();
        
        if (!TriggerHelper.hasOrderItemPricingBeenSet) {
            TriggerHelper.hasOrderItemPricingBeenSet = true;
        } else {
            //already handled data in this transaction
            //return orderItemsToReturn;
        }
        
        if (orderItems.isEmpty()) {
            System.debug('empty list');
            return orderItemsToReturn;
        }
        
        Set<Id> accountIds = new Set<Id>();
        //Set<Id> orderIds = new Set<Id>();
        Set<String> productItemNumbers = new Set<String>();
        
        Map<Id, List<OrderItem>> orderAndLineItemsMap = new Map<Id, List<OrderItem>>();//opportuntyid -> orderitems
        Map<String, Decimal> standingOrderLinePriceItemMapWithFrequency = new Map<String, Decimal>();
        //Begin:Shashi:10-1-2019:Pest Control, Emergency order check
        //Map<Id, Order> mapOrders = new Map<Id, Order>();
        //End
        
        for (OrderItem oi : orderItems) {
            //If Create Invoice Adjustment Flag is set do not perform calculations : 3-23-2020
            if(OrderInvFlagList.contains(oi.OrderId)){continue;}
            
            OrderItem oldVersion = oldItems == null ? new OrderItem() : oldItems.get(oi.Id);
            
            System.debug('~~Bypass Standing Order~~' + oi.Bypass_Standing_Order_Price_Engine__c);
            System.debug('~~Has Warranty~~' + oi.Has_Warranty__c);
            
            //Bypass_Standing_Order_Price_Engine__c and Has_Warranty__c is for case 21618
            if (oi.Bypass_Standing_Order_Price_Engine__c ||
                oi.Has_Warranty__c ||
                (oldVersion.Id != null &&
				oi.Frequency__c == dataSets.Non_Recurring_Frequency_Value__c &&
                oi.Service_Price_Per_Unit__c == oldVersion.Service_Price_Per_Unit__c && 
                oi.Purchase_Price__c == oldVersion.Purchase_Price__c &&
                oi.Requested_Price_Approved__c == oldVersion.Requested_Price_Approved__c)) 
            {
                oi.Bypass_Standing_Order_Price_Engine__c = false;//allow the record to bypass the engine this one time
                System.debug('record thrown away');
                continue;
            }
            
            if (!orderAndLineItemsMap.containsKey(oi.OrderId)) {
                orderAndLineItemsMap.put(oi.OrderId, new List<OrderItem>());
            }
            
            orderAndLineItemsMap.get(oi.OrderId).add(oi);
            //orderIds.add(oi.OrderId);
            //accountIds.add(oi.Account_Id__c);
        }
        
        productItemNumbers.remove(null);
        //orderIds.remove(null);
        orderAndLineItemsMap.remove(null);
        
        if (orderAndLineItemsMap.isEmpty()) {
            System.debug('no records to process');
            return orderItemsToReturn;
        }
        
        //Shashi:12/22/2020:SOQL Query reduction
        for(Order o:mapOrders.values()){
            accountIds.add(o.AccountId);
        }
        /*if (!orderIds.isEmpty()) {
            //Begin:Shashi:10-1-2019:Pest Control, Emergency order check
            for (Order o : [SELECT Id, AccountId,Line_of_Businesses__c,Emergency__c FROM Order WHERE Id IN :orderIds]) {
                accountIds.add(o.AccountId);
                mapOrders.put(o.Id, o);
            }
            //End
        }*/
        
        accountIds.remove(null);
        
        standingOrderLinePriceItemMapWithFrequency = PriceCalculationUtility.buildStandingOrderPriceMap(accountIds);
        
        //System.debug(orderAndLineItemsMap);
        //System.debug(standingOrderLinePriceItemMapWithFrequency);
        
        //if (!standingOrderLinePriceItemMapWithFrequency.isEmpty()) {
            for (Id oliId : orderAndLineItemsMap.keySet()) {
                for (OrderItem oi : orderAndLineItemsMap.get(oliId)) {
                    //System.debug(oi.Product2Id);
                    //System.debug(oi.Product_Item_Number__c);
                    String[] delimitedValues = oi.Product_Item_Number__c.split(ITEM_NUMBER_DELIMITER);
                    //Begin:Shashi:9-6-2019:Prevent null exception if Product_Item_Number__c is empty
                    //String serviceKey = delimitedValues[0] + ITEM_NUMBER_DELIMITER + delimitedValues[1] + ITEM_NUMBER_DELIMITER + delimitedValues[2] + KEY_DELIMITER + oi.Account_Id__c + KEY_DELIMITER + oi.Frequency__c;
                    String serviceKey = '';
                    if(delimitedValues.size()>=1){serviceKey+=delimitedValues[0];}
                    if(delimitedValues.size()>=2){serviceKey+=ITEM_NUMBER_DELIMITER + delimitedValues[1];}
                    if(delimitedValues.size()>=3){serviceKey+=ITEM_NUMBER_DELIMITER + delimitedValues[2];}
                    serviceKey+=KEY_DELIMITER + oi.Account_Id__c + KEY_DELIMITER + oi.Frequency__c;
                    //End
                    String pestSpecialKey = oi.Product_Item_Number__c + KEY_DELIMITER + oi.Account_Id__c + KEY_DELIMITER + PEST_SPECIAL;
                    String allOtherKey = oi.Product_Item_Number__c + KEY_DELIMITER + oi.Account_Id__c;
                    Boolean isService = oi.Item_Type__c == dataSets.Item_Type_of_Services__c;
                    Decimal itemPrice;
                    
                    System.debug('isService: '+isService);
                    System.debug(oi.Item_Type__c);
                    
                    //use the price entered by the user for services
                    if (isService && !dataSets.Activate_Logic_for_Services__c) {
                        continue;
                    }
                    
                    //CPQCN-457: Shashi Puttaswamy: 12-10-2020 : Service Unit Price doesn't require override from Standing Order 
                    if (isService) {
                        if (oi.Product_Item_Number__c.startsWith(PEST_SPECIAL_CODE)) {
                            System.debug('PEST SPECIAL KEY >>> ' + pestSpecialKey);
                            itemPrice = standingOrderLinePriceItemMapWithFrequency.get(pestSpecialKey);
                        } else {
                            itemPrice = standingOrderLinePriceItemMapWithFrequency.get(serviceKey);
                        }
                    } 
                    else {
                        itemPrice = standingOrderLinePriceItemMapWithFrequency.get(allOtherKey);
                    }
                    
                    OrderItem oldVersion;
                    
                    if (oldItems != null) {
                    	oldVersion = oldItems.get(oi.Id);
                    }
                    
                    Boolean isPestEmergencyOrder = false;
                    if(mapOrders.containsKey(oi.OrderId)){
                    	Order curOrder = mapOrders.get(oi.OrderId);
                        if(curOrder.Emergency__c && ((curOrder.Line_of_Businesses__c!=null && curOrder.Line_of_Businesses__c==dataSets.Pest_LOB__c) ||
                                                     (oi.Line_of_Business__c!=null && oi.Line_of_Business__c==dataSets.Pest_LOB__c))){
                        	isPestEmergencyOrder = true;
                        }
                    }
                    
                    if (!oi.Requested_Price_Approved__c) {
                        if(!isPestEmergencyOrder){continue;}
                        //Begin:Shashi:10-1-2019:Pest Control, Emergency order check
                        Boolean isServicePriceCheck=false;
                        
                        if(isPestEmergencyOrder){isServicePriceCheck=true;}
                        else{if(oi.Service_Price_Per_Unit__c != null){isServicePriceCheck=true;}}
                        if (oi.Item_Type__c == dataSets.Item_Type_of_Services__c && isServicePriceCheck){ //&& oi.Service_Price_Per_Unit__c != null) {
                        //End
                            System.debug('~~itemPrice: '+itemPrice);
                            
                            if (itemPrice != null) {// && oi.Service_Price_Per_Unit__c != itemPrice
                                oi.Requested_Price__c = oi.Service_Price_Per_Unit__c;
                                oi.Service_Price_Per_Unit__c = itemPrice;
                            } else {
                                //leverage PBE
                                System.debug('leveraging PBE for service');
                                if (oi.Service_Price_Per_Unit__c != oi.PBE_List_Price__c) {
                                    oi.Requested_Price__c = oi.Service_Price_Per_Unit__c;
                                    oi.Service_Price_Per_Unit__c = oi.PBE_List_Price__c;
                                }
                            }
                        } 
                        else if (oi.Item_Type__c != dataSets.Item_Type_of_Services__c && oi.Purchase_Price__c != null) {
                            //check for SOLI
                            if (itemPrice != null) {
                                System.debug('checking SOLI price');
                                //if (oi.Purchase_Price__c != itemPrice) {
                                    oi.Requested_Price__c = oi.Purchase_Price__c;
                                    oi.Purchase_Price__c = itemPrice;
                                //}
                            } else {
                                System.debug('checking PBE price');
                                Decimal comparisonFinal = 0;
                                
                                //if threshold logic not activated, just use PBE price as is
                                if (dataSets.Activate_Threshold_Logic_For_Orders__c) {
                                    Decimal thresholdAdjustment;
                                    
                                    if (oi.Item_Type__c == dataSets.Item_Type_for_Equipment__c) {
                                        thresholdAdjustment = dataSets.Equipment_Discount_Threshold__c;
                                    } else if (oi.Item_Type__c == dataSets.Item_Type_for_Consumables__c) {
                                        thresholdAdjustment = dataSets.Consumables_Discount_Threshold__c;
                                    }
                                
                                    comparisonFinal = thresholdAdjustment == null ? oi.PBE_List_Price__c : ((100 - thresholdAdjustment) / 100) * oi.PBE_List_Price__c;
                                    comparisonFinal.setScale(2);
                                } else {
                                    comparisonFinal = oi.PBE_List_Price__c;
                                }
                                
                                if (oi.Item_Type__c != dataSets.Item_Type_of_Services__c && oi.Purchase_Price__c != null) {
                                    if (oi.Purchase_Price__c < comparisonFinal || oi.Purchase_Price__c > oi.PBE_List_Price__c) {
                                        oi.Requested_Price__c = oi.Purchase_Price__c;
                                        oi.Purchase_Price__c = oi.PBE_List_Price__c;
                                    }
                                }
                            }
                        }
                    } 
                    else if (oldVersion == null || (oi.Requested_Price_Approved__c && !oldVersion.Requested_Price_Approved__c)) {
                        if (oi.Requested_Price__c == null) {
                            oi.addError(dataSets.Requested_Price_Blank_Error_Message__c);
                        } else if (isService) {
                            oi.Service_Price_Per_Unit__c = oi.Requested_Price__c;
                            //oi.Requested_Price_Approved__c = false;
                        } else {
                            oi.Purchase_Price__c = oi.Requested_Price__c;
                            //oi.Requested_Price_Approved__c = false;
                        }
                    }
                    orderItemsToReturn.add(oi);
                }
            }
        //}
        return orderItemsToReturn;
    }
}