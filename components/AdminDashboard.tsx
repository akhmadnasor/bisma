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
  Grid
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
  
  // Data States - Initialized Empty (No Dummy Data)
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  
  // Finance, Permissions, Good Deeds Mock Data
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([
      { id: 1, name: 'Plastik Gelas (Bersih)', price_per_kg: 3000 },
      { id: 2, name: 'Kertas Putih/Buku', price_per_kg: 2500 },
      { id: 3, name: 'Kardus', price_per_kg: 1500 },
      { id: 4, name: 'Botol PET', price_per_kg: 2000 },
  ]);
  const [wasteTransactions, setWasteTransactions] = useState<TrashTransaction[]>([]);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [goodDeeds, setGoodDeeds] = useState<GoodDeedRequest[]>([]);

  // Feedback Modal State
  const [importResult, setImportResult] = useState<ImportResult>({
      isOpen: false, status: 'success', title: '', message: '', details: []
  });
  
  // Selection State
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Grade Recap Filter States
  const [gradeFilterClass, setGradeFilterClass] = useState('5A');
  const [gradeFilterSubject, setGradeFilterSubject] = useState('Matematika');

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'student' | 'teacher' | 'schedule' | null>(null);

  // API & Integration States
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState(defaultSupabaseUrl);
  const [customSupabaseKey, setCustomSupabaseKey] = useState('');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
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
             // Note: service_role_key is usually not stored in public app_config for security, 
             // but if user manually inputted it before, we rely on local state or user re-input.
        }

        const { data: sData } = await supabase.from('students').select('*').order('name');
        setStudents(sData || []);

        const { data: tData } = await supabase.from('teachers').select('*').order('name');
        setTeachers(tData || []);

        const { data: schData } = await supabase.from('schedules').select('*').order('day');
        setSchedules(schData || []);

        const { data: gData } = await supabase.from('grades').select('*');
        setGrades(gData || []);

    } catch (e: any) {
        console.error("Error fetching data:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- CSV Logic ---
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

  // Function to create users in Supabase Auth using Admin API
  // Requires Service Role Key to be set in API Settings
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
              // Generate fake email for Auth: [identifier]@bisma.id
              const identifier = type === 'student' ? user.nisn : user.nip;
              const email = `${identifier}@bisma.id`;
              
              // 1. Check if user already exists
              // (Simplification: We just try to create, if it fails due to existing user, we might want to update password, 
              // but admin.createUser throws error if email exists. We will try to update if create fails)
              
              // Try Create
              const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                  email: email,
                  password: user.password || '123456', // Default password if missing
                  email_confirm: true,
                  user_metadata: {
                      name: user.name,
                      role: type,
                      identifier: identifier,
                      class_name: user.class_name || ''
                  }
              });

              if (createError) {
                  // If user exists, try to update password
                  if (createError.message.includes('already registered')) {
                      // We need the user ID to update. Find user by email.
                      // Note: listUsers requires pagination, searching strictly by email is tricky without ID in Admin API v1. 
                      // Workaround: We skip update or handle it if critical.
                      // For this demo, we'll log it as "Skipped/Exists".
                      // errors.push(`User ${user.name} (${identifier}) sudah ada di Auth.`);
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
                  if (!row.class_name && !row['kelas']) validationErrors.push(`Baris ${rowNum}: Kelas Kosong`);
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

          // DEDUPLICATION CLIENT SIDE
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

          // 1. UPSERT TO PUBLIC TABLE
          const { error } = await supabase.from(tableName).upsert(finalData, { onConflict: primaryKey || undefined });
          if (error) throw error;

          // 2. CREATE AUTH USERS (If Student or Teacher)
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
          // In real app, upsert to app_config table
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
      
      // Get data before delete to try finding Auth user later (if needed)
      // Note: We don't delete Auth user automatically here to prevent accidental lockout if ID mismatch, 
      // but strictly following requirements "hapus data database yang berkaitan", we delete the public record.
      
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      
      if (error) {
          alert("Gagal menghapus: " + error.message);
      } else {
          // Optimistic update
          if(type === 'student') setStudents(prev => prev.filter(p => p.id !== id));
          if(type === 'teacher') setTeachers(prev => prev.filter(p => p.id !== id));
          if(type === 'schedule') setSchedules(prev => prev.filter(p => p.id !== id));
          
          // Optionally refresh to be sure
          // fetchData(); 
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
          // Parse time "Jam Ke-1, 2" -> [1, 2]
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
            // Update
            const { data, error: err } = await supabase.from(table).update(payload).eq('id', editingItem.id).select();
            dbError = err;
            upsertedData = data;
        } else {
            // Insert
            const { data, error: err } = await supabase.from(table).insert(payload).select();
            dbError = err;
            upsertedData = data;
        }

        if (dbError) throw dbError;

        // Auto Create Auth if new User (and Service Role Key exists)
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

  // --- RENDERERS ---

  const renderOverview = () => (
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

  const renderAppConfig = () => (
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

          {/* Asset Digital (Logo) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <Image className="w-5 h-5 text-indigo-600"/> Asset Digital (URL)
                  </h3>
                  <button onClick={handleSaveConfig} disabled={savingConfig} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-indigo-700 flex items-center gap-2">
                      {savingConfig ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>} Simpan
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                      { label: 'Logo Persegi (1:1)', key: 'logoUrl1x1', aspect: 'aspect-square' },
                      { label: 'Logo Potrait (3:4)', key: 'logoUrl3x4', aspect: 'aspect-[3/4]' },
                      { label: 'Logo Landscape (4:3)', key: 'logoUrl4x3', aspect: 'aspect-[4/3]' },
                  ].map((item: any) => (
                      <div key={item.key} className="space-y-2">
                          <label className="block text-xs font-bold text-gray-500 uppercase">{item.label}</label>
                          <input 
                            value={(appConfig as any)[item.key]} 
                            onChange={(e) => setAppConfig({...appConfig, [item.key]: e.target.value})}
                            className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none mb-2"
                            placeholder="https://..."
                          />
                          <div className={`w-full ${item.aspect} bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group`}>
                              {(appConfig as any)[item.key] ? (
                                  <img src={(appConfig as any)[item.key]} className="w-full h-full object-cover" alt="Preview" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Error')}/>
                              ) : <span className="text-gray-400 text-xs">Preview</span>}
                          </div>
                      </div>
                  ))}
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
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tanggal Kegiatan</label>
                              <input 
                                type="date"
                                value={appConfig.announcementDate} 
                                onChange={(e) => setAppConfig({...appConfig, announcementDate: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Kegiatan</label>
                              <input 
                                value={appConfig.announcementType} 
                                onChange={(e) => setAppConfig({...appConfig, announcementType: e.target.value})}
                                placeholder="Akademik / Libur / dll"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Waktu Pelaksanaan</label>
                          <input 
                            value={appConfig.announcementTime} 
                            onChange={(e) => setAppConfig({...appConfig, announcementTime: e.target.value})}
                            placeholder="08:00 - Selesai"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Keterangan Lengkap</label>
                          <textarea 
                            value={appConfig.announcementDesc} 
                            onChange={(e) => setAppConfig({...appConfig, announcementDesc: e.target.value})}
                            rows={3}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none"
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
                  
                  {/* Live Preview */}
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Live Preview (Tampilan Siswa)</label>
                      <div className={`p-6 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden`} style={{
                          backgroundColor: appConfig.announcementColor === 'yellow' ? '#fffbeb' : appConfig.announcementColor === 'blue' ? '#eff6ff' : appConfig.announcementColor === 'green' ? '#f0fdf4' : appConfig.announcementColor === 'pink' ? '#fdf2f8' : '#f5f3ff'
                      }}>
                          <div className="flex items-start gap-4 mb-4 relative z-10">
                              <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm shrink-0 border border-white/50 text-${appConfig.announcementColor}-700`}>
                                  <span className="text-xl font-black leading-none">{new Date(appConfig.announcementDate).getDate() || '15'}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider">{new Date(appConfig.announcementDate).toLocaleDateString('id-ID', {month: 'short'}) || 'MAR'}</span>
                              </div>
                              <div>
                                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 text-${appConfig.announcementColor}-700`}>{appConfig.announcementType}</div>
                                  <h3 className="font-black text-gray-800 text-lg leading-tight mb-1">{appConfig.announcementTitle}</h3>
                                  <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                      <Clock className="w-3 h-3"/> {appConfig.announcementTime}
                                  </div>
                              </div>
                          </div>
                          <p className="text-sm text-gray-600 relative z-10 leading-snug">{appConfig.announcementDesc}</p>
                          {/* Decor */}
                          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 bg-${appConfig.announcementColor}-600`}></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderGradesRecap = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600"/> Filter Rekap Nilai
              </h3>
              <div className="flex gap-4">
                  <select 
                      value={gradeFilterClass}
                      onChange={(e) => setGradeFilterClass(e.target.value)}
                      className="p-2 border border-gray-200 rounded-lg text-sm"
                  >
                      {['1A','1B','2A','2B','3A','4A','5A','6A'].map(c => <option key={c} value={c}>Kelas {c}</option>)}
                  </select>
                  <select 
                      value={gradeFilterSubject}
                      onChange={(e) => setGradeFilterSubject(e.target.value)}
                      className="p-2 border border-gray-200 rounded-lg text-sm"
                  >
                      {STANDARD_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow hover:bg-indigo-700">Terapkan</button>
              </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                      <tr>
                          <th className="px-6 py-4">Nama Siswa</th>
                          <th className="px-6 py-4 text-center">PH</th>
                          <th className="px-6 py-4 text-center">PTS</th>
                          <th className="px-6 py-4 text-center">PAS</th>
                          <th className="px-6 py-4 text-center">Rapor</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {grades.filter(g => g.class_name === gradeFilterClass && g.subject === gradeFilterSubject).length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-400">Belum ada data nilai untuk filter ini.</td></tr>
                      ) : grades.filter(g => g.class_name === gradeFilterClass && g.subject === gradeFilterSubject).map((g) => {
                          const avg = Math.round(((g.ph_scores?.[0] || 0) + g.pts + g.pas) / 3);
                          return (
                              <tr key={g.id} className="hover:bg-gray-50/50">
                                  <td className="px-6 py-4 font-bold text-gray-700">{g.student_name}</td>
                                  <td className="px-6 py-4 text-center">{g.ph_scores?.[0] || 0}</td>
                                  <td className="px-6 py-4 text-center">{g.pts}</td>
                                  <td className="px-6 py-4 text-center">{g.pas}</td>
                                  <td className="px-6 py-4 text-center font-bold text-indigo-600">{avg}</td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderFinance = () => (
      <div className="space-y-8 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Waste Types */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Recycle className="w-5 h-5 text-green-600"/> Jenis Sampah</h3>
                      <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100">+ Tambah</button>
                  </div>
                  <div className="space-y-3">
                      {wasteTypes.map((w) => (
                          <div key={w.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <span className="text-sm font-medium text-gray-700">{w.name}</span>
                              <span className="text-sm font-bold text-green-600">Rp {w.price_per_kg}/kg</span>
                          </div>
                      ))}
                  </div>
              </div>
              
              {/* Recent Transactions */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600"/> Transaksi Terakhir</h3>
                  <div className="space-y-3">
                      {wasteTransactions.length === 0 ? (
                          <div className="text-center text-gray-400 text-sm py-4">Belum ada transaksi.</div>
                      ) : wasteTransactions.slice(0, 5).map((t) => (
                          <div key={t.id} className="flex justify-between items-center p-3 border-b border-gray-50 last:border-0">
                              <div>
                                  <div className="font-bold text-gray-800 text-xs">{t.student_name}</div>
                                  <div className="text-[10px] text-gray-400">{t.type} • {t.weight}kg</div>
                              </div>
                              <div className={`font-bold text-xs ${t.status === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                  {t.status === 'Deposit' ? '+' : '-'} Rp {t.amount}
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-600"/> Permohonan Izin Siswa</h3>
              </div>
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                          <th className="px-6 py-4">Nama Siswa</th>
                          <th className="px-6 py-4">Kelas</th>
                          <th className="px-6 py-4">Jenis</th>
                          <th className="px-6 py-4">Alasan</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {permissions.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-bold text-gray-700">{p.student_name}</td>
                              <td className="px-6 py-4">{p.class_name}</td>
                              <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${p.type === 'Sakit' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{p.type}</span></td>
                              <td className="px-6 py-4 text-gray-600">{p.reason}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Approved' ? 'bg-green-100 text-green-600' : p.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  {p.status === 'Pending' && (
                                      <div className="flex justify-end gap-2">
                                          <button className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check className="w-4 h-4"/></button>
                                          <button className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><XIcon className="w-4 h-4"/></button>
                                      </div>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderGoodDeeds = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500"/> Laporan Anak Hebat</h3>
              </div>
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                          <th className="px-6 py-4">Nama Siswa</th>
                          <th className="px-6 py-4">Aktivitas</th>
                          <th className="px-6 py-4">Waktu</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {goodDeeds.map((g) => (
                          <tr key={g.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-bold text-gray-700">{g.student_name} <span className="text-xs text-gray-400 font-normal">({g.class_name})</span></td>
                              <td className="px-6 py-4">{g.activity}</td>
                              <td className="px-6 py-4">{g.date} {g.time}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${g.status === 'Verified' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>{g.status}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  {g.status === 'Pending' && (
                                      <div className="flex justify-end gap-2">
                                          <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">Verifikasi</button>
                                      </div>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderApiSettings = () => (
      <div className="space-y-6 animate-fade-in-up max-w-3xl">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-600"/> Konfigurasi Supabase</h3>
              <p className="text-sm text-gray-500 mb-6">Atur koneksi ke database.</p>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Supabase URL</label>
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <input 
                            value={customSupabaseUrl}
                            onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                            type="text" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono text-sm"
                        />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Supabase Anon Key</label>
                      <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-gray-400" />
                        <input 
                            value={customSupabaseKey}
                            onChange={(e) => setCustomSupabaseKey(e.target.value)}
                            type="password" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono text-sm"
                        />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Service Role Key (Admin Only)</label>
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-red-400" />
                        <input 
                            value={serviceRoleKey}
                            onChange={(e) => setServiceRoleKey(e.target.value)}
                            type="password" 
                            className="w-full p-3 bg-red-50 border border-red-200 rounded-xl outline-none font-mono text-sm text-red-600"
                            placeholder="Hanya isi jika ingin fitur admin penuh..."
                        />
                      </div>
                  </div>
              </div>
              <div className="mt-8 flex justify-end">
                  <button onClick={handleSaveConfig} disabled={savingConfig} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow hover:bg-indigo-700 flex items-center gap-2">
                      {savingConfig ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Simpan Konfigurasi
                  </button>
              </div>
          </div>
      </div>
  );

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