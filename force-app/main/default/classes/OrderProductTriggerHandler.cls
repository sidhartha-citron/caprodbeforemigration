/**
 * OrderProductTriggerHandler: 
 * @author Shashi
 * @version 1.0 
 * @since 8-12-2019 
 * @Modified By : Varun 03/20/20 :Invoice Adjustment changes
 **/
public class OrderProductTriggerHandler extends TriggerHandler {
    /**Variables**/
    Boolean isDelete = false;
    
    private Id userProfileId = UserInfo.getProfileId();
    private Date todaysDate = System.today();
    private Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    /**Collections**/
    private List<OrderItem> lstnewOrdPrds;
    private List<OrderItem> lstoldOrdPrds;
    
    private Map<Id,OrderItem> mapnewOrdPrds;
    private Map<Id,OrderItem> mapoldOrdPrds;
    //Feb 23, 2021
    static List<OrderItem> allOrderItems;
    static Map<Id,OrderItem> allOrderItemsMap;
    
    /**
     * Constructor
     **/
    public OrderProductTriggerHandler(){
        this.setMaxLoopCount(20);
        
        lstnewOrdPrds = Trigger.new;
        lstoldOrdPrds = Trigger.old;
        mapnewOrdPrds = (Map<Id,OrderItem>)Trigger.newMap;
        mapoldOrdPrds = (Map<Id,OrderItem>)Trigger.oldMap;
        
    }
    
   
    /** TRIGGER EVENTS **/
    protected override void beforeInsert(){
        if(TriggerHandler.isBypassed('OrderProductTriggerHandler')){return;}
        System.debug('OrderProductTriggerHandler|BeforeInsert|setOrderProductFields:validate fields|Begin: ' + Limits.getQueries());
        setOrderProductFields();
        System.debug('OrderProductTriggerHandler|BeforeInsert|setOrderProductFields:validate fields|End: ' + Limits.getQueries());
        System.debug('OrderProductTriggerHandler|BeforeInsert|InsNeedTicketStamp|Begin: ' + Limits.getQueries());
        InsNeedTicketStamp();
        System.debug('OrderProductTriggerHandler|BeforeInsert|InsNeedTicketStamp|End: ' + Limits.getQueries());
        
        System.debug('OrderProductTriggerHandler|BeforeInsert|CPQ2|Begin: ' + Limits.getQueries());
        CPQ2_Service.handleBeforeInsertTrigger(lstnewOrdPrds);
        System.debug('OrderProductTriggerHandler|BeforeInsert|CPQ2|End: ' + Limits.getQueries());
    }
    
    protected override void beforeUpdate(){
        if(TriggerHandler.isBypassed('OrderProductTriggerHandler')){return;}
        System.debug('OrderProductTriggerHandler|BeforeUpdate|setOrderProductFields:validate fields|Begin: ' + Limits.getQueries());
        setOrderProductFields();
        System.debug('OrderProductTriggerHandler|BeforeUpdate|setOrderProductFields:validate fields|End: ' + Limits.getQueries());
        System.debug('OrderProductTriggerHandler|BeforeUpdate|UptNeedTicketStamp|Begin: ' + Limits.getQueries());
        UptNeedTicketStamp();
        System.debug('OrderProductTriggerHandler|BeforeUpdate|UptNeedTicketStamp|End: ' + Limits.getQueries());
        setLastServicePlan();
        
        System.debug('OrderProductTriggerHandler|BeforeUpdate|CPQ2|Begin: ' + Limits.getQueries());
        CPQ2_Service.handleBeforeUpdateTrigger(lstnewOrdPrds, mapoldOrdPrds);
        System.debug('OrderProductTriggerHandler|BeforeUpdate|CPQ2|End: ' + Limits.getQueries());
    }
    
    protected override void beforeDelete(){
        if(TriggerHandler.isBypassed('OrderProductTriggerHandler')){return;}
        System.debug('OrderProductTriggerHandler|BeforeDelete|delOrderItems:Delete -> OrderItems|Begin: ' + Limits.getQueries());
        delOrderItems();
        System.debug('OrderProductTriggerHandler|BeforeDelete|delOrderItems:Delete -> OrderItems|End: ' + Limits.getQueries());
    }
    
    protected override void afterInsert(){
        if(TriggerHandler.isBypassed('OrderProductTriggerHandler')){return;}
        System.debug('OrderProductTriggerHandler|AfterInsert|populateListAndMapAllOrderItems:Update -> Assets|Begin: ' + Limits.getQueries());
        populateListAndMapAllOrderItems();
        System.debug('OrderProductTriggerHandler|AfterInsert|populateListAndMapAllOrderItems:Update -> Assets|End: ' + Limits.getQueries());
        System.debug('OrderProductTriggerHandler|AfterInsert|createOrderItemLoc:Create -> Order_Item_Location|Begin: ' + Limits.getQueries());
        createOrderItemLoc();
        System.debug('OrderProductTriggerHandler|AfterInsert|createOrderItemLoc:Create -> Order_Item_Location|End: ' + Limits.getQueries());
        System.debug('OrderProductTriggerHandler|AfterInsert|insUpdateOrdToOrdItm:Update -> Order|Begin: ' + Limits.getQueries());
        insUpdateOrdToOrdItm();
        System.debug('OrderProductTriggerHandler|AfterInsert|insUpdateOrdToOrdItm:Update -> Order|End: ' + Limits.getQueries());
        System.debug('OrderProductTriggerHandler|AfterInsert|calculateServicePlanTotalDuration-> ServiceManager|Begin: ' + Limits.getQueries());
        //Varun: FXR-592: 05/22/2020
        calculateServicePlanTotalDurationonUpdate();
        System.debug('OrderProductTriggerHandler|AfterInsert|calculateServicePlanTotalDuration -> ServiceManager|End: ' + Limits.getQueries());
    }
    
    protected override void afterUpdate(){
        System.debug('OrderProductTriggerHandler|AfterUpdate|populateListAndMapAllOrderItems:Update -> Assets|Begin: ' + Limits.getQueries());
        populateListAndMapAllOrderItems();
        System.debug('OrderProductTriggerHandler|AfterUpdate|populateListAndMapAllOrderItems:Update -> Assets|End: ' + Limits.getQueries());
        System.debug('OrderProductTriggerHandler|AfterUpdate|updateSurveyAssets:Update -> Assets|Begin: ' + Limits.getQueries());
       	updateSurveyAssets();
        System.debug('OrderProductTriggerHandler|AfterUpdate|updateSurveyAssets:Update -> Assets|End: ' + Limits.getQueries());
        System.debug('OrderProductTriggerHandler|AfterUpdate|updOrdToOrdItm:Update -> Order|Begin: ' + Limits.getQueries());
       	updOrdToOrdItm();
        System.debug('OrderProductTriggerHandler|AfterUpdate|updOrdToOrdItm:Update -> Order|End: ' + Limits.getQueries());
        System.debug('OrderProductTriggerHandler|AfterUpdate|calculateServicePlanTotalDurationonUpdate-> ServiceManager|Begin: ' + Limits.getQueries());
        //Varun: FXR-592: 05/22/2020
        calculateServicePlanTotalDurationonUpdate();
        System.debug('OrderProductTriggerHandler|AfterUpdate|calculateServicePlanTotalDurationonUpdate -> ServiceManager|End: ' + Limits.getQueries());
    }
    
