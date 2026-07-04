const fs = require('fs');
let code = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');

const startIndex = code.indexOf('{activeView === "navbatlar" && (');
if (startIndex === -1) throw new Error("Could not find start");

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
    const newContent = `{activeView === "navbatlar" && (
  <div className="space-y-6">
    {/* Navbatlar Top Cards */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Users className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">Barcha navbatlar</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">28</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><CheckCircle2 className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">Qabul qilinganlar</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">12</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Clock className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">Kutilayotganlar</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">9</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><CalendarCheck2 className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">Kechiktirilganlar</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">5</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><X className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">Bekor qilinganlar</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">2</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
    </div>

    {/* Navbatlar Main Table */}
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
         <div className="flex items-center gap-2">
            <button className="px-4 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg">Bugun</button>
            <button className="px-4 py-1.5 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors">Barcha navbatlar</button>
         </div>
         <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="Bemor ismi, tel yoki navbat raqami..." className="w-64 bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-3 pr-8 text-xs outline-none" />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2" />
            </div>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none font-semibold">
              <option>Holati bo'yicha</option>
            </select>
            <button className="px-3 py-1.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
            </button>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
            <tr>
              <th className="font-semibold py-2.5 px-3 rounded-l-lg">#</th>
              <th className="font-semibold py-2.5 px-2">Vaqt</th>
              <th className="font-semibold py-2.5 px-2">Bemor</th>
              <th className="font-semibold py-2.5 px-2">Xizmat</th>
              <th className="font-semibold py-2.5 px-2">Holati</th>
              <th className="font-semibold py-2.5 px-2">Navbat raqami</th>
              <th className="font-semibold py-2.5 px-3 text-right rounded-r-lg">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {/* 1 */}
             <tr className="hover:bg-slate-50 transition-colors cursor-pointer bg-blue-50/30">
               <td className="py-3 px-3 font-medium">1</td>
               <td className="py-3 px-2 text-slate-500 font-medium">09:00</td>
               <td className="py-3 px-2">
                 <div className="flex items-center gap-2">
                   <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=n1" className="w-8 h-8 rounded-full bg-slate-100" />
                   <div>
                     <p className="font-bold text-slate-800">Aliyev Alisher</p>
                     <p className="text-[9px] text-slate-400 font-mono">99 123 45 67</p>
                   </div>
                 </div>
               </td>
               <td className="py-3 px-2 text-slate-600 font-medium">Ko'rik</td>
               <td className="py-3 px-2">
                 <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded uppercase">Qabulda</span>
               </td>
               <td className="py-3 px-2 font-mono font-bold text-slate-700">A-001</td>
               <td className="py-3 px-3 text-right">
                 <div className="flex items-center justify-end gap-2">
                   <button className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"><Check className="w-3 h-3" /> Yakunlash</button>
                   <button className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"><MoreVertical className="w-4 h-4" /></button>
                 </div>
               </td>
             </tr>
             {/* 2 */}
             <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
               <td className="py-3 px-3 font-medium">2</td>
               <td className="py-3 px-2 text-slate-500 font-medium">09:30</td>
               <td className="py-3 px-2">
                 <div className="flex items-center gap-2">
                   <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=n2" className="w-8 h-8 rounded-full bg-slate-100" />
                   <div>
                     <p className="font-bold text-slate-800">Karimov Behzod</p>
                     <p className="text-[9px] text-slate-400 font-mono">99 987 65 43</p>
                   </div>
                 </div>
               </td>
               <td className="py-3 px-2 text-slate-600 font-medium">Plomba</td>
               <td className="py-3 px-2">
                 <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded uppercase">Kutmoqda</span>
               </td>
               <td className="py-3 px-2 font-mono font-bold text-slate-700">A-002</td>
               <td className="py-3 px-3 text-right">
                 <div className="flex items-center justify-end gap-1.5">
                   <button className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg transition-colors">Qabulni boshlash</button>
                   <button className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold rounded-lg transition-colors">Kechiktirish</button>
                   <button className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg transition-colors">Kelmadi</button>
                 </div>
               </td>
             </tr>
             {/* 3 */}
             <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
               <td className="py-3 px-3 font-medium">3</td>
               <td className="py-3 px-2 text-slate-500 font-medium">10:00</td>
               <td className="py-3 px-2">
                 <div className="flex items-center gap-2">
                   <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=n3" className="w-8 h-8 rounded-full bg-slate-100" />
                   <div>
                     <p className="font-bold text-slate-800">Ergashev Sardor</p>
                     <p className="text-[9px] text-slate-400 font-mono">90 555 11 22</p>
                   </div>
                 </div>
               </td>
               <td className="py-3 px-2 text-slate-600 font-medium">Kanal davolash</td>
               <td className="py-3 px-2">
                 <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded uppercase">Kutmoqda</span>
               </td>
               <td className="py-3 px-2 font-mono font-bold text-slate-700">A-003</td>
               <td className="py-3 px-3 text-right">
                 <div className="flex items-center justify-end gap-1.5">
                   <button className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg transition-colors">Qabulni boshlash</button>
                   <button className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold rounded-lg transition-colors">Kechiktirish</button>
                   <button className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg transition-colors">Kelmadi</button>
                 </div>
               </td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    {/* Selected Patient Data (Bemor kartasi, Dental Chart, Rentgenlar) */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-slate-800 text-base">Bemor kartasi</h3>
             <button className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"><User className="w-3 h-3" /> To'liq ko'rish</button>
           </div>
           <div className="flex items-center gap-3 mb-5">
             <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=n1" className="w-14 h-14 rounded-full bg-slate-100" />
             <div>
               <h4 className="font-bold text-slate-800 text-sm">Aliyev Alisher</h4>
               <p className="text-[10px] text-slate-500">32 yosh (15.08.1992)</p>
               <p className="text-xs font-mono text-slate-600 mt-0.5 font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> 99 123 45 67</p>
             </div>
           </div>
           <div className="space-y-2 text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-100">
             <div className="flex justify-between border-b border-slate-200 pb-1">
               <span className="text-slate-500 font-medium">Allergiya:</span>
               <span className="font-bold text-slate-800">Yo'q</span>
             </div>
             <div className="flex justify-between border-b border-slate-200 pb-1">
               <span className="text-slate-500 font-medium">Kasalliklar:</span>
               <span className="font-bold text-slate-800">Yo'q</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500 font-medium">Shikoyat:</span>
               <span className="font-bold text-slate-800 text-right w-3/5">Muntazam ko'rik</span>
             </div>
           </div>
       </div>

       <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
         <div className="flex items-center justify-between mb-4">
           <h3 className="font-bold text-slate-800 text-base">Rentgenlar</h3>
           <button className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> Yuklash</button>
         </div>
         <div className="grid grid-cols-2 gap-3">
            <div className="relative group cursor-pointer aspect-video bg-slate-900 rounded-xl overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center text-white/50 group-hover:text-white transition-colors">
                 <ImageIcon className="w-8 h-8" />
               </div>
               <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                 <p className="text-[10px] font-bold">Panoramali rentgen</p>
                 <p className="text-[8px] text-white/70">12.05.2024</p>
               </div>
            </div>
            <div className="relative group cursor-pointer aspect-video bg-slate-900 rounded-xl overflow-hidden border border-dashed border-slate-300 flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
               <div className="p-2 bg-blue-50 text-blue-500 rounded-full mb-1">
                 <Plus className="w-4 h-4" />
               </div>
               <p className="text-[10px] font-bold text-slate-500">Yangi rentgen qo'shish</p>
            </div>
         </div>
       </div>
    </div>
  </div>
)}`;
    code = code.substring(0, startIndex) + newContent + code.substring(endIndex + 1);
    fs.writeFileSync('src/components/DoctorDashboard.tsx', code);
    console.log("Updated Navbatlar successfully");
} else {
    console.log("Could not find matching end parenthesis.");
}
