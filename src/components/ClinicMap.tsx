import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Clinic } from '../types';
import { MapPin, Navigation, Search, Phone, ExternalLink, Info, ShieldCheck, Activity, Globe, Wifi } from 'lucide-react';
import { TRANSLATIONS, Language } from '../translations';

interface ClinicMapProps {
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  onSelectClinic: (clinic: Clinic) => void;
  language: Language;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

export default function ClinicMap({ clinics, selectedClinic, onSelectClinic, language }: ClinicMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'vector' | 'leaflet' | 'google'>('leaflet');
  const [userLat, setUserLat] = useState<number>(39.6542); // defaults to Samarqand shahri
  const [userLng, setUserLng] = useState<number>(66.9597);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'active' | 'denied'>('idle');
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false);
  const [customDistanceFilter, setCustomDistanceFilter] = useState<number>(3000); // 3000km to cover all of Uzbekistan in search

  // Refs for Leaflet map elements
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  const t = (key: string) => {
    return (TRANSLATIONS[language] as any)?.[key] || (TRANSLATIONS['uz'] as any)?.[key] || key;
  };

  // Dynamic Leaflet asset loading
  useEffect(() => {
    if (activeTab !== 'leaflet') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      // Check if Leaflet L global is already available
      if ((window as any).L) {
        setLeafletLoaded(true);
      } else {
        const interval = setInterval(() => {
          if ((window as any).L) {
            setLeafletLoaded(true);
            clearInterval(interval);
          }
        }, 300);
        return () => clearInterval(interval);
      }
    }
  }, [activeTab]);

  // Real Geolocation loader
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
          setGpsStatus('active');
        },
        (error) => {
          console.warn('Geolocation failed or rejected, falling back to Samarqand:', error);
          setGpsStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 8050 }
      );
    } else {
      setGpsStatus('denied');
    }
  }, []);

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

  // Get and sort clinics list dynamically based on exact GPS coordinates
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

  // Initialize and update Leaflet Live map
  useEffect(() => {
    if (activeTab !== 'leaflet' || !leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Check if map container is already initialized by leaflet
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([userLat, userLng], 12);
      
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const markersGroup = L.featureGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      // User pin (pulsing neon/emerald ring)
      const userHtml = `<div class="relative flex items-center justify-center">
        <div class="absolute w-5 h-5 rounded-full bg-emerald-500/40 animate-ping"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-md"></div>
      </div>`;
      
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: userHtml,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([userLat, userLng], { icon: userIcon })
        .bindPopup(`<b>${t('approxLocation')}</b><br/>Lat: ${userLat.toFixed(4)}, Lng: ${userLng.toFixed(4)}`)
        .addTo(markersGroup);

      // Add each Clinic to the map
      clinics.forEach((clinic) => {
        const isSelected = selectedClinic?.id === clinic.id;
        const clinicHtml = `<div class="relative group select-none flex items-center justify-center">
          <div class="absolute -inset-1 rounded-full ${isSelected ? 'bg-cyan-500/60 blur-xs animate-pulse font-black' : 'bg-transparent'}"></div>
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 shrink-0 shadow-lg ${
            isSelected
              ? 'bg-cyan-600 text-white border-white scale-110 shadow-cyan-500/55'
              : 'bg-[#0f172a] text-cyan-405 border-cyan-500 hover:border-cyan-400 hover:text-cyan-350'
          }">
            ${clinic.logo || '🦷'}
          </div>
        </div>`;

        const clinicIcon = L.divIcon({
          className: 'custom-clinic-pin',
          html: clinicHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const clinicMarker = L.marker([clinic.lat, clinic.lng], { icon: clinicIcon })
          .bindPopup(`
            <div style="font-family: sans-serif; padding: 4px; color: #1e293b;">
              <small style="color: #0891b2; font-weight: 800; text-transform: uppercase; font-size:9px;">${clinic.subdomain}.dstoma.uz</small>
              <h4 style="margin:2px 0; font-size:12px; font-weight:bold; color: #0f172a;">${clinic.name}</h4>
              <p style="margin:2px 0; font-size:11px; color:#64748b;">${clinic.address}</p>
              <p style="margin:2px 0 6px 0; font-size:11px; font-weight:500;">📞 ${clinic.phone}</p>
              <div style="color: #ea580c; font-size:10px; font-weight:bold;">★ ${clinic.rating} | ${getDistance(userLat, userLng, clinic.lat, clinic.lng)} km</div>
            </div>
          `)
          .addTo(markersGroup);

        clinicMarker.on('click', () => {
          onSelectClinic(clinic);
        });
      });

      // Fit map perspective automatically to span all markers
      if (clinics.length > 0) {
        map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });
      }

    } catch (e) {
      console.error("Leaflet initialization issue: ", e);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [leafletLoaded, activeTab, userLat, userLng, clinics, selectedClinic]);

  return (
    <div id="clinic-map-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 rounded-3xl overflow-hidden border border-[#233355]/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
      
      {/* Sidebar: Search & dynamic sorted list */}
      <div id="map-sidebar" className="lg:col-span-4 p-5 flex flex-col h-[600px] bg-[#0c1225] border-r border-[#1e3256]/60">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="text-emerald-400 w-4 h-4" /> {t('clinicsCatalog')}
            </h3>
            {gpsStatus === 'active' ? (
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                <Wifi className="w-2.5 h-2.5" /> GPS Active
              </span>
            ) : gpsStatus === 'detecting' ? (
              <span className="text-[10px] font-mono text-cyan-400 font-medium bg-cyan-500/10 border border-cyan-500/25 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 animate-spin" /> Detecting...
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400 font-medium bg-slate-500/10 border border-slate-500/25 px-1.5 py-0.5 rounded-md">
                Manual Fallback
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-4 font-semibold text-left">
            {t('chooseClinicOnMap')}
          </p>
          
          {/* GPS indicator or Manual Choice selection */}
          <div className="bg-[#080d1a] px-3.5 py-3 rounded-2xl border border-[#1e3256]/40 mb-4">
            <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mb-2 text-left">
              {t('approxLocation')}:
            </label>
            <div className="flex items-center gap-2 mb-2 text-left">
              <span className={`w-2 h-2 rounded-full ${gpsStatus === 'active' ? 'bg-emerald-500 animate-ping' : 'bg-orange-500'}`}></span>
              <span className="text-[11px] font-medium text-slate-300">
                {gpsStatus === 'active' 
                  ? `${t('gpsActive')} (Lat: ${userLat.toFixed(3)}, Lng: ${userLng.toFixed(3)})` 
                  : gpsStatus === 'detecting' 
                    ? t('gpsDetecting')
                    : t('gpsDenied')
                }
              </span>
            </div>

            {/* Manual Choice override drop-down (Alternative Option) */}
            <div className="space-y-1.5 pt-1.5 border-t border-[#1e3256]/30 text-left">
              <label className="text-[9px] font-bold text-slate-500 block uppercase">
                {t('manualSelect')}
              </label>
              <select
                className="text-xs text-slate-300 bg-[#0c1225] hover:bg-[#121c35] border border-[#1e3256]/60 rounded-xl px-2.5 py-2 w-full font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={userLat === 39.6542 ? 'samarqand' : userLat === 39.7747 ? 'buxoro' : userLat === 41.2995 ? 'toshkent' : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'samarqand') {
                    setUserLat(39.6542);
                    setUserLng(66.9597);
                  } else if (val === 'buxoro') {
                    setUserLat(39.7747);
                    setUserLng(64.4286);
                  } else if (val === 'toshkent') {
                    setUserLat(41.2995);
                    setUserLng(69.2401);
                  }
                }}
              >
                <option value="samarqand">📍 {t('samarkandCity')} (M: 39.65, 66.95)</option>
                <option value="buxoro">📍 {t('bukharaCity')} (M: 39.77, 64.42)</option>
                <option value="toshkent">📍 {t('toshkentCity')} (M: 41.29, 69.24)</option>
                {gpsStatus === 'active' && <option value="custom">🛰️ Real Geolocation (GPS)</option>}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </span>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 bg-[#080d1a] border border-[#1e3256]/50 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/80 transition-all font-semibold"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Sorted list of Clinics based on Geolocation closeness */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
          {filteredClinics.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              Katalog bo'm-bo'sh yoki mos keladigan filial topilmadi.
            </div>
          ) : (
            filteredClinics.map((clinic) => {
              const isSelected = selectedClinic?.id === clinic.id;
              return (
                <div
                  key={clinic.id}
                  onClick={() => onSelectClinic(clinic)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-[#10b981]/10 border-[#10b981]/50 shadow-[inset_0_0_12px_rgba(16,185,129,0.15)] scale-[1.01]'
                      : 'bg-[#080d1a]/50 border-[#1e3256]/40 hover:border-[#1e3256]/80 hover:bg-[#0c1225]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-900 border border-[#1e3256]/60 text-emerald-400 rounded-md font-mono">
                      {clinic.subdomain}.dstoma.uz
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-500 flex items-center gap-0.5">
                      ★ {clinic.rating}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-100 leading-tight mb-1 flex items-center justify-between gap-1">
                    <span>{clinic.name}</span>
                    {clinic.mapLink && (
                      <a 
                        href={clinic.mapLink}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-350 font-black flex items-center gap-0.5 text-[8.5px] uppercase shrink-0 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20"
                        title="Link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📍 Link <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-snug mb-2 flex items-start gap-1">
                    <MapPin className="text-slate-500 w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {clinic.address}
                  </p>
                  
                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#1e3256]/30 text-slate-404">
                    <span className="font-semibold text-slate-305 flex items-center gap-1 bg-[#10b981]/5 px-2 py-0.5 rounded border border-[#10b981]/15">
                      <Navigation className="text-emerald-450 w-3 h-3" />
                      {t('distanceFromYou')}: <strong className="text-emerald-450">{clinic.distance} km</strong>
                    </span>
                    <span className="flex items-center gap-0.5 font-bold text-[10px] text-emerald-450 uppercase">
                      <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                      {clinic.activePatients} {t('activeOnQueue')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Map Presentation */}
      <div id="map-canvas-container" className="lg:col-span-8 h-[600px] relative bg-[#040814] flex flex-col">
        
        {/* Real Dynamic Tab Choices */}
        <div className="absolute top-4 left-20 z-40 flex gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl shadow-2xl border border-[#1e3256]/50">
          <button
            onClick={() => setActiveTab('leaflet')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'leaflet'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🗺️ Leaflet.js Live {leafletLoaded && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>}
          </button>
          
          <button
            onClick={() => setActiveTab('vector')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'vector'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📟 High-Tech Vector HUD
          </button>
          
          <button
            onClick={() => setActiveTab('google')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'google'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌐 Google Maps Live {hasValidKey && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>}
          </button>
        </div>

        {/* Selected Clinic overlay hud */}
        {selectedClinic && (
          <div className="absolute top-4 right-4 z-40 max-w-[280px] bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-[#1e3256]/60 text-left">
            <div className="flex items-center gap-1.5 mb-1 text-[9px] uppercase tracking-widest font-black text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Selected Branch Info
            </div>
            <h5 className="text-xs font-black text-slate-100 leading-snug">{selectedClinic.name}</h5>
            <p className="text-[10px] text-slate-400 mt-1 mb-2 leading-relaxed">{selectedClinic.address}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-[#1e3256]/30 text-[10px] font-semibold text-slate-300 justify-between">
              <span className="flex items-center gap-1 text-[10px] font-bold"><Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {selectedClinic.phone}</span>
              {selectedClinic.mapLink && (
                <a
                  href={selectedClinic.mapLink}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] font-black text-slate-950 bg-emerald-400 hover:bg-emerald-500 px-2 py-1.5 rounded-lg shadow-sm transition-all uppercase"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> GPS Info
                </a>
              )}
            </div>
          </div>
        )}

        {/* Tab 1: Leaflet Interactive Map */}
        {activeTab === 'leaflet' && (
          <div className="w-full h-full relative z-10 bg-slate-950 flex flex-col justify-end">
            <div ref={mapContainerRef} className="w-full h-full bg-[#111] border border-[#1b2b4d]/40 rounded-b-2xl overflow-hidden shadow-inner" style={{ minHeight: '520px' }}></div>
            
            {/* Live alert */}
            <div className="absolute bottom-2 left-2 right-2 z-40 flex items-center gap-2 bg-slate-950/90 border border-[#1e3256]/60 p-3 rounded-xl text-[10px] text-slate-300 shadow-xl text-left">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span><strong>Interactive Leaflet Map Active:</strong> Shows real-time branch markers and computed Haversine metrics of nearest clinics. Drag resources freely or pinch zoom.</span>
            </div>
          </div>
        )}

        {/* Tab 2: Vector fallback style map of Uzbekistan */}
        {activeTab === 'vector' && (
          <div className="w-full h-full bg-[#050a18] flex flex-col justify-between p-6 overflow-hidden relative border border-[#1e2e4b] rounded-b-2xl">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f1c35_1px,transparent_1px),linear-gradient(to_bottom,#0f1c35_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70"></div>

            {/* Title & Stats HUD Overlay */}
            <div className="relative z-10 flex items-start justify-between select-none">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black rounded-md font-mono uppercase tracking-widest">
                  🛸 DStoma Region Network Hub
                </span>
                <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider font-display text-left">
                  O'zbekiston Neon Integratsion Xaritasi
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-sm text-left">
                  Toshkent (HQ), Samarqand va Buxoro optik chiziqlar orqali sinxronlangan. Shaharni bossangiz, multi-tenant unga o'tadi.
                </p>
              </div>

              {/* Status HUD indicator */}
              <div className="bg-[#0b101e]/90 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>SYNC: ALL NODES ONLINE</span>
              </div>
            </div>

            {/* High-Tech Constellation SVG Map */}
            <div className="relative flex-1 w-full flex items-center justify-center py-2 select-none z-15">
              <div className="relative w-full max-w-[580px] h-[310px] bg-[#0c1328]/50 border border-[#233355]/40 rounded-3xl p-4 flex items-center justify-center overflow-hidden">
                <div className="absolute w-[440px] h-[440px] border border-[#1b2b4d]/40 rounded-full animate-spin" style={{ animationDuration: '40s' }} />
                <div className="absolute w-[240px] h-[240px] border border-dashed border-[#1ea5e9]/10 rounded-full animate-spin" style={{ animationDuration: '24s', animationDirection: 'reverse' }} />

                <svg viewBox="0 0 600 320" className="w-full h-full relative z-15 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <text x="15" y="25" fill="#384f73" fontSize="8" fontFamily="monospace">41.2995° N, 69.2401° E</text>
                  <text x="15" y="305" fill="#384f73" fontSize="8" fontFamily="monospace">GRID PROJ: MERCATOR CYBER</text>
                  
                  {/* Cyber Gradient map contour */}
                  <path
                    d="M 50,180 L 110,120 L 160,130 L 190,110 L 250,150 L 300,140 L 330,80 L 410,95 L 450,135 L 500,130 L 520,155 L 490,185 L 440,195 L 410,230 L 350,225 L 300,245 L 230,220 L 190,235 L 140,215 L 80,225 Z"
                    fill="url(#uzCyberGradient)"
                    stroke="#10b981"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    className="opacity-75 stroke-[1.8px]"
                  />

                  {/* Nodes link definitions */}
                  <defs>
                    <radialGradient id="uzCyberGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#047857" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#020617" stopOpacity="0.4" />
                    </radialGradient>
                    <linearGradient id="laserLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  {/* Pulsing lines */}
                  <path d="M 170,190 Q 230,195 290,215" fill="none" stroke="url(#laserLine)" strokeWidth="2" strokeDasharray="8 6" className="animate-pulse" />
                  <path d="M 290,215 Q 360,165 430,125" fill="none" stroke="url(#laserLine)" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />

                  {/* BUXORO */}
                  <g
                    onClick={() => {
                      const c = clinics.find((cl) => cl.id === 'buxoro');
                      if (c) onSelectClinic(c);
                    }}
                    className="cursor-pointer group select-none"
                  >
                    <circle cx="170" cy="190" r="14" fill="#ec4899" fillOpacity="0.12" className="animate-ping" style={{ animationDuration: '3s' }} />
                    <circle cx="170" cy="190" r="7" fill={selectedClinic?.id === 'buxoro' ? '#ec4899' : '#1e293b'} stroke="#ec4899" strokeWidth="2" className="group-hover:scale-125 transition-all" />
                    <text x="170" y="172" textAnchor="middle" fill="#ec4899" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Buxoro Node</text>
                  </g>

                  {/* SAMARQAND */}
                  <g
                    onClick={() => {
                      const c = clinics.find((cl) => cl.id === 'samarqand');
                      if (c) onSelectClinic(c);
                    }}
                    className="cursor-pointer group select-none"
                  >
                    <circle cx="290" cy="215" r="16" fill="#10b981" fillOpacity="0.15" className="animate-ping" style={{ animationDuration: '4s' }} />
                    <circle cx="290" cy="215" r="8" fill={selectedClinic?.id === 'samarqand' ? '#10b981' : '#1e293b'} stroke="#10b981" strokeWidth="2.5" className="group-hover:scale-125 transition-all" />
                    <text x="290" y="196" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="extrabold" fontFamily="sans-serif">Samarqand Area</text>
                  </g>

                  {/* TOSHKENT */}
                  <g
                    onClick={() => {
                      const c = clinics.find((cl) => cl.id === 'toshkent');
                      if (c) onSelectClinic(c);
                    }}
                    className="cursor-pointer group select-none"
                  >
                    <circle cx="430" cy="125" r="15" fill="#06b6d4" fillOpacity="0.15" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                    <circle cx="430" cy="125" r="8" fill={selectedClinic?.id === 'toshkent' ? '#06b6d4' : '#1e293b'} stroke="#06b6d4" strokeWidth="2" className="group-hover:scale-125 transition-all" />
                    <text x="430" y="107" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Toshkent HQ</text>
                  </g>

                  {/* Real user tracking location indicator overlay */}
                  <g transform={`translate(${userLat === 39.6542 ? 260 : userLat === 39.7747 ? 130 : 405}, ${userLat === 39.6542 ? 250 : userLat === 39.7747 ? 215 : 155})`}>
                    <rect x="-65" y="-12" width="130" height="15" rx="3" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="0.5" />
                    <circle cx="0" cy="-4" r="3" fill="#ef4444" className="animate-ping" />
                    <text x="0" y="-1" textAnchor="middle" fill="#fca5a5" fontSize="6.5" fontWeight="black" fontFamily="monospace" letterSpacing="0.8">
                      📍 SIZNING JOYINGIZ
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Bottom guide info banner */}
            <div className="relative z-10 flex items-center gap-3 bg-[#0b1022]/90 p-4 border border-[#1e2e4b] rounded-2xl text-slate-300 text-[11px] shadow-md text-left">
              <span className="p-1.5 bg-slate-800/65 text-yellow-500 rounded-lg shrink-0 text-sm">⚡</span>
              <p className="font-semibold leading-relaxed">
                <strong className="text-white text-[11.5px]">Cyber HUD:</strong> Siz joylashgan real GPS yoki tanlagan markaz oq rangli marker bilan belgilandi. Eng yaqin filial chiptasini olish uchun unga bosing.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Google Maps Live component */}
        {activeTab === 'google' && (
          <div className="w-full h-full relative">
            {!hasValidKey ? (
              <div className="w-full h-full bg-slate-950 border border-slate-900 flex items-center justify-center p-6 text-white text-center">
                <div className="max-w-md p-6 bg-slate-900/95 rounded-3xl border border-[#1e3256]/50 shadow-2xl relative z-20 text-left">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-4 border border-amber-500/40">
                    <Info className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="text-sm font-black text-slate-100 mb-2 uppercase tracking-wide">Google Maps Platform Key needed</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Klinikalaringizni haqiqiy Google Map interaktiv xaritasida chiqarish uchun sizning Google Maps API kalitingiz ulanishi kerak.
                  </p>
                  
                  <div className="bg-slate-950/80 border border-[#1e3256]/40 p-4 rounded-2xl text-xs mb-3 space-y-1.5 font-semibold text-slate-300">
                    <p className="font-bold text-slate-200">API kalitni ulash yo'li:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400 font-medium">
                      <li>Google Cloud Console-dan Maps JS API kaliti oling</li>
                      <li>AI Studio burchagidagi <span className="text-emerald-400 font-bold">Settings &gt; Secrets</span> bo'limiga kiring</li>
                      <li>Yangi o'zgaruvchi <code className="text-pink-400 px-1 bg-slate-900 rounded font-mono">GOOGLE_MAPS_PLATFORM_KEY</code> sifatida saqlang</li>
                    </ol>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 font-medium">
                    Hozircha, chap tarafdagi <button onClick={() => setActiveTab('leaflet')} className="text-emerald-400 underline font-bold hover:text-emerald-450 focus:outline-none uppercase">Leaflet.js Live</button> rejimidan foydalanishni davom ettiring. U barcha haqiqiy koordinatalarni va xaritalarni bepul va to'liq yuklab ko'rsatadi.
                  </div>
                </div>
              </div>
            ) : (
              <APIProvider apiKey={API_KEY} version="weekly">
                <Map
                  defaultCenter={{ lat: userLat, lng: userLng }} 
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
                        background={selectedClinic?.id === clinic.id ? '#10b981' : '#0891b2'}
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
