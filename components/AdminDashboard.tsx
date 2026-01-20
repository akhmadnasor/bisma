import React, { useState, useEffect } from 'react';
import { 
  Users, CreditCard, Megaphone, FileText, 
  LayoutDashboard, UserPlus, GraduationCap, DollarSign,
  CalendarRange, Printer, Search, LogOut, MoreHorizontal,
  Edit, Trash2, Save, X, Plus, ChevronLeft, ChevronRight, CheckCircle,
  Eye, EyeOff, KeyRound, Lock, Settings, Calendar, School,
  FileSpreadsheet, Mail, Star, Filter, Download, CheckSquare, Square,
  Globe, MessageCircle, Menu, ExternalLink, Clock, Upload, Database, Key, Server,
  Recycle, LayoutTemplate, Trophy, ArrowLeft, Palette, Info
} from 'lucide-react';
import { AppConfig, TrashTransaction } from '../types';
import { supabase } from '../services/supabase';

interface AdminProps {
  onLogout: () => void;
}

// --- MOCK DATA TYPES ---
interface Student { id: number; name: string; nisn: string; class: string; status: 'Active' | 'Inactive'; spp_status: 'Lunas' | 'Menunggak'; password?: string; }
interface Teacher { id: number; name: string; nip: string; subject: string; status: 'Active' | 'Leave'; password?: string; wali_kelas?: string; }
interface ScheduleItem { id: number; day: string; time: string; class: string; subject: string; teacher: string; }
interface Transaction { id: number; student: string; class: string; amount: number; date: string; type: 'SPP' | 'Uang Gedung'; }
interface Holiday { id: number; date: string; description: string; isFullDay: boolean; affectedHours: number[]; }
interface GradeLog { id: number; student: string; class: string; subject: string; teacher: string; score: number; type: 'UH' | 'UTS' | 'UAS'; }
interface GoodDeedLog { id: number; student: string; class: string; deed: string; date: string; status: 'Verified' | 'Pending'; }

// --- INITIAL MOCK DATA ---
const INITIAL_STUDENTS: Student[] = [
    { id: 1, name: 'Ahmad Dahlan', nisn: '304910293', class: '5A', status: 'Active', spp_status: 'Lunas', password: 'siswa' },
    { id: 2, name: 'Budi Santoso', nisn: '304910294', class: '5A', status: 'Active', spp_status: 'Menunggak', password: 'siswa' },
    { id: 3, name: 'Citra Kirana', nisn: '304910295', class: '4B', status: 'Active', spp_status: 'Lunas', password: 'siswa' },
    { id: 4, name: 'Dewi Sartika', nisn: '304910296', class: '6A', status: 'Inactive', spp_status: 'Lunas', password: 'siswa' },
    { id: 5, name: 'Eko Patrio', nisn: '304910297', class: '3A', status: 'Active', spp_status: 'Menunggak', password: 'siswa' },
    { id: 6, name: 'Siswa Tes', nisn: '2345', class: '5A', status: 'Active', spp_status: 'Lunas', password: '1' },
];

const INITIAL_TEACHERS: Teacher[] = [
    { id: 1, name: 'Hj. Siti Aminah', nip: '198001012005012001', subject: 'PAI', status: 'Active', password: 'guru', wali_kelas: '5A' },
    { id: 2, name: 'Drs. Supriyanto', nip: '197502022000031002', subject: 'Matematika', status: 'Active', password: 'guru', wali_kelas: '-' },
    { id: 3, name: 'Rina Wati, S.Pd', nip: '199003032019032005', subject: 'Tematik', status: 'Leave', password: 'guru', wali_kelas: '3A' },
    { id: 4, name: 'Bambang Gentolet', nip: '198504042010011003', subject: 'PJOK', status: 'Active', password: 'guru', wali_kelas: '-' },
    { id: 5, name: 'Guru Tes', nip: '12345', subject: 'Bahasa Inggris', status: 'Active', password: '1', wali_kelas: '-' },
];

