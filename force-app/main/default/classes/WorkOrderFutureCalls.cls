global class WorkOrderFutureCalls {
	
	@Future
	global static void createQA(Set<Id> workOrderIds, Id userId) {
		Date todaysDate = System.today();
		Datetime endOfDay = Datetime.newInstance(todaysDate.year(), todaysDate.month(), todaysDate.day(), 23, 59, 59);
		
		Set<Id> qaWorkOrderIds = new Set<Id>();
		
		List<WorkOrderLineItem> QALineItems = new List<WorkOrderLineItem>();
		List<ServiceAppointment> insertSA = new List<ServiceAppointment>();
		List<AssignedResource> insertAR = new List<AssignedResource>();
		List<ServiceAppointment> updateSA = new List<ServiceAppointment>();
		
		Map<Id, ServiceAppointment> woSAValueMap = new Map<Id, ServiceAppointment>();
		Map<Id, List<WorkOrderLineItem>> workOrderLineItemsMap = new Map<Id, List<WorkOrderLineItem>>();
		Map<Id, WorkOrder> processQA = new Map<Id, WorkOrder>();
		Map<Id, WorkOrder> workOrderMap = new Map<Id, WorkOrder>();
		
		if (!workOrderIds.isEmpty()) {
			try {
				ServiceResource resourceRecord = [
					SELECT Id, RelatedRecordId, IsActive
					FROM ServiceResource
					WHERE RelatedRecordId = :userId
					AND ResourceType = 'T'
					AND IsActive = TRUE LIMIT 1
				];
				
				List<ServiceAppointment> sas = [
					SELECT ParentRecordId, ContactId, DueDate, Duration, Type__c, DurationType
					FROM ServiceAppointment
					WHERE ParentRecordId IN :workOrderIds
					ORDER BY DueDate DESC
				];
				
				for (ServiceAppointment saRecord : sas) {
					if (!woSAValueMap.containsKey(saRecord.ParentRecordId)) {
						woSAValueMap.put(saRecord.ParentRecordId, saRecord);
					}
				}
				
				processQA = new Map<Id, WorkOrder>([
					SELECT Id, WorkOrderNumber, AccountId, Site_Survey__c, Opportunity__c, Order__c,
					ParentWorkOrderId, Pricebook2Id, ServiceTerritoryId, ContactId, Priority, OwnerId,
					FSL__VisitingHours__c, StartDate, QA_Requested_Date__c, QA_Status__c, Type__c,
					Create_Quality_Assurance__c
					FROM WorkOrder
					WHERE Id IN :workOrderIds
				]);
				
				// Map for work order line items and work order id
				List<WorkOrderLineItem> wolis = [
					SELECT Order_Product__c, PricebookEntryId, Product__c, Quantity, Priority, FSL__VisitingHours__c,
					StartDate, Related_Product__c, ServiceTerritoryId, UnitPrice, WorkOrderId, Status,
					Work_Order_Location__c
					FROM WorkOrderLineItem
					WHERE WorkOrderId = :processQA.keySet()
				];
				
				for (WorkOrderLineItem li : wolis) {
					if (workOrderLineItemsMap.containsKey(li.WorkOrderId)) {
						workOrderLineItemsMap.get(li.WorkOrderId).add(li);
					} else {
						workOrderLineItemsMap.put(li.WorkOrderId, new List<WorkOrderLineItem>{
							li
								});
					}
				}
				
				for (WorkOrder wo : processQA.values()) {
					WorkOrder newWorkOrder = wo.clone(false, true, false, false);
					newWorkOrder.ParentWorkOrderId = wo.Id;
					newWorkOrder.Type__c = 'QA Work Order';
					newWorkOrder.RecordTypeId = QueryUtils.fieldServiceSettings.QA_WorkOrder_RecordTypeId__c;
					newWorkOrder.QA_Requested_Date__c = todaysDate;
					newWorkOrder.QA_Status__c = 'Requested';
					newWorkOrder.StartDate = parseDate(todaysDate, true);
					workOrderMap.put(wo.Id, newWorkOrder);
				}
				
				insert workOrderMap.values();
				
				for (WorkOrder wo : workOrderMap.values()) {
					List<WorkOrderLineItem> clonedWorkOrderItems = new List<WorkOrderLineItem>();
					
					WorkOrder parentWorkOrder = processQA.get(wo.ParentWorkOrderId);
					
					if (parentWorkOrder != null) {
						String QAClause = parentWorkOrder.Create_Quality_Assurance__c;
						
						if (QAClause == 'Follow-Up') {
							clonedWorkOrderItems = createLineItems(workOrderLineItemsMap.get(parentWorkOrder.Id), wo.Id, false);
						}
						else if (QAClause == 'QA Work Order' || QAClause == 'QA Work Order and Service Appointment') {
							clonedWorkOrderItems = createLineItems(workOrderLineItemsMap.get(parentWorkOrder.Id), wo.Id, true);
							ServiceAppointment parentAppointment = woSAValueMap.get(parentWorkOrder.Id);
							Boolean createSA = QAClause == 'QA Work Order and Service Appointment' && parentAppointment != null;
							
							if (createSA) {
								String eId = todaysDate.year() + '-' + todaysDate.month() + '-' + todaysDate.day() + '-' + wo.Id;
								ServiceAppointment newSARecord = parentAppointment.clone(false, true, false, false);
								newSARecord.ParentRecordId = wo.Id;
								newSARecord.ContactId = wo.ContactId;
								newSARecord.Type__c = 'QA Service Appointment';
								newSARecord.EarliestStartTime = parseDate(todaysDate, false);
								newSARecord.DueDate = endOfDay; //EarliestStartTime
								newSARecord.EID__c = eId;
								insertSA.add(newSARecord);
							}
						}
						
						if (!clonedWorkOrderItems.isEmpty()) {
							QALineItems.addAll(clonedWorkOrderItems);
						}
						
						qaWorkOrderIds.add(wo.Id);
					}
				}
				
				insert QALineItems;
				
				if (!insertSA.isEmpty()) {
					
					insert insertSA;
					
					for (ServiceAppointment newSA : insertSA) {
						AssignedResource newResource = new AssignedResource(
							ServiceAppointmentId = newSA.Id,
							ServiceResourceId = resourceRecord.Id
						);
						insertAR.add(newResource);
						updateSA.add(new ServiceAppointment(
							Id = newSA.Id,
							Status = 'Scheduled',
							SchedStartTime = parseDate(todaysDate, true),
							SchedEndTime = newSA.DueDate
						));
					}
					
					if (!updateSA.isEmpty()) {
						update updateSA;
					}
					
					if (!insertAR.isEmpty()) {
						insert insertAR;
					}
				}
				
				SpawnWorkOrderRooms s = new SpawnWorkOrderRooms(qaWorkOrderIds);
				s.processWorkOrders(qaWorkOrderIds);
			} catch (Exception e) {
				System.debug(e.getLineNumber() + '-' + e.getMessage());
			}
		}
	}
	
	@Future
	global static void futureUpdates(Set<Id> cannotCompleteWorkorders, Set<Id> completedWOs) {
                
		Set<WorkOrderLineItem> updateWOLineItemsSet = new Set<WorkOrderLineItem>();
		Set<Order> updateOrdersSet = new Set<Order>();
		Set<WorkOrder> workOrders = new Set<WorkOrder>();
		Set<Id> idOrdItemDeinstall = new Set<Id>();
		
		List<Order> updateOrders = new List<Order>();
		List<Order> activateOrders = new List<Order>();
		List<WorkOrderLineItem> updateWOLineItems = new List<WorkOrderLineItem>();
		
		Map<Id, Case> workOrderCases = new Map<Id, Case>();
		Map<Id, Work_Order_Room__c> cannotCompleteLocations = new Map<Id, Work_Order_Room__c>();
		Map<Id, OrderItem> updateOrderItems = new Map<Id, OrderItem>();
		
		if (!cannotCompleteWorkorders.isEmpty() || !completedWOs.isEmpty()) {
			//Begin:Shashi:01-29-2020:Flag one-time consumables and equipment completed
			Map<Id, WorkOrderLineItem> workOrderLineItems = new Map<Id, WorkOrderLineItem>([
				SELECT Id, Status, Cannot_Complete_Reason__c, WorkOrderId, WorkOrder.AccountId, WorkOrder.Type__c,
				Completed_Date__c, WorkOrder.Completed_Date__c, WorkOrder.Cannot_Complete_Reason__c, LineItemNumber,
				Order_Product__c, Order_Product__r.Id, Order_Product__r.OrderItemNumber, WorkOrder.Status,
				Order_Product__r.Last_Automation_Created_Date__c, Order_Product__r.Installation_Status__c,
				Order_Product__r.Last_Work_Order_Completed_Date__c,Order_Product__r.Product2.Name,
				Order_Product__r.Service_Plan__c,Order_Product__r.Service_Plan__r.Effective_Date__c, 
				Order_Product__r.Service_Plan__r.Schedule_Type__c,Order_Product__r.Service_Plan__r.Schedule_Type__r.Code__c,
				OrderId, Order.Id, Order.Status, Order.RecordTypeId, WorkOrder.Order__c,
				Type_of_Service__c, WorkOrder.Id, Order_Product__r.Active__c, WorkOrder.HasBeenRescheduled__c,
				Service_Frequency__c, Order_Product__r.Valid_for_Install_Remove_Replace__c,Order.EffectiveDate,
				Order.Inventory_Allocated__c, Order_Product__r.Inventory_Allocated__c, 
				Order_Product__r.Inventory_Consumed__c,Order.Inventory_Consumed__c,Order_Product__r.Is_Completed__c,
				WorkOrder.Installation_Ticket__c, WorkOrder.ContactId, WorkOrder.Emergency__c, Order_Product__r.Frequency__c,
				Order_Product__r.First_Installation_Completed_Date__c, Order.Season_Start_Date__c,WorkOrder.StartDate,
				Work_Order_Location__c, Work_Order_Location__r.Status__c, Work_Order_Location__r.Cannot_Complete_Reason__c
				FROM WorkOrderLineItem
				WHERE (WorkOrderId IN :cannotCompleteWorkorders)
				OR (WorkOrderId IN :completedWOs)
				ORDER BY WorkOrderId
			]);
            //WHERE (WorkOrderId IN :cannotCompleteWorkorders AND Cannot_Complete_Reason__c = NULL)
			//End
			for (WorkOrderLineItem woli : workOrderLineItems.values()) {
				Boolean validForUpdate = false;
				WorkOrder wo = woli.WorkOrder;

				if (wo != null) {
					if (wo.Cannot_Complete_Reason__c != null && woli.Cannot_Complete_Reason__c != wo.Cannot_Complete_Reason__c) {
						woli.Cannot_Complete_Reason__c = wo.Cannot_Complete_Reason__c;
						validForUpdate = true;
					}
                    //CR21-40 2021-03-31 Darcy: update status of wol and woli when work order cannot be completed
                    if (wo.Status == QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c){
                        woli.Status = QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c;
                        woli.Cannot_Complete_Reason__c = wo.Cannot_Complete_Reason__c;
                        validForUpdate = true;
                        
                        if (woli.Work_Order_Location__r.Status__c != QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c 
                            || woli.Work_Order_Location__r.Cannot_Complete_Reason__c != wo.Cannot_Complete_Reason__c){
							cannotCompleteLocations.put(
                                woli.Work_Order_Location__c,
                                new Work_Order_Room__c(
                                    Id = woli.Work_Order_Location__c,
                                    Status__c = QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c,
                                    Cannot_Complete_Reason__c = woli.Cannot_Complete_Reason__c
                                )
							);
						}		  
                    }
					
					if (completedWOs.contains(wo.Id)) {
						if (wo.Type__c == 'Installation' && wo.Installation_Ticket__c == null && !wo.Emergency__c) {
							workOrders.add(wo);
						}

						if(wo.Type__c == 'DeInstall' 
							&& wo.Installation_Ticket__c == null 
							&& !wo.Emergency__c 
							&& woli.Order_Product__r.Frequency__c != QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c) {
							workOrders.add(wo);
						}		
						
						validForUpdate = true;
						woli.Completed_Date__c = wo.Completed_Date__c;
						
						//Because Rescheduled Appointments should not affect Fixed Weekly schedule
						Boolean isValid = !(woli.WorkOrder.HasBeenRescheduled__c);
						
						if (woli.Order_Product__c != null && woli.Order_Product__r.Active__c) {
							
							OrderItem oi = updateOrderItems.get(woli.Order_Product__c);
							if (oi == null){oi = woli.Order_Product__r;}
							Boolean isRegularService = true;
							Boolean uncheckInventory = false;
							Boolean isFirstInstallReplace = false;
							
							System.debug('--' + woli.Order_Product__r.Product2.Name + '--' + wo.Type__c + '--' + woli.Status + '--' + wo.Status);
							//DeInstalls
							if (wo.Type__c == QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c
								&& oi.Installation_Status__c == QueryUtils.fieldServiceSettings.Status_Value_for_Removal_of_a_Product__c
								&& woli.Order.Season_Start_Date__c == null)
							{
								if(wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c ||
								   wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c){
									   if(woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c){
										   oi.Valid_for_Install_Remove_Replace__c = false;
										   oi.Active__c = false;
                                           oi.Asset__c = null; //moved from WorkOrderLineItemSetFieldsWrapper.deactiveOrderItems
										   idOrdItemDeinstall.add(oi.Id);
										   System.debug('--DeInstall WOLI Completed--');
									   }   
								}
								/*if(woli.Status != QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c &&
								woli.Status != QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c){
									if(wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c ||
										woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c){
										oi.Active__c = false;
										oi.Valid_for_Install_Remove_Replace__c = false;   
									} 
								}*/
							}
							//End
							
							//Replace
							if (wo.Type__c == QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c && 
								oi.Installation_Status__c == QueryUtils.fieldServiceSettings.Status_Value_for_Replace_of_a_Product__c) {
									if(wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c ||
									   wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c){
										   if(woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c){
											   oi.Installation_Status__c = QueryUtils.fieldServiceSettings.Status_Value_for_Install_of_a_Product__c;
											   TriggerHelper.isCompletionTrigger = true;
											   oi.Valid_for_Install_Remove_Replace__c = false;
											   System.debug('--Replace WOLI Completed--');
										   }   
									   }
									/*if(wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c){
										oi.Valid_for_Install_Remove_Replace__c = false;
									}*/
								}
							
							//Begin:Shashi:01-23-2020:Service WO & Installs
							if (wo.Type__c != QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c && 
								wo.Type__c != QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c) {
									
									if(wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c ||
									   wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c){
										   if(wo.Type__c==QueryUtils.fieldServiceSettings.Label_for_Install_Work_Order_Type__c){
											   if(woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c){
												   isFirstInstallReplace = woli.Type_of_Service__c != QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c;
												   oi.Valid_for_Install_Remove_Replace__c = false;
												   isRegularService = false;
												   System.debug('--Install WOLI Completed--');
											   }
										   } 
										   else {
											   if(wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c &&
												  woli.Status != QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c &&
												  woli.Status != QueryUtils.fieldServiceSettings.Work_Order_Cancelled_Status__c){
													  isFirstInstallReplace = woli.Type_of_Service__c != QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c;
													  oi.Valid_for_Install_Remove_Replace__c = false;
													  System.debug('--Service WOLI Completed--');
												  }
										   }
									   }
								}
							//End
							
							//Begin:All One-Time
							if ((wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c ||
								 wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c) &&
								woli.Order_Product__r.Frequency__c == QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c) {
									if(wo.Type__c==QueryUtils.fieldServiceSettings.Label_for_Install_Work_Order_Type__c || 
									   wo.Type__c==QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c ||
									   wo.Type__c==QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c){
										   if(woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c){
											   oi.Is_Completed__c = true;
											   oi.Last_Automation_Created_Date__c = wo.Completed_Date__c;
											   System.debug('--One-Time--I/R/D--');
										   }
									   } 
									else {
										if(wo.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c ||
										   woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Completion_Status__c){
											   oi.Is_Completed__c = true;
											   oi.Last_Automation_Created_Date__c = wo.Completed_Date__c;
											   System.debug('--One-Tim--S/D--');
										   }
									}
								}
							//End
							
							//Set Next Service date for recurring deliveries and recurring services
							if(oi.Service_Plan__c!=null && oi.Service_Plan__r.Schedule_Type__c!=null){
								Integer InAdvance = Integer.valueOf(QueryUtils.fieldServiceSettings.Work_Orders_In_Advance__c)/30;  
								if(InAdvance<=0){InAdvance=1;}
								InAdvance++;
								ServicePlanDateWrapper srvPlanDW = new ServicePlanDateWrapper(InAdvance);
								System.debug('--InAdvance Months--' + InAdvance + '--FROM--' + oi.Service_Plan__r.Effective_Date__c);
								List<Date> lstPreSchDates = srvPlanDW.getServicePlanDays(oi.Service_Plan__r.Schedule_Type__r.Code__c,oi.Service_Plan__r.Effective_Date__c);
								List<Date> dtList = new List<Date>();
								if(lstPreSchDates.size()>0){for(Date sdt:lstPreSchDates){if(sdt>=Date.today()){dtList.add(sdt);}}}
								if(dtList.size()>0){
									if(dtList.size()>1 && dtList[0]==Date.today()){oi.Next_Service_Date__c = dtList[1];}
									else{oi.Next_Service_Date__c = dtList[0];}
								}
							}
							
							//Recurring Delivery
							//modified to not run this piece if the frequency of the OI is "one-time" march 14, 2019 [dk] - case 21528
							//Inventory Allocated on the Order header should NOT be changed by this logic per Jeff, march 14, 2019 [dk] - case 21528
							if (woli.Type_of_Service__c == QueryUtils.fieldServiceSettings.Label_for_Delivery_Work_Type__c
								&& woli.Order_Product__r.Frequency__c != QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c)
							{
								oi.Inventory_Allocated__c = false;
								oi.Inventory_Consumed__c = true;
								if(woli.Completed_Date__c < wo.startDate.date()){
									oi.Last_Work_Order_Completed_Date__c = wo.startDate.date();
								} else {
									oi.Last_Work_Order_Completed_Date__c = woli.Completed_Date__c;
								}
								woli.Order.Inventory_Consumed__c = true;
								uncheckInventory = true;
							}
							
							//Recurring Servies
							if ((woli.Type_of_Service__c == QueryUtils.fieldServiceSettings.Label_for_Service_Work_Order_Type__c &&
								 woli.Order_Product__r.Frequency__c != QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c)){
									 if(woli.Completed_Date__c < wo.startDate.date()){
										 oi.Last_Work_Order_Completed_Date__c = wo.startDate.date();
									 } else {
										 oi.Last_Work_Order_Completed_Date__c = woli.Completed_Date__c;
									 }    
								 }
							
							updateOrderItems.put(oi.Id, oi);
							
							if (woli.Order.Status == QueryUtils.fieldServiceSettings.Order_Active_Stage__c || uncheckInventory) {
								updateOrdersSet.add(woli.Order);
							}
							
							if (isValid) {
								if (oi.Last_Automation_Created_Date__c == null
									|| (oi.Last_Automation_Created_Date__c < wo.Completed_Date__c && isRegularService))
								{
									if(woli.Type_of_Service__c != QueryUtils.fieldServiceSettings.Label_for_Replace_Work_Order_Type__c &&
									   woli.Type_of_Service__c != QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c){
										   if(woli.Order_Product__r.Frequency__c != QueryUtils.fieldServiceSettings.Non_Recurring_Frequency_Value__c){
											   System.debug('--COMP--' + woli.Order_Product__r.Frequency__c);
											   oi.Last_Automation_Created_Date__c = wo.Completed_Date__c;
										   }
									   }
									
									if (isFirstInstallReplace) {
										oi.First_Installation_Completed_Date__c = wo.Completed_Date__c;
									}
								}
							}
						}
					}
					if (validForUpdate) {updateWOLineItemsSet.add(woli);}
				}
                //CR21-40 2021-03-31 Darcy: moving logic to when wo is cannot complete instead of woli
				/*
				if (woli.Status == QueryUtils.fieldServiceSettings.Work_Order_Line_Item_CannotComp_Status__c
					&& woli.Work_Order_Location__r.Status__c != QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c)
				{
					cannotCompleteLocations.put(
						woli.Work_Order_Location__c,
						new Work_Order_Room__c(
							Id = woli.Work_Order_Location__c,
							Status__c = QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c,
							Cannot_Complete_Reason__c = woli.Cannot_Complete_Reason__c
						)
					);
				}
				*/
			}
			
			cannotCompleteLocations.remove(null);
			
			if (!cannotCompleteLocations.isEmpty()) {update cannotCompleteLocations.values();}
			
			updateWOLineItems.addAll(updateWOLineItemsSet);
			
			update updateWOLineItems;
			
			if (!updateOrdersSet.isEmpty()) {updateOrders.addAll(updateOrdersSet);}
			
			for (Order o : updateOrders) {
				if (o.Status == QueryUtils.fieldServiceSettings.Order_Active_Stage__c) {
					o.Status = o.RecordTypeId == QueryUtils.fieldServiceSettings.Regular_Order_Record_Type_Id__c ? QueryUtils.fieldServiceSettings.Regular_Order_Draft_Stage__c : QueryUtils.fieldServiceSettings.Shopping_Cart_Order_Draft_Stage__c;
					activateOrders.add(new Order(Id = o.Id, Status = 'Activated'));
				}
			}
			TriggerHandler.bypass('OrderTriggerHandler');
			update updateOrders;
			TriggerHandler.clearBypass('OrderTriggerHandler');
			
			update updateOrderItems.values();
			
			TriggerHandler.bypass('OrderTriggerHandler');
			update activateOrders;
			TriggerHandler.clearBypass('OrderTriggerHandler');
			
			/**
			* Darcy 2021-02-04 invoice adjustment ticket for deinstalls 
			* Adapted Shashi's createTicket code on OrderTriggerHandler
			* Aggregate changes on OrderItem and create Ticket if there are any changes
			*/
			Map<Id,String> mpCaseDesc = new Map<Id,String>();

			if(idOrdItemDeinstall.size()>0){
				Map<Id,Map<Id,BillingTicketData>> mmOrdToProdBTD = new Map<Id,Map<Id,BillingTicketData>>();
				
				List<OrderItem> lstOrdItm = [SELECT Id, OrderId, Order.Account.Name, Product2Id, Quantity, Last_Order_Active_Date__c, 
												Product2.Name, Product2.ProductCode, Need_Ticket__c, Active__c, Order.CreatedDate, Order_Number__c
												FROM OrderItem
												WHERE Id =:idOrdItemDeinstall
												ORDER BY OrderId,Product2Id]; 

				Map<Id, String> mpIdToOrderNumber = new Map<Id, String>();

				for(OrderItem OrdItm:lstOrdItm){

					mpIdToOrderNumber.put(OrdItm.OrderId, OrdItm.Order_Number__c);
					
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
					String orderNumber = mpIdToOrderNumber.get(OrdId);
					String sfUrl = URL.getSalesforceBaseUrl().toExternalForm() +'/$';
					String strDesc = 'Customer (^) had the following Order (' + orderNumber + ') changes on ' + System.today().format() + ':\n\n'+sfUrl+':\n';
					
					for(Id MIXID:dsBTD.KeySet()){
						BillingTicketData printBTD = dsBTD.get(MIXID);
						Boolean isProdId = printBTD.stProdIds.contains(MIXID);
						strDesc = strDesc.replace('^', printBTD.AccountName);
						//System.debug(printBTD);
						//System.debug('##MIXID##' + MIXID + '##PID##' + isProdId);
						
						if(printBTD.mpPrdToQty.containsKey(BillingTicketData.DEACTIVE)){
							strDesc+= printBTD.ProductCode + ' - ' + printBTD.ProductName + ',Quantity x ' + printBTD.mpPrdToQty.get(BillingTicketData.DEACTIVE) + ':Deactivated\n';
							if(isProdId){
								for(String u:PrintBTD.mpPrdToQURL.get(BillingTicketData.DEACTIVE)){strDesc+=u + '\n';}
								strDesc+='\n';
							}
						}
						
						if(!isProdId){strDesc+=MIXID + '\n\n';}
					}
					
					//to test long string attachment
					//strDesc = strDesc.rightPad(32000,'OwO ');
					//end test

					//System.debug('Complete Description for Invoice Adjustment'+strDesc);
					mpCaseDesc.put(OrdId,strDesc);
				}
				
			}
			
			String caseSubject;
			String caseDescription;
			Boolean isInstallTicket;
			for (WorkOrder wo : workOrders) {
				if(wo.Type__c == QueryUtils.fieldServiceSettings.DeInstall_Work_Order_Type__c){
					
					caseSubject = Label.Deinstallation_Complete;
					if(mpCaseDesc.containsKey(wo.Order__c)){
						caseDescription = mpCaseDesc.get(wo.Order__c);
						if(caseDescription.length()>31950){
							caseDescription = 'Please refer to attachment "InvoiceAdjustment.txt" for details.';
						}
					}
					else {
						caseDescription = '';
					}
					isInstallTicket = false;
				}
				else{
					caseSubject = Label.Installation_Complete;
					caseDescription = '';
					isInstallTicket = true;
				}
				//installTickets
				Case newCase = new Case (
					AccountId = wo.AccountId,
					ContactId = wo.ContactId,
					Status = 'New',
					OwnerId = QueryUtils.fieldServiceSettings.Customer_Service_Queue__c,
					Work_Order__c = wo.Id,
					RecordTypeId = QueryUtils.fieldServiceSettings.Invoice_Information_Case_RecordTypeId__c,
					Subject = caseSubject,
					Order__c = wo.Order__c,
					IsInstallationTicket__c = isInstallTicket,
					Description = caseDescription
				);
				workOrderCases.put(wo.Id, newCase);
			}
			
			insert workOrderCases.values();
			
			if(!workOrderCases.isEmpty()){
				List<Attachment> listAtt = new List<Attachment>();
				for(Case ct : workOrderCases.values()){
					if(mpCaseDesc.containsKey(ct.Order__c)){
						String strDesc = mpCaseDesc.get(ct.Order__c);
						if(strDesc.length()>31950){
							Attachment att = new Attachment(Name = 'InvoiceAdjustment.txt', ParentId = ct.Id, Body = Blob.valueOf(strDesc));
							listAtt.add(att);
						}
					}
				}
				if(listAtt.size()>0){insert listAtt;}
			}
			//End Darcy 2021-02-04
			
			for (WorkOrder wo : workOrders) {
				Case newCase = workOrderCases.get(wo.Id);
				wo.Installation_Ticket__c = newCase.Id;
			}
			update new List<WorkOrder>(workOrders);
		}
	}
	
	public static List<WorkOrderLineItem> createLineItems(List<WorkOrderLineItem> wItems, Id workOrderId, Boolean isFullClone) {
		List<WorkOrderLineItem> clonedWorkOrderItems = new List<WorkOrderLineItem>();
		
		for (WorkOrderLineItem li : wItems) {
			if (li.Status == 'Cannot Complete' || isFullClone) {
				WorkOrderLineItem newItem = li.clone(false, true, false, false);
				newItem.StartDate = parseDate(System.today(), false);
				newItem.WorkOrderId = workOrderId;
				newItem.Status = 'New';
				clonedWorkOrderItems.add(newItem);
			}
		}
		return clonedWorkOrderItems;
	}
	
	@Future(Callout = true)
	public static void sendEmailsOnSwappedOrderProducts(Set<Id> workOrderIds) {
		if (workOrderIds == null || workOrderIds.isEmpty()) {
			System.debug('bad data');
			return;
		}
		
		Map<Id, WorkOrder> workOrders = new Map<Id, WorkOrder>([SELECT Id, CongaWorkOrderEmail__c, (SELECT Id, Order_Product__c FROM WorkOrderLineItems WHERE Order_Product__r.Is_Replacement_from_Flow__c = TRUE OR Requires_Order_Product_to_be_Created__c = TRUE OR Status = :QueryUtils.fieldServiceSettings.Cannot_Complete_Status_Value__c) FROM WorkOrder WHERE Id IN :workOrderIds AND Emergency__c = TRUE]);
		
		workOrders.remove(null);
		
		for (WorkOrder wo : workOrders.values()) {
			if (wo.WorkOrderLineItems.isEmpty()) {
				workOrders.remove(wo.Id);
			}
		}
		
		String servUrl = Url.getSalesforceBaseUrl().toExternalForm() + '/services/Soap/u/29.0/' + UserInfo.getOrganizationId();
		String content;
		
		if (Test.isRunningTest()) {
			content = 'Start_Of_Session_Id9End_Of_Session_Id';
		} else {
			content = Page.SessionId.getContent().toString();
		}
		
		Integer s = content.indexOf('Start_Of_Session_Id') + 'Start_Of_Session_Id'.length(),
			e = content.indexOf('End_Of_Session_Id');
		String passedSessionId = content.substring(s, e);
		
		for (WorkOrder wo : workOrders.values()) {
			HttpRequest req = new HttpRequest();
			req.setMethod('GET');
			req.setTimeout(60000);
			req.setEndpoint(QueryUtils.congaAndDocusignSettings.Conga_Root_Endpoint__c + '?sessionId=' + passedSessionId + '&ServerURL=' + EncodingUtil.urlEncode(servUrl, 'UTF-8') + wo.CongaWorkOrderEmail__c);
			new Http().send(req);
		}
	}
	
	@Future
	public static void createPONumberCases(Set<Id> workOrderIds) {
		if (workOrderIds == null || workOrderIds.isEmpty()) {
			System.debug('bad data');
			return;
		}
		
		Map<Id, Case> casesToCreate = new Map<Id, Case>();
		
		List<WorkOrder> wos = [
			SELECT Id, AccountId, Order__c, Order__r.ShipToContactId, StartDate, EndDate, 
			(SELECT Id, SchedStartTime, SchedEndTime 
			 FROM ServiceAppointments 
			 LIMIT 1) 
			FROM WorkOrder 
			WHERE Id IN :workOrderIds 
			AND Order__r.Is_PO_Provided_by_Customer__c = FALSE 
			AND Account.PO_Required_for_Orders__c = :QueryUtils.fieldServiceSettings.PO_Required_Before_Label__c
		];
		
		for (WorkOrder wo : wos) {
			Datetime startDate;
			
			if(wo.ServiceAppointments.isEmpty() || wo.ServiceAppointments[0].SchedStartTime == null) {
				startDate = wo.StartDate;
			}
			else {
				startDate = wo.ServiceAppointments[0].SchedStartTime;
			}
			
			Datetime endDate;
			
			if(wo.ServiceAppointments.isEmpty() || wo.ServiceAppointments[0].SchedEndTime == null) {
				endDate = wo.EndDate;
			}
			else {
				endDate = wo.ServiceAppointments[0].SchedEndTime;
			}
			
			String description;
			
			if(wo.ServiceAppointments.isEmpty()
			   || (wo.ServiceAppointments[0].SchedStartTime == null && wo.ServiceAppointments[0].SchedEndTime == null))
			{
				description = 'Work Order Start Date: ' +
					Datetime.valueOfGmt(String.valueOf(startDate)) +
					'\nWork Order End Date: ' +
					Datetime.valueOfGmt(String.valueOf(endDate));
			}
			else {
				description = 'Service Appointment Scheduled Start Date: ' +
					Datetime.valueOfGmt(String.valueOf(startDate)) +
					'\nService Appointment Scheduled End Date: ' +
					Datetime.valueOfGmt(String.valueOf(endDate));
			}
			
			casesToCreate.put(wo.Id, new Case(
				AccountId = wo.AccountId,
				ContactId = wo.Order__r.ShipToContactId,
				Work_Order__c = wo.Id,
				Order__c = wo.Order__c,
				OwnerId = QueryUtils.fieldServiceSettings.Multi_Res_Queue_Id__c,
				Subject = QueryUtils.fieldServiceSettings.Ticket_PO_Not_Returned_Subject__c,
				RecordTypeId = QueryUtils.fieldServiceSettings.Ticket_Emergency_Record_Type__c,
				Type = QueryUtils.fieldServiceSettings.Pest_Special_Label__c,
				Priority = QueryUtils.fieldServiceSettings.Ticket_Priority_High__c,
				Pest_Emergency_Order_Draft_Override__c = true,
				Description = description
			));
		}
		
		casesToCreate.remove(null);
		
		if (!casesToCreate.isEmpty()) {
			insert casesToCreate.values();
		}
	}
	
	public static Datetime parseDate(Date theDate, Boolean isOffset) {
		Datetime result;
		if (isOffset) {
			Datetime thisMoment = System.now();
			result = thisMoment;
		} else {
			result = Datetime.newInstance(theDate.year(), theDate.month(), theDate.day(), 00, 00, 00);
		}
		
		return result;
	}
	
	/**
	* Utility function to add Quantity
	**/
	private static void buildBillingTickDS(OrderItem OrdItm,Map<Id,BillingTicketData> mpBTD,BillingTicketData BTD,String p1,String p2,String p3,String MIX){
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