    protected override void afterDelete(){
        if(TriggerHandler.isBypassed('OrderProductTriggerHandler')){return;}
        System.debug('OrderProductTriggerHandler|AfterDelete|delUpdateOrdToOrdItm:Update -> Order|Begin: ' + Limits.getQueries());
       	delUpdateOrdToOrdItm();
        System.debug('OrderProductTriggerHandler|AfterDelete|delUpdateOrdToOrdItm:Update -> Order|End: ' + Limits.getQueries());
        System.debug('OrderProductTriggerHandler|AfterDelete|calculateServicePlanTotalDurationonDelete-> ServiceManager|Begin: ' + Limits.getQueries());
        //Varun: FXR-592: 05/22/2020
        calculateServicePlanTotalDurationonDelete();
        System.debug('OrderProductTriggerHandler|AfterDelete|calculateServicePlanTotalDurationonDelete -> ServiceManager|End: ' + Limits.getQueries());
    }

    /**
     * populateListAndMapAllOrderItems: save soql 
     * Feb 23, 2021
     **/
    private void populateListAndMapAllOrderItems(){
        if(allOrderItems == null){        
            if(mapnewOrdPrds != null){
                allOrderItems = new List<OrderItem>([SELECT Id,	OrderId, service_plan__c, product2.Service_Work_Type__c, Product2.Service_Work_Type__r.DurationInMinutes,
                                                            Order.Parent_Order__c, Parent_Order_Product__c,isPurchaseOnly__c,PricebookEntry.Product2Id, Frequency__c, Active__c,
                                                            HasSurveyAssets__c, Order.Site_Survey__c, Order.Parent_Order__r.Site_Survey__c,	Quantity, Order.Emergency__c,
                                                            Related_Product__c, Order.RecordTypeId, Survey_Location__c
                                                    FROM OrderItem WHERE Id IN: mapnewOrdPrds.keySet()]);
                
                allOrderItemsMap = new Map<Id, OrderItem>();
                for(OrderItem Oi : allOrderItems){
                    allOrderItemsMap.put(Oi.Id, Oi);
                }
            }
        }
    }

    /**
     * InsNeedTicketStamp: Captures Additions
     **/
    private void InsNeedTicketStamp(){
        for(OrderItem OI:lstnewOrdPrds){
            if(OI.Need_Ticket__c!=null){if(OI.Need_Ticket__c.contains('$CLONE$')){OI.Need_Ticket__c='';continue;}}
            //Begin:Shashi:10-15-2019:Do not added installation changes on Insert
            //No need to include in invoice adjustment ticket as W/O completion will create a installation ticket for billing team
            if(OI.Installation_Status__c!=null && OI.Installation_Status__c==BillingTicketData.INSTALL_STATUS){continue;}
            //End
            //Begin:Shashi:03-27-2020:Add Clear date value
            If(OI.Product_Type__c == dataSets.Item_Type_for_Consumables__c){continue;}
            if(OI.Frequency__c == dataSets.Non_Recurring_Frequency_Value__c){continue;}
            
            String drDate = '';
            if(OI.Last_Order_Active_Date__c!=null){drDate = String.valueOfGmt(OI.Last_Order_Active_Date__c);}
            if(drDate!=null){OI.Need_Ticket__c = BillingTicketData.CLEAR_DATE + '|' + drDate + '\n';}
            //End
            
            //New OrderItem was added
            OI.Need_Ticket__c += BillingTicketData.ADDED + '|' + System.today() + '\n';
            //System.debug('InsNeedTicketStamp|' + OI.Need_Ticket__c);
        }
    }
    
    /**
     * NeedTicketStamping: Captures Price, Frequency, quantity, activation and de-actiavtion status
     **/
    private void UptNeedTicketStamp(){
        for(OrderItem NOI:lstnewOrdPrds){
            if(NOI.Need_Ticket__c!=null){if(NOI.Need_Ticket__c.contains('$CLONE$')){NOI.Need_Ticket__c='';continue;}}
            //No need to include in invoice adjustment ticket as W/O completion will create a installation ticket for billing team
            if(NOI.Installation_Status__c==BillingTicketData.INSTALL_STATUS && NOI.Valid_for_Install_Remove_Replace__c==true){continue;}
            
            //Begin:Shashi:03-27-2020:Add Clear date value
            If(NOI.Product_Type__c == dataSets.Item_Type_for_Consumables__c){continue;}
            if(NOI.Frequency__c == dataSets.Non_Recurring_Frequency_Value__c){continue;}
            
            OrderItem OOI = mapoldOrdPrds.get(NOI.Id);
            if(NOI.Need_Ticket__c==null){NOI.Need_Ticket__c='';}else{NOI.Need_Ticket__c += '\n';}
            
            //Begin:Shashi:03-27-2020:Add Clear date value
            String nT = NOI.Need_Ticket__c;
            nT=nT.replace('null', '');
            //System.debug('--NT--' + nT);
            if((OOI.Active__c==TRUE && NOI.Active__c==FALSE) ||
               (OOI.Active__c==FALSE && NOI.Active__c==TRUE) ||
                NOI.Frequency__c!=OOI.Frequency__c || 
                NOI.Service_Price_Per_Unit__c!=OOI.Service_Price_Per_Unit__c 
               ){
                Integer idx = nT.indexOf(BillingTicketData.CLEAR_DATE);
                String drDate = '';
                if(idx >= 0){
                    Integer eidx = nT.indexOf('\n', idx);
                    String uT = nT.substring(idx,eidx + 1);
                    if(NOI.Last_Order_Active_Date__c!=null){drDate = String.valueOfGmt(NOI.Last_Order_Active_Date__c);}
                    //System.debug('==DATE==' + drDate + '==' + nT.contains(drDate) + '==' + NOI.Last_Order_Active_Date__c);
                    if(!nT.contains(drDate)){
                        nT = BillingTicketData.CLEAR_DATE + '|' + drDate + '\n';
                        NOI.Need_Ticket__c=nT;
                    }
                } else {
                    if(NOI.Last_Order_Active_Date__c!=null){drDate = String.valueOfGmt(NOI.Last_Order_Active_Date__c);}
                    nT += BillingTicketData.CLEAR_DATE + '|' + drDate + '\n';
                    NOI.Need_Ticket__c=nT;
                }
            }
            //End
            //OrderItem is deactivated 
            if(OOI.Active__c==TRUE && NOI.Active__c==FALSE){
                nT = replaceUtil(BillingTicketData.DEACTIVE,nT);
                nT += BillingTicketData.DEACTIVE + '|' + System.today() + '\n';
                NOI.Need_Ticket__c = nT;
            }
            //OrderItem is reactivated
            if(OOI.Active__c==FALSE && NOI.Active__c==TRUE){
                nT = replaceUtil(BillingTicketData.REACTIVE,nT);
                nT += BillingTicketData.REACTIVE + '|' + System.today() + '\n';
                NOI.Need_Ticket__c = nT;
            }
            //OrderItem frequency is changed
            if(NOI.Frequency__c!=OOI.Frequency__c){
                nT = replaceUtil(BillingTicketData.FREQUENCY,nT);
                //System.debug('--FREQ--' + nT);
                nT = nT.replace('#',OOI.Frequency__c);
                nT = nT.replace('^',NOI.Frequency__c);                
                NOI.Need_Ticket__c = nT;
            }
            //OrderItem service price is changed
            if(NOI.Service_Price_Per_Unit__c!=OOI.Service_Price_Per_Unit__c){
                nT = replaceUtil(BillingTicketData.SERVICEP,nT);
                Decimal OPrice=0,NPrice=0;
                if(OOI.Service_Price_Per_Unit__c!=null){OPrice=OOI.Service_Price_Per_Unit__c.setScale(2,System.RoundingMode.HALF_UP);}
                if(NOI.Service_Price_Per_Unit__c!=null){NPrice=NOI.Service_Price_Per_Unit__c.setScale(2,System.RoundingMode.HALF_UP);}
                nT += BillingTicketData.SERVICEP + '|' + OPrice + '|' + NPrice + '\n';
                NOI.Need_Ticket__c = nT;
            }
            //System.debug('UptNeedTicketStamp|' + NOI.Need_Ticket__c);
        }
    }
    
