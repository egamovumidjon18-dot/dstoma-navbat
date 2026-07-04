const fs = require('fs');
let c = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');
c = c.replace(/className=\{\\\`font-bold \\\$\{patient\.debt > 0 \? 'text-rose-500' : 'text-emerald-500'\}\\\`\}/g, "className={`font-bold ${patient.debt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}");
c = c.replace(/\{patient\.debt > 0 \? \\\`\\\$\{patient\.debt\.toLocaleString\(\)\} so'm\\\` : "0 so'm"\}/g, "{patient.debt > 0 ? `${patient.debt.toLocaleString()} so'm` : \"0 so'm\"}");
c = c.replace(/src=\{\\\`https:\/\/api\.dicebear\.com\/7\.x\/adventurer\/svg\?seed=\\\$\{patient\.id\}\\\`\}/g, "src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${patient.id}`}");
c = c.replace(/className=\{\\\`text-\[10px\] font-bold px-2\.5 py-1 rounded uppercase \\\$\{patient\.status === 'Faol' \? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'\}\\\`\}/g, "className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase ${patient.status === 'Faol' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}");
fs.writeFileSync('src/components/DoctorDashboard.tsx', c);
