/**
 * OrderTriggerHandler: 
 * @author Shashi
 * @version 1.0 
 * @since 8-19-2019 
**/
public class OrderTriggerHandler extends TriggerHandler {
    /**Variables**/
    Field_Service_Settings__c custSetting = Field_Service_Settings__c.getOrgDefaults();
    
    /**Collections**/
    private List<Order> lstnewOrds;
    private List<Order> lstoldOrds;
    
    private Map<Id,Order> mapnewOrds;
    private Map<Id,Order> mapoldOrds;
    
   /**
    * Constuctor
    **/
    public OrderTriggerHandler(){
        this.setMaxLoopCount(20);
        
        lstnewOrds = Trigger.new;
        lstoldOrds = Trigger.old;
        mapnewOrds = (Map<Id,Order>)Trigger.newMap;
        mapoldOrds = (Map<Id,Order>)Trigger.oldMap;
    }
    
    /** TRIGGER EVENTS **/
    protected override void beforeInsert(){
        if(TriggerHandler.isBypassed('OrderTriggerHandler')){return;}
        System.debug('OrderTriggerHandler|BeforeInsert|setOrderFields:validate fields|Begin');
        setOrderFields(true);
        System.debug('OrderTriggerHandler|BeforeInsert|setOrderFields:validate fields|End');
        
        CPQ2_Service.handleBeforeInsertTrigger(lstnewOrds);
    }
    
    protected override void beforeUpdate(){
        if(TriggerHandler.isBypassed('OrderTriggerHandler')){return;}
        System.debug('OrderTriggerHandler|BeforeUpdate|setOrderFields:validate fields|Begin');
        setOrderFields(false);
        System.debug('OrderTriggerHandler|BeforeUpdate|setOrderFields:validate fields|End');
        System.debug('OrderTriggerHandler|BeforeUpdate|createTicket:Create Billing Ticket|Begin');
        createTicket();
        System.debug('OrderTriggerHandler|BeforeUpdate|createTicket:Create Billing Ticket|End');
        
        CPQ2_Service.handleBeforeUpdateTrigger(lstnewOrds, mapoldOrds);
    }
    
    protected override void beforeDelete(){
        if(TriggerHandler.isBypassed('OrderTriggerHandler')){return;}
        System.debug('OrderTriggerHandler|BeforeDelete|delOrderSurveyLoc:Delete->SurveyLoc|Begin');
        delOrderSurveyLoc();
        System.debug('OrderTriggerHandler|BeforeDelete|delOrderSurveyLoc:Delete->SurveyLoc|End');
    }
    
    protected override void afterInsert(){
        if(TriggerHandler.isBypassed('OrderTriggerHandler')){return;}
        System.debug('OrderTriggerHandler|AfterInsert|onInsertRelOrdRec:Manage Related Order Record|Begin');
        onInsertRelOrdRec();
        System.debug('OrderTriggerHandler|AfterInsert|onInsertRelOrdRec:Manage Related Order Record|End');
    }
    
    protected override void afterUpdate(){
        if(TriggerHandler.isBypassed('OrderTriggerHandler')){return;}
        System.debug('OrderTriggerHandler|AfterUpdate|createTicketOrderChange:Create ticket on order change|Begin');
        createTicketOrderChange();
        System.debug('OrderTriggerHandler|AfterUpdate|createTicketOrderChange:Create ticket on order change|End');
        
        CPQ2_Service.handleAfterUpdateTrigger(lstnewOrds, mapoldOrds);
    }
    
    
   /**
    * delOrderSurveyLoc: Deletes Order Item Location and Survey Asset Location
    **/
    private void delOrderSurveyLoc(){
        Set<Id> idsToDelete = mapoldOrds.keySet();
        for(Order o:lstoldOrds) {
            if(o.Parent_Order__c != null) {
                idsToDelete.remove(o.Id);
            }
        }
        delete [SELECT Id, Order__c FROM Order_Item_Location__c WHERE Order__c IN:idsToDelete];
        delete [SELECT Id, Originating_Parent_ID__c FROM Survey_Asset_Location__c WHERE Originating_Parent_ID__c IN:idsToDelete];
    }
    
