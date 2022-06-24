/**
 * Created by timothychiang on 2020-03-14.
 */

import { api, track } from "lwc";

import Cpq2TableRowBase from "c/cpq2TableRowBase";
export default class Cpq2TableRowOrderService extends Cpq2TableRowBase {

	privateFrequency;
	privateServicePrice;
	privateRequestedPrice;

	privateIsRequestedPriceApproved;
	privateOldPrice;
	privateActive;

	privateQuantity;

	// privateIsRequestedPriceApprovedText;

	@track isRequestedPriceApproved;


	@api frequencyMap;

	@track installationStatus;
	@track installationPrice;
	@track installTotal;
	@track relatedProduct;
	@track relatedProductLabel;
	@track monthlyRR;
	@track weeklyRR;
	@track totalPerService;
	@track areaOfCoverage;
	@track areaOfCoverageOther;
	@track coveredPests;
	@track coveredPestsOther;
	@track serviceNotes;

	@track isPestDataVisible = false;

	get quantity(){
		return this.privateQuantity;
	}

	set quantity(value){
		this.privateQuantity = value;
		this.handleShipToScoreStale();
	}

	get showQuantity() {
		if(this.lineItem.id) {
			return false;
		}
		else {
			return true;
		}
	}

	get rowReadOnly(){
		return !this.isActive;
	}

	get isActive(){
		return this.privateActive;
	}

	set isActive(value){
		this.privateActive = value;
		this.handleShipToScoreStale();
	}

	get disableLineScore(){
		return !this.isActive;
	}

	get approvalOptions() {
		return [
			{ label: '', value: '' },
			{ label: 'Yes', value: 'Yes' },
			{ label: 'No', value: 'No' },
		];
	}

	get isApprovalDisabled(){
		return (!this.hasAccessToApproval || this.requestedPrice == null || this.rowReadOnly);
	}

	get requestedPrice(){
		return this.privateRequestedPrice;
	}

	set requestedPrice(value){		
		// this.isRequestedPriceApproved = '';
		if(value && (this.isRequestedPriceApproved === 'Yes' || this.isRequestedPriceApproved === 'No')) {
			this.requestedPriceApprovalHelper('');
		}
		
		this.privateRequestedPrice = value !== "" ? value : null;
		console.log("+++privateRequestedPrice+++ " + this.privateRequestedPrice);
	}

	// get isRequestedPriceApproved(){
	// 	// if(this.privateIsRequestedPriceApproved){
	// 	// 	return 'Yes';
	// 	// } else {
	// 	// 	return '';
	// 	// }
	// 	return this.privateIsRequestedPriceApprovedText;
	// }

	// set isRequestedPriceApproved(value){
	// 	if(value === 'Yes'){
	// 		this.privateIsRequestedPriceApprovedText = 'Yes';
	// 		this.privateIsRequestedPriceApproved = true;
	// 		this.servicePrice = this.requestedPrice;
	// 	} else if (value === 'No'){
	// 		this.privateIsRequestedPriceApprovedText = 'No';
	// 		this.privateIsRequestedPriceApproved = false;
	// 		this.requestedPrice = undefined;
	// 	} else {
	// 		this.privateIsRequestedPriceApprovedText = '';
	// 		this.privateIsRequestedPriceApproved = false;
	// 		this.servicePrice = this.privateOldPrice;
	// 	}
	// }

	requestedPriceApprovedChanged(event){
		let selectedValue = event.target.value;
		this.requestedPriceApprovalHelper(selectedValue);

		this.privateGenericOnChangeFunctions.forEach((entry)=>{
			entry();
		});

		if( typeof this.privateHandleChange === "function"){
			this.privateHandleChange();
		}
	}

