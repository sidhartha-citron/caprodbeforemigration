import { LightningElement, track, api } from 'lwc';

import BaseComponent from 'c/baseComponent';
import System_Completed_Process from '@salesforce/label/c.System_Completed_Process';
export default class Cpq2SummaryFooter extends BaseComponent {

    @api shipToScore;
    @api serviceList;
    @api consumableList;
    @api equipmentList;
    @api catMultiplierList;
    @api scoreMultiplierList;
    @api cpqSettings;
    @api frequencyMap;
    @api header;
    @api account;
    @api showApprovalStatus = false;
    @api isOpp = false;

    @track dealImpact = [];


    get isSeasonal() {
        if (this.account) {
            return (this.account.hasSeasonal);
        } else {
            return false;
        }
    }


    get scoreApplicable() {
        let foundApplicableService = false;

        if (this.serviceList) {
            for (let i = 0; i < this.serviceList.length; i++) {
                // CPQCN-494 Darcy added test for price
                // CR21-19 2021-03-29 Darcy: excluding One-Time frequency and inactive order products
                if (this.serviceList[i].productInfo.priceBookEntry.Product2.CPQ_Price_Model__c === this.CPQ2_HYGIENE_PRICE_MODEL
                    && this.serviceList[i].servicePrice > 0
                    && this.serviceList[i].frequency !== 'One-Time'
                    && this.serviceList[i].isActive === true) {
                    foundApplicableService = true;
                    break;
                }
            }
        }

        return foundApplicableService;
    }

    get showScore() {
        return !!this.shipToScore;
    }

    handleRefreshRequest() {
        const refreshEvent = new CustomEvent('refreshscore', {
            detail: {
                value: true,
            }
        });
        // Fire the custom event
        this.dispatchEvent(refreshEvent);
    }

    get scoreIcon() {
        let classText;

        if (this.shipToScore >= this.cpqSettings.CPQ_T0__c) {
            classText = 'utility:like';
        } else if (this.shipToScore >= this.cpqSettings.CPQ_T1__c) {
            classText = 'utility:priority';
        } else if (this.shipToScore >= this.cpqSettings.CPQ_T2__c) {
            classText = 'utility:priority';
        } else if (this.shipToScore >= this.cpqSettings.CPQ_T3__c) {
            classText = 'utility:priority';
        } else {
            classText = 'utility:dislike';
        }

        return classText;
    }

    get scoreIconClass() {
        let classText;

        if (this.shipToScore >= this.cpqSettings.CPQ_T0__c) {
            classText = 'success';
        } else if (this.shipToScore >= this.cpqSettings.CPQ_T1__c) {
            classText = 'success';
        } else if (this.shipToScore >= this.cpqSettings.CPQ_T2__c) {
            classText = 'warning';
        } else if (this.shipToScore >= this.cpqSettings.CPQ_T3__c) {
            classText = 'error';
        } else {
            classText = 'error';
        }

        return classText;
    }


    get scoreClasses() {
        let classText = 'deal-score ';

        if (this.shipToScore >= this.cpqSettings.CPQ_T0__c) {
            classText += 'approval-score-green';
        } else if (this.shipToScore >= this.cpqSettings.CPQ_T1__c) {
            classText += 'approval-score-green';
        } else if (this.shipToScore >= this.cpqSettings.CPQ_T2__c) {
            classText += 'approval-score-yellow';
        } else if (this.shipToScore >= this.cpqSettings.CPQ_T3__c) {
            classText += 'approval-score-red';
        } else {
            classText += 'approval-score-red';
        }
        return classText;
    }

    get approvalProcessClasses() {
        let classText = 'slds-text-heading_medium ';
        console.log("~~Approval Status~~" + this.header.approvalStatus);
        if (this.header.approvalStatus === 0) {
            classText += 'approval-score-green';
        } else if (this.header.approvalStatus === 1) {
            classText += 'approval-score-green';
        } else if (this.header.approvalStatus === 2) {
            classText += 'approval-score-yellow';
        } else if (this.header.approvalStatus === 3) {
            classText += 'approval-score-red';
        } else {
            classText += 'approval-score-red';
        }

        return classText;
    }

    get dealImpacts() {
        let dealImpact = this.header.dealImpacts;
        return dealImpact.join(' --- ');
    }

    get showDealImpacts() {
        return !!this.dealImpacts;
    }

    get approvalStatus() {
        let status;

        if (this.header.approvalStatus === 0) {
            status = 'Approved';
        } else if (this.header.approvalStatus === 1) {
            status = 'Approved';
        } else if (this.header.approvalStatus === 2) {
            status = 'Requires Approval';
        } else if (this.header.approvalStatus === 3) {
            status = 'Requires Approval';
        } else {
            status = 'Requires Adjustment to Proceed';
        }

        return status;
    }