   /**
    * setOrderFields: Validates field values and sets defaults
    **/
    private void setOrderFields(boolean isInsert){
        List<Id> orderIdList = new List<Id>();
        Map<Id, Integer> mpIsReqPriceNA = new Map<Id,Integer>();
        Map<Id, Account> accMap = new Map<Id,Account>();
        Map<Id, String> siteSurveyErrors = new Map<Id, String>();
        Map<Id, String> orderAddressErrors = new Map<Id, String>();
        Map<Id, String> orderServiceTerritoryErrors = new Map<Id, String>();
        Map<Id, String> orderOperatingHoursErrors = new Map<Id, String>();
        Map<Id, String> orderItemFrequencyErrors = new Map<Id, String>();
        Map<Id, String> orderItemFrequencyErrorsEmergencyOrders = new Map<Id, String>();
        Map<Id, Case> ticketMap = new Map<Id, Case>();
        Id userProfileId = UserInfo.getProfileId();
        String activeStatus = custSetting.Order_Active_Stage__c;
        
        List<Orderitem> allOrderItemList = new List<OrderItem>();
        Map<Id, List<OrderItem>> allOrderItemMap = new Map<Id, List<OrderItem>>();
        Map<Id, Integer> mapEmergencyFrq = new Map<Id,Integer>();
        
        for (Order o : lstnewOrds) {
            Order oldRec = isInsert ? new Order() : mapoldOrds.get(o.Id);
            //o.Inventory_Consumed__c = o.Inventory_Allocated__c && !oldRec.Inventory_Allocated__c ? FALSE :  o.Inventory_Consumed__c; //for case 21528 to detect inventory allocated change
            //case 21603 - remove dates if all values are wiped out [dk]
            if(oldRec.Id!=null){orderIdList.add(oldRec.Id);}
            
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
            
            if (isInsert) {
                if (o.AccountId == null && o.Ticket__c != null) {
                    ticketMap.put(o.Ticket__c, null);
                }
            } 
            else {
                //Skip logic if there is change to Last Active Check Date
                if(o.CPQ2_Last_Active_Check_Date__c!=null && oldRec.CPQ2_Last_Active_Check_Date__c!=o.CPQ2_Last_Active_Check_Date__c){
                    ServicePlanUtils.allowActiveOrderUpdates = true;
                }
                if (!ServicePlanUtils.allowActiveOrderUpdates && oldRec.Status == activeStatus && o.Status==oldRec.Status && userProfileId!=custSetting.System_Administrator_Profile_Id__c && userProfileId!=custSetting.Integration_User_Profile__c) {
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
            for (Order o : lstnewOrds) {
                if (isInsert) {
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
        
        /* This is not needed as Null Frequency will be validated from Order Product Trigger - Mar 1st, 2021
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
            for(AggregateResult a  : [SELECT COUNT(Id) c, OrderId order, Frequency__c frequency 
                                        FROM OrderItem
                                        WHERE OrderId IN :orderItemFrequencyErrorsEmergencyOrders.keySet() 
                                        AND Frequency__c!= :custSetting.Non_Recurring_Frequency_Value__c 
                                        AND Active__c=TRUE 
                                        GROUP BY OrderId, Frequency__c]) 
            {
                orderItemFrequencyErrorsEmergencyOrders.put(String.valueOf(a.get('order')), 'There are Order Line Items with Frequency not equal to ' + custSetting.Non_Recurring_Frequency_Value__c + '. Emergency Orders cannot have recurring frequency Line Items.');
            }
        }
        
        if(orderIdList.Size()>0){
            List<OrderItem> listOIs = [SELECT Id,Requested_Price_Approved__c,OrderId 
                                       FROM OrderItem 
                                       WHERE OrderId IN:orderIdList 
                                       AND Requested_Price_Approved__c=FALSE 
                                       AND Requested_Price__c!=null
                                       AND IsActive__c=TRUE 
                                       AND (Order.Emergency__c = FALSE AND Order.Line_of_Businesses__c!='Pest Control')];
            for(OrderItem oi:listOIs){
                if(mpIsReqPriceNA.containsKey(oi.OrderId)){
                    Integer c = mpIsReqPriceNA.get(oi.OrderId);
                    c = c + 1;
                    mpIsReqPriceNA.put(oi.OrderId,c);
                } else {
                    mpIsReqPriceNA.put(oi.OrderId,1);
                }
            }
            System.debug('--N--' + mpIsReqPriceNA);
        }*/
        
        //Order Item Map for all items - Mar 1st, 2021
        if (orderIdList.size()>0){
            //allOrderItemList = [SELECT Id, OrderId, Frequency__c, IsActive__c, Requested_Price__c,Requested_Price_Approved__c FROM OrderItem WHERE OrderId IN:orderIdList Order by OrderId];
            for(OrderItem oi : [SELECT Id, OrderId, Frequency__c, IsActive__c, Active__c, Item_Type__c, Line_of_Business__c, Requested_Price__c, Requested_Price_Approved__c 
                                FROM OrderItem 
                                WHERE OrderId IN:orderIdList Order by OrderId]){
                if(allOrderItemMap.containsKey(oi.OrderId)) {
                    allOrderItemMap.get(oi.OrderId).add(oi);
                } else {
                    allOrderItemMap.put(oi.OrderId, new List<OrderItem>{oi});
                }
            }
        }

        if(allOrderItemMap.isEmpty() == false){
            for (Order o: lstnewOrds){
                Set<String> categorySet = new Set<String>();
                Set<String> lobSet = new Set<String>();
                String categories;
                String lob;
                Boolean areAllLineItemsInactive = true;
                if(allOrderItemMap.containsKey(o.Id)){
                    for(OrderItem oi : allOrderItemMap.get(o.Id)){
                        
                        //validate requested price approved for pest control
                        If(oi.Requested_Price_Approved__c == FALSE && oi.Requested_Price__c !=null && oi.IsActive__c==TRUE &&
                           o.Emergency__c == FALSE &&  o.Line_of_Businesses__c!='Pest Control')
                        {
                            if(mpIsReqPriceNA.containsKey(oi.OrderId)){
                                Integer c = mpIsReqPriceNA.get(oi.OrderId);
                                c = c + 1;
                                mpIsReqPriceNA.put(oi.OrderId,c);
                            } else {
                                mpIsReqPriceNA.put(oi.OrderId,1);
                            }
                        }
                        System.debug('--N--' + mpIsReqPriceNA);
                        
                        //validate service frequency shall be one-time on emergency orders
                        If(oi.Frequency__c != custSetting.Non_Recurring_Frequency_Value__c && oi.IsActive__c==TRUE &&
                           o.Emergency__c == TRUE )
                        {
                            if(mapEmergencyFrq.containsKey(oi.OrderId)){
                                Integer ct = mapEmergencyFrq.get(oi.OrderId);
                                ct = ct + 1;
                                mapEmergencyFrq.put(oi.OrderId,ct);
                            } else {
                                mapEmergencyFrq.put(oi.OrderId,1);
                            }
                        }
                        
                        if (oi.Active__c) {categorySet.add(oi.Item_Type__c);}
                        lobSet.add(oi.Line_of_Business__c);
                        
                        if (oi.Active__c && areAllLineItemsInactive) {
                            areAllLineItemsInactive = false;
                        }
                        
                    }
                }
                
                //LOB from all Order Items to update order
                if(!categorySet.isEmpty()){
                    List<String> categoryList = new List<String>();
                    categoryList.addAll(categorySet);
                    categories = String.join(categoryList, ';');
                }
                
                if(!lobSet.isEmpty()) {
                    List<String> lobList = new List<String>();
                    lobList.addAll(lobSet);
                    lob = String.join(lobList, ';');
                }
                
                if (o.Product_Categories__c != categories || o.Line_of_Businesses__c != lob) {
                    o.Product_Categories__c = categories;
                    if (!areAllLineItemsInactive) {
                        o.Line_of_Businesses__c = lob;
                    }
                }                
            }
        
            /*
        	for(OrderItem oi : allOrderItemList){
            	If(oi.Requested_Price_Approved__c == FALSE && oi.Requested_Price__c !=null && oi.IsActive__c==TRUE &&
                   mapnewOrds.get(oi.OrderId).Emergency__c == FALSE &&  mapnewOrds.get(oi.OrderId).Line_of_Businesses__c!='Pest Control')
                {
                	if(mpIsReqPriceNA.containsKey(oi.OrderId)){
                    	Integer c = mpIsReqPriceNA.get(oi.OrderId);
                    	c = c + 1;
                    	mpIsReqPriceNA.put(oi.OrderId,c);
                	} else {
                    	mpIsReqPriceNA.put(oi.OrderId,1);
                	}
            	}
            	System.debug('--N--' + mpIsReqPriceNA);

                If(oi.Frequency__c != custSetting.Non_Recurring_Frequency_Value__c && oi.IsActive__c==TRUE &&
                   mapnewOrds.get(oi.OrderId).Emergency__c == TRUE )
                {
                	if(mapEmergencyFrq.containsKey(oi.OrderId)){
                    	Integer ct = mapEmergencyFrq.get(oi.OrderId);
                    	ct = ct + 1;
                    	mapEmergencyFrq.put(oi.OrderId,ct);
                	} else {
                    	mapEmergencyFrq.put(oi.OrderId,1);
                	}
            	}
        	}*/
        } //end of Mar 1st, 2021
        
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
        
        for (Order o : lstnewOrds) {
            Id orderId = o.Parent_Order__c == null ? o.Id : o.Parent_Order__c;
            Order oldRec = isInsert ? new Order() : mapoldOrds.get(o.Id);
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
                
                if (a.Is_Bill_To__c && a.isParent__c) {
                    o.addError('Please use a ShipTo Account as the Account of this order');
                }
            }
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
                }
                
                if(siteSurveyErrors.get(orderId)!=null) {
                    o.addError(siteSurveyErrors.get(orderId)); 
                }
                
                if(orderItemFrequencyErrors.get(o.Id)!=null) {
                    o.addError(orderItemFrequencyErrors.get(o.Id)); 
                }
                
                /*Mar 1st, 2021
                if(orderItemFrequencyErrorsEmergencyOrders.get(o.Id)!=null) {
                    o.addError(orderItemFrequencyErrorsEmergencyOrders.get(o.Id));
                }*/
                if(mapEmergencyFrq.size()>0 && mapEmergencyFrq.containsKey(o.Id)){
                    o.addError('There are ' + mapEmergencyFrq.get(o.Id) + ' Order Line Items with Frequency not equal to ' + custSetting.Non_Recurring_Frequency_Value__c + '. Emergency Orders cannot have recurring frequency Line Items.');
                }//end of Mar 1st, 2021
                
                
                if(mpIsReqPriceNA.size()>0 && mpIsReqPriceNA.containsKey(o.Id)){
                    System.debug('--N--' + mpIsReqPriceNA);
                    o.addError('Requested Price Not Approved');
                }
            }
        } 
    }
    
   /**
    * onInsertRelOrdRec: Associates Site Survey to Orders and accounts
    **/
    private void onInsertRelOrdRec(){
        List<Order> updateOrdersWithoutSurvey = new List<Order>();
        List<Account> updateAccountWithSiteSurvey = new List<Account>();
        Map<Id, Site_Survey__c> accountSiteSurveyMap = new Map<Id,Site_Survey__c>();
        
        for(Order o : lstnewOrds) {
            if (o.Site_Survey__c==null && !accountSiteSurveyMap.containsKey(o.AccountId)) {
                Site_Survey__c ss = new Site_Survey__c(
                    Account__c=o.AccountId, 
                    Survey_Date__c = System.Today(),
                    Status__c = 'Draft'
                );
                accountSiteSurveyMap.put(o.AccountId, ss);
            }
        }
        
        if(!accountSiteSurveyMap.isEmpty()) {
            upsert accountSiteSurveyMap.values();
            
            for(Order o : lstnewOrds){
                Site_Survey__c ss = accountSiteSurveyMap.get(o.AccountId);
                if(ss!=null) {
                    updateOrdersWithoutSurvey.add(new Order(Id=o.Id, Site_Survey__c=ss.Id));
                    updateAccountWithSiteSurvey.add(new Account(Id=o.AccountId, Site_Survey__c=ss.Id));
                }
            }
            upsert updateOrdersWithoutSurvey;
            upsert updateAccountWithSiteSurvey;
        }
    }
    
    /**
     * create ticket on Season start date/end and po number
     **/
    private void createTicketOrderChange(){
        List<Case> billingCases = new List<Case>();
        Map<Id,Map<String,String>> orderChanges = new Map<Id,Map<String,String>>();
        
        for(Order NEWO: lstnewOrds) {
            String startDate = 'Blank', EndDate = 'Blank', strPO = 'Blank'; 
            Map<String,String> ORD_CHANGE = new Map<String,String>();
            Order OLDO = mapoldOrds.get(NEWO.Id);
            
            Boolean duringOrderMerge = NEWO.Prevent_Invoice_Change_Ticket__c || OLDO.Prevent_Invoice_Change_Ticket__c;
            //System.debug('##EMERGENCY##' + NEWO.Emergency__c + '##Merge##' + duringOrderMerge);
            if(NEWO.Emergency__c || duringOrderMerge){continue;}
            
           Boolean seasonstart = OLDO.Season_Start_Month__c != NEWO.Season_Start_Month__c || OLDO.Season_Start_Day__c != NEWO.Season_Start_Day__c;
            if(OLDO.Season_Start_Date__c!=null){startDate = OLDO.Season_Start_Date__c.format();}
            
            if((NEWO.Season_Start_Date__c != OLDO.Season_Start_Date__c)  || NEWO.PoNumber != OLDO.PoNumber){
                if(seasonstart && OLDO.Season_Start_Date__c == null){ORD_CHANGE.put(BillingTicketData.SEASTART,startDate + ' -> ' + NEWO.Season_Start_Date__c.format());}
                else if(seasonstart && NEWO.Season_Start_Date__c == null){ORD_CHANGE.put(BillingTicketData.SEASTART,startDate + ' -> Blank');}
                else if (seasonstart){ORD_CHANGE.put(BillingTicketData.SEASTART,startDate + ' -> ' + NEWO.Season_Start_Date__c.format());}
                Boolean seasonend = OLDO.Season_End_Month__c != NEWO.Season_End_Month__c || OLDO.Season_End_Day__c != NEWO.Season_End_Day__c;
                if(OLDO.Season_End_Date__c!=null){EndDate = OLDO.Season_End_Date__c.format();}
                if(seasonend && OLDO.Season_End_Day__c == null){ORD_CHANGE.put(BillingTicketData.SEAEND,EndDate + ' -> ' + NEWO.Season_End_Date__c.format());}
                else if(seasonend && NEWO.Season_End_Day__c == null){ORD_CHANGE.put(BillingTicketData.SEAEND,EndDate + ' -> Blank') ;}
                else if(seasonend){ORD_CHANGE.put(BillingTicketData.SEAEND,EndDate + ' -> ' + NEWO.Season_End_Date__c.format());}
                Boolean pochange = OLDO.PoNumber != NEWO.PoNumber;
                if(OLDO.PoNumber!=null){strPO = OLDO.PoNumber;}
                
                if(pochange && NEWO.PoNumber != null){ORD_CHANGE.put(BillingTicketData.PONUM, strPO + ' -> ' + NEWO.PoNumber);}
                else if(pochange && NEWO.PoNumber == null) {ORD_CHANGE.put(BillingTicketData.PONUM, strPO + ' -> Blank');}
                //else if (pochange) {ORD_CHANGE.put(BillingTicketData.PONUM, strPO + ' -> ' + NEWO.PoNumber);}
                if(ORD_CHANGE.size()>0){orderChanges.put(NEWO.Id,ORD_CHANGE);}
            
            //System.debug('##SSTART##' + seasonstart + '##SEND##' + seasonend + '##pochange##' + pochange);
            
            if(seasonstart || seasonend || pochange){
                if(orderChanges.size()>0){
                    String strDesc = '';
                    Map<String,String> OC=orderChanges.get(NEWO.Id);
                    for(String ky:OC.KeySet()){
                        if(ky==BillingTicketData.SEASTART){strDesc+='\nOrder Season Start Date Changed from ' + OC.get(ky);}
                        if(ky==BillingTicketData.SEAEND){strDesc+='\nOrder Season End Date Changed from ' + OC.get(ky);}
						if(ky==BillingTicketData.PONUM){strDesc+='\nOrder PO Number Changed from ' + OC.get(ky);}                                                                                                                      
                    }
                    billingCases.add(
                        new Case(
                            Subject = 'PO number or Seasonal change for Order: ' + NEWO.OrderNumber, 
                            Type = 'Invoice Adjustment',
                            RecordTypeId = custSetting.Invoice_Information_Case_RecordTypeId__c, 
                            AccountId = NEWO.AccountId, 
                            OwnerId = custSetting.Billing_Team__c,
                            ContactId = NEWO.ShipToContactId == null ? NEWO.BillToContactId : NEWO.ShipToContactId, 
                            Status = 'New', 
                            Description = strDesc,
                            Order__c = NEWO.Id
                        	)
                		);
                	}
            	}
        	}
        }
        
        if(!billingCases.isEmpty()){upsert billingCases;}
    }
    
   /**
    * createTicket: Aggregate changes on OrderItem and create Ticket if there are any changes
    */
    private void createTicket() {
        List<Case> billingCases = new List<Case>();
        List<OrderItem> updateOrderItems = new List<OrderItem>();
        Map<Id,Order> mpIdToOrder = new Map<Id,Order>();
        Map<Id,Map<Id,BillingTicketData>> mmOrdToProdBTD = new Map<Id,Map<Id,BillingTicketData>>();
        Map<Id,String> mpCaseDesc = new Map<Id,String>();
        
        for(Order NEWO: lstnewOrds) {
            Order OLDO = mapoldOrds.get(NEWO.Id);
            //System.debug('##StatusO##' + OLDO.Status + '##StatusN##' + NEWO.Status);
            //Collect Order Id's if Status is moving to Active, is not an emergency order, is not a merged order
            if((OLDO.Status != custSetting.Order_Active_Stage__c && NEWO.Status == custSetting.Order_Active_Stage__c)){
                if(NEWO.Control_Invoice_Ticket__c==2){continue;}//Skip if Control flag is 2
                Boolean duringOrderMerge = NEWO.Prevent_Invoice_Change_Ticket__c || OLDO.Prevent_Invoice_Change_Ticket__c;
                //System.debug('##EMERGENCY##' + !NEWO.Emergency__c + '##Merge##' + !duringOrderMerge);
                if(!NEWO.Emergency__c && !duringOrderMerge){mpIdToOrder.put(NEWO.Id,NEWO);}
            }
        }
        
        if(mpIdToOrder.size()>0){
           //Begin:Shashi:03-27-2020:Fetch Last_Order_Active_Date__c and CreatedDate
            List<OrderItem> lstOrdItm = [SELECT Id, OrderId, Order.Account.Name, Product2Id, Quantity, Last_Order_Active_Date__c,
                                                Product2.Name, Product2.ProductCode, Need_Ticket__c, Active__c, Order.CreatedDate
                                         FROM OrderItem
                                         WHERE OrderId =:mpIdToOrder.KeySet()
                                         ORDER BY OrderId,Product2Id];
            //End            
            for(OrderItem OrdItm:lstOrdItm){
                if(OrdItm.Need_Ticket__c!=null && OrdItm.Need_Ticket__c!=''){
                    //Begin:Shashi:3-27-2020:Skip if Date does not match
                    String nT = OrdItm.Need_Ticket__c;
                    Integer idx = nT.indexOf(BillingTicketData.CLEAR_DATE);
                    String drDate = String.valueOfGmt(OrdItm.Order.CreatedDate);
                    if(idx >= 0){
                        Integer eidx = nT.indexOf('\n', idx);
                        //System.debug('--edix' + idx + '--' + eidx);
                        String uT = nT.substring(idx,eidx + 1);
                        if(OrdItm.Last_Order_Active_Date__c!=null){drDate = String.valueOfGmt(OrdItm.Last_Order_Active_Date__c);}
                        if(!nT.contains(drDate)){System.debug('-SKIPPING--ORDER ITEM--');continue;}
                        else{
                            OrdItm.Need_Ticket__c=nT.replace(uT,'');
                            //System.debug('--ORD TICKET--' + OrdItm.Need_Ticket__c);
                        }
                    } else {System.debug('-SKIPPING--ORDER ITEM--');continue;}
                    //End
                    
                    //Begin:Shashi:10-15-2019:Do not create ticket on first creation of order
                    if(mpIdToOrder.containsKey(OrdItm.OrderId)){
                        Order newOrder = mpIdToOrder.get(OrdItm.OrderId);
                        if(newOrder.Updated_By__c!=null && newOrder.Updated_By__c==BillingTicketData.ISOPP){continue;}
                    }
                    //End
                    //system.debug('##DIDNOTSKIP##');
                    
                    List<String> dtTop = OrdItm.Need_Ticket__c.split('\n');
                    Map<Id,BillingTicketData> mpBTD = new Map<Id,BillingTicketData>();
                    
                    if(mmOrdToProdBTD.containsKey(OrdItm.OrderId)){mpBTD = mmOrdToProdBTD.get(OrdItm.OrderId);}
                    else{mmOrdToProdBTD.put(OrdItm.OrderId,mpBTD);}
                    
                    for(String tops:dtTop){
                        //System.debug('##NeedTicket##' + tops);
                        
                        String p1='',p2='',p3='',p4='';
                        BillingTicketData BTD = new BillingTicketData();
                        List<String> dtIn=tops.split('\\|');
                        
                        if(dtIn.size()>=1){p1=dtIn[0];}if(dtIn.size()>=2){p2=dtIn[1];}
                        if(dtIn.size()>=3){p3=dtIn[2];}if(p1==''){continue;}
                        
                        if(OrdItm.Product2.ProductCode!=null){BTD.ProductCode = OrdItm.Product2.ProductCode;}
                        if(OrdItm.Product2.Name!=null){BTD.ProductName = OrdItm.Product2.Name;}
                        if(OrdItm.Order.Account.Name!=null){BTD.AccountName = OrdItm.Order.Account.Name;}
                        //System.debug('##PCODE##--' + BTD.ProductCode + '##NAME##--' + BTD.ProductName);
                        if(dtTop.size()==1){buildBillingTickDS(OrdItm,mpBTD,BTD,p1,p2,p3,'ONE');}
                        else{buildBillingTickDS(OrdItm,mpBTD,BTD,p1,p2,p3,'MANY');}
                    } 
                }
            }

            for(Id OrdId:mmOrdToProdBTD.KeySet()){
                Map<Id,BillingTicketData> dsBTD = mmOrdToProdBTD.get(OrdId);
                Order cOrder = mpIdToOrder.get(OrdId);
                 String sfUrl = URL.getSalesforceBaseUrl().toExternalForm() +'/$';
                 String strDesc = 'Customer (^) had the following Order (' + cOrder.OrderNumber + ') changes on ' + System.today().format() + ':\n\n'+sfUrl+':\n';
                                
                for(Id MIXID:dsBTD.KeySet()){
                    BillingTicketData printBTD = dsBTD.get(MIXID);
                    Boolean isProdId = printBTD.stProdIds.contains(MIXID);
                    strDesc = strDesc.replace('^', printBTD.AccountName);
                    //System.debug(printBTD);
                    //System.debug('##MIXID##' + MIXID + '##PID##' + isProdId);
                    
                    if(printBTD.mpPrdToQty.containsKey(BillingTicketData.ADDED)){
                        strDesc+= printBTD.ProductCode + ' - ' + printBTD.ProductName + ',Quantity x ' + printBTD.mpPrdToQty.get(BillingTicketData.ADDED) + ':Added\n';
                        if(isProdId){
                           for(String u:PrintBTD.mpPrdToQURL.get(BillingTicketData.ADDED)){strDesc+=u + '\n';}
                           strDesc+='\n';
                        }
                    }
                    if(printBTD.mpPrdToQty.containsKey(BillingTicketData.DEACTIVE)){
                        strDesc+= printBTD.ProductCode + ' - ' + printBTD.ProductName + ',Quantity x ' + printBTD.mpPrdToQty.get(BillingTicketData.DEACTIVE) + ':Deactivated\n';
                        if(isProdId){
                        	for(String u:PrintBTD.mpPrdToQURL.get(BillingTicketData.DEACTIVE)){strDesc+=u + '\n';}
                            strDesc+='\n';
                        }
                    }
                    if(printBTD.mpPrdToQty.containsKey(BillingTicketData.REACTIVE)){
                        strDesc+= printBTD.ProductCode + ' - ' + printBTD.ProductName + ',Quantity x ' + printBTD.mpPrdToQty.get(BillingTicketData.REACTIVE) + ':Reactivated\n';
                        if(isProdId){
                        	for(String u:PrintBTD.mpPrdToQURL.get(BillingTicketData.REACTIVE)){strDesc+=u + '\n';}
                            strDesc+='\n';
                        }
                    }
                    //Begin:Shashi:Order Product SUM(Price) not required
                    for(String priceKey:printBTD.mpPrdToPQty.KeySet()){
                        if(priceKey.startsWith(BillingTicketData.SERVICEP)){
                        	strDesc+= printBTD.ProductCode + ' - ' + printBTD.ProductName + ',Quantity x ' + printBTD.mpPrdToPQty.get(priceKey) + ':Service Price changed:' + 
                                  printBTD.mpPrdToOPrice.get(priceKey) + '->' + printBTD.mpPrdToNPrice.get(priceKey) + '\n';
                            if(isProdId){
                                for(String u:PrintBTD.mpPrdToPURL.get(priceKey)){strDesc+=u + '\n';}
                                strDesc+='\n';
                            }  
                        }
                        if(priceKey.startsWith(BillingTicketData.INSTALLP)){
                            strDesc+= printBTD.ProductCode + ' - ' + printBTD.ProductName + ',Quantity x ' + printBTD.mpPrdToPQty.get(priceKey) + ':Installation Price changed:' + 
                                  printBTD.mpPrdToOPrice.get(priceKey) + '->' + printBTD.mpPrdToNPrice.get(priceKey) + '\n';
                            if(isProdId){
                                for(String u:PrintBTD.mpPrdToPURL.get(priceKey)){strDesc+=u + '\n';}
                                strDesc+='\n';
                            }
                        }
                        if(priceKey.startsWith(BillingTicketData.PURCHASEP)){
                            strDesc+= printBTD.ProductCode + ' - ' + printBTD.ProductName + ',Quantity x ' + printBTD.mpPrdToPQty.get(priceKey) + ':Purchase Price changed:' + 
                                  printBTD.mpPrdToOPrice.get(priceKey) + '->' + printBTD.mpPrdToNPrice.get(priceKey) + '\n';
                            if(isProdId){
                                for(String u:PrintBTD.mpPrdToPURL.get(priceKey)){strDesc+=u + '\n';}
                                strDesc+='\n';
                            }
                        }
                    }
                    //End
                    if(printBTD.mpPrdToFQty.size()>0){
                        for(String key:printBTD.mpPrdToFQty.KeySet()){
                            strDesc+= printBTD.ProductCode + ' - ' + printBTD.ProductName + ',Quantity x ' + printBTD.mpPrdToFQty.get(key) + ':Frequency changed:' + key + '\n';
                            if(isProdId){
                            	for(String u:PrintBTD.mpPrdToFURL.get(key)){strDesc+=u + '\n';}
                                strDesc+='\n';
                            }
                        }
                    }
                    if(!isProdId){strDesc+=MIXID + '\n\n';}
                }
                
                //System.debug('Complete Description for Invoice Adjustment'+strDesc);
                
                //Shashi:4-17-2020:Attach description if it exceeds 32000
                if(strDesc.length()>31950){
                    mpCaseDesc.put(cOrder.Id,strDesc);
                    strDesc = 'Please refer to attachment "InvoiceAdjustment.txt" for details.';
                }
                //End
                
                billingCases.add(
                    new Case(
                        Subject = 'Invoice Change for Order: ' + cOrder.OrderNumber, 
                        Type = 'Invoice Adjustment',
                        RecordTypeId = custSetting.Invoice_Information_Case_RecordTypeId__c, 
                        AccountId = cOrder.AccountId, 
                        OwnerId = custSetting.Billing_Team__c,
                        ContactId = cOrder.ShipToContactId == null ? cOrder.BillToContactId : cOrder.ShipToContactId, 
                        Status = 'New', 
                        Description = strDesc,
                        Order__c = cOrder.Id
                    )
                );
            }
        }
        
        //Begin:Shashi:10-15-2019:Do not create ticket on first creation of order
        for(Id ordId:mpIdToOrder.KeySet()){
            Order newOrder = mpIdToOrder.get(ordId);
            if(newOrder.Updated_By__c!=null && newOrder.Updated_By__c==BillingTicketData.ISOPP){newOrder.Updated_By__c='';}
        }
        //End
        
        //Shashi:4-17-2020:Attach description if it exceeds 32000
        //System.debug('##' + billingCases);
        if(!billingCases.isEmpty()){
            upsert billingCases;
            List<Attachment> listAtt = new List<Attachment>();
            for(Case ct:billingCases){
                if(mpCaseDesc.containsKey(ct.Order__c)){
                    String strDesc = mpCaseDesc.get(ct.Order__c);
                    Attachment att = new Attachment(Name = 'InvoiceAdjustment.txt', ParentId = ct.Id, Body = Blob.valueOf(strDesc));
                    listAtt.add(att);
                }
            }
            if(listAtt.size()>0){insert listAtt;}
        }
        //End
    } 
    
    /**
     * Utility function to add Quantity
     **/
    private void buildBillingTickDS(OrderItem OrdItm,Map<Id,BillingTicketData> mpBTD,BillingTicketData BTD,String p1,String p2,String p3,String MIX){
        Decimal Qty = OrdItm.Quantity;
        Decimal OPrice=0.0,NPrice=0.0;
        Boolean blnProdOrOrdItm = false;
        Id MIXID = null;
        String baseUrl = URL.getSalesforceBaseUrl().toExternalForm() + '/';

        //System.debug('##P1##' + p1 + '##P2##' + p2 + '##P3##' + p3);
        
        Set<String> stURLs = new Set<String>();
        Map<String,Decimal> mpProductQty = new Map<String,Decimal>();
        Map<String,Set<String>> mpProductUrls = new Map<String,Set<String>>();
        
        if(MIX.equals('MANY')){if(mpBTD.containsKey(OrdItm.Id)){blnProdOrOrdItm=true;}MIXID=OrdItm.Id;}
        if(MIX.equals('ONE')){if(mpBTD.containsKey(OrdItm.Product2Id)){blnProdOrOrdItm=true;}MIXID=OrdItm.Product2Id;}
        //System.debug('##MIXID##--' + MIXID + '##MIX##--' + MIX);
        if(blnProdOrOrdItm){
            BTD = mpBTD.get(MIXID);
            if(MIX.equals('ONE')){BTD.stProdIds.add(MIXID);}
            if(p1.equals(BillingTicketData.ADDED) || p1.equals(BillingTicketData.DEACTIVE) || p1.equals(BillingTicketData.REACTIVE))
            {
                mpProductQty = BTD.mpPrdToQty;
                mpProductUrls = BTD.mpPrdToQURL;
            }
            if(p1.equals(BillingTicketData.SERVICEP) || p1.equals(BillingTicketData.INSTALLP) || p1.equals(BillingTicketData.PURCHASEP))
            {
                mpProductQty = BTD.mpPrdToPQty;
                mpProductUrls = BTD.mpPrdToPURL; 
                
                if(p2!=''){OPrice=Decimal.valueOf(p2.trim());p1 += ':' + OPrice;}
        		if(p3!=''){NPrice=Decimal.valueOf(p3.trim());p1 += ':' + NPrice;}
                
                //Begin:Shashi:Order Product SUM(Price) not required
                if(BTD.mpPrdToOPrice.containsKey(p1)){OPrice=BTD.mpPrdToOPrice.get(p1);}
                BTD.mpPrdToOPrice.put(p1,OPrice);
                   
                if(BTD.mpPrdToNPrice.containsKey(p1)){Nprice=BTD.mpPrdToNPrice.get(p1);}
                BTD.mpPrdToNPrice.put(p1,NPrice);
                //End
                //System.debug(p1 + '#OLDP#' + OPrice + '#NEWP#' + Nprice);
            }
            if(p1.equals(BillingTicketData.FREQUENCY)) {
                mpProductQty = BTD.mpPrdToFQty;
                mpProductUrls = BTD.mpPrdToFURL; 
                p1 = p2 + '->' + P3;
            }
            
            if(mpProductQty.containsKey(p1)){Qty+=mpProductQty.get(p1);}
            mpProductQty.put(p1,Qty);
            //System.debug('#KEY:' + p1 + '##QTY:' + Qty);
                
            if(!mpProductUrls.containsKey(p1)){mpProductUrls.put(p1,stURLs);}
            else{stURLs=mpProductUrls.get(p1);}
            stURLs.add(OrdItm.Id); 
            
            //System.debug('##KEYS##' + mpBTD.KeySet());
        } 
        else {
            if(p1.equals(BillingTicketData.ADDED) || p1.equals(BillingTicketData.DEACTIVE) || p1.equals(BillingTicketData.REACTIVE))
            {
                mpProductQty = BTD.mpPrdToQty;
                mpProductUrls = BTD.mpPrdToQURL;
            }
            if(p1.equals(BillingTicketData.SERVICEP) || p1.equals(BillingTicketData.INSTALLP) || p1.equals(BillingTicketData.PURCHASEP))
            {
                mpProductQty = BTD.mpPrdToPQty;
                mpProductUrls = BTD.mpPrdToPURL;  
                
                if(p2!=''){OPrice=Decimal.valueOf(p2.trim());p1 += ':' + OPrice;}
        		if(p3!=''){NPrice=Decimal.valueOf(p3.trim());p1 += ':' + NPrice;}

                BTD.mpPrdToOPrice.put(p1,OPrice);
                BTD.mpPrdToNPrice.put(p1,NPrice);
                
                //System.debug('#N#' + p1 + '#OLDP#' + OPrice + '#NEWP#' + Nprice);
            }
            if(p1.equals(BillingTicketData.FREQUENCY)){
                mpProductQty = BTD.mpPrdToFQty;
                mpProductUrls = BTD.mpPrdToFURL; 
                p1 = p2 + '->' + P3;
                
            }
            if(MIX.equals('ONE')){BTD.stProdIds.add(MIXID);}
            
            mpProductQty.put(p1,Qty);
            mpBTD.put(MIXID,BTD);
            //System.debug('#KEY:' + p1 + '##QTY:' + Qty);
            
            stURLs.add(OrdItm.Id);
            mpProductUrls.put(p1,stURLs);
			
            //System.debug('##KEYS##' + mpBTD.KeySet());
        }
   }   
    
}