/**
 * Created by timothychiang on 2020-04-20.
 */

import {track, api} from 'lwc';

import BaseComponent from 'c/baseComponent';

export default class Cpq2SummaryView extends BaseComponent {

	@api serviceLineItems
	@api consumablesLineItems;
	@api equipmentLineItems;
	@api recurringLineItems;
	@api vmiItems;
	@api coreListPriceRequestItems;
	@api frequencyMap;

	get showCoreListPriceRequestItems() {
		return (this.coreListPriceRequestItems.length > 0);
	}

	get showVmiItems() {
		return (this.vmiItems.length > 0);
	}

	get showRecurringLineItems() {
		return (this.recurringLineItems.length > 0);
	}

	get showRecurringServicesList() {
		return (this.recurringServicesList.length > 0);
	}

	get recurringServicesList() {
		let returnList = [];

		for (let i = 0; i < this.serviceLineItems.length; i++) {
			let lineItem = this.serviceLineItems[i];
			if (lineItem.frequency !== 'One-Time') {
				returnList.push(lineItem);
				//returnList = [...this.data , lineItem];
			}
		}
		return returnList;
	}

	get showOneTimeServicesList() {
		return (this.oneTimeServicesList.length > 0);
	}

	get oneTimeServicesList() {
		let returnList = [];

		for (let i = 0; i < this.serviceLineItems.length; i++) {
			let lineItem = this.serviceLineItems[i];
			if (lineItem.frequency === 'One-Time' && lineItem.productInfo.priceBookEntry.Product2.GL_Title__c !== 'Installation') {
				returnList.push(lineItem);
			}
		}

		return returnList;
	}

	get showProductsEquipmentList() {
		return (this.productsEquipmentList.length > 0);
	}

	get productsEquipmentList() {
		let returnList = [];

		for (let i = 0; i < this.consumablesLineItems.length; i++) {
			let lineItem = this.consumablesLineItems[i];
			if (lineItem.quantity && lineItem.quantity !== 0) {
				returnList.push(lineItem);
			}
		}

		for (let j = 0; j < this.equipmentLineItems.length; j++) {
			let lineItem1 = this.equipmentLineItems[j];
			if (lineItem1.quantity && lineItem1.quantity !== 0) {
				returnList.push(lineItem1);
			}
		}
		return returnList;
	}

	get showFeesList() {
		return (this.feesList.length > 0);
	}

	get feesList() {
		let returnList = [];

		for (let i = 0; i < this.serviceLineItems.length; i++) {
			let lineItem = this.serviceLineItems[i];
			if (lineItem.installationStatus || lineItem.productInfo.priceBookEntry.Product2.GL_Title__c === 'Installation') {
				returnList.push(lineItem);
			}
		}

		for (let j = 0; j < this.equipmentLineItems.length; j++) {
			let lineItem = this.equipmentLineItems[j];
			if (lineItem.installationStatus) {
				returnList.push(lineItem);
			}
		}


		return returnList;
	}


}