    /**
     * Utility to replace existing value with empty string
     **/
    private String replaceUtil(String cond,String input){
        String nT = input;
        Integer idx = nT.indexOf(cond);
        //Begin:Shashi:03-27-2020:Add Clear date value
        if(idx >= 0){
            Integer eidx = nT.indexOf('\n', idx);
            String uT = nT.substring(idx,eidx + 1);
            if(cond==BillingTicketData.FREQUENCY){
                List<String> splits = uT.split('\\|');
                String vT = '';
                if(splits.size()==3){vT = BillingTicketData.FREQUENCY + '|' + splits[1] + '|' + '^' + '\n';}
                //System.debug('--SIZE:' + splits.size() + '--' + vT);
                nT = nT.replace(uT,vT);
            } else {
            	nT = nT.replace(uT,'');
            }
        }
        else {
            if(cond==BillingTicketData.FREQUENCY){nT+= BillingTicketData.FREQUENCY + '|#|' + '^' + '\n';}
        }
        return nT;
        //End
    }
    
    /**
     * forbeforeDelete: Deletes the Order Items, Order Item Locations and Survey Asset Locations associated to an Order
     **/
    private void delOrderItems(){
        Set<Id> parentOrderIds = new Set<Id>();
        Set<Id> orderItemDeletes = new Set<Id>();
        List<Order_Product_Delete__c> orderproductdeletes = new List<Order_Product_Delete__c>();
        for (OrderItem oi : lstoldOrdPrds) {
            orderproductdeletes.add(new Order_Product_Delete__c(
                    Date_Deleted__c=System.today(), 
                    Order__c=oi.OrderId, 
                    Order_Item_Status__c=oi.Installation_Status__c, 
                    Order_Item_Number__c=oi.OrderItemNumber, 
                    Order_Product_ID__c=oi.Id
                )
            ); 
            parentOrderIds.add(oi.OrderId);
            orderItemDeletes.add(oi.Id);
        }
        //System.debug('Creating Order Product Delete Records for deleted Order Items');
        //System.debug(orderproductdeletes);
        insert orderproductdeletes;
        
        List<Order> childOrders = [SELECT Id, Status, Parent_Order__c, RecordTypeId FROM Order WHERE Parent_Order__c IN:parentOrderIds AND Status='Activated'];
        
        for(Order o : childOrders) {
            o.Status = o.RecordTypeId==dataSets.Regular_Order_Record_Type_Id__c ? dataSets.Regular_Order_Draft_Stage__c : dataSets.Shopping_Cart_Order_Draft_Stage__c;
        }
        TriggerHandler.bypass('OrderTriggerHandler');
        update childOrders;
        TriggerHandler.clearBypass('OrderTriggerHandler');
        
        if (!orderItemDeletes.isEmpty()) {
            delete [SELECT Id FROM OrderItem WHERE Parent_Order_Product__c IN :orderItemDeletes];
        }
        for(Order o : childOrders) {
            o.Status = dataSets.Order_Active_Stage__c;
        }
        TriggerHandler.bypass('OrderTriggerHandler');
        update childOrders;
        TriggerHandler.clearBypass('OrderTriggerHandler');
        
        Set<Id> surveyAssetIds = new Set<Id>();
        List<Order_Item_Location__c> orderLocationDeletes = new List<Order_Item_Location__c>();
        for(Order_Item_Location__c oil : [SELECT Id, Survey_Asset_Location__c, Order_Product__c, Order_Product__r.Order.Emergency__c 
                                          FROM Order_Item_Location__c WHERE Order_Product__c IN:orderItemDeletes]) 
        {
            orderLocationDeletes.add(oil);
            if(!oil.Order_Product__r.Order.Emergency__c) {
                surveyAssetIds.add(oil.Survey_Asset_Location__c);
            }
        }
        
        if(!orderLocationDeletes.isEmpty()) {
            delete orderLocationDeletes;
            if(!surveyAssetIds.isEmpty()) {
                delete [SELECT Id FROM Survey_Asset_Location__c WHERE Id IN: surveyAssetIds];
            }
        }
    } 
    
