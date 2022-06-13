/**
 * Created by timothychiang on 2020-04-13.
 */

import { api, track } from "lwc";

import Cpq2TableRowNonServiceBase from "c/cpq2TableRowNonServiceBase";
export default class Cpq2TableRowConsumables extends Cpq2TableRowNonServiceBase {

	privateIsVmi = false;

	@api isVmiServicePresent = false;
	@track isRecurring = false;
	@track recurringFrequency;
	@track recurringQuantity;
	@track isVmiDisabled = false;
	@track vmiParLevel;
	
	get quantity(){
		return this.privateQuantity;
	}

	set quantity(value){
		this.privateQuantity = value;
		if(this.privateQuantity < 1){
			this.isLineItemFieldsDisabled = true;
			this.isPurchasePriceRequired = false;
			this.isPartOfPriceModel = false;
		} else {
			this.isPurchasePriceRequired = true;
			this.isLineItemFieldsDisabled = false;
			this.isPartOfPriceModel = true;
		}
	}

	get isVmi(){
		return this.privateIsVmi;
	}

	set isVmi(value){
		if(value && !this.isVmiServicePresent){
			this.fireToast('VMI Service is not present',
				'You have enabled a VMI product without an VMI Service, Please add a VMI Service.',
				'warning');
		}

		this.privateIsVmi = value;
	}

	//CPQCN-547 2021-01-12 Darcy - Recurring and VMI checkboxes cannot be checked at the same time. Checking one will disable the other
	get isRecurringCheckboxDisabled() {
		return (this.isVmi);
	}

	get isVmiCheckboxDisabled(){
		return (this.isVmiDisabled || this.isRecurring);
	}

	get isRecurringLineDisabled() {
		return (!this.isRecurring);
	}

	get isVmiLineDisabled(){
		return (!this.isVmi);
	}

	get allowableFrequencies(){
		let optionText = this.lineItem.productInfo.priceBookEntry.Product2.Allowable_Frequencies__c.split(';');
		let options = [];
		for(let i=0; i < optionText.length; i++){
			if(optionText[i] !== 'One-Time') {
				options.push({ label: optionText[i], value: optionText[i] });
			}			
		}

		return options;
	}

	connectedCallback(){

		this.privateHandleChange = this.handleChange.bind(this);

		let hasDefaultBeenSet = false;

		if(!this.lineItem.productInfo.priceBookEntry.Product2.VMI_Product__c){
			this.isVmiDisabled = true;
		}

		this.isCoreListPriceAlreadyExists = (this.lineItem.productInfo.contractPriceSummary && this.lineItem.productInfo.contractPriceSummary);

		if(this.lineItem.purchasePrice!=null){
			this.privatePurchasePrice = this.lineItem.purchasePrice;
		} else {
			this.privatePurchasePrice = this.calculateExistingPrice();
			hasDefaultBeenSet = true;
		}

		if(this.lineItem.description){
			this.lineNotes = this.lineItem.description;
		}

		if(this.lineItem.isCoreListSubmitted){
			this.privateIsCoreListPrice = this.lineItem.isCoreListSubmitted;
		}
		//CPQCN-568 2021-01-18 Darcy
		if(this.lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_Requested_Price__c != null){
			this.privateCoreListPrice = this.lineItem.coreListPriceRequest.coreListPriceRequest.CPQ2_Requested_Price__c;
		} else {
			this.privateCoreListPrice = this.calculateExistingPrice();
		}

		if(this.lineItem.recurringItem.isRecurring){
			this.isRecurring = this.lineItem.recurringItem.isRecurring;
		}

		if(this.lineItem.recurringItem.frequency){
			this.recurringFrequency = this.lineItem.recurringItem.frequency;
		}

		if(this.lineItem.recurringItem.quantity){
			this.recurringQuantity = this.lineItem.recurringItem.quantity;
		}

		if(this.lineItem.isVmi){
			this.isVmi = this.lineItem.isVmi;
		}

		if(this.lineItem.vmiRequest.vmiRequest.CPQ2_Par_Level__c){
			this.vmiParLevel = this.lineItem.vmiRequest.vmiRequest.CPQ2_Par_Level__c;
		}

		if(this.lineItem.quantity){
			this.quantity = this.lineItem.quantity;
		} else {
			this.quantity = 0;
			hasDefaultBeenSet = true;
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
				quantity: this.quantity,
				purchasePrice: this.purchasePrice,
				lineNotes: this.lineNotes,
				isCoreListSubmitted: this.isCoreListSubmitted,
				isRecurring: this.isRecurring,
				isVmi: this.isVmi,
				coreListRequestedPrice: this.requestedCoreListPrice,
				recurringQuantity: this.recurringQuantity,
				recurringFrequency: this.recurringFrequency,
				vmiParLevel: this.vmiParLevel,
				isCoreListPriceAlreadyExists: this.isCoreListPriceAlreadyExists
			}
		});

		console.log('*** CHANGE : ' + JSON.stringify(consumableChangeEvent));

		// Fire the custom event
		this.dispatchEvent(consumableChangeEvent);
	}
}