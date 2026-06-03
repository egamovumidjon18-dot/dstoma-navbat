/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_CLINICS, INITIAL_DOCTORS, INITIAL_SERVICES, INITIAL_QUEUES } from './data';
import { Clinic, Doctor, Service, QueueItem } from './types';
import ClinicMap from './components/ClinicMap';
import ClientDashboard from './components/ClientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import DirectorDashboard from './components/DirectorDashboard';
import DjangoSolutions from './components/DjangoSolutions';
import { Activity, ShieldAlert, Cpu, HeartPulse, User, Users, FolderKanban, Terminal, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

export default function App() {
  // Master States
  const [clinics, setClinics] = useState<Clinic[]>(INITIAL_CLINICS);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [services] = useState<Service[]>(INITIAL_SERVICES);
  const [queues, setQueues] = useState<QueueItem[]>(INITIAL_QUEUES);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'bemor' | 'shifokor' | 'boshliq' | 'kod'>('bemor');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(INITIAL_CLINICS[0]); // Starts at Samarqand

  // Auto queue generator simulator state
  const [autoSimulationActive, setAutoSimulationActive] = useState<boolean>(true);
  const [simMessage, setSimMessage] = useState<string>('');

  // 10s auto-refresh simulator
  useEffect(() => {
    if (!autoSimulationActive) return;

    const interval = setInterval(() => {
      // Pick a random clinic
      const randomClinic = clinics[Math.floor(Math.random() * clinics.length)];
      const clinicDoctors = doctors.filter(d => d.clinicId === randomClinic.id);
      if (clinicDoctors.length === 0) return;
      const randomDoctor = clinicDoctors[Math.floor(Math.random() * clinicDoctors.length)];
      const clinicServices = services.filter(s => s.clinicId === randomClinic.id);
      if (clinicServices.length === 0) return;
      const randomService = clinicServices[Math.floor(Math.random() * clinicServices.length)];

      // Patient names
      const sampleNames = ['Shaxboz Ochilov', 'Dilnoza Karimova', 'Murod Ergashev', 'Nozima To\'rayeva', 'Umid Bozorov', 'Aziza Solihova', 'Bekzod Karimov'];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const mockPhone = `+998 (97) 333-${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`;

      // Calculate new queue ticket
      const sameClinicQueues = queues.filter((q) => q.clinicId === randomClinic.id);
      const startNum = randomClinic.id === 'samarqand' ? 100 : randomClinic.id === 'buxoro' ? 200 : 300;
      const maxNum = sameClinicQueues.reduce((max, item) => (item.number > max ? item.number : max), startNum);
      const ticketNo = maxNum + 1;

      const newSimQueue: QueueItem = {
        id: 'sim_q_' + Math.random().toString(36).substr(2, 9),
        clinicId: randomClinic.id,
        patientName: randomName,
        patientPhone: mockPhone,
        doctorId: randomDoctor.id,
        serviceId: randomService.id,
        number: ticketNo,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Add to queues
      setQueues(prev => [...prev, newSimQueue]);

      // Highlight simulation log
      setSimMessage(`[Simulyator] Yangi bemor "${randomName}" ${randomClinic.name}ga navbat oldi! Chipta raqami: #${ticketNo}`);
      setTimeout(() => setSimMessage(''), 6000);

      // Increment clinic active patient counter
      setClinics(prev => prev.map(c => {
        if (c.id === randomClinic.id) {
          return { ...c, activePatients: c.activePatients + 1 };
        }
        return c;
      }));

    }, 20000); // Trigger every 20 seconds to be noticeable but quiet

    return () => clearInterval(interval);
  }, [autoSimulationActive, clinics, doctors, services, queues]);

  // Handle URL parameters for SEO and Navigation on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const clinicParam = params.get('clinic');

    if (tabParam && ['bemor', 'shifokor', 'boshliq', 'kod'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    if (clinicParam) {
      const foundClinic = clinics.find(c => c.id === clinicParam || c.subdomain === clinicParam);
      if (foundClinic) {
        setSelectedClinic(foundClinic);
      }
    }
  }, []);

  // Update URL search parameters, document title, and description meta tag dynamically for excellent search indexing
  useEffect(() => {
    let title = "DStoma Queue - Multi-Tenant Elektron Navbat Tizimi";
    let desc = "Stomatologiya klinikalari uchun ko'p ijarachili (Multi-Tenant) elektron navbat va Google Maps integratsiyali aqlli boshqaruv tizimi. Samarqand, Buxoro, Toshkent.";

    if (activeTab === 'bemor') {
      if (selectedClinic) {
        title = `${selectedClinic.name} - Onlayn Navbat Olish | DStoma Queue`;
        desc = `${selectedClinic.name} filiali uchun elektron stomatologiya navbati olish sahifasi. Manzil: ${selectedClinic.address}. Telefon: ${selectedClinic.phone}. Onlayn navbat band qilish.`;
      } else {
        title = "Bemor Kabineti - Onlayn Elektron Navbat | DStoma Queue";
        desc = "Shifokor ko'rigiga onlayn navbat olish, shaxsiy chiptalar statusini kuzatib borish va shifokorlar reytingini baholash sahifasi.";
      }
    } else if (activeTab === 'shifokor') {
      title = "Shifokor Konsultatsiya Paneli | DStoma Queue";
      desc = "Shifokorlar va stomatologlar uchun faol bemorlar navbatini boshqarish, chaqirish, konsultatsiyani yakunlash va kunlik daromadlarni tahlil qilish tizimi.";
    } else if (activeTab === 'boshliq') {
      title = "Manager & Director Dashboard - Boshliq Bo'limi | DStoma Queue";
      desc = "Klinika tarmog'i rahbarlari uchun global tahlillar, haftalik daromad xaritalari hamda filiallar bo'yicha tahliliy ko'rsatkichlar monitoringi.";
    } else if (activeTab === 'kod') {
      title = "Django 6+ Multi-Tenant Sozlamalari & Kod Yo'riqnomasi | DStoma Queue";
      desc = "Django loyihalari uchun Railway-da makemigrations va database xatoliklarini to'liq tuzatish bo'yicha professional yo'lboshlovchi.";
    }

    document.title = title;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    // Update URL Search parameters elegantly (without page reload) to give unique indexable URLs
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', activeTab);
    if (selectedClinic) {
      newUrl.searchParams.set('clinic', selectedClinic.id);
    } else {
      newUrl.searchParams.delete('clinic');
    }
    window.history.replaceState({}, '', newUrl.toString());
  }, [activeTab, selectedClinic]);

  // Master Handlers
  const handleAddQueue = (newQueue: QueueItem) => {
    setQueues(prev => [...prev, newQueue]);
    
    // Increment patient counter
    setClinics(prev => prev.map(c => {
      if (c.id === newQueue.clinicId) {
        return { ...c, activePatients: c.activePatients + 1 };
      }
      return c;
    }));
  };

  const handleCancelQueue = (id: string) => {
    setQueues(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, status: 'cancelled' };
      }
      return q;
    }));

    // Adjust counter
    const item = queues.find(q => q.id === id);
    if (item) {
      setClinics(prev => prev.map(c => {
        if (c.id === item.clinicId && c.activePatients > 0) {
          return { ...c, activePatients: c.activePatients - 1 };
        }
        return c;
      }));
    }
  };

  const handleUpdateQueueStatus = (id: string, newStatus: QueueItem['status']) => {
    setQueues(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, status: newStatus };
      }
      return q;
    }));

    // If completed or cancelled, reduce the active patients count
    const item = queues.find(q => q.id === id);
    if (item && (newStatus === 'completed' || newStatus === 'cancelled')) {
      setClinics(prev => prev.map(c => {
        if (c.id === item.clinicId && c.activePatients > 0) {
          return { ...c, activePatients: c.activePatients - 1 };
        }
        return c;
      }));
    }
  };

  const handleUpdateDoctorRating = (id: string, rating: number) => {
    // 1. Update rating in the QueueItem
    setQueues(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, rating };
      }
      return q;
    }));

    // 2. Recalculate specific doctor rating statistics
    const queueObj = queues.find(q => q.id === id);
    if (!queueObj) return;

    setDoctors(prev => prev.map(d => {
      if (d.id === queueObj.doctorId) {
        const totalRatingPoints = (d.rating * d.ratingCount) + rating;
        const newCount = d.ratingCount + 1;
        return {
          ...d,
          ratingCount: newCount,
          rating: parseFloat((totalRatingPoints / newCount).toFixed(2))
        };
      }
      return d;
    }));
  };

  const handleUpdateClinicSubscription = (clinicId: string, status: 'active' | 'suspended' | 'trial', nextDueDate: string) => {
    setClinics(prev => prev.map(c => {
      if (c.id === clinicId) {
        return { ...c, subscriptionStatus: status, nextPaymentDate: nextDueDate };
      }
      return c;
    }));
  };

  const handleToggleClinicStatus = (clinicId: string) => {
    setClinics(prev => prev.map(c => {
      if (c.id === clinicId) {
        const current = c.subscriptionStatus || 'active';
        const next: 'active' | 'suspended' | 'trial' = current === 'suspended' ? 'active' : 'suspended';
        return { ...c, subscriptionStatus: next };
      }
      return c;
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 antialiased font-sans transition-colors duration-500 selection:bg-cyan-600 selection:text-white pb-10">
      
      {/* Simulation Log Banner */}
      {simMessage && (
        <div className="bg-cyan-600 text-white py-2 px-4 shadow-md text-xs font-semibold font-mono tracking-wide flex items-center justify-between gap-4 select-none relative z-50">
          <span className="flex items-center gap-1.5 animate-pulse">
            <HeartPulse className="w-4 h-4 text-rose-300" />
            {simMessage}
          </span>
          <button onClick={() => setSimMessage('')} className="text-white bg-slate-800/40 hover:bg-slate-700/40 px-2 py-0.5 rounded text-[10px]">
            Yopish
          </button>
        </div>
      )}

      {/* Main Nav-Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-cyan-600 text-white rounded-xl flex items-center justify-center text-xl shadow-md cursor-default">
              🦷
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-md font-extrabold text-slate-900 tracking-tight leading-none">DStoma Queue</h1>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded font-mono">v6.0 PWA</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Stomatologiya Klinikalari uchun Elektron Navbat Boshqaruv Tizimi (Multi-Tenant)</p>
            </div>
          </div>

          {/* SIMULATOR SWITCH */}
          <div className="flex items-center gap-2 text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Cpu className="w-4 h-4 text-cyan-600" />
            <span className="text-slate-600">Navbat Simulyatori (har 20 soniyada):</span>
            <button
              onClick={() => setAutoSimulationActive(s => !s)}
              className="focus:outline-none transition-all hover:scale-105"
              title="Avtomatik o'yinchi navbqtlarini simulyatsiya qilish tunikasi"
            >
              {autoSimulationActive ? (
                <ToggleRight className="w-8 h-8 text-cyan-600" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-400" />
              )}
            </button>
          </div>

        </div>

        {/* Categories Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex border-t border-slate-100 overflow-x-auto gap-2 py-2">
            
            <button
              onClick={() => setActiveTab('bemor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'bemor'
                  ? 'bg-cyan-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" /> Bemor Kabineti (Mijozlar)
            </button>

            <button
              onClick={() => setActiveTab('shifokor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'shifokor'
                  ? 'bg-cyan-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" /> Shifokor Paneli (Konsultatsiyalar)
            </button>

            <button
              onClick={() => setActiveTab('boshliq')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'boshliq'
                  ? 'bg-cyan-600 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <FolderKanban className="w-4 h-4" /> Boss Dashboardi (Boshliq)
            </button>

            <button
              onClick={() => setActiveTab('kod')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'kod'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4" /> Django Kodlar Yo'riqnomasi
            </button>

          </div>
        </div>
      </header>

      {/* Main Core App Workspace with Staggered Transition */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Show Map permanently inside Customer and Admin dashboards for continuous usability */}
            {(activeTab === 'bemor' || activeTab === 'boshliq') && (
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-slate-400 block uppercase tracking-widest">
                  📍 INTERAKTIV GEOLOKATSIYA DIRECTORY (GOOGLE MAPS)
                </span>
                <ClinicMap
                  clinics={clinics}
                  selectedClinic={selectedClinic}
                  onSelectClinic={(c) => setSelectedClinic(c)}
                />
              </div>
            )}

            {/* Sub Tabs views */}
            {activeTab === 'bemor' && (
              <ClientDashboard
                clinics={clinics}
                doctors={doctors}
                services={services}
                queues={queues}
                selectedClinic={selectedClinic}
                onSelectClinic={(c) => setSelectedClinic(c)}
                onAddQueue={handleAddQueue}
                onCancelQueue={handleCancelQueue}
                onUpdateDoctorRating={handleUpdateDoctorRating}
              />
            )}

            {activeTab === 'shifokor' && (
              <DoctorDashboard
                clinics={clinics}
                doctors={doctors}
                services={services}
                queues={queues}
                onUpdateQueueStatus={handleUpdateQueueStatus}
                selectedClinic={selectedClinic}
              />
            )}

            {activeTab === 'boshliq' && (
              <DirectorDashboard
                clinics={clinics}
                doctors={doctors}
                services={services}
                queues={queues}
                onUpdateClinicSubscription={handleUpdateClinicSubscription}
                onToggleClinicStatus={handleToggleClinicStatus}
              />
            )}

            {activeTab === 'kod' && (
              <DjangoSolutions />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