    /**
     * setOrderProductFields: Validate field values and set defaults
     **/
    private void setOrderProductFields(){
        Set<Id> pricebookEntryIds = new Set<Id>();
        List<OrderItem> spawnedOrderItems = new List<OrderItem>();
        
        Map<Id,Id> prodPricebookEntryMap = new Map<Id,Id>();
        Map<Id, Order> orderMap = new Map<Id, Order>();
        Map<Id,Product2> prodMap = new Map<Id,Product2>();
        Map<String,Frequency__c> freqMap = Frequency__c.getAll();
        
        for (OrderItem oi : lstnewOrdPrds) {
            pricebookEntryIds.add(oi.PricebookEntryId);
            prodPricebookEntryMap.put(oi.PricebookEntryId, null);
            orderMap.put(oi.OrderId, null);
        }
        orderMap.remove(null);
        prodPricebookEntryMap.remove(null);
        
        orderMap = new Map<Id, Order>([SELECT ID, Status, AccountId, EffectiveDate, Parent_Order__c,
                                       Site_Survey__c,Emergency__c, Line_of_Businesses__c 
                                       FROM Order 
                                       WHERE ID IN : orderMap.keySet()]);
        
        //Shashi:12/22/2020:SOQL Query reduction
        OrderItemUtilityClass.mapOrders = orderMap;
        //21506, Dec 11, 2018
        OrderItemUtilityClass.orderItemPriceController(lstnewOrdPrds, mapoldOrdPrds);
                
        //System.debug(pricebookEntryIds);
        for (PricebookEntry p : [SELECT Id, Name, Product2Id FROM PricebookEntry WHERE Id IN :prodPricebookEntryMap.keySet()]) {
            prodPricebookEntryMap.put(p.Id, p.Product2Id);
            prodMap.put(p.Product2Id,null);
        }
        prodMap.remove(null);
        //System.debug(prodPricebookEntryMap);
        //System.debug(prodMap);
        
        for (Product2 p : [SELECT Id, Item_Type__c, Allowable_Frequencies__c, Name FROM Product2 WHERE Id IN :prodMap.keySet()]) {
            prodMap.put(p.Id,p);
        }
        //System.debug(prodMap);
        
        Map<Id,OrderItem> orderPrdMp = new Map<Id,OrderItem>([SELECT ID,Service_Plan__c,Service_Plan__r.Effective_Date__c,
                                                              Service_Plan__r.Schedule_Type__c,Service_Plan__r.Schedule_Type__r.Code__c  
                                       FROM OrderItem 
                                       WHERE OrderId IN : orderMap.keySet()]);
        
        // Check permission set
        List<PermissionSetAssignment> isUserAuthenticated = [SELECT PermissionSetId, AssigneeId FROM PermissionSetAssignment WHERE AssigneeId =: Userinfo.getUserId() AND PermissionSetId =: dataSets.FSLAllowActivatedOrderUpdateId__c LIMIT 1];
        
        for (OrderItem oi : lstnewOrdPrds) {
            OrderItem oldRec = (oi.Id==null) ? new OrderItem() : mapoldOrdPrds.get(oi.Id);
            Order o = orderMap.get(oi.OrderId); 
			   
            if(!oi.Active__c && oi.Active__c!=oldRec.Active__c){oi.Deactivated_Date__c = System.today();}
            
            //Begin:Shashi:10-2-2019:Only allow update if Need Ticket field is not empty
            System.debug('~~NEEDTICKET~~' + oldRec.Need_Ticket__c + '~~' + oi.Need_Ticket__c);
            if(!oi.Active__c && oi.Active__c==oldRec.Active__c) {
                if(!oi.By_Pass_Activation__c){
                  	oi.addError('This Order Product is not Active, Please Activate the Order Product before updating it');
                }
            }
            if(oi.By_Pass_Activation__c){oi.By_Pass_Activation__c=false;}
            
            //End
			//System.debug('***VALID INSTALL REMOVE REPLACE FLAG BEFORE***' + oi.Valid_for_Install_Remove_Replace__c);						            
            if(oi.Installation_Status__c!=NULL && oi.Installation_Status__c!=oldRec.Installation_Status__c && !TriggerHelper.isCompletionTrigger) {
                oi.Valid_for_Install_Remove_Replace__c = TRUE;
                if(oi.Frequency__c==dataSets.Non_Recurring_Frequency_Value__c){oi.Is_Completed__c = FALSE;}
            } else if(oi.Installation_Status__c==NULL){
                oi.Valid_for_Install_Remove_Replace__c = FALSE;
            }
            //System.debug('***VALID INSTALL REMOVE REPLACE FLAG AFTER***' + oi.Valid_for_Install_Remove_Replace__c);
            
            oi.Inventory_Consumed__c = oi.Inventory_Allocated__c && !oldRec.Inventory_Allocated__c ? FALSE :  oi.Inventory_Consumed__c; //for case 21528 to detect inventory allocated change
            
            //21528 - set Next Service Date field
            if(oi.Last_Automation_Created_Date__c!=NULL || oi.Last_InFlight_WO_Date__c!=NULL) {
                //oi.Next_Service_Date__c = oi.Last_Automation_Created_Date__c;
                //oi.Next_Service_Date__c = (oi.Last_InFlight_WO_Date__c!=NULL && oi.Last_InFlight_WO_Date__c > oi.Next_Service_Date__c) || oi.Next_Service_Date__c==NULL ? oi.Last_InFlight_WO_Date__c : oi.Next_Service_Date__c;
                //oi.Next_Service_Date__c = oi.Next_Service_Date__c.addDays(Integer.valueOf(oi.FrequencyInDays__c));
                
                if(oi.Id!=null && orderPrdMp.containsKey(oi.Id)){
                        OrderItem ois = orderPrdMp.get(oi.Id);
                        if(ois.Service_Plan__c!=null && ois.Service_Plan__r.Schedule_Type__c!=null){
                        Integer InAdvance = Integer.valueOf(dataSets.Work_Orders_In_Advance__c)/30;  
                        if(InAdvance<=0){InAdvance=1;}
                        InAdvance++;
                        ServicePlanDateWrapper srvPlanDW = new ServicePlanDateWrapper(InAdvance);
                        //System.debug('--InAdvance Months--' + InAdvance + '--FROM--' + ois.Service_Plan__r.Effective_Date__c);
                        List<Date> lstPreSchDates = srvPlanDW.getServicePlanDays(ois.Service_Plan__r.Schedule_Type__r.Code__c,ois.Service_Plan__r.Effective_Date__c);
                        List<Date> dtList = new List<Date>();
                        if(lstPreSchDates.size()>0){for(Date sdt:lstPreSchDates){if(sdt>=Date.today()){dtList.add(sdt);}}}
                        if(dtList.size()>0){
                            if(dtList.size()>1 && dtList[0]==Date.today()){oi.Next_Service_Date__c = dtList[1];}
                            else{oi.Next_Service_Date__c = dtList[0];}
                        }
                    }
                }
            } 
            /*else if (dataSets.Service_Start__c!=null){
                System.debug('Custom Setting Next Service Date: ' + dataSets.Service_Start__c);
                oi.Next_Service_Date__c = o.EffectiveDate.addDays(Integer.valueOf(dataSets.Service_Start__c));
            }*/
            
            //System.debug('--NEXT SERVICE DATE OPT--' + oi.Next_Service_Date__c);
            
            //oi.Next_Service_Date__c = oi.Next_Service_Date__c >= todaysDate ? oi.Next_Service_Date__c : todaysDate;
            
            Boolean isValid = oldRec.Installation_Price__c!=oi.Installation_Price__c || oi.Installation_Status__c!=oldRec.Installation_Status__c;            
            if(isValid) {
                Boolean isConsumableOneTime = (oi.Installation_Status__c != null && oi.Installation_Status__c != dataSets.Status_Value_for_Install_of_a_Product__c) && oi.Frequency__c.equalsIgnoreCase(dataSets.Non_Recurring_Frequency_Value__c) && oi.Item_Type__c.equalsIgnoreCase(dataSets.Item_Type_for_Consumables__c);
                //System.debug('isConsumableOneTime ' + isConsumableOneTime);
                
                if(isConsumableOneTime) {
                    oi.addError(' You cannot provide Installation Price or Installation Status for a One-Time Consumable Product. ');
                } else {
                    Boolean requireStatus = oi.Installation_Price__c!=NULL && (oi.Installation_Status__c!=dataSets.Status_Value_for_Install_of_a_Product__c && oi.Installation_Status__c!=dataSets.Status_Value_for_Replace_of_a_Product__c);
                    //System.debug('RequireStatus ' + requireStatus);
                    
                    if(requireStatus && oi.Installation_Status__c!=dataSets.Status_Value_for_Removal_of_a_Product__c) {
                        oi.Installation_Status__c.addError('Please fill in Installation Status picklist for this item');
                    }
                    Boolean requireInstallPrice = String.isNotBlank(oi.Installation_Status__c) && (oi.Installation_Status__c==dataSets.Status_Value_for_Install_of_a_Product__c || oi.Installation_Status__c==dataSets.Status_Value_for_Replace_of_a_Product__c) && oi.Installation_Price__c==NULL; 
                    if(requireInstallPrice) {
                        oi.Installation_Price__c.addError('Please enter a value for the Installation Price field for Installation Statuses of ' + dataSets.Status_Value_for_Install_of_a_Product__c +' or ' + dataSets.Status_Value_for_Replace_of_a_Product__c +', zero dollars are accepted, if customer should not be charged. ');
                    }
                }
            }
            
            Id productId = prodPricebookEntryMap.get(oi.PricebookEntryId);
            Product2 prod = prodMap.get(productId);
            if (prod != null) {
                oi.Product_Type__c = prod.Item_Type__c;
            }
            
            if (prod != null) {
                if(prod.Allowable_Frequencies__c != null) {
                    Set<String> allowableFreq = new Set<String>(); 
                    allowableFreq.addAll(prod.Allowable_Frequencies__c.split(';'));
                    if (oi.Active__c && oi.Service_Price_Per_Unit__c != null && oi.Frequency__c != null && !allowableFreq.contains(oi.Frequency__c )) {
                        oi.Frequency__c.addError(oi.Frequency__c + ' is not applicable for the product. Applicable frequencies are ' + prod.Allowable_Frequencies__c);
                    }
                } else if(oi.Frequency__c != 'One-Time'){
                    oi.Frequency__c.addError(prod.Name + ' cannot be a recurring service/delivery');
                }
                
            }
            //Price calculation
            Frequency__c frequency = freqMap.get(oi.Frequency__c);
            
            //Standard UnitPrice, represents total first year cost for quantity of 1
            oi.UnitPrice = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (oi.Service_Price_Per_Unit__c != null ? oi.Service_Price_Per_Unit__c : 0) : 0) + (oi.Installation_Price__c != null ? oi.Installation_Price__c : 0) + (oi.Purchase_Price__c != null ? oi.Purchase_Price__c : 0);
            
            //Monthly Revenue =  ((# of Occurrences * Service Price / 12)
            oi.Monthly_Revenue__c = (frequency != null ? (frequency.Occurrences_In_Year__c != null ? frequency.Occurrences_In_Year__c : 0) * (oi.Service_Price_Per_Unit__c != null ? oi.Service_Price_Per_Unit__c : 0) : 0)/12;
            
            if (Trigger.isInsert) {    
                if(oi.Order.EffectiveDate <= System.today()) {
                    oi.ServiceDate = System.today();
                } else {
                    oi.ServiceDate = orderMap.get(oi.OrderId).EffectiveDate;
                }
                oi.Active__c = TRUE;
            } 
            if(!ServicePlanUtils.allowActiveOrderUpdates && o.Status==dataSetS.Order_Active_Stage__c && userProfileId!=dataSets.System_Administrator_Profile_Id__c && userProfileId!=dataSets.Integration_User_Profile__c && isUserAuthenticated.isEmpty()) {
                oi.addError('Please deactivate the order before editing the line items. ');
            }
        }
        
