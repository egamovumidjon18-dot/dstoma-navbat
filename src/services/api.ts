import { Clinic, Doctor, Service, QueueItem } from '../types';

// Get the backend API base URL from Vite environment variables or fallback to your Railway subdomain identifier
export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dstoma_custom_api_url');
    if (saved) return saved.replace(/\/$/, '');
  }
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, ''); // strip trailing slash
  
  // Safe default: use your Railway backend domain displayed in your project screenshot
  return 'https://dstomaqueue-production.up.railway.app';
};

export const mapQueueToReact = (item: any): QueueItem => {
  return {
    id: item.id?.toString() || '',
    clinicId: item.clinic_id?.toString() || item.clinic?.toString() || '',
    patientName: item.patient_name || (item.patient && typeof item.patient === 'object' ? item.patient.fullName : '') || 'Guest Patient',
    patientPhone: item.patient_phone || (item.patient && typeof item.patient === 'object' ? item.patient.phone : '') || '',
    doctorId: item.doctor_id?.toString() || item.doctor?.toString() || '',
    serviceId: item.service_id?.toString() || item.service?.toString() || '',
    number: Number(item.number) || 0,
    status: item.is_completed ? 'completed' : (item.status === 'cancelled' ? 'cancelled' : (item.status || 'pending')),
    rating: item.rating ? Number(item.rating) : undefined,
    createdAt: item.created_at || item.createdAt || new Date().toISOString(),
    hasInfection: item.has_infection ?? item.hasInfection ?? false,
    medicalNotes: item.medical_notes ?? item.medicalNotes ?? '',
    passportSerial: item.passport_serial ?? item.passportSerial ?? ''
  };
};

/**
 * Django API Integration Helper
 * Allows seamless connection between our React UI and your Django + Railway Database
 */
export const DjangoAPI = {
  // 1. Fetch all Clinics List
  async getClinics(): Promise<Clinic[]> {
    const url = `${getApiUrl()}/api/clinics/`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return res.json();
  },

  // 2. Fetch all Doctors List
  async getDoctors(): Promise<Doctor[]> {
    const url = `${getApiUrl()}/api/doctors/`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return res.json();
  },

  // 3. Fetch all Services List
  async getServices(): Promise<Service[]> {
    const url = `${getApiUrl()}/api/services/`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return res.json();
  },

  // 4. Fetch the active Queues List
  async getQueues(): Promise<QueueItem[]> {
    const url = `${getApiUrl()}/api/queues/`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapQueueToReact) : [];
  },

  // 5. Book a new ticket / queue on Django
  async createQueueItem(data: {
    clinicId: string;
    doctorId: string;
    serviceId: string;
    patientName: string;
    patientPhone: string;
    hasInfection?: boolean;
    medicalNotes?: string;
    passportSerial?: string;
  }): Promise<QueueItem> {
    const url = `${getApiUrl()}/api/queues/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinic_id: data.clinicId,
        doctor_id: data.doctorId,
        service_id: data.serviceId,
        patient_name: data.patientName,
        patient_phone: data.patientPhone,
        has_infection: data.hasInfection ?? false,
        medical_notes: data.medicalNotes ?? '',
        passport_serial: data.passportSerial ?? '',
        status: 'pending'
      }),
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const item = await res.json();
    return mapQueueToReact(item);
  },

  // 6. Update Queue status (calling, completed, cancelled)
  async updateQueueStatus(queueId: string, status: QueueItem['status']): Promise<QueueItem> {
    const url = `${getApiUrl()}/api/queues/${queueId}/`;
    const isCompleted = status === 'completed';
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status,
        is_completed: isCompleted
      })
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const item = await res.json();
    return mapQueueToReact(item);
  },

  // 7. Update Queue rating
  async rateQueueItem(queueId: string, rating: number): Promise<QueueItem> {
    const url = `${getApiUrl()}/api/queues/${queueId}/rate/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating })
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const item = await res.json();
    return mapQueueToReact(item);
  },

  // 8. Update Clinic Tenant Subscription from CEO Landlord Panel
  async updateClinicSubscription(clinicId: string, status: 'active' | 'suspended' | 'trial', nextDueDate: string): Promise<Clinic> {
    const url = `${getApiUrl()}/api/clinics/${clinicId}/subscription/`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_status: status,
        next_payment_date: nextDueDate
      })
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return res.json();
  }
};
