#!/bin/bash
sed -i '340,352c\
              <div className="grid grid-cols-2 gap-4">\
                <div>\
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Tasvir turi</label>\
                  <select \
                    value={uploadType}\
                    onChange={(e) => setUploadType(e.target.value as any)}\
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"\
                  >\
                    <option value="OPG">Panoramali (OPG)</option>\
                    <option value="RVG">Vizual (RVG)</option>\
                    <option value="CBCT">Tomografiya (CBCT)</option>\
                    <option value="Other">Boshqa</option>\
                  </select>\
                </div>\
                <div>\
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Bosqich</label>\
                  <select \
                    value={uploadStage}\
                    onChange={(e) => setUploadStage(e.target.value as any)}\
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"\
                  >\
                    <option value="Oldin">Oldin (Muolajadan oldin)</option>\
                    <option value="Jarayon">Jarayon (Davolash jarayoni)</option>\
                    <option value="Keyin">Keyin (Muolajadan keyin)</option>\
                    <option value="Boshqa">Boshqa</option>\
                  </select>\
                </div>\
              </div>\
' src/components/XRayCenter.tsx