        for (OrderItem oi : lstnewOrdPrds) {
            Order o = orderMap.get(oi.OrderId); 
            //System.debug('**Quantity Block** ' + oi.OrderItemNumber + ' ' + oi.Quantity);
            
            if(oi.Quantity > 1 && oi.Active__c) {
                //System.debug('**Quantity Block Inside** ' + oi.OrderItemNumber + ' ' + oi.Quantity);
                Integer originalQuantity = Integer.valueOf(oi.Quantity - 1); 
                //System.debug('**Oringinal Quantity ** ' + oi.Id + ' ' + oi.Quantity);
                oi.Quantity = 1;
                
                if(o!=null && originalQuantity!=null) {
                    if(ServicePlanUtils.allowActiveOrderUpdates || 
                       o.Status!=dataSetS.Order_Active_Stage__c || 
                       userProfileId==dataSets.System_Administrator_Profile_Id__c || 
                       userProfileId==dataSets.Integration_User_Profile__c) {
                        for(Integer i=0; i<originalQuantity; i++) {
                            OrderItem newItem = oi.clone(false, true, false, false);
                            newItem.HasSurveyAssets__c = false;
                            newItem.Quantity = 1;
                            newItem.Survey_Location__c = null;
                            spawnedOrderItems.add(newItem);
                        }
                    } else{
                        oi.addError('Please deactivate the order before editing the line items. ');
                    }
                }
            }
        }
        
