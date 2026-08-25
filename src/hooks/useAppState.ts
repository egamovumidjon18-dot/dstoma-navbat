import React, { useState, useEffect, useRef } from 'react';
import { Clinic, Doctor, Service, QueueItem, SaaSPayment, DoctorClinicLink } from '../types';
import { TRANSLATIONS, Language } from '../translations';

// Director/doctor (and patient) sessions persist in localStorage so a device stays
// logged in across browser restarts — "remember this device" was an explicit ask.
// The superadmin's own session deliberately stays in sessionStorage only (cleared the
// moment the tab closes): it's the single most powerful account, so trading a little
// convenience for not lingering indefinitely on a shared/borrowed device is worth it.
function readUserSession(): any {
  if (typeof window === 'undefined') return null;
  const fromLocal = localStorage.getItem('dstoma_user_session');
  if (fromLocal) {
    try { return JSON.parse(fromLocal); } catch (e) { /* ignore */ }
  }
  const fromSession = sessionStorage.getItem('dstoma_user_session');
  if (fromSession) {
    try { return JSON.parse(fromSession); } catch (e) { /* ignore */ }
  }
  return null;
}
function writeUserSession(session: any) {
  if (typeof window === 'undefined') return;
  if (session?.type === 'superadmin') {
    sessionStorage.setItem('dstoma_user_session', JSON.stringify(session));
    localStorage.removeItem('dstoma_user_session');
  } else {
    localStorage.setItem('dstoma_user_session', JSON.stringify(session));
    sessionStorage.removeItem('dstoma_user_session');
  }
}
function clearUserSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dstoma_user_session');
  sessionStorage.removeItem('dstoma_user_session');
}

