import React, { useState, useEffect } from 'react';
import { 
  LogOut, FilePenLine, Printer, ClipboardCheck, 
  ShieldAlert, QrCode, Calculator, MessageCircle, Star, ArrowRight, Bot, Loader2,
  Calendar, Camera, Search, ArrowLeft, Home, Save, Recycle, ListChecks, 
  Plus, Image, BookOpen, Clock, X, CheckSquare, Briefcase, LayoutGrid, CalendarRange, User,
  Check, TrendingUp, ChevronRight, MapPin, FileText
} from 'lucide-react';
import { sendMessageToGemini, ChatMessage } from '../services/gemini';

interface TeacherDashboardProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onLogout, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  
  // Schedule Popup State
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);

  // Data States
  const [inputNilaiTab, setInputNilaiTab] = useState<'pengetahuan' | 'keterampilan'>('pengetahuan');
  const [nilaiType, setNilaiType] = useState('PH1');
  const [trashWeight, setTrashWeight] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [showAddPelanggaran, setShowAddPelanggaran] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // AI Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const hasTrashRole = true;

  // Determine Avatar based on name (Simple check)
  const isFemale = user.user_metadata?.name?.toLowerCase().includes('siti') || 
                   user.user_metadata?.name?.toLowerCase().includes('rina') || 
                   user.user_metadata?.name?.toLowerCase().includes('ibu');
                   
  const avatarUrl = isFemale 
    ? "https://cdn-icons-png.flaticon.com/512/4202/4202835.png" // Hijab Avatar
    : "https://cdn-icons-png.flaticon.com/512/4202/4202843.png"; // Male Muslim Avatar

  // Mock Progress Data
  const weeklyJPTarget = 24;
  const currentJP = 18;
  const jpPercentage = Math.round((currentJP / weeklyJPTarget) * 100);

  // INITIAL LOAD EFFECT
  useEffect(() => {
    setShowSchedulePopup(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Updated Menu Grid - Aesthetic 3D Style
  const menuItems = [
      { id: 'jurnal', label: 'Isi Jurnal', icon: FilePenLine, color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-200' },
      { id: 'jadwal', label: 'Jadwal Ku', icon: CalendarRange, color: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-200' }, // New
      { id: 'nilai', label: 'Input Nilai', icon: Calculator, color: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-200' },
      
      { id: 'presensi_qr', label: 'Scan Absensi', icon: QrCode, color: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-200' },
      { id: 'anak_hebat', label: 'Anak Hebat', icon: Star, color: 'from-yellow-400 to-yellow-600', shadow: 'shadow-yellow-200' },
      { id: 'keterlaksanaan_kbm', label: 'Keterlaksanaan', icon: ClipboardCheck, color: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-200' },
      
      { id: 'kedisiplinan', label: 'Kedisiplinan', icon: ShieldAlert, color: 'from-red-400 to-red-600', shadow: 'shadow-red-200' },
      { id: 'rpp', label: 'RPP Generator', icon: BookOpen, color: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-200' },
      { id: 'laporan', label: 'Cetak Jurnal', icon: Printer, color: 'from-gray-400 to-gray-600', shadow: 'shadow-gray-200' },
  ];

  const handleMenuClick = (id: string) => {
      if (['jurnal', 'rpp'].includes(id)) {
          onNavigate(id);
      } else {
          setActiveFeature(id);
      }
  };

  const handleStartScan = async () => {
      setCameraError('');
      try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          setIsScanning(true);
      } catch (err) {
          console.error(err);
          setCameraError('Izin kamera ditolak. Pastikan izin browser aktif.');
      }
  };

  const handleSendChat = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim()) return;
      setIsChatLoading(true);
      setChatMessages(p => [...p, { role: 'user', text: chatInput }]);
      const txt = chatInput;
      setChatInput('');
      const response = await sendMessageToGemini(txt);
      setChatMessages(p => [...p, { role: 'model', text: response }]);
      setIsChatLoading(false);
  };

  // --- SUB-FEATURES RENDERING ---
  const renderFeaturePage = () => {
    if (!activeFeature) return null;

    const FeatureHeader = ({ title, icon: Icon, color }: any) => (
        <div className={`rounded-3xl p-6 mb-6 text-white shadow-lg bg-gradient-to-r ${color} relative overflow-hidden`}>
            <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm"><Icon className="w-8 h-8"/></div>
                <h2 className="text-2xl font-black">{title}</h2>
            </div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        </div>
    );

    switch (activeFeature) {
        case 'jadwal':
            return (
                <div className="space-y-6">
                    <FeatureHeader title="Jadwal Mengajar & Target" icon={CalendarRange} color="from-cyan-500 to-blue-600" />
                    
                    {/* Progress Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="flex justify-between items-end mb-4 relative z-10">
                            <div>
                                <h3 className="text-gray-500 font-bold text-sm uppercase">Ketercapaian Minggu Ini</h3>
                                <div className="text-4xl font-black text-cyan-600">{currentJP} <span className="text-lg text-gray-400 font-medium">/ {weeklyJPTarget} JP</span></div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-cyan-600">{jpPercentage}%</div>
                                <div className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded">+2% dr minggu lalu</div>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-4 mb-2 relative z-10">
                            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-4 rounded-full transition-all duration-1000" style={{ width: `${jpPercentage}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-400 relative z-10">Target terpenuhi jika mencapai 100% di hari Sabtu.</p>
                        
                        {/* Decor */}
                        <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 text-cyan-50 opacity-50 rotate-12"/>
                    </div>

                    {/* Weekly Schedule Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { day: 'Senin', items: [{ time: '07:00 - 08:10', cls: '5A', subj: 'Upacara & Tematik' }, { time: '08:10 - 09:20', cls: '5A', subj: 'Matematika' }] },
                            { day: 'Selasa', items: [{ time: '07:00 - 08:10', cls: '4B', subj: 'Matematika' }, { time: '09:30 - 11:00', cls: '5A', subj: 'IPA' }] },
                            { day: 'Rabu', items: [{ time: '07:00 - 09:20', cls: '5A', subj: 'Bahasa Indonesia' }] },
                            { day: 'Kamis', items: [{ time: '08:00 - 10:00', cls: '6A', subj: 'Matematika' }] },
                            { day: 'Jumat', items: [{ time: '07:00 - 08:30', cls: '5A', subj: 'Senam & Bersih Diri' }] },
                            { day: 'Sabtu', items: [{ time: '07:00 - 09:00', cls: 'All', subj: 'Ekstrakurikuler' }] },
                        ].map((d, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <div className={`px-4 py-2 font-bold text-white ${d.day === 'Senin' ? 'bg-cyan-600' : 'bg-slate-400'}`}>{d.day}</div>
                                <div className="p-4 space-y-3">
                                    {d.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-3 items-start border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                            <div className="w-12 text-[10px] font-bold text-slate-500 bg-slate-50 p-1 rounded text-center">{item.time.split(' - ')[0]}</div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">{item.subj}</div>
                                                <div className="text-xs text-slate-500">Kelas {item.cls}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {d.items.length === 0 && <div className="text-xs text-slate-300 italic">Tidak ada jadwal</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case 'anak_hebat':
             return (
                 <div className="space-y-6">
                     <FeatureHeader title="Validasi Anak Hebat" icon={Star} color="from-yellow-400 to-orange-500" />
                     
                     <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800">Menunggu Validasi Guru</h3>
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">3 Baru</span>
                         </div>

                         <div className="space-y-4">
                             {[
                                 { name: 'Ahmad Dahlan', class: '5A', habit: 'Sholat Dhuha', time: '09:15' },
                                 { name: 'Budi Santoso', class: '5A', habit: 'Membantu Teman', time: '08:30' },
                                 { name: 'Citra Kirana', class: '5A', habit: 'Membuang Sampah', time: '10:00' }
                             ].map((item, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                     <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold border-2 border-white shadow-sm">
                                             {item.name.charAt(0)}
                                         </div>
                                         <div>
                                             <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                                             <div className="text-xs text-slate-500">{item.habit} • {item.time}</div>
                                         </div>
                                     </div>
                                     <div className="flex gap-2">
                                         <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4"/></button>
                                         <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check className="w-4 h-4"/></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </div>
             );

        case 'keterlaksanaan_kbm':
            return (
                <div className="space-y-6">
                    <FeatureHeader title="Monitoring KBM Realtime" icon={ClipboardCheck} color="from-amber-400 to-orange-500" />
                    
                    {/* Top Performance */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-3xl border border-orange-100 flex items-center justify-between shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="text-xs font-bold text-orange-600 uppercase mb-2 bg-orange-100 inline-block px-2 py-1 rounded-lg">🔥 Top Performance (Rajin Isi Jurnal)</div>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-white rounded-full border-2 border-orange-200 flex items-center justify-center font-bold text-orange-700 shadow-sm mx-auto">1</div>
                                    <div className="text-[10px] font-bold mt-1">Bu Siti</div>
                                </div>
                                <div className="text-center opacity-75">
                                    <div className="w-10 h-10 bg-white rounded-full border-2 border-orange-200 flex items-center justify-center font-bold text-orange-700 shadow-sm mx-auto">2</div>
                                    <div className="text-[10px] font-bold mt-1">Pak Eko</div>
                                </div>
                                <div className="text-center opacity-75">
                                    <div className="w-10 h-10 bg-white rounded-full border-2 border-orange-200 flex items-center justify-center font-bold text-orange-700 shadow-sm mx-auto">3</div>
                                    <div className="text-[10px] font-bold mt-1">Bu Rina</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Feed */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ListChecks className="w-5 h-5"/> Update Hari Ini</h4>
                        <div className="space-y-4">
                            {[
                                { name: 'Anda (Hj. Siti Aminah)', status: 'Lengkap', time: '07:15', active: true },
                                { name: 'Drs. Supriyanto', status: 'Lengkap', time: '08:00', active: false },
                                { name: 'Rina Wati, S.Pd', status: 'Mengisi...', time: 'Sekarang', active: false, typing: true },
                            ].map((g, i) => (
                                <div key={i} className={`flex justify-between items-center p-3 rounded-2xl border ${g.active ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${g.typing ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{g.name}</div>
                                            <div className="text-xs text-slate-500">{g.typing ? 'Sedang mengisi jurnal...' : `Terisi pukul ${g.time}`}</div>
                                        </div>
                                    </div>
                                    {g.active && <span className="text-[10px] font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded">You</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        case 'kedisiplinan':
            return (
                <div>
                    <FeatureHeader title="Monitoring Kedisiplinan" icon={ShieldAlert} color="from-red-600 to-rose-700" />
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center py-12">
                        <ShieldAlert className="w-16 h-16 text-slate-200 mx-auto mb-4"/>
                        <p className="text-slate-500 font-medium">Data pelanggaran dapat diinput melalui menu <br/><span className="text-red-600 font-bold">"Isi Jurnal"</span> pada langkah ke-3.</p>
                    </div>
                </div>
            );

        case 'laporan': // Cetak Jurnal
             return (
                 <div className="space-y-6">
                     <FeatureHeader title="Cetak Jurnal KBM" icon={Printer} color="from-gray-600 to-slate-700" />
                     
                     {/* Preview Container (A4 Aspect Ratio Approximation) */}
                     <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto text-slate-900 font-serif text-sm relative">
                         <div className="absolute top-4 right-4 no-print">
                             <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-sans font-bold text-xs shadow-md hover:bg-blue-700 flex items-center gap-2"><Printer className="w-4 h-4"/> Cetak PDF</button>
                         </div>

                         {/* KOP SURAT */}
                         <div className="flex items-center border-b-2 border-black pb-4 mb-6 gap-4">
                             <img src="https://i.imghippo.com/files/kldd1383bkc.png" className="w-20 h-20 object-contain" alt="Logo" />
                             <div className="text-center flex-1">
                                 <h3 className="font-bold text-lg uppercase tracking-wider">Pemerintah Kabupaten Pasuruan</h3>
                                 <h2 className="font-black text-xl uppercase">UPT Satuan Pendidikan SDN Baujeng 1</h2>
                                 <p className="text-xs italic">Jl. Raya Baujeng No. 1, Kec. Beji, Kab. Pasuruan, Jawa Timur</p>
                             </div>
                         </div>

                         {/* Content */}
                         <div className="text-center mb-6">
                             <h4 className="font-bold text-lg underline uppercase">JURNAL KEGIATAN BELAJAR MENGAJAR</h4>
                             <p className="text-sm">Bulan: Maret 2026</p>
                         </div>

                         <div className="mb-4 text-xs font-bold">
                             <p>Nama Guru : {user.user_metadata?.name}</p>
                             <p>NIP : 1928371928</p>
                             <p>Kelas : 5A</p>
                         </div>

                         <table className="w-full border-collapse border border-black text-xs mb-8">
                             <thead>
                                 <tr className="bg-gray-100">
                                     <th className="border border-black p-2">Tgl</th>
                                     <th className="border border-black p-2">Mapel</th>
                                     <th className="border border-black p-2">Materi</th>
                                     <th className="border border-black p-2">Hadir</th>
                                     <th className="border border-black p-2">Ket</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <tr>
                                     <td className="border border-black p-2 text-center">01/03</td>
                                     <td className="border border-black p-2">Matematika</td>
                                     <td className="border border-black p-2">Pecahan Desimal</td>
                                     <td className="border border-black p-2 text-center">29/30</td>
                                     <td className="border border-black p-2 text-center">Tuntas</td>
                                 </tr>
                                 <tr>
                                     <td className="border border-black p-2 text-center">02/03</td>
                                     <td className="border border-black p-2">IPA</td>
                                     <td className="border border-black p-2">Sistem Pernapasan</td>
                                     <td className="border border-black p-2 text-center">30/30</td>
                                     <td className="border border-black p-2 text-center">Tuntas</td>
                                 </tr>
                                 {/* More rows... */}
                             </tbody>
                         </table>

                         {/* Signatures */}
                         <div className="flex justify-between text-xs mt-12 px-8">
                             <div className="text-center">
                                 <p>Mengetahui,</p>
                                 <p className="mb-16">Kepala Sekolah</p>
                                 <p className="font-bold underline">Drs. SUHARTO, M.Pd</p>
                                 <p>NIP. 19680101 199003 1 005</p>
                             </div>
                             <div className="text-center">
                                 <p>Pasuruan, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                 <p className="mb-16">Guru Kelas</p>
                                 <p className="font-bold underline uppercase">{user.user_metadata?.name}</p>
                                 <p>NIP. 1928371928</p>
                             </div>
                         </div>
                     </div>
                 </div>
             );

        default: return <div className="p-10 text-center text-slate-400">Fitur dalam pengembangan presisi tinggi.</div>;
    }
  };

  if (activeFeature) {
      return (
          <div className="min-h-screen bg-[#F8F9FD] flex flex-col pb-6">
              <div className="sticky top-0 z-30 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center justify-between">
                  <button onClick={() => setActiveFeature(null)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
                      <ArrowLeft className="w-6 h-6" />
                  </button>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Menu Guru</span>
              </div>
              <div className="flex-grow p-4 md:p-6 max-w-4xl mx-auto w-full animate-fade-in-up">{renderFeaturePage()}</div>
          </div>
      );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className="min-h-screen w-full flex flex-col pb-24 relative bg-[#F1F5F9]">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0F2167] text-white px-6 py-5 rounded-b-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-12 -mt-12 blur-3xl"></div>
        <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-white/50 bg-white p-1 overflow-hidden">
                    <img src={avatarUrl} className="w-full h-full object-cover" alt="profile" />
                </div>
                <div>
                    <h2 className="text-base font-bold leading-tight">{user.user_metadata?.name || 'Ibu Guru'}</h2>
                    <p className="text-xs text-blue-200 font-medium bg-white/10 px-2 py-0.5 rounded inline-block mt-1">NIP. 1928371928</p>
                </div>
            </div>
            <button onClick={onLogout} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-grow px-5 pt-6 z-10 max-w-5xl mx-auto w-full animate-fade-in-up space-y-6">
        
        {/* TOP WIDGET: PROGRESS JURNAL (New Request) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><FileText className="w-4 h-4"/></div>
                     <span className="text-sm font-bold text-slate-700">Progress Jurnal Minggu Ini</span>
                 </div>
                 <span className="text-xs font-bold text-blue-600">{currentJP}/{weeklyJPTarget} JP</span>
             </div>
             
             {/* Progress Bar Visual */}
             <div className="relative w-full h-8 bg-slate-100 rounded-xl overflow-hidden shadow-inner">
                 <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-end px-3 transition-all duration-1000"
                    style={{ width: `${jpPercentage}%` }}
                 >
                     <span className="text-[10px] font-black text-white drop-shadow-md">{jpPercentage}%</span>
                 </div>
                 {/* Striped Pattern Overlay */}
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] opacity-30"></div>
             </div>
             <p className="text-[10px] text-slate-400 mt-2 text-right">Target mingguan: 24 Jam Pelajaran</p>
        </div>

        {/* 3x3 MENU GRID - AESTHETIC 3D STYLE */}
        <div>
            <div className="flex justify-between items-end mb-4">
                <h3 className="font-bold text-slate-800 text-lg">Menu Utama</h3>
                <span className="text-xs text-slate-400">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                {menuItems.map((item) => (
                    <button 
                        key={item.id} 
                        onClick={() => handleMenuClick(item.id)}
                        className="group flex flex-col items-center gap-2 transition-transform active:scale-95"
                    >
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-b ${item.color} flex items-center justify-center text-white shadow-lg ${item.shadow} border-b-4 border-black/10 group-hover:-translate-y-1 transition-transform`}>
                            <item.icon className="w-7 h-7 drop-shadow-md" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 text-center leading-tight">{item.label}</span>
                    </button>
                ))}
                
                {/* Finance Special Button */}
                {hasTrashRole && (
                    <button onClick={() => setActiveFeature('finance')} className="group flex flex-col items-center gap-2 transition-transform active:scale-95">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-200 border-b-4 border-black/10 group-hover:-translate-y-1 transition-transform">
                            <Recycle className="w-7 h-7 drop-shadow-md" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 text-center leading-tight">Bank Sampah</span>
                    </button>
                )}

                {/* AI Chat Button */}
                <button onClick={() => setActiveFeature('chat')} className="group flex flex-col items-center gap-2 transition-transform active:scale-95">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 border-b-4 border-black/10 group-hover:-translate-y-1 transition-transform">
                            <Bot className="w-7 h-7 drop-shadow-md" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 text-center leading-tight">Tanya AI</span>
                </button>
            </div>
        </div>

      </main>

      {/* SCHEDULE POPUP MODAL */}
      {showSchedulePopup && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
                  <div className="bg-[#0F2167] p-6 text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                       <h3 className="text-xl font-bold mb-1 relative z-10">Halo, {user.user_metadata?.name}!</h3>
                       <p className="text-blue-200 text-sm relative z-10">Ini jadwal mengajar Anda hari ini.</p>
                       <button onClick={() => setShowSchedulePopup(false)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-6 h-6"/></button>
                  </div>
                  <div className="p-6">
                      <div className="space-y-4">
                          <div className="flex gap-4 items-start p-4 bg-blue-50 rounded-2xl border border-blue-100">
                              <div className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">07</div>
                              <div>
                                  <h4 className="font-bold text-slate-800">Matematika - Kelas 5A</h4>
                                  <p className="text-xs text-slate-500">Jam Ke-1 s/d 2 (07:00 - 08:10)</p>
                                  <span className="inline-block mt-2 px-2 py-1 bg-white text-blue-600 text-[10px] font-bold rounded border border-blue-200">Sedang Berlangsung</span>
                              </div>
                          </div>
                          <div className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-70">
                              <div className="bg-slate-300 text-slate-500 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">09</div>
                              <div>
                                  <h4 className="font-bold text-slate-800">Tematik - Kelas 5A</h4>
                                  <p className="text-xs text-slate-500">Jam Ke-3 s/d 4 (08:10 - 09:20)</p>
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setShowSchedulePopup(false)} className="w-full mt-6 py-3 bg-[#0F2167] text-white font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-lg">
                          Mengerti, Tutup
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Bottom Nav Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-6 py-3 z-50 flex justify-around items-center md:hidden">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex flex-col items-center gap-1 text-[#0F2167]">
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={() => setActiveFeature('chat')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#0F2167] transition-colors">
              <MessageCircle className="w-6 h-6" />
              <span className="text-[10px] font-medium">AI Chat</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#0F2167] transition-colors">
              <User className="w-6 h-6" />
              <span className="text-[10px] font-medium">Profil</span>
          </button>
      </nav>
    </div>
  );
};

export default TeacherDashboard;