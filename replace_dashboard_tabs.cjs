const fs = require('fs');
let c = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');

c = c.replace(/import PatientProfile from "\.\/PatientProfile";/, 'import PatientProfile from "./PatientProfile";\nimport DentalChart from "./DentalChart";\nimport TreatmentPlan from "./TreatmentPlan";');

const replacementChart = `{activeView === "dental_chart" && (
            selectedPatientId ? (
              <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <DentalChart patientId={selectedPatientId.toString()} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                 <p>Iltimos, dental chart ko'rish uchun bemorni tanlang</p>
                 <button onClick={() => setActiveView("bemorlar")} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold">Bemorlar ro'yxatiga o'tish</button>
              </div>
            )
          )}`;

c = c.replace(/\{activeView === "dental_chart" && \([\s\S]*?<\/div>\s*\)\}/, replacementChart);

const replacementPlan = `{activeView === "davolash_rejasi" && (
            selectedPatientId ? (
              <div className="h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <TreatmentPlan patientId={selectedPatientId.toString()} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                 <p>Iltimos, davolash rejasini ko'rish uchun bemorni tanlang</p>
                 <button onClick={() => setActiveView("bemorlar")} className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-bold">Bemorlar ro'yxatiga o'tish</button>
              </div>
            )
          )}`;

c = c.replace(/\{activeView === "davolash_rejasi" && \([\s\S]*?<\/div>\s*\)\}/, replacementPlan);

fs.writeFileSync('src/components/DoctorDashboard.tsx', c);
