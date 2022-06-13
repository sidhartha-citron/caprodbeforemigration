trigger SetWorkOrderfields on WorkOrder (before insert, before update) {
    System.debug('Work Orders Before Trigger');
    
    Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
    
    List<Work_Order_Room__c> workOrderRooms = new List<Work_Order_Room__c>();
        
    Map<Id, Account> accMap = new Map<Id, Account>();
    Map<Id, Order> ordMap = new Map<Id, Order>();
    Map<String, Id> operatingHours = new Map<String, Id>();
    Map<Id, WorkType> workTypeRecords = new Map<Id, WorkType>([SELECT Id, ServiceReportTemplateId FROM WorkType]);
    Map<Id, Survey_Location__c> workOrderLocationMap = new Map<Id, Survey_Location__c>();
    Map<Id, WorkOrder> workOrderMap = new Map<Id, WorkOrder>();
    //Begin:Shashi:8-6-2019:Stock summary:Collections
    Map<Id,WorkOrder> wrkOrdDispMap = new Map<Id, WorkOrder>();
    Map<Id,String> stockSmryMap = new Map<Id, String>();
    //End
    //Begin:Shashi:8-26-2019:Generate Delivery service report
    Map<Id,WorkOrder> mpWrkOrdDelivery = new Map<Id, WorkOrder>();
    Map<String,String> mpProdIdToName = new Map<String,String>();
    Map<Id,Map<String,Integer>> mpDelvSmry = new Map<Id,Map<String,Integer>>();
    Map<Id,Map<String,Integer>> mpNoDelvSmry = new Map<Id,Map<String,Integer>>();
    //End
   
    Map<String, String> workTypeMap = new Map<String, String>
    {
        dataSets.Label_for_Delivery_Work_Type__c => dataSets.Delivery_Work_Type__c,
        dataSets.Hygiene_LOB__c+'.true' => dataSets.Hygiene_Work_Type_Detailed__c, 
        dataSets.Chemical_LOB__c+'.true' => dataSets.Chemical_Work_Type_Detailed__c, 
        dataSets.Pest_LOB__c+'.true' => dataSets.Pest_Control_Work_Type_Detailed__c,
        dataSets.Life_Safety_LOB__c+'.true' => dataSets.Life_Safety_Work_Type_Detailed__c,
        dataSets.Hygiene_LOB__c+'.false' => dataSets.Hygiene_Work_Type_Non_Detailed__c, 
        dataSets.Chemical_LOB__c+'.false' => dataSets.Chemical_Work_Type_Non_Detailed__c, 
        dataSets.Pest_LOB__c+'.false' => dataSets.Pest_Control_Work_Type_Non_Detailed__c,
        dataSets.Life_Safety_LOB__c+'.false' => dataSets.Life_Safety_Work_Type_Non_Detailed__c
    };
    
    for (WorkOrder wo : trigger.new) {
        WorkOrder oldWorkOrder = Trigger.isInsert ? new WorkOrder() : Trigger.OldMap.get(wo.Id);
        //Stamp completion time
        if((wo.Status == dataSets.Work_Order_Completion_Status__c || wo.Status==dataSets.Cannot_Complete_Status_Value__c) && oldWorkOrder.Status != dataSets.Work_Order_Completion_Status__c){
            wo.Completed_Date__c = System.today();
            List<String> dayEndTime = dataSets.Working_Hour_End_Time__c.split('\\:');
            if(!dayEndTime.isEmpty()) {
                Integer dayEndMinute = dayEndTime.size() < 2 ? 00 : Integer.valueOf(dayEndTime.get(1));
                Time dayEndTimeValue = Time.newInstance(Integer.valueOf(dayEndTime.get(0)), dayEndMinute, 00, 00);
                if(dayEndTimeValue!=null) {
                    Time currentTime = Datetime.now().Time();
                    wo.Completed_Date__c = currentTime < dayEndTimeValue ? System.today().addDays(-1) : wo.Completed_Date__c;
                }
            }
        }
        
        //Begin:Shashi:8-6-2019:Stock summary:Stores a list of work orders in dispatched status
        if(Trigger.isUpdate && wo.status==dataSets.Work_Order_Dispatched_Status__c && wo.Type__c != dataSets.Label_for_Delivery_Work_Type__c){
            wrkOrdDispMap.put(wo.Id,wo);
        }
        //End
        //Begin:Shashi:8-26-2019:Generate Delivery service report
        if(Trigger.isUpdate && wo.Type__c == dataSets.Label_for_Delivery_Work_Type__c && 
           (wo.Status==dataSets.Work_Order_Dispatched_Status__c ||
            wo.Status==dataSets.Service_Appointment_Arrived_Status__c ||
            wo.Status==dataSets.Work_Order_Completion_Status__c)){
            mpWrkOrdDelivery.put(wo.Id,wo);
        }
        //End
        
        //Identify if order query is required
        if (wo.Address == null && wo.Order__c != null) {
            
            ordMap.put(wo.Order__c, null);
            /*ordMap.put(wo.Order__c,new Order(Id = wo.Order__c,Shipping_Suite_Number__c = wo.Order__r.Shipping_Suite_Number__c,ShippingStreet = wo.Order__r.ShippingStreet,
                                            ShippingCity = wo.Order__r.ShippingCity,ShippingState = wo.Order__r.ShippingState, ShippingPostalCode = wo.Order__r.ShippingPostalCode,
                                            ShippingCountry = wo.Order__r.ShippingCountry));*/
        }
        //Identify if account query is required
        if (wo.AccountId != null && (wo.Address == null || wo.Site_Survey__c == null || wo.Line_Of_Business__c != null)) {
            accMap.put(wo.AccountId, null);         
        }
        Boolean createLocation = Trigger.isUpdate && wo.New_Location__c && wo.New_Location__c != oldWorkOrder.New_Location__c;
        System.debug('WorkOrderLocation Block: ' + createLocation);
        if(createLocation) {
            Boolean hasError = false;
            if(wo.Location_Name__c==null) {
                hasError=true;
                wo.Location_Name__c.addError('A value is required.');
            }
            if(wo.Building__c==null) {
                hasError=true;
                wo.Building__c.addError('A value is required.');
            }
            if(!hasError) {
                Survey_Location__c newLocation = new Survey_Location__c(
                    Site_Survey__c = wo.Site_Survey__c, 
                    Name = wo.Location_Name__c, 
                    Location_Type__c = wo.Location_Type__c, 
                    Building__c = wo.Building__c, 
                    Floor__c = wo.Floor__c,
                    Location_SubType__c = wo.Location_SubType__c, 
                    Notes__c=wo.Location_Notes__c
                );
                workOrderLocationMap.put(wo.Id, newLocation);
                workOrderMap.put(wo.Id, wo);
                wo.New_Location__c = false; 
                wo.Location_Name__c = ''; 
                wo.Building__c = '';
                wo.Floor__c = '';
            }
            //update trigger for validations
            
        }
    }
    
    /*Creating new Room from Work Order */
    if(!workOrderLocationMap.isEmpty()) {
        insert workOrderLocationMap.values();
        System.debug(' Inserted new locations ' + workOrderLocationMap.values());
        System.debug(' WO Map ' + workOrderMap);
        System.debug(' WOL Map ' + workOrderLocationMap);
        
        for(Id workOrderId : workOrderLocationMap.keySet()) {
            WorkOrder wo = workOrderMap.get(workOrderId);
            Survey_Location__c sl = workOrderLocationMap.get(workOrderId);
            System.debug('New Location ' + sl);
            System.debug('WorkOrder ' + wo);
            Work_Order_Room__c newRoom = new Work_Order_Room__c(
                Work_Order__c = wo.Id, 
                Site_Survey__c = wo.Site_Survey__c, 
                Name = sl.Name, 
                Building__c = sl.Building__c, 
                Floor__c = sl.Floor__c, 
                Location_Type__c = sl.Location_Type__c, 
                Location_SubType__c = sl.Location_SubType__c, 
                Survey_Location__c = sl.Id, 
                Location_Notes__c = sl.Notes__c
            );
            workOrderRooms.add(newRoom);
        }
        if(!workOrderRooms.isEmpty()) {
            insert workOrderRooms;
            System.debug(' New work order rooms ' + workOrderRooms);
        }
    }
    
    if (!ordMap.isEmpty()) {
        System.debug(ordMap.keyset());
        for (Order o : [SELECT Id, Shipping_Suite_Number__c, ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry FROM Order WHERE Id IN :ordMap.keyset()]) {
            ordMap.put(o.Id, o);
        }       
    } 
    
    for (Account a : [SELECT Id, Shipping_Suite_Number__c, ShippingStreet, ShippingCity, ShippingState, ShippingPostalCode, ShippingCountry, Site_Survey__c, Site_Survey__r.Notes__c, Account.OperatingHoursId, 
                      Account.Hygiene_OperatingHoursId__c, Account.Life_Safety_OperatingHoursId__c, Account.Chemical_OperatingHoursId__c, Account.Pest_Control_OperatingHoursId__c, 
                      Account.Detailing_Reporting__c FROM Account WHERE Id IN :accMap.keyset()]) {
        accMap.put(a.Id, a);
    }
    
    //Begin:Shashi:8-26-2019:Generate Delivery service report
    if(mpWrkOrdDelivery.size()>0){
        List<AggregateResult> grpResD = [SELECT WorkOrderId,Product2.ProductCode PCode,Product2.Name PName,Status,SUM(Quantity) Qty
                                         FROM WorkOrderLineItem where workorderid in: mpWrkOrdDelivery.keySet() 
                                         GROUP BY WorkOrderId,Product2.ProductCode,Product2.Name,Status
                                         ORDER BY WorkOrderId];
        for (AggregateResult ar:grpResD) {
            Integer qLen=8,pcLen=18;
            String wId=String.valueOf(ar.get('WorkOrderId'));
            String PCode=String.valueOf(ar.get('PCode'));
            String sStatus=String.valueOf(ar.get('Status'));
            Integer Qty=Integer.valueOf(ar.get('Qty'));
            
            if(!mpProdIdToName.containsKey(PCode)){
                mpProdIdToName.put(PCode,String.valueOf(ar.get('PName')));
            }
            
            Map<String,Integer> mProdIdToQty = new Map<String,Integer>();
            Map<Id,Map<String,Integer>> mmProdSummary = new Map<Id,Map<String,Integer>>();
            Integer q = Qty;
            
            if(sStatus==dataSets.Work_Order_Line_Item_CannotComp_Status__c){mmProdSummary = mpNoDelvSmry;} 
            else{mmProdSummary = mpDelvSmry;}
            
            if(mmProdSummary.containsKey(wId)){
                mProdIdToQty = mmProdSummary.get(wId);
                if(mProdIdToQty.containsKey(PCode)){
                    q = mProdIdToQty.get(PCode);
                    q = q + Qty;
                }
                mProdIdToQty.put(PCode,q);
            } 
            else {
                mProdIdToQty.put(PCode,q);
                mmProdSummary.put(wId,mProdIdToQty);
            }
        }
    }
    System.debug('##Product Delivered##' + mpDelvSmry);
    System.debug('##Product Not Delievered##' + mpNoDelvSmry);
    
    //End
    //Begin:Shashi:8-6-2019:Stock Summary:Collect summarized results
    if(wrkOrdDispMap.size()>0){
        List<AggregateResult> grpRes = [Select WorkOrderId,Product2Id,Product2.Name PName,Related_Product__c,
                                        Related_Product__r.Name RName,SUM(Quantity) Qty 
                                        from WorkOrderLineItem where workorderid in: wrkOrdDispMap.keySet() 
                                        group by WorkOrderId,product2Id,Product2.Name,Related_Product__c,Related_Product__r.Name 
                                        Order by WorkOrderId];
        for (AggregateResult ar:grpRes) {
            String dString='',wId='';
            dString += String.valueOf(ar.get('PName'));
            if(ar.get('RName')!=null){dString += ' => ' + String.valueOf(ar.get('RName'));}
            Integer qty = Integer.valueOf(ar.get('Qty'));
            dString += ' x ' + qty + '\n\n';
            wId = String.valueOf(ar.get('WorkOrderId'));
            if(stockSmryMap.containsKey(wId)){
                String apnd = stockSmryMap.get(wId);
                apnd += dString;
                stockSmryMap.put(wId,apnd);
            } else {
                stockSmryMap.put(wId,dString);
            }
        }
    }
    //End
    
    for (WorkOrder wo : trigger.new) {
        
        if (wo.Type__c == dataSets.Label_for_Delivery_Work_Type__c) {
            wo.WorkTypeId = workTypeMap.get(wo.Type__c);
            WorkType wType = workTypeRecords.get(wo.WorkTypeId);
            if (wType != null && wType.ServiceReportTemplateId != null) {
                wo.ServiceReportTemplateId = wType.ServiceReportTemplateId;
            }
        }       
        
        Account a = accMap.get(wo.AccountId);
        if(a != null) {
            if (wo.Address == null && wo.Order__c != null) {
                Order o = ordMap.get(wo.Order__c);
                wo.Suite_Number__c = o.Shipping_Suite_Number__c;
                wo.Street = o.ShippingStreet;
                wo.City = o.ShippingCity;
                wo.State = o.ShippingState;
                wo.PostalCode = o.ShippingPostalCode;
                wo.Country = o.ShippingCountry;
            } else if (wo.Address == null) {
                wo.Suite_Number__c = a.Shipping_Suite_Number__c;
                wo.Street = a.ShippingStreet;
                wo.City = a.ShippingCity;
                wo.State = a.ShippingState;
                wo.PostalCode = a.ShippingPostalCode;
                wo.Country = a.ShippingCountry;
            }
            
            if(a.Site_Survey__c != null) {
                wo.Site_Survey__c = a.Site_Survey__c;
                wo.Site_Survey_Notes__c = a.Site_Survey__r.Notes__c;
            }
            
            if (wo.Line_of_Business__c != null) {
                
                if (wo.Type__c != dataSets.Label_for_Delivery_Work_Type__c) {
                    wo.WorkTypeId = workTypeMap.get(wo.Line_Of_Business__c + '.' + String.valueOf(a.Detailing_Reporting__c));
                    WorkType wType = workTypeRecords.get(wo.WorkTypeId);
                    if (wType != null && wType.ServiceReportTemplateId != null) {
                        wo.ServiceReportTemplateId = wType.ServiceReportTemplateId;
                    }
                }
                
                if (wo.Line_of_Business__c==dataSets.Hygiene_LOB__c) {
                    wo.FSL__VisitingHours__c = a.Hygiene_OperatingHoursId__c;
                } else if(wo.Line_of_Business__c==dataSets.Chemical_LOB__c) {
                    wo.FSL__VisitingHours__c = a.Chemical_OperatingHoursId__c;
                } else if(wo.Line_of_Business__c==dataSets.Pest_LOB__c) {
                    wo.FSL__VisitingHours__c = a.Pest_Control_OperatingHoursId__c;
                } else if(wo.Line_of_Business__c==dataSets.Life_Safety_LOB__c) {
                    wo.FSL__VisitingHours__c = a.Life_Safety_OperatingHoursId__c;
                }
            } else {
                wo.FSL__VisitingHours__c = a.OperatingHoursId;
            }
            System.debug('**Work Order Operating Hours** ' + wo.WorkOrderNumber + ' **LOB** ' + wo.Line_Of_Business__c + ' **OH** ' + wo.FSL__VisitingHours__c + ' **WorkType** ' + wo.WorkTypeId);
        }
        
        //Begin:Shashi:8-6-2019:Stock Summary:Set Stock Summary field
        if(stockSmryMap.size()> 0 && stockSmryMap.containsKey(wo.Id) && wo.Type__c!=dataSets.Label_for_Delivery_Work_Type__c){
            wo.Product_Summary__c = stockSmryMap.get(wo.Id);
        }
        //End
        //Begin:Shashi:8-26-2019:Generate Delivery service report
        if((mpDelvSmry.size()>0) && wo.Type__c==dataSets.Label_for_Delivery_Work_Type__c && 
           wo.Status==dataSets.Work_Order_Dispatched_Status__c){
            wo.Product_Summary__c='Product Ordered\n' + '_______________________________________\n';
            if(mpDelvSmry.containsKey(wo.Id)){
                Map<String,Integer> mPQ = mpDelvSmry.get(wo.Id);
                for(String pc:mPQ.keySet()){
                    String pName = '(' + mpProdIdToName.get(pc) + ')';
                    String Qty = '[' + mPQ.get(pc) + ']';
                    for(Integer q=8-Qty.length();q>0;q--){Qty+='.';}
                    if(pc==null){pc='';}
                    for(Integer p=18-pc.length();p>0;p--){pc+='.';}
                    wo.Product_Summary__c+= Qty + pc + PName + '\n';
                }
            }
        }
        if((mpDelvSmry.size()>0 || mpNoDelvSmry.size()>0) && wo.Type__c==dataSets.Label_for_Delivery_Work_Type__c && 
           (wo.Status==dataSets.Service_Appointment_Arrived_Status__c ||
            wo.Status==dataSets.Work_Order_Completion_Status__c)){
                
            System.debug('##STATUS##' + wo.Status);
                
            wo.Product_Summary__c='Product Delivered\n' + '_______________________________________\n';
            if(mpDelvSmry.containsKey(wo.Id)){
                Map<String,Integer> mPQ = mpDelvSmry.get(wo.Id);
                for(String pc:mPQ.keySet()){
                    String pName = '(' + mpProdIdToName.get(pc) + ')';
                    String Qty = '[' + mPQ.get(pc) + ']';
                    for(Integer q=8-Qty.length();q>0;q--){Qty+='.';}
                    if(pc==null){pc='';}
                    for(Integer p=18-pc.length();p>0;p--){pc+='.';}
                    wo.Product_Summary__c+= Qty + pc + PName + '\n';
                }
            }
            if(mpNoDelvSmry.size()>0){
                wo.Product_Summary__c+='\n\nProduct Not Delivered\n' + '_______________________________________\n';
            }
                
            if(mpNoDelvSmry.containsKey(wo.Id)){
                Map<String,Integer> mPQ = mpNoDelvSmry.get(wo.Id);
                for(String pc:mPQ.keySet()){
                    String pName = '(' + mpProdIdToName.get(pc) + ')';
                    String Qty = '[' + mPQ.get(pc) + ']';
                    for(Integer q=8-Qty.length();q>0;q--){Qty+='.';}
                    if(pc==null){pc='';}
                    for(Integer p=18-pc.length();p>0;p--){pc+='.';}
                    wo.Product_Summary__c+= Qty + pc + PName +'\n';
                }
            }
        }
        
         if(wo.Type__c==dataSets.Label_for_Delivery_Work_Type__c && 
            (wo.Status==dataSets.Work_Order_Scheduled_Status__c ||
             wo.Status==dataSets.Cannot_Complete_Status_Value__c)){
                 wo.Product_Summary__c='';
         }
        //End
    }
}