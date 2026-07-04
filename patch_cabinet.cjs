const fs = require('fs');
const content = fs.readFileSync('src/components/ClientDashboard.tsx', 'utf-8');

const startMarker = "{activeSubView === 'cabinet' && (";
const startIndex = content.indexOf(startMarker);
if (startIndex === -1) throw new Error("Could not find start");

let openBraces = 0;
let endIndex = -1;
for (let i = startIndex; i < content.length; i++) {
  if (content[i] === '{') openBraces++;
  else if (content[i] === '}') {
    openBraces--;
    if (openBraces === 0) {
      endIndex = i;
      break;
    }
  }
}

const replacement = `{activeSubView === 'cabinet' && currentUser && (
        <PatientPanel patient={currentUser} onLogout={() => { setActiveSubView('home'); setCurrentUser(null); }} />
      )}`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex + 1);
fs.writeFileSync('src/components/ClientDashboard.tsx', newContent);
console.log('Replaced cabinet view successfully.');
