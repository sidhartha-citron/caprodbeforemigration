/**
 * Created by timothychiang on 2020-03-21.
 */

import { LightningElement, track, api } from "lwc";
import getExistingServices from '@salesforce/apex/CPQ2_ExistingServicesController.getExistingServices';

const columns = [
	{ label: 'Order Number', fieldName: 'orderNumber', type: 'text', sortable: true, cellAttributes: { alignment: 'left' } },
	{ label: 'Is it Seasonal', fieldName: 'isSeasonal', type: 'boolean', sortable: true, cellAttributes: {alignment: 'left'}},
	{ label: 'Product Name', fieldName: 'productName', type: 'text', sortable: true, cellAttributes: { alignment: 'left' }},
	{ label: 'Frequency', fieldName: 'frequency', type: 'text', sortable: true, cellAttributes: { alignment: 'left' }},
	{ label: 'Price', fieldName: 'servicePrice', type: 'currency' , sortable: true, cellAttributes: { alignment: 'left' }},
	{ label: 'Quantity', fieldName: 'totalQuantity', type: 'number', sortable: true , cellAttributes: { alignment: 'left' }},
	{ label: 'Total Price Per Service', fieldName: 'totalPerService', type: 'currency', sortable: true , cellAttributes: { alignment: 'left' }},
];

import BaseComponent from 'c/baseComponent';

export default class Cpq2ExistingServices extends BaseComponent {
	@api headerTitle = '';
	@api recordId = '';
	@track data = [];
	@track columns = columns;
	@track isLoading = false;
	@track defaultSortDirection = 'asc';
	@track sortDirection = 'asc';
	@track sortedBy;
	@track customSettings;

	get reportUrl(){
		return '/lightning/r/Report/' + this.customSettings.CPQ2_Allocation_Report_Id__c + '/view?fv0=' + this.recordId;
	}

	get totalAnnualAmount(){
		let total = 0;

		for(let i=0;i<this.data.length;i++){
			total += this.data[i].annualTotal;
		}

		return total;
	}

	get totalMonthlyAmount(){
		return this.totalAnnualAmount/12;
	}

	get totalWeeklyAmount(){
		return this.totalAnnualAmount/52;
	}

	handleReportOpen(){
		window.open(this.reportUrl);
	}

	sortBy(field, reverse, primer) {
		const key = primer
			? function(x) {
				return primer(x[field]);
			}
			: function(x) {
				return x[field];
			};

		return function(a, b) {
			a = key(a);
			b = key(b);
			return reverse * ((a > b) - (b > a));
		};
	}

	onHandleSort(event) {
		const { fieldName: sortedBy, sortDirection } = event.detail;
		const cloneData = [...this.data];

		cloneData.sort(this.sortBy(sortedBy, sortDirection === 'asc' ? 1 : -1));
		this.data = cloneData;
		this.sortDirection = sortDirection;
		this.sortedBy = sortedBy;
	}

	getOrders(){
		this.isLoading = true;

		getExistingServices({
			accountId: this.recordId
		})
			.then(result => {
				console.log(JSON.stringify(result));
				this.data = result.existingServices;
				this.customSettings = result.cpqSettings;
			})
			.catch(error => {
				this.handleError(error);
				this.data = [];
				this.customSettings = undefined;
			})
			.finally(() => { this.isLoading = false;});
	}

	connectedCallback(){
		this.getOrders();
	}

	handleCloseExistingServices(){
		const onCloseEvent = new CustomEvent('onclose', {
			detail: {
				close: true
			}
		});

		// Fire the custom event
		this.dispatchEvent(onCloseEvent);
	}
}