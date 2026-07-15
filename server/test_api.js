import http from 'http';

const data = JSON.stringify({ email: 'admin@vms.com', password: 'admin123' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const response = JSON.parse(body);
    if (!response.token) {
      console.log('Login failed:', response);
      process.exit(1);
    }
    console.log('Login successful, fetching employees...');
    
    const empOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/employees',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${response.token}` }
    };
    
    http.request(empOptions, (empRes) => {
      let empBody = '';
      empRes.on('data', d => empBody += d);
      empRes.on('end', () => {
        console.log('Employees Data:', empBody.substring(0, 500));
      });
    }).end();
  });
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
