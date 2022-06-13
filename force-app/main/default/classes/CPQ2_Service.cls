/**
 * @description Main Service class for the CPQ2 functionality
 * <p/>
 * Created by timothychiang on 2020-03-27.
 */
public with sharing class CPQ2_Service {

    public static Boolean isOppServiceActive = true;
    public static Boolean isOrderServiceActive = true;
    public static Boolean isQuoteServiceActive = true;

    /**
     * @description gets header and line items for target Id
     *
     * @param targetId target opportunity or order Id
     *
     * @return a wrapper class containing the header and lineitems for target Id
     */
    public static CPQ2_Wrapper.CpqEntity getHeaderAndLineItems(Id targetId) {
        Map<Id, CPQ2_Wrapper.CpqEntity> entityMap = getHeadersAndLineItemsMap(new Set<Id>{
            targetId
        });
        return entityMap.get(targetId);
    }

    /**
     * @description gets headers and line items for target Ids
     *
     * @param targetIds targetId target opportunity or order Ids
     *
     * @return wrapper classes containing the header and lineitems for target Id
     */
    public static Map<Id, CPQ2_Wrapper.CpqEntity> getHeadersAndLineItemsMap(Set<Id> targetIds) {
        return getHeadersAndLineItemsMap(targetIds, false);
    }

    /**
     * @description gets headers and line items for target Ids
     *
     * @param targetIds targetId target opportunity or order Ids
     * @param isFilteredByServices switches if the targeted pull is service only or not
     *
     * @return wrapper classes containing the header and lineitems for target Id
     */
    public static Map<Id, CPQ2_Wrapper.CpqEntity> getHeadersAndLineItemsMap(Set<Id> targetIds, Boolean isFilteredByServices) {

        System.debug('*** ' + targetIds);
        if (targetIds == null || targetIds.isEmpty()) {
            return null;
        }

        System.debug('*** ' + targetIds);
        Schema.SObjectType sobjectType = (new List<Id>(targetIds))[0].getSobjectType();
        String sobjectName = sobjectType.getDescribe().getName();

        Map<Id, CPQ2_Wrapper.CpqEntity> entityMap = new Map<Id, CPQ2_Wrapper.CpqEntity>();
        System.debug('Sanchivan sobjectName: ' + sobjectName);

        if (sobjectName == CPQ2_Util.SOBJECT_NAME_OPP) {
            List<Opportunity> opportunityList = OpportunityService.getOpportunityByIds(targetIds);
            Map<Id, List<OpportunityLineItem>> opportunityIdToOliMap = new Map<Id, List<OpportunityLineItem>>();
            System.debug('Sanchivan isFilteredByServices: ' + isFilteredByServices);
            if (isFilteredByServices) {
                opportunityIdToOliMap = OpportunityService.getOpportunityProductsByOpportunityIdsAndTypeMap(targetIds, CPQ2_Util.PRODUCT_TYPE_SERVICE);
            } else {
                opportunityIdToOliMap = OpportunityService.getOpportunityProductsByOpportunityIdsMap(targetIds);
            }
            System.debug('Sanchivan opportunityIdToOliMap: ' + opportunityIdToOliMap);

            for (Opportunity opp : opportunityList) {
                List<OpportunityLineItem> opportunityProductList = new List<OpportunityLineItem>();
                if (opportunityIdToOliMap.containsKey(opp.Id)) {
                    opportunityProductList = opportunityIdToOliMap.get(opp.Id);
                }

                entityMap.put(opp.Id, new CPQ2_Wrapper.CpqEntity(opp, opportunityProductList));
            }
        } else if(sobjectName == CPQ2_Util.SOBJECT_NAME_ORDER){
            List<Order> opportunityList = OrderService.getOrderByIds(targetIds);
            Map<Id, List<OrderItem>> orderIdToOrderLineItemMap = new Map<Id, List<OrderItem>>();

            if (isFilteredByServices) {
                orderIdToOrderLineItemMap = OrderService.getOrderProductsByOrderIdsAndTypeMap(targetIds, CPQ2_Util.PRODUCT_TYPE_SERVICE);
            } else {
                orderIdToOrderLineItemMap = OrderService.getOrderProductsByOrderIdsMap(targetIds);
            }
            for (Order order : opportunityList) {
                List<OrderItem> orderProductList = new List<OrderItem>();
                if (orderIdToOrderLineItemMap.containsKey(order.Id)) {
                    orderProductList = orderIdToOrderLineItemMap.get(order.Id);
                }

                entityMap.put(order.Id, new CPQ2_Wrapper.CpqEntity(order, orderProductList));
            }
        }

        return entityMap;
    }

    /**
     * @description gets header and line items for target Id enriched with product information
     *
     * @param targetId targetId target opportunity or order Id
     *
     * @return a wrapper class containing the header and lineitems for target Id
     */
    public static CPQ2_Wrapper.CpqEntity getHeaderAndLineItemsWithProductInfo(Id targetId) {
        CPQ2_Wrapper.CpqEntity entity = getHeaderAndLineItems(targetId);

        String type = targetId.getSObjectType().getDescribe().getName();

        if(type == CPQ2_Util.SOBJECT_NAME_OPP){
            Map<Id, CPQ2_Core_List_Price_Request__c> coreListPriceRequestMap = OpportunityService.getContractPriceRequestMapByOpportunityId(targetId);
            Map<Id, CPQ2_VMI_Request__c> vmiRequestMap = OpportunityService.getVmiRequestMapByOpportunityId(targetId);
            entity.enrich(coreListPriceRequestMap, vmiRequestMap);
        }

        Set<Id> prodIdSet = new Set<Id>();
        for (CPQ2_Wrapper.LineItem li : entity.lineItems) {
            prodIdSet.add(li.productId);
        }

        if (!prodIdSet.isEmpty()) {
            List<ProductService.ProductWrapper> productInformationList = ProductService.getProductInformationByIds(prodIdSet, entity.header.priceBookId, entity.header.accountId, targetId);
            Map<Id, ProductService.ProductWrapper> productInformationMap = new Map<Id, ProductService.ProductWrapper>();
            for (ProductService.ProductWrapper pw : productInformationList) {
                productInformationMap.put(pw.priceBookEntry.Id, pw);
            }

            enrichLineItemsWithProductData(entity.lineItems, productInformationMap, type);
        }


        return entity;
    }

    /**
     * @description helper method to make sure that line items are enriched with their respective product information
     *
     * @param lineItems - target line items
     * @param productInformationMap - raw product information
     */
    /*private static void enrichLineItemsWithProductData(List<CPQ2_Wrapper.LineItem> lineItems, Map<Id, ProductService.ProductWrapper> productInformationMap) {
        enrichLineItemsWithProductData(lineItems, productInformationMap, CPQ2_Util.SOBJECT_NAME_OPP);
    }*/


    /**
     * @description helper method to make sure that line items are enriched with their respective product information
     *
     * @param lineItems - target line items
     * @param productInformationMap - raw product information
     * @param SObjectName - parent object SObject name
     */
    private static void enrichLineItemsWithProductData(List<CPQ2_Wrapper.LineItem> lineItems, Map<Id, ProductService.ProductWrapper> productInformationMap, String sObjectName) {
        for (CPQ2_Wrapper.LineItem li : lineItems) {
            if (productInformationMap.containsKey(li.pricebookEntryId)) {
                li.productInfo = productInformationMap.get(li.pricebookEntryId);

                if(sObjectName == CPQ2_Util.SOBJECT_NAME_OPP){
                    if (li.productInfo.priceBookEntry.Product2.Item_Type__c != CPQ2_Util.PRODUCT_TYPE_SERVICE) {
                        li.coreListPriceRequest.coreListPriceRequest.CPQ2_Product__c = li.productInfo.priceBookEntry.Product2Id;
                        li.coreListPriceRequest.coreListPriceRequest.CPQ2_Pricebook_Entry_Id__c = li.productInfo.priceBookEntry.Id;
                    }

                    if (li.productInfo.priceBookEntry.Product2.Item_Type__c == CPQ2_Util.PRODUCT_TYPE_CONSUMABLES) {
                        li.vmiRequest.vmiRequest.CPQ2_Product__c = li.productInfo.priceBookEntry.Product2Id;
                        li.vmiRequest.vmiRequest.CPQ2_Pricebook_Entry_Id__c = li.productInfo.priceBookEntry.Id;
                    }
                }
            }
        }
    }

    /**
     * @description creates a new line item with product information enriched
     *
     * @param productId - target product associated with the line item
     * @param pricebookId - target price book associated with the line item
     * @param targetId
     * @param accountId - account associated with the line item
     *
     * @return a "blank" line item associated with the proper product, pricebook and account
     */
    public static List<CPQ2_Wrapper.LineItem> getNewLineItem(Id productId, Id pricebookId, Id targetId, Id accountId, Integer quantity) {

        return getNewLineItems(new Set<Id>{
            productId
        }, pricebookId, targetId, accountId, quantity);
    }

    /**
     * @description create a new line item
     *
     * @param productIds - target product
     * @param pricebookId - target price book
     * @param targetId
     * @param accountId - target account
     *
     * @return new line item wrapper
     */
    public static List<CPQ2_Wrapper.LineItem> getNewLineItems(Set<Id> productIds, Id pricebookId, Id targetId, Id accountId, Integer quantity) {
        System.debug('*** ' + targetId);
        List<ProductService.ProductWrapper> productInformationList = ProductService.getProductInformationByIds(productIds, pricebookId, accountId, targetId);

        List<CPQ2_Wrapper.LineItem> resultList = new List<CPQ2_Wrapper.LineItem>();
        Map<Id, ProductService.ProductWrapper> mapProdToWrapper = new Map<Id, ProductService.ProductWrapper>();
        Map<Id, ProductService.ProductWrapper> mapPbeToWrapper = new Map<Id, ProductService.ProductWrapper>();
        for (ProductService.ProductWrapper wrapper : productInformationList) {
            mapProdToWrapper.put(wrapper.priceBookEntry.Product2Id, wrapper);
            mapPbeToWrapper.put(wrapper.priceBookEntry.Id, wrapper);
        }

        String type = targetId.getSObjectType().getDescribe().getName();

        for (Id prodId : productIds) {
            System.debug('***  mapProdToWrapper ' + mapProdToWrapper);
            System.debug('***  prodId ' + prodId);
            for(Integer i = 0; i < quantity; i++) {
                if (mapProdToWrapper.containsKey(prodId)) {

                    System.debug('***  FOUND! ' + prodId);
                    ProductService.ProductWrapper productWrapper = mapProdToWrapper.get(prodId);
    
                    if(type == CPQ2_Util.SOBJECT_NAME_OPP) {
                        OpportunityLineItem newOli = new OpportunityLineItem();
                        newOli.OpportunityId = targetId;
                        newOli.Product2Id = productWrapper.priceBookEntry.Product2Id;
                        newOli.PricebookEntryId = productWrapper.priceBookEntry.Id;
                        CPQ2_Wrapper.LineItem newLineItem = new CPQ2_Wrapper.LineItem(newOli, false, true);
                        resultList.add(newLineItem);
                    } else if (type == CPQ2_Util.SOBJECT_NAME_ORDER){
                        OrderItem newOrderItem = new OrderItem();
                        newOrderItem.OrderId = targetId;
                        newOrderItem.Product2Id = productWrapper.priceBookEntry.Product2Id;
                        newOrderItem.PricebookEntryId = productWrapper.priceBookEntry.Id;
                        newOrderItem.Active__c = true;
                        CPQ2_Wrapper.LineItem newLineItem = new CPQ2_Wrapper.LineItem(newOrderItem, false);
                        resultList.add(newLineItem);
                    }
                }
            }           
        }
        enrichLineItemsWithProductData(resultList, mapPbeToWrapper, type);
        return resultList;
    }

    /**
     * @description centralized logic to handle OLI trigger actions regarding CPQ2
     *
     * @param lineItems target lineItems that are being actioned
     * @param oldMap trigger.oldmap
     * @param action action the trigger is acting out
     */
    private static void opportunityLineItemTriggerActions(List<OpportunityLineItem> lineItems, Map<Id, OpportunityLineItem> oldMap, CPQ2_Util.DmlAction action) {

        List<OpportunityLineItem> eligibleLineItems = determineEligibleLineItems(lineItems, oldMap, action);

        if (!eligibleLineItems.isEmpty()) {
            // get all of the line items for the opportunities related to the target line items.
            //Map<Id, List<OpportunityLineItem>> opportunityToLineItemMap = CPQ2_Util.getOpportunityIdMapFromOli(eligibleLineItems);
            Map<Id, CPQ2_Wrapper.CpqEntity> entityMap = getReconciledEntityMap(eligibleLineItems, action);

            // CALCULATE
            CPQ2_ShipToCalculatorUtil.calculateShipToScore(entityMap.values());

            // stamp the Sobjects
            CPQ2_Wrapper.stampAllEntitySObjects(entityMap, true);

            // update parent objects
            CPQ2_Wrapper.saveAllRelatedHeaders(entityMap);
            CPQ2_Wrapper.saveAllRelatedAccounts(entityMap);
        }
    }


    /**
     * @description trigger hook for order item Insert
     *
     * @param newLineItems trigger.new
     */
    public static void handleBeforeInsertTrigger(List<OrderItem> newLineItems) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_ORDER_TRIGGER_NAME)) {
            CPQ2_Service.orderItemTriggerActions(newLineItems, null, CPQ2_Util.DmlAction.ACTION_CREATE);
        }
    }

    /**
     * @description trigger hook for order item Update
     *
     * @param editLineItems trigger.new
     * @param oldMap trigger.oldmap
     */
    public static void handleBeforeUpdateTrigger(List<OrderItem> editLineItems, Map<Id, OrderItem> oldMap) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_ORDER_TRIGGER_NAME)) {
            CPQ2_Service.orderItemTriggerActions(editLineItems, oldMap, CPQ2_Util.DmlAction.ACTION_UPDATE);
        }
    }


    /**
     * @description trigger hook for order Insert
     *
     * @param newLineItems trigger.new
     */
    public static void handleBeforeInsertTrigger(List<Order> newLineItems) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_ORDER_TRIGGER_NAME)) {
            CPQ2_Service.orderBeforeTriggerActions(newLineItems, null, CPQ2_Util.DmlAction.ACTION_CREATE);
        }
    }

    /**
     * @description trigger hook for order Update
     *
     * @param editLineItems trigger.new
     * @param oldMap trigger.oldmap
     */
    public static void handleBeforeUpdateTrigger(List<Order> editLineItems, Map<Id, Order> oldMap) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_ORDER_TRIGGER_NAME)) {
            CPQ2_Service.orderBeforeTriggerActions(editLineItems, oldMap, CPQ2_Util.DmlAction.ACTION_UPDATE);
        }
    }

    /**
     * @description trigger hook for order After Update
     *
     * @param editLineItems trigger.new
     * @param oldMap trigger.oldmap
     */
    public static void handleAfterUpdateTrigger(List<Order> editLineItems, Map<Id, Order> oldMap) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_ORDER_TRIGGER_NAME)) {
            CPQ2_Service.orderAfterUpdateTriggerActions(editLineItems, oldMap);
        }
    }


    /**
     * @description centralized logic to handle OLI trigger actions regarding CPQ2
     *
     * @param lineItems target lineItems that are being actioned
     * @param oldMap trigger.oldmap
     * @param action action the trigger is acting out
     */
    private static void orderItemTriggerActions(List<OrderItem> lineItems, Map<Id, OrderItem> oldMap, CPQ2_Util.DmlAction action) {

        List<OrderItem> eligibleLineItems = determineEligibleLineItems(lineItems, oldMap, action);
        
        if (!eligibleLineItems.isEmpty()) {
            // get all of the line items for the opportunities related to the target line items.
            //Map<Id, List<OrderItem>> orderToLineItemMap = CPQ2_Util.getOrderIdMapFromOrderItems(eligibleLineItems);
            Map<Id, CPQ2_Wrapper.CpqEntity> entityMap = getReconciledEntityMap(eligibleLineItems, oldMap, action);

            // CALCULATE
            CPQ2_ShipToCalculatorUtil.calculateShipToScore(entityMap.values());

            // stamp the Sobjects
            CPQ2_Wrapper.stampAllEntitySObjects(entityMap, true);

            // update parent objects
            CPQ2_Wrapper.saveAllRelatedHeaders(entityMap);
            //CPQ2_Wrapper.saveAllRelatedAccounts(entityMap);
        }

    }

    private static void orderBeforeTriggerActions(List<Order> orders, Map<Id, Order> oldMap, CPQ2_Util.DmlAction action){

        for (Order order : orders) {

            // check to see if the order is active
            if (action == CPQ2_Util.DmlAction.ACTION_CREATE || action == CPQ2_Util.DmlAction.ACTION_UPDATE) {

                order.CPQ2_Include_in_Price_Model__c = false;
                if ((order.EffectiveDate == null || order.EffectiveDate <= Date.today()) &&
                    (order.EndDate == null || order.EndDate >= Date.today()) &&
                    (order.CPQ2_HC__c > 0)) {
                    order.CPQ2_Include_in_Price_Model__c = true;

                }
                System.debug('SET PRICE MODEL FLAG*** ' + order.Id + ' -- ' + order.CPQ2_Include_in_Price_Model__c);
            }
            
            //CPQCN:570 -- Special case set price model to true
            if(Order.CPQ2_TAR__c==0 && Order.CPQ2_TAC__c==0 && order.CPQ2_HF__c==0){
                order.CPQ2_Include_in_Price_Model__c = true;
            }

            // check to see if the order is seasonal
            if (action == CPQ2_Util.DmlAction.ACTION_CREATE || action == CPQ2_Util.DmlAction.ACTION_UPDATE) {

                order.CPQ2_Seasonal__c = false;
                if ((order.SeasonStartMonthValue__c != null) &&
                    (order.SeasonEndMonthValue__c !=null) &&
                    (order.CPQ2_HC__c > 0)) {
                    order.CPQ2_Seasonal__c = true;
                }
                System.debug('SET SEASONAL FLAG*** ' + order.Id + ' -- ' + order.CPQ2_Seasonal__c);
            }

        }

    }

    private static void orderAfterUpdateTriggerActions(List<Order> orders, Map<Id, Order> oldMap){

        Set<Id> orderIdSet = new Set<Id>();

        for (Order order : orders) {
            if (order.CPQ2_Include_in_Price_Model__c != oldMap.get(order.Id).CPQ2_Include_in_Price_Model__c) {
                orderIdSet.add(order.Id);
            }

            if (order.CPQ2_Seasonal__c != oldMap.get(order.Id).CPQ2_Seasonal__c) {
                orderIdSet.add(order.Id);
            }

            if (order.CPQ2_TAR__c != oldMap.get(order.Id).CPQ2_TAR__c ||
                order.CPQ2_TAC__c != oldMap.get(order.Id).CPQ2_TAC__c ||
                order.CPQ2_HF__c != oldMap.get(order.Id).CPQ2_HF__c){
                orderIdSet.add(order.Id);
            }
            //CPQCN:570 
            if(Order.CPQ2_TAR__c==0 && Order.CPQ2_TAC__c==0 && order.CPQ2_HF__c==0){
                orderIdSet.add(order.Id);
            }
        }

        System.debug('~~~!!' + orderIdSet);
        if(!orderIdSet.isEmpty()){
            Map<Id, CPQ2_Wrapper.CpqEntity> entityMap = getHeadersAndLineItemsMap(orderIdSet, true);

            // CALCULATE!!!!!
            CPQ2_ShipToCalculatorUtil.calculateShipToScoreForOrder(entityMap.values());

            // stamp the Sobjects
            CPQ2_Wrapper.stampAllEntitySObjects(entityMap, true);

            // stamp the Sobjects
            CPQ2_Wrapper.saveAllRelatedAccounts(entityMap);
        }
    }

    /**
     * @description obtains all of the entities involved with the line items and performs a merge with the items being introduced.
     *              the point of this merge is to stage the data and identify the proper edits and deletes so that the calculator can work on an accurate
     *              representation of the entities. Eg. Add the new items to an entity in the case of an insert, or remove the item in the case of a delete.
     *
     * @param eligibleLineItems - the line items presented in the context of the action.
     * @param action - the DML action
     *
     * @return map of resulting entities after being merged with the input line items.
     */
    private static Map<Id, CPQ2_Wrapper.CpqEntity> getReconciledEntityMap(List<OpportunityLineItem> eligibleLineItems, CPQ2_Util.DmlAction action) {
        // get all of the line items for the opportunities related to the target line items.
        Map<Id, List<OpportunityLineItem>> opportunityToLineItemMap = CPQ2_Util.getOpportunityIdMapFromOli(eligibleLineItems);
        Map<Id, CPQ2_Wrapper.CpqEntity> entityMap = CPQ2_Service.getHeadersAndLineItemsMap(opportunityToLineItemMap.keySet(), true);

        // make sure that all of the entity line items are updated with the new trigger values
        for (Id key : opportunityToLineItemMap.keySet()) {
            if (entityMap.containsKey(key)) {
                if (action == CPQ2_Util.DmlAction.ACTION_CREATE || action == CPQ2_Util.DmlAction.ACTION_UPDATE) {
                    entityMap.get(key).reconcile(opportunityToLineItemMap.get(key));
                } else if (action == CPQ2_Util.DmlAction.ACTION_DELETE) {
                    entityMap.get(key).remove(opportunityToLineItemMap.get(key));
                }

            }
        }

        return entityMap;
    }

    /**
     * @description obtains all of the entities involved with the line items and performs a merge with the items being introduced.
     *              the point of this merge is to stage the data and identify the proper edits and deletes so that the calculator can work on an accurate
     *              representation of the entities. Eg. Add the new items to an entity in the case of an insert, or remove the item in the case of a delete.
     *
     * @param eligibleLineItems - the line items presented in the context of the action.
     * @param oldMap - trigger oldMap
     * @param action - the DML action
     *
     * @return map of resulting entities after being merged with the input line items.
     */
    private static Map<Id, CPQ2_Wrapper.CpqEntity> getReconciledEntityMap(List<OrderItem> eligibleLineItems, Map<Id, OrderItem> oldMap, CPQ2_Util.DmlAction action) {
        // get all of the line items for the opportunities related to the target line items.
        Set<Id> ordersInvolvedInCalculations = new Set<Id>();
        Map<Id, List<OrderItem>> orderToLineItemMap = CPQ2_Util.getOrderIdMapFromOrderItems(eligibleLineItems);
        ordersInvolvedInCalculations.addAll(orderToLineItemMap.keySet());

//      Map<Id, List<OrderItem>> orderToLineItemThatMovedMap = new Map<Id, List<OrderItem>>();
//      if(action == CPQ2_Util.DmlAction.ACTION_UPDATE){
//          orderToLineItemThatMovedMap = mapOrdersThatNeedToBeRemoved(eligibleLineItems, oldMap);
//          ordersInvolvedInCalculations.addAll(orderToLineItemThatMovedMap.keySet());
//      }

        Map<Id, CPQ2_Wrapper.CpqEntity> entityMap = CPQ2_Service.getHeadersAndLineItemsMap(ordersInvolvedInCalculations, true);

        // make sure that all of the entity line items are updated with the new trigger values
        for (Id key : orderToLineItemMap.keySet()) {
            if (entityMap.containsKey(key)) {
                if (action == CPQ2_Util.DmlAction.ACTION_CREATE || action == CPQ2_Util.DmlAction.ACTION_UPDATE) {
                    entityMap.get(key).reconcile(orderToLineItemMap.get(key));
                } else if (action == CPQ2_Util.DmlAction.ACTION_DELETE) {
                    entityMap.get(key).remove(orderToLineItemMap.get(key));
                }
            }
        }

//      // remove all the entities that moved to new orders from their original orders
//      if(action == CPQ2_Util.DmlAction.ACTION_UPDATE){
//          for (Id key : orderToLineItemThatMovedMap.keySet()) {
//              if (entityMap.containsKey(key)) {
//                  entityMap.get(key).remove(orderToLineItemThatMovedMap.get(key));
//              }
//          }
//      }

        return entityMap;
    }

