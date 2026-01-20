export interface Teacher {
  id: string;
  nip: string;
  name: string;
  target_jp: number;
  roles?: string[]; // e.g., ['admin_sampah']
}

export interface Student {
  id: number;
  nisn: string;
  name: string;
  class_name: string;
}

export interface Schedule {
  id: number;
  day_of_week: string;
  time_slot: string;
  class_name: string;
  subject: string;
  isCompleted?: boolean;
}

export interface Journal {
  id: number;
  teacher_id: string;
  class_name: string;
  material: string;
  notes: string;
  cleanliness_status: string;
  validation_status: string;
  created_at: string;
}

export interface AttendanceEntry {
  student_name: string;
  status: 'S' | 'I' | 'A' | 'D';
}

export interface DashboardStats {
  completedKBM: number;
  totalScheduled: number;
  percentage: number;
  classStats: Record<string, number>;
  notYetTaught: {
    guru: string;
    kelas: string;
    mapel: string;
  }[];
}

// --- NEW TYPES ---
export interface TrashTransaction {
  id: number;
  date: string;
  student_name: string;
  type: string; // Plastik, Kertas, dll
  weight: number;
  amount: number;
  status: 'Deposit' | 'Withdraw';
}

export interface AppConfig {
  appName: string;
  schoolName: string;
  logoUrl1x1: string;
  logoUrl3x4: string;
  logoUrl4x3: string;
  letterHeadUrl: string; // Kop Surat
  customMenus: { label: string; url: string; icon: string }[];
}

export interface Task {
  id: number;
  teacher_name: string;
  subject: string;
  title: string;
  description: string;
  deadline: string;
  link?: string;
  status: 'New' | 'Submitted';
}