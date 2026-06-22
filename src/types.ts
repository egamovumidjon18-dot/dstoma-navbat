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
  mapLink?: string; // Google-Yandex Map link for full integration
  // SaaS Subscription Info
  rentalPrice?: number; // Monthly subscription fee in UZS
  nextPaymentDate?: string;
  subscriptionStatus?: 'active' | 'suspended' | 'trial';
  ownerName?: string;
  // System owner-provided credentials
  login?: string;
  password?: string;
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
  // System owner-provided credentials
  login?: string;
  password?: string;
}

export interface Service {
  id: string;
  clinicId: string;
  name: string;
  price: number; // in UZS
}

export interface ToothDiagnosis {
  id: string;
  createdAt: string;
  toothIndex: number;
  toothNumber: number;
  symptoms: string;
  imageFileName?: string;
  enamelAbrasion: string;
  healthFactor: string;
  recommendedTreatment: string;
  diagnosticText: string;
  actionPlan: string[];
}

export interface ClinicVisit {
  id: string;
  date: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  complaint?: string;
  medicalNotes?: string;
  price?: number;
}

export interface Patient {
  id: string;
  clinicId: string;
  fullName: string;
  passportSerial: string;
  phone: string;
  telegramChatId?: string;
  birthDate?: string;
  password?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicDiseases?: string;
  hasInfection?: boolean;
  diagnoses?: ToothDiagnosis[];
  medicalHistory?: any[];
  clinicVisits?: ClinicVisit[];
}

export interface QueueItem {
  id: string;
  clinicId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  serviceId?: string;
  number: number;
  status: 'pending' | 'calling' | 'in_progress' | 'completed' | 'cancelled';
  rating?: number; // feedback stars 1-5
  createdAt: string; // ISO string
  hasInfection?: boolean; // Django models matching
  medicalNotes?: string;  // Django models matching
  passportSerial?: string; // Django models matching
  telegramChatId?: string; // Telegram Chat ID for automated updates
  complaint?: string; // Patient complaint
}

export interface SaaSPayment {
  id: string;
  clinicId: string;
  clinicName: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'pending_approval' | 'confirmed' | 'unpaid';
}

export interface CodeSnippet {
  title: string;
  language: string;
  description: string;
  filename: string;
  code: string;
}

export interface ToothMetrics {
  health: number;
  enamel: number;
  dentin: number;
  pulp: number;
  root: number;
  gum: number;
  bone: number;
  caries: number;
  cavity: number;
  plaque: number;
  calculus: number;
  gingivitis: number;
  periodontitis: number;
  riskLabel: 'LOW' | 'MEDIUM' | 'HIGH';
}


