#!/bin/bash
sed -i '193,205c\
            )}\
          </div>\
        </div>\
      )}\
\
      {activeView === "viewer" && selectedXRay && (\
        <div className="flex flex-col h-full">\
          <div className="flex justify-between items-center mb-4 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800">\
            <button onClick={() => setActiveView("gallery")} className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">\
              <ChevronLeft className="w-4 h-4" /> Ortga qaytish\
            </button>\
            <div>\
              <h4 className="text-white font-bold">{selectedXRay.type} Tasviri</h4>\
              <p className="text-xs text-slate-500">{new Date(selectedXRay.date).toLocaleString()}</p>\
            </div>\
          </div>\
' src/components/XRayCenter.tsx
