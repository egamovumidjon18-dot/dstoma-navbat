const fs = require('fs');
let c = fs.readFileSync('src/components/PatientProfile.tsx', 'utf8');

const regex = /\{activeTab === "plan" && \([\s\S]*?<\/table>\s*<\/div>\s*\)\}/;
const replacement = `{activeTab === "plan" && (
              <div className="h-full">
                <TreatmentPlan patientId={patientId.toString()} />
              </div>
            )}`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/components/PatientProfile.tsx', c);
