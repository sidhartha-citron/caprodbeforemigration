/**
 * Created by timothychiang on 2020-03-14.
 */

import { api, track } from "lwc";

import Cpq2TableRowBase from "c/cpq2TableRowBase";
export default class Cpq2TableRowService extends Cpq2TableRowBase {

	privateFrequency;
	privateQuantity;
	privateServicePrice;

	@api frequencyMap;

	// @track existingPrice;
	@track installationStatus;
	@track installationPrice;
	@track installTotal;
	@track lineNotes;
	@track relatedProduct;
	@track relatedProductLabel;
	@track monthlyRR;
	@track weeklyRR;
	@track totalPerService;
	@track areaOfCoverage;
	@track areaOfCoverageOther;
	@track coveredPests;
	@track coveredPestsOther;

	@track isPestDataVisible = false;

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
		if(this.lineItem.productInfo.priceBookEntry.UnitPrice && this.privateServicePrice && this.privateServicePrice !==0){
			return (this.lineItem.productInfo.priceBookEntry.UnitPrice - this.privateServicePrice)/this.lineItem.productInfo.priceBookEntry.UnitPrice;
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
		return !!!this.installationStatus;
	}

	get servicePrice(){
		return this.privateServicePrice;
	}

	set servicePrice(value){
		this.privateServicePrice = value;
		this.handleShipToScoreStale();
	}


	get quantity(){
		return this.privateQuantity;
	}

	set quantity(value){
		this.privateQuantity = value;
		this.handleShipToScoreStale();
	}

	get frequency(){
		return this.privateFrequency;
	}
	set frequency(value) {
		this.privateFrequency = value;
		this.figureOutPrepopulatedPrice();
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
		let options = [];
		let allow_freq = this.lineItem.productInfo.priceBookEntry.Product2.Allowable_Frequencies__c;
		if(allow_freq==null){return options;}

		let optionText = this.lineItem.productInfo.priceBookEntry.Product2.Allowable_Frequencies__c.split(';');
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

		let hasDefaultBeenSet = false;

		if(this.lineItem.productInfo.priceBookEntry.Product2.CPQ_Price_Model__c === this.CPQ2_HYGIENE_PRICE_MODEL){
			this.isPartOfPriceModel = true;
		}

		if(this.lineItem.quantity){
			this.privateQuantity = this.lineItem.quantity;
		} else {
			this.quantity = 1;
			hasDefaultBeenSet = true;
		}

		if(this.lineItem.frequency){
			this.privateFrequency = this.lineItem.frequency;
		} else {
			// this.frequency = 'Monthly'
			// hasDefaultBeenSet = true;
		}

		console.log("~~Service Price~~" + this.lineItem.servicePrice);
		if(this.lineItem.servicePrice!=null){
			this.privateServicePrice = this.lineItem.servicePrice;
		} else {
			this.privateServicePrice = this.lineItem.productInfo.priceBookEntry.UnitPrice;
			// this.figureOutPrepopulatedPrice();
			// hasDefaultBeenSet = true;
		}

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

		if(this.lineItem.description){
			this.lineNotes = this.lineItem.description;
		}

		if(this.lineItem.relatedProduct){
			this.relatedProduct = this.lineItem.relatedProduct;
		}

		this.refreshCalculations();
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
		if(!this.servicePrice){
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
		} else if(this.installationStatus === 'Replace'){
			this.installationPrice = this.lineItem.productInfo.priceBookEntry.CPQ2_Replacement_Price__c;
		} else if(this.installationStatus === 'Remove'){
			this.installationPrice = this.lineItem.productInfo.priceBookEntry.CPQ2_Removal_Price__c;
		} else {
			this.installationPrice = null;
		}
		this.refreshInstall();
		this.handleChange();
	}

	refreshInstall(){
		if(this.installationPrice){
			this.installTotal = this.installationPrice * this.privateQuantity;
		} else {
			this.installTotal = undefined;
		}
	}

	refreshCalculations(){
		if(this.privateQuantity && this.privateServicePrice && this.frequency){
			this.totalPerService = this.privateQuantity * this.privateServicePrice;
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
				quantity: this.privateQuantity,
				servicePrice: this.privateServicePrice,
				frequency: this.privateFrequency,
				installationStatus: this.installationStatus,
				installationPrice: this.installationPrice,
				installTotal: this.installTotal,
				lineNotes: this.lineNotes,
				relatedProduct: this.relatedProduct,
				areaOfCoverage: this.areaOfCoverage,
				areaOfCoverageOther: this.areaOfCoverageOther,
				coveredPests: this.coveredPests,
				coveredPestsOther: this.coveredPestsOther,
				relatedProductName: this.relatedProductLabel
			}
		});

		// Fire the custom event
		this.dispatchEvent(serviceChangeEvent);
	}

	isPestValid(){
		let pestIsValid = !(this.pestFieldsEnabled && !(this.areaOfCoverage && this.coveredPests));

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