    get approvalIcon() {
        let classText;

        if (this.header.approvalStatus === 0) {
            classText = 'utility:check';
        } else if (this.header.approvalStatus === 1) {
            classText = 'utility:priority';
        } else if (this.header.approvalStatus === 2) {
            classText = 'utility:priority';
        } else if (this.header.approvalStatus === 3) {
            classText = 'utility:priority';;
        } else {
            classText = 'utility:error';
        }

        return classText;
    }

    get approvalIconClass() {
        let classText;

        if (this.header.approvalStatus === 0) {
            classText = 'success';
        } else if (this.header.approvalStatus === 1) {
            classText = 'success';
        } else if (this.header.approvalStatus === 2) {
            classText = 'warning';
        } else if (this.header.approvalStatus === 3) {
            classText = 'error';
        } else {
            classText = 'error';
        }
        return classText;

    }

    get totalAnnualRR() {
        return this.calculateAnnualRR();
    }

    get totalMonthlyRR() {
        return (this.calculateAnnualRR()) / 12;
    }

    get totalInstallation() {

        let totalInstallation = 0;

        for (let i = 0; i < this.serviceList.length; i++) {
            let lineItem = this.serviceList[i];
            let productInfo = lineItem.productInfo.priceBookEntry.Product2;

            if (productInfo.GL_Title__c === 'Installation') {
                totalInstallation += lineItem.quantity * lineItem.servicePrice;
            } else {
                if (lineItem.installationStatus && lineItem.quantity && lineItem.installationPrice) {
                    totalInstallation += lineItem.quantity * lineItem.installationPrice;
                }
            }
            //
            //
            // if(lineItem.installationPrice){
            //     let totalPerService = lineItem.quantity * lineItem.installationPrice;
            //     totalInstallation += totalPerService;
            // }
        }

        for (let i = 0; i < this.equipmentList.length; i++) {
            let lineItem = this.equipmentList[i];

            if (lineItem.installationPrice) {
                let totalPerService = lineItem.quantity * lineItem.installationPrice;
                totalInstallation += totalPerService;
            }
        }

        return totalInstallation;
    }

    get totalNonService() {
        let total = 0;
        for (let i = 0; i < this.equipmentList.length; i++) {
            let lineItem = this.equipmentList[i];

            if (lineItem.purchasePrice && lineItem.quantity) {
                let totalPerEquip = lineItem.quantity * lineItem.purchasePrice;
                total += totalPerEquip;
            }
        }

        for (let i = 0; i < this.consumableList.length; i++) {
            let lineItem = this.consumableList[i];

            if (lineItem.purchasePrice && lineItem.quantity) {
                let totalPerConsumables = lineItem.quantity * lineItem.purchasePrice;
                total += totalPerConsumables;
            }
        }

        return total;
    }

    calculateAnnualRR() {

        let totalAnnualRR = 0;

        for (let i = 0; i < this.serviceList.length; i++) {
            let lineItem = this.serviceList[i];
            if (lineItem.quantity && lineItem.servicePrice && lineItem.frequency) {
                let totalPerService = lineItem.quantity * lineItem.servicePrice;
                let annualRR = totalPerService * this.frequencyMap[lineItem.frequency].Occurrences_In_Year__c;
                totalAnnualRR += annualRR;
            }
        }

        // for(let j=0;j<this.consumableList.length;j++){
        //     let lineItem = this.consumableList[j].recurringItem;
        //     if(lineItem.isRecurring && lineItem.quantity && lineItem.purchasePrice && lineItem.frequency){
        //         let totalVisit = lineItem.quantity * lineItem.purchasePrice;
        //         let annualRR = totalVisit * this.frequencyMap[lineItem.frequency].Occurrences_In_Year__c;
        //         totalAnnualRR += annualRR;
        //     }
        // }

        return totalAnnualRR;
    }

