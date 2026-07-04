const fs = require('fs');
let c = fs.readFileSync('src/components/PatientProfile.tsx', 'utf8');
c = c.replace(/className=\{\\\`flex/g, 'className={`flex');
c = c.replace(/\\\\\$\{/g, '${');
c = c.replace(/\\n\s*\}\\\`\}/g, '\n                  }`}');
fs.writeFileSync('src/components/PatientProfile.tsx', c);
