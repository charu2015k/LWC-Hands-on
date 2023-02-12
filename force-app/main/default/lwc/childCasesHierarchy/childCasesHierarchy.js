import { LightningElement, wire, api } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import CASE_NUMBER from "@salesforce/schema/Case.CaseNumber";
import SUBJECT from "@salesforce/schema/Case.Subject";
import ORIGIN from "@salesforce/schema/Case.Origin";

import getChildCases from "@salesforce/apex/ChildCasesHierarchyController.getChildCases";

const COLS = [
	{ fieldName: "recordUrl", label: "Case Number", type: "url",
	  typeAttributes: { label: { fieldName : 'CaseNumber'}, target: '_blank' }},
	{ fieldName: "Subject", label: "Subject"},
	{ fieldName: "Origin", label: "Origin" }
];

export default class ChildCasesHierarchy extends LightningElement
{
    gridColumns = COLS;
	isLoading = true;
	gridData = [];
	
    @api recordId;

	@wire(getChildCases, { parentId: '$recordId' })
	firstLevelChildCases({ error, data }) {
        if (error) {
			console.error("error loading Cases", error);
		} else if (data) {	
			let recordUrl;
            this.gridData = data.map(child => {
				recordUrl = `/${child.Id}`;
				return {
				recordUrl,	
                _children: [],
                ...child							
            }});
			this.isLoading = false;
		}
	} 

	handleOnToggle(event) {
		console.log(event.detail.name);
		console.log(event.detail.hasChildrenContent);
		console.log(event.detail.isExpanded);
		const rowName = event.detail.name;
		if (!event.detail.hasChildrenContent && event.detail.isExpanded) {
			this.isLoading = true;
			getChildCases({ parentId: rowName })
				.then((result) => {
					console.log(result);
					if (result && result.length > 0) {
						console.log('****children fetched');
						let recordUrl;
						console.log('***recordUrl**'+recordUrl);
						const newChildren = result.map(child => {
							recordUrl = `/${child.Id}`;
							console.log('***recordUrl**'+recordUrl);
							return {
							recordUrl,
							_children: [],
							...child}							
						});
						this.gridData = this.getNewDataWithChildren(
							rowName,
							this.gridData,
							newChildren
						);
					} else {
						this.dispatchEvent(
							new ShowToastEvent({
								title: "No children",
								message: "No children for the selected Case",
								variant: "warning"
							})
						);
					}
				})
				.catch((error) => {
					console.log("Error loading child cases", error);
					this.dispatchEvent(
						new ShowToastEvent({
							title: "Error Loading Children Cases",
							message: error + " " + error?.message,
							variant: "error"
						})
					);
				})
				.finally(() => {
					this.isLoading = false;
				});
		}
	}

	getNewDataWithChildren(rowName, data, children) {
		return data.map((row) => {
			let hasChildrenContent = false;
			if (
				Object.prototype.hasOwnProperty.call(row, "_children") &&
				Array.isArray(row._children) &&
				row._children.length > 0
			) {
				hasChildrenContent = true;
			}

			if (row.Id === rowName) {
				row._children = children;
			} else if (hasChildrenContent) {
				this.getNewDataWithChildren(rowName, row._children, children);
			}
			return row;
		});
	}
}