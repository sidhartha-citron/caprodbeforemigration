/**
 * Created by timothychiang on 2020-03-14.
 */

import { api, track } from "lwc";

import BaseComponent from 'c/baseComponent';
export default class Cpq2TableBody extends BaseComponent {

	privateFrequencyMap;

	@api hasAccessToApproval = false;
	@api tableType = 'Service';
	@api lineItems = [];

	@api
	get frequencyMap() {
		return this.privateFrequencyMap;
	}

	@api
	get isValid(){
		this.handleValidation();
		return this.isAllValid;
	}

	set frequencyMap(value) {
		this.privateFrequencyMap = value;

		// wait until the frequencyMap is given before showing the rows
		this.showTable = true;
	}

	@track showTable = false;
	@track isAllValid = true;

	get showService(){
		return (this.tableType === 'Service');
	}

	get showConsumables(){
		return (this.tableType === 'Consumables');
	}

	get showEquipment(){
		return (this.tableType === 'Equipment');
	}

	replayStaleScore(event){
		const staleScoreEvent = new CustomEvent('stalescore', {
			detail: event.detail
		});
		// Fire the custom event
		this.dispatchEvent(staleScoreEvent);
	}

	relayLineChange(event){
		const lineChange = new CustomEvent('linechange', {
			detail: event.detail
		});

		// Fire the custom event
		this.dispatchEvent(lineChange);
	}

	replayDeleteEvent(event){
		const deleteLine = new CustomEvent('deleteline', {
			detail: event.detail
		});

		// Fire the custom event
		this.dispatchEvent(deleteLine);
	}

	handleValidation() {
		this.isAllValid = [...this.template.querySelectorAll('.valid-row')]
			.reduce((validSoFar, cpqRow) => {
				let isValid = cpqRow.isValid;
				return validSoFar && isValid;
			}, true);
	}
}