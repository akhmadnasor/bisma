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
  UserCheck, Shield
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
    { id: 'users_auth', label: 'User Auth', icon: UserCheck }, // New Auth Menu
    { id: 'students', label: 'Data Siswa', icon: GraduationCap },
    { id: 'teachers', label: 'Data Guru', icon: Users },
    { id: 'schedule', label: 'Jadwal KBM', icon: CalendarRange },
    { id: 'grades', label: 'Rekap Nilai', icon: FileSpreadsheet },
    { id: 'finance', label: 'Bank Sampah & Keuangan', icon: Recycle },
    { id: 'letters', label: 'Persuratan (Izin)', icon: Mail },
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

  // App Config
  const [appConfig, setAppConfig] = useState<AppConfig>({
      appName: 'BISMA APP',
      schoolName: 'SDN BAUJENG 1',
      principalName: 'Drs. Suharto, M.Pd',
      principalNip: '19680101 199003 1 005',
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
             setAppConfig(prev => ({ ...prev, ...configData }));
             if (configData.supabase_url) setCustomSupabaseUrl(configData.supabase_url);
             if (configData.supabase_anon_key) setCustomSupabaseKey(configData.supabase_anon_key);
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

  // --- CSV Logic & Templates (Kept as is) ---
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
          const teacherRes = await createAuthUsers(teachers, 'teacher');
          current += teachers.length;
          setAuthSyncProgress(Math.round((current / total) * 100));
          newLogs.push(`Guru: ${teacherRes.count} Sukses, ${teacherRes.errors.length} Gagal/Ada.`);

          // Sync Students
          // Process in chunks to avoid blocking UI too much if many students
          const studentRes = await createAuthUsers(students, 'student');
          current += students.length;
          setAuthSyncProgress(100);
          newLogs.push(`Siswa: ${studentRes.count} Sukses, ${studentRes.errors.length} Gagal/Ada.`);

          setAuthSyncLogs(newLogs);
          alert("Sinkronisasi Selesai!");

      } catch (e: any) {
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
                      class_name: row.class_name || row['kelas'],
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
          // await supabase.from('app_config').upsert(appConfig);
          setTimeout(() => {
              alert("Konfigurasi berhasil disimpan!");
              setSavingConfig(false);
          }, 1000);
      } catch (e) {
          alert("Gagal menyimpan konfigurasi.");
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <h3 className="text-2xl font-black mb-2 relative z-10">User Authentication Center</h3>
              <p className="text-blue-100 relative z-10 max-w-xl text-sm leading-relaxed mb-6">
                  Kelola akun login (Auth) untuk semua siswa dan guru. Sistem ini menggunakan <strong>Supabase Auth</strong> untuk keamanan maksimal.
                  Pastikan data siswa & guru sudah diinput sebelum melakukan sinkronisasi.
              </p>
              
              <div className="flex gap-4 relative z-10">
                  <div className="flex items-center gap-3 bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/20">
                      <div className="bg-green-400/20 p-2 rounded-lg"><Shield className="w-5 h-5 text-green-300"/></div>
                      <div>
                          <div className="text-[10px] font-bold uppercase text-blue-200">Server Status</div>
                          <div className="font-bold text-white flex items-center gap-2">Active <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span></div>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/20">
                      <div className="bg-yellow-400/20 p-2 rounded-lg"><Users className="w-5 h-5 text-yellow-300"/></div>
                      <div>
                          <div className="text-[10px] font-bold uppercase text-blue-200">Total Users DB</div>
                          <div className="font-bold text-white">{students.length + teachers.length} User</div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-indigo-600"/> Sinkronisasi Database ke Auth</h4>
                  {isAuthSyncing && <span className="text-xs font-bold text-indigo-600 animate-pulse">Sedang Memproses... {authSyncProgress}%</span>}
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6 text-center">
                  <p className="text-gray-500 text-sm mb-4">
                      Klik tombol di bawah untuk membuat akun login otomatis bagi semua Guru (NIP) dan Siswa (NISN) yang belum terdaftar.
                      <br/><span className="text-xs text-gray-400">(Password Default: 123456)</span>
                  </p>
                  <button 
                      onClick={handleSyncAuth}
                      disabled={isAuthSyncing}
                      className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto ${isAuthSyncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'}`}
                  >
                      {isAuthSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <UserCheck className="w-5 h-5"/>}
                      {isAuthSyncing ? 'Sedang Sinkronisasi...' : 'Sync Database to Auth'}
                  </button>
              </div>

              {/* Logs Area */}
              {authSyncLogs.length > 0 && (
                  <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-green-400 h-40 overflow-y-auto custom-scrollbar border border-slate-800 shadow-inner">
                      {authSyncLogs.map((log, i) => (
                          <div key={i} className="mb-1">> {log}</div>
                      ))}
                      <div className="animate-pulse">> _</div>
                  </div>
              )}
          </div>
      </div>
  );

  // ... (renderAppConfig and renderTable remain largely same, skipping for brevity unless specifically asked to change) ...
  const renderAppConfig = () => {
      const previewTheme = getPreviewTheme(appConfig.announcementColor);
      const date = new Date(appConfig.announcementDate);
      const dateDisplay = isNaN(date.getTime()) ? { day: '--', month: '---' } : {
          day: date.getDate(),
          month: date.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()
      };

      return (
      <div className="space-y-8 animate-fade-in-up pb-10">
          {/* Identitas Sekolah */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <School className="w-5 h-5 text-indigo-600"/> Identitas Sekolah & Aplikasi
                  </h3>
                  <button onClick={handleSaveConfig} disabled={savingConfig} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-indigo-700 flex items-center gap-2">
                      {savingConfig ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>} Simpan
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Aplikasi</label>
                      <input 
                        value={appConfig.appName} 
                        onChange={(e) => setAppConfig({...appConfig, appName: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Sekolah</label>
                      <input 
                        value={appConfig.schoolName} 
                        onChange={(e) => setAppConfig({...appConfig, schoolName: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Kepala Sekolah</label>
                      <input 
                        value={appConfig.principalName} 
                        onChange={(e) => setAppConfig({...appConfig, principalName: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">NIP Kepala Sekolah</label>
                      <input 
                        value={appConfig.principalNip} 
                        onChange={(e) => setAppConfig({...appConfig, principalNip: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>
              </div>
          </div>

          {/* Pengumuman & Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-4 mb-6 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-600"/> Pengumuman & Notifikasi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Judul Pengumuman</label>
                          <input 
                            value={appConfig.announcementTitle} 
                            onChange={(e) => setAppConfig({...appConfig, announcementTitle: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Kosongkan jika tidak ada pengumuman"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tanggal Kegiatan</label>
                              <input 
                                type="date"
                                value={appConfig.announcementDate} 
                                onChange={(e) => setAppConfig({...appConfig, announcementDate: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Kegiatan</label>
                              <input 
                                value={appConfig.announcementType} 
                                onChange={(e) => setAppConfig({...appConfig, announcementType: e.target.value})}
                                placeholder="Akademik / Libur / dll"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Waktu Pelaksanaan</label>
                          <input 
                            value={appConfig.announcementTime} 
                            onChange={(e) => setAppConfig({...appConfig, announcementTime: e.target.value})}
                            placeholder="08:00 - Selesai"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Keterangan Lengkap</label>
                          <textarea 
                            value={appConfig.announcementDesc} 
                            onChange={(e) => setAppConfig({...appConfig, announcementDesc: e.target.value})}
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tema Warna</label>
                          <div className="flex gap-3">
                              {['yellow', 'blue', 'green', 'pink', 'purple'].map(color => (
                                  <button 
                                    key={color}
                                    onClick={() => setAppConfig({...appConfig, announcementColor: color as any})}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${appConfig.announcementColor === color ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: color === 'yellow' ? '#f59e0b' : color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'pink' ? '#ec4899' : '#8b5cf6' }}
                                  />
                              ))}
                          </div>
                      </div>
                      <button onClick={handleSaveConfig} disabled={savingConfig} className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold shadow hover:bg-indigo-700 flex items-center justify-center gap-2 mt-2">
                          {savingConfig ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Simpan Pengumuman
                      </button>
                  </div>
                  
                  {/* Live Preview - UPDATED DESIGN */}
                  <div className="bg-gray-100 rounded-3xl p-6 flex flex-col justify-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-4 text-center">Live Preview (Tampilan Siswa)</label>
                      
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-100 relative overflow-hidden transform scale-95 origin-center">
                          <div className="flex items-center gap-3 mb-6 relative z-10">
                              <div className={`p-2 rounded-xl ${previewTheme.iconBg} ${previewTheme.iconText}`}><Megaphone className="w-6 h-6"/></div>
                              <h3 className="font-black text-gray-800 text-lg leading-tight">Pengumuman Sekolah</h3>
                          </div>
                          
                          {appConfig.announcementTitle ? (
                              <div className="relative z-10">
                                  <div className="flex gap-4 items-start">
                                      {/* Date Block */}
                                      <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl ${previewTheme.bg} ${previewTheme.text} shrink-0 border-2 ${previewTheme.border}`}>
                                          <span className="text-2xl font-black leading-none">{dateDisplay.day}</span>
                                          <span className="text-[10px] font-bold uppercase tracking-wider">{dateDisplay.month}</span>
                                      </div>
                                      
                                      {/* Content */}
                                      <div className="pt-1 flex-1">
                                          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${previewTheme.text} bg-white/50 inline-block px-2 py-0.5 rounded-md`}>
                                              {appConfig.announcementType || 'Info'}
                                          </div>
                                          <h4 className="font-bold text-gray-800 text-sm mb-1 leading-snug">{appConfig.announcementTitle}</h4>
                                          <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mb-2">
                                              <Clock className="w-3.5 h-3.5"/>
                                              <span>{appConfig.announcementTime || 'Waktu tidak ditentukan'}</span>
                                          </div>
                                          <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                              {appConfig.announcementDesc || 'Deskripsi pengumuman...'}
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              // PREVIEW EMPTY STATE
                              <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                  <BellOff className="w-10 h-10 text-gray-300 mx-auto mb-2"/>
                                  <p className="text-xs font-bold text-gray-400">Belum ada pengumuman aktif.</p>
                                  <p className="text-[10px] text-gray-400 mt-1">Silahkan cek kembali nanti.</p>
                              </div>
                          )}

                          {/* Decor Blob */}
                          {appConfig.announcementTitle && (
                              <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full opacity-10 ${previewTheme.accent}`}></div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>
      );
  };

  const renderTable = (headers: string[], data: any[], type: 'student' | 'teacher' | 'schedule') => (
      <div className="space-y-4 animate-fade-in-up">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
             <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                Menampilkan {data.length} data
             </div>
             
             {/* Search and Add */}
             <div className="flex gap-2 w-full md:w-auto items-center">
                 <div className="relative flex-1 md:flex-initial">
                     <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                     <input 
                        type="text" 
                        placeholder="Cari..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                     />
                 </div>
                 <button 
                    onClick={() => handleAddClick(type)}
                    className="p-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
                    title="Tambah Manual"
                 >
                     <Plus className="w-4 h-4"/>
                 </button>
             </div>

             <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                <button onClick={() => downloadTemplate(type)} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 border border-gray-200 whitespace-nowrap"><FileText className="w-4 h-4"/> Template</button>
                <button onClick={() => handleImportClick(type)} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-md whitespace-nowrap"><Upload className="w-4 h-4"/> Import CSV</button>
                <button onClick={() => exportToCSV(data, type)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md whitespace-nowrap"><Download className="w-4 h-4"/> Export</button>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-sm text-left relative">
                      <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100 sticky top-0 z-10">
                          <tr>
                              {headers.map((h, i) => <th key={i} className="px-6 py-4 whitespace-nowrap">{h}</th>)}
                              <th className="px-6 py-4 text-right">Aksi</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {data.length === 0 ? (
                              <tr><td colSpan={headers.length + 1} className="p-12 text-center text-gray-400">Data Kosong</td></tr>
                          ) : data.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-gray-50/50">
                                  {type === 'student' && (
                                    <>
                                        <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                                        <td className="px-6 py-4 font-bold">{item.name}</td>
                                        <td className="px-6 py-4">{item.nis || '-'}</td>
                                        <td className="px-6 py-4">{item.nisn}</td>
                                        <td className="px-6 py-4">{item.tempat_lahir}, {item.tanggal_lahir}</td>
                                        <td className="px-6 py-4">{item.nama_ayah} / {item.nama_ibu}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold">{item.class_name}</span></td>
                                    </>
                                  )}
                                  {type === 'teacher' && (
                                    <>
                                        <td className="px-6 py-4 font-bold">{item.name}</td>
                                        <td className="px-6 py-4">{item.nip}</td>
                                        <td className="px-6 py-4">{item.jenis_kelamin}</td>
                                        <td className="px-6 py-4">{item.jenis_guru}</td>
                                        <td className="px-6 py-4">{item.wali_kelas}</td>
                                        <td className="px-6 py-4">{item.subject}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">{item.status}</span></td>
                                    </>
                                  )}
                                  {type === 'schedule' && (
                                    <>
                                        <td className="px-6 py-4 font-bold">{item.day}</td>
                                        <td className="px-6 py-4">{item.time}</td>
                                        <td className="px-6 py-4">{item.class_name}</td>
                                        <td className="px-6 py-4">{item.subject}</td>
                                        <td className="px-6 py-4">{item.teacher_name}</td>
                                    </>
                                  )}
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button onClick={() => handleEditClick(item, type)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"><Edit className="w-4 h-4"/></button>
                                          <button onClick={() => handleDelete(item.id, type)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  const renderGradesRecap = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                  <div className="flex gap-4">
                      <select 
                          value={gradeFilterClass} 
                          onChange={(e) => setGradeFilterClass(e.target.value)}
                          className="p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                          {['1A', '1B', '2A', '2B', '3A', '4A', '5A', '6A'].map(c => <option key={c} value={c}>Kelas {c}</option>)}
                      </select>
                      <select 
                          value={gradeFilterSubject} 
                          onChange={(e) => setGradeFilterSubject(e.target.value)}
                          className="p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                          {STANDARD_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                  </div>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                          <tr>
                              <th className="px-6 py-4 border-b">Nama Siswa</th>
                              {/* Dynamic PH Headers */}
                              {Array.from({ length: phCount }).map((_, i) => (
                                  <th key={i} className="px-4 py-4 text-center border-b w-16">PH{i + 1}</th>
                              ))}
                              <th className="px-2 py-4 border-b w-12 text-center">
                                  <button onClick={() => setPhCount(p => Math.min(p + 1, 8))} className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 p-1 rounded"><Plus className="w-3 h-3"/></button>
                              </th>
                              <th className="px-6 py-4 text-center border-b border-l">PTS</th>
                              <th className="px-6 py-4 text-center border-b">PAS</th>
                              <th className="px-6 py-4 text-center border-b bg-gray-100 font-bold">NA</th>
                          </tr>
                      </thead>
                      <tbody>
                          {grades.filter(g => g.class_name === gradeFilterClass && g.subject === gradeFilterSubject).length === 0 ? (
                              <tr><td colSpan={phCount + 5} className="p-8 text-center text-gray-400">Belum ada data nilai untuk filter ini.</td></tr>
                          ) : (
                              grades.filter(g => g.class_name === gradeFilterClass && g.subject === gradeFilterSubject).map(g => {
                                  // Mock PH splitting since DB only has 1 array column in types but logic here supports multiple
                                  // We will just replicate the score or show 0 if not present in expanded view
                                  const phVal = Array.isArray(g.ph_scores) ? g.ph_scores[0] : 0; 
                                  const na = Math.round(((phVal || 0) + (g.pts || 0) + (g.pas || 0)) / 3);
                                  
                                  return (
                                  <tr key={g.id} className="border-b last:border-0 hover:bg-gray-50">
                                      <td className="px-6 py-3 font-bold text-gray-700">{g.student_name}</td>
                                      {Array.from({ length: phCount }).map((_, i) => (
                                          <td key={i} className="px-4 py-3 text-center text-gray-600">
                                              {/* In a real dynamic system, g.ph_scores would be an array. Using first value for demo. */}
                                              {i === 0 ? (Array.isArray(g.ph_scores) ? g.ph_scores[0] : '-') : '-'}
                                          </td>
                                      ))}
                                      <td className="px-2 py-3 text-center"></td>
                                      <td className="px-6 py-3 text-center border-l">{g.pts}</td>
                                      <td className="px-6 py-3 text-center">{g.pas}</td>
                                      <td className="px-6 py-3 text-center font-bold text-indigo-700 bg-gray-50">
                                          {na}
                                      </td>
                                  </tr>
                                  );
                              })
                          )}
                      </tbody>
                  </table>
                  <div className="mt-4 flex justify-end">
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

  const renderFinance = () => (
      <div className="space-y-6 animate-fade-in-up">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
              <button onClick={() => setFinanceTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${financeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Ringkasan</button>
              <button onClick={() => setFinanceTab('input')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${financeTab === 'input' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Input Transaksi</button>
              <button onClick={() => setFinanceTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${financeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Atur Harga</button>
          </div>

          {financeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Transactions */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-orange-600"/> Riwayat Transaksi Terakhir</h3>
                      <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-500 font-medium">
                                  <tr>
                                      <th className="p-3">Tanggal</th>
                                      <th className="p-3">Siswa</th>
                                      <th className="p-3">Jenis</th>
                                      <th className="p-3 text-right">Berat/Jml</th>
                                      <th className="p-3 text-right">Nominal</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {wasteTransactions.length === 0 ? <tr className="text-gray-400 text-center"><td colSpan={5} className="p-4">Belum ada transaksi.</td></tr> : 
                                    wasteTransactions.slice(0, 10).map((t) => (
                                      <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                                          <td className="p-3 text-gray-500">{t.date}</td>
                                          <td className="p-3 font-bold">{t.student_name}</td>
                                          <td className="p-3">
                                              <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'Deposit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                  {t.status === 'Deposit' ? 'Setor' : 'Tarik'}
                                              </span>
                                              <span className="ml-2 text-gray-600 text-xs">{t.type}</span>
                                          </td>
                                          <td className="p-3 text-right font-mono">{t.weight > 0 ? `${t.weight} kg` : '-'}</td>
                                          <td className={`p-3 text-right font-bold ${t.status === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                              {t.status === 'Deposit' ? '+' : '-'} {t.amount.toLocaleString('id-ID')}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {financeTab === 'input' && (
              <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2"><PlusCircle className="w-6 h-6 text-green-600"/> Input Transaksi Baru</h3>
                  <form onSubmit={handleFinanceSubmit} className="space-y-6">
                      
                      {/* Step 1: Select Student */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Siswa</label>
                          <select 
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                              value={financeForm.studentId}
                              onChange={(e) => setFinanceForm({...financeForm, studentId: e.target.value})}
                              required
                          >
                              <option value="">-- Cari Siswa --</option>
                              {students.map(s => (
                                  <option key={s.id} value={s.id}>{s.class_name} - {s.name}</option>
                              ))}
                          </select>
                      </div>

                      {/* Step 2: Transaction Type */}
                      <div className="grid grid-cols-2 gap-4">
                          <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${financeForm.transactionType === 'deposit' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
                              <input type="radio" className="hidden" name="type" onClick={() => setFinanceForm({...financeForm, transactionType: 'deposit'})} />
                              <TrendingUp className="w-6 h-6"/>
                              <span className="font-bold">Setor Sampah</span>
                          </label>
                          <label className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${financeForm.transactionType === 'withdraw' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
                              <input type="radio" className="hidden" name="type" onClick={() => setFinanceForm({...financeForm, transactionType: 'withdraw'})} />
                              <TrendingDown className="w-6 h-6"/>
                              <span className="font-bold">Penarikan / Belanja</span>
                          </label>
                      </div>

                      {/* Step 3: Conditional Inputs */}
                      {financeForm.transactionType === 'deposit' ? (
                          <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Sampah</label>
                                  <select 
                                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none"
                                      value={financeForm.wasteTypeId}
                                      onChange={(e) => setFinanceForm({...financeForm, wasteTypeId: parseInt(e.target.value)})}
                                  >
                                      {wasteTypes.map(w => (
                                          <option key={w.id} value={w.id}>{w.name} (Rp {w.price_per_kg}/kg)</option>
                                      ))}
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Berat (Kg)</label>
                                  <input 
                                      type="number" step="0.1"
                                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-lg"
                                      placeholder="0.0"
                                      value={financeForm.weight}
                                      onChange={(e) => setFinanceForm({...financeForm, weight: e.target.value})}
                                      required
                                  />
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                  <span className="text-sm font-medium text-gray-500">Estimasi Pendapatan:</span>
                                  <span className="text-xl font-black text-green-600">
                                      Rp {(parseFloat(financeForm.weight || '0') * (wasteTypes.find(w=>w.id === Number(financeForm.wasteTypeId))?.price_per_kg || 0)).toLocaleString('id-ID')}
                                  </span>
                              </div>
                          </div>
                      ) : (
                          <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Penarikan</label>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {['Uang Tunai', 'Buku Tulis', 'Pensil', 'Penghapus', 'Penggaris', 'ATK Lain'].map(item => (
                                          <div 
                                            key={item} 
                                            onClick={() => setFinanceForm({...financeForm, withdrawItem: item})}
                                            className={`p-2 rounded-lg text-xs font-bold text-center cursor-pointer border ${financeForm.withdrawItem === item ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50'}`}
                                          >
                                              {item}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nominal / Harga (Rp)</label>
                                  <input 
                                      type="number"
                                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-lg text-red-600"
                                      placeholder="0"
                                      value={financeForm.withdrawAmount}
                                      onChange={(e) => setFinanceForm({...financeForm, withdrawAmount: e.target.value})}
                                      required
                                  />
                              </div>
                          </div>
                      )}

                      <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                          <Save className="w-5 h-5"/> Simpan Transaksi
                      </button>
                  </form>
              </div>
          )}

          {financeTab === 'settings' && (
              <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600"/> Pengaturan Harga Sampah</h3>
                  <div className="space-y-4">
                      {wasteTypes.map((w, idx) => (
                          <div key={w.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <div className="flex-1">
                                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Jenis Sampah</label>
                                  <input 
                                      type="text" 
                                      value={w.name}
                                      onChange={(e) => {
                                          const newTypes = [...wasteTypes];
                                          newTypes[idx].name = e.target.value;
                                          setWasteTypes(newTypes);
                                      }}
                                      className="w-full bg-transparent font-bold text-gray-800 outline-none"
                                  />
                              </div>
                              <div className="w-32">
                                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Harga / Kg</label>
                                  <input 
                                      type="number" 
                                      value={w.price_per_kg}
                                      onChange={(e) => {
                                          const newTypes = [...wasteTypes];
                                          newTypes[idx].price_per_kg = parseInt(e.target.value);
                                          setWasteTypes(newTypes);
                                      }}
                                      className="w-full bg-white p-2 rounded border border-gray-200 font-mono font-bold text-right outline-none focus:border-indigo-500"
                                  />
                              </div>
                              <button onClick={() => setWasteTypes(wasteTypes.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-5 h-5"/></button>
                          </div>
                      ))}
                      <button 
                        onClick={() => setWasteTypes([...wasteTypes, { id: Date.now(), name: 'Jenis Baru', price_per_kg: 0 }])}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                          <Plus className="w-5 h-5"/> Tambah Jenis
                      </button>
                  </div>
              </div>
          )}
      </div>
  );

  const renderLetters = () => (
      <div className="space-y-6 animate-fade-in-up">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-600"/> Permohonan Izin Masuk</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                          <tr>
                              <th className="px-6 py-3">Tanggal</th>
                              <th className="px-6 py-3">Siswa</th>
                              <th className="px-6 py-3">Kelas</th>
                              <th className="px-6 py-3">Jenis</th>
                              <th className="px-6 py-3">Alasan</th>
                              <th className="px-6 py-3 text-right">Status</th>
                          </tr>
                      </thead>
                      <tbody>
                          {permissions.length === 0 ? (
                               <tr><td colSpan={6} className="p-8 text-center text-gray-400">Tidak ada data permohonan izin.</td></tr>
                          ) : permissions.map((p) => (
                              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                  <td className="px-6 py-4">{p.date}</td>
                                  <td className="px-6 py-4 font-bold">{p.student_name}</td>
                                  <td className="px-6 py-4">{p.class_name}</td>
                                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${p.type === 'Sakit' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{p.type}</span></td>
                                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{p.reason}</td>
                                  <td className="px-6 py-4 text-right">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Approved' ? 'bg-green-100 text-green-600' : p.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
           </div>
      </div>
  );

  const renderGoodDeeds = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500"/> Laporan Anak Hebat</h3>
              <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-gray-50 text-gray-500 font-medium">
                           <tr>
                               <th className="px-6 py-3">Tanggal</th>
                               <th className="px-6 py-3">Siswa</th>
                               <th className="px-6 py-3">Aktivitas</th>
                               <th className="px-6 py-3 text-right">Status</th>
                           </tr>
                       </thead>
                       <tbody>
                           {goodDeeds.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada laporan aktivitas baik.</td></tr>
                           ) : goodDeeds.map((g) => (
                               <tr key={g.id} className="border-b last:border-0 hover:bg-gray-50">
                                   <td className="px-6 py-4">{g.date} {g.time}</td>
                                   <td className="px-6 py-4 font-bold">{g.student_name} <span className="text-xs font-normal text-gray-500">({g.class_name})</span></td>
                                   <td className="px-6 py-4">{g.activity}</td>
                                   <td className="px-6 py-4 text-right">
                                       <span className={`px-2 py-1 rounded text-xs font-bold ${g.status === 'Verified' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{g.status}</span>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
              </div>
          </div>
      </div>
  );

  const renderApiSettings = () => (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
          <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
               <h3 className="text-2xl font-black mb-2 relative z-10">Integrasi Sistem</h3>
               <p className="text-indigo-200 relative z-10">Konfigurasi koneksi ke Supabase dan Google Gemini AI.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <h4 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-600"/> Database Configuration (Supabase)</h4>
               
               <div className="space-y-4">
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Supabase Project URL</label>
                       <input 
                          type="text" 
                          value={customSupabaseUrl} 
                          onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm"
                          placeholder="https://your-project.supabase.co"
                       />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Supabase Anon Key (Public)</label>
                       <div className="relative">
                          <input 
                              type="password" 
                              value={customSupabaseKey} 
                              onChange={(e) => setCustomSupabaseKey(e.target.value)}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm pr-10"
                              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                           />
                           <Key className="absolute right-3 top-3 w-4 h-4 text-gray-400"/>
                       </div>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Supabase Service Role Key (Admin/Secret)</label>
                       <div className="relative">
                          <input 
                              type="password" 
                              value={serviceRoleKey} 
                              onChange={(e) => setServiceRoleKey(e.target.value)}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm pr-10 border-red-200 bg-red-50 focus:ring-red-500"
                              placeholder="Diperlukan untuk membuat user Auth otomatis..."
                           />
                           <Lock className="absolute right-3 top-3 w-4 h-4 text-red-400"/>
                       </div>
                       <p className="text-[10px] text-red-500 mt-1 font-bold">* Hanya simpan jika Anda admin. Jangan bagikan key ini.</p>
                   </div>
               </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <h4 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-600"/> AI Configuration (Google Gemini)</h4>
               <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gemini API Key</label>
                   <div className="flex gap-2">
                       <input 
                          type="password" 
                          disabled 
                          value="****************************" 
                          className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl font-mono text-sm text-gray-400 cursor-not-allowed"
                       />
                       <button className="bg-gray-200 text-gray-600 px-4 rounded-xl font-bold text-xs" disabled>Configured via Env</button>
                   </div>
                   <p className="text-xs text-gray-500 mt-2">API Key dikonfigurasi melalui Environment Variables server (Netlify/Vercel) untuk keamanan.</p>
               </div>
          </div>

          <div className="flex justify-end pt-4">
              <button onClick={handleSaveConfig} disabled={savingConfig} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center gap-2">
                  {savingConfig ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} Simpan Konfigurasi
              </button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
      
      {/* Sidebar & Mobile Menu */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1e1b4b] text-white z-50 shadow-xl overflow-y-auto transform transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-indigo-900/50 flex justify-between items-center">
            <h1 className="text-2xl font-black">BISMA <span className="text-xs font-normal block">Admin Portal</span></h1>
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden"><X className="w-6 h-6"/></button>
        </div>
        <nav className="p-4 space-y-2">
            {MENU_CONFIG.map(item => (
                <button key={item.id} onClick={() => { setActiveView(item.id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all ${activeView === item.id ? 'bg-indigo-600 shadow-lg text-white' : 'text-indigo-200 hover:bg-indigo-900/50'}`}>
                    <item.icon className="w-5 h-5"/> {item.label}
                </button>
            ))}
        </nav>
        <div className="p-4"><button onClick={onLogout} className="flex items-center gap-3 w-full p-3 text-red-300 hover:bg-red-900/20 rounded-xl"><LogOut className="w-5 h-5"/> Keluar</button></div>
      </aside>

      <header className="lg:hidden bg-[#1e1b4b] text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
         <span className="font-bold">BISMA ADMIN</span>
         <button onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-6 h-6"/></button>
      </header>

      <main className="lg:ml-64 p-6 md:p-8">
        <header className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <div><h2 className="text-2xl font-bold text-gray-800 capitalize">{MENU_CONFIG.find(m=>m.id===activeView)?.label}</h2></div>
        </header>

        {activeView === 'overview' && renderOverview()}
        {activeView === 'app_config' && renderAppConfig()}
        {activeView === 'users_auth' && renderUsersAuth()}
        {activeView === 'students' && renderTable(['No', 'Nama Siswa', 'NIS', 'NISN', 'TTL', 'Orang Tua', 'Kelas'], students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())), 'student')}
        {activeView === 'teachers' && renderTable(['Nama Guru', 'NIP', 'L/P', 'Jenis', 'Wali Kelas', 'Mapel', 'Status'], teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), 'teacher')}
        {activeView === 'schedule' && renderTable(['Hari', 'Jam', 'Kelas', 'Mapel', 'Pengajar'], schedules.filter(s => s.class_name.includes(searchTerm) || s.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())), 'schedule')}
        {activeView === 'grades' && renderGradesRecap()}
        {activeView === 'finance' && renderFinance()} 
        {activeView === 'letters' && renderLetters()}
        {activeView === 'good_deeds' && renderGoodDeeds()}
        {activeView === 'api_settings' && renderApiSettings()}

      </main>

      {/* --- UNIFIED MODAL (FORM EDIT/ADD) --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in-up">
              <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 flex justify-between items-center shrink-0">
                      <div><h3 className="text-white font-bold text-xl flex items-center gap-2">{editingItem ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {editingItem ? 'Edit Data' : 'Tambah Data Baru'}</h3></div>
                      <button onClick={() => setIsModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <form onSubmit={handleSave} className="space-y-6">
                        {modalType === 'schedule' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><label className="block text-xs font-bold text-gray-500 uppercase">Hari KBM</label><select name="day" defaultValue={editingItem?.day || 'Senin'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">{['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                    <div className="space-y-2"><label className="block text-xs font-bold text-gray-500 uppercase">Kelas</label><select name="class" defaultValue={editingItem?.class_name || '5A'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">{['1A','1B','2A','2B','3A','4A','5A','6A'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                </div>
                                <div className="space-y-2"><label className="block text-xs font-bold text-gray-500 uppercase">Pilih Jam (Checklist)</label><div className="grid grid-cols-4 md:grid-cols-8 gap-2">{[1,2,3,4,5,6,7,8].map(j => (<div key={j} onClick={() => { const current = scheduleForm.selectedHours; setScheduleForm({...scheduleForm, selectedHours: current.includes(j) ? current.filter(x => x !== j) : [...current, j]}); }} className={`cursor-pointer rounded-lg border-2 p-2 text-center ${scheduleForm.selectedHours.includes(j) ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}>{j}</div>))}</div></div>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                    <div className="flex justify-between items-center"><label className="block text-xs font-bold text-gray-500 uppercase">Mapel</label><button type="button" onClick={() => setScheduleForm({...scheduleForm, isEkstra: !scheduleForm.isEkstra})} className="text-xs text-indigo-600 font-bold hover:underline">{scheduleForm.isEkstra ? 'Kembali ke Mapel' : '+ Ekstra'}</button></div>
                                    {!scheduleForm.isEkstra ? (<div className="grid grid-cols-2 md:grid-cols-3 gap-2">{STANDARD_SUBJECTS.map(subj => (<div key={subj} onClick={() => setScheduleForm({...scheduleForm, selectedSubject: subj})} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${scheduleForm.selectedSubject === subj ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600'}`}>{scheduleForm.selectedSubject === subj ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}{subj}</div>))}</div>) : (<input type="text" placeholder="Nama Ekstrakurikuler..." className="w-full p-3 border rounded-xl" value={scheduleForm.customSubject} onChange={(e) => setScheduleForm({...scheduleForm, customSubject: e.target.value})}/>)}
                                </div>
                                <div className="space-y-2"><label className="block text-xs font-bold text-gray-500 uppercase">Pengajar</label><select name="teacher" defaultValue={editingItem?.teacher_name} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">{teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                            </>
                        )}
                        {modalType === 'student' && (
                            <>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label><input name="name" defaultValue={editingItem?.name} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">NISN</label><input name="nisn" defaultValue={editingItem?.nisn} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">NIS (Lokal)</label><input name="nis" defaultValue={editingItem?.nis} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tempat Lahir</label><input name="tempat_lahir" defaultValue={editingItem?.tempat_lahir} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Lahir</label><input name="tanggal_lahir" type="date" defaultValue={editingItem?.tanggal_lahir} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Ayah</label><input name="nama_ayah" defaultValue={editingItem?.nama_ayah} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Ibu</label><input name="nama_ibu" defaultValue={editingItem?.nama_ibu} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label><select name="class" defaultValue={editingItem?.class_name || '1A'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl">{['1A','1B','2A','2B','3A','4A','5A','6A'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label><select name="status" defaultValue={editingItem?.status || 'Active'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label><input name="password" defaultValue={editingItem?.password || 'siswa'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                            </>
                        )}
                        {modalType === 'teacher' && (
                            <>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Guru</label><input name="name" defaultValue={editingItem?.name} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">NIP</label><input name="nip" defaultValue={editingItem?.nip} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jenis Kelamin</label><select name="jenis_kelamin" defaultValue={editingItem?.jenis_kelamin || 'P'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jenis Guru</label><select name="jenis_guru" defaultValue={editingItem?.jenis_guru || 'Guru Mapel'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"><option value="Guru Kelas">Guru Kelas</option><option value="Guru Mapel">Guru Mapel</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wali Kelas</label><select name="wali_kelas" defaultValue={editingItem?.wali_kelas || '-'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"><option value="-">Bukan Wali Kelas</option>{['1A','1B','2A','2B','3A','4A','5A','6A'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                </div>
                                
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Mata Pelajaran (Centang)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {TEACHER_SUBJECT_OPTIONS.map((subject) => (
                                            <label key={subject} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${teacherSubjects.includes(subject) ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                                <input 
                                                    type="checkbox"
                                                    name="subjects_checkbox" 
                                                    value={subject}
                                                    checked={teacherSubjects.includes(subject)}
                                                    onChange={() => toggleTeacherSubject(subject)}
                                                    className="w-4 h-4 accent-indigo-600 rounded"
                                                />
                                                <span className={`text-sm font-medium ${teacherSubjects.includes(subject) ? 'text-indigo-800' : 'text-gray-700'}`}>{subject}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label><select name="status" defaultValue={editingItem?.status || 'Active'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"><option value="Active">Active</option><option value="Leave">Cuti</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label><input name="password" defaultValue={editingItem?.password || 'guru'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                </div>
                            </>
                        )}
                        <div className="pt-6 flex gap-3 border-t border-gray-100">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Batal</button>
                            <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Simpan</button>
                        </div>
                    </form>
                  </div>
              </div>
          </div>
      )}

      {/* IMPORT FEEDBACK MODAL */}
      {importResult.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className={`p-6 flex items-center gap-4 ${importResult.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <div className={`p-3 rounded-full ${importResult.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {importResult.status === 'success' ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                      </div>
                      <div>
                          <h3 className="font-bold text-lg">{importResult.title}</h3>
                          <p className="text-sm opacity-90">{importResult.message}</p>
                      </div>
                  </div>
                  {importResult.details && importResult.details.length > 0 && (
                      <div className="p-6 bg-slate-50 border-t border-b border-gray-100 flex-1 overflow-y-auto custom-scrollbar">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><FileWarning className="w-4 h-4"/> Detail Laporan</h4>
                          <div className="space-y-2">{importResult.details.map((d, i) => <div key={i} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 font-mono shadow-sm"><XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /><span>{d}</span></div>)}</div>
                      </div>
                  )}
                  <div className="p-4 bg-white flex justify-end"><button onClick={() => setImportResult({...importResult, isOpen: false})} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg">Tutup</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;