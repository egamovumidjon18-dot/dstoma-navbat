const fs = require('fs');
let c = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');
c = c.replace(/\\\\`/g, '`');
c = c.replace(/\\\\\\$/g, '$');
fs.writeFileSync('src/components/DoctorDashboard.tsx', c);
