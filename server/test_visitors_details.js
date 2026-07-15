import { db } from './database/db.js';
import { tenantContext } from './utils/context.js';

async function testVisitors() {
  tenantContext.run({ orgId: 'default' }, async () => {
    try {
      const visitors = await db.find('visitors');
      console.log('Visitors found:', visitors.length);
      if (visitors.length > 0) {
        console.log('Sample visitor:', JSON.stringify(visitors[0], null, 2));
      }
    } catch (err) {
      console.error('Error fetching visitors:', err);
    }
    process.exit(0);
  });
}

testVisitors();
