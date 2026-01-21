
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
export interface WasteType {
  id: number;
  name: string; // e.g. "Plastik Gelas", "Kertas Putih"
  price_per_kg: number;
}

export interface TrashTransaction {
  id: number;
  date: string;
  student_name: string;
  type: string; // Plastik, Kertas, atau "Penarikan", "Pembelian ATK"
  weight: number;
  amount: number; // Rupiah
  status: 'Deposit' | 'Withdraw' | 'Purchase';
  description?: string;
}

export interface PermissionRequest {
  id: number;
  student_name: string;
  class_name: string;
  type: 'Sakit' | 'Izin';
  date: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface GoodDeedRequest {
  id: number;
  student_name: string;
  class_name: string;
  activity: string; // e.g. "Sholat Dhuha"
  date: string;
  time: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  image_url?: string;
}

export interface AppConfig {
  id?: number;
  appName: string;
  schoolName: string;
  principalName: string; 
  principalNip: string; 
  
  logoUrl1x1: string;
  logoUrl3x4: string;
  logoUrl4x3: string;
  letterHeadUrl: string; // Kop Surat
  
  // Announcement Config
  announcementTitle: string;     // Judul (misal: Rapat Wali Murid)
  announcementType: string;      // Jenis (misal: Akademik, Keagamaan)
  announcementDate: string;      // Tanggal Kegiatan
  announcementTime: string;      // Waktu (08:00 - Selesai)
  announcementDesc: string;      // Deskripsi Singkat
  announcementColor: 'yellow' | 'blue' | 'green' | 'pink' | 'purple'; 
  
  // Grade Config
  phCount: number; // Jumlah Sub PH (PH1, PH2...)

  customMenus: { label: string; url: string; icon: string }[];
  // API Configs
  gemini_api_key?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  service_role_key?: string;
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

export interface Grade {
  id?: number;
  student_id: number;
  student_name: string;
  class_name: string;
  subject: string;
  ph_scores: number[]; // Array of scores based on phCount
  pts: number; // STS
  pas: number; // ASTS
}