//  /**
//   * @description determine a map of order Id-->order items where order items has been moved to another order
//   *
//   * @param eligibleLineItems list of order items
//   * @param oldMap order item old map used for the comparison
//   *
//   * @return map of order Id-->order items where order items has been moved to another order
//   */
//  private static Map<Id, List<OrderItem>> mapOrdersThatNeedToBeRemoved(List<OrderItem> eligibleLineItems, Map<Id, OrderItem> oldMap){
//      Map<Id, List<OrderItem>> orderToLineItemMap = new Map<Id, List<OrderItem>>();
//
//      if(oldMap != null){
//          for(OrderItem orderItem: eligibleLineItems){
//              Id oldOrderId = oldMap.get(orderItem.Id).OrderId;
//              if(orderItem.OrderId != oldOrderId){
//                  if(!orderToLineItemMap.containsKey(oldOrderId)){
//                      orderToLineItemMap.put(oldOrderId, new List<OrderItem>());
//                  }
//
//                  orderToLineItemMap.get(oldOrderId).add(orderItem);
//              }
//          }
//      }
//
//      return orderToLineItemMap;
//  }


    /**
     * @description determines when lineitems are needed for recalculation of ship to score
     *
     * @param lineItems - line items to check
     * @param oldMap - old map in case of update
     * @param action - denotes DML action occurring.
     *
     * @return list of line items that would trigger a ship to score calculation
     */
    private static List<OrderItem> determineEligibleLineItems(List<OrderItem> lineItems, Map<Id, OrderItem> oldMap, CPQ2_Util.DmlAction action) {

        List<OrderItem> eligibleLineItems = new List<OrderItem>();

        // get all applicable productIds
        Map<Id, Product2> product2Map = ProductService.getProduct2MapByIdsFilteredByModel(CPQ2_Util.PRICE_MODEL_HYGIENE);

        //only look at line items that can be calculated - useful in preventing the calculator is not executed several times
        for (OrderItem orderItem : lineItems) {
            if (product2Map.containsKey(orderItem.Product2Id)) {
                if (action == CPQ2_Util.DmlAction.ACTION_CREATE
                    && orderItem.Service_Price_Per_Unit__c != null
                    && orderItem.Frequency__c != null
                    && orderItem.Quantity != null) {

                    eligibleLineItems.add(orderItem);
                } else if (action == CPQ2_Util.DmlAction.ACTION_UPDATE
                    && ((orderItem.Service_Price_Per_Unit__c != oldMap.get(orderItem.Id).Service_Price_Per_Unit__c
                    || orderItem.Active__c != oldMap.get(orderItem.Id).Active__c
                    || orderItem.Frequency__c != oldMap.get(orderItem.Id).Frequency__c
                    || orderItem.Quantity != oldMap.get(orderItem.Id).Quantity)
                    || (orderItem.Frequency__c != 'One-Time' && (orderItem.CPQ2_Material_Cost__c == null
                    || orderItem.CPQ2_Duration_In_Minutes__c == null
                    || orderItem.CPQ2_Average_Cost_Minute__c == null
                    || orderItem.CPQ2_Number_Of_Visits_Per_Year__c == null)))) {
                    eligibleLineItems.add(orderItem);
                } else if (action == CPQ2_Util.DmlAction.ACTION_DELETE) {
                    eligibleLineItems.add(orderItem);
                }
            } else {
                if (action == CPQ2_Util.DmlAction.ACTION_CREATE
                    && orderItem.Purchase_Price__c != null) {
                    eligibleLineItems.add(orderItem);
                } else if (action == CPQ2_Util.DmlAction.ACTION_UPDATE
                    && (orderItem.Purchase_Price__c != oldMap.get(orderItem.Id).Purchase_Price__c)) {
                    eligibleLineItems.add(orderItem);
                }
            }
        }
        return eligibleLineItems;
    }



    /**
     * @description determines when lineitems are needed for recalculation of ship to score
     *
     * @param lineItems - line items to check
     * @param oldMap - old map in case of update
     * @param action - denotes DML action occurring.
     *
     * @return list of line items that would trigger a ship to score calculation
     */
    private static List<OpportunityLineItem> determineEligibleLineItems(List<OpportunityLineItem> lineItems, Map<Id, OpportunityLineItem> oldMap, CPQ2_Util.DmlAction action) {
        List<OpportunityLineItem> eligibleLineItems = new List<OpportunityLineItem>();

        // get all applicable productIds
        Map<Id, Product2> product2Map = ProductService.getProduct2MapByIdsFilteredByModel(CPQ2_Util.PRICE_MODEL_HYGIENE);



        //only look at line items that can be calculated - useful in preventing the calculator is not executed several times
        for (OpportunityLineItem oli : lineItems) {
            if (product2Map.containsKey(oli.Product2Id)) {
                if (action == CPQ2_Util.DmlAction.ACTION_CREATE
                    && oli.Service_Price_Per_Unit__c != null
                    && oli.Service_Frequency__c != null
                    && oli.Service_Frequency__c != 'One-Time'
                    && oli.Quantity != null) {
                    eligibleLineItems.add(oli);
                } else if (action == CPQ2_Util.DmlAction.ACTION_UPDATE
                    && ((oli.Service_Price_Per_Unit__c != oldMap.get(oli.Id).Service_Price_Per_Unit__c
                    || oli.Service_Frequency__c != oldMap.get(oli.Id).Service_Frequency__c
                    || oli.Quantity != oldMap.get(oli.Id).Quantity)
                    || (oli.Service_Frequency__c != 'One-Time' && (oli.CPQ2_Material_Cost__c == null
                    || oli.CPQ2_Duration_In_Minutes__c == null
                    || oli.CPQ2_Average_Cost_Minute__c == null
                    || oli.CPQ2_Number_Of_Visits_Per_Year__c == null)))) {
                    eligibleLineItems.add(oli);
                } else if (action == CPQ2_Util.DmlAction.ACTION_DELETE) {
                    eligibleLineItems.add(oli);
                }
            } else {
                if (action == CPQ2_Util.DmlAction.ACTION_CREATE
                    && oli.Purchase_Price__c != null) {
                    eligibleLineItems.add(oli);
                } else if (action == CPQ2_Util.DmlAction.ACTION_UPDATE
                    && (oli.Purchase_Price__c != oldMap.get(oli.Id).Purchase_Price__c)) {
                    eligibleLineItems.add(oli);
                }
            }
        }
        return eligibleLineItems;
    }


    /**
     * @description help determine if trigger is active
     *
     * @param triggerName name of the service to check
     *
     * @return if the service is active
     */
    private static Boolean runTriggerHelper(String triggerName) {
        if (triggerName == CPQ2_Util.SERVICE_OPP_TRIGGER_NAME) {
            return (CustomSettingsService.getServiceSettingActive(triggerName) && isOppServiceActive);
        } else if (triggerName == CPQ2_Util.SERVICE_ORDER_TRIGGER_NAME) {
            return (CustomSettingsService.getServiceSettingActive(triggerName) && isOrderServiceActive);
        } else if (triggerName == CPQ2_Util.SERVICE_QUOTE_TRIGGER_NAME) {
            return (CustomSettingsService.getServiceSettingActive(triggerName) && isQuoteServiceActive);
        } else {
            return true;
        }
    }

    /**
     * @description trigger hook for OLI Insert
     *
     * @param newLineItems trigger.new
     */
    public static void handleBeforeInsertTrigger(List<OpportunityLineItem> newLineItems) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_OPP_TRIGGER_NAME)) {
            System.debug('RUN OPP TRIGGER');
            CPQ2_Service.opportunityLineItemTriggerActions(newLineItems, null, CPQ2_Util.DmlAction.ACTION_CREATE);
        }
    }

    /**
     * @description trigger hook for OLI Update
     *
     * @param editLineItems trigger.new
     * @param oldMap trigger.oldmap
     */
    public static void handleBeforeUpdateTrigger(List<OpportunityLineItem> editLineItems, Map<Id, OpportunityLineItem> oldMap) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_OPP_TRIGGER_NAME)) {
            System.debug('RUN OPP TRIGGER');
            CPQ2_Service.opportunityLineItemTriggerActions(editLineItems, oldMap, CPQ2_Util.DmlAction.ACTION_UPDATE);
        }
    }

    /**
     * @description trigger hook for OLI Delete
     *
     * @param oldLineItem trigger.old
     */
    public static void handleBeforeDeleteTrigger(List<OpportunityLineItem> oldLineItem) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_OPP_TRIGGER_NAME)) {
            System.debug('RUN OPP TRIGGER');
            CPQ2_Service.opportunityLineItemTriggerActions(oldLineItem, null, CPQ2_Util.DmlAction.ACTION_DELETE);
        }
    }

    /**
     * @description perform save operation on list of line items. Will perform delete, create and update
     *
     * @param saveItems - target line items
     *
     * @return DML results in wrappers
     */
    public static List<CPQ2_Wrapper.DmlResult> saveChanges(List<CPQ2_Wrapper.LineItem> saveItems) {
        List<CPQ2_Wrapper.DmlResult> dmlResults = new List<CPQ2_Wrapper.DmlResult>();

        // Rollback progress IF something fails
        Savepoint sp = Database.setSavepoint();

        // turn off the CPQ2 trigger services here because the calculations will be redundant
        CPQ2_Service.isOppServiceActive = false;
        CPQ2_Service.isOrderServiceActive = false;

        try {
            System.debug('Sanchivan saveItems: ' + saveItems.size());
            //CPQCN-495 2020-12-20 Darcy turning this on to run opportunityLineItemTriggerActions when opp line is deleted
            CPQ2_Service.isOppServiceActive = true;
            dmlResults.addAll(handleDml(saveItems, CPQ2_Util.DmlAction.ACTION_DELETE));

            // turn on the CPQ2 trigger services here because the final calculations will be made
            //CPQ2_Service.isOppServiceActive = true;
            CPQ2_Service.isOrderServiceActive = true;
            dmlResults.addAll(handleDml(saveItems, CPQ2_Util.DmlAction.ACTION_CREATE));

            updateLineItemIds(saveItems);
            dmlResults.addAll(handleDml(saveItems, CPQ2_Util.DmlAction.ACTION_UPDATE));
        } catch (Exception e) {
            throw e;
        }

        for (CPQ2_Wrapper.DmlResult result : dmlResults) {
            if (!result.isSuccess) {
                System.debug('Sanchivan result: ' + result);
                Database.rollback(sp);
                break;
            }
        }

        return dmlResults;
    }

    /**
     * @description helper method to update line items after an insert
     *
     * @param saveItems - line items to update
     */
    private static void updateLineItemIds(List<CPQ2_Wrapper.LineItem> saveItems) {
        for (CPQ2_Wrapper.LineItem li : saveItems) {
            if (li.id == null) {
                if (li.opportunityLineItem != null) {
                    li.id = li.opportunityLineItem.Id;
                } else {
                    li.id = li.orderItem.Id;
                }
            }
        }
    }

    /**
     * @description helper method to handle a DML action on line items
     *
     * @param saveItems - target line items
     * @param action - target action
     *
     * @return DML results in wrappers
     */
    private static List<CPQ2_Wrapper.DmlResult> handleDml(List<CPQ2_Wrapper.LineItem> saveItems, CPQ2_Util.DmlAction action) {

        List<CPQ2_Wrapper.DmlResult> dmlResults = new List<CPQ2_Wrapper.DmlResult>();
        List<CPQ2_Wrapper.LineItem> dmlList = CPQ2_Wrapper.getDmlListLineItems(saveItems, action);
        List<CPQ2_Wrapper.VmiRequest> vmiRequestDmlList = CPQ2_Wrapper.getDmlListVmi(saveItems, action);
        List<CPQ2_Wrapper.CoreListPriceRequest> clpRequestDmlList = CPQ2_Wrapper.getDmlListCoreListRequest(saveItems, action);
        System.debug('Sanchivan handleDml action : ' + action);
        System.debug('Sanchivan handleDml dmlList: ' + dmlList);
        System.debug('Sanchivan handleDml vmiRequestDmlList: ' + vmiRequestDmlList);
        System.debug('Sanchivan handleDml clpRequestDmlList: ' + clpRequestDmlList);

        dmlResults.addAll(CPQ2_Wrapper.handleBaseItemDML(dmlList, action));
        dmlResults.addAll(CPQ2_Wrapper.handleBaseItemDML(vmiRequestDmlList, action));
        dmlResults.addAll(CPQ2_Wrapper.handleBaseItemDML(clpRequestDmlList, action));
        System.debug('Sanchivan dmlResults: ' + dmlResults);
        return dmlResults;
    }

    /**
     * @description populates Core List Price requests with their corresponding VMI requests
     *
     * @param listCoreListPriceRequests - target core list price requests
     */
    public static void updateCoreListPriceWithVMI(List<CPQ2_Core_List_Price_Request__c> listCoreListPriceRequests) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_OPP_TRIGGER_NAME)) {
            Set<Id> opportunitySet = new Set<Id>();
            for (CPQ2_Core_List_Price_Request__c clpr : listCoreListPriceRequests) {
                opportunitySet.add(clpr.CPQ2_Opportunity__c);
            }

            // find all the VMIs and map them to the core list price requests
            Map<Id, Map<Id, CPQ2_VMI_Request__c>> vmiMapByOpp = OpportunityService.getVmiRequestsByOpportunityIds(opportunitySet);
            for (CPQ2_Core_List_Price_Request__c clpr : listCoreListPriceRequests) {
                if (vmiMapByOpp.containsKey(clpr.CPQ2_Opportunity__c)) {
                    Map<Id, CPQ2_VMI_Request__c> mapProdToVmi = vmiMapByOpp.get(clpr.CPQ2_Opportunity__c);
                    if (mapProdToVmi.containsKey(clpr.CPQ2_Product__c)) {
                        clpr.CPQ2_VMI_Request__c = mapProdToVmi.get(clpr.CPQ2_Product__c).Id;
                        clpr.CPQ2_Is_VMI__c = true;
                    } else {
                        clpr.CPQ2_VMI_Request__c = null;
                        clpr.CPQ2_Is_VMI__c = false;
                    }
                }
            }
        }

    }

    /**
     * @description populates Core List Price requests with their corresponding VMI requests
     *
     * @param listVmi - list of VMI requests
     * @param action - DML action on VMI requests
     */
    public static void updateCoreListPriceWithVMI(List<CPQ2_VMI_Request__c> listVmi, CPQ2_Util.DmlAction action) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_OPP_TRIGGER_NAME)) {
            Set<Id> opportunitySet = new Set<Id>();
            for (CPQ2_VMI_Request__c vmiRequest : listVmi) {
                opportunitySet.add(vmiRequest.CPQ2_Opportunity__c);
            }

            // find all the VMIs and map them to the core list price requests
            List<CPQ2_Core_List_Price_Request__c> listClprToUpdate = new List<CPQ2_Core_List_Price_Request__c>();

            Map<Id, Map<Id, CPQ2_Core_List_Price_Request__c>> mapOppToClpr = OpportunityService.getContractPriceRequestByOpportunityIds(opportunitySet);
            for (CPQ2_VMI_Request__c vmiRequest : listVmi) {
                if (mapOppToClpr.containsKey(vmiRequest.CPQ2_Opportunity__c)) {
                    Map<Id, CPQ2_Core_List_Price_Request__c> mapProdToClpr = mapOppToClpr.get(vmiRequest.CPQ2_Opportunity__c);
                    if (mapProdToClpr.containsKey(vmiRequest.CPQ2_Product__c)) {
                        listClprToUpdate.add(mapProdToClpr.get(vmiRequest.CPQ2_Product__c));
                        if (action == CPQ2_Util.DmlAction.ACTION_DELETE) {
                            mapProdToClpr.get(vmiRequest.CPQ2_Product__c).CPQ2_VMI_Request__c = null;
                            mapProdToClpr.get(vmiRequest.CPQ2_Product__c).CPQ2_Is_VMI__c = false;
                        } else {
                            mapProdToClpr.get(vmiRequest.CPQ2_Product__c).CPQ2_VMI_Request__c = vmiRequest.Id;
                            mapProdToClpr.get(vmiRequest.CPQ2_Product__c).CPQ2_Is_VMI__c = true;
                        }

                    }
                }
            }

            if (!listClprToUpdate.isEmpty()) {
                OpportunityService.updateCoreListPriceRequest(listClprToUpdate, true);
            }
        }

    }

    /**
     * @description determines the threshold level breached on a core list price request and stamps them
     *
     * @param listCoreListPriceRequests - target core list price requests to evaluate
     */
    public static void evaluateCoreListPriceRequest(List<CPQ2_Core_List_Price_Request__c> listCoreListPriceRequests) {
        Set<Id> setPbeIds = new Set<Id>();

        for (CPQ2_Core_List_Price_Request__c clpr : listCoreListPriceRequests) {
            setPbeIds.add(clpr.CPQ2_Pricebook_Entry_Id__c);
        }
        
        Map<Id, PricebookEntry> priceBookEntryMapByIds = ProductService.getPriceBookEntryMapByIds(setPbeIds);

        for (CPQ2_Core_List_Price_Request__c clpr : listCoreListPriceRequests) {

            Integer thresholdLevel = 1;
        
            System.debug('Approved Core List Price~~' + clpr.CPQ2_Approved_Core_List_Price__c);
            if(clpr.CPQ2_Requested_Price__c >= clpr.CPQ2_Approved_Core_List_Price__c){
                thresholdLevel = 0;
            } else {
                if (priceBookEntryMapByIds.containsKey(clpr.CPQ2_Pricebook_Entry_Id__c)) {
                    PricebookEntry pbe = priceBookEntryMapByIds.get(clpr.CPQ2_Pricebook_Entry_Id__c);

                    // calculate margin
                    Decimal totalRevenue = clpr.CPQ2_Requested_Price__c;
                    Decimal totalCost = pbe.CPQ2_Total_Cost__c;
                    Decimal denominator = (totalRevenue == null || totalRevenue == 0) ? 1 : totalRevenue;
                    Decimal grossMargin = (totalRevenue - totalCost) / denominator;

                    if (pbe.Product2.Item_Type__c == CPQ2_Util.PRODUCT_TYPE_EQUIPMENT) {
                        thresholdLevel = 1;
                    } else {
                        // perform evaluation
                        if (clpr.CPQ2_Requested_Price__c < pbe.UnitPrice) {
                            //CPQCN-513 2020-12-22 Darcy: if either margin thresholds are null you need appoval to set a price below list
                            if (clpr.CPQ2_Is_VMI__c ||pbe.CPQ2_Margin_Threshold__c == null || pbe.CPQ2_Margin_Threshold_2__c == null) {
                                thresholdLevel = 2;
                            } else { 
                                //if (grossMargin >= (pbe.CPQ2_Margin_Threshold__c == null ? 0:pbe.CPQ2_Margin_Threshold__c)/100) {
                                if (grossMargin >= pbe.CPQ2_Margin_Threshold__c / 100) {
                                    thresholdLevel = 0;
                                //} else if (grossMargin >= (pbe.CPQ2_Margin_Threshold_2__c == null ? 0:pbe.CPQ2_Margin_Threshold_2__c)/100)  {
                                } else if (grossMargin >= pbe.CPQ2_Margin_Threshold_2__c / 100) {    
                                    thresholdLevel = 1;
                                } else {
                                    thresholdLevel = 2;
                                }
                            }
                        } else {
                            thresholdLevel = 0;
                        }
                    }
                    
                    clpr.CPQ2_Line_Margin_Contract_Price__c = grossMargin;
                }
            }

            clpr.CPQ2_Threshold_Triggered__c = thresholdLevel;
        }
    }

    /**
     * @description helper method to get bill to's contract or create one if it does not exist
     *
     * @param mapParentIdToShipTo - map of parent accounts to ship to
     * @param shipToToOpp - map from ship to account to opp
     *
     * @return map of bill to id --> contract
     */
    private static Map<Id, Contract> getAndCreateContracts(Map<Id, Id> mapParentIdToShipTo, Map<Id, Opportunity> shipToToOpp) {

        Map<Id, Contract> mapContract = ContractService.getContractsByAccountIds(mapParentIdToShipTo.keySet());
        Map<Id, Contract> mapParentAccountToContract = new Map<Id, Contract>();

        for (Contract c : mapContract.values()) {
            mapParentAccountToContract.put(c.AccountId, c);
        }

        //check to see all the accounts have a contract, and if they don't create that contract.
        Set<Id> setMissingParentIds = mapParentIdToShipTo.keySet().clone();
        setMissingParentIds.removeAll(mapParentAccountToContract.keySet());

        List<Contract> contractsToCreate = new List<Contract>();
        for (Id parentId : setMissingParentIds) {
            Opportunity opp = shipToToOpp.get(mapParentIdToShipTo.get(parentId));
            Contract newContract = ContractService.createNewContract(parentId, Date.today(), 12);
            //Shashi: 2020-11-11 : AccountId = Null check
            if(newContract.AccountId!=null){
                mapParentAccountToContract.put(parentId, newContract);
                contractsToCreate.add(newContract);
            }
        }

        System.debug('## Contracts to Create' + contractsToCreate);
        ContractService.insertContracts(contractsToCreate, true);

        // we cannot create a contract in the "Active" state. So we have to do another update to set the correct status.
        for(Contract contract: contractsToCreate){
            contract.Status = 'Activated';
        }
        ContractService.updateContracts(contractsToCreate, true);


        return mapParentAccountToContract;
    }

    /**
     * @description helper method to create contract prices
     *
     * @param opportunityMap - opportunity map
     * @param accountMap - account map
     * @param mapParentAccountToContract - bill to --> contract map
     */
    private static void createContractPrices(Map<Id, Opportunity> opportunityMap, Map<Id, Account> accountMap, Map<Id, Contract> mapParentAccountToContract) {
        List<CPQ2_ContractPrice__c> listContractPriceToCreate = new List<CPQ2_ContractPrice__c>();
        Set<Id> missingContractIds = new Set<Id>();
        List<Case> listCoreListPriceTicket = new List<Case>();

        Map<Id, Map<Id, CPQ2_Core_List_Price_Request__c>> mapOppToCoreListPricesMap = OpportunityService.getContractPriceRequestByOpportunityIds(opportunityMap.keySet());
        for (Opportunity opp : opportunityMap.values()) {
            if (mapOppToCoreListPricesMap.containsKey(opp.Id)) {
                Map<Id, CPQ2_Core_List_Price_Request__c> mapCoreListPrice = mapOppToCoreListPricesMap.get(opp.Id);

                for (CPQ2_Core_List_Price_Request__c clpr : mapCoreListPrice.values()) {

                    Id contractId;
                    //map the contract
                    if (accountMap.containsKey(opp.AccountId)) {
                        Account shipTo = accountMap.get(opp.AccountId);
                        if (mapParentAccountToContract.containsKey(shipTo.ParentId)) {
                            contractId = mapParentAccountToContract.get(shipTo.ParentId).Id;
                        }
                    }
					System.debug('~~Contractid~~' + contractId);
                    //CPQCN-510:Shashi:2020-12-18: Core List Price Ticket 
                    if(contractId==null){
                        missingContractIds.add(opp.Id);
                    }
                    if(contractId!=null){
                        CPQ2_ContractPrice__c contractPrice = ContractService.createNewContractPrice(clpr.CPQ2_Product__c, clpr.CPQ2_Requested_Price__c, contractId);
                        listContractPriceToCreate.add(contractPrice);
                    }
                }
            }
        }

        if(listContractPriceToCreate.size()>0){
        	ContractService.insertContractPrices(listContractPriceToCreate, true);
        }
        
        //Begin:CPQCN-510:Shashi:2020-12-18: Core List Price Ticket 
        for(Id opp_id : missingContractIds){
            Field_Service_Settings__c dataSets = Field_Service_Settings__c.getOrgDefaults();
            Case csCoreList = new Case();
            csCoreList.RecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByDeveloperName().get('Core_List_Pricing_Change_Request').getRecordTypeId();
            if(opportunityMap.containsKey(opp_id)){
            	csCoreList.AccountId = opportunityMap.get(opp_id).AccountId;
                csCoreList.Opportunity__c = opp_id;
                csCoreList.Status = 'New';
                csCoreList.Subject = 'Core List Price Request for ' + opportunityMap.get(opp_id).Name;
                csCoreList.Type = 'Create Core List pricing at Ship-To';
                csCoreList.OwnerId = dataSets.Finance_Master_Data_Queue__c;
                listCoreListPriceTicket.add(csCoreList);
            }
        }
        if(listCoreListPriceTicket.size()>0){
            insert listCoreListPriceTicket;
        }
        //End
    }

    /**
     * @description helper method to convert opportunity's corelist price request to contract
     *
     * @param targetOpportunities - list of opportunities whose core list prices need to be converted
     */
    private static void convertCoreListPriceRequests(List<Opportunity> targetOpportunities) {
        Map<Id, Opportunity> opportunityMap = new Map<Id, Opportunity>(targetOpportunities);
        Map<Id, Opportunity> shipToToOpp = new Map<Id, Opportunity>();

        for (Opportunity opp : opportunityMap.values()) {
            shipToToOpp.put(opp.AccountId, opp);
        }

        Map<Id, Account> accountMap = AccountService.getAccountMapByIds(shipToToOpp.keySet());

        Map<Id, Id> setParentIdToShipTo = new Map<Id, Id>();
        for (Account account : accountMap.values()) {
            setParentIdToShipTo.put(account.ParentId, account.Id);
        }

        Map<Id, Contract> mapParentAccountToContract = getAndCreateContracts(setParentIdToShipTo, shipToToOpp);
        createContractPrices(opportunityMap, accountMap, mapParentAccountToContract);
    }

    /**
     * @description helper method to convert opportunity's vmi request to contract
     *
     * @param targetOpportunities - list of opportunities whose vmi need to be converted
     */
    private static void convertVmiRequest(List<Opportunity> targetOpportunities) {
        Map<Id, Opportunity> opportunityMap = new Map<Id, Opportunity>(targetOpportunities);
        Set<Id> setAccountIds = new Set<Id>();
        for (Opportunity opp : targetOpportunities) {
            setAccountIds.add(opp.AccountId);
        }

        Map<Id, Map<Id, CPQ2_VMI_Request__c>> opportunityToVmiRequests = OpportunityService.getVmiRequestsByOpportunityIds(opportunityMap.keySet());
        Map<Id, Map<Id, VMI_Product__c>> opportunityToExistingVmi = VmiService.getProductToVmiMapByAccountId(setAccountIds);

        List<VMI_Product__c> listVmiToInsert = new List<VMI_Product__c>();
        List<VMI_Product__c> listVmiToUpdate = new List<VMI_Product__c>();

        for (Opportunity opp : opportunityMap.values()) {
            if (opportunityToVmiRequests.containsKey(opp.Id)) {
                for (CPQ2_VMI_Request__c vmiRequest : opportunityToVmiRequests.get(opp.Id).values()) {
                    Boolean isVmiFound = false;

                    if (opportunityToExistingVmi.containsKey(opp.AccountId)) {
                        Map<Id, VMI_Product__c> mapProductToExistingVmi = opportunityToExistingVmi.get(opp.AccountId);
                        if (mapProductToExistingVmi.containsKey(vmiRequest.CPQ2_Product__c)) {
                            VMI_Product__c vmiToUpdate = mapProductToExistingVmi.get(vmiRequest.CPQ2_Product__c);
                            vmiToUpdate.Par_Level__c = vmiRequest.CPQ2_Par_Level__c;
                            isVmiFound = true;
                            listVmiToUpdate.add(vmiToUpdate);
                        }
                    }

                    if (!isVmiFound) {
                        VMI_Product__c vmi = new VMI_Product__c();
                        vmi.Account__c = opp.AccountId;
                        vmi.Product__c = vmiRequest.CPQ2_Product__c;
                        vmi.Par_Level__c = vmiRequest.CPQ2_Par_Level__c;
                        listVmiToInsert.add(vmi);
                    }
                }
            }
        }

        VmiService.insertVmiProduct(listVmiToInsert, true);
        VmiService.updateVmiProduct(listVmiToUpdate, true);
    }

    /**
     * @description convert all of an opportunities core list prices into contract prices
     *
     * @param listNew - opportunity trigger.new
     * @param mapOld - opportunity trigger.oldMap
     */
    public static void convertOpportunityCoreListPriceRequests(List<Opportunity> listNew, Map<Id, Opportunity> mapOld) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_OPP_TRIGGER_NAME)) {
            if (!(listNew == null) && !(mapOld == null)) {
                List<Opportunity> oppToConvert = new List<Opportunity>();

                for (Opportunity opp : listNew) {
                    if(opp.StageName == 'Signed' && opp.StageName != mapOld.get(opp.Id).StageName ){
                    //if (opp.CPQ2_Test_Switch_Convert_Opp__c &&
                    //  (opp.CPQ2_Test_Switch_Convert_Opp__c != mapOld.get(opp.Id).CPQ2_Test_Switch_Convert_Opp__c)) {
                        oppToConvert.add(opp);
                    }
                }
				System.debug('~~' + oppToConvert);
                if(oppToConvert.size() > 0) { 
                    convertCoreListPriceRequests(oppToConvert);
                    convertVmiRequest(oppToConvert);
                }
            }
        }
    }

    /**
     * @description handles the approval of thresholds for Core list price and Non-service line items
     *
     * @param targetOpportunities - target header that house VMI and Core list price requests
     * @param mapOld - opportunity trigger oldmap
     */
    public static void approveThresholds(List<Opportunity> targetOpportunities, Map<Id, Opportunity> mapOld) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_OPP_TRIGGER_NAME)) {
            Map<Id, Opportunity> mapOppToApprove = new Map<Id, Opportunity>();

            for (Opportunity opp : targetOpportunities) {
                if (opp.CPQ2_Date_Approved__c != mapOld.get(opp.Id).CPQ2_Date_Approved__c) {
                    mapOppToApprove.put(opp.Id, opp);
                }
            }

            if(mapOppToApprove.KeySet().size() > 0) {
                approveCoreListPriceRequests(mapOppToApprove);
                approveOpportunityLineItems(mapOppToApprove);
            }
        }
    }

    /**
     * @description handles setting of the Ship To Score Signed At (CPQ2_SSS__c) field when the Opportunity is signed.
     *
     * @param targetOpportunities - target Opportunities to check if it has been signed.
     * @param mapOld - opportunity trigger oldmap
     */
    public static void setShipToScoreSignedAt(List<Opportunity> targetOpportunities, Map<Id, Opportunity> mapOld) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_OPP_TRIGGER_NAME)) {
            for (Opportunity opp : targetOpportunities) {
                // If Opportunity has been signed
                if (opp.StageName == QueryUtils.fieldServiceSettings.Opportunity_To_Order_Creation_Stage_Name__c && 
                opp.StageName != mapOld.get(opp.Id).StageName) {
                    // Set the Ship To Score Signed At field to the Ship To Score for that Opportunity at that point in time.
                    opp.CPQ2_SSS__c = opp.CPQ2_STS__c;
                }
            }
        }
    }

    /**
     * @description helper method to approve core list price requests
     *
     * @param mapOppToApprove - target opps to approve
     */
    private static void approveCoreListPriceRequests(Map<Id, Opportunity> mapOppToApprove) {
        Map<Id, Map<Id, CPQ2_Core_List_Price_Request__c>> mapOppToCoreListPricesMap = OpportunityService.getContractPriceRequestByOpportunityIds(mapOppToApprove.keySet());
        List<CPQ2_Core_List_Price_Request__c> listCoreListPriceRequestToUpdate = new List<CPQ2_Core_List_Price_Request__c>();

        for (Opportunity opp : mapOppToApprove.values()) {
            if (mapOppToCoreListPricesMap.containsKey(opp.Id)) {
                for (CPQ2_Core_List_Price_Request__c clpr : mapOppToCoreListPricesMap.get(opp.Id).values()) {
                    if (clpr.CPQ2_Approved_Core_List_Price__c == null) {
                        clpr.CPQ2_Approved_Core_List_Price__c = clpr.CPQ2_Requested_Price__c;
                    } else if (clpr.CPQ2_Approved_Core_List_Price__c < clpr.CPQ2_Requested_Price__c) {
                        clpr.CPQ2_Approved_Core_List_Price__c = clpr.CPQ2_Requested_Price__c;
                    }

                    clpr.CPQ2_Threshold_Triggered__c = 0;
                    listCoreListPriceRequestToUpdate.add(clpr);
                }
            }
        }

        OpportunityService.updateCoreListPriceRequest(listCoreListPriceRequestToUpdate, true);
    }

    /**
     * @description helper method to approve non-service opportunity line items
     *
     * @param mapOppToApprove - target opps to approve
     */
    private static void approveOpportunityLineItems(Map<Id, Opportunity> mapOppToApprove) {
        Map<Id, List<OpportunityLineItem>> mapOppToLineItemList = OpportunityService.getOpportunityProductsByOpportunityIdsMap(mapOppToApprove.keySet());
        List<OpportunityLineItem> listLineItemsToUpdate = new List<OpportunityLineItem>();

        for (Opportunity opp : mapOppToApprove.values()) {
            if (mapOppToLineItemList.containsKey(opp.Id)) {
                List<OpportunityLineItem> listOli = mapOppToLineItemList.get(opp.Id);
                for (OpportunityLineItem oli : listOli) {
                    if (oli.Item_Type__c != 'Service') {
                        if (oli.CPQ2_Last_Approved_Purchase_Price__c == null ||
                            (oli.CPQ2_Last_Approved_Purchase_Price__c != null && oli.CPQ2_Last_Approved_Purchase_Price__c > oli.Purchase_Price__c)) {
                            oli.CPQ2_Last_Approved_Purchase_Price__c = oli.Purchase_Price__c;
                            oli.CPQ2_Threshold_Triggered__c = 0;
                            listLineItemsToUpdate.add(oli);
                        }
                    }
                }
            }
        }

        OpportunityService.updateOpportunityProducts(listLineItemsToUpdate, true);
    }

    /**
     * @description validates an order CpqEntity to make sure the proper configurations are being followed.
     *
     * @param entity - target to Validate
     *
     * @return - validation results
     */
    static public CPQ2_OrderValidationUtil.OrderValidationResult validateOrder(CPQ2_Wrapper.CpqEntity entity){
        List<OrderItem> orderItemList = new List<OrderItem>();

        for(CPQ2_Wrapper.LineItem lineItem: entity.lineItems){
            lineItem.isEdit = true;
        }

        entity.stampSObjects(false);

        for(CPQ2_Wrapper.LineItem lineItem: entity.lineItems){
            if(lineItem.isActive && !lineItem.isDeleted){
                orderItemList.add(lineItem.orderItem);
            }
        }

        return CPQ2_OrderValidationUtil.validateOrderLineItems(orderItemList);
    }

    /**
     * @description Sets the newly created Quote record as the Quote to be Sycned with the Opportunity Automatically.
     *
     * @param quoteRecords - quoteRecords for which we need to set the Opportunity to Sync with.
     */
    /*public static void setQuoteToBeSycnedWithOpp(List<Quote> quoteRecords) {
        if (runTriggerHelper(CPQ2_Util.SERVICE_QUOTE_TRIGGER_NAME)) {
            Map<Id, Id> quoteToOppIdMap = new Map<Id, Id>();

            for (Quote quote : quoteRecords) {
                if(String.isNotEmpty(quote.OpportunityId)) {
                    quoteToOppIdMap.put(quote.Id, quote.OpportunityId);
                }
            }
            // I had to do this because we cannot update the SyncedQuoteId within Trigger according to the documentation.
            CPQ2_Service.startSyncOnQuoteCreation(quoteToOppIdMap);
        }
    }*/
    
    /**
     * @description Sets the newly created Quote record as the Quote to be Sycned with the Opportunity Automatically.
     *
     * @param quoteToOppIdMap - quote to Opportunity Map
     */
    /*@future
    public static void startSyncOnQuoteCreation(Map<Id, Id> quoteToOppIdMap) {
        Map<Id, Opportunity> oppMap = new Map<Id, Opportunity>();

        for(Id quoteId : quoteToOppIdMap.keySet()) {
            Opportunity opp = new Opportunity(Id = quoteToOppIdMap.get(quoteId));
            opp.SyncedQuoteId = quoteId;
            oppMap.put(opp.Id, opp);
        }

        if(oppMap.values().size() > 0) {
            OpportunityService.updateOpportunities(oppMap.values(), true);
        }
    }*/

    /**
     * @description 
     * 
     * @return List<CPQ_Multiplier_Table> 
     */
    public static List<CPQ_Multiplier_Table__c> getCatMultiplier(){
        return OpportunityService.getCatMultipliers();
    }

    /**
     * @description 
     * 
     * @return List<CPQ2_Score_Multiplier__c> 
     */
    public static List<CPQ2_Score_Multiplier__c> getScoreMultiplier(){
        return OpportunityService.getScoreMultipliers();
    }
}