/**
 * Test class for RollupBatchExecutorFactoryTest
 * 
 * @author Ahsan Butt
 */
@isTest
public class RollupBatchExecutorFactoryTest {
    static testMethod void testCreateInstance() {
        System.assertNotEquals(null, RollupBatchExecutorFactory.createInstance('COUNT'));
        
        try {
            RollupBatchExecutorFactory.createInstance('FOOBAR');
            System.assert(false, 'Factory should throw exception for non-sense function');
        } catch (Exception e) {
            System.assert(true);
        }
    }
}