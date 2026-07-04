const fs = require('fs');
let code = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');

if (!code.includes("import PatientProfile")) {
    code = code.replace(
        'import {', 
        'import PatientProfile from "./PatientProfile";\nimport {'
    );
}

if (!code.includes("const [selectedPatientId, setSelectedPatientId] = useState")) {
    code = code.replace(
        'const [activeView, setActiveView] = useState("dashboard");',
        'const [activeView, setActiveView] = useState("dashboard");\n  const [selectedPatientId, setSelectedPatientId] = useState<string | number | null>(null);'
    );
}

const searchStr = '{activeView === "bemorlar" && (';
const startIndex = code.indexOf(searchStr);

if (startIndex !== -1) {
    let openCount = 0;
    let endIndex = -1;
    for (let i = startIndex; i < code.length; i++) {
        if (code[i] === '{' || code[i] === '(') openCount++;
        if (code[i] === '}' || code[i] === ')') {
            openCount--;
            if (openCount === 0) {
                endIndex = i;
                break;
            }
        }
    }
    
    if (endIndex !== -1) {
        const innerContent = code.substring(startIndex + searchStr.length, endIndex);
        const newContent = '{activeView === "bemorlar" && (\n            selectedPatientId ? (\n                <PatientProfile patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />\n            ) : (' + innerContent + ')\n        )';
        
        code = code.substring(0, startIndex) + newContent + code.substring(endIndex + 1);
        
        code = code.replace(
            /className="hover:bg-slate-50 transition-colors group cursor-pointer"/g,
            'className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedPatientId(patient.id)}'
        );

        fs.writeFileSync('src/components/DoctorDashboard.tsx', code);
        console.log("Updated state in DoctorDashboard");
    } else {
        console.log("Could not find matching end parenthesis.");
    }
} else {
    console.log("Could not find Bemorlar block.");
}