export function useAppState() {
  // Master States
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorClinicLinks, setDoctorClinicLinks] = useState<DoctorClinicLink[]>([]);

  // Navigation. A restored staff session opens straight on that role's panel:
  // the public role-tab bar is gone (the welcome screen replaced it), so
  // defaulting everyone to 'bemor' left a returning doctor/director/superadmin
  // with no way back to their own panel short of hand-editing the URL.
  const [activeTab, setActiveTab] = useState<'bemor' | 'shifokor' | 'boshliq' | 'superadmin'>(() => {
    const parsed = readUserSession();
    if (parsed?.type === 'doctor') return 'shifokor';
    if (parsed?.type === 'director') return 'boshliq';
    if (parsed?.type === 'superadmin') return 'superadmin';
    return 'bemor';
  });
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const selectedClinicRef = useRef<Clinic | null>(selectedClinic);

  // Which clinic a multi-clinic doctor is currently operating in, independent of the
  // public-facing `selectedClinic` (that one drives the Bemor Kabineti tab). Doctors
  // with 0 or 1 active links just use their home `clinicId`, unaffected by this.
  const [activeDoctorClinicId, setActiveDoctorClinicId] = useState<string | null>(() => {
    const parsed = readUserSession();
    if (parsed?.type === 'doctor' && parsed?.clinicId) return parsed.clinicId;
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
  } | null>(() => readUserSession());

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
  // Kept in localStorage (not sessionStorage) so a doctor/director's device stays
  // logged in across browser restarts — the token's own server-side TTL is still
  // what actually limits how long it stays valid, this just avoids re-login prompts.
  const [staffToken, setStaffToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dstoma_staff_token') || sessionStorage.getItem('dstoma_staff_token');
    }
    return null;
  });
  const setStaffTokenPersisted = (token: string | null) => {
    setStaffToken(token);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dstoma_staff_token');
      if (token) localStorage.setItem('dstoma_staff_token', token);
      else localStorage.removeItem('dstoma_staff_token');
    }
  };
  const staffAuthHeaders = (): Record<string, string> =>
    staffToken ? { Authorization: `Bearer ${staffToken}` } : {};

  // Mirrors of the two tokens above for use inside the mount-once polling effect
  // below (loadServerData) — that effect's closure is captured once on mount, so
  // reading `staffToken`/`superadminToken` directly there would keep seeing
  // whatever they were (usually null) at that moment, even after a later login.
  const superadminTokenRef = useRef<string | null>(superadminToken);
  const staffTokenRef = useRef<string | null>(staffToken);
  useEffect(() => { superadminTokenRef.current = superadminToken; }, [superadminToken]);
  useEffect(() => { staffTokenRef.current = staffToken; }, [staffToken]);

  // Stateful SaaS Payments
  const [saasPayments, setSaasPayments] = useState<SaaSPayment[]>([]);

  const t = (key: keyof typeof TRANSLATIONS['uz']) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['uz'][key] || String(key);
  };

  // Credential updaters
  // Returns whether the save actually persisted server-side. Previous versions fired
  // the request without checking res.ok, so a rejected save (e.g. an expired/not-yet-
  // persisted superadmin session on a cold serverless instance) still left the UI
  // showing the new credentials as if they'd saved — the doctor/clinic then couldn't
  // log in with them because the old value was still the one actually stored.
  const handleUpdateClinicCreds = async (clinicId: string, login: string, pass: string): Promise<boolean> => {
    const previous = clinics.find(c => c.id === clinicId);
    if (!previous) return false;
    const updated = { ...previous, login, password: pass };
    setClinics(prev => prev.map(c => (c.id === clinicId ? updated : c)));
    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('save failed');
      return true;
    } catch (e) {
      console.warn(e);
      setClinics(prev => prev.map(c => (c.id === clinicId ? previous : c)));
      return false;
    }
  };

  const handleUpdateDoctorCreds = async (doctorId: string, login: string, pass: string): Promise<boolean> => {
    const previous = doctors.find(d => d.id === doctorId);
    if (!previous) return false;
    const updated = { ...previous, login, password: pass };
    setDoctors(prev => prev.map(d => (d.id === doctorId ? updated : d)));
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('save failed');
      return true;
    } catch (e) {
      console.warn(e);
      setDoctors(prev => prev.map(d => (d.id === doctorId ? previous : d)));
      return false;
    }
  };

  const handleUpdateDoctorDetails = async (doctorId: string, updates: Partial<Doctor>): Promise<boolean> => {
    const previous = doctors.find(d => d.id === doctorId);
    if (!previous) return false;
    const updated = { ...previous, ...updates };
    setDoctors(prev => prev.map(d => (d.id === doctorId ? updated : d)));
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('save failed');
      return true;
    } catch (e) {
      console.warn(e);
      setDoctors(prev => prev.map(d => (d.id === doctorId ? previous : d)));
      return false;
    }
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

  // Merge a just-created/edited patient into local state immediately, so the UI
  // that created it (e.g. the doctor's quick-add modal) reflects it on the spot
  // instead of waiting up to 4s for the next background poll — that lag is what
  // made newly added patients look like they hadn't saved at all.
  const handlePatientUpserted = (patient: any) => {
    if (!patient?.id) return;
    setPatients(prev => {
      const idx = prev.findIndex(p => p.id === patient.id);
      if (idx === -1) return [...prev, patient];
      const next = [...prev];
      next[idx] = { ...next[idx], ...patient };
      return next;
    });
  };

  // Tries every account type in turn so one login form can serve patients,
  // doctors, directors and the superadmin without asking which kind of
  // account they have. Each check is verified server-side — the client never
  // holds a list of plaintext passwords to compare against locally. Returns
  // which role matched (so the caller can route to the right screen) or null
  // if none did.
  const handleLoginSubmit = async (
    e: React.FormEvent
  ): Promise<'superadmin' | 'director' | 'doctor' | 'patient' | null> => {
    e.preventDefault();
    setAuthError(null);
    const userLower = authUsername.trim();
    const passLower = authPassword.trim();

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
        writeUserSession(session);
        if (typeof window !== 'undefined') {
          localStorage.setItem('dstoma_sa_login', userLower);
        }
        setAuthUsername('');
        setAuthPassword('');
        return 'superadmin';
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
        writeUserSession(session);
        setSelectedClinic(matchedClinic);
        setAuthUsername('');
        setAuthPassword('');
        return 'director';
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
        writeUserSession(session);
        setActiveDoctorClinicId(matchedDoctor.clinicId);
        setAuthUsername('');
        setAuthPassword('');
        return 'doctor';
      }

      // 4. Patient. Patient sessions are tracked separately from the staff
      // `currentUser` above (ClientDashboard owns its own session state), so
      // this writes directly to the same localStorage keys ClientDashboard
      // reads on mount rather than going through setCurrentUser/writeUserSession.
      const patientLoginRes = await fetch('/api/patient-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: userLower.toUpperCase(), password: passLower })
      });
      if (patientLoginRes.ok) {
        const data = await patientLoginRes.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem('dstoma_patient_session', JSON.stringify(data.patient));
          if (data.token) localStorage.setItem('dstoma_patient_token', data.token);
        }
        setAuthUsername('');
        setAuthPassword('');
        return 'patient';
      }
    } catch (err) {
      console.warn("Login request failed:", err);
      setAuthError(t('credIncorrect'));
      return null;
    }

    setAuthError(t('credIncorrect'));
    return null;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
    setActiveTab('bemor');
    setActiveDoctorClinicId(null);
    setSuperadminTokenPersisted(null);
    setStaffTokenPersisted(null);
    setImpersonatorSession(null);
    clearUserSession();
    if (typeof window !== 'undefined') {
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
        writeUserSession(session);
      } else {
        const doctor = data.doctor;
        const session = { type: 'doctor' as const, id: doctor.id, clinicId: doctor.clinicId, name: doctor.name };
        setCurrentUser(session);
        setActiveDoctorClinicId(doctor.clinicId);
        setActiveTab('shifokor');
        writeUserSession(session);
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
    writeUserSession(impersonatorSession);
    if (typeof window !== 'undefined') {
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
    // Split by how often the data actually changes. Queues move constantly;
    // clinics, doctors, services, patients and links barely move at all, but
    // used to be re-fetched every 4 seconds along with them — roughly 165KB of
    // repeat traffic every cycle, parsed and diffed on the main thread. Only
    // the queue poll stays fast now.
    const loadServerData = async (includeSlow = true) => {
      if (includeSlow) {
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
            
            // Only auto-select a clinic when the URL explicitly names one (e.g. a
            // shared ?clinic= link). Otherwise leave selectedClinic null so patients
            // land on the neutral clinic-discovery page — this is a multi-tenant
            // platform, so silently defaulting to "whichever clinic happens to be
            // first in the list" would misrepresent the site as belonging to one
            // specific clinic.
            if (isInitialLoad && !selectedClinicRef.current && clinicParam) {
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
      } // end includeSlow (clinics / doctors / services)

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

      if (!includeSlow) { if (active) setIsAppLoading(false); return; }

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
        const pAuthHeaders: Record<string, string> = {};
        if (superadminTokenRef.current) pAuthHeaders.Authorization = `Bearer ${superadminTokenRef.current}`;
        if (staffTokenRef.current) pAuthHeaders.Authorization = `Bearer ${staffTokenRef.current}`;
        const pRes = await fetch('/api/payments', { headers: pAuthHeaders });
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
    loadServerData(true);
    // Queues only — the thing that actually changes minute to minute.
    const fastInt = setInterval(() => loadServerData(false), 4000);
    // Everything else, at a rate that matches how often it really changes.
    const slowInt = setInterval(() => loadServerData(true), 60000);
    return () => {
      active = false;
      clearInterval(fastInt);
      clearInterval(slowInt);
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

    // A future-dated booking (status 'scheduled', e.g. from the doctor panel's
    // "book for a chosen date/time" flow) isn't someone physically waiting at
    // the clinic right now, unlike a walk-in 'pending' ticket — only count the
    // latter toward activePatients.
    if (newQueue.status !== 'scheduled') {
      setClinics(prev => prev.map(c => {
        if (c.id === newQueue.clinicId) {
          return { ...c, activePatients: c.activePatients + 1 };
        }
        return c;
      }));
    }

    try {
      const res = await fetch('/api/queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newQueue.id,
          clinicId: newQueue.clinicId,
          doctorId: newQueue.doctorId,
          serviceId: newQueue.serviceId,
          patientId: newQueue.patientId,
          patientName: newQueue.patientName,
          patientPhone: newQueue.patientPhone,
          hasInfection: newQueue.hasInfection,
          medicalNotes: newQueue.medicalNotes,
          passportSerial: newQueue.passportSerial,
          telegramChatId: newQueue.telegramChatId,
          status: newQueue.status,
          appointmentDate: newQueue.appointmentDate,
          appointmentTime: newQueue.appointmentTime
        })
      });
      if (res.ok) {
        const saved = await res.json();
        const mapped = {
          id: saved.id || Math.random().toString(36).substr(2, 9),
          clinicId: saved.clinicId || saved.clinic_id || '',
          doctorId: saved.doctorId || saved.doctor_id || '',
          serviceId: saved.serviceId || saved.service_id || '',
          patientId: saved.patientId || saved.patient_id || undefined,
          number: saved.number || newQueue.number,
          patientName: saved.patientName || saved.patient_name || '',
          patientPhone: saved.patientPhone || saved.patient_phone || '',
          hasInfection: saved.hasInfection || saved.has_infection || false,
          medicalNotes: saved.medicalNotes || saved.medical_notes || '',
          passportSerial: saved.passportSerial || saved.passport_serial || '',
          telegramChatId: saved.telegramChatId || saved.telegram_chat_id || '',
          status: saved.status || 'pending',
          appointmentDate: saved.appointmentDate || saved.appointment_date || undefined,
          appointmentTime: saved.appointmentTime || saved.appointment_time || undefined,
          createdAt: saved.createdAt || saved.created_at || new Date().toISOString()
        };
        setQueues(prev => prev.map(q => q.id === newQueue.id ? mapped : q));
      } else {
        // Server rejected it (e.g. 409 duplicate-active-queue) — the optimistic
        // add above would otherwise leave a phantom ticket in state that the
        // patient sees but that was never actually saved.
        const errBody = await res.json().catch(() => null);
        setQueues(prev => prev.filter(q => q.id !== newQueue.id));
        if (newQueue.status !== 'scheduled') {
          setClinics(prev => prev.map(c =>
            c.id === newQueue.clinicId && c.activePatients > 0
              ? { ...c, activePatients: c.activePatients - 1 }
              : c
          ));
        }
        console.warn("[AppState Hook] Queue creation rejected:", errBody?.error || res.status);
        isSyncingRef.current = false;
        // Hand the reason back so the caller can tell the patient why, instead
        // of showing a success toast for a ticket that was just rolled back.
        return { ok: false, error: errBody?.error as string | undefined };
      }
    } catch (err) {
      console.warn("[AppState Hook] Backend sync failed, using offline state", err);
    } finally {
      isSyncingRef.current = false;
    }
    return { ok: true };

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

  // Permanently removes a queue entry (as opposed to handleCancelQueue, which
  // marks it 'cancelled' but keeps the record) — used for the doctor's own
  // scheduling mistakes, e.g. a slot booked into the wrong day.
  const handleDeleteQueue = async (id: string) => {
    const previousQueues = queues;
    setQueues(prev => prev.filter(q => q.id !== id));
    try {
      const res = await fetch(`/api/queues/${id}`, {
        method: 'DELETE',
        headers: { ...superAdminAuthHeaders(), ...staffAuthHeaders() },
      });
      if (!res.ok) {
        setQueues(previousQueues);
        if (res.status === 401) {
          alert("Sessiya muddati tugagan. Iltimos, qaytadan kiring.");
          handleLogout();
        } else {
          alert("Navbatni o'chirib bo'lmadi: server so'rovni qabul qilmadi.");
        }
      }
    } catch (err) {
      console.warn("[AppState Hook] Queue deletion sync failed", err);
      setQueues(previousQueues);
      alert("Tarmoqqa ulanmadi — navbat o'chirilmadi.");
    }
  };

  const handleUpdateQueueStatus = async (id: string, newStatus: QueueItem['status'], serviceId?: string, medicalNotes?: string, appointmentDate?: string, appointmentTime?: string, opts?: { silent?: boolean }) => {
    isSyncingRef.current = true;
    // Kept so a rejected change can be put back. Without this the optimistic
    // update stood until the 4s poll quietly reverted it, which is exactly what
    // a broken button looks like from the outside: it appears to work, then
    // undoes itself with no explanation.
    const previousQueues = queues;
    setQueues(prev => prev.map(q => q.id === id ? { ...q, status: newStatus, ...(serviceId ? { serviceId } : {}), ...(medicalNotes ? { medicalNotes } : {}), ...(appointmentDate ? { appointmentDate } : {}), ...(appointmentTime ? { appointmentTime } : {}) } : q));

    try {
      const payload: any = { status: newStatus };
      if (serviceId) payload.service_id = serviceId;
      if (medicalNotes) payload.medical_notes = medicalNotes;
      if (appointmentDate) payload.appointmentDate = appointmentDate;
      if (appointmentTime) payload.appointmentTime = appointmentTime;

      const res = await fetch(`/api/queues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        setQueues(previousQueues);
        // Background callers (the auto-queue tick, which retries every 60s
        // unattended) must never alert() or force a logout — a blocking dialog
        // (or being kicked out) triggered by its own silent retry, possibly
        // repeatedly, is worse than the silent failure it replaced. Only a
        // doctor's own button click gets the explanation and the redirect.
        if (!opts?.silent) {
          if (res.status === 401) {
            alert("Sessiya muddati tugagan. Iltimos, qaytadan kiring.");
            handleLogout();
          } else {
            alert("Navbat holatini o'zgartirib bo'lmadi: server o'zgarishni qabul qilmadi.");
          }
        } else {
          console.warn("[AppState Hook] Silent status mutation rejected:", res.status);
        }
        return;
      }
    } catch (err) {
      console.warn("[AppState Hook] Status mutation sync failed", err);
      setQueues(previousQueues);
      if (!opts?.silent) alert("Tarmoqqa ulanmadi — navbat holati o'zgartirilmadi.");
      return;
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
        headers: { 'Content-Type': 'application/json', ...staffAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...staffAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders() },
        body: JSON.stringify(trialInvoice)
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddDoctor = async (newDoc: Doctor): Promise<boolean> => {
    isSyncingRef.current = true;
    setDoctors(prev => [...prev, newDoc]);
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...superAdminAuthHeaders(), ...staffAuthHeaders() },
        body: JSON.stringify(newDoc)
      });
      if (!res.ok) throw new Error('save failed');
      return true;
    } catch (e) {
      console.warn(e);
      setDoctors(prev => prev.filter(d => d.id !== newDoc.id));
      return false;
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
    handlePatientUpserted,
    handleLoginSubmit,
    handleLogout,
    handleAddQueue,
    handleCancelQueue,
    handleDeleteQueue,
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
