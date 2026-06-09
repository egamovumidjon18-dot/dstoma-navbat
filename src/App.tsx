/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_CLINICS, INITIAL_DOCTORS, INITIAL_SERVICES, INITIAL_QUEUES } from './data';
import { Clinic, Doctor, Service, QueueItem, SaaSPayment } from './types';
import ClinicMap from './components/ClinicMap';
import ClientDashboard from './components/ClientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import DirectorDashboard from './components/DirectorDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { TRANSLATIONS, Language } from './translations';
import { sendQueueCreatedNotification, sendQueueStatusNotification } from './services/telegram';
import { DjangoAPI } from './services/api';
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  HeartPulse, 
  User, 
  Users, 
  FolderKanban, 
  Terminal, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles,
  Settings2,
  Server,
  Wifi,
  WifiOff,
  AlertCircle,
  Crown
} from 'lucide-react';

export default function App() {
  // Master States
  const [clinics, setClinics] = useState<Clinic[]>(INITIAL_CLINICS);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [queues, setQueues] = useState<QueueItem[]>(INITIAL_QUEUES);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'bemor' | 'shifokor' | 'boshliq' | 'superadmin'>('bemor');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(INITIAL_CLINICS[0] || null); // Pre-selected first clinic to make central panels always open

  // 3-Language and Auth states
  const [language, setLanguage] = useState<Language>('uz');
  const [currentUser, setCurrentUser] = useState<{
    type: 'superadmin' | 'director' | 'doctor';
    id?: string;
    clinicId?: string;
    name?: string;
  } | null>(null);

  // Login Form input fields
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Stateful Superadmin credentials with persistent LocalStorage syncing
  const [superadminLogin, setSuperadminLogin] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dstoma_sa_login');
      if (saved) return saved;
    }
    return 'superadmin';
  });
  const [superadminPassword, setSuperadminPassword] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dstoma_sa_password');
      if (saved) return saved;
    }
    return 'adminstoma';
  });

  // Simulated email inbox (for superadmin password change alerts)
  const [gmailInboxes, setGmailInboxes] = useState<Array<{
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    time: string;
    read: boolean;
  }>>([]);

  // Stateful SaaS Payments for Monitoring and Approval
  const [saasPayments, setSaasPayments] = useState<SaaSPayment[]>([
    {
      id: 'pay_1',
      clinicId: 'samarqand',
      clinicName: 'DStoma Samarqand',
      amount: 1500000,
      dueDate: '2026-05-15',
      paymentDate: '2026-05-14',
      status: 'confirmed'
    },
    {
      id: 'pay_2',
      clinicId: 'toshkent',
      clinicName: 'DStoma Toshkent',
      amount: 2000000,
      dueDate: '2026-05-20',
      paymentDate: '2026-05-19',
      status: 'confirmed'
    },
    {
      id: 'pay_3',
      clinicId: 'buxoro',
      clinicName: 'DStoma Buxoro',
      amount: 1200000,
      dueDate: '2026-06-01',
      paymentDate: '2026-05-31',
      status: 'pending_approval'
    },
    {
      id: 'pay_4',
      clinicId: 'samarqand',
      clinicName: 'DStoma Samarqand',
      amount: 1500000,
      dueDate: '2026-06-15',
      status: 'unpaid'
    }
  ]);

  const triggerGmailNotification = (subject: string, body: string) => {
    const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    setGmailInboxes(prev => [
      {
        id: 'mail_' + Math.random().toString(),
        from: 'DStoma Protection <security@dstoma.uz>',
        to: 'egamovumidjon18@gmail.com',
        subject,
        body,
        time,
        read: false
      },
      ...prev
    ]);
  };

  const t = (key: keyof typeof TRANSLATIONS['uz']) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['uz'][key] || String(key);
  };

  // Credential updater callbacks used by Owner (SuperAdmin)
  const handleUpdateClinicCreds = (clinicId: string, login: string, pass: string) => {
    setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, login, password: pass } : c));
  };

  const handleUpdateDoctorCreds = (doctorId: string, login: string, pass: string) => {
    setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, login, password: pass } : d));
  };

  const handleDeleteClinic = (clinicId: string) => {
    setClinics(prev => prev.filter(c => c.id !== clinicId));
    // For data integrity, purge doctors and queues linked to this clinic
    setDoctors(prev => prev.filter(d => d.clinicId !== clinicId));
    setQueues(prev => prev.filter(q => q.clinicId !== clinicId));
    if (selectedClinic?.id === clinicId) {
      setSelectedClinic(null);
    }
  };

  const handleDeleteDoctor = (doctorId: string) => {
    setDoctors(prev => prev.filter(d => d.id !== doctorId));
    // Purge corresponding queues
    setQueues(prev => prev.filter(q => q.doctorId !== doctorId));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const userLower = authUsername.trim();
    const passLower = authPassword.trim();

    // 1. Superadmin check
    if (userLower === superadminLogin && passLower === superadminPassword) {
      setCurrentUser({
        type: 'superadmin',
        name: t('clinicOwner')
      });
      setAuthUsername('');
      setAuthPassword('');
      return;
    }

    // 2. Director checks
    const matchedClinic = clinics.find(c => c.login === userLower && c.password === passLower);
    if (matchedClinic) {
      setCurrentUser({
        type: 'director',
        clinicId: matchedClinic.id,
        name: matchedClinic.ownerName || matchedClinic.name
      });
      setSelectedClinic(matchedClinic); // Automatically sync the multi-tenant scope
      setAuthUsername('');
      setAuthPassword('');
      return;
    }

    // 3. Doctor checks
    const matchedDoctor = doctors.find(d => d.login === userLower && d.password === passLower);
    if (matchedDoctor) {
      setCurrentUser({
        type: 'doctor',
        id: matchedDoctor.id,
        clinicId: matchedDoctor.clinicId,
        name: matchedDoctor.name
      });
      setAuthUsername('');
      setAuthPassword('');
      return;
    }

    // Noto'g'ri kalitlar
    setAuthError(t('credIncorrect'));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
    setActiveTab('bemor');
  };

  // Handle URL parameters for SEO and Navigation on mount + sync modern Telegram Bot token set in Vercel Env
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const clinicParam = params.get('clinic');

    if (tabParam && ['bemor', 'shifokor', 'boshliq', 'superadmin'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    if (clinicParam) {
      const foundClinic = clinics.find(c => c && (c.id === clinicParam || c.subdomain === clinicParam));
      if (foundClinic) {
        setSelectedClinic(foundClinic);
      }
    }

    // Fetch current Telegram Bot token dynamically to prevent desync between Vite build bundle and Vercel dashboard environment keys
    const syncTelegramConfig = async () => {
      try {
        const response = await fetch('/api/telegram-config');
        if (response.ok) {
          const data = await response.json();
          if (data && data.token) {
            localStorage.setItem('dstoma_telegram_token', data.token);
            console.log("[DStoma SaaS Core] Synchronized dynamic Telegram token:", data.token.slice(0, 10) + "...");
          }
        }
      } catch (err) {
        console.warn("[DStoma SaaS Core] Active serverless API offline. Falling back to local/default configs.", err);
      }
    };
    syncTelegramConfig();
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

  // Synchronize queues from local Express server database in real-time
  useEffect(() => {
    let active = true;
    const fetchQueues = async () => {
      try {
        const data = await DjangoAPI.getQueues();
        if (active && data && data.length > 0) {
          setQueues(data);
        }
      } catch (err) {
        console.warn("[App.tsx DB Poll Notice] Central server offline or resolving:", err);
      }
    };

    fetchQueues();
    const interval = setInterval(fetchQueues, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Master Handlers
  const handleAddQueue = async (newQueue: QueueItem) => {
    setQueues(prev => [...prev, newQueue]);
    
    // Increment patient counter
    setClinics(prev => prev.map(c => {
      if (c.id === newQueue.clinicId) {
        return { ...c, activePatients: c.activePatients + 1 };
      }
      return c;
    }));

    // Post to Express backend
    try {
      const saved = await DjangoAPI.createQueueItem({
        clinicId: newQueue.clinicId,
        doctorId: newQueue.doctorId,
        serviceId: newQueue.serviceId,
        patientName: newQueue.patientName,
        patientPhone: newQueue.patientPhone,
        hasInfection: newQueue.hasInfection,
        medicalNotes: newQueue.medicalNotes,
        passportSerial: newQueue.passportSerial,
        telegramChatId: newQueue.telegramChatId
      });
      // Update state with confirmed values
      setQueues(prev => prev.map(q => q.id === newQueue.id ? saved : q));
    } catch (err) {
      console.warn("[App.tsx] Backend queue sync failed, preserving offline state", err);
    }

    // Trigger Telegram Notification
    if (newQueue.telegramChatId) {
      const clinic = clinics.find(c => c.id === newQueue.clinicId);
      const doctor = doctors.find(d => d.id === newQueue.doctorId);
      const service = services.find(s => s.id === newQueue.serviceId);
      
      const clinicName = clinic ? clinic.name : 'DStoma Clinic';
      const doctorName = doctor ? doctor.name : 'Shifokor';
      const serviceName = service ? service.name : 'Tibbiy Xizmat';

      sendQueueCreatedNotification(
        newQueue.telegramChatId,
        newQueue.number,
        newQueue.patientName,
        clinicName,
        doctorName,
        serviceName
      ).then(success => {
        if (success) {
          console.log(`Telegram notification successfully sent for ticket #${newQueue.number}`);
        }
      });
    }
  };

  const handleCancelQueue = async (id: string) => {
    setQueues(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, status: 'cancelled' };
      }
      return q;
    }));

    try {
      await DjangoAPI.updateQueueStatus(id, 'cancelled');
    } catch (err) {
      console.warn("[App.tsx] Backend queue cancellation sync failed", err);
    }

    // Adjust counter
    const item = queues.find(q => q.id === id);
    if (item) {
      setClinics(prev => prev.map(c => {
        if (c.id === item.clinicId && c.activePatients > 0) {
          return { ...c, activePatients: c.activePatients - 1 };
        }
        return c;
      }));

      // Trigger Telegram Notification for cancellation
      if (item.telegramChatId) {
        const doctor = doctors.find(d => d.id === item.doctorId);
        const doctorName = doctor ? doctor.name : 'Shifokor';
        sendQueueStatusNotification(
          item.telegramChatId,
          item.number,
          item.patientName,
          'cancelled',
          doctorName
        );
      }
    }
  };

  const handleUpdateQueueStatus = async (id: string, newStatus: QueueItem['status']) => {
    setQueues(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, status: newStatus };
      }
      return q;
    }));

    try {
      await DjangoAPI.updateQueueStatus(id, newStatus);
    } catch (err) {
      console.warn("[App.tsx] Backend status change sync failed", err);
    }

    // If completed or cancelled, reduce the active patients count
    const item = queues.find(q => q.id === id);
    if (item) {
      if (newStatus === 'completed' || newStatus === 'cancelled') {
        setClinics(prev => prev.map(c => {
          if (c.id === item.clinicId && c.activePatients > 0) {
            return { ...c, activePatients: c.activePatients - 1 };
          }
          return c;
        }));
      }

      // Trigger Telegram live update notifications
      if (item.telegramChatId) {
        const doctor = doctors.find(d => d.id === item.doctorId);
        const doctorName = doctor ? doctor.name : 'Shifokor';
        sendQueueStatusNotification(
          item.telegramChatId,
          item.number,
          item.patientName,
          newStatus,
          doctorName
        );
      }
    }
  };

  const handleUpdateDoctorRating = async (id: string, rating: number) => {
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

  const handleUpdateClinicSubscription = async (clinicId: string, status: 'active' | 'suspended' | 'trial', nextDueDate: string) => {
    setClinics(prev => prev.map(c => {
      if (c.id === clinicId) {
        return { ...c, subscriptionStatus: status, nextPaymentDate: nextDueDate };
      }
      return c;
    }));
  };

  const handleToggleClinicStatus = async (clinicId: string) => {
    const targetClinic = clinics.find(c => c.id === clinicId);
    if (!targetClinic) return;
    const current = targetClinic.subscriptionStatus || 'active';
    const nextStatus: 'active' | 'suspended' | 'trial' = current === 'suspended' ? 'active' : 'suspended';

    setClinics(prev => prev.map(c => {
      if (c.id === clinicId) {
        return { ...c, subscriptionStatus: nextStatus };
      }
      return c;
    }));
  };

  const handleUpdateClinicDetails = (updatedClinic: Clinic) => {
    setClinics(prev => prev.map(c => c.id === updatedClinic.id ? updatedClinic : c));
  };

  const handlePaySubscriptionSimulate = (clinicId: string) => {
    const targetClinic = clinics.find(c => c.id === clinicId);
    if (!targetClinic) return;

    const newPayment: SaaSPayment = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      clinicId: clinicId,
      clinicName: targetClinic.name,
      amount: targetClinic.rentalPrice || 1500000,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending_approval'
    };

    setSaasPayments(prev => [newPayment, ...prev]);
  };

  const handleApproveSaaSPayment = (paymentId: string) => {
    // Finds the target payment invoice
    const targetPay = saasPayments.find(p => p.id === paymentId);
    if (!targetPay) return;

    // 1. Mark invoice as confirmed & set paymentDate as today
    setSaasPayments(prev => prev.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'confirmed',
          paymentDate: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    }));

    // 2. Activate the corresponding clinic subscription, extend next payment due date by 30 days
    setClinics(prev => prev.map(c => {
      if (c.id === targetPay.clinicId) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        return {
          ...c,
          subscriptionStatus: 'active',
          nextPaymentDate: nextDate.toISOString().split('T')[0]
        };
      }
      return c;
    }));
  };

  const handleUpdateSuperadminCreds = (newLogin: string, newPass: string) => {
    setSuperadminLogin(newLogin);
    setSuperadminPassword(newPass);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dstoma_sa_login', newLogin);
      localStorage.setItem('dstoma_sa_password', newPass);
    }
    // Send email copy to egamovumidjon18@gmail.com
    triggerGmailNotification(
      "🔑 DStoma Superadmin akkaunt ma'lumotlari muvaffaqiyatli o'zgartirildi",
      `Hurmatli DStoma tarmog'i egasi,\n\nTizim xavfsizligi bo'limidan xabar: Sizning Superadmin boshqaruv paneliga kirish parametrlaringiz muvaffaqiyatli yangilandi!\n\nYangi Login ma'lumotlari:\n- Yangi Login: ${newLogin}\n- Yangi Parol: ${newPass}\n\nUshbu xat egamovumidjon18@gmail.com elektron pochtangizga avtomatik tarzda xavfsizlik protokoli doirasida yuborildi. Iltimos, hisob ma'lumotlarini begonalarga aslo oshkor qilmang.\n\nHurmat bilan, DStoma SaaS Security Team.`
    );
  };

  const handleAddClinic = (newClinic: Clinic) => {
    setClinics(prev => [...prev, newClinic]);
    
    // Auto generate 1-week free trial payment invoice details!
    const trialInvoice: SaaSPayment = {
      id: 'pay_trial_' + Math.random().toString(36).substr(2, 9),
      clinicId: newClinic.id,
      clinicName: newClinic.name,
      amount: 0, // Free trial
      dueDate: newClinic.nextPaymentDate || new Date().toISOString().split('T')[0],
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'confirmed' // Confirmed automatically since it is free 0 UZS
    };
    setSaasPayments(prev => [trialInvoice, ...prev]);
  };

  const handleAddDoctor = (newDoc: Doctor) => {
    setDoctors(prev => [...prev, newDoc]);
  };

  const handleUpdateService = (updatedSrv: Service) => {
    setServices(prev => prev.map(s => s.id === updatedSrv.id ? updatedSrv : s));
  };

  const handleAddService = (newSrv: Service) => {
    setServices(prev => [...prev, newSrv]);
  };

  // Master state for mobile menu drawer sidebar (mobile responsiveness)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#040814] text-slate-200 antialiased font-sans transition-all duration-300 selection:bg-emerald-500 selection:text-white pb-6">
      
      {/* ---------------- SIDEBAR: LEFT DOCKED MEDICAL RAIL (AS SEEN IN USER PHOTO) ---------------- */}
      <aside className="w-72 shrink-0 bg-[#0c1225] border-r border-[#1e3256]/60 p-5 flex-col justify-between sticky top-0 h-screen hidden lg:flex select-none z-40">
        
        {/* Top Branding Section */}
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center text-center p-5 bg-gradient-to-b from-[#16223f]/40 to-[#0e172e]/25 border border-[#1e3256]/30 rounded-3xl relative overflow-hidden select-none group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#ec4899]/5 via-transparent to-[#10b981]/5 opacity-60" />
            
            {/* Logo Icon on TOP with pulse & bloom shadow */}
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute w-16 h-16 bg-[#10b981]/20 blur-xl rounded-full animate-pulse" />
              <div className="w-15 h-15 rounded-2xl bg-[#091124] border border-[#10b981]/50 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] relative overflow-hidden transition-transform duration-500 hover:scale-105">
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_10%,transparent_90%)] opacity-20" />
                <svg viewBox="0 0 100 65" className="w-13 h-10 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)] z-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Left part: Beautiful contoured tooth */}
                  <path d="M 32,15 C 24,15 17,18 13,23 C 9,28 9,37 11,44 C 13,51 11,61 15,65 C 18,67 21,58 26,51 C 28,48 30,48 32,51 C 37,58 40,67 43,65 C 47,61 45,51 47,44 C 49,37 49,28 45,23 C 41,18 34,15 32,15 Z" className="stroke-[#10b981] animate-pulse" strokeWidth="2.5" />
                  {/* Right part: Interlocked D shape capital letter */}
                  <path d="M 52,15 L 52,65" className="stroke-[#10b981]" strokeWidth="2.5" />
                  <path d="M 52,15 C 68,15 82,24 82,40 C 82,56 68,65 52,65" className="stroke-[#10b981]" strokeWidth="2.5" />
                  {/* Internal high-tech custom lines */}
                  <path d="M 58,26 L 58,54" className="stroke-[#34d399]/60" strokeWidth="1.5" strokeDasharray="2 3" />
                  <path d="M 64,26 C 70,30 70,50 64,54" className="stroke-[#34d399]" strokeWidth="1.5" />
                  {/* Smooth connecting bridge */}
                  <path d="M 44,40 C 47,37 49,37 52,40" className="stroke-[#10b981]" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Logo Text Centered Below */}
            <div className="z-10">
              <h1 className="text-sm font-bold text-white tracking-wide font-display">DStoma Queue</h1>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.25 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold rounded font-mono">v6.5 PWA</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">• CRM</span>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Items exactly as in mockup */}
          <nav className="space-y-2 pt-2 text-left">
            <span className="text-[9px] font-black text-slate-500 block uppercase tracking-widest mb-3 pl-2">{t('categories')}</span>
            
            <button
              onClick={() => setActiveTab('bemor')}
              className={`w-full px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-3 border ${
                activeTab === 'bemor'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 border-transparent'
              }`}
            >
              <User className={`w-4 h-4 transition-colors ${activeTab === 'bemor' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{t('bemorTab')}</span>
            </button>

            <button
              onClick={() => setActiveTab('shifokor')}
              className={`w-full px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-3 border ${
                activeTab === 'shifokor'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 border-transparent'
              }`}
            >
              <Users className={`w-4 h-4 transition-colors ${activeTab === 'shifokor' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{t('shifokorTab')}</span>
            </button>

            <button
              onClick={() => setActiveTab('boshliq')}
              className={`w-full px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-3 border ${
                activeTab === 'boshliq'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 border-transparent'
              }`}
            >
              <FolderKanban className={`w-4 h-4 transition-colors ${activeTab === 'boshliq' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{t('boshliqTab')}</span>
            </button>

            <button
              onClick={() => setActiveTab('superadmin')}
              className={`w-full px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-3 border ${
                activeTab === 'superadmin'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/35 border-transparent'
              }`}
            >
              <Crown className={`w-4 h-4 transition-colors ${activeTab === 'superadmin' ? 'text-emerald-400' : 'text-amber-500 fill-current'}`} />
              <span>{t('superadminTab')}</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar Settings, Lang & Simulation HUD */}
        <div className="space-y-4 pt-4 border-t border-[#1e3256]/50">
          
          {/* Language Switcher and Settings Button Block exactly representing image */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center bg-[#070b15] p-1 rounded-xl border border-[#1e3256]/40 gap-0.5 flex-1">
              <button
                onClick={() => setLanguage('uz')}
                className={`py-1 text-[10px] font-extrabold rounded-md flex-1 transition-all ${
                  language === 'uz' ? 'bg-emerald-500 text-[#0c1225] font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                UZ
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`py-1 text-[10px] font-extrabold rounded-md flex-1 transition-all ${
                  language === 'ru' ? 'bg-emerald-500 text-[#0c1225] font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`py-1 text-[10px] font-extrabold rounded-md flex-1 transition-all ${
                  language === 'en' ? 'bg-emerald-500 text-[#0c1225] font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => {
                const isDoc = currentUser?.type === 'doctor';
                const isCEO = currentUser?.type === 'director';
                const isAdmin = currentUser?.type === 'superadmin';
                alert(`Tizim Sozlamalari: ${language === 'uz' ? 'Sizning hisobingiz' : 'Ваш аккаунт'}: ${currentUser ? currentUser.name : 'Mehmon (Public)'}. Rol: ${isAdmin ? 'SaaS Admin' : isCEO ? 'CEO' : isDoc ? 'Shifokor' : 'Soddalashtirilgan Bemor Kabineti'}`);
              }}
              className="p-2.5 bg-[#070b15] hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-xl border border-[#1e3256]/40 hover:border-emerald-500/40 transition-all cursor-pointer"
              title="Hisob Sozlamalari"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* ---------------- MOBILE RESPONSIVE NAVIGATION TOP-BAR ---------------- */}
      <div className="w-full lg:hidden bg-[#0c1225] border-b border-[#1e3256]/60 px-4 py-3 flex items-center justify-between sticky top-0 z-40 select-none">
        
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#081225] border border-[#10b981]/50 text-emerald-400 flex items-center justify-center font-black shadow-[0_0_10px_rgba(16,185,129,0.3)] relative overflow-hidden shrink-0">
            <svg viewBox="0 0 100 65" className="w-7 h-5.5 drop-shadow-[0_0_4px_rgba(16,185,129,0.7)] z-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Left part: Beautiful contoured tooth */}
              <path d="M 32,15 C 24,15 17,18 13,23 C 9,28 9,37 11,44 C 13,51 11,61 15,65 C 18,67 21,58 26,51 C 28,48 30,48 32,51 C 37,58 40,67 43,65 C 47,61 45,51 47,44 C 49,37 49,28 45,23 C 41,18 34,15 32,15 Z" className="stroke-[#10b981]" strokeWidth="2.5" />
              {/* Right part: Interlocked D shape capital letter */}
              <path d="M 52,15 L 52,65" className="stroke-[#10b981]" strokeWidth="2.5" />
              <path d="M 52,15 C 68,15 82,24 82,40 C 82,56 68,65 52,65" className="stroke-[#10b981]" strokeWidth="2.5" />
              {/* Smooth connecting bridge */}
              <path d="M 44,40 C 47,37 49,37 52,40" className="stroke-[#10b981]" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-100 tracking-wider">DSTOMA QUEUE</h1>
            <p className="text-[9px] text-slate-500 font-semibold leading-none">v6.5 PWA</p>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#070b15] p-0.5 rounded-lg border border-[#1e3256]/40">
            <button onClick={() => setLanguage('uz')} className={`px-1.5 py-0.5 text-[9px] font-black rounded ${language === 'uz' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}>UZ</button>
            <button onClick={() => setLanguage('ru')} className={`px-1.5 py-0.5 text-[9px] font-black rounded ${language === 'ru' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'}`}>RU</button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold font-mono focus:outline-none border border-slate-700 hover:border-emerald-500"
          >
            {mobileMenuOpen ? (language === 'uz' ? 'YOPISH' : language === 'ru' ? 'ЗАКРЫТЬ' : 'CLOSE') : 'MENU ☰'}
          </button>
        </div>

        {/* Mobile Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-[58px] left-0 right-0 bg-[#0c1225] border-b border-[#1e3256] p-4 space-y-2 flex flex-col text-left animate-fade-in shadow-2xl">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
              {language === 'uz' ? 'Tizim bo\'limlari:' : language === 'ru' ? 'Разделы системы:' : 'System Sections:'}
            </span>
            
            <button
              onClick={() => { setActiveTab('bemor'); setMobileMenuOpen(false); }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-left flex items-center gap-2.5 ${activeTab === 'bemor' ? 'bg-emerald-500' : 'text-slate-250'}`}
            >
              <User className="w-4 h-4" /> {t('bemorTab')}
            </button>
            <button
              onClick={() => { setActiveTab('shifokor'); setMobileMenuOpen(false); }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-left flex items-center gap-2.5 ${activeTab === 'shifokor' ? 'bg-emerald-500' : 'text-slate-250'}`}
            >
              <Users className="w-4 h-4" /> {t('shifokorTab')}
            </button>
            <button
              onClick={() => { setActiveTab('boshliq'); setMobileMenuOpen(false); }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-left flex items-center gap-2.5 ${activeTab === 'boshliq' ? 'bg-emerald-500' : 'text-slate-250'}`}
            >
              <FolderKanban className="w-4 h-4" /> {t('boshliqTab')}
            </button>
            <button
              onClick={() => { setActiveTab('superadmin'); setMobileMenuOpen(false); }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-left flex items-center gap-2.5 ${activeTab === 'superadmin' ? 'bg-emerald-500 text-slate-950' : 'text-slate-250'}`}
            >
              <Crown className="w-4 h-4" /> {t('superadminTab')}
            </button>
          </div>
        )}
      </div>

      {/* ---------------- MAIN RIGHT WORKSPACE: CONTENT SCROLL AREA ---------------- */}
      <div className="flex-1 min-h-screen flex flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 mt-4 lg:mt-6 space-y-6">
        
        {/* Header telemetry HUD segment */}
        <header className="flex flex-col md:flex-row md:items-center justify-between py-2 border-b border-[#1b2a47]/50 gap-4 select-none">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-400/25 text-[8.5px] font-black rounded font-mono uppercase tracking-wider">
                Electronic Queue Suite
              </span>
              <span className="text-[10px] text-slate-500 font-bold">• Real-Time multi-tenant platform</span>
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight mt-1 font-display">
              {activeTab === 'bemor' 
                ? (language === 'uz' ? 'Bemor Kabineti & Monitor' : language === 'ru' ? 'Кабинет Пациента и Монитор' : 'Patient Hub & Monitor') 
                : activeTab === 'shifokor' 
                ? (language === 'uz' ? 'Stomatologiya Shifokor Terminali' : language === 'ru' ? 'Терминал Врача Стоматолога' : 'Dental Doctor Room Console') 
                : activeTab === 'boshliq' 
                ? (language === 'uz' ? 'Klinika Direktor Telemetriyasi' : language === 'ru' ? 'Панель Директора Клиники' : 'Clinic Director Telemetry') 
                : (language === 'uz' ? 'DStoma SaaS Superadmin Konsoli' : language === 'ru' ? 'Консоль Суперадмина SaaS DStoma' : 'DStoma SaaS Superadmin Headquarters')}
            </h2>
            <p className="text-xs text-slate-450 font-semibold">
              {activeTab === 'bemor' 
                ? (language === 'uz' ? 'Onlayn smart navbat olish, tibbiy tish diagnostika tahlillari va filial monitoring' : language === 'ru' ? 'Онлайн-запись, стоматологическая диагностика и мониторинг филиалов' : 'Online smart booking, dental analytics and clinical branches monitoring') 
                : activeTab === 'shifokor'
                ? (language === 'uz' ? 'Klinikaga kelgan navbatdagi bemorlarni chaqirish, konsultatsiyalar o\'tkazish, elektron tibbiy kartalar va kassa oqimi' : language === 'ru' ? 'Вызов пациентов, проведение лечения, электронные медицинские карты и учет кассы' : 'Call patients, carry out treatments, maintain electronic health records and track cash flow')
                : activeTab === 'boshliq'
                ? (language === 'uz' ? 'Sizga biriktirilgan klinika tarmog\'ini analitika, xizmat tahrirlari va litsenziyalar orqali nazorat qiling' : language === 'ru' ? 'Контроль закрепленной филиальной сети, редактирование медицинских услуг и оплата лицензии' : 'Control assigned dental clinics through analytics tools, pricing configurations, and subscription status')
                : (language === 'uz' ? 'Multi-tenant barcha filiallar holati, litsenziyalar, MRR va xodimlar login/parollarini nazorat qilish markazi' : language === 'ru' ? 'Глобальный контроль статуса филиалов, лицензий, MRR и управление логинами/паролями персонала' : 'Global multi-tenant controller of clinical branches, license status, CRM accounts registry, and monthly recurring analytics')}
            </p>
          </div>

          {/* Quick User session profile pill exactly matching top right area */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            {currentUser ? (
              <div className="flex items-center gap-2.5 bg-[#0e162d]/90 border border-emerald-500/30 text-emerald-450 px-3 py-1.5 rounded-2xl text-xs font-black shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{currentUser.name} ({currentUser.type === 'superadmin' ? 'Super_Admin' : currentUser.type === 'director' ? 'Clinic_CEO' : 'Dentist'})</span>
                <button
                  onClick={handleLogout}
                  className="bg-slate-900 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer uppercase tracking-wider"
                >
                  chiqish
                </button>
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-[#233355]/40 text-slate-400 px-3 py-1.5 rounded-2xl text-[10px] font-extrabold uppercase letter-spacing flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                🔓 Public Viewer (Mehmon)
              </div>
            )}
          </div>
        </header>

        {/* Master Content Workspace Panel with Staggered Visual Entry */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Show Map permanently inside Customer and Superadmin dashboards for continuous usability */}
            {(activeTab === 'bemor' || activeTab === 'superadmin') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#1b2a47]/30 pb-1.5">
                  <span className="text-[10px] font-black text-slate-400 block uppercase tracking-widest pl-1">
                    📍 INTERAKTIV FILIALLAR MONITORI VA XARITASI (VECTORS + GOOGLE MAPS)
                  </span>
                  {selectedClinic && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                      Faol filial: {selectedClinic.name}
                    </span>
                  )}
                </div>
                <ClinicMap
                  clinics={clinics}
                  selectedClinic={selectedClinic}
                  onSelectClinic={(c) => setSelectedClinic(c)}
                  language={language}
                />
              </div>
            )}

            {/* Sub Tabs views */}
            {(() => {
              const isGated = activeTab === 'shifokor' || activeTab === 'boshliq' || activeTab === 'superadmin';
              const hasAccess = currentUser && (
                (activeTab === 'superadmin' && currentUser.type === 'superadmin') ||
                (activeTab === 'boshliq' && currentUser.type === 'director') ||
                (activeTab === 'shifokor' && currentUser.type === 'doctor')
              );

              if (isGated && !hasAccess) {
                // Show gorgeous Login form
                return (
                  <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] space-y-6 mt-8 relative overflow-hidden text-left animate-fade-in">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="text-center space-y-2.5">
                      <div className="w-14 h-14 bg-indigo-50/70 text-indigo-650 rounded-2xl mx-auto flex items-center justify-center text-xl shadow-xs border border-indigo-100/50">
                        🔒
                      </div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest font-display">
                        {activeTab === 'superadmin' ? t('loginTitleAdmin') : activeTab === 'boshliq' ? t('loginTitleDirector') : t('loginTitleDoctor')}
                      </h3>
                      <p className="text-[11px] text-slate-450 font-semibold max-w-[280px] mx-auto">
                        {t('loginDesc')}
                      </p>
                    </div>

                    {authError && (
                      <div className="p-3 bg-rose-50 border border-rose-100/70 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                        <span className="shrink-0 text-base">⚠️</span>
                        <span>{authError}</span>
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-700 block mb-1.5 uppercase tracking-wide">
                          {t('customLogin')}
                        </label>
                        <input
                          type="text"
                          required
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          placeholder="Foydalanuvchi nomi..."
                          className="w-full bg-slate-50/70 text-xs font-bold font-mono text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none placeholder:text-slate-400 placeholder:font-sans transition-all"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-black text-slate-700 block uppercase tracking-wide">
                            {t('customPass')}
                          </label>
                        </div>
                        <input
                          type="text"
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Parolni yozing..."
                          className="w-full bg-slate-50/70 text-xs font-mono text-slate-800 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 focus:outline-none transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-850 hover:to-indigo-900 text-white rounded-xl text-xs font-black transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                      >
                        {t('signInBtn')} ➔
                      </button>
                    </form>
                  </div>
                );
              }

              // Else show appropriate dashboard
              return (
                <>
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
                      setActiveTab={setActiveTab}
                      language={language}
                    />
                  )}

                  {activeTab === 'shifokor' && currentUser && currentUser.type === 'doctor' && (
                    <DoctorDashboard
                      clinics={clinics}
                      doctors={doctors}
                      services={services}
                      queues={queues}
                      onUpdateQueueStatus={handleUpdateQueueStatus}
                      selectedClinic={clinics.find(c => c.id === currentUser.clinicId) || selectedClinic}
                      setActiveTab={setActiveTab}
                      currentUser={currentUser}
                      language={language}
                    />
                  )}

                  {activeTab === 'boshliq' && currentUser && currentUser.type === 'director' && (
                    <DirectorDashboard
                      clinics={clinics}
                      doctors={doctors}
                      services={services}
                      queues={queues}
                      setActiveTab={setActiveTab}
                      onAddDoctor={handleAddDoctor}
                      onDeleteDoctor={handleDeleteDoctor}
                      onUpdateService={handleUpdateService}
                      onAddService={handleAddService}
                      clinicId={currentUser.clinicId}
                      onSimulatePayment={handlePaySubscriptionSimulate}
                      saasPayments={saasPayments}
                      language={language}
                    />
                  )}

                  {activeTab === 'superadmin' && currentUser && currentUser.type === 'superadmin' && (
                    <SuperAdminDashboard
                      clinics={clinics}
                      doctors={doctors}
                      queues={queues}
                      onAddClinic={handleAddClinic}
                      onToggleSubscription={handleToggleClinicStatus}
                      onUpdateClinicCreds={handleUpdateClinicCreds}
                      onUpdateDoctorCreds={handleUpdateDoctorCreds}
                      onDeleteClinic={handleDeleteClinic}
                      onDeleteDoctor={handleDeleteDoctor}
                      language={language}
                      saasPayments={saasPayments}
                      onApproveSaaSPayment={handleApproveSaaSPayment}
                      onUpdateClinicDetails={handleUpdateClinicDetails}
                      superadminLogin={superadminLogin}
                      superadminPassword={superadminPassword}
                      onUpdateSuperadminCreds={handleUpdateSuperadminCreds}
                      gmailInboxes={gmailInboxes}
                      onMockSendPayment={(clinicId) => handlePaySubscriptionSimulate(clinicId)}
                    />
                  )}
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
