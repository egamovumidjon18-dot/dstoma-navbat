#!/bin/bash
sed -i '250,296c\
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">\
            {["Oldin", "Jarayon", "Keyin", "Boshqa"].map(stageGroup => {\
              const stagePhotos = filteredPhotos.filter(p => (p.stage || "Boshqa") === stageGroup);\
              if (stagePhotos.length === 0) return null;\
              \
              return (\
                <div key={stageGroup} className="mb-8">\
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">\
                    {stageGroup === "Oldin" ? "Muolajadan oldin" : \
                     stageGroup === "Keyin" ? "Muolajadan keyin" : \
                     stageGroup === "Jarayon" ? "Davolash jarayoni" : "Boshqa tasvirlar"}\
                  </h4>\
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">\
                    {stagePhotos.map(photo => (\
                      <div \
                        key={photo.id} \
                        className="group relative bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-colors"\
                      >\
                        <div className="h-40 bg-slate-900 relative" onClick={() => openViewer(photo)}>\
                          <img src={photo.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />\
                          <div className="absolute top-2 right-2 flex gap-1">\
                            {photo.isPrivate && (\
                              <span className="bg-[#020712]/80 text-rose-400 p-1 rounded-md border border-slate-700">\
                                <Lock className="w-3 h-3" />\
                              </span>\
                            )}\
                            <span className="bg-[#020712]/80 text-white text-[10px] font-bold px-2 py-1 rounded-md border border-slate-700">\
                              {photo.category}\
                            </span>\
                          </div>\
                        </div>\
                        \
                        <div className="p-3 flex justify-between items-start">\
                          <div>\
                            <p className="text-white font-bold text-sm">{new Date(photo.date).toLocaleDateString()}</p>\
                            {photo.toothNumber && (\
                              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-1">\
                                Tish: {photo.toothNumber}\
                              </p>\
                            )}\
                          </div>\
                          <button \
                            onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}\
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"\
                          >\
                            <Trash2 className="w-3.5 h-3.5" />\
                          </button>\
                        </div>\
                      </div>\
                    ))}\
                  </div>\
                </div>\
              );\
            })}\
            \
            {filteredPhotos.length === 0 && (\
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">\
                <ImageIcon className="w-12 h-12 mb-4 text-slate-700" />\
                <p>Hozircha fotosuratlar mavjud emas</p>\
              </div>\
            )}\
          </div>\
' src/components/PhotoGallery.tsx
