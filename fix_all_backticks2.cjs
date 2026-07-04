const fs = require('fs');
let c = fs.readFileSync('src/components/PatientProfile.tsx', 'utf8');
c = c.replace(/ transition-colors \\\$\{/g, ' transition-colors ${');
c = c.replace(/\s*\}\\\`\}/g, '\n                  }`}');
fs.writeFileSync('src/components/PatientProfile.tsx', c);