    get estiCommission() {
        let estcomm = 0;
        let catMap = new Map();

        for (let i = 0; i < this.catMultiplierList.length; i++) {
            let catMulType = this.catMultiplierList[i].CPQ_Multiplier_Type__c;
            let catMultiplier = this.catMultiplierList[i].CPQ_Multiplier__c;
            if (catMulType != null) {
                let catTypes = catMulType.split(";");
                for (let n = 0; n < catTypes.length; n++) {
                    if (catMultiplier != null) { catMap.set(catTypes[n], catMultiplier); }
                }
            }
        }

        console.log("+++Service+++");
        console.log(JSON.stringify(this.serviceList));
        //console.log("**Ship To Score**" + this.shipToScore);

        for (let i = 0; i < this.serviceList.length; i++) {
            let lineItem = this.serviceList[i];
            if (lineItem.opportunityLineItem != null) {
                let pcode = "", CatDesc = "", Family = "", RT = "";
                let TPrice = 0, Sprice = 0, MPrice = 0;

                if (lineItem.opportunityLineItem.Product2 == null) {
                    pcode = lineItem.productInfo.priceBookEntry.Product2.ProductCode;
                    CatDesc = lineItem.productInfo.priceBookEntry.Product2.Category_Description__c;
                    Family = lineItem.productInfo.priceBookEntry.Product2.Family;
                    console.log("+++FROM ProductInfo+++");
                } else {
                    pcode = lineItem.opportunityLineItem.Product2.ProductCode;
                    CatDesc = lineItem.opportunityLineItem.Product2.Category_Description__c;
                    Family = lineItem.opportunityLineItem.Product2.Family;
                    console.log("+++FROM Line Item+++");
                }

                if (lineItem.quantity && lineItem.servicePrice && lineItem.frequency) {
                    let totalPerService = lineItem.quantity * lineItem.servicePrice;
                    let annualRR = totalPerService * this.frequencyMap[lineItem.frequency].Occurrences_In_Year__c;
                    TPrice = annualRR;
                }
                MPrice = TPrice / 12;
                Sprice = lineItem.servicePrice;
                if (lineItem.installationPrice != null) {
                    TPrice = TPrice + (lineItem.installationPrice * lineItem.quantity);
                }

                if (lineItem.opportunityLineItem.Opportunity != null) {
                    RT = lineItem.opportunityLineItem.Opportunity.RecordType.Name;
                } else {
                    RT = lineItem.oppRT;
                }

                let catMulti = 1;
                if (CatDesc != null) {
                    let CatDescList = CatDesc.split(',');
                    for (let c = 0; c < CatDescList.length; c++) {
                        let key = CatDescList[c].trim();
                        if (catMap.has(key)) {
                            catMulti = catMap.get(key);
                        }
                    }
                }

                let scoreMulti = 0;
                for (let i = 0; i < this.scoreMultiplierList.length; i++) {
                    let scoreFrom = this.scoreMultiplierList[i].CPQ2_Score_From__c;
                    let scoreTo = this.scoreMultiplierList[i].CPQ2_Score_To__c;
                    //console.log("Score From:" + scoreFrom + ",Score To:" + scoreTo);
                    let dealscore = 1;

                    if (scoreTo == null || scoreTo === undefined) { scoreTo = 999; }
                    if (this.shipToScore != null) { dealscore = this.shipToScore; }

                    if (dealscore >= scoreFrom && dealscore <= scoreTo) {
                        scoreMulti = this.scoreMultiplierList[i].CPQ2_Multiplier__c;
                    }
                }

                console.log("+++Code+++" + pcode);
                console.log("+++Family+++" + Family);
                console.log("+++CAT+++" + CatDesc);
                console.log("+++AT+++" + TPrice);
                console.log("+++MRR+++" + MPrice);
                console.log("+++SP+++" + Sprice);
                console.log("++CAT MULTI++" + catMulti);
                console.log("++Score MULTI++" + scoreMulti);
                console.log("++RT++" + RT);

                if (pcode.startsWith("1-44")) {
                    if (RT.includes("Existing")) { continue; }

                    if (lineItem.frequency == "One-Time" || lineItem.frequency == "Annually" ||
                        lineItem.frequency == "Semi-Annually" || lineItem.frequency == "120 Days" ||
                        lineItem.frequency == "Quarterly" || lineItem.frequency == "84 Days" ||
                        lineItem.frequency == "112 Days" || lineItem.frequency == "168 Days" ||
                        lineItem.frequency == "182 Days") {
                        estcomm += TPrice * 0.05;
                    } else {
                        estcomm += MPrice * 0.01;
                    }
                } else {
                    if (lineItem.frequency == "One-Time") { continue; }

                    if (RT.includes("Conversion")) {
                        if (Family == "Hygiene" || Family == "Life Safety") {
                            estcomm += MPrice * catMulti * scoreMulti;
                        } else {
                            estcomm += MPrice * catMulti;
                        }
                    } else if (RT.includes("Penetration")) {
                        estcomm += MPrice * catMulti;
                    } else {
                        estcomm = 0;
                    }
                }
            }
            console.log("Est Comm:" + estcomm);
        }

        console.log("+++Equipment+++");
        console.log(JSON.stringify(this.equipmentList));

        for (let i = 0; i < this.equipmentList.length; i++) {
            let lineItem = this.equipmentList[i];
            let SalesPrice = 0;
            if (lineItem.purchasePrice != null) {

                if (lineItem.productInfo.priceBookEntry.UnitPrice != null) {
                    SalesPrice = lineItem.productInfo.priceBookEntry.UnitPrice;
                }
                if (lineItem.purchasePrice != null) {
                    SalesPrice = lineItem.purchasePrice;
                }
                if (lineItem.installationPrice != null) {
                    SalesPrice = SalesPrice + (lineItem.installationPrice * lineItem.quantity);
                }
            }
            if (lineItem.quantity != null) {
                estcomm += SalesPrice * lineItem.quantity * 0.05;
            }
            console.log("Est Comm:" + estcomm);
        }

        return estcomm;
    }

    get textOpp() {
        if (this.isOpp) {
            return "Opp. ";
        }
        return "";
    }
}