	requestedPriceApprovalHelper(value) {
		if(value === 'Yes'){
			this.isRequestedPriceApproved = 'Yes';
			this.privateIsRequestedPriceApproved = true;
			this.servicePrice = this.requestedPrice;
		} else if (value === 'No'){
			this.isRequestedPriceApproved = 'No';
			this.privateIsRequestedPriceApproved = false;
			//this.requestedPrice = undefined;
			this.servicePrice = this.privateOldPrice;
		} else {
			this.isRequestedPriceApproved = '';
			this.privateIsRequestedPriceApproved = false;
			this.servicePrice = this.privateOldPrice;
		}
	}

	get servicePrice(){
		return this.privateServicePrice;
	}

	set servicePrice(value) {
		this.privateServicePrice = value;
		this.handleShipToScoreStale();
	}

	get showDelete(){
		return !this.lineItem.id;
	}

	get whereRelatedPickListWhereClause(){
		return 'CPQ2_Show_as_Related_Product__c=TRUE AND CPQ2_Parent_Product__c=\'' + this.lineItem.productId + '\'';
	}

	get existingPrice(){
		let price;

		if(this.lineItem.productInfo.contractPriceSummary){
			price = this.lineItem.productInfo.contractPriceSummary.lowestApplicablePrice;
		} else if(this.lineItem.productInfo.orderFrequencyMap && this.frequency in this.lineItem.productInfo.orderFrequencyMap){
			price = this.lineItem.productInfo.orderFrequencyMap[this.frequency].maxServicePrice;
		} else if(this.lineItem.productInfo.orderFrequencyMap){
			price = this.determineMaxExistingPrice();
		}

		return price;
	}

	get coreListPrice(){
		let price;

		if(this.lineItem.productInfo.contractPriceSummary){
			price = this.lineItem.productInfo.contractPriceSummary.lowestApplicablePrice;
		}

		return price;
	}

	get existingOrderPrice(){
		let price;

		if(this.lineItem.productInfo.orderFrequencyMap && this.frequency in this.lineItem.productInfo.orderFrequencyMap){
			price = this.lineItem.productInfo.orderFrequencyMap[this.frequency].maxServicePrice;
		} else if(this.lineItem.productInfo.orderFrequencyMap){
			price = this.determineMaxExistingPrice();
		}

		return price;
	}

	get pestFieldsEnabled(){
		return (this.lineItem.productInfo.priceBookEntry.Product2.CPQ2_Enable_Additional_Pest_Fields__c);
	}

	get showDiscount(){
		return (this.discount > 0);
	}

	get discount(){
		if(this.lineItem.productInfo.priceBookEntry.UnitPrice && this.privateRequestedPrice && this.privateRequestedPrice !==0){
			return (this.lineItem.productInfo.priceBookEntry.UnitPrice - this.privateRequestedPrice)/this.lineItem.productInfo.priceBookEntry.UnitPrice;
		} else {
			return undefined;
		}
	}

	get isAreaOfCoverageOtherRequired(){
		let isRequired = false;

		if(this.areaOfCoverage){
			isRequired = this.areaOfCoverage.split(';').includes('Other');
		}

		return isRequired;
	}

	get isCoveredPestsOtherRequired(){
		let isRequired = false;

		if(this.coveredPests){
			isRequired = this.coveredPests.split(';').includes('Other');
		}

		return isRequired;
	}

	get isInstallationPriceRequired(){
		return !!this.installationStatus;
	}

	get isInstallationPriceReadOnly(){
		return (!!!this.installationStatus || (this.installationStatus === 'Replace' && this.frequency === 'One-Time'));
	}	

	get frequency(){
		return this.privateFrequency;
	}
	set frequency(value) {
		this.privateFrequency = value;
		this.figureOutPrepopulatedPrice();
		if(this.installationStatus === 'Replace'){
			if(value === 'One-Time'){
				this.installationPrice = 0;
				this.requestedPriceApprovalBypass(true);
			}
			else{
				this.requestedPriceApprovalBypass(false);
			}
		}
		this.handleShipToScoreStale();
	}
	//
	// get productName(){
	// 	return this.split(this.productInfo.Name, ',', 1);
	// }

	get productInfo(){
		return this.lineItem.productInfo.priceBookEntry.Product2;
	}

