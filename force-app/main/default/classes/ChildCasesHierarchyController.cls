public class ChildCasesHierarchyController
{
    @AuraEnabled(cacheable=true)
	public static List<Case> getChildCases(Id parentId) 
	{
		//Returning all child Cases of a case with a particular Id
	return [SELECT Id, CaseNumber, Origin, Subject
			FROM Case
			WHERE ParentId = :parentId
            ];	
    }
}