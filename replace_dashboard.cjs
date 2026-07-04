const fs = require('fs');
let code = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');

const startIndex = code.indexOf('{activeView === "dashboard" && (');
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
    const newContent = `{activeView === "dashboard" && (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Top Cards */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
             <Users className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bugungi bemorlar</h3>
           </div>
        </div>
        <div className="mt-3 flex items-end gap-2">
           <span className="text-3xl font-black text-slate-800">27</span>
           <span className="text-[11px] font-bold text-emerald-500 mb-1">+5 yangi</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl">
             <Clock className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hozir qabulda</h3>
           </div>
        </div>
        <div className="mt-3 flex flex-col">
           <span className="text-3xl font-black text-slate-800">3</span>
           <span className="text-[10px] font-semibold text-slate-400">Qabul davom etmoqda</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl">
             <Wallet className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Bugungi tushum</h3>
           </div>
        </div>
        <div className="mt-3 flex flex-col">
           <span className="text-2xl font-black text-slate-800">4 500 000 <span className="text-sm">so'm</span></span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
             <Users className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kutilayotgan</h3>
           </div>
        </div>
        <div className="mt-3 flex flex-col">
           <span className="text-3xl font-black text-slate-800">7</span>
           <span className="text-[10px] font-semibold text-slate-400">navbatda</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
             <CheckCircle className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tugatilgan qabul</h3>
           </div>
        </div>
        <div className="mt-3 flex flex-col">
           <span className="text-3xl font-black text-slate-800">20</span>
           <span className="text-[10px] font-semibold text-slate-400">bugun</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
             <Clock className="w-5 h-5" />
           </div>
           <div>
             <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">O'rtacha qabul vaqti</h3>
           </div>
        </div>
        <div className="mt-3 flex items-end gap-1">
           <span className="text-3xl font-black text-slate-800">28</span>
           <span className="text-xs font-semibold text-slate-500 mb-1">daqiqa</span>
        </div>
      </div>
    </div>

    {/* Layout rows */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Bugungi Navbatlar */}
      <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
           <h3 className="font-bold text-slate-800 text-base">Bugungi navbatlar</h3>
           <button className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors">Barcha navbatlar</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-100">
              <tr>
                <th className="font-medium pb-2">#</th>
                <th className="font-medium pb-2">Vaqt</th>
                <th className="font-medium pb-2">Bemor</th>
                <th className="font-medium pb-2">Xizmat</th>
                <th className="font-medium pb-2 text-right">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {/* 1 */}
               <tr>
                 <td className="py-3">1</td>
                 <td className="py-3 text-slate-500">09:00</td>
                 <td className="py-3 font-semibold text-slate-800">Aliyev Alisher<br/><span className="text-[9px] text-slate-400 font-normal">99 123 45 67</span></td>
                 <td className="py-3 text-slate-500">Ko'rik</td>
                 <td className="py-3 text-right">
                   <div className="flex items-center justify-end gap-2">
                     <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Kutmoqda</span>
                     <button className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><Play className="w-3.5 h-3.5 fill-current" /></button>
                   </div>
                 </td>
               </tr>
               {/* 2 */}
               <tr>
                 <td className="py-3">2</td>
                 <td className="py-3 text-slate-500">09:30</td>
                 <td className="py-3 font-semibold text-slate-800">Karimov Behzod<br/><span className="text-[9px] text-slate-400 font-normal">99 987 65 43</span></td>
                 <td className="py-3 text-slate-500">Plomba</td>
                 <td className="py-3 text-right">
                   <div className="flex items-center justify-end gap-2">
                     <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Qabulda</span>
                     <button className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Check className="w-3.5 h-3.5" /></button>
                   </div>
                 </td>
               </tr>
               {/* 3 */}
               <tr>
                 <td className="py-3">3</td>
                 <td className="py-3 text-slate-500">10:00</td>
                 <td className="py-3 font-semibold text-slate-800">Ergashev Sardor<br/><span className="text-[9px] text-slate-400 font-normal">90 555 11 22</span></td>
                 <td className="py-3 text-slate-500">Kanal davolash</td>
                 <td className="py-3 text-right">
                   <div className="flex items-center justify-end gap-2">
                     <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Kutmoqda</span>
                     <button className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><Play className="w-3.5 h-3.5 fill-current" /></button>
                   </div>
                 </td>
               </tr>
               {/* 4 */}
               <tr>
                 <td className="py-3">4</td>
                 <td className="py-3 text-slate-500">10:30</td>
                 <td className="py-3 font-semibold text-slate-800">Usmonova Dildora<br/><span className="text-[9px] text-slate-400 font-normal">91 234 56 78</span></td>
                 <td className="py-3 text-slate-500">Oqartirish</td>
                 <td className="py-3 text-right">
                   <div className="flex items-center justify-end gap-2">
                     <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Kutmoqda</span>
                     <button className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><Play className="w-3.5 h-3.5 fill-current" /></button>
                   </div>
                 </td>
               </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dental Chart */}
      <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
         <div className="flex items-center justify-between mb-4">
           <h3 className="font-bold text-slate-800 text-base">Dental Chart</h3>
           <div className="flex gap-2">
             <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Tozalash</button>
             <button className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"><Settings className="w-4 h-4" /></button>
             <button className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"><Maximize2 className="w-4 h-4" /></button>
           </div>
         </div>
         <div className="flex justify-center gap-4 mb-6">
            <button className="px-6 py-1.5 bg-blue-600 text-white rounded-full text-xs font-semibold shadow-md shadow-blue-500/20">Doimiy tishlar</button>
            <button className="px-6 py-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full text-xs font-semibold">Sut tishlar</button>
         </div>
         
         <div className="h-[200px] flex items-center justify-center bg-slate-50 rounded-2xl mb-6">
            <span className="text-slate-400 text-sm font-semibold">Teeth Model Container</span>
            {/* Here we can place the real ThreeDentalModel later */}
         </div>

         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-2 text-[10px] font-medium text-slate-600">
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-slate-300"></span> Sog'lom</div>
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Karies</div>
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Pulpit</div>
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Kanal davolangan</div>
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Plomba</div>
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Koronka</div>
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-500"></span> Implant</div>
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-800"></span> Olib tashlangan</div>
         </div>
      </div>

      {/* Bemor Kartasi & Davolash Rejasi */}
      <div className="lg:col-span-3 space-y-6">
         {/* Bemor Kartasi */}
         <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 relative">
           <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
           <h3 className="font-bold text-slate-800 text-base mb-4">Bemor kartasi</h3>
           <div className="flex items-center gap-3 mb-5">
             <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=behzod" className="w-14 h-14 rounded-full bg-slate-100" />
             <div>
               <h4 className="font-bold text-slate-800 text-sm">Karimov Behzod Anvarovich</h4>
               <p className="text-[10px] text-slate-500">29 yosh (12.05.1995)</p>
               <p className="text-xs font-mono text-slate-600 mt-0.5 font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> 99 987 65 43</p>
             </div>
           </div>
           <div className="flex gap-2 mb-6">
             <button className="flex-1 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center transition-colors"><Phone className="w-4 h-4" /></button>
             <button className="flex-1 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center transition-colors"><Send className="w-4 h-4" /></button>
             <button className="flex-1 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center transition-colors"><MessageSquare className="w-4 h-4" /></button>
           </div>
           
           <div className="space-y-2 text-[11px]">
             <div className="flex justify-between border-b border-slate-50 pb-1">
               <span className="text-slate-500">Allergiya</span>
               <span className="font-medium text-slate-800">Penitsillin</span>
             </div>
             <div className="flex justify-between border-b border-slate-50 pb-1">
               <span className="text-slate-500">Kasalliklar</span>
               <span className="font-medium text-slate-800">Gastrit</span>
             </div>
             <div className="flex justify-between">
               <span className="text-slate-500">Shikoyat</span>
               <span className="font-medium text-slate-800 text-right w-3/5">O'ng pastki tishda og'riq</span>
             </div>
           </div>
         </div>

         {/* Davolash Rejasi */}
         <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-slate-800 text-base">Davolash rejasi</h3>
             <button className="text-blue-600 flex items-center gap-1 text-[10px] font-bold hover:bg-blue-50 px-2 py-1 rounded"><Plus className="w-3 h-3" /> Yangi reja</button>
           </div>
           <table className="w-full text-left text-[10px]">
             <thead className="text-slate-400 border-b border-slate-50">
               <tr>
                 <th className="pb-2 font-medium">Tish</th>
                 <th className="pb-2 font-medium">Muolaja</th>
                 <th className="pb-2 font-medium text-right">Narx (so'm)</th>
                 <th className="pb-2 font-medium text-right">Holati</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50 font-medium">
               <tr>
                 <td className="py-2.5">36</td>
                 <td className="py-2.5 text-slate-800">Kanal davolash</td>
                 <td className="py-2.5 text-right text-slate-800">600 000</td>
                 <td className="py-2.5 text-right"><Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" /></td>
               </tr>
               <tr>
                 <td className="py-2.5">37</td>
                 <td className="py-2.5 text-slate-800">Plomba (kompozit)</td>
                 <td className="py-2.5 text-right text-slate-800">350 000</td>
                 <td className="py-2.5 text-right"><Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" /></td>
               </tr>
               <tr>
                 <td className="py-2.5">38</td>
                 <td className="py-2.5 text-slate-800">Plomba (kompozit)</td>
                 <td className="py-2.5 text-right text-slate-800">300 000</td>
                 <td className="py-2.5 text-right text-amber-500 font-bold">Kutmoqda</td>
               </tr>
             </tbody>
             <tfoot className="border-t border-slate-100">
               <tr>
                 <td colSpan={2} className="pt-3 font-bold text-right text-slate-800 text-xs">Jami:</td>
                 <td colSpan={2} className="pt-3 font-bold text-right text-slate-800 text-xs">1 250 000 so'm</td>
               </tr>
             </tfoot>
           </table>
           <button className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer">
             Reja tasdiqlash
           </button>
         </div>
      </div>
    </div>
  </div>
)}`;
    code = code.substring(0, startIndex) + newContent + code.substring(endIndex + 1);
    fs.writeFileSync('src/components/DoctorDashboard.tsx', code);
    console.log("Updated successfully");
} else {
    console.log("Could not find matching end parenthesis.");
}