const INITIAL_SCHEDULES: ScheduleItem[] = [
    { id: 1, day: 'Senin', time: 'Jam Ke-1, 2', class: '5A', subject: 'Upacara & Tematik', teacher: 'Rina Wati, S.Pd' },
    { id: 2, day: 'Senin', time: 'Jam Ke-3, 4', class: '5A', subject: 'Matematika', teacher: 'Drs. Supriyanto' },
    { id: 3, day: 'Senin', time: 'Jam Ke-5', class: '6A', subject: 'PJOK', teacher: 'Bambang Gentolet' },
    { id: 4, day: 'Selasa', time: 'Jam Ke-1, 2', class: '4B', subject: 'PAI', teacher: 'Hj. Siti Aminah' },
    { id: 5, day: 'Rabu', time: 'Jam Ke-8', class: 'All', subject: 'Ekstrakurikuler Pramuka', teacher: 'Bambang Gentolet' },
];

const INITIAL_TRASH_RATES = [
    { type: 'Plastik Gelas', price: 2000 },
    { type: 'Kertas/Karton', price: 1500 },
    { type: 'Botol Plastik', price: 2500 },
    { type: 'Kaleng', price: 5000 },
];

const INITIAL_TRASH_TRANSACTIONS: TrashTransaction[] = [
    { id: 1, date: '2026-03-14', student_name: 'Ahmad Dahlan', type: 'Plastik Gelas', weight: 2.5, amount: 5000, status: 'Deposit' },
    { id: 2, date: '2026-03-15', student_name: 'Budi Santoso', type: 'Kertas/Karton', weight: 1, amount: 1500, status: 'Deposit' },
];

const INITIAL_GRADES: GradeLog[] = [
    { id: 1, student: 'Ahmad Dahlan', class: '5A', subject: 'Matematika', teacher: 'Drs. Supriyanto', score: 85, type: 'UH' },
    { id: 2, student: 'Budi Santoso', class: '5A', subject: 'Matematika', teacher: 'Drs. Supriyanto', score: 78, type: 'UH' },
    { id: 3, student: 'Ahmad Dahlan', class: '5A', subject: 'PAI', teacher: 'Hj. Siti Aminah', score: 92, type: 'UTS' },
];

const INITIAL_GOOD_DEEDS: GoodDeedLog[] = [
    { id: 1, student: 'Ahmad Dahlan', class: '5A', deed: 'Membantu orang tua', date: '2026-03-10', status: 'Verified' },
    { id: 2, student: 'Budi Santoso', class: '5A', deed: 'Sholat Dhuha', date: '2026-03-11', status: 'Pending' },
];

const TEACHER_LEADERBOARD = [
    { name: 'Hj. Siti Aminah', poin: 150, class: '5A' },
    { name: 'Drs. Supriyanto', poin: 145, class: '4B' },
    { name: 'Bambang Gentolet', poin: 130, class: 'PJOK' },
];

const STANDARD_SUBJECTS = [
    'Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'PPKn', 
    'PAI', 'PJOK', 'Seni Budaya', 'Bahasa Inggris', 'Tematik', 'Bahasa Daerah'
];

const MENU_CONFIG = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'app_config', label: 'App & Sekolah', icon: LayoutTemplate },
    { id: 'students', label: 'Data Siswa', icon: GraduationCap },
    { id: 'teachers', label: 'Data Guru', icon: Users },
    { id: 'schedule', label: 'Jadwal KBM', icon: CalendarRange },
    { id: 'finance', label: 'Bank Sampah & Keuangan', icon: Recycle },
    { id: 'grades', label: 'Rekap Nilai', icon: FileSpreadsheet },
    { id: 'letters', label: 'Persuratan', icon: Mail },
    { id: 'good_deeds', label: 'Anak Hebat', icon: Star },
    { id: 'api_settings', label: 'API & Integrasi', icon: Database },
];

