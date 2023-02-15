import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import CASE_NUMBER from "@salesforce/schema/Case.CaseNumber";
import SUBJECT from "@salesforce/schema/Case.Subject";
import ORIGIN from "@salesforce/schema/Case.Origin";

import getChildCases from "@salesforce/apex/ChildCasesHierarchyController.getChildCases";

// definition of columns for the tree grid
const COLS = [
	{ fieldName: "recordUrl", label: "Case Number", type: "url",
	  typeAttributes: { label: { fieldName : CASE_NUMBER.fieldApiName}, target: '_blank' }},
	{ fieldName: SUBJECT.fieldApiName, label: "Subject"},
	{ fieldName: ORIGIN.fieldApiName, label: "Origin" }
];

export default class ChildCasesHierarchy extends LightningElement
{
    @track gridColumns = COLS;
	isLoading = true;
	@track gridData = [];
	
    @api recordId;

	// initial data provided to the tree grid i.e. All first level child Cases
	@wire(getChildCases, { parentId: '$recordId' })
	firstLevelChildCases({ error, data }) {
        if (error) {
			console.error("error loading Cases", error);
		} else if (data) {	
			console.log('**Data for L1**'+data);
			let recordUrl;
            this.gridData = data.map(child => {
				//Forming value of recordUrl field which is introduced to track the URL of clicked CaseNumber in first column
				recordUrl = `/${child.Id}`;
				return {
				recordUrl,	
                _children: [],
                ...child							
            }});
			this.isLoading = false;
		}
	} 

	// when a row is toggled we retrieve values and dynamically load children if needed
	handleOnToggle(event) {
		// retrieve the unique ID of the row being expanded
		const rowName = event.detail.name;

		if (!event.detail.hasChildrenContent && event.detail.isExpanded) {
			this.isLoading = true;

			//Calling Apex controller method imperatively to fetch further child Cases
			getChildCases({ parentId: rowName })
				.then((result) => {
					console.log(result);
					if (result && result.length > 0) {
						console.log('****children fetched');
						let recordUrl;
						console.log('***recordUrl**'+recordUrl);
						const newChildren = result.map(child => {
							//Forming value of recordUrl field which is introduced to track the URL of clicked CaseNumber in first column
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

	// add the new child rows at the desired location
	getNewDataWithChildren(rowName, data, children) {
		return data.map((row) => {
			let hasChildrenContent = false;
			if (
				row.hasOwnProperty('_children') &&
				Array.isArray(row._children) &&
				row._children.length > 0
			) {
				hasChildrenContent = true;
			}

			// if this is the row that was toggled then add the child content
			if (row.Id === rowName) {
				row._children = children;
				// otherwise keep searching for the correct row by recursively searching the tree
			} else if (hasChildrenContent) {
				this.getNewDataWithChildren(rowName, row._children, children);
			}
			return row;
		});
	}
}