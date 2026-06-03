import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { Clinic } from '../types';
import { MapPin, Navigation, Search, Phone, ExternalLink, Info, ShieldCheck, Activity } from 'lucide-react';

interface ClinicMapProps {
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  onSelectClinic: (clinic: Clinic) => void;
}

// Check for Google Maps Platform secret key
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

// Simulated user location in Uzbekistan (e.g. Samarkand Airport)
const SIMULATED_USER_COORDS = { lat: 39.7027, lng: 66.9832 }; // Samarqand

export default function ClinicMap({ clinics, selectedClinic, onSelectClinic }: ClinicMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'vector' | 'google'>(hasValidKey ? 'google' : 'vector');
  const [userLat, setUserLat] = useState(SIMULATED_USER_COORDS.lat);
  const [userLng, setUserLng] = useState(SIMULATED_USER_COORDS.lng);
  const [customDistanceFilter, setCustomDistanceFilter] = useState<number>(300); // in km

  // Haversine formula to compute distance in km
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const filteredClinics = clinics
    .map((c) => ({
      ...c,
      distance: getDistance(userLat, userLng, c.lat, c.lng)
    }))
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDistance = c.distance <= customDistanceFilter;
      return matchesSearch && matchesDistance;
    })
    .sort((a, b) => a.distance - b.distance);

  return (
    <div id="clinic-map-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      {/* Sidebar: Search & List */}
      <div id="map-sidebar" className="lg:col-span-4 p-5 flex flex-col h-[580px] bg-slate-50 border-r border-slate-100">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1 flex items-center gap-2">
            <MapPin className="text-cyan-600 w-5 h-5" /> Klinikalar Katalogi
          </h3>
          <p className="text-xs text-slate-500 mb-3">O'zingizga yaqin hamda qulay filialni tanlang</p>
          
          {/* User simulated location selection */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 mb-3 shadow-xs">
            <label className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
              Sizning taxminiy turgan joyingiz:
            </label>
            <select
              className="text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 w-full font-medium"
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'samarqand') {
                  setUserLat(39.6542);
                  setUserLng(66.9597);
                } else if (val === 'buxoro') {
                  setUserLat(39.7747);
                  setUserLng(64.4286);
                } else {
                  setUserLat(41.2995);
                  setUserLng(69.2401);
                }
              }}
              defaultValue="samarqand"
            >
              <option value="samarqand">Samarqand shahri (Markaz)</option>
              <option value="buxoro">Buxoro shahri (Markaz)</option>
              <option value="tashkent">Toshkent shahri (Markaz)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium"
              placeholder="Klinika nomi yoki manzilini qidiring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Clinics List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {filteredClinics.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Mavjud klinikalar topilmadi.
            </div>
          ) : (
            filteredClinics.map((clinic) => {
              const isSelected = selectedClinic?.id === clinic.id;
              return (
                <div
                  key={clinic.id}
                  onClick={() => onSelectClinic(clinic)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-cyan-50/70 border-cyan-200 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full font-mono">
                      {clinic.subdomain}.dstoma.uz
                    </span>
                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-0.5">
                      ★ {clinic.rating}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1">{clinic.name}</h4>
                  <p className="text-xs text-slate-500 leading-snug mb-2 flex items-start gap-1">
                    <MapPin className="text-slate-400 w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {clinic.address}
                  </p>
                  
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-400">
                    <span className="font-medium text-slate-500 flex items-center gap-1">
                      <Navigation className="text-cyan-500 w-3 h-3" />
                      Sizdan: <strong className="text-cyan-700">{clinic.distance} km</strong>
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Activity className="w-3 h-3 text-green-500 animate-pulse" />
                      {clinic.activePatients} navbatda
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Map Area */}
      <div id="map-canvas-container" className="lg:col-span-8 h-[580px] relative bg-slate-150 flex flex-col">
        {/* Toggle between Vector Fallback and Google Maps */}
        <div className="absolute top-4 left-4 z-10 flex gap-1 bg-white/95 backdrop-blur-md p-1 rounded-lg shadow-md border border-slate-200/50">
          <button
            onClick={() => setActiveTab('vector')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'vector'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            📊 Interaktiv Vektor Xarita
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🗺️ Google Maps Live {hasValidKey && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>}
          </button>
        </div>

        {/* Card of selected clinic in top right corner */}
        {selectedClinic && (
          <div className="absolute top-4 right-4 z-10 max-w-[280px] bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200/80">
            <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wider font-extrabold text-cyan-600">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Tanlangan klinika
            </div>
            <h5 className="text-xs font-bold text-slate-800 leading-snug">{selectedClinic.name}</h5>
            <p className="text-[10px] text-slate-500 mt-1 mb-2 leading-relaxed">{selectedClinic.address}</p>
            <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 text-[10px] font-semibold text-slate-600">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-cyan-600" /> {selectedClinic.phone}</span>
            </div>
          </div>
        )}

        {/* RENDER ACTIVE MAP */}
        {activeTab === 'vector' ? (
          <div className="w-full h-full bg-slate-900 flex flex-col justify-between p-6 overflow-hidden relative">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            {/* Title / Description */}
            <div className="relative z-10 text-white select-none">
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold rounded-md font-mono uppercase tracking-widest">
                Multi-Tenant Region Hub
              </span>
              <h4 className="text-md font-extrabold text-slate-100 mt-1">DStoma O'zbekiston Bo'limlari</h4>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm leading-relaxed">
                Toshkent, Samarqand va Buxoro shaharlaridagi filiallar simulyatsiyasi (Bemor masofasini o'lchash real-vaqtda amalga oshiriladi).
              </p>
            </div>

            {/* Minimal Vector Graphics of Uzbekistan Clinics */}
            <div className="relative flex-1 w-full flex items-center justify-center py-4 select-none">
              {/* Central Map Body */}
              <div className="relative w-[500px] h-[300px] bg-slate-800/20 border border-slate-700/30 rounded-2xl p-4 flex flex-col justify-between">
                {/* Simulated Path / Roadways */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className="w-[85%] h-px bg-dashed border-b border-white"></div>
                  <div className="absolute w-[200px] h-[200px] border border-white rounded-full"></div>
                </div>

                {/* City Markers overlay representation on Uzbekistan scale */}
                {/* 1. Bukhara (Left side) */}
                <div
                  onClick={() => {
                    const c = clinics.find((cl) => cl.id === 'buxoro');
                    if (c) onSelectClinic(c);
                  }}
                  className={`absolute left-[15%] top-[55%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center transition-all ${
                    selectedClinic?.id === 'buxoro' ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div className={`p-2.5 rounded-full shadow-lg flex items-center justify-center transition-all ${
                    selectedClinic?.id === 'buxoro' ? 'bg-cyan-600 text-white ring-4 ring-cyan-500/30' : 'bg-slate-700/80 text-white hover:bg-slate-600/90'
                  }`}>
                    <MapPin className="w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded ${
                    selectedClinic?.id === 'buxoro' ? 'bg-cyan-600/90 text-white' : 'bg-slate-800/80 text-slate-300'
                  }`}>
                    Buxoro
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">39.77° N, 64.42° E</span>
                </div>

                {/* 2. Samarqand (Center-Bottom) */}
                <div
                  onClick={() => {
                    const c = clinics.find((cl) => cl.id === 'samarqand');
                    if (c) onSelectClinic(c);
                  }}
                  className={`absolute left-[45%] top-[65%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center transition-all ${
                    selectedClinic?.id === 'samarqand' ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div className={`p-2.5 rounded-full shadow-lg flex items-center justify-center transition-all ${
                    selectedClinic?.id === 'samarqand' ? 'bg-cyan-600 text-white ring-4 ring-cyan-500/30' : 'bg-slate-700/80 text-white hover:bg-slate-600/90'
                  }`}>
                    <MapPin className="w-5 h-5 animate-bounce" style={{ animationDuration: '4s' }} />
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded ${
                    selectedClinic?.id === 'samarqand' ? 'bg-cyan-600/90 text-white' : 'bg-slate-800/80 text-slate-300'
                  }`}>
                    Samarqand
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">39.65° N, 66.95° E</span>
                </div>

                {/* 3. Tashkent (Right-Top) */}
                <div
                  onClick={() => {
                    const c = clinics.find((cl) => cl.id === 'toshkent');
                    if (c) onSelectClinic(c);
                  }}
                  className={`absolute right-[15%] top-[20%] translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center transition-all ${
                    selectedClinic?.id === 'toshkent' ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div className={`p-2.5 rounded-full shadow-lg flex items-center justify-center transition-all ${
                    selectedClinic?.id === 'toshkent' ? 'bg-cyan-600 text-white ring-4 ring-cyan-500/30' : 'bg-slate-700/80 text-white hover:bg-slate-600/90'
                  }`}>
                    <MapPin className="w-5 h-5 animate-bounce" style={{ animationDuration: '2.5s' }} />
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded ${
                    selectedClinic?.id === 'toshkent' ? 'bg-cyan-600/90 text-white' : 'bg-slate-800/80 text-slate-300'
                  }`}>
                    Toshkent (Bosh Ofis)
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">41.29° N, 69.24° E</span>
                </div>

                {/* User Simulated Pin */}
                <div
                  className="absolute p-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg flex items-center gap-1.5 font-mono text-[9px] uppercase font-bold tracking-wider"
                  style={{
                    left: userLat === 39.6542 ? '41%' : userLat === 39.7747 ? '11%' : '80%',
                    top: userLat === 39.6542 ? '78%' : userLat === 39.7747 ? '68%' : '35%'
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  Sizning Taxminiy Turgan Joyingiz (Xarita markazi)
                </div>
              </div>
            </div>

            {/* Bottom info banner */}
            <div className="relative z-10 flex items-center gap-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700/40 text-slate-300 text-xs shadow-md">
              <Info className="text-yellow-500 shrink-0 w-4 h-4" />
              <span>
                Simulyatsiyada Samarqand markaz qilib olindi. Yuqoridagi xaritada istalgan shaharni bossangiz, joriy klinikaga mos navbat tizimiga, shifokorlar va xizmatlar ro'yxatiga o'tasiz.
              </span>
            </div>
          </div>
        ) : (
          /* GOOGLE MAPS BLOCK */
          <div className="w-full h-full relative">
            {!hasValidKey ? (
              <div className="w-full h-full bg-slate-900 border border-slate-850 flex items-center justify-center p-6 text-white text-center">
                <div className="max-w-md p-6 bg-slate-800/95 rounded-2xl border border-slate-700/80 shadow-2xl relative z-10">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/40">
                    <Info className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mb-2">Google Maps Platform API kaliti talab qilinadi</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Toshkent, Samarqand, Buxorodagi klinikalaringizni haqiqiy Google Map interaktiv xaritasida chiqarish uchun sizning Google Maps API kalitingiz ulanishi kerak.
                  </p>
                  
                  <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-xl text-left text-xs mb-3 space-y-2">
                    <p className="font-semibold text-slate-200">API kalitni ulash yo'li:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                      <li>
                        Google Cloud Console-dan API kaliti oling (yoki o'zingiznikidan foydalaning)
                      </li>
                      <li>
                        AI Studio burchagidagi <strong className="text-cyan-400">Settings (⚙️)</strong> → <strong className="text-cyan-400">Secrets</strong> ga kiring
                      </li>
                      <li>
                        Yangi o'zgaruvchi <code className="text-rose-400 px-1 bg-slate-950 rounded font-mono">GOOGLE_MAPS_PLATFORM_KEY</code> qo'shing va kalitni saqlang. Sayat avtomatik qayta quriladi.
                      </li>
                    </ol>
                  </div>
                  
                  <div className="text-[11px] text-slate-500">
                    Hozircha, chap tarafdagi <button onClick={() => setActiveTab('vector')} className="text-cyan-400 underline font-bold hover:text-cyan-300 focus:outline-none">Interaktiv Vektor Xarita</button> rejimidan foydalanishni davom ettiring. U barcha funksiyalarni bajaradi.
                  </div>
                </div>
              </div>
            ) : (
              /* REAL GOOGLE MAPS COMPONENT */
              <APIProvider apiKey={API_KEY} version="weekly">
                <Map
                  defaultCenter={{ lat: 39.6542, lng: 66.9597 }} // Samarqand default
                  defaultZoom={11}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  {clinics.map((clinic) => (
                    <AdvancedMarker
                      key={clinic.id}
                      position={{ lat: clinic.lat, lng: clinic.lng }}
                      title={clinic.name}
                      onClick={() => onSelectClinic(clinic)}
                    >
                      <Pin
                        background={selectedClinic?.id === clinic.id ? '#06b6d4' : '#0891b2'}
                        borderColor="#ffffff"
                        glyphColor="#ffffff"
                      />
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
