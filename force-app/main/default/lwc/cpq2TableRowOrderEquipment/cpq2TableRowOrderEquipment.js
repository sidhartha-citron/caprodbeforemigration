/**
 * Created by timothychiang on 2020-05-14.
 */

import { api, track } from "lwc";

import Cpq2TableRowNonServiceBase from "c/cpq2TableRowNonServiceBase";
export default class Cpq2TableRowOrderEquipment extends Cpq2TableRowNonServiceBase {

	privateIsRequestedPriceApproved;
	privateOldPrice;
	privateRequestedPrice;

	@track isRequestedPriceApproved;

	@track installationStatus;
	@track installationPrice;
	@track installTotal;
	@track isActive;

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

	get requestedPrice(){
		return this.privateRequestedPrice;
	}

	// set requestedPrice(value){
	// 	this.isRequestedPriceApproved = '';
	// 	this.privateRequestedPrice = value !== "" ? value : null;
	// }

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

	get isApprovalDisabled(){
		return (!this.hasAccessToApproval || this.requestedPrice == null || this.rowReadOnly);
	}	

	get isInstallationPriceRequired(){
		return !!this.installationStatus;
	}

	get isInstallationPriceReadOnly(){
		return !!!this.installationStatus;
	}

	get coreListPrice(){
		let price;

		if(this.lineItem.productInfo.contractPriceSummary){
			price = this.lineItem.productInfo.contractPriceSummary.lowestApplicablePrice;
		}

		return price;
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

	connectedCallback(){
		console.log('lineItem ' +  JSON.stringify(this.lineItem));

		this.isPartOfPriceModel = true;
		this.privateHandleChange = this.handleChange.bind(this);
		this.privateGenericOnChangeFunctions.push(this.refreshInstall.bind(this));

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

		if(this.lineItem.requestedPrice != null){
			this.privateRequestedPrice = this.lineItem.requestedPrice;
		}

		if(this.lineItem.installationStatus){
			this.installationStatus = this.lineItem.installationStatus;
		}

		if(this.lineItem.installationPrice || this.lineItem.installationPrice === 0){
			this.installationPrice = this.lineItem.installationPrice;
		}

		this.isActive = this.lineItem.isActive;

		this.refreshInstall();

		if(hasDefaultBeenSet){
			this.handleChange();
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

	handleChange() {
		const equipmentChangeEvent = new CustomEvent('linechange', {
			detail: {
				changeType: this.PRODUCT_ITEM_TYPE_EQUIPMENT,
				key: this.lineItem.key,
				quantity: this.privateQuantity,
				purchasePrice: this.purchasePrice,
				lineNotes: this.lineNotes,
				installationStatus: this.installationStatus,
				installationPrice: this.installationPrice,
				installTotal: this.installTotal,
				active: this.isActive,
				requestedPriceApproved: this.privateIsRequestedPriceApproved,
				requestedPrice: this.privateRequestedPrice
			}
		});

		// Fire the custom event
		this.dispatchEvent(equipmentChangeEvent);
	}

}