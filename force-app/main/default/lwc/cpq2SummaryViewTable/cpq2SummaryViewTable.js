/**
 * Created by timothychiang on 2020-04-20.
 */

import { track, api } from 'lwc';

import BaseComponent from 'c/baseComponent';
export default class Cpq2SummaryViewTable extends BaseComponent {

	privateLineItems = [];

	privateLineItemHeaders =  [{id: '1', name: 'Product', class: 'slds-p-around_x-small'},
		{id: '2', name: '', class: 'slds-cell-wrap slds-p-around_x-small'},
		{id: '3', name: 'Frequency', class: 'small-column slds-p-around_x-small'},
		{id: '4', name: 'Qty', class: 'small-column slds-p-around_x-small'},
		{id: '5', name: 'Unit', class: 'small-column slds-p-around_x-small'},
		{id: '6', name: 'Price', class: 'small-column slds-p-around_x-small'},
		{id: '7', name: 'Total', class: 'small-column slds-p-around_x-small'}];

	privateRecurringConsLineItemHeaders =  [{id: '1', name: 'Product', class: 'slds-p-around_x-small'},
		{id: '2', name: '', class: 'slds-cell-wrap slds-p-around_x-small'},
		{id: '3', name: 'Frequency', class: 'small-column slds-p-around_x-small'},
		{id: '4', name: 'Qty', class: 'small-column slds-p-around_x-small'},
		{id: '5', name: 'Unit', class: 'small-column slds-p-around_x-small'},
		{id: '6', name: 'Price', class: 'small-column slds-p-around_x-small'},
		{id: '7', name: 'Monthly Total', class: 'small-column slds-p-around_x-small'}];

	privateLineItemServiceHeaders =  [{id: '1', name: 'Product', class: 'slds-p-around_x-small'},
		{id: '2', name: '', class: 'slds-cell-wrap slds-p-around_x-small'},
		{id: '3', name: 'Frequency', class: 'small-column slds-p-around_x-small'},
		{id: '4', name: 'Qty', class: 'small-column slds-p-around_x-small'},
		{id: '5', name: 'Unit', class: 'small-column slds-p-around_x-small'},
		{id: '6', name: 'Service Price/Unit', class: 'small-column slds-p-around_x-small'},
		{id: '7', name: 'Monthly Total', class: 'small-column slds-p-around_x-small'}];

	privateVmiHeaders =  [{id: '1', name: 'Product', class: 'small-column slds-p-around_x-small'},
		{id: '2', name: 'List', class: 'small-column slds-p-around_x-small'},
		{id: '3', name: 'Unit', class: 'small-column slds-p-around_x-small'},
		{id: '4', name: 'Par Level', class: 'small-column slds-p-around_x-small'}];

	privateCoreListPriceRequestHeaders =  [{id: '1', name: 'Product', class: 'small-column slds-p-around_x-small'},
		{id: '2', name: 'List', class: 'small-column slds-p-around_x-small'},
		{id: '3', name: 'Unit', class: 'small-column slds-p-around_x-small'},
		{id: '4', name: 'Contract Price', class: 'small-column slds-p-around_x-small'}];

	@api
	get lineItems(){
		return this.privateLineItems;
	}

	set lineItems(value){
		this.privateLineItems = value;
		if(value){
			this.lineItemLength = value.length;
		}
	}

	@api titleTheme = 'slds-theme_alt-inverse';
	@api tableName = '';
	@api frequencyMap;
	@api tableType;
	@api totalLabel = '';

	@track lineItemLength = 0;

	get colHeaders(){
		if(this.tableType === this.TABLE_TYPE_VMI){
			return this.privateVmiHeaders;
		} else if(this.tableType === this.TABLE_TYPE_CORE_LIST_PRICE){
			return this.privateCoreListPriceRequestHeaders;
		} else if(this.tableType === this.TABLE_TYPE_SERVICE) {
			return this.privateLineItemServiceHeaders;
		} else if(this.tableType === this.TABLE_TYPE_RECURRING_PURCHASE){
			return this.privateRecurringConsLineItemHeaders;
		} else {
			return this.privateLineItemHeaders;
		}
	}

	connectedCallback() {
		if(this.tableType === this.TABLE_TYPE_PURCHASE){
			console.log('INIT: ' + JSON.stringify(this.privateLineItems));
		}

	}

	get showLineItem(){
		return this.tableType !== this.TABLE_TYPE_VMI && this.tableType !== this.TABLE_TYPE_CORE_LIST_PRICE;
	}

	get showVmi(){
		return this.tableType === this.TABLE_TYPE_VMI;
	}

	get showCoreList(){
		return this.tableType === this.TABLE_TYPE_CORE_LIST_PRICE;
	}

	get numCol(){
		return this.colHeaders.length;
	}

	get showTotal(){
		return this.tableType !== this.TABLE_TYPE_VMI && this.tableType !== this.TABLE_TYPE_CORE_LIST_PRICE;
	}

	get total(){
		let returnTotal = 0;

		for(let i=0;i<this.lineItems.length;i++){

			let lineItem = this.lineItems[i];

			returnTotal += this.calculateTotal(lineItem, this.frequencyMap, this.tableType);
		}

		return returnTotal;
	}
}