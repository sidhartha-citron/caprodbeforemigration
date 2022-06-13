/**
 * @description Wrapper classes for CPQ2
 *
 * Created by timothychiang on 2020-03-27.
 *
 */
public with sharing class CPQ2_Wrapper {

	public static final String BASE_ITEM_TYPE_BASE = 'BaseItem';
	public static final String BASE_ITEM_TYPE_OPPORTUNITY_LINE_ITEM = 'OpportunityLineItem';
	public static final String BASE_ITEM_TYPE_ORDER_LINE_ITEM = 'OrderLineItem';
	public static final String BASE_ITEM_TYPE_CORE_LIST_PRICE_REQUEST = 'CoreListPriceRequest';
	public static final String BASE_ITEM_TYPE_VMI_REQUEST = 'VmiRequest';

	/**
	 * @description base item for generic handling of line items, core list price and vmi
	 */
	public virtual class BaseItem{
		@AuraEnabled public String key;
		@AuraEnabled public String parentKey;

		public virtual String getType(){
			return BASE_ITEM_TYPE_BASE;
		}

		public virtual String getObjectName(){
			return BASE_ITEM_TYPE_BASE;
		}
	}

	/**
	 * @description overall wrapper class body that stores the account, header and line items
	 */
	public class CpqEntity{
		@AuraEnabled public AccountItem accountItem;
		@AuraEnabled public HeaderItem header;
		@AuraEnabled public List<LineItem> lineItems;
		@AuraEnabled public Decimal grossMargin = 0;
		@AuraEnabled public Decimal grossMarginPercentage = 0;
		@AuraEnabled public Decimal shipToDealScore = 0;

		/**
		 * @description constructor
		 *
		 * @param opp target opp to create with
		 * @param lineItems target lineItem to create with
		 */
		public CpqEntity(Opportunity opp, List<OpportunityLineItem> lineItems){
			this.header = new HeaderItem(opp);
			this.lineItems = new List<LineItem>();
			if(opp.Account != null){
				this.accountItem = new AccountItem(opp.Account);
			}


			// TODO: need to get all of the re-occurring OLI
			// separate the reoccurring from the non.
			List<LineItem> reoccurring = new List<LineItem>();
			List<LineItem> regularList = new List<LineItem>();
			Map<Id, LineItem> productToLineItemMap = new Map<Id, LineItem>();


			for(OpportunityLineItem oli: lineItems){
				//this.lineItems.add(new LineItem(oli));

				if(oli.CPQ2_isRecurring__c){
					reoccurring.add(new LineItem(oli, false, false));
				} else {
					LineItem newLineItem = new LineItem(oli);
					regularList.add(newLineItem);
					productToLineItemMap.put(oli.Product2Id, newLineItem);
				}
			}

			this.lineItems.addAll(regularList);

			List<CPQ2_Wrapper.LineItem> dummyLineItems = new List<CPQ2_Wrapper.LineItem>();
			for(LineItem oli: reoccurring){

				if(productToLineItemMap.containsKey(oli.productId)){
					productToLineItemMap.get(oli.productId).recurringItem = oli;
					oli.parentKey = productToLineItemMap.get(oli.productId).key;
				} else {
					OpportunityLineItem newOli = new OpportunityLineItem();
					newOli.OpportunityId=oli.opportunityLineItem.OpportunityId;
					newOli.Product2Id = oli.productId;
					newOli.PricebookEntryId=oli.pricebookEntryId;

					CPQ2_Wrapper.LineItem newLineItem = new CPQ2_Wrapper.LineItem(newOli, false, true);
					newLineItem.isRecurring = true;
					newLineItem.recurringItem = oli;
					oli.parentKey = newLineItem.key;
					dummyLineItems.add(newLineItem);
				}
			}

			this.lineItems.addAll(dummyLineItems);
		}

		/**
		 * @description constructor
		 *
		 * @param order target order to create with
		 * @param lineItems target lineItem to create with
		 */
		public CpqEntity(Order order, List<OrderItem> lineItems){
			this.header = new HeaderItem(order);
			this.lineItems = new List<LineItem>();

			List<LineItem> regularList = new List<LineItem>();

			for(OrderItem orderLineItem: lineItems){
				LineItem newLineItem = new LineItem(orderLineItem);
				regularList.add(newLineItem);
			}

			this.lineItems.addAll(regularList);

			if(order.Account != null){
				this.accountItem = new AccountItem(order.Account);
			}
		}

		/**
		 * @description enrich line items with their respective core list price and vmi
		 *
		 * @param coreListPriceRequestMap - map prod--> core list prices
		 * @param vmiRequestMap - map prod --> vmi request
		 */
		public void enrich(Map<Id,CPQ2_Core_List_Price_Request__c> coreListPriceRequestMap, Map<Id,CPQ2_VMI_Request__c> vmiRequestMap){

			Map<Id, CPQ2_Wrapper.LineItem> productToLineItemMap = new Map<Id, CPQ2_Wrapper.LineItem>();
			for (CPQ2_Wrapper.LineItem li : this.lineItems) {
				// we are comfortable using prodId as the key because consumables and equipment are unique to an opp
				// and we are only using this map for the purpose of those types.
				productToLineItemMap.put(li.productId, li);
			}

			Set<Id> coreListVmiProdIdSet = new Set<Id>();
			coreListVmiProdIdSet.addAll(coreListPriceRequestMap.keySet());
			coreListVmiProdIdSet.addAll(vmiRequestMap.keySet());

			List<CPQ2_Wrapper.LineItem> dummyLineItems = new List<CPQ2_Wrapper.LineItem>();

			for(Id prodId: coreListVmiProdIdSet){
				if(String.isNotEmpty(prodId)){

					Id opportunityId = null;
					Id pbeId = null;

					CPQ2_VMI_Request__c vmiRequest = null;
					if(vmiRequestMap.containsKey(prodId)){
						vmiRequest = vmiRequestMap.get(prodId);
						opportunityId = vmiRequest.CPQ2_Opportunity__c;
						pbeId = vmiRequest.CPQ2_Pricebook_Entry_Id__c;
					}

					CPQ2_Core_List_Price_Request__c cpRequest = null;
					if(coreListPriceRequestMap.containsKey(prodId)){
						cpRequest = coreListPriceRequestMap.get(prodId);
						opportunityId = cpRequest.CPQ2_Opportunity__c;
						pbeId = cpRequest.CPQ2_Pricebook_Entry_Id__c;
					}

					if(productToLineItemMap.containsKey(prodId)){
						productToLineItemMap.get(prodId).enrich(cpRequest, vmiRequest);
					} else {
						CPQ2_Wrapper.LineItem dummyLine = createDummyLineItem(opportunityId,prodId,pbeId);
						dummyLine.enrich(cpRequest,vmiRequest);
						dummyLineItems.add(dummyLine);
					}
				}
			}

			this.lineItems.addAll(dummyLineItems);
		}

		/**
		 * @description create the "dummy" line item that represents a 0 quantity row
		 *
		 * @param opportunityId - target parent opportunity
		 * @param productId - target product
		 * @param priceBookEntryId - target pricebook entry
		 *
		 * @return the "dummy" line item
		 */
		private CPQ2_Wrapper.LineItem createDummyLineItem(Id opportunityId, Id productId, Id priceBookEntryId ){
			OpportunityLineItem dummyOli = new OpportunityLineItem();
			dummyOli.OpportunityId = opportunityId;
			dummyOli.Quantity = 0;
			dummyOli.Product2Id = productId;
			dummyOli.PricebookEntryId = priceBookEntryId;
			CPQ2_Wrapper.LineItem dummyLine = new CPQ2_Wrapper.LineItem(dummyOli);
			return dummyLine;
		}

		/**
		 * @description takes in a list of lineItems to replace or create in the entity line item list
		 *
		 * @param lineItems - list to reconcile
		 */
		public void reconcile(List<OpportunityLineItem> lineItems) {
			Map<String,LineItem> lineItemMap = getLineItemMap();

			for(OpportunityLineItem oli: lineItems){

				LineItem lineItem = new LineItem(oli, true);

				if(lineItemMap.containsKey(oli.Id)){
					lineItemMap.put(oli.Id, lineItem);
				} else {
					lineItemMap.put(lineItem.key, lineItem);
				}
			}

			this.lineItems = lineItemMap.values();
		}

		/**
		 * @description takes in a list of lineItems to replace or create in the entity line item list
		 *
		 * @param lineItems - list to reconcile
		 */
		public void reconcile(List<OrderItem> lineItems) {
			Map<String,LineItem> lineItemMap = getLineItemMap();

			for(OrderItem orderItem: lineItems){

				LineItem lineItem = new LineItem(orderItem, true);

				if(lineItemMap.containsKey(orderItem.Id)){
					lineItemMap.put(orderItem.Id, lineItem);
				} else {
					lineItemMap.put(lineItem.key, lineItem);
				}
			}

			this.lineItems = lineItemMap.values();
		}

		/**
		 * @description used to remove a list items from the entity
		 *
		 * @param lineItems - targeted list to remove
		 */
		public void remove(List<OpportunityLineItem> lineItems){
			Map<String,LineItem> lineItemMap = getLineItemMap();

			for(OpportunityLineItem oli: lineItems){
				if(lineItemMap.containsKey(oli.Id)){
					lineItemMap.remove(oli.Id);
				}
			}
			this.lineItems = lineItemMap.values();
		}

		/**
		 * @description used to remove a list items from the entity
		 *
		 * @param lineItems - targeted list to remove
		 */
		public void remove(List<OrderItem> lineItems){
			Map<String,LineItem> lineItemMap = getLineItemMap();

			for(OrderItem orderItem: lineItems){
				if(lineItemMap.containsKey(orderItem.Id)){
					lineItemMap.remove(orderItem.Id);
				}
			}
			this.lineItems = lineItemMap.values();
		}

		/**
		 * @description stamp the underlying Sobjects with wrapper data (Account, Opportunity, Order, Line Items)
		 *
		 * @param stampDealScoreValues - decide if price model values are to be stamped as well
		 */
		public void stampSObjects(Boolean stampDealScoreValues){
			for(LineItem li: lineItems){
				if(li.isEdit){
					if(li.getType() == BASE_ITEM_TYPE_OPPORTUNITY_LINE_ITEM){
						li.stampOpportunityLineItem(stampDealScoreValues);
					} else if(li.getType() == BASE_ITEM_TYPE_ORDER_LINE_ITEM){
						li.stampOrderLineItem(stampDealScoreValues);
					}

				}
			}

			if(header.getType() == CPQ2_Util.SOBJECT_NAME_OPP){
				header.stampOpportunity(stampDealScoreValues);
			} else if(header.getType() == CPQ2_Util.SOBJECT_NAME_ORDER){
				header.stampOrder(stampDealScoreValues);
			}

			if(header.getType() == CPQ2_Util.SOBJECT_NAME_OPP){
				accountItem.stampAccount(false);
			} else if(header.getType() == CPQ2_Util.SOBJECT_NAME_ORDER){
				accountItem.stampAccount(stampDealScoreValues);
			}


		}

		/**
		 * @description helper method to convert lineItem list into a map
		 *
		 * @return  map of line items
		 */
		private Map<String, LineItem> getLineItemMap(){
			Map<String, LineItem> lineItemMap = new Map<String, LineItem>();
			for(LineItem li: lineItems){
				if(!String.isEmpty(li.id)){
					lineItemMap.put(li.id, li);
				} else {
					lineItemMap.put(li.key, li);
				}
			}

			return lineItemMap;
		}
	}

	/**
	 * @description account wrapper
	 */
	public class AccountItem{
		@AuraEnabled public Account account;
		@AuraEnabled public Decimal totalAnnualRevenue = 0;
		@AuraEnabled public Decimal totalAnnualCost = 0;
		@AuraEnabled public Decimal highestFrequency = 0;
		@AuraEnabled public Decimal costStop = 0;
		@AuraEnabled public Decimal distanceAdjustments = 0;
		@AuraEnabled public Decimal otherDirectCostPercentage = 0;
		@AuraEnabled public Decimal totalCapitalCharge = 0;
		@AuraEnabled public String fsa;
		@AuraEnabled public String serviceZone;
		//@AuraEnabled public Decimal shipToScoreApproved;
		@AuraEnabled public Boolean hasSeasonal;
		@AuraEnabled public String name;
		@AuraEnabled public Boolean shipComplete = false;

		/**
		 * @description constructor
		 *
		 * @param account - target account to wrap
		 */
		public AccountItem(Account account){
			this.account = account;
			this.totalAnnualRevenue = (account.CPQ2_TOAR__c == null) ? 0 : account.CPQ2_TOAR__c;
			this.totalAnnualCost = (account.CPQ2_TOAC__c == null) ? 0 : account.CPQ2_TOAC__c;
			this.highestFrequency = (account.CPQ2_HF__c == null) ? 0 : account.CPQ2_HF__c;
			this.totalCapitalCharge = (account.CPQ2_TCaC__c == null) ? 0 : account.CPQ2_TCaC__c;
			this.fsa = account.FSA_Mapping__r.FSA__c;
			this.serviceZone = account.FSA_Mapping__r.CPQ_Service_Zone__c;
			//this.shipToScoreApproved = account.CPQ2_DSA__c;
			this.hasSeasonal = account.CPQ2_HSO__c;
			this.name = account.Name;
			this.shipComplete = account.Ship_Complete__c;
//			this.costStop = account.CPQ2_CSBSM__c;
//			this.distanceAdjustments = account.CPQ2_DAF__c;
//			this.otherDirectCostPercentage = account.CPQ2_DOR__c;
		}

		/**
		 * @description stamps wrapper values back to the source account
		 *
		 * @param stampCalcs switch to determine if price model values are to be stamped
		 *
		 * @return target account to be stamped
		 */
		public Account stampAccount(Boolean stampCalcs){
			System.debug('stampCalcs*** ' + stampCalcs);


			this.account.CPQ2_CSBSM__c = this.costStop;
			this.account.CPQ2_DAF__c = this.distanceAdjustments;
			this.account.CPQ2_DOR__c = this.otherDirectCostPercentage;

			if(stampCalcs){
				this.account.CPQ2_TOAR__c = this.totalAnnualRevenue;
				this.account.CPQ2_TOAC__c = this.totalAnnualCost;
				this.account.CPQ2_HF__c = this.highestFrequency;
				this.account.CPQ2_HSO__c = this.hasSeasonal;
				this.account.CPQ2_TCaC__c = this.totalCapitalCharge;
			}

			System.debug('ACCOUNT*** ' + this.account);

			return this.account;
		}
	}

	/**
	 * @description header wrapper
	 */
	public class HeaderItem{
		@AuraEnabled public Opportunity opportunity;
		@AuraEnabled public Order order;
		@AuraEnabled public Id id;
		@AuraEnabled public String name;
		@AuraEnabled public String orderNumber;
		@AuraEnabled public Id priceBookId;
		@AuraEnabled public Id accountId;
		@AuraEnabled public String type;
		@AuraEnabled public Date headerDate;
		@AuraEnabled public String fsaApproved;
		@AuraEnabled public Decimal pmCount;
		@AuraEnabled public Decimal coreListThresholdLevel = 0;
		@AuraEnabled public Decimal nonServiceThreshold = 0;
		@AuraEnabled public Decimal approvalStatus= 0;
		@AuraEnabled public Decimal contractTermApprovalStatus= 0;
		@AuraEnabled public Decimal shipToScoreApproved;	
		@AuraEnabled public List<String> dealImpacts;
		@AuraEnabled public Boolean lowMarginFound = false;
		@AuraEnabled public Id siteSurveyId;
		@AuraEnabled public Boolean isSeasonal = false;
		@AuraEnabled public Boolean includeInPriceModel = false;
		@AuraEnabled public String oppStageName;
		public Decimal totalAnnualRevenue = 0;
		public Decimal totalAnnualCost = 0;
		public Decimal highestFrequency = 0;
		public Decimal totalCapitalCharge = 0;

		/**
		 * @description constructor
		 *
		 * @param opp target opportunity to wrap
		 */
		public HeaderItem(Opportunity opp){
			this.opportunity = opp;
			this.id = opp.Id;
			this.name = opp.Name;
			this.priceBookId = opp.Pricebook2Id;
			this.accountId = opp.AccountId;
			this.headerDate = opp.CloseDate;
			this.type = opp.Type;
			this.totalAnnualCost = (opp.CPQ2_TAC__c == null) ? 0:opp.CPQ2_TAC__c;
			this.totalAnnualRevenue = (opp.CPQ2_TAR__c == null) ? 0:opp.CPQ2_TAR__c;
			this.highestFrequency = (opp.CPQ2_HF__c == null) ? 0:opp.CPQ2_HF__c;
			this.totalCapitalCharge = (opp.CPQ2_TCaC__c == null) ? 0 : opp.CPQ2_TCaC__c;
			this.fsaApproved = opp.CPQ2_FAS__c;
			this.pmCount = opp.CPQ2_HC__c;
			this.coreListThresholdLevel = opp.CPQ2_CLT__c;
			this.shipToScoreApproved = opp.CPQ2_SSA__c;
			this.contractTermApprovalStatus = opp.CPQ2_CTAS__c;
			this.oppStageName = opp.StageName;

			dealImpacts = new List<String>();
		}

		/**
		 * @description constructor
		 *
		 * @param order target order to wrap
		 */
		public HeaderItem(Order order){
			this.order = order;
			this.id = order.Id;
			this.name = order.Name;
			this.orderNumber = order.OrderNumber;
			this.priceBookId = order.Pricebook2Id;
			this.accountId = order.AccountId;
			this.type = order.Type;
			this.totalAnnualCost = (order.CPQ2_TAC__c == null) ? 0:order.CPQ2_TAC__c;
			this.totalAnnualRevenue = (order.CPQ2_TAR__c == null) ? 0:order.CPQ2_TAR__c;
			this.highestFrequency = (order.CPQ2_HF__c == null) ? 0:order.CPQ2_HF__c;
			this.totalCapitalCharge = (order.CPQ2_TCaC__c == null) ? 0 : order.CPQ2_TCaC__c;
			this.pmCount = order.CPQ2_HC__c;
			this.siteSurveyId = order.Site_Survey__c;
			this.isSeasonal = order.CPQ2_Seasonal__c;
			this.includeInPriceModel = order.CPQ2_Include_in_Price_Model__c;
			dealImpacts = new List<String>();
		}

		/**
		 * @description  stamps wrapper values back to the source opportunity
		 *
		 * @param stampCalcs switch to determine if price model values are to be stamped
		 *
		 * @return underlying opportunity
		 */
		public Opportunity stampOpportunity(Boolean stampCalcs){

			if(stampCalcs){
				this.opportunity.CPQ2_TAC__c = this.totalAnnualCost;
				this.opportunity.CPQ2_TAR__c = this.totalAnnualRevenue;
				this.opportunity.CPQ2_HF__c = this.highestFrequency;
				this.opportunity.CPQ2_HC__c = this.pmCount;
				this.opportunity.CPQ2_TCaC__c = this.totalCapitalCharge;
			}

			return this.opportunity;
		}


		/**
		 * @description  stamps wrapper values back to the source order
		 *
		 * @param stampCalcs switch to determine if price model values are to be stamped
		 *
		 * @return underlying order
		 */
		public Order stampOrder(Boolean stampCalcs){

			if(stampCalcs){
				this.order.CPQ2_TAC__c = this.totalAnnualCost;
				this.order.CPQ2_TAR__c = this.totalAnnualRevenue;
				this.order.CPQ2_HF__c = this.highestFrequency;
				this.order.CPQ2_HC__c = this.pmCount;
				this.order.CPQ2_TCaC__c = this.totalCapitalCharge;
			}

			return this.order;
		}

		public String getType(){
			return id.getSObjectType().getDescribe().getName();
		}

	}

	/**
	 * @description line item wrapper
	 */
	public class LineItem extends BaseItem{
		@AuraEnabled public OpportunityLineItem opportunityLineItem;
		@AuraEnabled public OrderItem orderItem;
		@AuraEnabled public Decimal requestedPrice;
		@AuraEnabled public Boolean requestedPriceApproved;
		@AuraEnabled public Boolean isActive;
		@AuraEnabled public Id id;
		@AuraEnabled public String frequency;
		@AuraEnabled public Decimal quantity;
		@AuraEnabled public Decimal servicePrice;
		@AuraEnabled public Decimal purchasePrice;
		@AuraEnabled public Decimal installationPrice;
		@AuraEnabled public String installationStatus;
		@AuraEnabled public String installationNotes;
		@AuraEnabled public String description;
		@AuraEnabled public String serviceNotes;
		@AuraEnabled public Id relatedProduct;
		@AuraEnabled public String relatedProductName;
		@AuraEnabled public Id productId;
		@AuraEnabled public Id pricebookEntryId;
		@AuraEnabled public String areaOfCoverage;
		@AuraEnabled public String areaOfCoverageOther;
		@AuraEnabled public String coveredPests;
		@AuraEnabled public String coveredPestsOther;
		@AuraEnabled public ProductService.ProductWrapper productInfo;
		@AuraEnabled public Boolean isDeleted = false;
		@AuraEnabled public Boolean isEdit = false;
		@AuraEnabled public String lineScore;
		@AuraEnabled public Boolean isCoreListSubmitted = false;
		@AuraEnabled public Boolean isRecurring = false;
		@AuraEnabled public Boolean isVmi = false;
		@AuraEnabled public String surveyLocationName;
		@AuraEnabled public LineItem recurringItem;
		@AuraEnabled public CoreListPriceRequest coreListPriceRequest;
		@AuraEnabled public VmiRequest vmiRequest;
		@AuraEnabled public Boolean bypassInactive = false;
		@AuraEnabled public String oppRT;


		public Decimal materialCost = 0;
		public Decimal duration = 0;
		public Decimal averageCostMinute = 0;
		public Decimal numberOfVisits = 0;
		public Decimal lineMargin = 0;
		public Decimal lastApprovedPurchasePrice = 0;
		public Decimal totalRevenue = 0;
		public Decimal totalCost = 0;
		public Decimal capitalCost = 0;
		public Decimal amortization = 0;
		public Decimal totalCapitalCharge = 0;

		public Decimal marginThreshold1 = 0;
		public Decimal marginThreshold2 = 0;
		public String productType = '';
		public Decimal listPrice = 0;
		public Decimal thresholdLevel = 0;
		public Decimal itemCost = 0;
		public Boolean includeInShipToCalculation = false;
		public Boolean includeInNonServiceCalculation = false;


		public override String getType(){
			if(this.opportunityLineItem != null){
				return BASE_ITEM_TYPE_OPPORTUNITY_LINE_ITEM;
			} else {
				return BASE_ITEM_TYPE_ORDER_LINE_ITEM;
			}
		}

		public override String getObjectName(){
			return CPQ2_Util.SOBJECT_NAME_OPP_LINE_ITEM;
		}

		/**
		 * @description constructor
		 *
		 * @param oli source oli to wrap
		 */
		public LineItem(OpportunityLineItem oli) {
			OpportunityToLineItem(oli, false, true);
		}

		/**
		 * @description  constructor
		 *
		 * @param oli source oli to wrap
		 * @param isEdit switch to mark the wrapper as currently edited item
		 */
		public LineItem(OpportunityLineItem oli, Boolean isEdit) {
			OpportunityToLineItem(oli, isEdit, true);
		}

		/**
		 * @description constructor
		 *
		 * @param orderItem source orderItem to wrap
		 */
		public LineItem(OrderItem orderItem) {
			OrderToLineItem(orderItem, false);
		}

		/**
		 * @description  constructor
		 *
		 * @param orderItem source orderItem to wrap
		 * @param isEdit switch to mark the wrapper as currently edited item
		 */
		public LineItem(OrderItem orderItem, Boolean isEdit) {
			OrderToLineItem(orderItem, isEdit);
		}


		/**
		 * @description constructor
		 *
		 * @param oli source oli to wrap
		 * @param isEdit switch to mark the wrapper as currently edited item
		 * @param generateRecurring - flag to determine if children needs to be generated
		 */
		public LineItem(OpportunityLineItem oli, Boolean isEdit, Boolean generateRecurring) {
			OpportunityToLineItem(oli, isEdit, generateRecurring);
		}

		/**
		 * @description
		 *
		 * @param orderItem - OrderItem to wrap
		 * @param isEdit - switch to mark the wrapper as currently edited item
		 */
		private void OrderToLineItem(OrderItem orderItem, Boolean isEdit) {
			this.orderItem = orderItem;
			this.isEdit = isEdit;
			this.key = CPQ2_Util.getUUID();
			this.parentKey = key;
			this.id = orderItem.Id;
			this.frequency = orderItem.Frequency__c;
			this.quantity = orderItem.Quantity;
			this.servicePrice = orderItem.Service_Price_Per_Unit__c;
			this.purchasePrice = orderItem.Purchase_Price__c;
			this.installationPrice = orderItem.Installation_Price__c;
			this.installationStatus = orderItem.Installation_Status__c;
			this.installationNotes = orderItem.Installation_Notes__c;
			this.relatedProduct = orderItem.Related_Product__c;
			this.productId = orderItem.Product2Id;
			this.pricebookEntryId = orderItem.PricebookEntryId;
			this.description = orderItem.Description;
			this.materialCost = orderItem.CPQ2_Material_Cost__c;
			this.duration = orderItem.CPQ2_Duration_In_Minutes__c;
			this.numberOfVisits = orderItem.CPQ2_Number_Of_Visits_Per_Year__c;
			this.averageCostMinute = orderItem.CPQ2_Average_Cost_Minute__c;
			this.lineMargin = orderItem.CPQ2_Line_Margin__c;
			this.totalRevenue = (orderItem.CPQ2_Total_Revenue__c == null) ? 0 : orderItem.CPQ2_Total_Revenue__c;
			this.totalCost = (orderItem.CPQ2_Total_Costs__c == null) ? 0 : orderItem.CPQ2_Total_Costs__c;

			this.capitalCost = (orderItem.CPQ2_Capital_Cost__c == null) ? 0 : orderItem.CPQ2_Capital_Cost__c;
			this.amortization = (orderItem.CPQ2_Amortization__c == null) ? 0 : orderItem.CPQ2_Amortization__c;
			this.totalCapitalCharge = (orderItem.CPQ2_Total_Capital_Charge__c == null) ? 0 : orderItem.CPQ2_Total_Capital_Charge__c;
            
            System.debug('~~Create Inactive Order Item~~' + this.orderItem.Active__c);            
            //CPQCN-570
            if(this.orderItem.Active__c==false){
                this.materialCost = 0;
                this.duration = 0;
                this.numberOfVisits = 0;
                this.averageCostMinute = 0;
                this.lineMargin = 0;
                this.totalRevenue = 0;
                this.totalCost = 0;
                this.capitalCost = 0;
                this.amortization = 0;
                this.totalCapitalCharge = 0;
            }
            //CPQCN-570


			this.requestedPrice = orderItem.Requested_Price__c;
			this.requestedPriceApproved = orderItem.Requested_Price_Approved__c;
			this.isActive = (orderItem.Active__c == null)?true:orderItem.Active__c;
			this.bypassInactive = !this.isActive;
			this.surveyLocationName = orderItem.Survey_Location__r.Name;
			this.serviceNotes = orderItem.Service_Notes__c;

			this.areaOfCoverage = orderItem.Areas_of_Coverage__c;
			this.areaOfCoverageOther = orderItem.Covered_Pests_Other__c;
			this.coveredPests = orderItem.Covered_Pests__c;
			this.coveredPestsOther = orderItem.Areas_of_Coverage_Other__c;
		}

		/**
		 * @description helper method to copy oli values into the wrapper
		 *
		 * @param oli source oli to wrap
		 * @param isEdit switch to mark the wrapper as currently edited item
		 * @param generateRecurring - flag to determine if children needs to be generated
		 */
		private void OpportunityToLineItem(OpportunityLineItem oli, Boolean isEdit, Boolean generateRecurring){
			this.isActive = true;
			this.opportunityLineItem = oli;
			this.isEdit = isEdit;
			this.key = CPQ2_Util.getUUID();
			this.parentKey = key;
			this.id = oli.Id;
			this.frequency = oli.Service_Frequency__c;
			this.quantity = oli.Quantity;
			this.servicePrice = oli.Service_Price_Per_Unit__c;
			this.purchasePrice = oli.Purchase_Price__c;
			this.installationPrice = oli.Installation_Price__c;
			this.installationStatus = oli.Installation_Status__c;
			this.installationNotes = oli.Installation_Notes__c;
			this.relatedProduct = oli.Related_Product__c;
			this.productId = oli.Product2Id;
			this.pricebookEntryId = oli.PricebookEntryId;
			this.description = oli.Description;
			this.materialCost = oli.CPQ2_Material_Cost__c;
			this.duration = oli.CPQ2_Duration_In_Minutes__c;
			this.numberOfVisits = oli.CPQ2_Number_Of_Visits_Per_Year__c;
			this.averageCostMinute = oli.CPQ2_Average_Cost_Minute__c;
			this.lineMargin = oli.CPQ2_Line_Margin__c;
			this.totalRevenue = (oli.CPQ2_Total_Revenue__c == null) ? 0:oli.CPQ2_Total_Revenue__c;
			this.totalCost = (oli.CPQ2_Total_Costs__c == null) ? 0:oli.CPQ2_Total_Costs__c;

			this.capitalCost = (oli.CPQ2_Capital_Cost__c == null) ? 0 : oli.CPQ2_Capital_Cost__c;
			this.amortization = (oli.CPQ2_Amortization__c == null) ? 0 : oli.CPQ2_Amortization__c;
			this.totalCapitalCharge = (oli.CPQ2_Total_Capital_Charge__c == null) ? 0 : oli.CPQ2_Total_Capital_Charge__c;

			this.areaOfCoverage = oli.Areas_of_Coverage__c;
			this.areaOfCoverageOther = oli.Areas_of_Coverage_Other__c;
			this.coveredPests = oli.Covered_Pests__c;
			this.coveredPestsOther = oli.Covered_Pests_Other__c;
			this.isRecurring = oli.CPQ2_isRecurring__c;
			this.relatedProductName = oli.Related_Product__r.Name;
			this.lastApprovedPurchasePrice = oli.CPQ2_Last_Approved_Purchase_Price__c;
			this.oppRT = OpportunityService.getOppRecordType(oli.OpportunityId);

			if(generateRecurring){
				this.coreListPriceRequest = new CoreListPriceRequest(oli,this.key);
				this.vmiRequest = new VmiRequest(oli, this.key);

				OpportunityLineItem newOli = new OpportunityLineItem();
				newOli.OpportunityId=oli.OpportunityId;
				newOli.Product2Id = oli.Product2Id;
				newOli.PricebookEntryId=oli.PricebookEntryId;
				newOli.Quantity = 1;

				CPQ2_Wrapper.LineItem newLineItem = new CPQ2_Wrapper.LineItem(newOli, false, false);
				newLineItem.parentKey = this.key;
				System.debug('*** ' + newLineItem.opportunityLineItem);
				this.recurringItem = newLineItem;
			}

		}

		/**
		 * @description enrich line item with Core list price request and vmi request
		 *
		 * @param coreListPriceRequest - Core list price request to enrich with
		 * @param vmiRequest - vmi request to enrich with
		 */
		public void enrich(CPQ2_Core_List_Price_Request__c coreListPriceRequest, CPQ2_VMI_Request__c vmiRequest) {
			if(coreListPriceRequest != null){
				this.coreListPriceRequest = new CoreListPriceRequest(coreListPriceRequest, this.key);
				this.isCoreListSubmitted = (coreListPriceRequest.Id != null )?true:false;
			}

			if(vmiRequest != null){
				this.vmiRequest = new VmiRequest(vmiRequest, this.key);
				this.isVmi = (vmiRequest.Id != null )?true:false;
			}
		}

		/**
		 * @description stamps wrapper values back to underlying line item
		 *
		 * @param stampCalcs switch to determine if price model values are to be stamped
		 *
		 * @return underlying OpportunityLineItem
		 */
		public OpportunityLineItem stampOpportunityLineItem(Boolean stampCalcs){
			if(String.isEmpty(this.opportunityLineItem.Id)){
				this.opportunityLineItem.Id = this.id;
			}

			this.opportunityLineItem.Service_Frequency__c = this.frequency;
			this.opportunityLineItem.Quantity = this.quantity.setScale(0);
			this.opportunityLineItem.Service_Price_Per_Unit__c = (this.servicePrice != null)?this.servicePrice.setScale(2):null;
			//CPQCN-400: Shashi Puttaswamy : Stamp CPQ2 List Price
			System.debug('--PBE--' + this.opportunityLineItem.PricebookEntry.UnitPrice); 
            System.debug('--LP--' + this.listPrice); 
            if(this.listPrice!=null){
                this.opportunityLineItem.CPQ2_List_Price__c = this.listPrice;
            }
            if(this.productInfo!=null && this.productInfo.priceBookEntry.UnitPrice!=null){
                this.opportunityLineItem.CPQ2_List_Price__c = this.productInfo.priceBookEntry.UnitPrice;
            }
			if(this.opportunityLineItem.PricebookEntry.UnitPrice!=null) {
				this.opportunityLineItem.CPQ2_List_Price__c = this.opportunityLineItem.PricebookEntry.UnitPrice;
			}
			this.opportunityLineItem.Purchase_Price__c = (this.purchasePrice != null)?this.purchasePrice.setScale(2):null;
			this.opportunityLineItem.Installation_Price__c = (this.installationPrice != null)?this.installationPrice.setScale(2):null;
			this.opportunityLineItem.Installation_Status__c = this.installationStatus;
			this.opportunityLineItem.Installation_Notes__c = this.installationNotes;
			this.opportunityLineItem.Related_Product__c = this.relatedProduct;
			this.opportunityLineItem.Description = this.description;
			this.opportunityLineItem.Areas_of_Coverage__c = this.areaOfCoverage;
			this.opportunityLineItem.Areas_of_Coverage_Other__c = this.areaOfCoverageOther;
			this.opportunityLineItem.Covered_Pests__c = this.coveredPests;
			this.opportunityLineItem.Covered_Pests_Other__c = this.coveredPestsOther;

			if(String.isEmpty(this.opportunityLineItem.PricebookEntryId)){
				this.opportunityLineItem.PricebookEntryId = this.pricebookEntryId;
			}

			if(stampCalcs && (includeInShipToCalculation)){
				if(this.OpportunityLineItem.Service_Frequency__c == 'One-Time'){
					this.opportunityLineItem.CPQ2_Material_Cost__c = null;
					this.opportunityLineItem.CPQ2_Duration_In_Minutes__c = null;
					this.opportunityLineItem.CPQ2_Average_Cost_Minute__c = null;
					this.opportunityLineItem.CPQ2_Line_Margin__c = null;
					this.opportunityLineItem.CPQ2_Total_Revenue__c = null;
					this.opportunityLineItem.CPQ2_Total_Costs__c = null;
					this.opportunityLineItem.CPQ2_Number_Of_Visits_Per_Year__c = null;
					this.opportunityLineItem.CPQ2_Line_Score_Colour__c = null;
					this.opportunityLineItem.CPQ2_Capital_Cost__c = null;
					this.opportunityLineItem.CPQ2_Amortization__c = null;
					this.opportunityLineItem.CPQ2_Total_Capital_Charge__c = null;
				}
				else {
					this.opportunityLineItem.CPQ2_Material_Cost__c = this.materialCost;
					this.opportunityLineItem.CPQ2_Duration_In_Minutes__c = this.duration;
					this.opportunityLineItem.CPQ2_Average_Cost_Minute__c = this.averageCostMinute;
					this.opportunityLineItem.CPQ2_Line_Margin__c = this.lineMargin;
					this.opportunityLineItem.CPQ2_Total_Revenue__c = this.totalRevenue;
					this.opportunityLineItem.CPQ2_Total_Costs__c = this.totalCost;
					this.opportunityLineItem.CPQ2_Number_Of_Visits_Per_Year__c = this.numberOfVisits;
					this.opportunityLineItem.CPQ2_Line_Score_Colour__c = this.lineScore;
					this.opportunityLineItem.CPQ2_Capital_Cost__c = this.capitalCost;
					this.opportunityLineItem.CPQ2_Amortization__c = this.amortization;
					this.opportunityLineItem.CPQ2_Total_Capital_Charge__c = this.totalCapitalCharge;
				}
			}

			if(stampCalcs && (includeInNonServiceCalculation)) {
				this.opportunityLineItem.CPQ2_Line_Margin__c = this.lineMargin;
				this.opportunityLineItem.CPQ2_Threshold_Triggered__c = this.thresholdLevel;
				this.opportunityLineItem.CPQ2_Line_Score_Colour__c = this.lineScore;
			}

			return this.opportunityLineItem;
		}


		/**
		 * @description stamps wrapper values back to underlying line item
		 *
		 * @param stampCalcs switch to determine if price model values are to be stamped
		 *
		 * @return underlying OrderItem
		 */
		public OrderItem stampOrderLineItem(Boolean stampCalcs){
			if(String.isEmpty(this.orderItem.Id)){
				this.orderItem.Id = this.id;
			}

			this.orderItem.Frequency__c = this.frequency;
			this.orderItem.Quantity = this.quantity.setScale(0);
			this.orderItem.Service_Price_Per_Unit__c = (this.servicePrice != null)?this.servicePrice.setScale(2):null;
			this.orderItem.Purchase_Price__c = (this.purchasePrice != null)?this.purchasePrice.setScale(2):null;
			this.orderItem.Installation_Price__c = (this.installationPrice != null)?this.installationPrice.setScale(2):null;
			this.orderItem.Installation_Status__c = this.installationStatus;
			this.orderItem.Installation_Notes__c = this.installationNotes;
			this.orderItem.Related_Product__c = this.relatedProduct;
			this.orderItem.Service_Notes__c = this.serviceNotes;
			System.debug('Sanchivan stampOrderLineItem this.requestedPrice: ' + this.requestedPrice);
			this.orderItem.Requested_Price__c = this.requestedPrice;
			this.orderItem.Requested_Price_Approved__c = (this.requestedPriceApproved == null)?false:this.requestedPriceApproved;
			this.orderItem.Active__c = this.isActive;
			System.debug('Sanchivan orderItem.Active__c : ' + this.orderItem.Active__c);
			System.debug('Sanchivan orderItem.Id: ' + this.orderItem.Id);
			this.orderItem.Areas_of_Coverage__c = this.areaOfCoverage;
			this.orderItem.Areas_of_Coverage_Other__c = this.areaOfCoverageOther;
			this.orderItem.Covered_Pests__c = this.coveredPests;
			this.orderItem.Covered_Pests_Other__c = this.coveredPestsOther;
			this.orderItem.By_Pass_Activation__c = this.bypassInactive;
			this.orderItem.Description = this.description;

			if(String.isEmpty(this.orderItem.PricebookEntryId)){
				this.orderItem.PricebookEntryId = this.pricebookEntryId;
			}

			if(stampCalcs && (includeInShipToCalculation)){
				if(this.orderItem.Frequency__c == 'One-Time'){
					this.orderItem.CPQ2_Material_Cost__c = null;
					this.orderItem.CPQ2_Duration_In_Minutes__c = null;
					this.orderItem.CPQ2_Average_Cost_Minute__c = null;
					this.orderItem.CPQ2_Line_Margin__c = null;
					this.orderItem.CPQ2_Total_Revenue__c = null;
					this.orderItem.CPQ2_Total_Costs__c = null;
					this.orderItem.CPQ2_Number_Of_Visits_Per_Year__c = null;
					this.orderItem.CPQ2_Line_Score_Colour__c = null;
					this.orderItem.CPQ2_Capital_Cost__c = null;
					this.orderItem.CPQ2_Amortization__c = null;
					this.orderItem.CPQ2_Total_Capital_Charge__c = null;
				}
				else {
					this.orderItem.CPQ2_Material_Cost__c = this.materialCost;
					this.orderItem.CPQ2_Duration_In_Minutes__c = this.duration;
					this.orderItem.CPQ2_Average_Cost_Minute__c = this.averageCostMinute;
					this.orderItem.CPQ2_Line_Margin__c = this.lineMargin;
					this.orderItem.CPQ2_Total_Revenue__c = this.totalRevenue;
					this.orderItem.CPQ2_Total_Costs__c = this.totalCost;
					this.orderItem.CPQ2_Number_Of_Visits_Per_Year__c = this.numberOfVisits;
					this.orderItem.CPQ2_Line_Score_Colour__c = this.lineScore;
					this.orderItem.CPQ2_Capital_Cost__c = this.capitalCost;
					this.orderItem.CPQ2_Amortization__c = this.amortization;
					this.orderItem.CPQ2_Total_Capital_Charge__c = this.totalCapitalCharge;
				}
			}
            
            System.debug('~~Stamp Inactive Order Item~~' + this.orderItem.Active__c);            
            //CPQCN-570
            if(this.orderItem.Active__c==false){
                this.orderItem.CPQ2_Material_Cost__c = 0;
				this.orderItem.CPQ2_Duration_In_Minutes__c = 0;
				this.orderItem.CPQ2_Average_Cost_Minute__c = 0;
				this.orderItem.CPQ2_Line_Margin__c = 0;
				this.orderItem.CPQ2_Total_Revenue__c = 0;
				this.orderItem.CPQ2_Total_Costs__c = 0;
				this.orderItem.CPQ2_Number_Of_Visits_Per_Year__c = 0;

				this.orderItem.CPQ2_Capital_Cost__c = 0;
				this.orderItem.CPQ2_Amortization__c = 0;
				this.orderItem.CPQ2_Total_Capital_Charge__c = 0;
            }
            //CPQCN-570

			if(stampCalcs && (includeInNonServiceCalculation)) {
				this.orderItem.CPQ2_Line_Margin__c = this.lineMargin;
				this.orderItem.CPQ2_Line_Score_Colour__c = this.lineScore;
			}

			System.debug('*** stamping from: ' + this.frequency);
			System.debug('*** stamping to: ' + this.orderItem.Frequency__c);

			return this.orderItem;
		}
	}



	/**
	 * @description wrapper class for VMI request
	 */
	public class VmiRequest extends BaseItem{
		@AuraEnabled public CPQ2_VMI_Request__c vmiRequest;

		/**
		 * @description defined constructor
		 *
		 * @param oli - order line item to base the VMI request off of.
		 * @param parentKey - key of parent line item
		 */
		public VmiRequest(OpportunityLineItem oli, String parentKey){
			this.key = CPQ2_Util.getUUID();
			this.parentKey = parentKey;
			this.vmiRequest = new CPQ2_VMI_Request__c();
			this.vmiRequest.CPQ2_Opportunity__c = oli.OpportunityId;
			this.vmiRequest.CPQ2_Product__c = oli.Product2Id;
			this.vmiRequest.CPQ2_Pricebook_Entry_Id__c = oli.PricebookEntryId;
		}

		/**
		 * @description
		 *
		 * @param vmiRequest - target vmi to wrap against
		 * @param parentKey - line item key
		 */
		public VmiRequest(CPQ2_VMI_Request__c vmiRequest, String parentKey){
			this.key = CPQ2_Util.getUUID();
			this.parentKey = parentKey;
			this.vmiRequest = vmiRequest;
		}

		public override String getType(){
			return BASE_ITEM_TYPE_VMI_REQUEST;
		}

		public override String getObjectName(){
			return CPQ2_Util.SOBJECT_NAME_VMI;
		}
	}

	/**
	 * @description Wrapper class for Core List Price Request
	 */
	public class CoreListPriceRequest extends BaseItem{
		@AuraEnabled public CPQ2_Core_List_Price_Request__c coreListPriceRequest;

		/**
		 * @description defined constructor
		 *
		 * @param oli - target line item to base off of
		 * @param parentKey - parent lineItem key
		 */
		public CoreListPriceRequest(OpportunityLineItem oli, String parentKey){
			this.key = CPQ2_Util.getUUID();
			this.parentKey = parentKey;
			this.coreListPriceRequest = new CPQ2_Core_List_Price_Request__c();
			this.coreListPriceRequest.CPQ2_Opportunity__c = oli.OpportunityId;
			this.coreListPriceRequest.CPQ2_Product__c = oli.Product2Id;
			this.coreListPriceRequest.CPQ2_Pricebook_Entry_Id__c = oli.PricebookEntryId;
		}

		/**
		 * @description defined constructor
		 *
		 * @param coreListPriceRequest - existing core list price to base against
		 * @param parentKey - parent lineItem key
		 */
		public CoreListPriceRequest(CPQ2_Core_List_Price_Request__c coreListPriceRequest, String parentKey){
			this.key = CPQ2_Util.getUUID();
			this.parentKey = parentKey;
			this.coreListPriceRequest = coreListPriceRequest;
		}

		public override String getType(){
			return BASE_ITEM_TYPE_CORE_LIST_PRICE_REQUEST;
		}

		public override String getObjectName(){
			return CPQ2_Util.SOBJECT_NAME_OPP_CORE_LIST_PRICE;
		}
	}

	/**
	 * @description wrapper class to organize DML results
	 */
	public class DmlResult{
		@AuraEnabled public String objectName;
		@AuraEnabled public Boolean isSuccess = false;
		@AuraEnabled public Id recordId;
		@AuraEnabled public List<String> errors = new List<String>();
		@AuraEnabled public String key;
		@AuraEnabled public String childKey;
		@AuraEnabled public String action;

		/**
		 * @description defined constructor
		 *
		 * @param success - is success?
		 * @param recordId - DML'd recordId
		 * @param errors - list of errors
		 * @param key - parent key of line item
		 * @param childKey - key of core list price, vmi or recurring order if applicable
		 * @param action - DML action
		 * @param objectName - name of SObject
		 */
		public DmlResult(Boolean success, Id recordId, Database.Error[] errors, String key, String childKey,CPQ2_Util.DmlAction action, String objectName){
			this.isSuccess = success;
			this.recordId = recordId;
			this.key = key;
			this.childKey = childKey;
			this.objectName = objectName;
			this.action = CPQ2_Util.mapSaveActionToDmlResultType(action);

			for(Database.Error error: errors){
				this.errors.add(error.getMessage());
			}
		}
	}


	/**
	 * @description helper function to stamp all entities underlying Sobjects
	 *
	 * @param entityMap - map of entities to stamp
	 * @param stampDealScore - switch to determine if dealscore values get stamped
	 */
	public static void stampAllEntitySObjects(Map<Id,CPQ2_Wrapper.CpqEntity> entityMap, Boolean stampDealScore){
		for(CPQ2_Wrapper.CpqEntity entity: entityMap.values()){
			entity.stampSObjects(stampDealScore);
		}
	}


	/**
	 * @description saves all opportunities associated with a map of entities
	 *
	 * @param entityMap - entities containing opportunities to be saved
	 */
	public static void saveAllRelatedHeaders(Map<Id,CPQ2_Wrapper.CpqEntity> entityMap){
		List<Order> orderList = new List<Order>();
		List<Opportunity> opportunityList = new List<Opportunity>();

		for(CPQ2_Wrapper.CpqEntity entity: entityMap.values()){
			if(entity.header.order != null){
				orderList.add(entity.header.order);
			} else if (entity.header.opportunity != null){
				opportunityList.add(entity.header.opportunity);
			}
		}

		if(!opportunityList.isEmpty()){
			OpportunityService.updateOpportunities(opportunityList, true);
		}

		if(!orderList.isEmpty()){
			OrderService.updateOrders(orderList, true);
		}
	}

	/**
	 * @description saves all accounts associated with a map of entities
	 *
	 * @param entityMap  - entities containing accounts to be saved
	 */
	public static void saveAllRelatedAccounts(Map<Id,CPQ2_Wrapper.CpqEntity> entityMap){
		Map<Id,Account> accountMap = new Map<Id,Account>();

		for(CPQ2_Wrapper.CpqEntity entity: entityMap.values()){
			if(entity.accountItem.account != null){
				System.debug('Account Mapped ***: ' + entity.accountItem.account);
				accountMap.put(entity.accountItem.account.Id, entity.accountItem.account);
			}
		}

		AccountService.updateAccounts(accountMap.values(), true);
	}

	/**
	 * @description get opportunity lineitems, vmi requests and core list prices as a collection of base SOBjects
	 *
	 * @param baseItemList - list of items extending the BaseItem class
	 *
	 * @return target items as a list of SObjects
	 */
	public static List<SObject> convertBaseItems(List<CPQ2_Wrapper.BaseItem> baseItemList){
		List<SObject> sObjectsList = new List<SObject>();

		if(!baseItemList.isEmpty()){
			if(baseItemList[0].getType() == BASE_ITEM_TYPE_OPPORTUNITY_LINE_ITEM){
				sObjectsList = (List<SObject>) convertFromLineItemsToOpportunityLineItems((List<LineItem>) baseItemList);
			} else if(baseItemList[0].getType() == BASE_ITEM_TYPE_ORDER_LINE_ITEM) {
				sObjectsList = (List<SObject>) convertFromLineItemsToOrderLineItems((List<LineItem>) baseItemList);
			} else if(baseItemList[0].getType() == BASE_ITEM_TYPE_CORE_LIST_PRICE_REQUEST) {
				sObjectsList = (List<SObject>) convertFromLineItemsToCoreListPriceRequest((List<CoreListPriceRequest>) baseItemList);
			} else if(baseItemList[0].getType() == BASE_ITEM_TYPE_VMI_REQUEST) {
				sObjectsList = (List<SObject>) convertFromLineItemsToVmis((List<VmiRequest>) baseItemList);
			}
		}

		return sObjectsList;
	}

	/**
	 * @description perform DML insert for list of Sobjects
	 *
	 * @param sObjectsList - target list of Sobjects to insert
	 *
	 * @return DML result of the action
	 */
	public static Database.SaveResult[] createBaseItems(List<SObject> sObjectsList){
		Database.SaveResult[] saveResults;

		if(sObjectsList !=null && !sObjectsList.isEmpty()){
			String type = sObjectsList[0].getSObjectType().getDescribe().getName();

			if(type == CPQ2_Util.SOBJECT_NAME_OPP_LINE_ITEM){
				saveResults = OpportunityService.insertOpportunityProducts((List<OpportunityLineItem>) sObjectsList, false);
			} else if(type == CPQ2_Util.SOBJECT_NAME_ORDER_LINE_ITEM) {
				saveResults = OrderService.insertOrderItems((List<OrderItem>) sObjectsList, false);
				System.debug('createBaseItems Sanchivan saveResults: ' + saveResults);
			} else if(type == CPQ2_Util.SOBJECT_NAME_OPP_CORE_LIST_PRICE) {
				saveResults = OpportunityService.insertCoreListPriceRequest((List<CPQ2_Core_List_Price_Request__c>) sObjectsList, false);
			} else if(type == CPQ2_Util.SOBJECT_NAME_VMI) {
				saveResults = OpportunityService.insertVmiRequest((List<CPQ2_VMI_Request__c>) sObjectsList, false);
			}
		}

		return saveResults;
	}

	/**
	 * @description perform DML update for list of Sobjects
	 *
	 * @param sObjectsList - target list of Sobjects to update
	 *
	 * @return DML result of the action
	 */
	public static Database.SaveResult[] updateBaseItems(List<SObject> sObjectsList){
		Database.SaveResult[] saveResults;

		if(sObjectsList !=null && !sObjectsList.isEmpty()){
			String type = sObjectsList[0].getSObjectType().getDescribe().getName();

			if(type == CPQ2_Util.SOBJECT_NAME_OPP_LINE_ITEM){
				saveResults = OpportunityService.updateOpportunityProducts((List<OpportunityLineItem>) sObjectsList, false);
			} else if(type == CPQ2_Util.SOBJECT_NAME_ORDER_LINE_ITEM) {
				saveResults = OrderService.updateOrderItems((List<OrderItem>) sObjectsList, false);
			} else if(type == CPQ2_Util.SOBJECT_NAME_OPP_CORE_LIST_PRICE) {
				saveResults = OpportunityService.updateCoreListPriceRequest((List<CPQ2_Core_List_Price_Request__c>) sObjectsList, false);
			} else if(type == CPQ2_Util.SOBJECT_NAME_VMI) {
				saveResults = OpportunityService.updateVmiRequest((List<CPQ2_VMI_Request__c>) sObjectsList, false);
			}
		}

		return saveResults;
	}

	/**
	 * @description perform DML delete for list of Sobjects
	 *
	 * @param sObjectsList - target list of Sobjects to delete
	 *
	 * @return  DML result of the action
	 */
	public static Database.DeleteResult[] deleteBaseItems(List<SObject> sObjectsList){
		Database.DeleteResult[] deleteResults;

		if(sObjectsList !=null && !sObjectsList.isEmpty()){
			String type = sObjectsList[0].getSObjectType().getDescribe().getName();

			if(type == CPQ2_Util.SOBJECT_NAME_OPP_LINE_ITEM){
				deleteResults = OpportunityService.deleteOpportunityProducts((List<OpportunityLineItem>) sObjectsList, false);
			} else if(type == CPQ2_Util.SOBJECT_NAME_ORDER_LINE_ITEM) {
				deleteResults = OrderService.deleteOrderItems((List<OrderItem>) sObjectsList, false);
			} else if(type == CPQ2_Util.SOBJECT_NAME_OPP_CORE_LIST_PRICE) {
				deleteResults = OpportunityService.deleteCoreListPriceRequest((List<CPQ2_Core_List_Price_Request__c>) sObjectsList, false);
			} else if(type == CPQ2_Util.SOBJECT_NAME_VMI) {
				deleteResults = OpportunityService.deleteVmiRequest((List<CPQ2_VMI_Request__c>) sObjectsList, false);
			}
		}

		return deleteResults;
	}

	/**
	 * @description helper method to convert wrapper class to olis
	 *
	 * @param lineItems - wrappers to convert
	 *
	 * @return converted olis
	 */
	private static List<OpportunityLineItem> convertFromLineItemsToOpportunityLineItems(List<CPQ2_Wrapper.LineItem> lineItems){

		List<OpportunityLineItem> outputLineItems = new List<OpportunityLineItem>();

		for(CPQ2_Wrapper.LineItem li: lineItems){
			outputLineItems.add(li.stampOpportunityLineItem(false));
		}

		return outputLineItems;
	}

	/**
	 * @description helper method to convert wrapper class to order line items
	 *
	 * @param lineItems - wrappers to convert
	 *
	 * @return converted olis
	 */
	private static List<OrderItem> convertFromLineItemsToOrderLineItems(List<CPQ2_Wrapper.LineItem> lineItems){

		List<OrderItem> outputLineItems = new List<OrderItem>();

		for(CPQ2_Wrapper.LineItem li: lineItems){
			outputLineItems.add(li.stampOrderLineItem(false));
		}

		return outputLineItems;
	}

	/**
	 * @description  helper method to convert wrapper class to core list price
	 *
	 * @param listClpr - wrappers to convert
	 *
	 * @return converted core list price requests
	 */
	private static List<CPQ2_Core_List_Price_Request__c> convertFromLineItemsToCoreListPriceRequest(List<CPQ2_Wrapper.CoreListPriceRequest> listClpr){

		List<CPQ2_Core_List_Price_Request__c> outputList = new List<CPQ2_Core_List_Price_Request__c>();

		for(CPQ2_Wrapper.CoreListPriceRequest clpr: listClpr){
			outputList.add(clpr.coreListPriceRequest);
		}

		return outputList;
	}

	/**
	 * @description helper method to convert wrapper into VMI requests
	 *
	 * @param listVmi - wrappers to convert
	 *
	 * @return converted VMI requests
	 */
	private static List<CPQ2_VMI_Request__c> convertFromLineItemsToVmis(List<CPQ2_Wrapper.VmiRequest> listVmi){

		List<CPQ2_VMI_Request__c> outputList = new List<CPQ2_VMI_Request__c>();

		for(CPQ2_Wrapper.VmiRequest vmi: listVmi){
			outputList.add(vmi.vmiRequest);
		}

		return outputList;
	}

	/**
	 * @description based on the DML action filter out all VMI that would be modified by such action
	 *
	 * @param saveItems - list to filter out
	 * @param action - action to check against
	 *
	 * @return filtered list of VMI requests
	 */
	public static List<CPQ2_Wrapper.VmiRequest> getDmlListVmi(List<CPQ2_Wrapper.LineItem> saveItems, CPQ2_Util.DmlAction action){
		List<CPQ2_Wrapper.VmiRequest> vmiRequestDmlList = new List<CPQ2_Wrapper.VmiRequest>();

		for(CPQ2_Wrapper.LineItem li: saveItems) {
			if(li.vmiRequest != null){
				if (action == CPQ2_Util.DmlAction.ACTION_CREATE) {
					if (String.isEmpty(li.vmiRequest.vmiRequest.Id) && li.isVmi) {
						vmiRequestDmlList.add(li.vmiRequest);
					}
				} else if (action == CPQ2_Util.DmlAction.ACTION_DELETE) {
					if (!String.isEmpty(li.vmiRequest.vmiRequest.Id) && !li.isVmi) {
						vmiRequestDmlList.add(li.vmiRequest);
					}
				} else if (action == CPQ2_Util.DmlAction.ACTION_UPDATE) {
					if (!String.isEmpty(li.vmiRequest.vmiRequest.Id) && li.isVmi) {
						vmiRequestDmlList.add(li.vmiRequest);
					}
				}
			}
		}

		return vmiRequestDmlList;
	}

	/**
	 * @description  based on the DML action filter out all Core List Price Requests that would be modified by such action
	 *
	 * @param saveItems - list to filter out
	 * @param action - action to check against
	 *
	 * @return  filtered list of Core List Price Requests
	 */
	public static List<CPQ2_Wrapper.CoreListPriceRequest> getDmlListCoreListRequest(List<CPQ2_Wrapper.LineItem> saveItems, CPQ2_Util.DmlAction action){
		List<CPQ2_Wrapper.CoreListPriceRequest> clpRequestDmlList = new List<CPQ2_Wrapper.CoreListPriceRequest>();

		for(CPQ2_Wrapper.LineItem li: saveItems) {
			if(li.coreListPriceRequest != null) {
				if (action == CPQ2_Util.DmlAction.ACTION_CREATE) {
					if (String.isEmpty(li.coreListPriceRequest.coreListPriceRequest.Id) && li.isCoreListSubmitted) {
						clpRequestDmlList.add(li.coreListPriceRequest);
					}

				} else if (action == CPQ2_Util.DmlAction.ACTION_DELETE) {
					if (!String.isEmpty(li.coreListPriceRequest.coreListPriceRequest.Id) && !li.isCoreListSubmitted) {
						clpRequestDmlList.add(li.coreListPriceRequest);
					}

				} else if (action == CPQ2_Util.DmlAction.ACTION_UPDATE) {
					if (!String.isEmpty(li.coreListPriceRequest.coreListPriceRequest.Id) && li.isCoreListSubmitted) {
						clpRequestDmlList.add(li.coreListPriceRequest);
					}
				}
			}
		}

		return clpRequestDmlList;
	}

	/**
	 * @description  based on the DML action filter out all line items that would be modified by such action
	 *
	 * @param saveItems  - list to filter out
	 * @param action  - action to check against
	 *
	 * @return   filtered list of line item Requests
	 */
	public static List<CPQ2_Wrapper.LineItem> getDmlListLineItems(List<CPQ2_Wrapper.LineItem> saveItems, CPQ2_Util.DmlAction action){
		List<CPQ2_Wrapper.LineItem> dmlList = new List<CPQ2_Wrapper.LineItem>();

		for(CPQ2_Wrapper.LineItem li: saveItems){

			if(action == CPQ2_Util.DmlAction.ACTION_CREATE){
				if(li.quantity > 0 && String.isEmpty(li.id) && !li.isDeleted) {
					dmlList.add(li);
				}

				// handle recurring nested lineItems
				if(li.recurringItem != null && String.isEmpty(li.recurringItem.id) && li.recurringItem.isRecurring){
					dmlList.add(li.recurringItem);
				}

			} else if (action == CPQ2_Util.DmlAction.ACTION_DELETE){
				if(li.quantity > 0 && li.isDeleted && !String.isEmpty(li.id) ||
					li.quantity == 0 && !String.isEmpty(li.id)) {
					dmlList.add(li);
				}

				// handle recurring nested lineItems
				if(li.recurringItem != null && !String.isEmpty(li.recurringItem.id) && !li.recurringItem.isRecurring){
					dmlList.add(li.recurringItem);
				}

			} else if (action == CPQ2_Util.DmlAction.ACTION_UPDATE) {
				if(li.quantity > 0 && !li.isDeleted && !String.isEmpty(li.id)) {
					dmlList.add(li);
				}

				// handle recurring nested lineItems
				if(li.recurringItem != null && !String.isEmpty(li.recurringItem.id) && li.recurringItem.isRecurring){
					dmlList.add(li.recurringItem);
				}
			}

		}

		return dmlList;
	}


	/**
	 * @description helper method to convert DML delete results into wrapper form
	 *
	 * @param deleteResults - target delete results to convert
	 * @param baseItems - list of target items associated to results
	 * @param action - dml action taken
	 *
	 * @return converted DML results
	 */
	public static List<CPQ2_Wrapper.DmlResult> handleDeleteResultDmlConversion(Database.DeleteResult[] deleteResults, List<CPQ2_Wrapper.BaseItem> baseItems, CPQ2_Util.DmlAction action){
		List<CPQ2_Wrapper.DmlResult> dmlResults = new List<CPQ2_Wrapper.DmlResult>();

		if (deleteResults != null) {
			for (Integer i = 0; i < deleteResults.size(); i++) {
				Database.DeleteResult result = deleteResults[i];
				dmlResults.add(new CPQ2_Wrapper.DmlResult(result.isSuccess(),
					result.getId(),
					result.getErrors(),
					baseItems[i].parentKey,
					baseItems[i].key,
					action,
					baseItems[i].getObjectName()));
			}
		}

		return dmlResults;
	}

	/**
	 * @description  helper method to convert DML save results into wrapper form
	 *
	 * @param saveResults  - target delete results to convert
	 * @param baseItems  - list of target items associated to results
	 * @param action  - dml action taken
	 *
	 * @return  converted DML results
	 */
	public static List<CPQ2_Wrapper.DmlResult> handleSaveResultDmlConversion(Database.SaveResult[] saveResults, List<CPQ2_Wrapper.BaseItem> baseItems, CPQ2_Util.DmlAction action){
		List<CPQ2_Wrapper.DmlResult> dmlResults = new List<CPQ2_Wrapper.DmlResult>();

		if (saveResults != null) {
			for (Integer i = 0; i < saveResults.size(); i++) {
				Database.SaveResult result = saveResults[i];
				dmlResults.add(new CPQ2_Wrapper.DmlResult(result.isSuccess(),
					result.getId(),
					result.getErrors(),
					baseItems[i].parentKey,
					baseItems[i].key,
					action,
					baseItems[i].getObjectName()));
			}
		}

		return dmlResults;
	}

	/**
	 * @description helper method to handle DML of baseItems
	 *
	 * @param baseItemList - base items to DML
	 * @param action - DML action
	 *
	 * @return wrapper results of the DML action
	 */
	public static List<CPQ2_Wrapper.DmlResult> handleBaseItemDML(List<CPQ2_Wrapper.BaseItem> baseItemList, CPQ2_Util.DmlAction action){
		List<CPQ2_Wrapper.DmlResult> dmlResults = new List<CPQ2_Wrapper.DmlResult>();

		if(baseItemList != null && !baseItemList.isEmpty()){
			List<SObject> sObjectList = CPQ2_Wrapper.convertBaseItems(baseItemList);
			System.debug('Sanchivan sObjectList[0] : ' + sObjectList[0]);

			Database.SaveResult[] saveResults;
			Database.DeleteResult[] deleteResults;

			if(action == CPQ2_Util.DmlAction.ACTION_CREATE){
				saveResults = CPQ2_Wrapper.createBaseItems(sObjectList);
			} else if (action == CPQ2_Util.DmlAction.ACTION_DELETE){
				deleteResults = CPQ2_Wrapper.deleteBaseItems(sObjectList);
			} else if (action == CPQ2_Util.DmlAction.ACTION_UPDATE) {
				System.debug('Sanchivan CPQ2_Wrapper.updateBaseItems: ' + sObjectList);
				saveResults = CPQ2_Wrapper.updateBaseItems(sObjectList);
			}
			System.debug('Sanchivan sObjectList : ' + sObjectList);
			System.debug('Sanchivan saveResults: ' + saveResults);

			dmlResults.addAll(handleDmlConversion(saveResults, deleteResults, baseItemList, action));
		}

		return dmlResults;
	}

	/**
	 * @description helper method to help facilitate the conversion of results into wrapper equivalents
	 *
	 * @param saveResults - target save results
	 * @param deleteResults - target delete results
	 * @param baseItems - associated base items
	 * @param action - defined action
	 *
	 * @return list of wrapper results for defined DML action.
	 */
	public static List<CPQ2_Wrapper.DmlResult> handleDmlConversion(Database.SaveResult[] saveResults, Database.DeleteResult[] deleteResults, List<CPQ2_Wrapper.BaseItem> baseItems, CPQ2_Util.DmlAction action){
		List<CPQ2_Wrapper.DmlResult> dmlResults = new List<CPQ2_Wrapper.DmlResult>();

		if(action == CPQ2_Util.DmlAction.ACTION_CREATE || action == CPQ2_Util.DmlAction.ACTION_UPDATE){
			if(saveResults != null){
				dmlResults.addAll(CPQ2_Wrapper.handleSaveResultDmlConversion(saveResults, baseItems, action));
			}
		} else if (action == CPQ2_Util.DmlAction.ACTION_DELETE) {
			if(deleteResults != null) {
				dmlResults.addAll(CPQ2_Wrapper.handleDeleteResultDmlConversion(deleteResults, baseItems, action));
			}
		}

		return dmlResults;
	}
}