	get pricebookInfo(){
		return this.lineItem.productInfo.priceBookEntry;
	}

	get allowableFrequencies(){
		let optionText = this.lineItem.productInfo.priceBookEntry.Product2.Allowable_Frequencies__c.split(';');
		let options = [];
		for(let i=0; i < optionText.length; i++){
			options.push({ label: optionText[i], value: optionText[i] });
		}

		return options;
	}

	connectedCallback(){
		this.privateValidationFunctions.push(this.isPestValid.bind(this));
		this.privateHandleChange = this.handleChange.bind(this);
		this.privateGenericOnChangeFunctions.push(this.refreshCalculations.bind(this));
		this.privateGenericOnChangeFunctions.push(this.refreshInstall.bind(this));

		if(this.lineItem.productInfo.priceBookEntry.Product2.CPQ_Price_Model__c === this.CPQ2_HYGIENE_PRICE_MODEL){
			this.isPartOfPriceModel = true;
		}

		// this.quantity = 1;
		if(this.lineItem.quantity){
			this.privateQuantity = this.lineItem.quantity;
		} else {
			this.quantity = 1;
			//hasDefaultBeenSet = true;
		}

		if(this.lineItem.frequency){
			this.privateFrequency = this.lineItem.frequency;
		} else {
			// this.frequency = 'Monthly'
			// hasDefaultBeenSet = true;
		}

		//CPQCN-568 2021-01-18 Darcy: testing for null so $0 gets through
		if(this.lineItem.servicePrice != null){
			this.privateServicePrice = this.lineItem.servicePrice;
		} else {
			this.privateServicePrice = this.lineItem.productInfo.priceBookEntry.UnitPrice;
			//this.privateServicePrice = this.figureOutPrepopulatedPrice();
		}
		this.privateOldPrice = this.privateServicePrice;

		if(this.lineItem.installationStatus){
			this.installationStatus = this.lineItem.installationStatus;
		}

		if(this.lineItem.installationPrice || this.lineItem.installationPrice === 0){
			this.installationPrice = this.lineItem.installationPrice;
		}

		if(this.lineItem.areaOfCoverage){
			this.areaOfCoverage = this.lineItem.areaOfCoverage;
		}

		if(this.lineItem.areaOfCoverageOther){
			this.areaOfCoverageOther = this.lineItem.areaOfCoverageOther;
		}

		if(this.lineItem.coveredPests){
			this.coveredPests = this.lineItem.coveredPests;
		}

		if(this.lineItem.coveredPestsOther){
			this.coveredPestsOther = this.lineItem.coveredPestsOther;
		}

		if(this.lineItem.serviceNotes){
			this.serviceNotes = this.lineItem.serviceNotes;
		}

		if(this.lineItem.relatedProduct){
			this.relatedProduct = this.lineItem.relatedProduct;
		}

		if(this.lineItem.requestedPriceApproved){
			this.privateIsRequestedPriceApproved = this.lineItem.requestedPriceApproved;
			// this.privateIsRequestedPriceApprovedText = 'Yes';
			this.isRequestedPriceApproved = 'Yes';
		} else {
			this.privateIsRequestedPriceApproved = false;
			// this.privateIsRequestedPriceApprovedText = '';
			this.isRequestedPriceApproved = '';
		}

		if(this.lineItem.requestedPrice != null){
			this.privateRequestedPrice = this.lineItem.requestedPrice;
		}

		this.isActive = this.lineItem.isActive;

		this.refreshCalculations();
		this.refreshInstall();
		this.handleChange();
	}

	determineMaxExistingPrice(){
		let price;

		for (let key in this.lineItem.productInfo.orderFrequencyMap){
			let entry = this.lineItem.productInfo.orderFrequencyMap[key].maxServicePrice;
			if(price){
				price = Math.max(price, entry);
			} else {
				price = entry;
			}
		}

		return price;
	}

