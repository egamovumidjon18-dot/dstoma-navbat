const fs = require('fs');
let code = fs.readFileSync('src/components/DoctorDashboard.tsx', 'utf8');

const startIndex = code.indexOf('{activeView === "foto_galereya" && (');
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
    const newContent = `{activeView === "foto_galereya" && (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
       <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><ImageIcon className="w-6 h-6" /></div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg leading-tight">Foto galereya</h2>
            <p className="text-[11px] text-slate-500 font-medium">Bemorlarning davolanish jarayoni rasmlari</p>
          </div>
       </div>
       <div className="flex items-center gap-3">
          <div className="relative">
            <input type="text" placeholder="Bemor qidirish..." className="w-56 bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs outline-none focus:border-indigo-500/50 transition-colors" />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-md shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Yangi rasm qo'shish
          </button>
       </div>
    </div>

    <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
       <button className="px-4 py-2 border-b-2 border-indigo-600 text-indigo-600 font-bold text-xs">Hammasi (24)</button>
       <button className="px-4 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors">Jarayongacha (12)</button>
       <button className="px-4 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors">Jarayondan so'ng (12)</button>
       <button className="px-4 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors">Rentgenlar (8)</button>
    </div>

    {/* Bemorlar Albomlari */}
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm">Bemorlar bo'yicha albomlar</h3>
        <button className="text-indigo-600 text-[11px] font-bold hover:underline">Barchasini ko'rish</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group text-center">
            <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <FolderOpen className="w-8 h-8 fill-current opacity-20 absolute" />
               <FolderOpen className="w-8 h-8 relative z-10" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs truncate">Karimov Behzod</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">4 ta rasm</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group text-center">
            <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <FolderOpen className="w-8 h-8 fill-current opacity-20 absolute" />
               <FolderOpen className="w-8 h-8 relative z-10" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs truncate">Ergashev Sardor</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">2 ta rasm</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group text-center">
            <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <FolderOpen className="w-8 h-8 fill-current opacity-20 absolute" />
               <FolderOpen className="w-8 h-8 relative z-10" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs truncate">Usmonova Dildora</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">6 ta rasm</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group text-center">
            <div className="w-16 h-16 mx-auto bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <FolderOpen className="w-8 h-8 fill-current opacity-20 absolute" />
               <FolderOpen className="w-8 h-8 relative z-10" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs truncate">Aliyev Alisher</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">1 ta rasm</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 border-dashed hover:border-indigo-300 hover:bg-indigo-50 shadow-sm hover:shadow-md transition-all cursor-pointer group text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
               <Plus className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-indigo-600 text-xs">Yangi albom</h4>
         </div>
      </div>
    </div>

    {/* So'nggi rasmlar */}
    <div>
      <h3 className="font-bold text-slate-800 text-sm mb-4">So'nggi qo'shilgan rasmlar</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
         {/* Item 1 */}
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group cursor-pointer">
            <div className="aspect-square bg-slate-900 relative">
               <div className="absolute inset-0 bg-slate-800/20 group-hover:bg-slate-800/0 transition-colors z-10"></div>
               <div className="absolute inset-0 flex items-center justify-center text-slate-600">No Image</div>
               <div className="absolute top-2 right-2 z-20">
                 <span className="bg-slate-900/60 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">Jarayongacha</span>
               </div>
            </div>
            <div className="p-3">
               <h4 className="font-bold text-slate-800 text-xs truncate mb-1">Karimov Behzod</h4>
               <p className="text-[10px] text-slate-400 font-medium flex justify-between items-center">
                 <span>12.05.2024</span>
                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 10:30</span>
               </p>
            </div>
         </div>
         {/* Item 2 */}
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group cursor-pointer">
            <div className="aspect-square bg-slate-900 relative">
               <div className="absolute inset-0 bg-slate-800/20 group-hover:bg-slate-800/0 transition-colors z-10"></div>
               <div className="absolute inset-0 flex items-center justify-center text-slate-600">No Image</div>
               <div className="absolute top-2 right-2 z-20">
                 <span className="bg-indigo-500/80 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">Jarayondan so'ng</span>
               </div>
            </div>
            <div className="p-3">
               <h4 className="font-bold text-slate-800 text-xs truncate mb-1">Karimov Behzod</h4>
               <p className="text-[10px] text-slate-400 font-medium flex justify-between items-center">
                 <span>12.05.2024</span>
                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 14:45</span>
               </p>
            </div>
         </div>
      </div>
    </div>
  </div>
)}`;
    code = code.substring(0, startIndex) + newContent + code.substring(endIndex + 1);
    fs.writeFileSync('src/components/DoctorDashboard.tsx', code);
    console.log("Updated Foto galereya successfully");
} else {
    console.log("Could not find matching end parenthesis.");
}
