trigger SetOrderFields on Order (before insert, before update, before delete) {
    Field_Service_Settings__c custSetting = Field_Service_Settings__c.getOrgDefaults();
    
    Map<Id,Account> accMap = new Map<Id,Account>();
    Map<Id, String> siteSurveyErrors = new Map<Id, String>();
    Map<Id, String> orderAddressErrors = new Map<Id, String>();
    Map<Id, String> orderServiceTerritoryErrors = new Map<Id, String>();
    Map<Id, String> orderOperatingHoursErrors = new Map<Id, String>();
    Map<Id, String> orderItemFrequencyErrors = new Map<Id, String>();
    Map<Id, String> orderItemFrequencyErrorsEmergencyOrders = new Map<Id, String>();
    //Map<Id, String> orderTiedToBillTo = new Map<Id, String>();
    Set<Id> orderIds = new Set<Id>();
    Set<Id> ticketIds = new Set<Id>();
    Map<Id, Case> ticketMap = new Map<Id, Case>();
    Id userProfileId = UserInfo.getProfileId();
    String activeStatus = custSetting.Order_Active_Stage__c;
    
    if(Trigger.isDelete) {
        Set<Id> idsToDelete = Trigger.oldMap.keySet();
        for(Order o : Trigger.old) {
            if(o.Parent_Order__c != null) {
                idsToDelete.remove(o.Id);
            }
        }
        delete [SELECT Id, Order__c FROM Order_Item_Location__c WHERE Order__c IN:idsToDelete];
        delete [SELECT Id, Originating_Parent_ID__c FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c IN:idsToDelete];
        
    } else {
        for (Order o : Trigger.new) {
            Order oldRec = Trigger.isInsert? new Order() : Trigger.oldMap.get(o.Id);
            /*if (o.Status == custSetting.Shopping_Cart_Order_Draft_Stage__c && o.BillToContactId != null) {
                o.ShoppingCartEID__c = o.BillToContactId + 'Shopping Cart';
            } else {
                o.ShoppingCartEID__c = null;
            }*/
            
            //o.Inventory_Consumed__c = o.Inventory_Allocated__c && !oldRec.Inventory_Allocated__c ? FALSE :  o.Inventory_Consumed__c; //for case 21528 to detect inventory allocated change
            
            //case 21603 - remove dates if all values are wiped out [dk]
            if(o.Season_Start_Day__c!=null) { 
                o.SeasonStartDayValue__c = Decimal.valueOf(o.Season_Start_Day__c); 
            } else { 
                o.SeasonStartDayValue__c = null; 
            }
            
            if(o.Season_Start_Month__c!=null) { 
                o.SeasonStartMonthValue__c = Decimal.valueOf(o.Season_Start_Month__c); 
            } else { 
                o.SeasonStartMonthValue__c = null; 
            }
            
            if(o.Season_End_Day__c!=null) { 
                o.SeasonEndDayValue__c = Decimal.valueOf(o.Season_End_Day__c); 
            } else { 
                o.SeasonEndDayValue__c = null; 
            }

            if(o.Season_End_Month__c!=null) { 
                o.SeasonEndMonthValue__c = Decimal.valueOf(o.Season_End_Month__c); 
            } else { 
                o.SeasonEndMonthValue__c = null; 
            }
            
            
            if (o.Site_Survey__c == null || o.Site_Survey__c!=oldRec.Site_Survey__c || o.Pricebook2Id == null) {
                accMap.put(o.AccountId, null);
            }       

            if (Trigger.isInsert) {
                if (o.AccountId == null && o.Ticket__c != null) {
                    ticketMap.put(o.Ticket__c, null);
                }
            } else if (Trigger.isUpdate) {
                if (oldRec.Status == activeStatus && o.Status==oldRec.Status && userProfileId!=custSetting.System_Administrator_Profile_Id__c && userProfileId!=custSetting.Integration_User_Profile__c) {
                    o.addError('Please deactivate the Order before making changes to it and Activate it once changes are made');
                }
                if (o.Status != activeStatus && o.Status != oldRec.Status){
                    o.HasBeenDeactivated__c = TRUE;
                    o.LastDeactivatedDate__c = DateTime.now();
                }
                if (o.Status == activeStatus && o.Status != oldRec.Status) {
                    o.HasBeenDeactivated__c = FALSE;
                    accMap.put(o.AccountId, null);
                    siteSurveyErrors.put((o.Parent_Order__c == null ? o.Id : o.Parent_Order__c), null);
                    orderItemFrequencyErrors.put(o.Id, null);
                     if(o.Emergency__c) {
                        orderItemFrequencyErrorsEmergencyOrders.put(o.Id, null);
                    }
                }
                
                if(o.HasBeenDeactivated__c){
                    Boolean cacheServicePrice = oldRec.Total_Service_Price__c!=o.Total_Service_Price__c && o.Total_Service_Price__c!=null && oldRec.Total_Service_Price__c!=null;
                    if(cacheServicePrice) {
                        o.Cached_Total_Service_Price__c = oldRec.Total_Service_Price__c;
                    }
                    
                    Boolean cacheInstalltionPrice = oldRec.Total_Installation_Price__c!=o.Total_Installation_Price__c && o.Total_Installation_Price__c!=null && oldRec.Total_Installation_Price__c!=null;
                    if(cacheInstalltionPrice) {
                        o.Cached_Total_Installation_Price__c = oldRec.Total_Installation_Price__c;
                    }
                    
                    Boolean cachePurchasePrice = oldRec.Total_Purchase_Price__c!=o.Total_Purchase_Price__c && o.Total_Purchase_Price__c!=null && oldRec.Total_Purchase_Price__c!=null;
                    if(cachePurchasePrice) {
                        o.Cached_Total_Purchase_Price__c = oldRec.Total_Purchase_Price__c;
                    }
                    
                    Boolean cacheActiveItemsCount = oldRec.Active_Order_Items__c!=o.Active_Order_Items__c && o.Active_Order_Items__c!=null && oldRec.Active_Order_Items__c!=null;
                    if(cacheActiveItemsCount) {
                        o.Cached_Active_Order_Items_Count__c = oldRec.Active_Order_Items__c;
                    }
                    
                    Boolean cacheOldRevenue = oldRec.Total_Monthly_Revenue__c!=o.Total_Monthly_Revenue__c && o.Total_Monthly_Revenue__c!=null && oldRec.Total_Monthly_Revenue__c!=null;
                    if(cacheOldRevenue) {
                        o.Cached_Total_Monthly_Revenue__c=oldRec.Total_Monthly_Revenue__c;
                    }
                }
            }
        }
        
        ticketMap.remove(null);
        if (!ticketMap.isEmpty()) {
            ticketMap = new Map<Id, Case>([SELECT Id, AccountId FROM Case WHERE Id IN:ticketMap.keySet()]);
            for (Order o : Trigger.new) {
                if (Trigger.isInsert) {
                    Case ticket = ticketMap.get(o.Ticket__c); 
                    if (ticket != null) {
                        o.AccountId = ticket.AccountId;
                        accMap.put(o.AccountId, null); // Added because Ticket quick action does not let AccountId to be predefined
                    }
                }
            }
        }
        
        siteSurveyErrors.remove(null);
        if (!siteSurveyErrors.isEmpty()) {
            for (AggregateResult a : [SELECT COUNT(Id) c, Order__c orderId FROM Order_Item_Location__c WHERE Order__c IN:siteSurveyErrors.keySet() 
                                     AND Survey_Asset_Location__r.Survey_Location__c=NULL AND Order_Product__r.Active__c=TRUE
                                     GROUP BY Order__c]) 
            {
                siteSurveyErrors.put((Id)a.get('orderId'), 'There are Survey Asset Locations that are unallocated for this Order. Please allocate these items before Activating the Order.');
            }
        }
        System.debug(siteSurveyErrors);
        
        orderItemFrequencyErrors.remove(null);
        if(!orderItemFrequencyErrors.isEmpty()) {
            for(AggregateResult a  : [SELECT COUNT(Id) c, OrderId order, Frequency__c frequency FROM OrderItem
                                     WHERE OrderId IN :orderItemFrequencyErrors.keySet() AND Frequency__c=NULL GROUP BY OrderId, Frequency__c]) 
            {
                orderItemFrequencyErrors.put(String.valueOf(a.get('order')), 'There are ' + String.valueOf(a.get('c')) + ' Order Line Items with no Frequency. Please fill in frequency for all line items before Activating the Order. ');
            }
        }
        
        orderItemFrequencyErrorsEmergencyOrders.remove(null);
        if(!orderItemFrequencyErrorsEmergencyOrders.isEmpty()) {
            for(AggregateResult a  : [SELECT COUNT(Id) c, OrderId order, Frequency__c frequency FROM OrderItem
                                     WHERE OrderId IN :orderItemFrequencyErrorsEmergencyOrders.keySet() AND Frequency__c!= :custSetting.Non_Recurring_Frequency_Value__c GROUP BY OrderId, Frequency__c]) 
            {
                orderItemFrequencyErrorsEmergencyOrders.put(String.valueOf(a.get('order')), 'There are Order Line Items with Frequency not equal to ' + custSetting.Non_Recurring_Frequency_Value__c + '. Emergency Orders cannot have recurring frequency Line Items.');
            }
        }
        
        accMap.remove(null);
        if (!accMap.isEmpty()) {
            for (Account a : [SELECT Id, Billing_Suite_Number__c, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry, Shipping_Suite_Number__c, 
                              ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry, Site_Survey__c, OperatingHoursId, Service_Territory__c, IsBillTo__c, Is_Bill_To__c, isParent__c,
                              ParentId, Parent.Billing_Suite_Number__c, Parent.BillingStreet, Parent.BillingCity, Parent.BillingState, Parent.BillingPostalCode, Parent.BillingCountry, 
                              Parent.Shipping_Suite_Number__c, Parent.ShippingStreet, Parent.ShippingCity, Parent.ShippingState, Parent.ShippingPostalCode, Parent.ShippingCountry 
                              , ServicePricebookId__c FROM Account WHERE Id IN :accMap.keyset()]) 
            {
                accMap.put(a.Id, a);
            }
        }
        
        for (Order o : Trigger.new) {
            Id orderId = o.Parent_Order__c == null ? o.Id : o.Parent_Order__c;
            Order oldRec = Trigger.isInsert? new Order() : Trigger.oldMap.get(o.Id);
            Account a = accMap.get(o.AccountId);
            if (a != null) {
                if (o.ShippingAddress == null) {
                    o.Shipping_Suite_Number__c = a.Shipping_Suite_Number__c;
                    o.ShippingStreet = a.ShippingStreet;
                    o.ShippingCity = a.ShippingCity;
                    o.ShippingState = a.ShippingState;
                    o.ShippingPostalCode = a.ShippingPostalCode;
                    o.ShippingCountry = a.ShippingCountry;
                }
                
                if (o.BillingAddress == null && a != null) {
                    if (a.ParentId != null) {
                        o.Billing_Suite_Number__c = a.Parent.Billing_Suite_Number__c;
                        o.BillingStreet = a.Parent.BillingStreet;
                        o.BillingCity = a.Parent.BillingCity;
                        o.BillingState = a.Parent.BillingState;
                        o.BillingPostalCode = a.Parent.BillingPostalCode;
                        o.BillingCountry = a.Parent.BillingCountry;
                    } else {
                        o.Billing_Suite_Number__c = a.Billing_Suite_Number__c;
                        o.BillingStreet = a.BillingStreet;
                        o.BillingCity = a.BillingCity;
                        o.BillingState = a.BillingState;
                        o.BillingPostalCode = a.BillingPostalCode;
                        o.BillingCountry = a.BillingCountry;
                    }
                } 
                
                if (a.Site_Survey__c != null) {
                    o.Site_Survey__c = a.Site_Survey__c; 
                }
                
                if(o.Pricebook2Id == null) {
                    o.Pricebook2Id = a.ServicePricebookId__c;
                }
                
                //if(a.IsBillTo__c) {
                if (a.Is_Bill_To__c && a.isParent__c) {
                    o.addError('Please use a ShipTo Account as the Account of this order');
                }
            }

            /*if (o.Status == activeStatus && siteSurveyErrors.get(orderId) != null) {
                o.addError(siteSurveyErrors.get(orderId)); 
            } else*/ 
            if (o.Status == activeStatus && o.Status != oldRec.Status) {
                if (a != null) {
                    if (a.ParentId != null) {
                        if (a.Parent.BillingStreet == null || a.Parent.BillingCity == null || a.Parent.BillingCountry == null || a.Parent.BillingPostalCode == null || a.Parent.BillingState == null) {
                            orderAddressErrors.put(o.Id, 'Please ensure that associated Billing Account has all Billing Address Fields filled in before before Activating this Order');
                        } 
                    } else {
                        if (a.BillingStreet == null || a.BillingCity == null || a.BillingCountry == null || a.BillingPostalCode == null || a.BillingState == null) {
                            if (orderAddressErrors.containsKey(o.Id)) {
                                orderAddressErrors.put(o.Id, 'Please ensure that associated Shipping Account has all Billing Address Fields filled in before before Activating this Order');
                            }
                        }
                    }
                    
                    if (a.ShippingStreet == null || a.ShippingCity == null || a.ShippingCountry == null || a.ShippingPostalCode == null || a.ShippingState == null) {
                        if (orderAddressErrors.containsKey(o.Id)) {
                            orderAddressErrors.put(o.Id, 'Please ensure that associated Shipping Account and Billing Account has all Shipping Address Fields and Billing Address Fields filled in, respectively, before before Activating this Order');
                        } else {
                            orderAddressErrors.put(o.Id, 'Please ensure that associated Shipping Account has all Shipping Address Fields filled in before before Activating this Order');
                        }
                    }
                    
                    if (a.Service_Territory__c == null && o.Service_Territory__c == null) {
                        orderServiceTerritoryErrors.put(o.Id, 'Please fill in the Service Territory field of the Order or the associated Shipping Account');
                    }
                    if (a.OperatingHoursId == null) {
                        orderOperatingHoursErrors.put(o.Id, 'Please fill in the Operating Hours (Standard field) field of the associated Shipping Account');
                    }
                    if (orderAddressErrors.containsKey(o.Id)) {
                        o.addError(orderAddressErrors.get(o.Id));
                    }
                    if (orderServiceTerritoryErrors.containsKey(o.Id)) {
                        o.addError(orderServiceTerritoryErrors.get(o.Id));
                    }
                    if (orderOperatingHoursErrors.containsKey(o.Id)) {
                        o.addError(orderOperatingHoursErrors.get(o.Id));
                    }
                    /*if (orderTiedToBillTo.containsKey(o.Id)) {
                        o.addError(orderTiedToBillTo.get(o.Id));
                    }*/
                }
                
                if(siteSurveyErrors.get(orderId)!=null) {
                     o.addError(siteSurveyErrors.get(orderId)); 
                }
                
                if(orderItemFrequencyErrors.get(o.Id)!=null) {
                     o.addError(orderItemFrequencyErrors.get(o.Id)); 
                }
                
                if(orderItemFrequencyErrorsEmergencyOrders.get(o.Id)!=null) {
                    o.addError(orderItemFrequencyErrorsEmergencyOrders.get(o.Id));
                }
            }
        } 
    }
}