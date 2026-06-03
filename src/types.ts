export interface Clinic {
  id: string;
  name: string;
  subdomain: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  logo: string;
  rating: number;
  activePatients: number;
  // SaaS Subscription Info
  rentalPrice?: number; // Monthly subscription fee in UZS
  nextPaymentDate?: string;
  subscriptionStatus?: 'active' | 'suspended' | 'trial';
  ownerName?: string;
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  rating: number;
  ratingCount: number;
  image: string;
  status: 'idle' | 'busy' | 'away';
}

export interface Service {
  id: string;
  clinicId: string;
  name: string;
  price: number; // in UZS
}

export interface Patient {
  id: string;
  clinicId: string;
  fullName: string;
  passportSerial: string;
  phone: string;
  telegramChatId?: string;
}

export interface QueueItem {
  id: string;
  clinicId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  serviceId: string;
  number: number;
  status: 'pending' | 'calling' | 'completed' | 'cancelled';
  rating?: number; // feedback stars 1-5
  createdAt: string; // ISO string
}

export interface CodeSnippet {
  title: string;
  language: string;
  description: string;
  filename: string;
  code: string;
}
