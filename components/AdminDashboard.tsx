import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, CreditCard, Megaphone, FileText, 
  LayoutDashboard, UserPlus, GraduationCap, DollarSign,
  CalendarRange, Printer, Search, LogOut, MoreHorizontal,
  Edit, Trash2, Save, X, Plus, ChevronLeft, ChevronRight, CheckCircle,
  Eye, EyeOff, KeyRound, Lock, Settings, Calendar, School,
  FileSpreadsheet, Mail, Star, Filter, Download, CheckSquare, Square,
  Globe, MessageCircle, Menu, ExternalLink, Clock, Upload, Database, Key, Server,
  Recycle, LayoutTemplate, Trophy, ArrowLeft, Palette, Info, RefreshCw, Trash, ShieldCheck, Link,
  AlertTriangle, FileWarning, XCircle, ShoppingCart, Check, X as XIcon, Image,
  Grid, BellOff, Bot, Wallet, TrendingUp, TrendingDown, PlusCircle, MinusCircle, Package,
  UserCheck, Shield, Terminal, Activity, BookOpen, Layers, ArrowUpRight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { AppConfig, TrashTransaction, Grade, WasteType, PermissionRequest, GoodDeedRequest } from '../types';
import { supabase, supabaseUrl as defaultSupabaseUrl } from '../services/supabase';
import { STANDARD_SUBJECTS } from '../constants';

interface AdminProps {
  onLogout: () => void;
}

// Interface for Import Feedback
interface ImportResult {
    isOpen: boolean;
    status: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    details?: string[]; 
}

const MENU_CONFIG = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'app_config', label: 'App & Sekolah', icon: LayoutTemplate },
    { id: 'users_auth', label: 'User Auth', icon: UserCheck },
    { id: 'students', label: 'Data Siswa', icon: GraduationCap },
    { id: 'teachers', label: 'Data Guru', icon: Users },
    { id: 'schedule', label: 'Jadwal KBM', icon: CalendarRange },
    { id: 'grades', label: 'Rekap Nilai', icon: FileSpreadsheet },
    { id: 'finance', label: 'Bank Sampah', icon: Recycle },
    { id: 'letters', label: 'Persuratan', icon: Mail },
    { id: 'good_deeds', label: 'Anak Hebat', icon: Star },
    { id: 'api_settings', label: 'API & Integrasi', icon: Database },
];

const TEACHER_SUBJECT_OPTIONS = [
    "Pendidikan Agama & Budi Pekerti", 
    "Pendidikan Pancasila", 
    "Bahasa Indonesia", 
    "Matematika", 
    "PJOK", 
    "Seni dan Budaya", 
    "IPAS", 
    "Proyek P5", 
    "Bahasa Inggris", 
    "BTQ",
    "Guru Kelas"
];

// Helper to safely extract error message from any object
const getErrorMessage = (error: any): string => {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error.message) return error.message;
    if (error.error_description) return error.error_description;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
};

const formatDateForDB = (dateStr: string): string | null => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return null;
    const cleanStr = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;
    const parts = cleanStr.split(/[\/\-]/);
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
             return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
    }
    return null;
};

