import { db } from './database/db.js';
import { tenantContext } from './utils/context.js';

async function runTest() {
  tenantContext.run({ orgId: 'default' }, async () => {
    try {
      const employees = await db.find('employees');
      console.log('Employees found:', employees.length);
      console.log(employees);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
    process.exit(0);
  });
}

runTest();
