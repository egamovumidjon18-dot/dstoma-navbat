const fs = require('fs');
let code = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');

const startStr = '{activeView === "bemorlar" && (';
const startIndex = code.indexOf(startStr);
const endStr = '{activeView === "dental_chart" && (';
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const cleanBlock = fs.readFileSync('bemorlar_block.txt', 'utf8');
    code = code.substring(0, startIndex) + cleanBlock + code.substring(endIndex);
    fs.writeFileSync('src/components/DoctorDashboard.tsx', code);
    console.log("Success");
} else {
    console.log("Failed to find boundaries");
}
