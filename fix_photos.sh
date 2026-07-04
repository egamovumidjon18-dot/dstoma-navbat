#!/bin/bash
sed -i '249,250c\
                        <p className="text-xs text-slate-500">{new Date(pair.date).toLocaleDateString()}</p>\
                      </div>\
                    </div>\
                  );\
                })}\
              </div>\
            </div>\
          )}\
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">\
' src/components/PhotoGallery.tsx
