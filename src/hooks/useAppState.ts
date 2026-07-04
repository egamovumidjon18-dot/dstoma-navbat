import React, { useState, useEffect, useRef } from 'react';
import { Clinic, Doctor, Service, QueueItem, SaaSPayment, DoctorClinicLink } from '../types';
import { TRANSLATIONS, Language } from '../translations';

export function useAppState() {
  // Master States
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorClinicLinks, setDoctorClinicLinks] = useState<DoctorClinicLink[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<'bemor' | 'shifokor' | 'boshliq' | 'superadmin'>('bemor');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const selectedClinicRef = useRef<Clinic | null>(selectedClinic);

  // Which clinic a multi-clinic doctor is currently operating in, independent of the
  // public-facing `selectedClinic` (that one drives the Bemor Kabineti tab). Doctors
  // with 0 or 1 active links just use their home `clinicId`, unaffected by this.
  const [activeDoctorClinicId, setActiveDoctorClinicId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('dstoma_user_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.type === 'doctor' && parsed?.clinicId) return parsed.clinicId;
        } catch (e) { /* ignore */ }
      }
    }
    return null;
  });

  const userLocationRef = useRef<{ lat: number, lng: number, status: 'idle' | 'detecting' | 'active' | 'denied', initialized: boolean }>({
    lat: 39.6542,
    lng: 66.9597,
    status: 'detecting',
    initialized: false
  });
  
  const isSyncingRef = useRef(false);

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

  // Set while a superadmin is impersonating a Director/Doctor panel (see
  // handleAdminImpersonate) — remembers the original superadmin identity so
  // handleReturnToSuperAdmin can restore it without re-login.
  const [impersonatorSession, setImpersonatorSession] = useState<{ currentUser: any; superadminToken: string | null } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('dstoma_impersonator_session');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return null; }
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

  // Session token issued by /api/admin-login, required (as a Bearer header) by every
  // superadmin-exclusive backend endpoint. Kept in sessionStorage only — never persisted
  // to localStorage or sent anywhere except those endpoints.
  const [superadminToken, setSuperadminToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dstoma_sa_token');
    }
    return null;
  });
  const setSuperadminTokenPersisted = (token: string | null) => {
    setSuperadminToken(token);
    if (typeof window !== 'undefined') {
      if (token) sessionStorage.setItem('dstoma_sa_token', token);
      else sessionStorage.removeItem('dstoma_sa_token');
    }
  };
  const superAdminAuthHeaders = (): Record<string, string> =>
    superadminToken ? { Authorization: `Bearer ${superadminToken}` } : {};

  // Session token issued by /api/director-login, /api/doctor-login, or
  // /api/admin-impersonate — required by every clinic-staff-only write endpoint
  // (add/remove doctor, delete patient, manage services, queue status changes).
  const [staffToken, setStaffToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dstoma_staff_token');
    }
    return null;
  });
  const setStaffTokenPersisted = (token: string | null) => {
    setStaffToken(token);
    if (typeof window !== 'undefined') {
      if (token) sessionStorage.setItem('dstoma_staff_token', token);
      else sessionStorage.removeItem('dstoma_staff_token');
    }
  };
  const staffAuthHeaders = (): Record<string, string> =>
    staffToken ? { Authorization: `Bearer ${staffToken}` } : {};

  // Stateful SaaS Payments
  const [saasPayments, setSaasPayments] = useState<SaaSPayment[]>([]);

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
          headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
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
          headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
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
          headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
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
      await fetch(`/api/clinics/${clinicId}`, { method: 'DELETE', headers: superAdminAuthHeaders() });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    setDoctors(prev => prev.filter(d => d.id !== doctorId));
    setQueues(prev => prev.filter(q => q.doctorId !== doctorId));
    try {
      await fetch(`/api/doctors/${doctorId}`, { method: 'DELETE', headers: { ...superAdminAuthHeaders(), ...staffAuthHeaders() } });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    try {
      await fetch(`/api/patients/${patientId}`, { method: 'DELETE', headers: { ...superAdminAuthHeaders(), ...staffAuthHeaders() } });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const userLower = authUsername.trim();
    const passLower = authPassword.trim();

    // All three role checks are verified server-side — the client never holds a full
    // list of plaintext passwords to compare against locally.
    try {
      // 1. Superadmin
      const adminLoginRes = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userLower, password: passLower })
      });
      if (adminLoginRes.ok) {
        const data = await adminLoginRes.json();
        const session = { type: 'superadmin' as const, name: t('clinicOwner') };
        setCurrentUser(session);
        setSuperadminTokenPersisted(data.token || null);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
          localStorage.setItem('dstoma_sa_login', userLower);
        }
        setAuthUsername('');
        setAuthPassword('');
        return;
      }

      // 2. Director (clinic owner)
      const directorLoginRes = await fetch('/api/director-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userLower, password: passLower })
      });
      if (directorLoginRes.ok) {
        const data = await directorLoginRes.json();
        const matchedClinic = data.clinic;
        const session = {
          type: 'director' as const,
          clinicId: matchedClinic.id,
          name: matchedClinic.ownerName || matchedClinic.name
        };
        setCurrentUser(session);
        setStaffTokenPersisted(data.token || null);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
        }
        setSelectedClinic(matchedClinic);
        setAuthUsername('');
        setAuthPassword('');
        return;
      }

      // 3. Doctor
      const doctorLoginRes = await fetch('/api/doctor-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userLower, password: passLower })
      });
      if (doctorLoginRes.ok) {
        const data = await doctorLoginRes.json();
        const matchedDoctor = data.doctor;
        const session = {
          type: 'doctor' as const,
          id: matchedDoctor.id,
          clinicId: matchedDoctor.clinicId,
          name: matchedDoctor.name
        };
        setCurrentUser(session);
        setStaffTokenPersisted(data.token || null);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
        }
        setActiveDoctorClinicId(matchedDoctor.clinicId);
        setAuthUsername('');
        setAuthPassword('');
        return;
      }
    } catch (err) {
      console.warn("Login request failed:", err);
      setAuthError(t('credIncorrect'));
      return;
    }

    setAuthError(t('credIncorrect'));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
    setActiveTab('bemor');
    setActiveDoctorClinicId(null);
    setSuperadminTokenPersisted(null);
    setStaffTokenPersisted(null);
    setImpersonatorSession(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dstoma_user_session');
      sessionStorage.removeItem('dstoma_impersonator_session');
    }
  };

  // Lets a logged-in superadmin open any Director or Doctor panel without needing
  // that account's own password — their existing superadmin token is the proof of
  // identity. The original superadmin session is remembered so they can return to it.
  const handleAdminImpersonate = async (role: 'director' | 'doctor', id: string) => {
    if (!superadminToken || !currentUser || currentUser.type !== 'superadmin') return;
    try {
      const res = await fetch('/api/admin-impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superadminToken}` },
        body: JSON.stringify({ role, id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Kirish muvaffaqiyatsiz tugadi");
      }

      const snapshot = currentUser;
      setImpersonatorSession(snapshot);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dstoma_impersonator_session', JSON.stringify(snapshot));
      }

      setStaffTokenPersisted(data.token || null);

      if (role === 'director') {
        const clinic = data.clinic;
        const session = { type: 'director' as const, clinicId: clinic.id, name: clinic.ownerName || clinic.name };
        setCurrentUser(session);
        setSelectedClinic(clinic);
        setActiveTab('boshliq');
        if (typeof window !== 'undefined') sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
      } else {
        const doctor = data.doctor;
        const session = { type: 'doctor' as const, id: doctor.id, clinicId: doctor.clinicId, name: doctor.name };
        setCurrentUser(session);
        setActiveDoctorClinicId(doctor.clinicId);
        setActiveTab('shifokor');
        if (typeof window !== 'undefined') sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
      }
    } catch (err: any) {
      setAuthError(err.message);
      if (typeof window !== 'undefined') window.alert(`Kirishda xatolik: ${err.message}`);
    }
  };

  const handleReturnToSuperAdmin = () => {
    if (!impersonatorSession) return;
    setCurrentUser(impersonatorSession);
    setActiveTab('superadmin');
    setImpersonatorSession(null);
    setStaffTokenPersisted(null);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dstoma_user_session', JSON.stringify(impersonatorSession));
      sessionStorage.removeItem('dstoma_impersonator_session');
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
    // Bot tokens are never fetched into the browser — all Telegram sending happens
    // server-side (see server.ts sendBgTelegramMessage / /api/telegram/bulk-message).
  }, []);

  const [isAppLoading, setIsAppLoading] = useState(true);

  // Set up continuous client-side sync of clinics, doctors, and services from express server
  useEffect(() => {
    let active = true;
    let isInitialLoad = true;
    const loadServerData = async () => {
      try {
        const clRes = await fetch('/api/clinics');
        if (clRes.ok) {
          const clList = await clRes.json();
          clList.sort((a, b) => a.id.localeCompare(b.id));

          if (active && !isSyncingRef.current) {
            setClinics(prev => {
              const prevSorted = [...prev].sort((a, b) => a.id.localeCompare(b.id));
              return JSON.stringify(prevSorted) === JSON.stringify(clList) ? prev : clList;
            });
            
            const params = new URLSearchParams(window.location.search);
            const clinicParam = params.get('clinic');
            
            // Only auto-select from URL once, or default to the first clinic
            if (isInitialLoad && !selectedClinicRef.current) {
              let found = null;
              if (clinicParam) {
                found = clList.find((c: any) => c.id === clinicParam || c.subdomain === clinicParam);
              }
              if (!found && clList.length > 0) {
                found = clList[0];
              }
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
          docList.sort((a, b) => a.name.localeCompare(b.name));
          if (active && !isSyncingRef.current) {
            setDoctors(prev => {
              const prevSorted = [...prev].sort((a, b) => a.name.localeCompare(b.name));
              return JSON.stringify(prevSorted) === JSON.stringify(docList) ? prev : docList;
            });
          }
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading doctors from server:", err);
      }

      try {
        const srvRes = await fetch('/api/services');
        if (srvRes.ok) {
          const srvList = await srvRes.json();
          srvList.sort((a, b) => a.name.localeCompare(b.name));
          if (active && !isSyncingRef.current) {
            setServices(prev => {
              const prevSorted = [...prev].sort((a, b) => a.name.localeCompare(b.name));
              return JSON.stringify(prevSorted) === JSON.stringify(srvList) ? prev : srvList;
            });
          }
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading services from server:", err);
      }

      try {
        const qRes = await fetch('/api/queues');
        if (qRes.ok) {
          const qList = await qRes.json();
          // Sort to ensure stable JSON serialization and prevent UI jumping
          qList.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
          
          if (active && !isSyncingRef.current) {
            setQueues(prev => {
              const prevSorted = [...prev].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
              return JSON.stringify(prevSorted) === JSON.stringify(qList) ? prev : qList;
            });
          }
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading queues from server:", err);
      }
      try {
        const patRes = await fetch('/api/patients');
        if (patRes.ok) {
          const patList = await patRes.json();
          patList.sort((a: any, b: any) => a.id.localeCompare(b.id));
          if (active && !isSyncingRef.current) {
            setPatients(prev => {
              const prevSorted = [...prev].sort((a, b) => a.id.localeCompare(b.id));
              return JSON.stringify(prevSorted) === JSON.stringify(patList) ? prev : patList;
            });
          }
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading patients from server:", err);
      }

      try {
        const linkRes = await fetch('/api/doctor-clinic-links');
        if (linkRes.ok) {
          const linkList = await linkRes.json();
          linkList.sort((a: any, b: any) => a.id.localeCompare(b.id));
          if (active && !isSyncingRef.current) {
            setDoctorClinicLinks(prev => {
              const prevSorted = [...prev].sort((a, b) => a.id.localeCompare(b.id));
              return JSON.stringify(prevSorted) === JSON.stringify(linkList) ? prev : linkList;
            });
          }
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading doctor-clinic links from server:", err);
      }

      try {
        const pRes = await fetch('/api/payments');
        if (pRes.ok) {
          const pList = await pRes.json();
          pList.sort((a: any, b: any) => new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime());
          if (active && !isSyncingRef.current) {
            setSaasPayments(prev => {
              const prevSorted = [...prev].sort((a, b) => new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime());
              return JSON.stringify(prevSorted) === JSON.stringify(pList) ? prev : pList;
            });
          }
        }
      } catch (err) {
        console.warn("[AppState Hook] Error loading payments from server:", err);
      }

      isInitialLoad = false;
      if (active) setIsAppLoading(false);
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

  // Sync queues removed in favor of loadServerData sync


  const handleAddQueue = async (newQueue: QueueItem) => {
    isSyncingRef.current = true;
    setQueues(prev => [...prev, newQueue]);
    
    setClinics(prev => prev.map(c => {
      if (c.id === newQueue.clinicId) {
        return { ...c, activePatients: c.activePatients + 1 };
      }
      return c;
    }));

    try {
      const res = await fetch('/api/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newQueue.id,
          clinicId: newQueue.clinicId,
          doctorId: newQueue.doctorId,
          serviceId: newQueue.serviceId,
          patientName: newQueue.patientName,
          patientPhone: newQueue.patientPhone,
          hasInfection: newQueue.hasInfection,
          medicalNotes: newQueue.medicalNotes,
          passportSerial: newQueue.passportSerial,
          telegramChatId: newQueue.telegramChatId
        })
      });
      if (res.ok) {
        const saved = await res.json();
        const mapped = {
          id: saved.id || Math.random().toString(36).substr(2, 9),
          clinicId: saved.clinicId || saved.clinic_id || '',
          doctorId: saved.doctorId || saved.doctor_id || '',
          serviceId: saved.serviceId || saved.service_id || '',
          number: saved.number || newQueue.number,
          patientName: saved.patientName || saved.patient_name || '',
          patientPhone: saved.patientPhone || saved.patient_phone || '',
          hasInfection: saved.hasInfection || saved.has_infection || false,
          medicalNotes: saved.medicalNotes || saved.medical_notes || '',
          passportSerial: saved.passportSerial || saved.passport_serial || '',
          telegramChatId: saved.telegramChatId || saved.telegram_chat_id || '',
          status: saved.status || 'pending',
          createdAt: saved.createdAt || saved.created_at || new Date().toISOString()
        };
        setQueues(prev => prev.map(q => q.id === newQueue.id ? mapped : q));
      }
    } catch (err) {
      console.warn("[AppState Hook] Backend sync failed, using offline state", err);
    } finally {
      isSyncingRef.current = false;
    }

    // Ticket-created Telegram confirmation is sent server-side by POST /api/queues
    // itself (see server.ts) — the bot token never needs to reach the browser.
  };

  const handleCancelQueue = async (id: string) => {
    isSyncingRef.current = true;
    setQueues(prev => prev.map(q => q.id === id ? { ...q, status: 'cancelled' } : q));

    try {
      await fetch(`/api/queues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify({ status: 'cancelled' })
      });
    } catch (err) {
      console.warn("[AppState Hook] Cancellation sync failed", err);
    } finally {
      isSyncingRef.current = false;
    }

    const item = queues.find(q => q.id === id);
    if (item) {
      setClinics(prev => prev.map(c => {
        if (c.id === item.clinicId && c.activePatients > 0) {
          return { ...c, activePatients: c.activePatients - 1 };
        }
        return c;
      }));

      // Status-change Telegram notification is sent server-side by
      // PATCH /api/queues/:id itself (see server.ts).
    }
  };

  const handleUpdateQueueStatus = async (id: string, newStatus: QueueItem['status'], serviceId?: string, medicalNotes?: string, appointmentDate?: string, appointmentTime?: string) => {
    isSyncingRef.current = true;
    setQueues(prev => prev.map(q => q.id === id ? { ...q, status: newStatus, ...(serviceId ? { serviceId } : {}), ...(medicalNotes ? { medicalNotes } : {}), ...(appointmentDate ? { appointmentDate } : {}), ...(appointmentTime ? { appointmentTime } : {}) } : q));

    try {
      const payload: any = { status: newStatus };
      if (serviceId) payload.service_id = serviceId;
      if (medicalNotes) payload.medical_notes = medicalNotes;
      if (appointmentDate) payload.appointmentDate = appointmentDate;
      if (appointmentTime) payload.appointmentTime = appointmentTime;
      
      await fetch(`/api/queues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("[AppState Hook] Status mutation sync failed", err);
    } finally {
      isSyncingRef.current = false;
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

      // Status-change Telegram notification is sent server-side by
      // PATCH /api/queues/:id itself (see server.ts).
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
    setClinics(prev => prev.map(c => {
      if (c.id !== clinicId) return c;
      const updated = { ...c, subscriptionStatus: status, nextPaymentDate: nextDueDate };
      fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
        body: JSON.stringify(updated)
      }).catch(console.warn);
      return updated;
    }));
  };

  const handleToggleClinicStatus = async (clinicId: string) => {
    const targetClinic = clinics.find(c => c.id === clinicId);
    if (!targetClinic) return;
    const current = targetClinic.subscriptionStatus || 'active';
    const nextStatus: 'active' | 'suspended' | 'trial' = current === 'suspended' ? 'active' : 'suspended';
    const updated = { ...targetClinic, subscriptionStatus: nextStatus };

    setClinics(prev => prev.map(c => c.id === clinicId ? updated : c));
    try {
      await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleUpdateClinicDetails = async (updatedClinic: Clinic) => {
    setClinics(prev => prev.map(c => c.id === updatedClinic.id ? updatedClinic : c));
    try {
      await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
        body: JSON.stringify(updatedClinic)
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handlePaySubscriptionSimulate = async (clinicId: string) => {
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
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment)
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleApproveSaaSPayment = async (paymentId: string) => {
    const targetPay = saasPayments.find(p => p.id === paymentId);
    if (!targetPay) return;

    const updatedPayment = {
      ...targetPay,
      status: 'confirmed' as const,
      paymentDate: new Date().toISOString().split('T')[0]
    };

    setSaasPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));

    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayment)
      });
    } catch (e) {
      console.warn(e);
    }

    setClinics(prev => prev.map(c => {
      if (c.id === targetPay.clinicId) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        const updated = {
          ...c,
          subscriptionStatus: 'active' as const,
          nextPaymentDate: nextDate.toISOString().split('T')[0],
          // Approving a premium-upgrade request unlocks AI Yordamchi for this clinic.
          ...(targetPay.paymentType === 'premium_upgrade' ? { subscriptionTier: 'premium' as const } : {})
        };
        fetch('/api/clinics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
          body: JSON.stringify(updated)
        }).catch(console.warn);
        return updated;
      }
      return c;
    }));
  };

  const handleRequestPremiumUpgrade = async (clinicId: string) => {
    const targetClinic = clinics.find(c => c.id === clinicId);
    if (!targetClinic) return;

    const request: SaaSPayment = {
      id: 'pay_premium_' + Math.random().toString(36).substr(2, 9),
      clinicId,
      clinicName: targetClinic.name,
      amount: targetClinic.rentalPrice || 1500000,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending_approval',
      paymentType: 'premium_upgrade'
    };

    setSaasPayments(prev => [request, ...prev]);
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleUpdateSuperadminCreds = async (currentPass: string, newLogin: string, newPass: string) => {
    try {
      const res = await fetch('/api/admin-update-creds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
        body: JSON.stringify({ currentPassword: currentPass, newLogin, newPassword: newPass })
      });
      if (!res.ok) {
        throw new Error("Parol noto'g'ri yoki xatolik yuz berdi");
      }
      
      setSuperadminLogin(newLogin);
      setSuperadminPassword(newPass);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dstoma_sa_login', newLogin);
      }

      return true; // success flag
    } catch (err: any) {
      console.warn("Could not sync superadmin credentials with backend", err);
      return false;
    }
  };

  const handleAddClinic = async (newClinic: Clinic) => {
    setClinics(prev => [...prev, newClinic]);
    if (!selectedClinic) {
      setSelectedClinic(newClinic);
    }
    try {
      await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
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

    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialInvoice)
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddDoctor = async (newDoc: Doctor) => {
    isSyncingRef.current = true;
    setDoctors(prev => [...prev, newDoc]);
    try {
      await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify(newDoc)
      });
    } catch (e) {
      console.warn(e);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleSaveDoctorClinicLink = async (link: DoctorClinicLink) => {
    isSyncingRef.current = true;
    setDoctorClinicLinks(prev => {
      const exists = prev.some(l => l.id === link.id);
      return exists ? prev.map(l => l.id === link.id ? link : l) : [...prev, link];
    });
    try {
      const res = await fetch('/api/doctor-clinic-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify(link)
      });
      if (res.ok) {
        const saved = await res.json();
        setDoctorClinicLinks(prev => prev.map(l => l.id === saved.id ? saved : l));
      }
    } catch (e) {
      console.warn(e);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleDeleteDoctorClinicLink = async (linkId: string) => {
    isSyncingRef.current = true;
    setDoctorClinicLinks(prev => prev.filter(l => l.id !== linkId));
    try {
      await fetch(`/api/doctor-clinic-links/${linkId}`, { method: 'DELETE', headers: { ...superAdminAuthHeaders(), ...staffAuthHeaders() } });
    } catch (e) {
      console.warn(e);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleUpdateService = async (updatedSrv: Service) => {
    isSyncingRef.current = true;
    setServices(prev => prev.map(s => s.id === updatedSrv.id ? updatedSrv : s));
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify(updatedSrv)
      });
    } catch (e) {
      console.warn(e);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleAddService = async (newSrv: Service) => {
    isSyncingRef.current = true;
    setServices(prev => [...prev, newSrv]);
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify(newSrv)
      });
    } catch (e) {
      console.warn(e);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    isSyncingRef.current = true;
    setServices(prev => prev.filter(s => s.id !== serviceId));
    try {
      await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: { ...superAdminAuthHeaders(), ...staffAuthHeaders() }
      });
    } catch (e) {
      console.warn(e);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return {
    isAppLoading,
    clinics,
    doctors,
    services,
    queues,
    patients,
    doctorClinicLinks,
    activeDoctorClinicId,
    setActiveDoctorClinicId,
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
    superadminToken,
    staffToken,
    impersonatorSession,
    handleAdminImpersonate,
    handleReturnToSuperAdmin,
    saasPayments,
    mobileMenuOpen,
    setMobileMenuOpen,
    userLocationRef,
    t,
    handleUpdateClinicCreds,
    handleUpdateDoctorCreds,
    handleUpdateDoctorDetails,
    handleDeleteClinic,
    handleDeleteDoctor,
    handleDeletePatient,
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
    handleRequestPremiumUpgrade,
    handleUpdateSuperadminCreds,
    handleAddClinic,
    handleAddDoctor,
    handleSaveDoctorClinicLink,
    handleDeleteDoctorClinicLink,
    handleUpdateService,
    handleAddService,
    handleDeleteService
  };
}