	figureOutPrepopulatedPrice(){
		if(this.servicePrice == null){
			if(this.existingPrice){
				this.servicePrice = this.existingPrice;
			} else {
				this.servicePrice = this.lineItem.productInfo.priceBookEntry.UnitPrice;
			}
		}
	}

	installationStatusOnChange(event){
		this.installationStatus = event.detail.value;

		if(this.installationStatus === 'Install') {
			this.installationPrice = this.lineItem.productInfo.priceBookEntry.CPQ2_Installation_Unit_Price__c;
			this.requestedPriceApprovalBypass(false);
		} else if(this.installationStatus === 'Replace'){
			if (this.frequency === 'One-Time') {
				this.installationPrice = 0;
				this.requestedPriceApprovalBypass(true);
			}
			else {
				this.installationPrice = this.lineItem.productInfo.priceBookEntry.CPQ2_Replacement_Price__c;
			}
		} else if(this.installationStatus === 'Remove'){
			this.installationPrice = this.lineItem.productInfo.priceBookEntry.CPQ2_Removal_Price__c;
			this.requestedPriceApprovalBypass(false);
		} else {
			this.installationPrice = null;
			this.requestedPriceApprovalBypass(false);
		}
		this.refreshInstall();
		this.handleChange();
	}

	requestedPriceApprovalBypass(value) {
		if (value === true) {
			if(this.requestedPrice == null || this.requestedPrice == 0){
				this.requestedPrice = 0;
				this.requestedPriceApprovalHelper('Yes');
			}
		}
		else {
			this.isRequestedPriceApproved = '';
			this.requestedPriceApprovalHelper('');
		}
	}

	refreshInstall(){
		if(this.installationPrice){
			this.installTotal = this.installationPrice * this.quantity;
		} else {
			this.installTotal = undefined;
		}
	}

	refreshCalculations(){
		if(this.quantity && this.privateServicePrice != null && this.frequency){
			this.totalPerService = this.quantity * this.privateServicePrice;
			let annualFrequency = this.totalPerService * this.frequencyMap[this.frequency].Occurrences_In_Year__c;
			this.weeklyRR = annualFrequency/52;
			this.monthlyRR = annualFrequency/12;
		}
	}

	handleChange() {
		const serviceChangeEvent = new CustomEvent('linechange', {
			detail: {
				changeType: this.PRODUCT_ITEM_TYPE_SERVICE,
				key: this.lineItem.key,
				// quantity: this.quantity,
				quantity: this.privateQuantity,
				servicePrice: this.privateServicePrice,
				frequency: this.privateFrequency,
				installationStatus: this.installationStatus,
				installationPrice: this.installationPrice,
				installTotal: this.installTotal,
				relatedProduct: this.relatedProduct,
				areaOfCoverage: this.areaOfCoverage,
				areaOfCoverageOther: this.areaOfCoverageOther,
				coveredPests: this.coveredPests,
				coveredPestsOther: this.coveredPestsOther,
				relatedProductName: this.relatedProductLabel,
				active: this.isActive,
				requestedPriceApproved: this.privateIsRequestedPriceApproved,
				requestedPrice: this.privateRequestedPrice,
				serviceNotes: this.serviceNotes
			}
		});

		console.log('**** EVENT ' + JSON.stringify(serviceChangeEvent));

		// Fire the custom event
		this.dispatchEvent(serviceChangeEvent);
	}

	isPestValid(){
		//CPQCN-399 Darcy 20201201 not requiring values on orders
		//when this is enabled again, update the html for these fields as required 
		let pestIsValid = true;
		//let pestIsValid = !(this.pestFieldsEnabled && !(this.areaOfCoverage && this.coveredPests));

		if(!pestIsValid){
			this.privateErrorMsgList.push('Please provide more details. Please click on the Show More button to view/edit details');
		}

		return pestIsValid;
	}

	showPest(){
		if(this.checkJustFieldValidation()){
			this.isPestDataVisible = true;
		}
	}

	hidePest(){
		if(this.checkJustFieldValidation()){
			this.isPestDataVisible = false;
		}
	}
}