import React, { useState, useEffect, useRef } from 'react';
import { Clinic } from '../types';
import { MapPin, Navigation, Search, Phone, ExternalLink, Info, ShieldCheck, Activity, Globe, Wifi, Sparkles } from 'lucide-react';
import { TRANSLATIONS, Language } from '../translations';

interface ClinicMapProps {
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  onSelectClinic: (clinic: Clinic) => void;
  language: Language;
  userLocationRef?: React.MutableRefObject<{ lat: number, lng: number, status: 'idle' | 'detecting' | 'active' | 'denied', initialized: boolean }>;
}

export default function ClinicMap({ clinics, selectedClinic, onSelectClinic, language, userLocationRef }: ClinicMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'google' | 'vector' | 'leaflet' | 'dgis'>('google');
  
  // Use the provided ref to persist location across tab changes, or fallback to a local ref
  const fallbackRef = useRef({ lat: 39.6542, lng: 66.9597, status: 'idle' as const, initialized: false });
  const locationRef = userLocationRef || fallbackRef;

  const [userLat, setUserLat] = useState<number>(locationRef.current.lat);
  const [userLng, setUserLng] = useState<number>(locationRef.current.lng);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'detecting' | 'active' | 'denied'>(locationRef.current.status);
  
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false);

  const [dgisLoaded, setDgisLoaded] = useState<boolean>(false);
  const [customDistanceFilter, setCustomDistanceFilter] = useState<number>(3000); // 3000km to cover all of Uzbekistan in search

  // Refs for map elements
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const dgisMapContainerRef = useRef<HTMLDivElement>(null);
  const dgisMapRef = useRef<any>(null);

  const t = (key: string) => {
    return (TRANSLATIONS[language] as any)?.[key] || (TRANSLATIONS['uz'] as any)?.[key] || key;
  };

  useEffect(() => {
    locationRef.current = { lat: userLat, lng: userLng, status: gpsStatus, initialized: locationRef.current.initialized };
  }, [userLat, userLng, gpsStatus, locationRef]);

  const locateUserExact = (isAuto = false) => {
    if (navigator.geolocation) {
      setGpsStatus('detecting');
      
      const updateMapPos = (lat: number, lng: number) => {
        locationRef.current.initialized = true;
        setUserLat(lat);
        setUserLng(lng);
        setGpsStatus('active');
        if (leafletMapRef.current && (activeTab === 'leaflet' || activeTab === 'google')) {
          leafletMapRef.current.setView([lat, lng], 14);
        } else if (dgisMapRef.current && activeTab === 'dgis') {
          dgisMapRef.current.setView([lat, lng], 14);
        }
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateMapPos(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation exact lookup high-accuracy failed:', error);
          
          if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
            // Try with low accuracy
            navigator.geolocation.getCurrentPosition(
              (pos) => updateMapPos(pos.coords.latitude, pos.coords.longitude),
              (err2) => {
                locationRef.current.initialized = true;
                setGpsStatus('denied');
                setUserLat(39.6542);
                setUserLng(66.9597);
                if (!isAuto) alert(language === 'uz' ? 'Joylashuvni aniqlab bo\'lmadi. Samarqand koordinatasiga qaytilmoqda.' : 'Location could not be determined. Falling back to Samarqand.');
              },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: Infinity }
            );
          } else {
             locationRef.current.initialized = true;
             setGpsStatus('denied');
             setUserLat(39.6542);
             setUserLng(66.9597);
             if (!isAuto) alert(language === 'uz' ? 'Joylashuvni aniqlashga ruxsat etilmagan yoki xatolik yuz berdi. Samarqand koordinatasiga qaytilmoqda.' : 'Location access denied or failed. Falling back to Samarqand.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      locationRef.current.initialized = true;
      setGpsStatus('denied');
      if (!isAuto) alert(language === 'uz' ? 'Brauzeringiz geolokatsiyani qo\'llab-quvvatlamaydi.' : 'Your browser does not support geolocation.');
    }
  };

  useEffect(() => {
    if (!locationRef.current.initialized) {
      locateUserExact(true);
    }
  }, []);

  // Dynamic Leaflet asset loading
  useEffect(() => {
    if (activeTab !== 'leaflet' && activeTab !== 'google') return;

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
      script.crossOrigin = 'anonymous';
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

  // Dynamic 2GIS Maps asset loading
  useEffect(() => {
    if (activeTab !== 'dgis') return;

    if (!document.getElementById('dgis-js')) {
      const script = document.createElement('script');
      script.id = 'dgis-js';
      script.src = 'https://maps.api.2gis.com/2.0/loader.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        setDgisLoaded(true);
      };
      script.onerror = () => {
        console.error('2GIS Maps JS un-loadable');
        alert(language === 'uz' ? '2GIS xarita yuklanmadi, Google Maps dan foydalaning.' : '2GIS map failed to load, switching to Google Maps.');
        setActiveTab('google');
      };
      document.body.appendChild(script);
    } else {
      if ((window as any).DG) {
        setDgisLoaded(true);
      } else {
        const interval = setInterval(() => {
          if ((window as any).DG) {
            setDgisLoaded(true);
            clearInterval(interval);
          }
        }, 300);
        return () => clearInterval(interval);
      }
    }
  }, [activeTab]);

  // Geolocation loader
  useEffect(() => {
    // Prevent refetching if already initialized
    if (locationRef.current.initialized) return;

    let mounted = true;

    if (navigator.geolocation) {
      setGpsStatus('detecting');
      
      const geoOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mounted) return;
          locationRef.current.initialized = true;
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
          setGpsStatus('active');
        },
        (error) => {
          if (!mounted) return;
          console.warn('Geolocation failed or rejected:', error);
          
          // Retry once with lower accuracy if timeout or unavailable
          if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
             navigator.geolocation.getCurrentPosition(
               (pos) => {
                 if (!mounted) return;
                 locationRef.current.initialized = true;
                 setUserLat(pos.coords.latitude);
                 setUserLng(pos.coords.longitude);
                 setGpsStatus('active');
               },
               (err2) => {
                 if (!mounted) return;
                 locationRef.current.initialized = true;
                 setGpsStatus('denied');
               },
               { enableHighAccuracy: false, timeout: 10000, maximumAge: Infinity }
             );
          } else {
            locationRef.current.initialized = true;
            setGpsStatus('denied');
          }
        },
        geoOptions
      );
    } else {
      locationRef.current.initialized = true;
      setGpsStatus('denied');
    }
    
    return () => { mounted = false; };
  }, []);

  // Haversine formula to compute distance in km
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const l1 = Number(lat1) || 0;
    const ln1 = Number(lon1) || 0;
    const l2 = Number(lat2) || 0;
    const ln2 = Number(lon2) || 0;
    const R = 6371; // Radius of the Earth in km
    const dLat = ((l2 - l1) * Math.PI) / 180;
    const dLon = ((ln2 - ln1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((l1 * Math.PI) / 180) *
        Math.cos((l2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Get and sort clinics list dynamically based on exact GPS coordinates
  const filteredClinics = (clinics || [])
    .map((c) => ({
      ...c,
      distance: getDistance(userLat, userLng, c ? c.lat : 0, c ? c.lng : 0)
    }))
    .filter((c) => {
      if (!c) return false;
      const matchesSearch = (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                            (c.address || '').toLowerCase().includes((searchQuery || '').toLowerCase());
      const matchesDistance = (c.distance || 0) <= customDistanceFilter;
      return matchesSearch && matchesDistance;
    })
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));

  // Attempt automatic geolocation if supported
  useEffect(() => {
    // locateUserExact() was being called here redundantly, causing parallel conflicts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if ((activeTab !== 'leaflet' && activeTab !== 'google') || !leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Explicitly reset the internal leaflet container ID descriptor to completely immunize against container reuse collision
    if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([userLat, userLng], 12);
      
      leafletMapRef.current = map;

      const isGoogle = activeTab === 'google';
      const tileUrl = isGoogle 
        ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const attribution = isGoogle
        ? '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

      L.tileLayer(tileUrl, {
        attribution: attribution
      }).addTo(map);

      const markersGroup = L.featureGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      // Invalidate size in timeout to cure any race conditions with mounting animation constraints
      setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 150);

    } catch (e) {
      console.error("Leaflet initialization issue: ", e);
    }

    return () => {
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (err) {
          console.warn("Leaflet map removal error on unmount:", err);
        }
        leafletMapRef.current = null;
        markersGroupRef.current = null;
        if (mapContainerRef.current) {
           (mapContainerRef.current as any)._leaflet_id = null;
        }
      }
    };
  }, [leafletLoaded, activeTab]);

  // 1b. Update Leaflet Markers & Route Line
  useEffect(() => {
    if ((activeTab !== 'leaflet' && activeTab !== 'google') || !leafletLoaded || !leafletMapRef.current || !markersGroupRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = leafletMapRef.current;
    const markersGroup = markersGroupRef.current;

    try {
      markersGroup.clearLayers();

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
            <div style="font-family: sans-serif; padding: 6px; color: #1f2937; min-width: 170px;">
              <small style="color: #10b981; font-weight: 800; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px;">${clinic.subdomain}.dstoma-navbat-lk2p.vercel.app</small>
              <h4 style="margin: 2px 0; font-size: 13px; font-weight: 800; color: #111827; line-height: 1.2;">${clinic.name}</h4>
              <p style="margin: 3px 0; font-size: 11px; color: #4b5563; line-height: 1.3;">📍 ${clinic.address}</p>
              <p style="margin: 2px 0 6px 0; font-size: 11px; font-weight: 600; color: #374151;">📞 ${clinic.phone}</p>
              <div style="color: #f59e0b; font-size: 10px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 5px;">
                <span>★ ${clinic.rating}</span>
                <span style="color: #10b981; background: #ecfdf5; padding: 1px 4px; border-radius: 4px;">${getDistance(userLat, userLng, clinic.lat, clinic.lng)} km</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 4px;">
                <a href="https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${clinic.lat},${clinic.lng}&travelmode=driving" target="_blank" rel="noopener noreferrer" style="background-color: #10b981; color: white; padding: 5px; border-radius: 6px; font-size: 9px; font-weight: 900; text-decoration: none; text-align: center; display: block; filter: drop-shadow(0 1px 2px rgba(16,185,129,0.35)); transition: all 0.2s;">GOOGLE MAP</a>
                <a href="https://2gis.uz/routeSearch/rsType/car/from/${userLng},${userLat}/to/${clinic.lng},${clinic.lat}" target="_blank" rel="noopener noreferrer" style="background-color: #f43f5e; color: white; padding: 5px; border-radius: 6px; font-size: 9px; font-weight: 900; text-decoration: none; text-align: center; display: block; filter: drop-shadow(0 1px 2px rgba(244,63,94,0.35)); transition: all 0.2s;">2GIS MAP</a>
              </div>
            </div>
          `)
          .addTo(markersGroup);

        clinicMarker.on('click', () => {
          onSelectClinic(clinic);
        });
      });

      // Draw neon geodesic connection route line if a clinic is selected
      if (selectedClinic) {
        const polylinePoints = [
          [userLat, userLng],
          [selectedClinic.lat, selectedClinic.lng]
        ];
        L.polyline(polylinePoints, {
          color: '#10b981',
          weight: 3,
          opacity: 0.85,
          dashArray: '8, 8',
          className: 'laser-route-line'
        }).addTo(markersGroup);
      }
      
      // Control centering logic: do NOT constantly recenter if user is panning. 
      // Only do it when the selected clinic ACTUALLY changes to a new one, 
      // or if there is no selection and bounds haven't been fitted yet.
      const mapState = map as any;
      if (selectedClinic) {
         if (mapState._lastSelectedId !== selectedClinic.id) {
           map.setView([selectedClinic.lat, selectedClinic.lng], 12.5);
           mapState._lastSelectedId = selectedClinic.id;
         }
      } else if (clinics.length > 0) {
        // Fit map perspective automatically to span all markers on initial load
        if (!mapState._hasFittedInitialBounds) {
          const bounds = markersGroup.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40] });
            mapState._hasFittedInitialBounds = true;
          }
        }
      }

    } catch (e) {
      console.warn("Leaflet overlay update issue: ", e);
    }
  }, [leafletLoaded, activeTab, userLat, userLng, clinics, selectedClinic]);

  // 2. Initialize 2GIS Map (Once)
  useEffect(() => {
    if (activeTab !== 'dgis' || !dgisLoaded || !dgisMapContainerRef.current) return;
    const DG = (window as any).DG;
    if (!DG) return;

    if (dgisMapRef.current) return;

    DG.then(() => {
      if (!dgisMapContainerRef.current) return;
      try {
        const map = DG.map(dgisMapContainerRef.current, {
          center: [userLat, userLng],
          zoom: 12,
          fullscreenControl: false
        });
        
        dgisMapRef.current = map;
      } catch (err) {
        console.error("2GIS Live map init error:", err);
        alert(language === 'uz' ? '2GIS xarita yuklanmadi, Google Maps dan foydalaning' : '2GIS map failed to load, switching to Google Maps');
        setActiveTab('google');
      }
    });

    return () => {
      if (dgisMapRef.current) {
        try {
          dgisMapRef.current.remove();
        } catch (e) {
          console.warn(e);
        }
        dgisMapRef.current = null;
      }
    };
  }, [dgisLoaded, activeTab]);

  // 2b. Update 2GIS Map Objects
  useEffect(() => {
    if (activeTab !== 'dgis' || !dgisLoaded || !dgisMapRef.current) return;
    const map = dgisMapRef.current;
    const DG = (window as any).DG;
    if (!DG) return;

    try {
      // Create or clear a layer group
      if (map._markersGroup) {
        map._markersGroup.removeFrom(map);
      }
      map._markersGroup = DG.featureGroup().addTo(map);

      // 1. User marker
      DG.marker([userLat, userLng], {
        icon: DG.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        }),
        zIndexOffset: 1000
      }).bindPopup(t('myLocation')).addTo(map._markersGroup);

      // 2. Clinic markers
      clinics.forEach((clinic) => {
        const isSelected = selectedClinic?.id === clinic.id;
        
        const clinicIcon = DG.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="background-color: ${isSelected ? '#f43f5e' : '#10b981'}; width: ${isSelected ? '28px' : '18px'}; height: ${isSelected ? '28px' : '18px'}; border-radius: 50%; border: ${isSelected ? '3px' : '2px'} solid white; box-shadow: 0 0 15px ${isSelected ? 'rgba(244,63,94,0.6)' : 'rgba(16,185,129,0.5)'}; display: flex; align-items: center; justify-content: center; transition: all 0.3s; transform: scale(${isSelected ? 1.1 : 1});">
              <span style="color: white; font-size: ${isSelected ? '14px' : '10px'}; font-weight: 900;">+</span>
            </div>
          `,
          iconSize: [isSelected ? 30 : 20, isSelected ? 30 : 20],
          iconAnchor: [isSelected ? 15 : 10, isSelected ? 15 : 10]
        });

        const m = DG.marker([clinic.lat, clinic.lng], {
          icon: clinicIcon,
          zIndexOffset: isSelected ? 900 : 100
        }).addTo(map._markersGroup);

        m.on('click', () => {
          onSelectClinic(clinic);
        });

        if (isSelected && window.innerWidth > 768) {
           m.bindPopup(`<b>${clinic.name}</b><br/>${clinic.address}`).openPopup();
        }
      });

      // 3. Routing (polyline) for selected clinic
      if (selectedClinic) {
        DG.polyline([
          [userLat, userLng],
          [selectedClinic.lat, selectedClinic.lng]
        ], {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
        }).addTo(map._markersGroup);
        
        map.setView([selectedClinic.lat, selectedClinic.lng]);
      } else {
        map.setView([userLat, userLng]);
      }
    } catch (err) {
      console.warn("2GIS overlay update issue:", err);
    }
  }, [dgisLoaded, activeTab, userLat, userLng, clinics, selectedClinic]);

  return (
    <div id="clinic-map-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 rounded-3xl overflow-hidden border border-[#233355]/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
      
      {/* Sidebar: Search & dynamic sorted list - optimized height on mobile */}
      <div id="map-sidebar" className="lg:col-span-4 p-5 flex flex-col h-[280px] sm:h-[350px] lg:h-[650px] bg-[#0c1225] border-r border-[#1e3256]/60">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="text-emerald-400 w-4 h-4" /> {t('clinicsCatalog')}
            </h3>
            {gpsStatus === 'active' ? (
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                <Wifi className="w-2.5 h-2.5" /> {language === 'uz' ? 'GPS Faol' : language === 'ru' ? 'GPS Axтивен' : 'GPS Active'}
              </span>
            ) : gpsStatus === 'detecting' ? (
              <span className="text-[10px] font-mono text-cyan-400 font-medium bg-cyan-500/10 border border-cyan-500/25 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 animate-spin" /> {language === 'uz' ? 'Aniqlanmoqda...' : language === 'ru' ? 'Определение...' : 'Detecting...'}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400 font-medium bg-slate-500/10 border border-slate-500/25 px-1.5 py-0.5 rounded-md">
                {language === 'uz' ? "Qo'lda kiritish" : language === 'ru' ? "Вручную" : "Manual Fallback"}
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

            {/* Location tools */}
            <div className="space-y-1.5 pt-1.5 border-t border-[#1e3256]/30 text-left">
              <label className="text-[9px] font-bold text-slate-500 block uppercase">
                {language === 'uz' ? "JOYLAShUVNI QO'LDA TANLASH (MUQOBIL):" : language === 'ru' ? "ВЫБОР ПОЛОЖЕНИЯ ВРУЧНУЮ (АЛЬТЕРНАТИВА):" : "MANUAL LOCATION OVERRIDE (ALTERNATIVE):"}
              </label>
              <select
                className="text-xs text-slate-300 bg-[#0c1225] hover:bg-[#121c35] border border-[#1e3256]/60 rounded-xl px-2.5 py-2 w-full font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                value={userLat === 39.6542 ? 'samarqand' : userLat === 39.7747 ? 'buxoro' : userLat === 41.2995 ? 'toshkent' : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'samarqand') {
                    setUserLat(39.6542);
                    setUserLng(66.9597);
                    setGpsStatus('idle');
                  } else if (val === 'buxoro') {
                    setUserLat(39.7747);
                    setUserLng(64.4286);
                    setGpsStatus('idle');
                  } else if (val === 'toshkent') {
                    setUserLat(41.2995);
                    setUserLng(69.2401);
                    setGpsStatus('idle');
                  }
                }}
              >
                <option value="samarqand">📍 {t('samarkandCity')} (M: 39.65, 66.95)</option>
                <option value="buxoro">📍 {t('bukharaCity')} (M: 39.77, 64.42)</option>
                <option value="toshkent">📍 {t('toshkentCity')} (M: 41.29, 69.24)</option>
                {gpsStatus === 'active' && <option value="custom">🛰️ {language === 'uz' ? 'Real Geolokatsiya (GPS)' : language === 'ru' ? 'Реальная геолокация (GPS)' : 'Real Geolocation (GPS)'}</option>}
              </select>

              <button
                onClick={() => locateUserExact(false)}
                className="w-full mt-1.5 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl px-3 py-2 text-[11px] font-bold uppercase transition-all"
              >
                📍 {language === 'uz' ? 'Haqiqiy Joylashuvni Yangilash (GPS)' : language === 'ru' ? 'Обновить Реальное Положение' : 'Update Real Location'}
              </button>
            </div>

            {/* Selection by Clinic Name */}
            <div className="space-y-1.5 pt-2 border-t border-[#1e3256]/30 text-left mt-2">
              <label className="text-[9px] font-bold text-slate-400 block uppercase flex items-center gap-1">
                🏢 {language === 'uz' ? 'Klinikani tanlash (Nomi bo\'yicha):' : language === 'ru' ? 'Выбор заведения по названию:' : 'Choose Clinic by Name:'}
              </label>
              <select
                className="text-xs text-slate-200 bg-[#0c1225] hover:bg-[#121c35] border border-emerald-500/40 rounded-xl px-2.5 py-2.5 w-full font-black focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-emerald-300"
                value={selectedClinic ? selectedClinic.id : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const found = clinics.find(c => c.id === val);
                  if (found) {
                    onSelectClinic(found);
                  } else {
                    onSelectClinic(null as any);
                  }
                }}
              >
                <option value="" className="text-slate-400 font-normal">ℹ️ {language === 'uz' ? '-- Klinikani tanlang --' : language === 'ru' ? '-- Выберите филиал --' : '-- Choose Clinic or Branch --'}</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id} className="text-slate-200 font-semibold bg-[#0c1225]">
                    {clinic.name} ({clinic.subdomain}.dstoma-navbat-lk2p.vercel.app)
                  </option>
                ))}
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
          {!selectedClinic && filteredClinics.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-350 text-[11px] leading-relaxed relative overflow-hidden flex flex-col gap-1 shadow-sm text-left animate-fade-in mb-1">
              <div className="flex items-center gap-1.5 font-black uppercase text-[10px] text-emerald-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                {language === 'uz' ? 'Tavsiya etiladi' : language === 'ru' ? 'Рекомендуется' : 'Recommendation'}
              </div>
              <p className="font-semibold text-slate-300">
                {language === 'uz' 
                  ? `Sizga eng yaqin klinika aniqlandi: ` 
                  : language === 'ru' 
                    ? `Найдена ближайшая к вам клиника: ` 
                    : `We found the nearest clinic for you: `}
                <span className="text-emerald-400 font-extrabold">{filteredClinics[0].name}</span>.
                {language === 'uz'
                  ? ` Tizim avtomatik belgilamaydi. Iltimos, pastdan o'zingiz xohlagan klinika filialini tanlang.`
                  : language === 'ru'
                    ? ` Система не выбирает её автоматически. Пожалуйста, выберите нужный вам филиал вручную ниже.`
                    : ` The system does not automatically select it. Please manually select your preferred branch below.`}
              </p>
            </div>
          )}

          {filteredClinics.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              {language === 'uz' 
                ? "Katalog bo'sh yoki mos keladigan filial topilmadi." 
                : language === 'ru' 
                  ? "Каталог пуст или подходящий филиал не найден." 
                  : "Directory is empty or no matching branch was found."}
            </div>
          ) : (
            filteredClinics.map((clinic) => {
              const isSelected = selectedClinic?.id === clinic.id;
              const isNearest = filteredClinics[0]?.id === clinic.id;
              return (
                <div
                  key={clinic.id}
                  onClick={() => onSelectClinic(clinic)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-[#10b981]/10 border-[#10b981]/50 shadow-[inset_0_0_12px_rgba(16,185,129,0.15)] scale-[1.01]'
                      : isNearest
                        ? 'bg-[#10b981]/5 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:border-emerald-500/60'
                        : 'bg-[#080d1a]/50 border-[#1e3256]/40 hover:border-[#1e3256]/80 hover:bg-[#0c1225]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-900 border border-[#1e3256]/60 text-emerald-400 rounded-md font-mono">
                      {clinic.subdomain}.dstoma-navbat-lk2p.vercel.app
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-500 flex items-center gap-0.5">
                      ★ {clinic.rating}
                    </span>
                  </div>
                  {isNearest && (
                    <div className="mb-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max">
                      <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
                      {language === 'uz' 
                        ? '✨ TAVSIYA ETILADI (Sizga eng yaqin)' 
                        : language === 'ru' 
                          ? '✨ РЕКОМЕНДУЕТСЯ (Ближайший к вам)' 
                          : '✨ RECOMMENDED (Nearest to you)'}
                    </div>
                  )}
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

                  {/* Explicit CTA Select Button to select by name/item */}
                  <div className="mt-3 pt-2.5 border-t border-[#1e3256]/20 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest text-slate-400">
                      {isSelected 
                        ? (language === 'uz' ? '⚡ Tanlangan' : language === 'ru' ? '⚡ Активен' : '⚡ Selected')
                        : (language === 'uz' ? '🎯 Faol emas' : language === 'ru' ? '🎯 Не выбран' : '🎯 Click list')
                      }
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClinic(clinic);
                      }}
                      className={`text-[9.5px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-md cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-500/20' 
                          : 'bg-slate-900 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 hover:border-transparent'
                      }`}
                    >
                      {isSelected 
                        ? (language === 'uz' ? '✓ FAOL FILIAL' : language === 'ru' ? '✓ АКТИВНЫЙ ФИЛИАЛ' : '✓ ACTIVE BRANCH')
                        : (language === 'uz' ? '📍 TANLASH' : language === 'ru' ? '📍 ВЫБРАТЬ ФИЛИАЛ' : '📍 SELECT CLINIC')
                      }
                    </button>
                  </div>

                  {/* Route Navigator Shortcuts in the sidebar list when clicked */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-[#10b981]/25 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest text-left">
                        {language === 'uz' ? '🗺️ Marshrut navigatorlari:' : language === 'ru' ? '🗺️ Навигаторы маршрутов:' : '🗺️ Route Navigators:'}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 text-center">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${clinic.lat},${clinic.lng}&travelmode=driving`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 py-1 text-[9px] font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 rounded-lg hover:bg-[#10b981] hover:text-slate-950 transition-all uppercase"
                        >
                          Google Navigation
                        </a>
                        <a
                          href={`https://2gis.uz/routeSearch/rsType/car/from/${userLng},${userLat}/to/${clinic.lng},${clinic.lat}`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 py-1 text-[9px] font-black text-rose-450 bg-rose-950/40 border border-rose-500/20 rounded-lg hover:bg-rose-500 hover:text-white transition-all uppercase"
                        >
                          2GIS Navigation
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Map Presentation - compact responsive height */}
      <div id="map-canvas-container" className="lg:col-span-8 h-[280px] sm:h-[385px] lg:h-[650px] relative bg-[#040814] flex flex-col overflow-hidden">
        
        {/* Detecting Location Initial Overlay */}
        {gpsStatus === 'detecting' && !locationRef.current.initialized && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center p-6 bg-[#0c1225] rounded-3xl border border-emerald-500/30 shadow-[0_0_40px_-5px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in duration-500">
              <Globe className="w-10 h-10 text-emerald-400 animate-spin mb-3 shadow-emerald-500/50" />
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-pulse">
                {language === 'uz' ? 'Joylashuv Aniqlanmoqda...' : language === 'ru' ? 'Определение Местоположения...' : 'Detecting Location...'}
              </span>
            </div>
          </div>
        )}
        
        {/* Real Dynamic Tab Choices - compact responsive size on mobile */}
        <div className="absolute top-3 left-2 sm:left-14 z-40 flex flex-wrap gap-1 bg-slate-950/92 backdrop-blur-md p-1 rounded-xl shadow-2xl border border-[#1e3256]/50 origin-top-left">
          
          <button
            onClick={() => locateUserExact(false)}
            className={`px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer bg-slate-900 border border-[#1e3256]/70 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950`}
            title={t('approxLocation')}
          >
            📍 <span className="hidden sm:inline">{language === 'uz' ? 'Joylashuvim' : language === 'ru' ? 'Моё место' : 'My Location'}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('google')}
            className={`px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'google'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌎 <span className="hidden sm:inline">Google Maps</span><span className="inline sm:hidden">Google</span> {leafletLoaded && activeTab === 'google' && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>}
          </button>

          <button
            onClick={() => setActiveTab('leaflet')}
            className={`px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'leaflet'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🗺️ <span className="hidden sm:inline">OSM Map</span><span className="inline sm:hidden">OSM</span> {leafletLoaded && activeTab === 'leaflet' && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>}
          </button>
          
          <button
            onClick={() => setActiveTab('vector')}
            className={`px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'vector'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📟 <span className="hidden sm:inline">High-Tech HUD</span><span className="inline sm:hidden">HUD Map</span>
          </button>
          
          <button
            onClick={() => setActiveTab('dgis')}
            className={`px-2.5 py-1.5 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'dgis'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🧭 <span className="hidden sm:inline">2GIS Live</span><span className="inline sm:hidden">2GIS</span> {dgisLoaded && activeTab === 'dgis' && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>}
          </button>
        </div>

        {/* Selected Clinic overlay hud - perfectly optimized and beautiful on mobile with Google/2GIS shortcuts */}
        {selectedClinic && (
          <div className="absolute top-14 sm:top-4 right-2 sm:right-4 z-40 max-w-[270px] bg-slate-950/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-[#1e3256]/60 text-left scale-90 sm:scale-100 origin-top-right">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <div className="flex items-center gap-1 text-[8.5px] uppercase tracking-wider font-slate-400 text-emerald-450 font-black leading-none">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-405 shrink-0" /> {selectedClinic.subdomain}.dstoma-navbat-lk2p.vercel.app
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectClinic(null as any);
                }}
                className="text-[9px] text-slate-400 hover:text-slate-205 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 leading-none font-bold"
              >
                {language === 'uz' ? '✕ Yopish' : language === 'ru' ? '✕ Закрыть' : '✕ Close'}
              </button>
            </div>
            <h5 className="text-xs font-black text-slate-100 leading-snug">{selectedClinic.name}</h5>
            <p className="text-[10px] text-slate-400 overflow-hidden leading-relaxed mb-1.5">{selectedClinic.address}</p>
            <div className="space-y-1.5 pt-1.5 border-t border-[#1e3256]/30">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-405 shrink-0" /> {selectedClinic.phone}</span>
                <span className="text-emerald-450 font-black">{getDistance(userLat, userLng, selectedClinic.lat, selectedClinic.lng)} km</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-center">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${selectedClinic.lat},${selectedClinic.lng}&travelmode=driving`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-[9px] font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl px-2 py-1.5 shadow-lg transition-all uppercase"
                >
                  {language === 'uz' ? '🟢 GOOGLE MARSHRUT' : language === 'ru' ? '🟢 МАРШРУТ GOOGLE' : '🟢 GOOGLE ROUTE'}
                </a>
                <a
                  href={`https://2gis.uz/routeSearch/rsType/car/from/${userLng},${userLat}/to/${selectedClinic.lng},${selectedClinic.lat}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-[9px] font-black text-white bg-rose-600 hover:bg-rose-500 rounded-xl px-2 py-1.5 shadow-lg transition-all uppercase"
                >
                  {language === 'uz' ? '🔴 2GIS MARSHRUT' : language === 'ru' ? '🔴 МАРШРУТ 2GIS' : '🔴 2GIS ROUTE'}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Leaflet Interactive Map (Also used for Google Tiles) */}
        {locationRef.current.initialized && (activeTab === 'leaflet' || activeTab === 'google') && (
          <div className="w-full h-full relative z-10 bg-slate-950 flex flex-col justify-end">
            <div ref={mapContainerRef} className="w-full h-full bg-[#111] border border-[#1b2b4d]/40 rounded-b-2xl overflow-hidden shadow-inner" style={{ minHeight: '100%', height: '100%' }}></div>
            
            {/* Live alert */}
            <div className="absolute bottom-2 left-2 right-2 z-40 flex items-center gap-2 bg-slate-950/90 border border-[#1e3256]/60 p-3 rounded-xl text-[10px] text-slate-300 shadow-xl text-left scale-90 sm:scale-100 origin-bottom pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                <strong>
                  {language === 'uz' ? `Interaktiv ${activeTab === 'google' ? 'Google' : 'OSM'} xaritasi faol:` : language === 'ru' ? `Интерактивная карта ${activeTab === 'google' ? 'Google' : 'OSM'} активна:` : `Interactive ${activeTab === 'google' ? 'Google' : 'OSM'} Map Active:`}
                </strong>{' '}
                {language === 'uz' 
                  ? "Real vaqt rejimida barcha filiallar va eng yaqin masofalar ko'rsatiladi. Xaritadan erkin foydalanishingiz mumkin." 
                  : language === 'ru' 
                    ? "Филиалы и расстояния рассчитываются в реальном времени. Карту можно двигать и масштабировать." 
                    : "Shows real-time branch markers and computed Haversine metrics of nearest clinics. Drag resources freely or pinch zoom."}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Vector fallback style map of Uzbekistan */}
        {locationRef.current.initialized && activeTab === 'vector' && (
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
                  {language === 'uz' ? "O'zbekiston Neon Integratsion Xaritasi" : language === 'ru' ? "Неоновая интеграционная карта Узбекистана" : "Uzbekistan Neon Integration Map"}
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-sm text-left">
                  {language === 'uz' 
                    ? "Toshkent, Samarqand va Buxoro optik chiziqlar orqali sinxronlangan. Shahar tugmasini bossangiz, filiallar ro'yxatiga o'tiladi." 
                    : language === 'ru' 
                      ? "Ташкент (HQ), Самарканд и Бухара синхронизированы по оптическим каналам. Выберите точку для фокусировки." 
                      : "Tashkent (HQ), Samarkand and Bukhara synchronized via optical lines. Click any node to navigate to branches."}
                </p>
              </div>

              {/* Status HUD indicator */}
              <div className="bg-[#0b101e]/90 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{language === 'uz' ? "SINXRON: BARCHA TIZIMLAR FAOL" : language === 'ru' ? "СИНХР: ВСЕ УЗЛЫ В СЕТИ" : "SYNC: ALL NODES ONLINE"}</span>
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
                  <g transform={`translate(${((userLng - 56) / (73.1 - 56)) * 600}, ${((45.5 - userLat) / (45.5 - 37.1)) * 300})`}>
                    <rect x="-65" y="-12" width="130" height="15" rx="3" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="0.5" />
                    <circle cx="0" cy="-4" r="3" fill="#ef4444" className="animate-ping" />
                    <text x="0" y="-1" textAnchor="middle" fill="#fca5a5" fontSize="6.5" fontWeight="black" fontFamily="monospace" letterSpacing="0.8">
                      {language === 'uz' ? '📍 SIZNING JOYINGIZ' : language === 'ru' ? '📍 ВАШЕ МЕСТО' : '📍 YOUR LOCATION'}
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Bottom guide info banner */}
            <div className="relative z-10 flex items-center gap-3 bg-[#0b1022]/90 p-4 border border-[#1e2e4b] rounded-2xl text-slate-300 text-[11px] shadow-md text-left">
              <span className="p-1.5 bg-slate-800/65 text-yellow-500 rounded-lg shrink-0 text-sm">⚡</span>
              <p className="font-semibold leading-relaxed">
                <strong className="text-white text-[11.5px]">{language === 'uz' ? 'Kiber HUD:' : language === 'ru' ? 'Кибер HUD:' : 'Cyber HUD:'}</strong>{' '}
                {language === 'uz' 
                  ? "Siz joylashgan real GPS yoki tanlangan markaz qizil marker bilan belgilandi. Eng yaqin filial chiptasini olish uchun unga bosing."
                  : language === 'ru' 
                    ? "Ваше реальное местоположение или выбранный центр отмечены красным маркером. Нажмите на любой филиал для получения билета."
                    : "Your real GPS location or selected center is highlighted by a red marker. Tap any branch to book in."
                }
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: 2GIS Interactive Map */}
        {locationRef.current.initialized && activeTab === 'dgis' && (
          <div className="w-full h-full relative z-10 bg-slate-950 flex flex-col justify-end">
            <div ref={dgisMapContainerRef} className="w-full h-full bg-[#111] border border-[#1b2b4d]/40 rounded-b-2xl overflow-hidden shadow-inner" style={{ minHeight: '100%', height: '100%' }}></div>
            
            {/* Live alert */}
            <div className="absolute bottom-2 left-2 right-2 z-40 flex items-center gap-2 bg-slate-950/90 border border-[#1e3256]/60 p-3 rounded-xl text-[10px] text-slate-300 shadow-xl text-left scale-90 sm:scale-100 origin-bottom pointer-events-none">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>
                <strong>
                  {language === 'uz' ? '2GIS Maps faol:' : language === 'ru' ? 'Карта 2GIS активна:' : '2GIS Maps Live Active:'}
                </strong>{' '}
                {language === 'uz' 
                  ? "Bemorning aniq koordinatasi (qizil nuqta) hamda barcha filiallar reytinglari va masofalari xaritada ko'rsatildi. Marshrut olish uchun pastdagi tugmalarni bosing."
                  : language === 'ru' 
                    ? "Точное местоположение пациента (красная метка), филиалы стоматологии и расстояния успешно нанесены на карту." 
                    : "Patient's exact coordinates (red marker) and all branch ratings & distances are successfully plotted onto the map."}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
