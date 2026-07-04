const fs = require('fs');
let code = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');

const startIndex = code.indexOf('{activeView === "eslatmalar" && (');
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
    const newContent = `{activeView === "eslatmalar" && (
  <div className="space-y-6">
    {/* Eslatmalar Top Cards */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Bell className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">Barcha eslatmalar</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">28</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Clock className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">Bugun</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">5</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><CalendarCheck2 className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">7 kun ichida</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">12</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><CalendarCheck2 className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">30 kun ichida</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">9</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><CheckCircle2 className="w-6 h-6" /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 mb-1">Muddati o'tgan</p>
          <div className="flex items-end gap-1"><span className="text-2xl font-black text-slate-800 leading-none">2</span><span className="text-[10px] font-bold text-slate-400">ta</span></div>
        </div>
      </div>
    </div>

    {/* Eslatmalar Main Area */}
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left List */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button className="px-4 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg">Barchasi</button>
            <button className="px-4 py-1.5 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors">Menda</button>
            <button className="px-4 py-1.5 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors">Shifokorlar bo'yicha</button>
          </div>
          <div className="flex items-center gap-3">
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none font-semibold">
              <option>Sana bo'yicha</option>
            </select>
            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-md shadow-blue-500/20">
              <Plus className="w-3.5 h-3.5" /> Eslatma qo'shish
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4 text-xs font-semibold text-slate-500 border-b border-slate-100 pb-4">
           <div className="flex items-center gap-2">Holati: <select className="bg-transparent font-bold text-slate-800 outline-none"><option>Barchasi</option></select></div>
           <div className="flex items-center gap-2">Sana oralig'i: <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100 font-mono">dd.mm.yyyy - dd.mm.yyyy <CalendarCheck2 className="inline w-3 h-3 ml-1" /></span></div>
           <div className="flex items-center gap-2 ml-auto">Eslatma turi: <select className="bg-transparent font-bold text-slate-800 outline-none"><option>Barchasi</option></select></div>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
           {/* Active Item */}
           <div className="border border-amber-300 bg-amber-50/30 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors">
              <div className="flex items-center gap-4 w-1/3">
                 <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=b1" className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-slate-100" />
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm">Karimov Behzod Anvarovich</h4>
                   <p className="text-[11px] text-slate-500 font-mono mt-0.5"><Phone className="inline w-3 h-3 mr-1"/>99 987 65 43</p>
                 </div>
              </div>
              <div className="w-1/3">
                 <h4 className="font-bold text-slate-800 text-xs">Implant nazorati</h4>
                 <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">36-tishga qo'yilgan implant nazoratini amalga oshirish.</p>
              </div>
              <div className="w-1/6">
                 <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1"><CalendarCheck2 className="w-3.5 h-3.5 text-amber-500" /> Bugun</p>
                 <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> 10:30</p>
              </div>
              <div className="w-1/6 text-right">
                 <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Bugun</span>
              </div>
           </div>

           {/* Normal Item */}
           <div className="border border-slate-100 hover:border-slate-200 bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors">
              <div className="flex items-center gap-4 w-1/3">
                 <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=b2" className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-slate-100" />
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm">Saidova Malika Rustamovna</h4>
                   <p className="text-[11px] text-slate-500 font-mono mt-0.5"><Phone className="inline w-3 h-3 mr-1"/>90 123 45 67</p>
                 </div>
              </div>
              <div className="w-1/3">
                 <h4 className="font-bold text-slate-800 text-xs">Ortodontiya nazorati</h4>
                 <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Breket tizimini faollashtirish va nazorat qilish.</p>
              </div>
              <div className="w-1/6">
                 <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1"><CalendarCheck2 className="w-3.5 h-3.5 text-amber-500" /> Bugun</p>
                 <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> 14:00</p>
              </div>
              <div className="w-1/6 text-right">
                 <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Bugun</span>
              </div>
           </div>

           {/* Overdue Item */}
           <div className="border border-slate-100 hover:border-slate-200 bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors">
              <div className="flex items-center gap-4 w-1/3">
                 <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=b3" className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-slate-100" />
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm">Abdullayev Sardorbek</h4>
                   <p className="text-[11px] text-slate-500 font-mono mt-0.5"><Phone className="inline w-3 h-3 mr-1"/>91 234 56 78</p>
                 </div>
              </div>
              <div className="w-1/3">
                 <h4 className="font-bold text-slate-800 text-xs">Plomba nazorati</h4>
                 <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">46-tish plombasini nazorat qilish.</p>
              </div>
              <div className="w-1/6">
                 <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 mb-1"><CalendarCheck2 className="w-3.5 h-3.5" /> 12.05.2024</p>
                 <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> 11:00</p>
              </div>
              <div className="w-1/6 text-right">
                 <span className="inline-block bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Muddati o'tgan</span>
              </div>
           </div>
           
           {/* Future Item */}
           <div className="border border-slate-100 hover:border-slate-200 bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors">
              <div className="flex items-center gap-4 w-1/3">
                 <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=b4" className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-slate-100" />
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm">Ergasheva Nilufar Akbarovna</h4>
                   <p className="text-[11px] text-slate-500 font-mono mt-0.5"><Phone className="inline w-3 h-3 mr-1"/>94 567 89 01</p>
                 </div>
              </div>
              <div className="w-1/3">
                 <h4 className="font-bold text-slate-800 text-xs">Professional tozalash</h4>
                 <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Og'iz bo'shlig'ini professional tozalash.</p>
              </div>
              <div className="w-1/6">
                 <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1"><CalendarCheck2 className="w-3.5 h-3.5 text-blue-500" /> 14.05.2024</p>
                 <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> 09:30</p>
              </div>
              <div className="w-1/6 text-right">
                 <span className="inline-block bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">3 kun qoldi</span>
              </div>
           </div>
        </div>
      </div>

      {/* Right Details Panel */}
      <div className="w-full lg:w-[350px] shrink-0 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
         <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-base">Eslatma tafsilotlari</h3>
            <div className="flex items-center gap-2">
              <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
              <button className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
         </div>
         
         <div className="flex items-center gap-4 mb-6">
            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=b1" className="w-16 h-16 rounded-full bg-slate-100" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm leading-tight">Karimov Behzod Anvarovich</h4>
              <p className="text-[10px] text-slate-500 mt-1">29 yosh (12.05.1995)</p>
              <div className="flex items-center justify-between mt-1.5">
                 <p className="text-xs font-mono text-slate-600 font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> 99 987 65 43</p>
                 <div className="flex gap-1.5">
                   <button className="p-1.5 bg-slate-50 hover:bg-slate-100 text-blue-600 rounded-full"><Phone className="w-3 h-3" /></button>
                   <button className="p-1.5 bg-slate-50 hover:bg-slate-100 text-blue-600 rounded-full"><Send className="w-3 h-3" /></button>
                   <button className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full"><MoreVertical className="w-3 h-3" /></button>
                 </div>
              </div>
            </div>
         </div>

         <div className="space-y-4 text-xs font-medium text-slate-600 border-b border-slate-100 pb-6 mb-6">
            <div className="grid grid-cols-2 gap-2">
               <span className="flex items-center gap-2 text-slate-400"><Tag className="w-4 h-4" /> Eslatma turi</span>
               <span className="text-slate-800 text-right">Implant nazorati</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
               <span className="flex items-center gap-2 text-slate-400"><CalendarCheck2 className="w-4 h-4" /> Eslatma sanasi</span>
               <span className="text-slate-800 text-right">13.05.2024</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
               <span className="flex items-center gap-2 text-slate-400"><Clock className="w-4 h-4" /> Vaqti</span>
               <span className="text-slate-800 text-right">10:30</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
               <span className="flex items-center gap-2 text-slate-400"><CheckCircle className="w-4 h-4" /> Holati</span>
               <div className="text-right"><span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">Bugun</span></div>
            </div>
            <div className="mt-4 pt-2">
               <span className="flex items-center gap-2 text-slate-400 mb-1"><FileText className="w-4 h-4" /> Eslatma matni</span>
               <p className="text-slate-800 leading-snug">36-tishga qo'yilgan implant nazoratini amalga oshirish. Rentgen tekshiruvi va yallig'lanish belgilarini tekshirish.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
               <span className="flex items-center gap-2 text-slate-400"><User className="w-4 h-4" /> Shifokor</span>
               <span className="text-slate-800 text-right">Dr. Asilbek Xolmirzayev</span>
            </div>
         </div>

         <div className="mb-6">
            <h4 className="font-bold text-slate-800 text-xs mb-4">Eslatma tarixi</h4>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100">
               {/* timeline items */}
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                 <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-emerald-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                   <Check className="w-3 h-3" />
                 </div>
                 <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-100 bg-slate-50 text-[10px] font-medium text-slate-800 shadow-sm flex flex-col gap-1">
                    <span className="text-slate-400">10.05.2024 09:15</span>
                    <span className="font-bold">Eslatma yaratildi</span>
                    <span className="text-slate-500">Dr. Asilbek</span>
                 </div>
               </div>
               <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                 <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-blue-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                   <Send className="w-3 h-3" />
                 </div>
                 <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-100 bg-slate-50 text-[10px] font-medium text-slate-800 shadow-sm flex flex-col gap-1">
                    <span className="text-slate-400">11.05.2024 09:00</span>
                    <span className="font-bold">Bemorga Telegram orqali eslatildi</span>
                 </div>
               </div>
            </div>
         </div>

         <div className="mt-auto space-y-3">
            <div className="flex gap-3">
              <button className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl transition-colors">Tahrirlash</button>
              <button className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> O'chirish</button>
            </div>
            <button className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1">
               <CheckCircle className="w-4 h-4" /> Bajarildi deb belgilash
            </button>
         </div>
      </div>
    </div>
  </div>
)}`;
    code = code.substring(0, startIndex) + newContent + code.substring(endIndex + 1);
    fs.writeFileSync('src/components/DoctorDashboard.tsx', code);
    console.log("Updated Eslatmalar successfully");
} else {
    console.log("Could not find matching end parenthesis.");
}
