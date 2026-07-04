#!/bin/bash
sed -i '200,227c\
          <div className="flex justify-between items-center mb-4 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800">\
            <button onClick={() => setActiveView("gallery")} className="flex items-center gap-2 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">\
              <ChevronLeft className="w-4 h-4" /> Ortga qaytish\
            </button>\
            <div className="text-center">\
              <h4 className="text-white font-bold">{selectedXRay.type} Tasviri</h4>\
              <p className="text-xs text-slate-500">{new Date(selectedXRay.date).toLocaleString()}</p>\
            </div>\
            <div className="flex items-center gap-2">\
              <div className="flex items-center bg-[#111827] rounded-lg border border-slate-800 p-1">\
                <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="p-1.5 hover:bg-[#1f2937] text-slate-400 hover:text-white rounded-md"><ZoomOut className="w-4 h-4" /></button>\
                <span className="text-xs font-mono w-12 text-center">{zoom}%</span>\
                <button onClick={() => setZoom(Math.min(300, zoom + 10))} className="p-1.5 hover:bg-[#1f2937] text-slate-400 hover:text-white rounded-md"><ZoomIn className="w-4 h-4" /></button>\
              </div>\
              <button onClick={() => setRotation((r) => r + 90)} className="p-2 bg-[#111827] hover:bg-[#1f2937] text-slate-400 hover:text-white rounded-lg border border-slate-800">\
                <RotateCw className="w-4 h-4" />\
              </button>\
              <button onClick={startCompare} className="p-2 bg-[#111827] hover:bg-[#1f2937] text-slate-400 hover:text-white rounded-lg border border-slate-800">\
                <SplitSquareHorizontal className="w-4 h-4" />\
              </button>\
            </div>\
          </div>\
\
          <div className="flex-1 flex gap-4 min-h-0">\
            {/* Image Viewer */}\
' src/components/XRayCenter.tsx
