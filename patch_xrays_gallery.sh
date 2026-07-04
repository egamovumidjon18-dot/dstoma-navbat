#!/bin/bash
sed -i '150,185c\
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">\
            {["Oldin", "Jarayon", "Keyin", "Boshqa"].map(stageGroup => {\
              const stageXRays = xrays.filter(x => (x.stage || "Boshqa") === stageGroup);\
              if (stageXRays.length === 0) return null;\
              \
              return (\
                <div key={stageGroup} className="mb-8">\
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">\
                    {stageGroup === "Oldin" ? "Muolajadan oldin" : \
                     stageGroup === "Keyin" ? "Muolajadan keyin" : \
                     stageGroup === "Jarayon" ? "Davolash jarayoni" : "Boshqa tasvirlar"}\
                  </h4>\
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">\
                    {stageXRays.map(xray => (\
                      <div key={xray.id} className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden group hover:border-emerald-500/50 transition-colors cursor-pointer" onClick={() => openViewer(xray)}>\
                        <div className="h-48 bg-slate-900 relative overflow-hidden">\
                          <img src={xray.url} alt="X-Ray" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />\
                          <div className="absolute top-2 right-2 flex gap-1">\
                            <span className="bg-[#020712]/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md border border-slate-700">\
                              {xray.type}\
                            </span>\
                          </div>\
                        </div>\
                        <div className="p-4">\
                          <div className="flex justify-between items-start mb-2">\
                            <div>\
                              <p className="text-white font-bold text-sm">{new Date(xray.date).toLocaleDateString()}</p>\
                              <p className="text-xs text-slate-500">{new Date(xray.date).toLocaleTimeString()}</p>\
                            </div>\
                            <div className={`w-2 h-2 rounded-full ${xray.status === "Approved" ? "bg-emerald-500" : xray.status === "Analyzed" ? "bg-indigo-500" : "bg-amber-500"}`}></div>\
                          </div>\
                        </div>\
                      </div>\
                    ))}\
                  </div>\
                </div>\
              );\
            })}\
            {xrays.length === 0 && (\
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">\
                <ImageIcon className="w-12 h-12 mb-4 text-slate-700" />\
                <p>Hozircha rentgen tasvirlari mavjud emas</p>\
              </div>\
            )}\
          </div>\
' src/components/XRayCenter.tsx