const PasswordCell = ({ value }: { value: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-xs px-2 py-1 rounded border ${show ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
        {show ? value : '•••••••'}
      </span>
      <button onClick={() => setShow(!show)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600 transition-colors" title={show ? "Sembunyikan" : "Lihat Password"}>
        {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </div>
  );
};

const AdminDashboard: React.FC<AdminProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data States
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [grades, setGrades] = useState<GradeLog[]>(INITIAL_GRADES);
  const [goodDeeds, setGoodDeeds] = useState<GoodDeedLog[]>(INITIAL_GOOD_DEEDS);
  
  // App Config
  const [appConfig, setAppConfig] = useState<AppConfig>({
      appName: 'BISMA APP',
      schoolName: 'SDN BAUJENG 1',
      logoUrl1x1: 'https://via.placeholder.com/100',
      logoUrl3x4: 'https://via.placeholder.com/300x400',
      logoUrl4x3: 'https://via.placeholder.com/400x300',
      letterHeadUrl: 'https://via.placeholder.com/800x200?text=KOP+SURAT+SEKOLAH',
      announcementColor: 'yellow',
      customMenus: []
  });

  // Trash Bank
  const [trashRates, setTrashRates] = useState(INITIAL_TRASH_RATES);
  const [trashTransactions, setTrashTransactions] = useState(INITIAL_TRASH_TRANSACTIONS);
  const [trashForm, setTrashForm] = useState({ student: '', type: 'Plastik Gelas', weight: 0 });

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLetterForm, setActiveLetterForm] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'student' | 'teacher' | 'schedule' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState({
      selectedHours: [] as number[],
      selectedSubject: '',
      isEkstra: false,
      customSubject: ''
  });

  // Load Data from Supabase
  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch Students (Example Implementation)
            const { data: sData } = await supabase.from('students').select('*');
            if (sData && sData.length > 0) {
                const mappedStudents = sData.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    nisn: s.nisn || s.id.toString(),
                    class: s.class_name || '1A',
                    status: 'Active',
                    spp_status: 'Lunas',
                    password: 'siswa'
                }));
                setStudents(mappedStudents);
            }

            // Fetch Teachers
            const { data: tData } = await supabase.from('teachers').select('*');
            if (tData && tData.length > 0) {
                const mappedTeachers = tData.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    nip: t.nip || '-',
                    subject: 'Guru Kelas',
                    status: 'Active',
                    password: 'guru',
                    wali_kelas: '-'
                }));
                setTeachers(mappedTeachers);
            }
        } catch (e) {
            console.error("Error fetching data from Supabase, utilizing mock data.", e);
        }
    };
    fetchData();
  }, []);

  // --- Handlers ---
  const handleDelete = (id: number, type: 'student' | 'teacher' | 'schedule') => {
      if (!confirm('Hapus data ini?')) return;
      if (type === 'student') setStudents(prev => prev.filter(i => i.id !== id));
      if (type === 'teacher') setTeachers(prev => prev.filter(i => i.id !== id));
      if (type === 'schedule') setSchedules(prev => prev.filter(i => i.id !== id));
  };

  const handleEditClick = (item: any, type: 'student' | 'teacher' | 'schedule') => {
      setEditingItem(item);
      setModalType(type);
      if (type === 'schedule') {
          // Parse time "Jam Ke-1, 2" to array
          const timeStr = item.time.replace('Jam Ke-', '');
          const hours = timeStr.split(', ').map((s: string) => parseInt(s));
          const isStd = STANDARD_SUBJECTS.includes(item.subject);
          setScheduleForm({
              selectedHours: hours,
              selectedSubject: isStd ? item.subject : '',
              isEkstra: !isStd,
              customSubject: !isStd ? item.subject : ''
          });
      }
      setIsModalOpen(true);
  };

  const handleAddClick = (type: 'student' | 'teacher' | 'schedule') => {
      setEditingItem(null);
      setModalType(type);
      setScheduleForm({ selectedHours: [], selectedSubject: '', isEkstra: false, customSubject: '' });
      setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());

      if (modalType === 'student') {
          const newItem = {
              id: editingItem ? editingItem.id : Date.now(),
              name: data.name as string,
              nisn: data.nisn as string,
              class: data.class as string,
              status: data.status as any,
              password: data.password as string,
              spp_status: editingItem?.spp_status || 'Menunggak'
          };
          setStudents(prev => editingItem ? prev.map(i => i.id === newItem.id ? { ...i, ...newItem } : i) : [...prev, newItem as any]);
      } else if (modalType === 'teacher') {
          const newItem = {
              id: editingItem ? editingItem.id : Date.now(),
              name: data.name as string,
              nip: data.nip as string,
              subject: data.subject as string,
              status: data.status as any,
              password: data.password as string,
              wali_kelas: data.wali_kelas as string
          };
          setTeachers(prev => editingItem ? prev.map(i => i.id === newItem.id ? { ...i, ...newItem } : i) : [...prev, newItem as any]);
      } else if (modalType === 'schedule') {
          const hours = scheduleForm.selectedHours.sort((a,b)=>a-b).join(', ');
          const subject = scheduleForm.isEkstra ? scheduleForm.customSubject : scheduleForm.selectedSubject;
          const newItem = {
              id: editingItem ? editingItem.id : Date.now(),
              day: data.day as string,
              time: `Jam Ke-${hours}`,
              class: data.class as string,
              subject,
              teacher: data.teacher as string
          };
          setSchedules(prev => editingItem ? prev.map(i => i.id === newItem.id ? { ...i, ...newItem } : i) : [...prev, newItem]);
      }
      setIsModalOpen(false);
  };

  const handleTrashSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const rate = trashRates.find(r => r.type === trashForm.type)?.price || 0;
      const amount = rate * trashForm.weight;
      const newTx: TrashTransaction = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          student_name: trashForm.student,
          type: trashForm.type,
          weight: trashForm.weight,
          amount,
          status: 'Deposit'
      };
      setTrashTransactions([newTx, ...trashTransactions]);
      alert(`Berhasil! Saldo +Rp ${amount.toLocaleString()}`);
      setTrashForm({ student: '', type: 'Plastik Gelas', weight: 0 });
  };

  const handleAddCustomMenu = () => {
    const label = prompt('Nama Menu Baru:');
    if (!label) return;
    const url = prompt('URL Link:');
    if (!url) return;
    
    setAppConfig(prev => ({
        ...prev,
        customMenus: [...prev.customMenus, { label, url, icon: 'Globe' }]
    }));
  };

  const handleSaveConfig = () => {
      alert("Perubahan konfigurasi berhasil disimpan!");
  };

  // --- Renderers ---

  const renderOverview = () => (
      <div className="space-y-6 animate-fade-in-up">
          {/* Reward Guru Widget - Updated to Blue/Green */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                  <h3 className="font-black text-2xl flex items-center gap-2 mb-4"><Trophy className="w-8 h-8 text-yellow-300"/> REWARD GURU TERBAIK</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {TEACHER_LEADERBOARD.map((t, i) => (
                          <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-3 border border-white/20">
                              <div className="font-black text-4xl opacity-50 text-blue-100">#{i+1}</div>
                              <div>
                                  <div className="font-bold text-lg text-white">{t.name}</div>
                                  <div className="text-xs text-blue-50 opacity-90">{t.class} • {t.poin} Poin Keaktifan</div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="text-gray-500 text-xs font-bold uppercase">Total Siswa</div><div className="text-3xl font-black text-gray-800">{students.length}</div></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="text-gray-500 text-xs font-bold uppercase">Total Guru</div><div className="text-3xl font-black text-gray-800">{teachers.length}</div></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="text-gray-500 text-xs font-bold uppercase">Saldo Bank Sampah</div><div className="text-3xl font-black text-green-600">Rp 1.2M</div></div>
          </div>
      </div>
  );

  const renderTable = (headers: string[], data: any[], type: 'student' | 'teacher' | 'schedule') => (
      <div className="space-y-4 animate-fade-in-up">
          <div className="flex justify-end gap-2">
              <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"><Upload className="w-4 h-4"/> Import Excel</button>
              <button className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"><Download className="w-4 h-4"/> Export CSV</button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                          <tr>
                              {headers.map((h, i) => <th key={i} className="px-6 py-4">{h}</th>)}
                              <th className="px-6 py-4 text-right">Aksi</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {data.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                {type === 'student' && (
                                    <>
                                        <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.nisn}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">{item.class}</span></td>
                                        <td className="px-6 py-4"><PasswordCell value={item.password || '123456'} /></td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{item.status}</span></td>
                                    </>
                                )}
                                {type === 'teacher' && (
                                    <>
                                        <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.nip}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.subject}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">{item.wali_kelas || '-'}</span></td>
                                        <td className="px-6 py-4"><PasswordCell value={item.password || '123456'} /></td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{item.status}</span></td>
                                    </>
                                )}
                                {type === 'schedule' && (
                                    <>
                                        <td className="px-6 py-4 font-bold text-gray-800">{item.day}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-indigo-600 bg-indigo-50 inline-block rounded m-2">{item.time}</td>
                                        <td className="px-6 py-4 font-bold">{item.class}</td>
                                        <td className="px-6 py-4 text-gray-800">{item.subject}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{item.teacher}</td>
                                    </>
                                )}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleEditClick(item, type)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(item.id, type)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
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

  const renderAppConfig = () => {
    const announcementColors = [
      { name: 'Kuning (Default)', value: 'yellow', class: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
      { name: 'Biru', value: 'blue', class: 'bg-blue-50 text-blue-600 border-blue-200' },
      { name: 'Hijau', value: 'green', class: 'bg-green-50 text-green-600 border-green-200' },
      { name: 'Pink', value: 'pink', class: 'bg-pink-50 text-pink-600 border-pink-200' },
      { name: 'Ungu', value: 'purple', class: 'bg-purple-50 text-purple-600 border-purple-200' },
    ];

    return (
      <div className="animate-fade-in-up space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><LayoutTemplate className="w-5 h-5"/> Identitas Aplikasi</h3>
                  <div><label className="text-xs font-bold text-gray-500">Nama Aplikasi</label><input type="text" value={appConfig.appName} onChange={e=>setAppConfig({...appConfig, appName: e.target.value})} className="w-full p-3 border rounded-xl"/></div>
                  <div><label className="text-xs font-bold text-gray-500">Nama Sekolah</label><input type="text" value={appConfig.schoolName} onChange={e=>setAppConfig({...appConfig, schoolName: e.target.value})} className="w-full p-3 border rounded-xl"/></div>
                  
                  {/* Color Settings for Announcement */}
                  <div className="pt-2">
                      <label className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-2"><Palette className="w-3 h-3"/> Tema Warna Pengumuman</label>
                      <div className="flex gap-2 flex-wrap">
                          {announcementColors.map(c => (
                              <button 
                                key={c.value}
                                onClick={() => setAppConfig({...appConfig, announcementColor: c.value as any})}
                                className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${appConfig.announcementColor === c.value ? 'ring-2 ring-offset-1 ring-gray-400 ' + c.class : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                              >
                                {c.name}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500">Logo 1:1</label><div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border"><img src={appConfig.logoUrl1x1} className="w-full h-full object-cover"/></div><input type="text" className="w-full text-[10px] border rounded p-1" placeholder="URL..." value={appConfig.logoUrl1x1} onChange={e=>setAppConfig({...appConfig, logoUrl1x1: e.target.value})}/></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500">Logo 3:4</label><div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border"><img src={appConfig.logoUrl3x4} className="w-full h-full object-cover"/></div><input type="text" className="w-full text-[10px] border rounded p-1" placeholder="URL..." value={appConfig.logoUrl3x4} onChange={e=>setAppConfig({...appConfig, logoUrl3x4: e.target.value})}/></div>
                      <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500">Logo 4:3</label><div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border"><img src={appConfig.logoUrl4x3} className="w-full h-full object-cover"/></div><input type="text" className="w-full text-[10px] border rounded p-1" placeholder="URL..." value={appConfig.logoUrl4x3} onChange={e=>setAppConfig({...appConfig, logoUrl4x3: e.target.value})}/></div>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Globe className="w-5 h-5"/> Menu Tambahan (Custom)</h3>
                  {appConfig.customMenus.map((m, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Globe className="w-4 h-4"/></div>
                              <div><div className="font-bold text-sm">{m.label}</div><div className="text-[10px] text-gray-400 truncate w-32">{m.url}</div></div>
                          </div>
                          <button onClick={() => { const newMenus = [...appConfig.customMenus]; newMenus.splice(i, 1); setAppConfig({...appConfig, customMenus: newMenus}); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><X className="w-4 h-4"/></button>
                      </div>
                  ))}
                  <button onClick={handleAddCustomMenu} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:bg-gray-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Tambah Menu URL</button>
              </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Info className="w-5 h-5"/> 
                  </div>
                  <div className="text-xs">
                      <strong className="block text-gray-700">Perhatian Admin</strong>
                      Pastikan data identitas sekolah dan warna tema sudah sesuai sebelum menyimpan.
                  </div>
              </div>
              <button onClick={handleSaveConfig} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> Simpan Perubahan
              </button>
          </div>
      </div>
    );
  }

  const renderFinance = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-lg text-green-700 flex items-center gap-2 mb-4"><Recycle className="w-5 h-5"/> Input Bank Sampah</h3>
                  <form onSubmit={handleTrashSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="text-xs font-bold text-gray-500">Nama Siswa</label><input required type="text" placeholder="Cari Siswa..." value={trashForm.student} onChange={e=>setTrashForm({...trashForm, student: e.target.value})} className="w-full p-3 border rounded-xl"/></div>
                      <div><label className="text-xs font-bold text-gray-500">Jenis Sampah</label><select value={trashForm.type} onChange={e=>setTrashForm({...trashForm, type: e.target.value})} className="w-full p-3 border rounded-xl">{trashRates.map(r=><option key={r.type} value={r.type}>{r.type} (@{r.price})</option>)}</select></div>
                      <div><label className="text-xs font-bold text-gray-500">Berat (Kg)</label><input required type="number" step="0.1" value={trashForm.weight} onChange={e=>setTrashForm({...trashForm, weight: parseFloat(e.target.value)})} className="w-full p-3 border rounded-xl"/></div>
                      <div className="flex items-end"><button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">Simpan Transaksi</button></div>
                  </form>
              </div>
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">Riwayat Transaksi Terakhir</div>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-white text-gray-500"><tr><th className="p-4">Tanggal</th><th className="p-4">Siswa</th><th className="p-4">Item</th><th className="p-4 text-right">Total</th></tr></thead>
                      <tbody>{trashTransactions.map(t => (<tr key={t.id} className="border-t border-gray-100"><td className="p-4 text-gray-500">{t.date}</td><td className="p-4 font-bold">{t.student_name}</td><td className="p-4">{t.type} ({t.weight}kg)</td><td className="p-4 text-right font-bold text-green-600">+Rp {t.amount.toLocaleString()}</td></tr>))}</tbody>
                  </table>
              </div>
          </div>
          <div className="space-y-6">
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                  <h4 className="font-bold text-green-800 mb-3">Konversi Harga</h4>
                  {trashRates.map((r, i) => (<div key={i} className="flex justify-between items-center p-2 bg-white rounded-lg border border-green-100 mb-2"><span className="text-sm font-medium">{r.type}</span><span className="text-sm font-bold text-green-600">Rp {r.price}/kg</span></div>))}
              </div>
          </div>
      </div>
  );

  const renderLetters = () => (
      <div className="space-y-6 animate-fade-in-up">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mb-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">Pengaturan Kop Surat</h3>
              <div className="flex gap-4 items-center">
                  <img src={appConfig.letterHeadUrl} alt="Kop" className="h-20 object-contain border rounded bg-gray-50" />
                  <div className="flex-1"><label className="text-xs font-bold text-gray-500">URL Kop Surat (Image)</label><input type="text" className="w-full p-2 border rounded-xl" value={appConfig.letterHeadUrl} onChange={e=>setAppConfig({...appConfig, letterHeadUrl: e.target.value})}/></div>
              </div>
          </div>
          {!activeLetterForm ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['Surat Keterangan Aktif', 'Surat Panggilan Orang Tua', 'Surat Mutasi Siswa'].map((letter, idx) => (
                      <div key={idx} onClick={() => setActiveLetterForm(letter)} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6"/></div>
                          <h4 className="font-bold text-gray-800">{letter}</h4><p className="text-xs text-gray-400 mt-2">Klik untuk buat surat</p>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-lg relative">
                  <button onClick={()=>setActiveLetterForm(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><Printer className="w-5 h-5 text-purple-600"/> Buat {activeLetterForm}</h3>
                  <div className="mb-8 border-b pb-4"><img src={appConfig.letterHeadUrl} className="w-full max-h-24 object-contain" /></div>
                  <form className="space-y-4 max-w-lg mx-auto">
                      <div><label className="font-bold text-sm">Nomor Surat</label><input type="text" className="w-full p-2 border rounded-lg" defaultValue="421.2/001/SD/2026"/></div>
                      <div><label className="font-bold text-sm">Nama Siswa</label><input type="text" className="w-full p-2 border rounded-lg"/></div>
                      <div><label className="font-bold text-sm">Kelas</label><input type="text" className="w-full p-2 border rounded-lg"/></div>
                      <div className="flex gap-2 pt-4">
                          <button type="button" onClick={()=>setActiveLetterForm(null)} className="flex-1 py-3 border rounded-xl font-bold text-gray-500">Batal</button>
                          <button type="button" onClick={()=>alert('Mencetak PDF...')} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">Cetak PDF</button>
                      </div>
                  </form>
              </div>
          )}
      </div>
  );

  const renderGrades = () => (
    <div className="space-y-4 animate-fade-in-up">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr><th className="px-6 py-4">Siswa</th><th className="px-6 py-4">Kelas</th><th className="px-6 py-4">Mapel</th><th className="px-6 py-4">Nilai</th><th className="px-6 py-4">Tipe</th><th className="px-6 py-4">Guru</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">{grades.map(g => (<tr key={g.id} className="hover:bg-gray-50/50"><td className="px-6 py-4 font-bold text-gray-800">{g.student}</td><td className="px-6 py-4">{g.class}</td><td className="px-6 py-4">{g.subject}</td><td className="px-6 py-4 font-bold text-indigo-600">{g.score}</td><td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{g.type}</span></td><td className="px-6 py-4 text-xs text-gray-500">{g.teacher}</td></tr>))}</tbody>
            </table>
        </div>
    </div>
  );

  const renderGoodDeeds = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
        <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100"><tr><th className="px-6 py-4">Tanggal</th><th className="px-6 py-4">Siswa</th><th className="px-6 py-4">Kegiatan Baik</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{goodDeeds.map(d => (<tr key={d.id} className="hover:bg-gray-50/50"><td className="px-6 py-4 text-gray-500">{d.date}</td><td className="px-6 py-4 font-bold text-gray-800">{d.student}</td><td className="px-6 py-4">{d.deed}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${d.status === 'Verified' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{d.status}</span></td><td className="px-6 py-4 text-right">{d.status === 'Pending' && <button className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700">Verifikasi</button>}</td></tr>))}</tbody>
        </table>
    </div>
  );

  const renderApiSettings = () => (
      <div className="animate-fade-in-up bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-600"/> Konfigurasi Integrasi</h3>
          <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100"><h4 className="font-bold text-sm text-indigo-800 mb-2">Google Gemini API Keys</h4><div className="space-y-2">{[0,1,2].map(i=><input key={i} type="password" placeholder={`API Key ${i+1}`} className="w-full p-2 border rounded-lg bg-white"/>)}</div></div>
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100"><h4 className="font-bold text-sm text-green-800 mb-2">Supabase Configuration</h4><input placeholder="Project URL" className="w-full p-2 border rounded-lg mb-2"/><input type="password" placeholder="Anon Key" className="w-full p-2 border rounded-lg"/></div>
              <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Simpan Konfigurasi</button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      {/* Mobile Sidebar Toggle Overlay */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1e1b4b] text-white z-50 shadow-xl custom-scrollbar overflow-y-auto transform transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-indigo-900/50 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white">BISMA <span className="text-xs font-normal text-indigo-300 block">Admin Portal</span></h1>
            </div>
            {/* Close button for mobile */}
            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-1 text-indigo-300 hover:text-white"><ArrowLeft className="w-6 h-6"/></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {MENU_CONFIG.map(item => (
                <button key={item.id} onClick={() => { setActiveView(item.id); setIsMobileMenuOpen(false); setSearchTerm(''); }} className={`flex items-center gap-3 w-full p-3 rounded-xl font-medium transition-all duration-200 ${activeView === item.id ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50 text-white translate-x-1' : 'text-indigo-200 hover:bg-indigo-900/50 hover:text-white'}`}>
                    <item.icon className="w-5 h-5"/> {item.label}
                </button>
            ))}
        </nav>
        <div className="p-4 border-t border-indigo-900/50">
             <button onClick={onLogout} className="flex items-center gap-3 w-full p-3 text-red-300 hover:bg-red-900/20 rounded-xl font-medium transition-colors"><LogOut className="w-5 h-5"/> Keluar</button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="lg:hidden bg-[#1e1b4b] text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
         <span className="font-bold">BISMA ADMIN</span>
         <div className="flex gap-2">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-1"><Menu className="w-6 h-6"/></button>
         </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="lg:ml-64 p-6 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in-up">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 capitalize">{MENU_CONFIG.find(m=>m.id===activeView)?.label}</h2>
                <p className="text-gray-500 text-sm">Kelola data sekolah dengan mudah.</p>
            </div>
            
            {['students', 'teachers', 'schedule'].includes(activeView) && (
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Cari data..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 shadow-sm" />
                    </div>
                    <button onClick={() => handleAddClick(activeView === 'students' ? 'student' : activeView === 'teachers' ? 'teacher' : 'schedule')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"><Plus className="w-4 h-4" /> Tambah</button>
                </div>
            )}
        </header>

        {activeView === 'overview' && renderOverview()}
        {activeView === 'app_config' && renderAppConfig()}
        {activeView === 'finance' && renderFinance()}
        {activeView === 'grades' && renderGrades()}
        {activeView === 'letters' && renderLetters()}
        {activeView === 'good_deeds' && renderGoodDeeds()}
        {activeView === 'api_settings' && renderApiSettings()}
        
        {activeView === 'students' && renderTable(['Nama Lengkap', 'NISN', 'Kelas', 'Password', 'Status'], students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())), 'student')}
        {activeView === 'teachers' && renderTable(['Nama Guru', 'NIP', 'Mata Pelajaran', 'Wali Kelas', 'Password', 'Status'], teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), 'teacher')}
        {activeView === 'schedule' && renderTable(['Hari', 'Jam', 'Kelas', 'Mapel / Ekstra', 'Pengajar / Pembina'], schedules.filter(s => s.class.includes(searchTerm) || s.teacher.toLowerCase().includes(searchTerm.toLowerCase())), 'schedule')}

      </main>

      {/* --- UNIFIED MODAL --- */}
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
                                    <div className="space-y-2"><label className="block text-xs font-bold text-gray-500 uppercase">Kelas</label><select name="class" defaultValue={editingItem?.class || '5A'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">{['1A','2A','3A','4A','5A','6A','All'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                </div>
                                <div className="space-y-2"><label className="block text-xs font-bold text-gray-500 uppercase">Pilih Jam (Checklist)</label><div className="grid grid-cols-4 md:grid-cols-8 gap-2">{[1,2,3,4,5,6,7,8].map(j => (<div key={j} onClick={() => { const current = scheduleForm.selectedHours; setScheduleForm({...scheduleForm, selectedHours: current.includes(j) ? current.filter(x => x !== j) : [...current, j]}); }} className={`cursor-pointer rounded-lg border-2 p-2 text-center ${scheduleForm.selectedHours.includes(j) ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}>{j}</div>))}</div></div>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                    <div className="flex justify-between items-center"><label className="block text-xs font-bold text-gray-500 uppercase">Mapel</label><button type="button" onClick={() => setScheduleForm({...scheduleForm, isEkstra: !scheduleForm.isEkstra})} className="text-xs text-indigo-600 font-bold hover:underline">{scheduleForm.isEkstra ? 'Kembali ke Mapel' : '+ Ekstra'}</button></div>
                                    {!scheduleForm.isEkstra ? (<div className="grid grid-cols-2 md:grid-cols-3 gap-2">{STANDARD_SUBJECTS.map(subj => (<div key={subj} onClick={() => setScheduleForm({...scheduleForm, selectedSubject: subj})} className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${scheduleForm.selectedSubject === subj ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600'}`}>{scheduleForm.selectedSubject === subj ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}{subj}</div>))}</div>) : (<input type="text" placeholder="Nama Ekstrakurikuler..." className="w-full p-3 border rounded-xl" value={scheduleForm.customSubject} onChange={(e) => setScheduleForm({...scheduleForm, customSubject: e.target.value})}/>)}
                                </div>
                                <div className="space-y-2"><label className="block text-xs font-bold text-gray-500 uppercase">Pengajar</label><select name="teacher" defaultValue={editingItem?.teacher} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">{teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select></div>
                            </>
                        )}
                        {modalType === 'student' && (
                            <>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label><input name="name" defaultValue={editingItem?.name} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">NISN</label><input name="nisn" defaultValue={editingItem?.nisn} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label><select name="class" defaultValue={editingItem?.class || '1A'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl">{['1A','1B','2A','2B','3A','4A','5A','6A'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label><input name="password" defaultValue={editingItem?.password || 'siswa'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label><select name="status" defaultValue={editingItem?.status || 'Active'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                            </>
                        )}
                        {modalType === 'teacher' && (
                            <>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Guru</label><input name="name" defaultValue={editingItem?.name} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">NIP</label><input name="nip" defaultValue={editingItem?.nip} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mapel</label><input name="subject" defaultValue={editingItem?.subject} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wali Kelas</label><select name="wali_kelas" defaultValue={editingItem?.wali_kelas || '-'} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"><option value="-">Bukan Wali Kelas</option>{['1A','1B','2A','2B','3A','4A','5A','6A'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
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
    </div>
  );
};

export default AdminDashboard;