/**
 * Created by timothychiang on 2020-04-11.
 */

import {LightningElement, api, track, wire} from 'lwc';
import {getPicklistValues, getObjectInfo} from 'lightning/uiObjectInfoApi';

export default class MultiSelect extends LightningElement {

	@api allowNoValue = false;
	@api firstValue = '';
	@api name = '';
	@api width = 100;
	@api variant = '';
	@api required = false;
	@api fieldLabel = '';
	@api dropdownLength = 4;
	@api options = [{label: 'All', value: 'All', selected: false}];
	@track selectedPills = [];  //seperate from values, because for some reason pills use {label,name} while values uses {label:value}
	@api recordTypeId = '012000000000000AAA'; // universal default rectype Id. without this, Sobjects without rectypes will fail.
	@api objectName = 'Account';
	@api fieldName = 'Industry';
	@track isValid = true;
	@track options_ = [];
	@track isOpen = false;
	@api disabled = false;
	apiFieldName;
	selected_ = [];

	@api
	get selected() {
		return this.selected_;
	}

	set selected(value) {

		console.log('****** SELECTED: ' + value);

		if (value) {
			this.selected_ = value.split(';');
		} else {
			this.selected_ = undefined;
		}

		this.markSelected();
	}

	@api
	selectedValues() {
		var values = []
		this.options_.forEach(function (option) {
			if (option.selected === true) {
				values.push(option.value);
			}
		});
		return values;
	}

	@api
	selectedObjects() {
		var values = []
		this.options_.forEach(function (option) {
			if (option.selected === true) {
				values.push(option);
			}
		});
		return values;
	}

	@api
	value() {
		return this.selectedValues().join(';')
	}

	@api
	reportValidity() {
		this.isValid = !(this.required && !this.value());
	}

	@api
	checkValidity() {
		return !(this.required && !this.value());
	}

	@wire(getObjectInfo, {objectApiName: '$objectName'})
	getObjectData({error, data}) {
		if (data) {
			if (!this.recordTypeId) {
				this.recordTypeId = data.defaultRecordTypeId;
			}

			if (!this.fieldLabel) {
				this.fieldLabel = data.fields[this.fieldName].label;
			}
			this.apiFieldName = this.objectName + '.' + this.fieldName;

		} else if (error) {
			// Handle error
			console.log('==============Error  ');
			console.log(error);
		}
	}

	@wire(getPicklistValues, {recordTypeId: '$recordTypeId', fieldApiName: '$apiFieldName'})
	getPicklistValues({error, data}) {
		if (data) {
			console.log('==== ' + JSON.stringify(data));
			// Map picklist values
			// this.options_ = data.values.map(plValue => {
			// 	return {
			// 		label: plValue.label,
			// 		value: plValue.value
			// 	};
			// });
			for(let i=0; i< data.values.length;i++){
				this.options_.push({
							label: data.values[i].label,
							value: data.values[i].value
				});
			}


			if (this.firstValue) {
				this.options_.unshift({
					label: this.firstValue,
					value: this.firstValue
				})
			}
			if (this.allowNoValue) {
				this.options_.unshift({
					label: '',
					value: ''
				})
			}

			this.markSelected();

		} else if (error) {
			// Handle error
			console.log('==============Error  ' + error);
			console.log(error);
		}
	}

	// @api
	// isValid(){
	//
	// }

	connectedCallback() {
		//copy public attributes to private ones
		//this.options_ = JSON.parse(JSON.stringify(this.options));
	}

	get formElementStyle() {
		let formElementClass = 'slds-form-element';

		if (!this.isValid) {
			formElementClass += ' slds-has-error';
		}

		return formElementClass;
	}

	get requiredStyle() {
		return this.required ? ' slds-required ' : ' slds-hide ';
	}

	get labelStyle() {
		return this.variant === 'label-hidden' ? ' slds-hide' : ' slds-form-element__label ';
	}

	get dropdownOuterStyle() {
		return 'slds-dropdown slds-dropdown_fluid slds-dropdown_length-4 dropdown-style ' + this.dropdownLength;
	}

	get mainDivClass() {
		var style = ' slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ';
		return this.isOpen ? ' slds-is-open ' + style : style;
	}

	get hintText() {
		if (this.selectedPills.length === 0) {
			return "Select an option...";
		}
		return "";
	}

	openDropdown() {
		this.isOpen = true;
	}

	closeDropdown() {
		this.isOpen = false;
	}

	/* following pair of functions are a clever way of handling a click outside,
	   despite us not having access to the outside dom.
	   see: https://salesforce.stackexchange.com/questions/255691/handle-click-outside-element-in-lwc
	   I made a slight improvement - by calling stopImmediatePropagation, I avoid the setTimeout call
	   that the original makes to break the event flow.
	*/
	handleClick(event) {

		if(this.disabled){
			return;
		}

		event.stopImmediatePropagation();
		this.openDropdown();
		window.addEventListener('click', this.handleClose);
	}

	handleClose = (event) => {
		event.stopPropagation();
		this.closeDropdown();
		window.removeEventListener('click', this.handleClose);
	}

	handlePillRemove(event) {

		if(this.disabled){
			return;
		}


		event.preventDefault();
		event.stopPropagation();

		const name = event.detail.item.name;
		//const index = event.detail.index;

		this.options_.forEach(function (element) {
			if (element.value === name) {
				element.selected = false;
			}
		});
		this.selectedPills = this.getPillArray();
		this.despatchChangeEvent();

	}

	despatchChangeEvent() {
		this.reportValidity();

		const eventDetail = {value: this.value(), selectedItems: this.selectedObjects(), name: this.name};
		const changeEvent = new CustomEvent('change', {detail: eventDetail});
		console.log('SEND CHANGE*** : ' + JSON.stringify(changeEvent));
		this.dispatchEvent(changeEvent);
	}

	handleSelectedClick(event) {

		var value;
		var selected;
		event.preventDefault();
		event.stopPropagation();

		const listData = event.detail;
		//console.log(listData);

		value = listData.value;
		selected = listData.selected;

		//shift key ADDS to the list (unless clicking on a previously selected item)
		//also, shift key does not close the dropdown.
		// if (listData.shift) {
		this.options_.forEach(function (option) {
			if (option.value === value) {
				option.selected = selected !== true;
			}
		});
		// }
		// else {
		// 	this.options_.forEach(function(option) {
		// 		if (option.value === value) {
		// 			option.selected = selected !== "true";
		// 		} else {
		// 			option.selected = false;
		// 		}
		// 	});
		// 	this.closeDropdown();
		// }

		this.selectedPills = this.getPillArray();
		this.despatchChangeEvent();
	}

	getPillArray() {
		var pills = [];
		this.options_.forEach(function (element) {
			var interator = 0;
			if (element.selected) {
				pills.push({label: element.label, name: element.value, key: interator++});
			}
		});
		return pills;
	}

	markSelected() {
		console.log('*** ADD OPTIONS ' + JSON.stringify(this.options_));
		console.log('*** ADD SELECTED ' + JSON.stringify(this.selected_));
		if (this.options_) {
			this.options_.forEach(function (option) {
				option.selected = false;
			});

			if (this.selected_) {
				for (let i = 0; i < this.selected_.length; i++) {
					let selectedValue = this.selected_[i];

					for (let j = 0; j < this.options_.length; j++) {
						if (this.options_[j].value === selectedValue) {
							this.options_[j].selected = true;
						}
					}
				}
			}
		}

		this.selectedPills = this.getPillArray();
	}

}