        if(!spawnedOrderItems.isEmpty()) {
            //System.debug('Spawned ' + spawnedOrderItems.size() + ' items');
            upsert spawnedOrderItems;
        }
        //21618
        OrderItemUtilityClass.setActiveLookupToOrder((List<OrderItem>)Trigger.New);
    }
    
    /**
     * createOrderItems: Updates child orders and creates Survey assets, Order Item locations 
     * site survey asset creation, executed only for order line items with a site survey attached to parent order, has either installation/service price filled in and if the order is
       the parent order. If order is spawned from an opportunity, then site survye information is already copied over,  
       Order qty is always 1 -- hence no logic is implemented to facilitate qty increase or decrease and site survey details maintanence
       if order line items are deleted then all associated site survey information is deleted -- done in the beginning of this trigger -- this is in the case of parent order
       After insert of an orderItem , if it is on a parent order site survey records would be created if those details arent already in the system
       if order item is inserted from a child order, a corresponding one wouldbe added to the parent order and it would have site survey information -- confirm this with Tu
     **/
    private void createOrderItemLoc(){
        Set<Id> orderIds = new Set<Id>();
        
        List<OrderItem> newChildOrderItems = new List<OrderItem>();
        List<OrderItem> newParentItems = new List<OrderItem>();
        List<Order> childOrderList = new List<Order>();
        List<Order> originalChildOrders = new List<Order>();
        List<Order_Item_Location__c> newOrderItemLocations = new List<Order_Item_Location__c>();
        List<OrderItem> emergencyOrderItems = new List<OrderItem>();
        List<Order_Item_Location__c> emergencyOrderItemLocations = new List<Order_Item_Location__c>();
        
        Map<Id, List<Order>> childOrders = new Map<Id, List<Order>>();
        Map<Id, Survey_Asset_Location__c> newAssetMap = new Map<Id, Survey_Asset_Location__c>();
        
        /*Feb 23, 2021 - to reduce SOQL
        Map<Id, OrderItem> newOrderItems = new Map<Id, OrderItem>([SELECT Id, OrderId, Order.Parent_Order__c, Parent_Order_Product__c, isPurchaseOnly__c, PricebookEntry.Product2Id, Frequency__c, Active__c, Survey_Location__c,
                                                                   HasSurveyAssets__c, Order.Site_Survey__c, Order.Parent_Order__r.Site_Survey__c, Quantity, Order.Emergency__c, Related_Product__c, Order.RecordTypeId
                                                                   FROM OrderItem WHERE Id IN: lstnewOrdPrds AND Active__c=TRUE AND Is_Replacement_from_Flow__c=FALSE]);//21618, filtering these out to have logic run in flow
        */
        
        for(OrderItem oi : lstnewOrdPrds) {
            //Feb 23, 2021
            //if(oi.Active__c) {
            //    OrderItem theItem = newOrderItems.get(oi.Id);
            if(oi.Active__c && !oi.Is_Replacement_from_Flow__c) {
                OrderItem theItem = allOrderItemsMap.get(oi.Id);
                Boolean isValid = theItem != null && theItem.Order.Parent_Order__c == null && theItem.Order.Site_Survey__c != null /*&& !theItem.Order.Emergency__c*/;
                if(isValid) {
                    orderIds.add(oi.OrderId);
                    newParentItems.add(theItem);
                }
            }
        }
        
        if(!orderIds.isEmpty() && !newParentItems.isEmpty()) {
            for(Order o : [SELECT Id, Parent_Order__c, Status, RecordTypeId, Parent_Order__r.RecordTypeId FROM Order WHERE Parent_Order__c IN:orderIds]) {
                if(o.Status.equalsIgnoreCase(dataSets.Order_Active_Stage__c)) {
                    childOrderList.add(o);
                    originalChildOrders.add(o);
                }
                if(childOrders.containsKey(o.Parent_Order__c)) {
                    childOrders.get(o.Parent_Order__c).add(o);
                } else {
                    childOrders.put(o.Parent_Order__c, new List<Order>{o});
                }
            }
            
            if(!childOrderList.isEmpty()) {
                for(Order o : childOrderList) {
                    o.Status = o.RecordTypeId==dataSets.Regular_Order_Record_Type_Id__c ? dataSets.Regular_Order_Draft_Stage__c : dataSets.Shopping_Cart_Order_Draft_Stage__c;
                }
                //System.debug('deactivating child orders ');
                //System.debug(childOrderList);
                TriggerHandler.bypass('OrderTriggerHandler');
                update childOrderList;
                TriggerHandler.clearBypass('OrderTriggerHandler');
            }
            
            for(OrderItem oi : lstnewOrdPrds) {
                if(childOrders.containsKey(oi.OrderId) && oi.Active__c) {
                    for(Order o : childOrders.get(oi.OrderId)) {
                        OrderItem newItem = oi.clone(false, true, false, false);
                        newItem.Quantity = 1;
                        newItem.OrderId = o.Id;
                        newItem.Parent_Order_Product__c = oi.Id; 
                        newChildOrderItems.add(newItem);
                    }
                }
            }
            
            if(!newChildOrderItems.isEmpty()) {
                //System.debug(' inserting new child orders items ');
                //System.debug(newChildOrderItems);
                insert newChildOrderItems;
                //System.debug(' re-activating the child orders '); 
                //System.debug(originalChildOrders);
                if(!originalChildOrders.isEmpty()){
                    for(Order o : originalChildOrders) {
                        o.Status = dataSets.Order_Active_Stage__c;
                    }
                }
                TriggerHandler.bypass('OrderTriggerHandler');
                update originalChildOrders;
                TriggerHandler.clearBypass('OrderTriggerHandler');
            }
            
            if(!newParentItems.isEmpty()) {
                //System.debug(' newParentItems ' + newParentItems);
                for(OrderItem oi : newParentItems) {
                    if(!oi.isPurchaseOnly__c && !oi.HasSurveyAssets__c && oi.Active__c) {
                        //OrderItem theItem = newOrderItems.get(oi.Id); - Feb 23, 2021
                        OrderItem theItem = allOrderItemsMap.get(oi.Id);
                        Survey_Asset_Location__c newAsset = new Survey_Asset_Location__c(
                            Site_Survey__c = theItem.Order.Site_Survey__c, 
                            Product__c = theItem.PricebookEntry.Product2Id, 
                            Related_Product__c = oi.Related_Product__c, 
                            Quantity__c = 1, 
                            Originating_Record_ID__c = oi.Id, 
                            Originating_Parent_ID__c = oi.OrderId, 
                            Service_Frequency__c = oi.Frequency__c,
                            //21618, add Survey Location immediately if one exists
                            Survey_Location__c = theItem.Survey_Location__c
                        );
                        newAssetMap.put(oi.Id, newAsset);
                    }
                }
                if(!newAssetMap.isEmpty()) {
                    insert newAssetMap.values();
                    System.debug('new survey assets ' + newAssetMap);
                    for(OrderItem oi : newParentItems) {
                        if(!oi.isPurchaseOnly__c && !oi.HasSurveyAssets__c && oi.Active__c) {
                            newOrderItemLocations.add(new Order_Item_Location__c(
                                Order__c = oi.OrderId, 
                                Order_Product__c = oi.Id, 
                                Survey_Asset_Location__c = (newAssetMap.get(oi.Id) != null ? newAssetMap.get(oi.Id).Id : null)
                            )); 
                        }
                        oi.HasSurveyAssets__c = true;
                        oi.SurveyAssetCountChecker__c = oi.Quantity;
                    }
                    
                    insert newOrderItemLocations;
                    //System.debug(' new order item locations ' + newOrderItemLocations);
                    //System.debug(' changed order items ' + newParentItems);
                    update newParentItems;
                } 
            }
        }
    }
    
    /**
     * updateSurveyAssets: Update Survey asset related product and frequency
     **/
    private void updateSurveyAssets(){
        List<Survey_Asset_Location__c> updateSurveyAssets = new List<Survey_Asset_Location__c>();
        
        Map<Id, OrderItem> updateSurveyAssetsIds = new Map<Id, OrderItem>();
        /* Feb 23, 2021 to reduce SOQL
        Map<Id, OrderItem> newOrderItems = new Map<Id, OrderItem>([SELECT Id, OrderId, Order.Parent_Order__c, Parent_Order_Product__c, isPurchaseOnly__c, PricebookEntry.Product2Id, Frequency__c, Active__c,
                                                                   HasSurveyAssets__c, Order.Site_Survey__c, Order.Parent_Order__r.Site_Survey__c, Quantity, Order.Emergency__c, Related_Product__c, Order.RecordTypeId
                                                                   FROM OrderItem WHERE Id IN: lstnewOrdPrds AND Active__c=TRUE]);
		*/
        
        for(OrderItem oi : lstnewOrdPrds) {
            if(oi.Active__c) {
                //OrderItem theItem = newOrderItems.get(oi.Id); - Feb 23, 2021
                OrderItem theItem = allOrderItemsMap.get(oi.Id);
                Boolean isValid = theItem != null && theItem.Order.Parent_Order__c == null && theItem.Order.Site_Survey__c != null;
                if(isValid) {
                    OrderItem oldRec = mapoldOrdPrds.get(oi.Id);
                    if(oldRec.Related_Product__c != oi.Related_Product__c || oldRec.Frequency__c != oi.Frequency__c) {
                        //System.debug(' -- Changed Related Prod or Frequency -- ' + oi.OrderItemNumber);
                        updateSurveyAssetsIds.put(oi.Id, oi);
                    }
                }
            }
        }
        
        if(!updateSurveyAssetsIds.isEmpty()) {
            for(Order_Item_Location__c ol : [SELECT Order_Product__c, Survey_Asset_Location__r.Related_Product__c, Survey_Asset_Location__r.Service_Frequency__c 
                                             FROM Order_Item_Location__c WHERE Order_Product__c=:updateSurveyAssetsIds.keySet()]) 
            {
                OrderItem oi = updateSurveyAssetsIds.get(ol.Order_Product__c);
                ol.Survey_Asset_Location__r.Related_Product__c = oi.Related_Product__c; 
                ol.Survey_Asset_Location__r.Service_Frequency__c = oi.Frequency__c;
                updateSurveyAssets.add(ol.Survey_Asset_Location__r);
            }
            if(!updateSurveyAssets.isEmpty()) {
                //System.debug(updateSurveyAssets);
                update updateSurveyAssets;
            }
        }
    }
    
    /**
     * delUpdateOrdToOrdItm: Update orders from order items
     **/
    private void delUpdateOrdToOrdItm(){
        Set<Id> orderIds = new Set<Id>();
        Map<Id,OrderItem> orderItemMap = new Map<Id,OrderItem>();
        for(OrderItem oi : lstoldOrdPrds) {orderIds.add(oi.OrderId);}
        updateOrderFromOrderItem(orderIds,orderItemMap);
    }
    
    /**
     * insUpdateOrdToOrdItm: Update orders from order items
     **/
    private void insUpdateOrdToOrdItm(){
        Set<Id> orderIds = new Set<Id>();
        Map<Id,OrderItem> orderItemMap = new Map<Id,OrderItem>();
        for (OrderItem oi : lstnewOrdPrds) {
                OrderItem oldRec = new OrderItem();
                Boolean isValid = oi.Line_of_Business__c!=oldRec.Line_of_Business__c || oi.Item_Type__c!=oldRec.Item_Type__c || oi.Active__c!=oldRec.Active__c;
                orderItemMap.put(oi.Id,oi);
                if(isValid) {orderIds.add(oi.OrderId);}
        }
        updateOrderFromOrderItem(orderIds,orderItemMap);
    }

    
    /**
     * updOrdToOrdItm: Update orders from order items
     **/
    private void updOrdToOrdItm(){
        Set<Id> orderIds = new Set<Id>();
        Map<Id,OrderItem> orderItemMap = new Map<Id,OrderItem>();
        for (OrderItem oi : lstnewOrdPrds) {
                OrderItem oldRec = mapoldOrdPrds.get(oi.Id);
                Boolean isValid = oi.Line_of_Business__c!=oldRec.Line_of_Business__c || oi.Item_Type__c!=oldRec.Item_Type__c || oi.Active__c!=oldRec.Active__c;
                orderItemMap.put(oi.Id,oi);
                if(isValid) {orderIds.add(oi.OrderId);}
        }
        updateOrderFromOrderItem(orderIds,orderItemMap);
    }
    
    /**
     * updateOrderFromOrderItem: Update orders from order items
     **/
    private void updateOrderFromOrderItem(Set<Id> orderIds,Map<Id,OrderItem> orderItemMap){
        List<Order> updateOrders = new List<Order>();
        List<OrderItem> orderItemUpdates = new List<OrderItem>();
        
        Map<Id,Order> originalOrderStates = new Map<Id,Order>();
        Map<Id,Order> tempOrderStates = new Map<Id,Order>();
        
        for(Order o : [SELECT Id, Product_Categories__c, Line_of_Businesses__c, Status, RecordTypeId, 
                       (SELECT Id, Item_Type__c, Product2Id, ServiceDate, EndDate, Active__c, Asset__c, Related_Product__c, Separate_Delivery__c, Service_Price_Per_Unit__c, 
                        Installation_Price__c, Purchase_Price__c, Inventory_Allocated__c, Description, Line_of_Business__c, Order.Status, Order.RecordTypeId FROM OrderItems WHERE Active__c=TRUE) 
                       FROM Order WHERE Id IN :orderIds]) 
        {
            for(OrderItem oi : o.OrderItems){
                orderItemMap.put(oi.Id, oi);
            }
            /* 2021-03-02 Updates in OrderTriggerHandler now 
            Set<String> categorySet = new Set<String>();
            Set<String> lobSet = new Set<String>();
            String categories;
            String lob;
            Boolean areAllLineItemsInactive = true;//21618
           
            for(OrderItem oi : o.OrderItems){
                
                categorySet.add(oi.Item_Type__c);
                lobSet.add(oi.Line_of_Business__c);
                orderItemMap.put(oi.Id, oi);
                
                if (oi.Active__c && areAllLineItemsInactive) {
                	areAllLineItemsInactive = false;
            	}
                
            }
            
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
                //21618 - bypass this piece so the line of business doesn't get wiped and inadvertently throwing a validation rule
                if (!areAllLineItemsInactive) {
                	o.Line_of_Businesses__c = lob;
                }            
                updateOrders.add(o);
            }
            */
        }
        
        orderItemMap.remove(null);
        
        if (!orderItemMap.isEmpty()) {
            
            for (OrderItem oi : [SELECT Id, Parent_Order_Product__c, OrderId, Order.Status, Product2Id, ServiceDate, EndDate, Active__c, Asset__c, Order.RecordTypeId,
                                 Related_Product__c, Separate_Delivery__c, Service_Price_Per_Unit__c, Installation_Price__c, Purchase_Price__c, Inventory_Allocated__c, Description 
                                 FROM OrderItem WHERE Parent_Order_Product__c IN :orderItemMap.keyset()]) {
                                     OrderItem mainRec = orderItemMap.get(oi.Parent_Order_Product__c);
                                     
                                     if (oi.Product2Id != mainRec.Product2Id ||
                                         oi.ServiceDate != mainRec.ServiceDate || 
                                         oi.EndDate != mainRec.EndDate ||
                                         oi.Active__c != mainRec.Active__c ||
                                         oi.Asset__c != mainRec.Asset__c ||
                                         oi.Related_Product__c != mainRec.Related_Product__c || 
                                         oi.Separate_Delivery__c != mainRec.Separate_Delivery__c || 
                                         oi.Service_Price_Per_Unit__c != mainRec.Service_Price_Per_Unit__c ||
                                         oi.Installation_Price__c != mainRec.Installation_Price__c || 
                                         oi.Purchase_Price__c != mainRec.Purchase_Price__c ||
                                         oi.Inventory_Allocated__c != mainRec.Inventory_Allocated__c ||
                                         oi.Description != mainRec.Description
                                        ) {
                                            
                                            originalOrderStates.put(oi.OrderId, new Order(
                                                Id = oi.OrderId,
                                                Status = oi.Order.Status
                                            ));
                                            tempOrderStates.put(oi.OrderId, new Order(
                                                Id = oi.OrderId,
                                                Status = oi.Order.RecordTypeId==dataSets.Regular_Order_Record_Type_Id__c ? dataSets.Regular_Order_Draft_Stage__c : dataSets.Shopping_Cart_Order_Draft_Stage__c
                                            ));
                                            
                                            oi.ServiceDate = mainRec.ServiceDate;
                                            oi.EndDate = mainRec.EndDate;
                                            oi.Active__c = mainRec.Active__c;
                                            oi.Asset__c = mainRec.Asset__c;
                                            oi.Related_Product__c = mainRec.Related_Product__c;
                                            oi.Separate_Delivery__c = mainRec.Separate_Delivery__c;
                                            oi.Service_Price_Per_Unit__c = mainRec.Service_Price_Per_Unit__c;
                                            oi.Installation_Price__c = mainRec.Installation_Price__c;
                                            oi.Purchase_Price__c = mainRec.Purchase_Price__c;
                                            oi.Inventory_Allocated__c = mainRec.Inventory_Allocated__c;
                                            oi.Description = mainRec.Description;
                                            orderItemUpdates.add(oi);
                                        }
                                 }
        }
/* 2021-03-02 Updates in OrderTriggerHandler now        
        if (!updateOrders.isEmpty()) {
            TriggerHandler.bypass('OrderTriggerHandler');
            update updateOrders;
            TriggerHandler.clearBypass('OrderTriggerHandler');
        }
*/        
        if (!orderItemUpdates.isEmpty()) {
            //System.debug(tempOrderStates.values());
            update tempOrderStates.values();
            update orderItemUpdates;
            update originalOrderStates.values();
        }
    }

    private void setLastServicePlan() {
        for (OrderItem oi : lstnewOrdPrds) {
            SObject oiObject = (SObject) oi;
            SObject oldObject = (SObject) mapoldOrdPrds.get(oi.Id);
            String oldServicePlan = String.valueOf(oldObject.get('Service_Plan__c'));

            if (!oi.Active__c || ApexUtils.fieldChanged(oiObject, oldObject, 'Frequency__c')) {
                if (String.isNotBlank(oldServicePlan)) {
                    oi.Last_Service_Plan__c = oldServicePlan;
                }

                oi.Service_Plan__c = null;
                continue;
            }

            if (ApexUtils.fieldChanged(oiObject, oldObject, 'Service_Plan__c')) {
                if (String.isNotBlank(oldServicePlan)) {
                    oi.Last_Service_Plan__c = oldServicePlan;
                }
            }
        }
    }
    
    //Varun: FXR-592: 05/22/2020
    private void calculateServicePlanTotalDurationonUpdate(){
        //Gather serviceplan ids for which total duration needs to be calculated  
        Set<Id> servPlanSet=new Set<Id>();
        for(OrderItem  ordItm : lstnewOrdPrds){
            if(ordItm.service_plan__c != null){servPlanSet.add(ordItm.service_plan__c);}  
            if(mapoldOrdPrds!=null){
                //System.debug('map old ord prds size'+mapoldOrdPrds.size());
                OrderItem OLDOITM = mapoldOrdPrds.get(ordItm.id);
                //System.debug('map old ord OLDOITM'+OLDOITM);
                if(OLDOITM!=null){
                    if(OLDOITM.Service_Plan__c!=null){servPlanSet.add(OLDOITM.service_plan__c);}   
                }
            }
        }
        //Utility method to calculate Service plan total duration for Service Work type
        if(!servPlanSet.isEmpty()){
            calculateTotalDuration(servPlanSet);
        }
        
    }    
    
    //Varun: FXR-592: 05/22/2020    
    private void calculateServicePlanTotalDurationonDelete(){
        //Gather serviceplan ids for which total duration needs to be calculated
        Set<Id> servPlanSet=new Set<Id>();
        for(OrderItem  ordItm : lstoldOrdPrds){
            if(ordItm.service_plan__c != null){
                servPlanSet.add(ordItm.service_plan__c);
            }		
        }
        //Utility method to calculate Service plan total duration for Service Work type
        if(!servPlanSet.isEmpty()){
            calculateTotalDuration(servPlanSet);
        }	 
    }    
	
    //Varun: FXR-592: 05/22/2020
	//Utility method to calculate Service plan total duration for Service Work type	
    private void calculateTotalDuration(Set<id> servPlanSet){	
        List<Service_plan__c> servPlanListToUpdate=new List<Service_plan__c>();
        Map<Id,Integer> mpSPtoCount = new Map<Id,Integer>();
        Map<Id,Decimal> mpSPtoDuration = new Map<Id,Decimal>();
        //Set<Id> spId = new Set<Id>();
        if(!servPlanSet.isEmpty()){
             for(OrderItem OI : [SELECT Id,service_plan__c, product2.Service_Work_Type__c,Product2.Service_Work_Type__r.DurationInMinutes 
                                FROM OrderItem  WHERE service_plan__c IN :servPlanSet and active__c = TRUE]) {
        
                                    if(mpSPtoCount.containsKey(OI.service_plan__c)){
                                        Integer count = mpSPtoCount.get(OI.service_plan__c);
                                        count = count + 1;
                                        mpSPtoCount.put(OI.service_plan__c,count);
                                    } else {
                                        mpSPtoCount.put(OI.service_plan__c,1);
                                    }
                                    
                                    //spId.add(OI.Service_Plan__c);
                                    if(OI.Product2.Service_Work_Type__c!=null && OI.Product2.Service_Work_Type__r.DurationInMinutes!=null){
                                        if(mpSPtoDuration.containsKey(OI.service_plan__c)){
                                            Decimal dura = mpSPtoDuration.get(OI.service_plan__c);
                                            dura = OI.Product2.Service_Work_Type__r.DurationInMinutes+dura;
                                            mpSPtoDuration.put(OI.service_plan__c,dura);
                                        } else {
                                            mpSPtoDuration.put(OI.service_plan__c,OI.Product2.Service_Work_Type__r.DurationInMinutes);
                                        }
                                    }
                }
            //2021-03-23 Darcy: interating over the larger set so the stats for service plans that are not on any order products are set to zero
            for(Id SII:servPlanSet){
                Service_plan__c sp = new Service_plan__c(Id = SII, Count__c = 0, Service_Total_Duration__c = 0);
                if(mpSPtoDuration.containsKey(SII)){sp.Service_Total_Duration__c=mpSPtoDuration.get(SII);}
                if(mpSPtoCount.containsKey(SII)){sp.Count__c=mpSPtoCount.get(SII);}
                servPlanListToUpdate.add(sp);
            }
        }
        if(!servPlanListToUpdate.isEmpty()){
            try{
                update servPlanListToUpdate;
            }catch(DmlException de){
                System.debug(de);
            }
        }	
    }        
}