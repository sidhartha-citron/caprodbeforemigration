/**
 * Created by timothychiang on 2020-04-17.
 */

import { api, track } from "lwc";

import BaseComponent from 'c/baseComponent';
export default class Cpq2TableRowBase extends BaseComponent {

	privateValidationFunctions = [this.handleFieldValidation.bind(this)];
	privateGenericOnChangeFunctions = [];
	privateHandleChange;
	privateErrorMsgList = [];

	@api lineItem;
	@api
	get isValid(){
		this.privateErrorMsgList = [];

		this.isAllValid = this.privateValidationFunctions
			.reduce((validSoFar, validationFunction) => {
				return validSoFar && validationFunction();
			}, true);

		this.validationMessage = this.privateErrorMsgList.join(' --- ');

		return this.isAllValid;
	}

	@api hasAccessToApproval = false;

	@track isAllValid = true;
	@track isPartOfPriceModel = false;
	@track validationMessage = '';


	checkJustFieldValidation(){
		this.privateErrorMsgList = [];

		this.isAllValid = this.handleFieldValidation();
		this.validationMessage = this.privateErrorMsgList.join(' --- ');
		return this.isAllValid;
	}

	handleFieldValidation() {
		const fieldsValid = [...this.template.querySelectorAll('.valid-field')]
			.reduce((validSoFar, inputCmp) => {
				inputCmp.reportValidity();
				inputCmp.checkValidity();
				return validSoFar && inputCmp.checkValidity();
			}, true);

		if(!fieldsValid){
			this.privateErrorMsgList.push('Please correct all fields.');
		}

		return fieldsValid

	}

	get errorText(){
		let returnErrors = [];

		if(this.lineItem && this.lineItem.dmlResult){
			for(let i=0; i < this.lineItem.dmlResult.errors.length; i++){
				returnErrors.push(this.lineItem.dmlResult.errors[i]);
			}
		}

		if(returnErrors.length > 0){
			console.log('RESULTS: ' + returnErrors.join(' --- '));
		}

		return returnErrors.join(' --- ');
	}


	handleDelete(){

		const deleteLine = new CustomEvent('deleteline', {
			detail: {
				key: this.lineItem.key,
				partOfPriceModel: this.isPartOfPriceModel
			}
		});
		// Fire the custom event
		this.dispatchEvent(deleteLine);
	}

	customEventHandler(event){
		this[event.detail.name] = event.detail.value;

		if(event.detail.label){
			this[event.detail.name + 'Label'] = event.detail.label;
		}

		if( typeof this.privateHandleChange === "function"){
			this.privateHandleChange();
		}
	}

	genericOnChange(event){
		if(event.target.type === 'checkbox'){
			this[event.target.name] = event.target.checked;
		} else {
			this[event.target.name] = event.target.value;
		}

		this.privateGenericOnChangeFunctions.forEach((entry)=>{
			entry();
		});

		if( typeof this.privateHandleChange === "function"){
			this.privateHandleChange();
		}
	}

	handleShipToScoreStale(){
		if(this.isPartOfPriceModel){

			const staleScoreEvent = new CustomEvent('stalescore', {
				detail: {
					value: this.lineItem.key
				}
			});
			// Fire the custom event
			this.dispatchEvent(staleScoreEvent);
		}

	}
}