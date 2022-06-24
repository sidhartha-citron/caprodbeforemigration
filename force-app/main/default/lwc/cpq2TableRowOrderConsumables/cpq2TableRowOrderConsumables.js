/**
 * Created by timothychiang on 2020-04-13.
 */

import { api, track } from "lwc";

import Cpq2TableRowNonServiceBase from "c/cpq2TableRowNonServiceBase";
export default class Cpq2TableRowOrderConsumables extends Cpq2TableRowNonServiceBase {

	privateIsRequestedPriceApproved;
	privateOldPrice;
	privateRequestedPrice;
	privateFrequency;

	@track isRequestedPriceApproved;

	@track isActive;

	get rowReadOnly(){
		return !this.isActive;
	}

	get approvalOptions() {
		return [
			{ label: '', value: '' },
			{ label: 'Yes', value: 'Yes' },
			{ label: 'No', value: 'No' },
		];
	}

	get frequency(){
		return this.privateFrequency;
	}

	set frequency(value) {
		this.privateFrequency = value;
	}

	get disableLineScore(){
		return !this.isActive;
	}

	get requestedPrice(){
		return this.privateRequestedPrice;
	}

	set requestedPrice(value){		
		if(value && (this.isRequestedPriceApproved === 'Yes' || this.isRequestedPriceApproved === 'No')) {
			this.requestedPriceApprovalHelper('');
		}
		
		this.privateRequestedPrice = value !== "" ? value : null;
	}

	// get isRequestedPriceApproved(){
	// 	if(this.privateIsRequestedPriceApproved){
	// 		return 'Yes';
	// 	} else {
	// 		return '';
	// 	}
	// }

	// set isRequestedPriceApproved(value){
	// 	if(value === 'Yes'){
	// 		this.privateIsRequestedPriceApproved = true;
	// 		this.purchasePrice = this.requestedPrice;
	// 	} else if (value === 'No'){
	// 		this.privateIsRequestedPriceApproved = false;
	// 		this.requestedPrice = undefined;
	// 	} else {
	// 		this.privateIsRequestedPriceApproved = false;
	// 		this.purchasePrice = this.privateOldPrice;
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
			this.purchasePrice = this.requestedPrice;
		} else if (value === 'No'){
			this.isRequestedPriceApproved = 'No';
			this.privateIsRequestedPriceApproved = false;
			this.requestedPrice = undefined;
			this.purchasePrice = this.privateOldPrice;
		} else {
			this.isRequestedPriceApproved = '';
			this.privateIsRequestedPriceApproved = false;
			this.purchasePrice = this.privateOldPrice;
		}
	}

	get showDelete(){
		return !this.lineItem.id;
	}

	get quantity(){
		return this.privateQuantity;
	}

	set quantity(value){
		this.privateQuantity = value;
	}

	get showQuantity() {
		if(this.lineItem.id) {
			return false;
		}
		else {
			return true;
		}
	}

	get isApprovalDisabled(){
		return (!this.hasAccessToApproval || this.requestedPrice == null || this.rowReadOnly);
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


	get allowableFrequencies(){
		let optionText = this.lineItem.productInfo.priceBookEntry.Product2.Allowable_Frequencies__c.split(';');
		let options = [];
		for(let i=0; i < optionText.length; i++){
			options.push({ label: optionText[i], value: optionText[i] });
		}

		return options;
	}

	get coreListPrice(){
		let price;

		if(this.lineItem.productInfo.contractPriceSummary){
			price = this.lineItem.productInfo.contractPriceSummary.lowestApplicablePrice;
		}

		return price;
	}


	connectedCallback(){
		this.isPartOfPriceModel = true;
		this.privateHandleChange = this.handleChange.bind(this);

		let hasDefaultBeenSet = false;

		//CPQCN-568 2021-01-18 Darcy: testing for null so $0 gets through
		if(this.lineItem.purchasePrice != null){
			this.privatePurchasePrice = this.lineItem.purchasePrice;
			this.privateOldPrice = this.lineItem.purchasePrice;
		} else {
			this.privatePurchasePrice = this.calculateExistingPrice();
			this.privateOldPrice = this.calculateExistingPrice();
			hasDefaultBeenSet = true;
		}

		if(this.lineItem.frequency){
			this.privateFrequency = this.lineItem.frequency;
		} else {
			this.privateFrequency = 'One-Time'
		}

		if(this.lineItem.description){
			this.lineNotes = this.lineItem.description;
		}

		if(this.lineItem.quantity){
			this.privateQuantity = this.lineItem.quantity;
		} else {
			this.privateQuantity = 1;
			hasDefaultBeenSet = true;
		}

		// if(this.lineItem.requestedPriceApproved){
		// 	this.privateIsRequestedPriceApproved = this.lineItem.requestedPriceApproved;
		// } else {
		// 	this.privateIsRequestedPriceApproved = false;
		// }

		if(this.lineItem.requestedPriceApproved){
			this.privateIsRequestedPriceApproved = this.lineItem.requestedPriceApproved;
			// this.privateIsRequestedPriceApprovedText = 'Yes';
			this.isRequestedPriceApproved = 'Yes';
		} else {
			this.privateIsRequestedPriceApproved = false;
			// this.privateIsRequestedPriceApprovedText = '';
			this.isRequestedPriceApproved = '';
		}

		this.isActive = this.lineItem.isActive;

		if(this.lineItem.requestedPrice != null){
			this.privateRequestedPrice = this.lineItem.requestedPrice;
		}

		if(hasDefaultBeenSet){
			this.handleChange();
		}


	}

	handleChange() {
		const consumableChangeEvent = new CustomEvent('linechange', {
			detail: {
				changeType: this.PRODUCT_ITEM_TYPE_CONSUMABLES,
				key: this.lineItem.key,
				quantity: this.privateQuantity,
				frequency: this.privateFrequency,
				purchasePrice: this.purchasePrice,
				lineNotes: this.lineNotes,
				active: this.isActive,
				requestedPriceApproved: this.privateIsRequestedPriceApproved,
				requestedPrice: this.privateRequestedPrice
			}
		});

		// Fire the custom event
		this.dispatchEvent(consumableChangeEvent);
	}
}