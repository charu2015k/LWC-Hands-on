@isTest
public class ChildCasesHierarchyControllerTest 
{
    @TestSetup
    static void makeData()
    {
        Case case1 = new Case(Subject = 'Test Subject1', Origin = 'Phone');  
        insert case1;     
        
        Case case2 = new Case(Subject = 'Test Subject2', Origin = 'Web', ParentId = case1.Id);  
        insert case2;

        Case case3 = new Case(Subject = 'Test Subject3', Origin = 'Phone', ParentId = case2.Id);  
        insert case3;

        Case case4 = new Case(Subject = 'Test Subject4', Origin = 'Email', ParentId = case1.Id);  
        insert case4;

        Case case5 = new Case(Subject = 'Test Subject5', Origin = 'Email', ParentId = case4.Id);  
        insert case5;

        Case case6 = new Case(Subject = 'Test Subject6', Origin = 'Web', ParentId = case4.Id);  
        insert case6;
    }

    //This method tests getChildCases method of ChildCasesHierarchyController class
    @isTest
    public static void callGetChildCases() 
    {
            Case c1 = [SELECT Id, CaseNumber, Subject, Origin, ParentId
                        FROM Case
                        WHERE Subject = 'Test Subject1' LIMIT 1];

            Case c3 = [SELECT Id, CaseNumber, Subject, Origin, ParentId
                       FROM Case
                       WHERE Subject = 'Test Subject3' LIMIT 1];
            
            List<Case> childOfc1 = ChildCasesHierarchyController.getChildCases(c1.Id);
            List<Case> childOfc3 = ChildCasesHierarchyController.getChildCases(c3.Id);

            Test.startTest();
            System.assertEquals( 2, childOfc1.size() );
            System.assert(String.valueOf(childOfc1[0].getSObjectType()) == 'Case');
            System.assertNotEquals(null, childOfc1[0].CaseNumber);
            System.assertNotEquals(null, childOfc1[0].Subject);
            System.assertNotEquals(null, childOfc1[0].Origin);
            System.assertEquals( 0, childOfc3.size() );
            Test.stopTest();
    }
}