const AdminDashboard: React.FC<AdminProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data States - Initialized Empty
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  
  // Finance States
  const [financeTab, setFinanceTab] = useState<'overview' | 'input' | 'settings'>('overview');
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([
      { id: 1, name: 'Plastik Gelas (Bersih)', price_per_kg: 3000 },
      { id: 2, name: 'Kertas Putih/Buku', price_per_kg: 2500 },
      { id: 3, name: 'Kardus', price_per_kg: 1500 },
      { id: 4, name: 'Botol PET', price_per_kg: 2000 },
      { id: 5, name: 'Logam/Kaleng', price_per_kg: 4000 },
  ]);
  const [wasteTransactions, setWasteTransactions] = useState<TrashTransaction[]>([]);
  
  // Finance Input Form State
  const [financeForm, setFinanceForm] = useState({
      studentId: '',
      transactionType: 'deposit', // 'deposit' or 'withdraw'
      wasteTypeId: 1,
      weight: '',
      withdrawItem: 'Uang Tunai', // 'Uang Tunai', 'Buku Tulis', 'Pensil', 'Penghapus', 'ATK Lain'
      withdrawAmount: '', // Price/Value
      notes: ''
  });

  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [goodDeeds, setGoodDeeds] = useState<GoodDeedRequest[]>([]);

  // Auth Management State
  const [authSyncProgress, setAuthSyncProgress] = useState(0);
  const [isAuthSyncing, setIsAuthSyncing] = useState(false);
  const [authSyncLogs, setAuthSyncLogs] = useState<string[]>([]);

  // Feedback Modal State
  const [importResult, setImportResult] = useState<ImportResult>({
      isOpen: false, status: 'success', title: '', message: '', details: []
  });
  
  // Grade Recap Filter States & Config
  const [gradeFilterClass, setGradeFilterClass] = useState('5A');
  const [gradeFilterSubject, setGradeFilterSubject] = useState('Matematika');
  const [phCount, setPhCount] = useState(2); // Default displayed PH columns

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'student' | 'teacher' | 'schedule' | null>(null);

  // API & Integration States
  // Injected Service Role Key as requested
  const [serviceRoleKey, setServiceRoleKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZGFscHF2a3d0Y2JmcmR4dmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg1MTU1OSwiZXhwIjoyMDg0NDI3NTU5fQ.ZvahvAJ9gX8mKm-r5ihQFsPYvEHIEutQlJ-1so7zXi4');
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState(defaultSupabaseUrl);
  const [customSupabaseKey, setCustomSupabaseKey] = useState('');
  
  const [savingConfig, setSavingConfig] = useState(false);

  // App Config with Default Principal
  const [appConfig, setAppConfig] = useState<AppConfig>({
      id: 1, // Default ID for single row config
      appName: 'BISMA APP',
      schoolName: 'SDN BAUJENG I BEJI',
      principalName: 'AKHMAD NASOR, S.Pd',
      principalNip: '198704082019031001',
      logoUrl1x1: 'https://via.placeholder.com/100',
      logoUrl3x4: 'https://i.imghippo.com/files/kldd1383bkc.png',
      logoUrl4x3: 'https://via.placeholder.com/400x300',
      letterHeadUrl: 'https://via.placeholder.com/800x200?text=KOP+SURAT+SEKOLAH',
      announcementTitle: 'Kegiatan Tengah Semester',
      announcementType: 'Akademik',
      announcementDate: '2026-03-15',
      announcementTime: '07:30 - 11:00 WIB',
      announcementDesc: 'Seluruh siswa diharapkan membawa peralatan tulis lengkap dan berpakaian seragam olahraga.',
      announcementColor: 'yellow',
      phCount: 4, 
      customMenus: []
  });

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'student' | 'teacher' | 'schedule' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState({
      selectedHours: [] as number[],
      selectedSubject: '',
      isEkstra: false,
      customSubject: ''
  });
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);

  // Fetch Data from Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
        const { data: configData } = await supabase.from('app_config').select('*').single();
        if (configData) {
             // Map snake_case from DB to camelCase for state
             setAppConfig(prev => ({
                 ...prev,
                 id: configData.id,
                 appName: configData.app_name,
                 schoolName: configData.school_name,
                 principalName: configData.principal_name || 'AKHMAD NASOR, S.Pd',
                 principalNip: configData.principal_nip || '198704082019031001',
                 logoUrl1x1: configData.logo_url_1x1,
                 logoUrl3x4: configData.logo_url_3x4,
                 logoUrl4x3: configData.logo_url_4x3,
                 letterHeadUrl: configData.letterhead_url,
                 announcementTitle: configData.announcement_title,
                 announcementType: configData.announcement_type,
                 announcementDate: configData.announcement_date,
                 announcementTime: configData.announcement_time,
                 announcementDesc: configData.announcement_desc,
                 announcementColor: configData.announcement_color,
             }));
        }

        const { data: sData } = await supabase.from('students').select('*').order('class_name', { ascending: true }).order('name');
        setStudents(sData || []);

        const { data: tData } = await supabase.from('teachers').select('*').order('name');
        setTeachers(tData || []);

        const { data: schData } = await supabase.from('schedules').select('*').order('day');
        setSchedules(schData || []);

        const { data: gData } = await supabase.from('grades').select('*');
        setGrades(gData || []);
        
        // Fetch Trash Transactions if exists, else mock empty
        const { data: trashData } = await supabase.from('trash_transactions').select('*').order('created_at', { ascending: false });
        if (trashData) setWasteTransactions(trashData);

    } catch (e: any) {
        console.error("Error fetching data:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ... (CSV Parsing and Download logic remains the same) ...
  const parseCSV = (text: string) => {
    const cleanText = text.replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r\n|\n|\r/).filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase()); 
    
    return lines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuote = false;
        
        for(let i=0; i<line.length; i++) {
            const char = line[i];
            if(char === '"') { 
                inQuote = !inQuote; 
                continue; 
            }
            if(char === delimiter && !inQuote) { 
                values.push(current); 
                current = ''; 
            } else { 
                current += char; 
            }
        }
        values.push(current); 
        
        return headers.reduce((obj: any, header, index) => {
            let val = values[index] !== undefined ? values[index].trim().replace(/^"|"$/g, '') : '';
            obj[header] = val;
            return obj;
        }, {});
    });
  };

  const downloadTemplate = (type: 'student' | 'teacher' | 'schedule') => {
      let headers = "";
      let filename = "";

      if (type === 'student') {
          headers = "nisn,nis,name,tempat_lahir,tanggal_lahir,nama_ayah,nama_ibu,class_name,password,status";
          filename = "template_siswa_lengkap.csv";
      } else if (type === 'teacher') {
          headers = "nip,name,jenis_kelamin,jenis_guru,subject,wali_kelas,password,status";
          filename = "template_guru.csv";
      } else if (type === 'schedule') {
          headers = "day,time,class_name,subject,teacher_name";
          filename = "template_jadwal.csv";
      }

      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const exportToCSV = (data: any[], filename: string) => {
      if (data.length === 0) {
          alert("Tidak ada data untuk diexport.");
          return;
      }
      const cleanData = data.map(({ id, created_at, ...rest }) => rest);
      const headers = Object.keys(cleanData[0]).join(",");
      const rows = cleanData.map(row => {
          return Object.values(row).map(value => {
              const strValue = String(value);
              return strValue.includes(',') ? `"${strValue}"` : strValue;
          }).join(",");
      }).join("\n");
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportClick = (type: 'student' | 'teacher' | 'schedule') => {
      setImportType(type);
      if (fileInputRef.current) { 
          fileInputRef.current.value = ''; 
          fileInputRef.current.click(); 
      }
  };

  const createAuthUsers = async (data: any[], type: 'student' | 'teacher') => {
      if (!serviceRoleKey) {
          return { success: false, error: 'Service Role Key belum diatur di menu API Settings. User hanya disimpan di tabel, tidak masuk Auth.' };
      }

      const supabaseAdmin = createClient(customSupabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
      });

      let successCount = 0;
      let errors: string[] = [];

      for (const user of data) {
          try {
              const identifier = type === 'student' ? user.nisn : user.nip;
              const email = `${identifier}@bisma.id`;
              
              const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                  email: email,
                  password: user.password || '123456', 
                  email_confirm: true,
                  user_metadata: {
                      name: user.name,
                      role: type,
                      identifier: identifier,
                      class_name: user.class_name || ''
                  }
              });

              if (createError) {
                  if (createError.message.includes('already registered')) {
                      // Already exists, ignore
                  } else {
                      errors.push(`Gagal buat Auth ${user.name}: ${createError.message}`);
                  }
              } else {
                  successCount++;
              }

          } catch (err: any) {
              errors.push(`Error Auth ${user.name}: ${err.message}`);
          }
      }

      return { success: true, count: successCount, errors };
  };

  const handleSyncAuth = async () => {
      if (!confirm("Proses ini akan membuat akun login (Supabase Auth) untuk SEMUA Guru dan Siswa yang ada di database. Lanjutkan?")) return;
      
      setIsAuthSyncing(true);
      setAuthSyncProgress(0);
      setAuthSyncLogs([]);
      
      try {
          const total = teachers.length + students.length;
          let current = 0;
          const newLogs: string[] = [];

          // Sync Teachers
          newLogs.push(`[${new Date().toLocaleTimeString()}] Memulai sinkronisasi Guru...`);
          const teacherRes = await createAuthUsers(teachers, 'teacher');
          current += teachers.length;
          setAuthSyncProgress(Math.round((current / total) * 100));
          newLogs.push(`[${new Date().toLocaleTimeString()}] Guru: ${teacherRes.count} Sukses, ${teacherRes.errors.length} Warning.`);

          // Sync Students
          newLogs.push(`[${new Date().toLocaleTimeString()}] Memulai sinkronisasi Siswa...`);
          const studentRes = await createAuthUsers(students, 'student');
          current += students.length;
          setAuthSyncProgress(100);
          newLogs.push(`[${new Date().toLocaleTimeString()}] Siswa: ${studentRes.count} Sukses, ${studentRes.errors.length} Warning.`);
          newLogs.push(`[${new Date().toLocaleTimeString()}] Selesai. Total User: ${total}`);

          setAuthSyncLogs(newLogs);
          // alert("Sinkronisasi Selesai!");

      } catch (e: any) {
          setAuthSyncLogs(p => [...p, `[ERROR] ${e.message}`]);
          alert("Error Sync: " + e.message);
      } finally {
          setIsAuthSyncing(false);
      }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !importType) return;
      setLoading(true);
      try {
          const text = await file.text();
          let parsedData = parseCSV(text);
          if (parsedData.length === 0) throw new Error("File kosong atau format salah.");

          let tableName = '';
          let primaryKey = ''; 
          let dataToUpsert: any[] = [];
          const validationErrors: string[] = [];

          if (importType === 'student') {
              tableName = 'students';
              primaryKey = 'nisn';
              parsedData.forEach((row: any, index: number) => {
                  const rowNum = index + 2;
                  if (!row.nisn) validationErrors.push(`Baris ${rowNum}: NISN Kosong`);
                  if (!row.name && !row['nama siswa']) validationErrors.push(`Baris ${rowNum}: Nama Kosong`);
                  dataToUpsert.push({
                      nisn: row.nisn,
                      nis: row.nis || '',
                      name: row.name || row['nama siswa'],
                      tempat_lahir: row.tempat_lahir || '',
                      tanggal_lahir: formatDateForDB(row.tanggal_lahir || row['tgl lahir']),
                      nama_ayah: row.nama_ayah || '',
                      nama_ibu: row.nama_ibu || '',
                      class_name: row.class_name || row['kelas'] || row['class'] || '',
                      status: 'Active',
                      password: row.password || 'siswa'
                  });
              });
          } else if (importType === 'teacher') {
              tableName = 'teachers';
              primaryKey = 'nip';
              parsedData.forEach((row: any, index: number) => {
                  const rowNum = index + 2;
                  if (!row.nip) validationErrors.push(`Baris ${rowNum}: NIP Kosong`);
                  dataToUpsert.push({
                      nip: row.nip,
                      name: row.name,
                      jenis_kelamin: row.jenis_kelamin || 'P',
                      subject: row.subject || '',
                      password: row.password || 'guru',
                      status: 'Active'
                  });
              });
          } else if (importType === 'schedule') {
              tableName = 'schedules';
              dataToUpsert = parsedData;
          }

          if (validationErrors.length > 0) {
              setImportResult({
                  isOpen: true, status: 'error', title: 'Validasi Gagal', message: 'Data tidak lengkap.', details: validationErrors
              });
              setLoading(false);
              return;
          }

          let finalData = dataToUpsert;
          if (primaryKey) {
              const map = new Map();
              dataToUpsert.forEach(item => {
                  if (item[primaryKey]) {
                      map.set(item[primaryKey], item); 
                  }
              });
              finalData = Array.from(map.values());
          }

          const { error } = await supabase.from(tableName).upsert(finalData, { onConflict: primaryKey || undefined });
          if (error) throw error;

          let authMessage = '';
          if (importType === 'student' || importType === 'teacher') {
              const authRes = await createAuthUsers(finalData, importType);
              if (!authRes.success) {
                  authMessage = ` (Auth Warning: ${authRes.error})`;
              } else {
                  authMessage = ` (${authRes.count} User Auth dibuat)`;
              }
          }

          setImportResult({ 
              isOpen: true, 
              status: 'success', 
              title: 'Import Berhasil', 
              message: `Sukses menyimpan ${finalData.length} data ke Database.${authMessage}`, 
              details: [] 
          });
          
          await fetchData();

      } catch (err: any) {
          setImportResult({ isOpen: true, status: 'error', title: 'Error', message: getErrorMessage(err), details: [] });
      } finally {
          setLoading(false);
          setImportType(null);
      }
  };

  const handleSaveConfig = async () => {
      setSavingConfig(true);
      try {
          // Map state (camelCase) back to DB columns (snake_case)
          const dbPayload = {
              app_name: appConfig.appName,
              school_name: appConfig.schoolName,
              principal_name: appConfig.principalName,
              principal_nip: appConfig.principalNip,
              logo_url_1x1: appConfig.logoUrl1x1,
              logo_url_3x4: appConfig.logoUrl3x4,
              logo_url_4x3: appConfig.logoUrl4x3,
              letterhead_url: appConfig.letterHeadUrl,
              announcement_title: appConfig.announcementTitle,
              announcement_type: appConfig.announcementType,
              announcement_date: appConfig.announcementDate,
              announcement_time: appConfig.announcementTime,
              announcement_desc: appConfig.announcementDesc,
              announcement_color: appConfig.announcementColor
          };

          // Upsert to app_config table. Assuming ID 1 or existing ID.
          const { error } = await supabase.from('app_config').upsert({
              id: appConfig.id || 1, // Ensure we update the correct row
              ...dbPayload
          });

          if (error) throw error;

          alert("Konfigurasi berhasil disimpan dan disinkronkan!");
      } catch (e: any) {
          console.error("Save config error:", e);
          alert("Gagal menyimpan konfigurasi: " + e.message);
      } finally {
          setSavingConfig(false);
      }
  };

  const handleDelete = async (id: number, type: string) => {
      if(!confirm("Yakin ingin menghapus data ini dari Database?")) return;
      
      const tableName = type === 'student' ? 'students' : type === 'teacher' ? 'teachers' : 'schedules';
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      
      if (error) {
          alert("Gagal menghapus: " + error.message);
      } else {
          if(type === 'student') setStudents(prev => prev.filter(p => p.id !== id));
          if(type === 'teacher') setTeachers(prev => prev.filter(p => p.id !== id));
          if(type === 'schedule') setSchedules(prev => prev.filter(p => p.id !== id));
      }
  };

  const handleAddClick = (type: 'student' | 'teacher' | 'schedule') => {
      setEditingItem(null);
      setModalType(type);
      setScheduleForm({ selectedHours: [], selectedSubject: '', isEkstra: false, customSubject: '' });
      setTeacherSubjects([]); 
      setIsModalOpen(true);
  };

  const handleEditClick = (item: any, type: 'student' | 'teacher' | 'schedule') => {
      setEditingItem(item);
      setModalType(type);
      
      if (type === 'schedule') {
          const timeStr = item.time.replace('Jam Ke-', '');
          const hours = timeStr.includes(',') ? timeStr.split(', ').map((s: string) => parseInt(s)) : [parseInt(timeStr)];
          const isStd = STANDARD_SUBJECTS.includes(item.subject);
          setScheduleForm({
              selectedHours: hours.filter((n: number) => !isNaN(n)),
              selectedSubject: isStd ? item.subject : '',
              isEkstra: !isStd,
              customSubject: !isStd ? item.subject : ''
          });
      } else if (type === 'teacher') {
          const subjects = item.subject ? item.subject.split(',').map((s: string) => s.trim()) : [];
          setTeacherSubjects(subjects);
      }
      setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const formJson = Object.fromEntries(formData.entries());
      
      let table = '';
      let payload: any = {};

      if (modalType === 'student') {
          table = 'students';
          payload = {
              name: formJson.name,
              nis: formJson.nis,
              nisn: formJson.nisn,
              tempat_lahir: formJson.tempat_lahir,
              tanggal_lahir: formJson.tanggal_lahir, 
              nama_ayah: formJson.nama_ayah,
              nama_ibu: formJson.nama_ibu,
              class_name: formJson.class,
              status: formJson.status,
              password: formJson.password
          };
      } else if (modalType === 'teacher') {
          table = 'teachers';
          const subjects = teacherSubjects.join(', ');

          payload = {
              name: formJson.name,
              nip: formJson.nip,
              jenis_kelamin: formJson.jenis_kelamin, 
              jenis_guru: formJson.jenis_guru, 
              subject: subjects,
              status: formJson.status,
              password: formJson.password,
              wali_kelas: formJson.wali_kelas
          };
      } else if (modalType === 'schedule') {
          table = 'schedules';
          const hours = scheduleForm.selectedHours.sort((a,b)=>a-b).join(', ');
          const subject = scheduleForm.isEkstra ? scheduleForm.customSubject : scheduleForm.selectedSubject;
          payload = {
              day: formJson.day,
              time: `Jam Ke-${hours}`,
              class_name: formJson.class,
              subject: subject,
              teacher_name: formJson.teacher 
          };
      }

      try {
        let dbError = null;
        let upsertedData = null;

        if (editingItem) {
            const { data, error: err } = await supabase.from(table).update(payload).eq('id', editingItem.id).select();
            dbError = err;
            upsertedData = data;
        } else {
            const { data, error: err } = await supabase.from(table).insert(payload).select();
            dbError = err;
            upsertedData = data;
        }

        if (dbError) throw dbError;

        if (!editingItem && (modalType === 'student' || modalType === 'teacher') && serviceRoleKey) {
             await createAuthUsers(upsertedData || [payload], modalType);
        }

        setIsModalOpen(false);
        fetchData();
        alert('Data berhasil disimpan ke database!');
      } catch (err: any) {
        const msg = getErrorMessage(err);
        alert('Gagal menyimpan: ' + msg);
      }
  };

  const toggleTeacherSubject = (subject: string) => {
      setTeacherSubjects(prev => 
          prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
      );
  };

  // Helper for Finance
  const handleFinanceSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!financeForm.studentId) return alert("Pilih siswa terlebih dahulu");
      
      const student = students.find(s => s.id.toString() === financeForm.studentId);
      const isDeposit = financeForm.transactionType === 'deposit';
      
      let amount = 0;
      let description = '';
      let type = '';

      if (isDeposit) {
          const waste = wasteTypes.find(w => w.id === Number(financeForm.wasteTypeId));
          const weight = parseFloat(financeForm.weight);
          if (!waste || isNaN(weight)) return alert("Data sampah tidak valid");
          
          amount = waste.price_per_kg * weight;
          type = waste.name;
          description = `Setor ${weight}kg ${waste.name}`;
      } else {
          // Withdraw
          amount = parseFloat(financeForm.withdrawAmount);
          if (isNaN(amount) || amount <= 0) return alert("Nominal tidak valid");
          type = financeForm.withdrawItem;
          description = `Penarikan: ${financeForm.withdrawItem}`;
      }

      const payload: any = {
          student_id: parseInt(financeForm.studentId),
          student_name: student?.name,
          type: type,
          weight: isDeposit ? parseFloat(financeForm.weight) : 0,
          amount: amount,
          status: isDeposit ? 'Deposit' : 'Withdraw', // or 'Purchase' logic if needed
          date: new Date().toISOString().split('T')[0],
          description: description // Additional field if DB supports it, otherwise generic
      };

      try {
          const { error } = await supabase.from('trash_transactions').insert(payload);
          if (error) throw error;
          
          alert("Transaksi berhasil disimpan!");
          setFinanceForm({ ...financeForm, weight: '', withdrawAmount: '', notes: '' });
          fetchData(); // Refresh transactions
      } catch (err: any) {
          alert("Gagal menyimpan transaksi: " + err.message);
      }
  };

  // Helper for Preview Theme
  const getPreviewTheme = (color: string) => {
    switch(color) {
      case 'blue': return { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconText: 'text-blue-600', text: 'text-blue-600', accent: 'bg-blue-600' };
      case 'green': return { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-100', iconText: 'text-green-600', text: 'text-green-600', accent: 'bg-green-600' };
      case 'pink': return { bg: 'bg-pink-50', border: 'border-pink-100', iconBg: 'bg-pink-100', iconText: 'text-pink-600', text: 'text-pink-600', accent: 'bg-pink-600' };
      case 'purple': return { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', iconText: 'text-purple-600', text: 'text-purple-600', accent: 'bg-purple-600' };
      default: return { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconText: 'text-amber-700', text: 'text-amber-700', accent: 'bg-amber-500' };
    }
  };

  // --- RENDERERS ---

  const renderOverview = () => {
      // Calculate Real Class Stats
      const classCounts: Record<string, number> = {};
      students.forEach(s => {
          const c = s.class_name || 'Unassigned';
          classCounts[c] = (classCounts[c] || 0) + 1;
      });

      // Sort class names nicely
      const sortedClasses = Object.keys(classCounts).sort();

      return (
      <div className="space-y-6 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="text-gray-500 text-xs font-bold uppercase">Total Siswa</div><div className="text-3xl font-black text-gray-800">{students.length}</div></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="text-gray-500 text-xs font-bold uppercase">Total Guru</div><div className="text-3xl font-black text-gray-800">{teachers.length}</div></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="text-gray-500 text-xs font-bold uppercase">Total Jadwal</div><div className="text-3xl font-black text-indigo-600">{schedules.length}</div></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={fetchData}>
                  <div><div className="text-gray-500 text-xs font-bold uppercase">Sinkronisasi</div><div className="text-sm font-bold text-green-600">{loading ? 'Loading...' : 'Data Terupdate'}</div></div>
                  <RefreshCw className={`w-6 h-6 text-green-600 ${loading ? 'animate-spin' : ''}`} />
              </div>
          </div>

          {/* Class Stats Grid */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><School className="w-5 h-5 text-indigo-600"/> Statistik Kelas (Realtime)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {sortedClasses.length > 0 ? sortedClasses.map((cls) => (
                      <div key={cls} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                          <div className="text-xs text-gray-500 font-bold uppercase mb-1">{cls}</div>
                          <div className="text-xl font-black text-indigo-700">{classCounts[cls]} <span className="text-[10px] font-normal text-gray-400">Siswa</span></div>
                      </div>
                  )) : <div className="col-span-full text-gray-400 text-sm text-center py-4">Belum ada data siswa.</div>}
              </div>
          </div>

          {/* MOBILE ONLY MENU GRID */}
          <div className="block md:hidden mt-6">
              <h3 className="font-bold text-gray-800 mb-4 px-1">Menu Cepat</h3>
              <div className="grid grid-cols-3 gap-3">
                  {MENU_CONFIG.filter(m => m.id !== 'overview').map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => setActiveView(item.id)}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform"
                      >
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                              <item.icon className="w-5 h-5"/>
                          </div>
                          <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{item.label}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>
      );
  };

  const renderUsersAuth = () => (
      <div className="space-y-6 animate-fade-in-up">
          {/* Header Card - Jos Jis Style */}
          <div className="bg-[#0F172A] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-slate-700">
              {/* Background Accents */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full -mr-32 -mt-32 blur-[100px] animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-600/10 rounded-full -ml-20 -mb-20 blur-[80px]"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                      <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/50">
                              <Shield className="w-6 h-6 text-indigo-400"/>
                          </div>
                          <h3 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                              AUTHENTICATION CENTER
                          </h3>
                      </div>
                      <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                          Sistem manajemen akses terpusat berbasis Supabase Auth. 
                          Sinkronisasi data siswa & guru ke server autentikasi dengan keamanan enkripsi tingkat tinggi.
                      </p>
                  </div>

                  {/* Stats Badges */}
                  <div className="flex gap-3">
                      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-4 rounded-2xl flex flex-col items-center min-w-[100px]">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
                          <span className="text-2xl font-mono font-bold text-white">{students.length + teachers.length}</span>
                      </div>
                      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-4 rounded-2xl flex flex-col items-center min-w-[100px]">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</span>
                          <div className="flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                              <span className="text-xs font-bold text-green-400">ONLINE</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Action Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sync Control */}
              <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                      <h4 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                          <RefreshCw className="w-5 h-5 text-indigo-600"/> Sync Database
                      </h4>
                      <p className="text-xs text-slate-500 mb-6">
                          Generate akun login otomatis untuk Guru (NIP) dan Siswa (NISN) yang belum terdaftar.
                      </p>
                  </div>
                  
                  <div className="space-y-4">
                      {isAuthSyncing && (
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{width: `${authSyncProgress}%`}}></div>
                          </div>
                      )}
                      
                      <button 
                          onClick={handleSyncAuth}
                          disabled={isAuthSyncing}
                          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group ${isAuthSyncing ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'}`}
                      >
                          {/* Button Shine Effect */}
                          {!isAuthSyncing && <div className="absolute top-0 -left-full w-full h-full bg-white/20 transform -skew-x-12 group-hover:translate-x-[200%] transition-transform duration-1000"></div>}
                          
                          {isAuthSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <UserCheck className="w-5 h-5"/>}
                          {isAuthSyncing ? `Processing ${authSyncProgress}%` : 'START SYNC ENGINE'}
                      </button>
                  </div>
              </div>

              {/* Terminal Logs */}
              <div className="lg:col-span-2 bg-[#1E293B] rounded-3xl p-6 shadow-inner border border-slate-700 flex flex-col font-mono relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                      <Terminal className="w-4 h-4 text-green-400"/>
                      <span className="text-xs font-bold text-slate-400">SYSTEM LOGS</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[200px] text-xs space-y-1">
                      {authSyncLogs.length === 0 ? (
                          <div className="text-slate-600 italic">Waiting for command...</div>
                      ) : (
                          authSyncLogs.map((log, i) => (
                              <div key={i} className="flex gap-2 animate-fade-in-up">
                                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                                  <span className={log.includes('Error') ? 'text-red-400' : log.includes('Sukses') ? 'text-green-400' : 'text-blue-300'}>
                                      {log}
                                  </span>
                              </div>
                          ))
                      )}
                      {isAuthSyncing && <div className="text-green-400 animate-pulse">_ processing request...</div>}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderStudents = () => (
      <div className="space-y-6 animate-fade-in-up">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                  <div className="flex items-center gap-3 mb-2 opacity-80"><GraduationCap className="w-5 h-5"/> Total Siswa</div>
                  <div className="text-4xl font-black">{students.length}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Aktif</div>
                      <div className="text-2xl font-black text-slate-800">{students.filter(s => s.status === 'Active').length}</div>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold"><CheckCircle className="w-5 h-5"/></div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Kelas</div>
                      <div className="text-2xl font-black text-slate-800">{[...new Set(students.map(s => s.class_name))].length}</div>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold"><School className="w-5 h-5"/></div>
              </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Cari nama atau NISN..."/>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => downloadTemplate('student')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200"><Download className="w-5 h-5"/></button>
                  <button onClick={() => handleImportClick('student')} className="p-2 text-green-600 hover:bg-green-50 rounded-xl border border-green-200 bg-green-50"><Upload className="w-5 h-5"/></button>
                  <button onClick={() => handleAddClick('student')} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2"><Plus className="w-5 h-5"/> Baru</button>
              </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                          <tr>
                              <th className="px-6 py-4">Siswa</th>
                              <th className="px-6 py-4">NISN/NIS</th>
                              <th className="px-6 py-4">Kelas</th>
                              <th className="px-6 py-4">Orang Tua</th>
                              <th className="px-6 py-4 text-right">Aksi</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.nisn.includes(searchTerm)).map((s, i) => (
                              <tr key={s.id} className="hover:bg-slate-50 group transition-colors">
                                  <td className="px-6 py-4 flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{s.name.substring(0,2).toUpperCase()}</div>
                                      <div>
                                          <div className="font-bold text-slate-800">{s.name}</div>
                                          <div className="text-xs text-slate-400">{s.tempat_lahir}, {s.tanggal_lahir}</div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-slate-600">{s.nisn} <span className="text-slate-300">/</span> {s.nis || '-'}</td>
                                  <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-blue-50 text-blue-600 font-bold text-xs">{s.class_name}</span></td>
                                  <td className="px-6 py-4 text-slate-600">{s.nama_ayah}</td>
                                  <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleEditClick(s, 'student')} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit className="w-4 h-4"/></button>
                                      <button onClick={() => handleDelete(s.id, 'student')} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  const renderTeachers = () => (
      <div className="space-y-6 animate-fade-in-up">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-200">
                  <div className="flex items-center gap-3 mb-2 opacity-80"><Users className="w-5 h-5"/> Total Guru</div>
                  <div className="text-4xl font-black">{teachers.length}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Wali Kelas</div>
                      <div className="text-2xl font-black text-slate-800">{teachers.filter(t => t.wali_kelas !== '-' && t.wali_kelas).length}</div>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold"><BookOpen className="w-5 h-5"/></div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                      <div className="text-xs font-bold text-slate-400 uppercase">Guru Mapel</div>
                      <div className="text-2xl font-black text-slate-800">{teachers.filter(t => t.jenis_guru === 'Guru Mapel').length}</div>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold"><Layers className="w-5 h-5"/></div>
              </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all" placeholder="Cari nama guru atau NIP..."/>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => downloadTemplate('teacher')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200"><Download className="w-5 h-5"/></button>
                  <button onClick={() => handleImportClick('teacher')} className="p-2 text-green-600 hover:bg-green-50 rounded-xl border border-green-200 bg-green-50"><Upload className="w-5 h-5"/></button>
                  <button onClick={() => handleAddClick('teacher')} className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-lg shadow-teal-200 flex items-center gap-2"><Plus className="w-5 h-5"/> Tambah</button>
              </div>
          </div>

          {/* Cards Grid for Teachers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (
                  <div key={t.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${t.status === 'Active' ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                      <div className="flex justify-between items-start mb-4 pl-2">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl">
                              {t.jenis_kelamin === 'P' ? '👩‍🏫' : '👨‍🏫'}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditClick(t, 'teacher')} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"><Edit className="w-4 h-4"/></button>
                              <button onClick={() => handleDelete(t.id, 'teacher')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                          </div>
                      </div>
                      <div className="pl-2">
                          <h4 className="font-bold text-slate-800 text-lg mb-1 leading-tight">{t.name}</h4>
                          <div className="text-xs font-mono text-slate-400 mb-3 bg-slate-50 inline-block px-2 py-1 rounded">NIP. {t.nip}</div>
                          <div className="flex flex-wrap gap-2">
                              {t.wali_kelas && t.wali_kelas !== '-' && <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">Wali Kelas {t.wali_kelas}</span>}
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{t.jenis_guru}</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderSchedule = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-gradient-to-r from-violet-600 to-indigo-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                  <h2 className="text-2xl font-black mb-2">Jadwal Pelajaran</h2>
                  <p className="text-indigo-100 opacity-90 max-w-lg">Atur jadwal KBM mingguan untuk seluruh kelas dan guru dengan mudah.</p>
              </div>
              <div className="flex gap-2 relative z-10">
                  <button onClick={() => downloadTemplate('schedule')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 backdrop-blur-sm text-sm font-bold flex items-center gap-2"><Download className="w-4 h-4"/> Template</button>
                  <button onClick={() => handleImportClick('schedule')} className="px-4 py-2 bg-white text-indigo-600 rounded-xl shadow-lg hover:bg-indigo-50 text-sm font-bold flex items-center gap-2"><Upload className="w-4 h-4"/> Import CSV</button>
                  <button onClick={() => handleAddClick('schedule')} className="px-4 py-2 bg-emerald-400 text-emerald-900 rounded-xl shadow-lg hover:bg-emerald-300 text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4"/> Tambah Manual</button>
              </div>
              {/* Decor */}
              <CalendarRange className="absolute -right-6 -bottom-6 w-40 h-40 text-white opacity-10 rotate-12"/>
          </div>

          {/* Daily Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => {
                  const daySchedules = schedules.filter(s => s.day === day).sort((a,b) => {
                      const getJam = (t: string) => parseInt(t.replace(/\D/g,'')) || 0;
                      return getJam(a.time) - getJam(b.time);
                  });
                  
                  return (
                      <div key={day} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
                          <div className={`p-4 font-black text-center text-white ${day === 'Senin' ? 'bg-violet-500' : 'bg-slate-400'}`}>
                              {day.toUpperCase()}
                          </div>
                          <div className="p-4 space-y-3 flex-1 bg-slate-50/50">
                              {daySchedules.length === 0 ? (
                                  <div className="text-center py-8 text-slate-300 text-sm italic">Belum ada jadwal</div>
                              ) : (
                                  daySchedules.map((sch) => (
                                      <div key={sch.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative">
                                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                              <button onClick={() => handleEditClick(sch, 'schedule')} className="p-1 bg-slate-100 rounded hover:bg-blue-100 text-blue-600"><Edit className="w-3 h-3"/></button>
                                              <button onClick={() => handleDelete(sch.id, 'schedule')} className="p-1 bg-slate-100 rounded hover:bg-red-100 text-red-600"><Trash2 className="w-3 h-3"/></button>
                                          </div>
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 font-bold text-xs flex items-center justify-center text-center leading-tight px-1 border border-violet-100">
                                                  {sch.time.replace('Jam Ke-','Jam ')}
                                              </div>
                                              <div>
                                                  <div className="font-bold text-slate-800 text-sm">{sch.subject}</div>
                                                  <div className="text-xs text-slate-500 flex items-center gap-2">
                                                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{sch.class_name}</span>
                                                      <span className="truncate max-w-[100px]">{sch.teacher_name}</span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
  );

  const renderGradesRecap = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                  <div className="flex items-center gap-2">
                      <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><FileSpreadsheet className="w-6 h-6"/></div>
                      <h3 className="font-bold text-lg text-slate-800">Rekapitulasi Nilai</h3>
                  </div>
                  <div className="flex gap-4">
                      <select 
                          value={gradeFilterClass} 
                          onChange={(e) => setGradeFilterClass(e.target.value)}
                          className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700"
                      >
                          {['1A', '1B', '2A', '2B', '3A', '4A', '5A', '6A'].map(c => <option key={c} value={c}>Kelas {c}</option>)}
                      </select>
                      <select 
                          value={gradeFilterSubject} 
                          onChange={(e) => setGradeFilterSubject(e.target.value)}
                          className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-700"
                      >
                          {STANDARD_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                          <tr>
                              <th className="px-6 py-4 border-b">Nama Siswa</th>
                              {/* Dynamic PH Headers */}
                              {Array.from({ length: phCount }).map((_, i) => (
                                  <th key={i} className="px-4 py-4 text-center border-b w-16">PH{i + 1}</th>
                              ))}
                              <th className="px-2 py-4 border-b w-12 text-center">
                                  <button onClick={() => setPhCount(p => Math.min(p + 1, 8))} className="text-orange-600 hover:text-orange-800 bg-orange-50 p-1 rounded transition-colors"><Plus className="w-3 h-3"/></button>
                              </th>
                              <th className="px-6 py-4 text-center border-b border-l">PTS</th>
                              <th className="px-6 py-4 text-center border-b">PAS</th>
                              <th className="px-6 py-4 text-center border-b bg-orange-50 font-bold text-orange-700">NA</th>
                          </tr>
                      </thead>
                      <tbody>
                          {grades.filter(g => g.class_name === gradeFilterClass && g.subject === gradeFilterSubject).length === 0 ? (
                              <tr><td colSpan={phCount + 5} className="p-12 text-center text-slate-400 italic">Belum ada data nilai untuk filter ini.</td></tr>
                          ) : (
                              grades.filter(g => g.class_name === gradeFilterClass && g.subject === gradeFilterSubject).map(g => {
                                  // Mock PH splitting
                                  const phVal = Array.isArray(g.ph_scores) ? g.ph_scores[0] : 0; 
                                  const na = Math.round(((phVal || 0) + (g.pts || 0) + (g.pas || 0)) / 3);
                                  
                                  return (
                                  <tr key={g.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-3 font-bold text-slate-700">{g.student_name}</td>
                                      {Array.from({ length: phCount }).map((_, i) => (
                                          <td key={i} className="px-4 py-3 text-center text-slate-600">
                                              {i === 0 ? (Array.isArray(g.ph_scores) ? g.ph_scores[0] : '-') : '-'}
                                          </td>
                                      ))}
                                      <td className="px-2 py-3 text-center"></td>
                                      <td className="px-6 py-3 text-center border-l border-slate-100">{g.pts}</td>
                                      <td className="px-6 py-3 text-center">{g.pas}</td>
                                      <td className="px-6 py-3 text-center font-bold text-orange-700 bg-orange-50/50">
                                          {na}
                                      </td>
                                  </tr>
                                  );
                              })
                          )}
                      </tbody>
                  </table>
                  <div className="p-4 border-t border-slate-100 flex justify-end">
                      {phCount > 1 && (
                          <button onClick={() => setPhCount(p => Math.max(p - 1, 1))} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                              <MinusCircle className="w-3 h-3"/> Kurangi Kolom PH
                          </button>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderAppConfig = () => {
    const previewTheme = getPreviewTheme(appConfig.announcementColor);
    const date = new Date(appConfig.announcementDate);
    const dateDisplay = isNaN(date.getTime()) ? { day: '--', month: '---' } : {
        day: date.getDate(),
        month: date.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black mb-2">Identitas & Konfigurasi</h2>
                        <p className="text-blue-100 max-w-xl">Atur informasi sekolah, logo, dan pengumuman yang tampil di halaman publik secara realtime.</p>
                    </div>
                    <button onClick={handleSaveConfig} disabled={savingConfig} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-colors flex items-center gap-2">
                        {savingConfig ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} Simpan Perubahan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Forms */}
                <div className="lg:col-span-7 space-y-8">
                    {/* School Identity */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                            <School className="w-5 h-5 text-indigo-500"/> Profil Sekolah
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Nama Aplikasi</label>
                                <input value={appConfig.appName} onChange={(e) => setAppConfig({...appConfig, appName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Nama Sekolah</label>
                                <input value={appConfig.schoolName} onChange={(e) => setAppConfig({...appConfig, schoolName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Kepala Sekolah</label>
                                <input value={appConfig.principalName} onChange={(e) => setAppConfig({...appConfig, principalName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">NIP KS</label>
                                <input value={appConfig.principalNip} onChange={(e) => setAppConfig({...appConfig, principalNip: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            
                            <div className="space-y-1 col-span-full">
                                <label className="text-xs font-bold text-slate-400 uppercase">URL Logo (Utama)</label>
                                <input value={appConfig.logoUrl1x1} onChange={(e) => setAppConfig({...appConfig, logoUrl1x1: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div className="space-y-1 col-span-full">
                                <label className="text-xs font-bold text-slate-400 uppercase">URL Kop Surat (Laporan)</label>
                                <input value={appConfig.letterHeadUrl} onChange={(e) => setAppConfig({...appConfig, letterHeadUrl: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                        </div>
                    </div>

                    {/* Announcement Form */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-orange-500"/> Edit Pengumuman
                        </h3>
                        <div className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Judul Pengumuman</label>
                                <input value={appConfig.announcementTitle} onChange={(e) => setAppConfig({...appConfig, announcementTitle: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Contoh: Libur Awal Puasa"/>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Tanggal</label>
                                    <input type="date" value={appConfig.announcementDate} onChange={(e) => setAppConfig({...appConfig, announcementDate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"/>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Waktu / Jam</label>
                                    <input value={appConfig.announcementTime} onChange={(e) => setAppConfig({...appConfig, announcementTime: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"/>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Isi Pengumuman</label>
                                <textarea value={appConfig.announcementDesc} onChange={(e) => setAppConfig({...appConfig, announcementDesc: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-orange-500" rows={4} placeholder="Deskripsi lengkap pengumuman..."/>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Tema Warna Widget</label>
                                <div className="flex gap-3">
                                    {['yellow', 'blue', 'green', 'pink', 'purple'].map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => setAppConfig({...appConfig, announcementColor: c as any})}
                                            className={`w-10 h-10 rounded-full border-2 transition-all transform hover:scale-110 ${appConfig.announcementColor === c ? 'border-slate-600 scale-110 ring-2 ring-offset-2 ring-slate-200' : 'border-transparent'}`}
                                            style={{ backgroundColor: c === 'yellow' ? '#f59e0b' : c === 'blue' ? '#3b82f6' : c === 'green' ? '#10b981' : c === 'pink' ? '#ec4899' : '#8b5cf6' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div className="lg:col-span-5">
                    <div className="sticky top-8">
                        <div className="bg-slate-800 rounded-[2.5rem] p-4 shadow-2xl border-4 border-slate-700">
                            <div className="bg-slate-100 rounded-[2rem] overflow-hidden min-h-[500px] relative">
                                {/* Fake Mobile Header */}
                                <div className="h-8 bg-slate-200 w-full flex justify-center items-center gap-2 mb-4">
                                    <div className="w-16 h-4 bg-slate-300 rounded-full"></div>
                                </div>
                                
                                {/* Preview Content */}
                                <div className="p-4 space-y-4">
                                    <div className="text-center mb-6">
                                        <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Live Preview</h4>
                                        <p className="text-[10px] text-slate-400">Tampilan di HP Siswa/Wali Murid</p>
                                    </div>

                                    {/* The Widget */}
                                    <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 relative overflow-hidden">
                                        <div className="flex items-center gap-3 mb-4 relative z-10">
                                            <div className={`p-2 rounded-xl ${previewTheme.iconBg} ${previewTheme.iconText}`}><Megaphone className="w-5 h-5"/></div>
                                            <h3 className="font-black text-gray-800 text-sm leading-tight">Pengumuman Sekolah</h3>
                                        </div>
                                        
                                        {appConfig.announcementTitle ? (
                                            <div className="relative z-10">
                                                <div className="flex gap-3 items-start">
                                                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl ${previewTheme.bg} ${previewTheme.text} shrink-0 border-2 ${previewTheme.border}`}>
                                                        <span className="text-lg font-black leading-none">{dateDisplay.day}</span>
                                                        <span className="text-[8px] font-bold uppercase tracking-wider">{dateDisplay.month}</span>
                                                    </div>
                                                    <div className="pt-0.5 flex-1">
                                                        <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${previewTheme.text} bg-slate-50 inline-block px-1.5 py-0.5 rounded-md`}>
                                                            {appConfig.announcementType || 'Info'}
                                                        </div>
                                                        <h4 className="font-bold text-gray-800 text-xs mb-1 leading-snug">{appConfig.announcementTitle}</h4>
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mb-2">
                                                            <Clock className="w-3 h-3"/>
                                                            <span>{appConfig.announcementTime || '-'}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                            {appConfig.announcementDesc || '...'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-gray-300 text-xs italic">Tidak ada pengumuman aktif</div>
                                        )}
                                        {/* Decor */}
                                        <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10 ${previewTheme.accent}`}></div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

  const renderFinance = () => (
      <div className="space-y-6 animate-fade-in-up">
          {/* Top Wallet Summary */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                      <p className="text-emerald-100 font-bold uppercase text-xs mb-1">Total Saldo Bank Sampah</p>
                      <h2 className="text-4xl font-black">Rp {wasteTransactions.reduce((acc, curr) => curr.status === 'Deposit' ? acc + curr.amount : acc - curr.amount, 0).toLocaleString()}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-2xl"><ArrowUpRight className="w-6 h-6"/></div>
                      <div>
                          <p className="text-emerald-100 font-bold uppercase text-xs">Pemasukan</p>
                          <p className="text-xl font-bold">Rp {wasteTransactions.filter(t => t.status === 'Deposit').reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-2xl"><ArrowUpRight className="w-6 h-6 rotate-180"/></div>
                      <div>
                          <p className="text-emerald-100 font-bold uppercase text-xs">Penarikan</p>
                          <p className="text-xl font-bold">Rp {wasteTransactions.filter(t => t.status !== 'Deposit').reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</p>
                      </div>
                  </div>
              </div>
              <Recycle className="absolute -right-10 -bottom-10 w-64 h-64 text-emerald-900 opacity-10 rotate-12"/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Form */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-600"/> Input Transaksi</h3>
                  <form onSubmit={handleFinanceSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cari Siswa</label>
                          <select 
                              value={financeForm.studentId}
                              onChange={e => setFinanceForm({...financeForm, studentId: e.target.value})}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                              required
                          >
                              <option value="">-- Pilih Siswa --</option>
                              {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.class_name}</option>)}
                          </select>
                      </div>

                      <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button type="button" onClick={() => setFinanceForm({...financeForm, transactionType: 'deposit'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${financeForm.transactionType === 'deposit' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'}`}>Setor</button>
                          <button type="button" onClick={() => setFinanceForm({...financeForm, transactionType: 'withdraw'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${financeForm.transactionType === 'withdraw' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Tarik</button>
                      </div>

                      {financeForm.transactionType === 'deposit' ? (
                          <>
                              <select 
                                  value={financeForm.wasteTypeId}
                                  onChange={e => setFinanceForm({...financeForm, wasteTypeId: parseInt(e.target.value)})}
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                              >
                                  {wasteTypes.map(w => <option key={w.id} value={w.id}>{w.name} (Rp {w.price_per_kg}/kg)</option>)}
                              </select>
                              <input 
                                  type="number" step="0.1"
                                  value={financeForm.weight}
                                  onChange={e => setFinanceForm({...financeForm, weight: e.target.value})}
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                  placeholder="Berat (Kg)"
                                  required
                              />
                          </>
                      ) : (
                           <>
                              <select 
                                  value={financeForm.withdrawItem}
                                  onChange={e => setFinanceForm({...financeForm, withdrawItem: e.target.value})}
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                              >
                                  <option value="Uang Tunai">Uang Tunai</option>
                                  <option value="Buku Tulis">Buku Tulis</option>
                                  <option value="Pensil">Pensil</option>
                              </select>
                              <input 
                                  type="number"
                                  value={financeForm.withdrawAmount}
                                  onChange={e => setFinanceForm({...financeForm, withdrawAmount: e.target.value})}
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                  placeholder="Nominal (Rp)"
                                  required
                              />
                          </>
                      )}

                      <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors">
                          Simpan Transaksi
                      </button>
                  </form>
              </div>

              {/* History Table */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                  <h3 className="font-bold text-slate-800 text-lg mb-6">Riwayat Terbaru</h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[400px]">
                      {wasteTransactions.map((tx) => (
                          <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-slate-100">
                              <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-full ${tx.status === 'Deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                      {tx.status === 'Deposit' ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>}
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-800">{tx.student_name}</div>
                                      <div className="text-xs text-slate-500">{tx.date} • {tx.type}</div>
                                  </div>
                              </div>
                              <div className={`font-mono font-bold ${tx.status === 'Deposit' ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {tx.status === 'Deposit' ? '+' : '-'}Rp {tx.amount.toLocaleString()}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderLetters = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[500px]">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Mail className="w-6 h-6"/></div>
                  <div>
                      <h3 className="font-bold text-lg text-slate-800">Kotak Masuk Izin</h3>
                      <p className="text-xs text-slate-400">Permohonan izin sakit/kepentingan keluarga siswa.</p>
                  </div>
              </div>
              
              {permissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-10 h-10 text-slate-300"/></div>
                      <p className="text-slate-500 font-bold">Tidak ada permohonan izin baru.</p>
                      <p className="text-xs text-slate-400">Semua siswa masuk seperti biasa.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissions.map((p) => (
                          <div key={p.id} className="p-5 rounded-2xl border border-slate-200 hover:border-red-200 hover:bg-red-50/30 transition-all group">
                              <div className="flex justify-between items-start mb-3">
                                  <div>
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${p.type === 'Sakit' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{p.type}</span>
                                      <h4 className="font-bold text-slate-800 mt-2">{p.student_name}</h4>
                                      <p className="text-xs text-slate-500">Kelas {p.class_name}</p>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-xs font-bold text-slate-400">{p.date}</div>
                                  </div>
                              </div>
                              <p className="text-sm text-slate-600 italic mb-4 bg-white p-3 rounded-xl border border-slate-100">"{p.reason}"</p>
                              <div className="flex gap-2">
                                  <button className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">Tolak</button>
                                  <button className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">Setujui</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
  );

  const renderGoodDeeds = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-3xl p-8 text-white shadow-xl mb-6">
              <h2 className="text-2xl font-black flex items-center gap-3"><Star className="w-8 h-8 fill-yellow-300 text-yellow-300"/> Validasi Anak Hebat</h2>
              <p className="text-orange-100 opacity-90">Verifikasi laporan kegiatan positif siswa di rumah/sekolah.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goodDeeds.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">Belum ada laporan masuk.</div>
              ) : goodDeeds.map((g) => (
                  <div key={g.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                              {g.student_name.charAt(0)}
                          </div>
                          <div>
                              <div className="font-bold text-slate-800 text-sm">{g.student_name}</div>
                              <div className="text-xs text-slate-400">{g.class_name} • {g.time}</div>
                          </div>
                      </div>
                      <div className="flex-1 mb-4">
                          <div className="bg-slate-50 rounded-xl p-3 text-sm font-medium text-slate-700 border border-slate-100">
                              {g.activity}
                          </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t border-slate-50">
                          <button className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200 transition-colors">Abaikan</button>
                          <button className="flex-1 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-200">Validasi</button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderApiSettings = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-[#1E293B] rounded-3xl p-8 text-white shadow-2xl border border-slate-700 font-mono">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-700">
                  <Database className="w-6 h-6 text-green-400"/>
                  <h3 className="text-xl font-bold tracking-tight">System Configuration</h3>
              </div>
              
              <div className="space-y-6">
                  <div>
                      <h4 className="text-slate-400 text-xs uppercase font-bold mb-3">Supabase Connection</h4>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-[10px] text-slate-500 mb-1">PROJECT URL</label>
                              <input 
                                  type="text" 
                                  value={customSupabaseUrl} 
                                  onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-green-400 text-xs outline-none focus:border-green-500"
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] text-slate-500 mb-1">ANON KEY (PUBLIC)</label>
                              <input 
                                  type="password" 
                                  value={customSupabaseKey} 
                                  onChange={(e) => setCustomSupabaseKey(e.target.value)}
                                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-green-400 text-xs outline-none focus:border-green-500"
                              />
                          </div>
                          <div>
                              <label className="block text-[10px] text-slate-500 mb-1">SERVICE ROLE KEY (SECRET)</label>
                              <input 
                                  type="password" 
                                  value={serviceRoleKey} 
                                  onChange={(e) => setServiceRoleKey(e.target.value)}
                                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-red-400 text-xs outline-none focus:border-red-500"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                      <button onClick={handleSaveConfig} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors">
                          <Save className="w-4 h-4"/> SAVE CONFIGURATION
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
        )}

        {/* Sidebar */}
        <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#1E293B] text-white transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl flex flex-col`}>
            <div className="p-6 border-b border-slate-700 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                     <ShieldCheck className="w-6 h-6 text-white"/>
                </div>
                <div>
                    <h1 className="font-black text-xl tracking-tight">BISMA <span className="text-indigo-400">ADMIN</span></h1>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">School Management</p>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                {MENU_CONFIG.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => { setActiveView(item.id); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}/>
                        <span className="text-sm font-bold">{item.label}</span>
                        {activeView === item.id && <ChevronRight className="w-4 h-4 ml-auto"/>}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-bold text-sm"
                >
                    <LogOut className="w-5 h-5"/> Keluar Aplikasi
                </button>
            </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 md:ml-72 flex flex-col min-h-screen transition-all duration-300">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                     <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                         <Menu className="w-6 h-6"/>
                     </button>
                     <h2 className="text-xl font-black text-slate-800 hidden md:block">{MENU_CONFIG.find(m => m.id === activeView)?.label}</h2>
                 </div>

                 <div className="flex items-center gap-4">
                     <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                         <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                             A
                         </div>
                         <div className="hidden md:block pr-2 text-right">
                             <div className="text-xs font-bold text-slate-800">Administrator</div>
                             <div className="text-[10px] text-slate-500">Tata Usaha</div>
                         </div>
                     </div>
                 </div>
            </header>

            {/* Content Render */}
            <main className="p-4 md:p-8 flex-1 overflow-x-hidden">
                {activeView === 'overview' && renderOverview()}
                {activeView === 'app_config' && renderAppConfig()}
                {activeView === 'users_auth' && renderUsersAuth()}
                
                {activeView === 'students' && renderStudents()}
                {activeView === 'teachers' && renderTeachers()}
                {activeView === 'schedule' && renderSchedule()}
                {activeView === 'grades' && renderGradesRecap()}
                {activeView === 'finance' && renderFinance()}
                {activeView === 'letters' && renderLetters()}
                {activeView === 'good_deeds' && renderGoodDeeds()}
                {activeView === 'api_settings' && renderApiSettings()}

                {/* Placeholder for unimplemented views */}
                {!MENU_CONFIG.map(m => m.id).includes(activeView) && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                           <LayoutTemplate className="w-10 h-10 text-slate-400"/>
                        </div>
                        <h3 className="text-2xl font-black text-slate-300">Modul {activeView}</h3>
                        <p className="text-slate-400 font-medium">Fitur ini sedang dalam tahap pengembangan.</p>
                    </div>
                )}
            </main>
        </div>

        {/* Hidden Inputs */}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv"
        />

        {/* --- MODALS --- */}

        {/* Import Result Modal */}
        {importResult.isOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${importResult.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {importResult.status === 'success' ? <CheckCircle className="w-8 h-8"/> : <XCircle className="w-8 h-8"/>}
                    </div>
                    <h3 className="text-xl font-black text-center text-slate-800 mb-2">{importResult.title}</h3>
                    <p className="text-center text-slate-600 text-sm mb-6">{importResult.message}</p>
                    
                    {importResult.details && importResult.details.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-3 mb-6 max-h-40 overflow-y-auto text-xs text-slate-500 border border-slate-200">
                            <ul className="list-disc list-inside space-y-1">
                                {importResult.details.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </div>
                    )}
                    
                    <button onClick={() => setImportResult({...importResult, isOpen: false})} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">
                        Tutup
                    </button>
                </div>
            </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && modalType && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-xl text-slate-800">{editingItem ? 'Edit Data' : 'Tambah Data'} {modalType === 'student' ? 'Siswa' : modalType === 'teacher' ? 'Guru' : 'Jadwal'}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <form id="dataForm" onSubmit={handleSave} className="space-y-4">
                            {/* DYNAMIC FORM FIELDS BASED ON MODAL TYPE */}
                            {modalType === 'student' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">NISN <span className="text-red-500">*</span></label>
                                        <input name="nisn" required defaultValue={editingItem?.nisn} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap <span className="text-red-500">*</span></label>
                                        <input name="name" required defaultValue={editingItem?.name} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Kelas <span className="text-red-500">*</span></label>
                                        <select name="class" required defaultValue={editingItem?.class_name} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                            <option value="">Pilih...</option>
                                            {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Kelas 1A', 'Kelas 1B', 'Kelas 2A', 'Kelas 2B', 'Kelas 3A', 'Kelas 3B', 'Kelas 4A', 'Kelas 4B', 'Kelas 5A', 'Kelas 5B', 'Kelas 6A', 'Kelas 6B'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">NIS</label>
                                        <input name="nis" defaultValue={editingItem?.nis} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Tempat Lahir</label>
                                        <input name="tempat_lahir" defaultValue={editingItem?.tempat_lahir} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Tanggal Lahir</label>
                                        <input name="tanggal_lahir" type="date" defaultValue={editingItem?.tanggal_lahir} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nama Ayah</label>
                                        <input name="nama_ayah" defaultValue={editingItem?.nama_ayah} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nama Ibu</label>
                                        <input name="nama_ibu" defaultValue={editingItem?.nama_ibu} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Password Login</label>
                                        <input name="password" defaultValue={editingItem?.password || '123456'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                        <select name="status" defaultValue={editingItem?.status || 'Active'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                            <option value="Active">Aktif</option>
                                            <option value="Inactive">Non-Aktif</option>
                                            <option value="Graduated">Lulus</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {modalType === 'teacher' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">NIP / NIPPPK <span className="text-red-500">*</span></label>
                                        <input name="nip" required defaultValue={editingItem?.nip} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap <span className="text-red-500">*</span></label>
                                        <input name="name" required defaultValue={editingItem?.name} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Jenis Kelamin</label>
                                        <select name="jenis_kelamin" defaultValue={editingItem?.jenis_kelamin || 'P'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                            <option value="L">Laki-laki</option>
                                            <option value="P">Perempuan</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Jenis Guru</label>
                                        <select name="jenis_guru" defaultValue={editingItem?.jenis_guru || 'Guru Kelas'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                            <option value="Guru Kelas">Guru Kelas</option>
                                            <option value="Guru Mapel">Guru Mapel</option>
                                            <option value="Kepala Sekolah">Kepala Sekolah</option>
                                            <option value="Staff">Staff / Tendik</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Wali Kelas (Opsional)</label>
                                        <select name="wali_kelas" defaultValue={editingItem?.wali_kelas} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                            <option value="">Bukan Wali Kelas</option>
                                            {['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1 col-span-full">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Mata Pelajaran yang Diampu</label>
                                        <div className="flex flex-wrap gap-2">
                                            {TEACHER_SUBJECT_OPTIONS.map(subj => (
                                                <button 
                                                    key={subj}
                                                    type="button"
                                                    onClick={() => toggleTeacherSubject(subj)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${teacherSubjects.includes(subj) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
                                                >
                                                    {subj}
                                                </button>
                                            ))}
                                        </div>
                                        <input type="hidden" name="subject" value={teacherSubjects.join(', ')} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Password Login</label>
                                        <input name="password" defaultValue={editingItem?.password || '123456'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"/>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                        <select name="status" defaultValue={editingItem?.status || 'Active'} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                            <option value="Active">Aktif</option>
                                            <option value="Inactive">Non-Aktif</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {modalType === 'schedule' && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Hari</label>
                                        <select name="day" required defaultValue={editingItem?.day} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                            {['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Jam Ke- (Bisa pilih banyak)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[1,2,3,4,5,6,7,8].map(h => (
                                                <button
                                                    key={h}
                                                    type="button"
                                                    onClick={() => {
                                                        const exists = scheduleForm.selectedHours.includes(h);
                                                        setScheduleForm(p => ({
                                                            ...p,
                                                            selectedHours: exists ? p.selectedHours.filter(x => x !== h) : [...p.selectedHours, h]
                                                        }));
                                                    }}
                                                    className={`w-10 h-10 rounded-lg font-bold border ${scheduleForm.selectedHours.includes(h) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}
                                                >
                                                    {h}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Kelas</label>
                                        <select name="class" required defaultValue={editingItem?.class_name} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                            <option value="">Pilih...</option>
                                            {['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'].map(c => <option key={c} value={c}>Kelas {c}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Mata Pelajaran</label>
                                        <div className="flex gap-4 mb-2">
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                                                <input type="radio" checked={!scheduleForm.isEkstra} onChange={() => setScheduleForm(p => ({...p, isEkstra: false}))} className="accent-indigo-600"/> Mapel Utama
                                            </label>
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                                                <input type="radio" checked={scheduleForm.isEkstra} onChange={() => setScheduleForm(p => ({...p, isEkstra: true}))} className="accent-indigo-600"/> Muatan Lokal / Lainnya
                                            </label>
                                        </div>
                                        
                                        {!scheduleForm.isEkstra ? (
                                            <select 
                                                value={scheduleForm.selectedSubject} 
                                                onChange={(e) => setScheduleForm(p => ({...p, selectedSubject: e.target.value}))}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                            >
                                                <option value="">-- Pilih Mapel --</option>
                                                {STANDARD_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : (
                                            <input 
                                                value={scheduleForm.customSubject} 
                                                onChange={(e) => setScheduleForm(p => ({...p, customSubject: e.target.value}))}
                                                placeholder="Tulis nama mapel..."
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Guru Pengajar</label>
                                        <select name="teacher" required defaultValue={editingItem?.teacher_name} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
                                            <option value="">Pilih Guru...</option>
                                            {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                        </form>
                    </div>

                    <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Batal</button>
                        <button type="submit" form="dataForm" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700">Simpan Data</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminDashboard;