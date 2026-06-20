import React, { useState, useEffect, useRef } from 'react';
import { Clinic, Doctor, Service, QueueItem, SaaSPayment } from '../types';
import { INITIAL_CLINICS, INITIAL_DOCTORS, INITIAL_SERVICES, INITIAL_QUEUES } from '../data';
import { TRANSLATIONS, Language } from '../translations';
import { sendQueueCreatedNotification, sendQueueStatusNotification } from '../services/telegram';
import { DjangoAPI } from '../services/api';

export function useAppState() {
  // Master States
  const [clinics, setClinics] = useState<Clinic[]>(INITIAL_CLINICS);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [queues, setQueues] = useState<QueueItem[]>(INITIAL_QUEUES);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'bemor' | 'shifokor' | 'boshliq' | 'superadmin'>('bemor');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(INITIAL_CLINICS[0] || null); // Pre-selected first clinic by default so dental model is loaded immediately
  const selectedClinicRef = useRef<Clinic | null>(selectedClinic);

  useEffect(() => {
    selectedClinicRef.current = selectedClinic;
  }, [selectedClinic]);

  // 3-Language and Auth states
  const [language, setLanguage] = useState<Language>('uz');
  const [currentUser, setCurrentUser] = useState<{
    type: 'superadmin' | 'director' | 'doctor';
    id?: string;
    clinicId?: string;
    name?: string;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('dstoma_user_session');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  // Login Form input fields
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Stateful Superadmin credentials - password is no longer saved to LocalStorage for safety
  const [superadminLogin, setSuperadminLogin] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dstoma_sa_login');
      if (saved) return saved;
    }
    return '';
  });
  const [superadminPassword, setSuperadminPassword] = useState('');

  // Simulated email inbox
  const [gmailInboxes, setGmailInboxes] = useState<Array<{
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    time: string;
    read: boolean;
  }>>([]);

  // Stateful SaaS Payments
  const [saasPayments, setSaasPayments] = useState<SaaSPayment[]>([]);

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

  // Credential updaters
  const handleUpdateClinicCreds = async (clinicId: string, login: string, pass: string) => {
    setClinics(prev => prev.map(c => {
      if (c.id === clinicId) {
        const updated = { ...c, login, password: pass };
        fetch('/api/clinics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(console.warn);
        return updated;
      }
      return c;
    }));
  };

  const handleUpdateDoctorCreds = async (doctorId: string, login: string, pass: string) => {
    setDoctors(prev => prev.map(d => {
      if (d.id === doctorId) {
        const updated = { ...d, login, password: pass };
        fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(console.warn);
        return updated;
      }
      return d;
    }));
  };

  const handleUpdateDoctorDetails = async (doctorId: string, updates: Partial<Doctor>) => {
    setDoctors(prev => prev.map(d => {
      if (d.id === doctorId) {
        const updated = { ...d, ...updates };
        fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(console.warn);
        return updated;
      }
      return d;
    }));
  };

  const handleDeleteClinic = async (clinicId: string) => {
    setClinics(prev => prev.filter(c => c.id !== clinicId));
    setDoctors(prev => prev.filter(d => d.clinicId !== clinicId));
    setQueues(prev => prev.filter(q => q.clinicId !== clinicId));
    if (selectedClinic?.id === clinicId) {
      setSelectedClinic(null);
    }
    try {
      await fetch(`/api/clinics/${clinicId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    setDoctors(prev => prev.filter(d => d.id !== doctorId));
    setQueues(prev => prev.filter(q => q.doctorId !== doctorId));
    try {
      await fetch(`/api/doctors/${doctorId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const userLower = authUsername.trim();
    const passLower = authPassword.trim();

    // 1. Superadmin check (case-insensitive for login) via server API /api/admin-login
    try {
      const adminLoginRes = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userLower, password: passLower })
      });
      if (adminLoginRes.ok) {
        const session = {
          type: 'superadmin' as const,
          name: t('clinicOwner')
        };
        setCurrentUser(session);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
          localStorage.setItem('dstoma_sa_login', userLower);
        }
        setAuthUsername('');
        setAuthPassword('');
        return;
      }
    } catch (err) {
      console.warn("Backend auth failed, falling back to client-side logic:", err);
    }

    // Direct client fallback
    if (userLower.toLowerCase() === superadminLogin.toLowerCase() && passLower === superadminPassword) {
      const session = {
        type: 'superadmin' as const,
        name: t('clinicOwner')
      };
      setCurrentUser(session);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
        localStorage.setItem('dstoma_sa_login', userLower);
      }
      setAuthUsername('');
      setAuthPassword('');
      return;
    }

    // 2. Director checks
    const matchedClinic = clinics.find(c => c && c.login && c.login.toLowerCase() === userLower.toLowerCase() && c.password === passLower);
    if (matchedClinic) {
      const session = {
        type: 'director' as const,
        clinicId: matchedClinic.id,
        name: matchedClinic.ownerName || matchedClinic.name
      };
      setCurrentUser(session);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
      }
      setSelectedClinic(matchedClinic);
      setAuthUsername('');
      setAuthPassword('');
      return;
    }

    // 3. Doctor checks
    const matchedDoctor = doctors.find(d => d && d.login && d.login.toLowerCase() === userLower.toLowerCase() && d.password === passLower);
    if (matchedDoctor) {
      const session = {
        type: 'doctor' as const,
        id: matchedDoctor.id,
        clinicId: matchedDoctor.clinicId,
        name: matchedDoctor.name
      };
      setCurrentUser(session);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
      }
      setAuthUsername('');
      setAuthPassword('');
      return;
    }

    setAuthError(t('credIncorrect'));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
    setActiveTab('bemor');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dstoma_user_session');
    }
  };

  // Sync state and route properties
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const clinicParam = params.get('clinic');

    if (tabParam && ['bemor', 'shifokor', 'boshliq', 'superadmin'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }

    const syncTelegramConfig = async () => {
      try {
        const response = await fetch('/api/telegram-config');
        if (response.ok) {
          const data = await response.json();
          if (data && data.token) {
            localStorage.setItem('dstoma_telegram_token', data.token);
          }
        }
      } catch (err) {
        console.warn("[AppState Hook] Server offline, using fallback configs.", err);
      }
    };
    syncTelegramConfig();
  }, []);

  // Set up continuous client-side sync of clinics, doctors, and services from express server
  useEffect(() => {
    let active = true;
    let isInitialLoad = true;
    const loadServerData = async () => {
      try {
        const clRes = await fetch('/api/clinics');
        if (clRes.ok) {
          const clList = await clRes.json();
          if (active) {
            setClinics(prev => JSON.stringify(prev) === JSON.stringify(clList) ? prev : clList);
            const params = new URLSearchParams(window.location.search);
            const clinicParam = params.get('clinic');
            
            // Only auto-select from URL once, or don't aggressively force the first clinic when user closed it
            if (isInitialLoad && clinicParam && !selectedClinicRef.current) {
              const found = clList.find((c: any) => c.id === clinicParam || c.subdomain === clinicParam);
              if (found) setSelectedClinic(found);
            }
          }
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading clinics from server:", err);
      }

      try {
        const docRes = await fetch('/api/doctors');
        if (docRes.ok) {
          const docList = await docRes.json();
          if (active) setDoctors(prev => JSON.stringify(prev) === JSON.stringify(docList) ? prev : docList);
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading doctors from server:", err);
      }

      try {
        const srvRes = await fetch('/api/services');
        if (srvRes.ok) {
          const srvList = await srvRes.json();
          if (active) setServices(prev => JSON.stringify(prev) === JSON.stringify(srvList) ? prev : srvList);
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading services from server:", err);
      }

      try {
        const qRes = await fetch('/api/queues');
        if (qRes.ok) {
          const qList = await qRes.json();
          if (active) setQueues(prev => JSON.stringify(prev) === JSON.stringify(qList) ? prev : qList);
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading queues from server:", err);
      }
      isInitialLoad = false;
    };
    loadServerData();
    const clInt = setInterval(loadServerData, 4000);
    return () => {
      active = false;
      clearInterval(clInt);
    };
  }, []);

  // Update URL metadata
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
    }

    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', activeTab);
    if (selectedClinic) {
      newUrl.searchParams.set('clinic', selectedClinic.id);
    } else {
      newUrl.searchParams.delete('clinic');
    }
    window.history.replaceState({}, '', newUrl.toString());
  }, [activeTab, selectedClinic]);

  // Sync queues
  useEffect(() => {
    let active = true;
    const fetchQueues = async () => {
      try {
        const data = await DjangoAPI.getQueues();
        if (active && data && data.length > 0) {
          setQueues(data);
        }
      } catch (err) {
        console.warn("[AppState Hook DB Poll] Central server offline:", err);
      }
    };

    fetchQueues();
    const interval = setInterval(fetchQueues, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleAddQueue = async (newQueue: QueueItem) => {
    setQueues(prev => [...prev, newQueue]);
    
    setClinics(prev => prev.map(c => {
      if (c.id === newQueue.clinicId) {
        return { ...c, activePatients: c.activePatients + 1 };
      }
      return c;
    }));

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
      setQueues(prev => prev.map(q => q.id === newQueue.id ? saved : q));
    } catch (err) {
      console.warn("[AppState Hook] Backend sync failed, using offline state", err);
    }

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
          console.log(`Telegram notification sent for ticket #${newQueue.number}`);
        }
      });
    }
  };

  const handleCancelQueue = async (id: string) => {
    setQueues(prev => prev.map(q => q.id === id ? { ...q, status: 'cancelled' } : q));

    try {
      await DjangoAPI.updateQueueStatus(id, 'cancelled');
    } catch (err) {
      console.warn("[AppState Hook] Cancellation sync failed", err);
    }

    const item = queues.find(q => q.id === id);
    if (item) {
      setClinics(prev => prev.map(c => {
        if (c.id === item.clinicId && c.activePatients > 0) {
          return { ...c, activePatients: c.activePatients - 1 };
        }
        return c;
      }));

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
    setQueues(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));

    try {
      await DjangoAPI.updateQueueStatus(id, newStatus);
    } catch (err) {
      console.warn("[AppState Hook] Status mutation sync failed", err);
    }

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
    setQueues(prev => prev.map(q => q.id === id ? { ...q, rating } : q));

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
    setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, subscriptionStatus: status, nextPaymentDate: nextDueDate } : c));
  };

  const handleToggleClinicStatus = async (clinicId: string) => {
    const targetClinic = clinics.find(c => c.id === clinicId);
    if (!targetClinic) return;
    const current = targetClinic.subscriptionStatus || 'active';
    const nextStatus: 'active' | 'suspended' | 'trial' = current === 'suspended' ? 'active' : 'suspended';

    setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, subscriptionStatus: nextStatus } : c));
  };

  const handleUpdateClinicDetails = async (updatedClinic: Clinic) => {
    setClinics(prev => prev.map(c => c.id === updatedClinic.id ? updatedClinic : c));
    try {
      await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClinic)
      });
    } catch (e) {
      console.warn(e);
    }
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
    const targetPay = saasPayments.find(p => p.id === paymentId);
    if (!targetPay) return;

    setSaasPayments(prev => prev.map(p => p.id === paymentId ? {
      ...p,
      status: 'confirmed',
      paymentDate: new Date().toISOString().split('T')[0]
    } : p));

    setClinics(prev => prev.map(c => {
      if (c.id === targetPay.clinicId) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        const updated = {
          ...c,
          subscriptionStatus: 'active' as const,
          nextPaymentDate: nextDate.toISOString().split('T')[0]
        };
        fetch('/api/clinics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(console.warn);
        return updated;
      }
      return c;
    }));
  };

  const handleUpdateSuperadminCreds = async (newLogin: string, newPass: string) => {
    setSuperadminLogin(newLogin);
    setSuperadminPassword(newPass);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dstoma_sa_login', newLogin);
    }
    
    try {
      await fetch('/api/admin-update-creds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newLogin, newPassword: newPass })
      });
    } catch (err) {
      console.warn("Could not sync superadmin credentials with backend", err);
    }

    triggerGmailNotification(
      "🔑 DStoma Superadmin akkaunt ma'lumotlari muvaffaqiyatli o'zgartirildi",
      `Hurmatli DStoma tarmog'i egasi,\n\nTizim xavfsizligi bo'limidan xabar: Sizning Superadmin boshqaruv paneliga kirish parametrlaringiz muvaffaqiyatli yangilandi!\n\nYangi Login ma'lumotlari:\n- Yangi Login: ${newLogin}\n- Yangi Parol: ${newPass}\n\nUshbu xat egamovumidjon18@gmail.com elektron pochtangizga avtomatik tarzda xavfsizlik protokoli doirasida yuborildi. Iltimos, hisob ma'lumotlarini begonalarga aslo oshkor qilmang.\n\nHurmat bilan, DStoma SaaS Security Team.`
    );
  };

  const handleAddClinic = async (newClinic: Clinic) => {
    setClinics(prev => [...prev, newClinic]);
    if (!selectedClinic) {
      setSelectedClinic(newClinic);
    }
    try {
      await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClinic)
      });
    } catch (e) {
      console.warn(e);
    }
    
    const trialInvoice: SaaSPayment = {
      id: 'pay_trial_' + Math.random().toString(36).substr(2, 9),
      clinicId: newClinic.id,
      clinicName: newClinic.name,
      amount: 0,
      dueDate: newClinic.nextPaymentDate || new Date().toISOString().split('T')[0],
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'confirmed'
    };
    setSaasPayments(prev => [trialInvoice, ...prev]);
  };

  const handleAddDoctor = async (newDoc: Doctor) => {
    setDoctors(prev => [...prev, newDoc]);
    try {
      await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleUpdateService = async (updatedSrv: Service) => {
    setServices(prev => prev.map(s => s.id === updatedSrv.id ? updatedSrv : s));
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSrv)
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddService = async (newSrv: Service) => {
    setServices(prev => [...prev, newSrv]);
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSrv)
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
    try {
      await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return {
    clinics,
    doctors,
    services,
    queues,
    activeTab,
    setActiveTab,
    selectedClinic,
    setSelectedClinic,
    language,
    setLanguage,
    currentUser,
    setCurrentUser,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authError,
    superadminLogin,
    superadminPassword,
    gmailInboxes,
    saasPayments,
    mobileMenuOpen,
    setMobileMenuOpen,
    t,
    handleUpdateClinicCreds,
    handleUpdateDoctorCreds,
    handleUpdateDoctorDetails,
    handleDeleteClinic,
    handleDeleteDoctor,
    handleLoginSubmit,
    handleLogout,
    handleAddQueue,
    handleCancelQueue,
    handleUpdateQueueStatus,
    handleUpdateDoctorRating,
    handleUpdateClinicSubscription,
    handleToggleClinicStatus,
    handleUpdateClinicDetails,
    handlePaySubscriptionSimulate,
    handleApproveSaaSPayment,
    handleUpdateSuperadminCreds,
    handleAddClinic,
    handleAddDoctor,
    handleUpdateService,
    handleAddService,
    handleDeleteService
  };
}
