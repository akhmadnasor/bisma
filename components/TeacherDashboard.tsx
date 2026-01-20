import React, { useState, useEffect, useRef } from 'react';
import { 
  LogOut, CalendarCheck, BarChart2, 
  FilePenLine, Printer, UserCheck, ClipboardCheck, 
  ShieldAlert, QrCode, NotebookPen, HeartHandshake, GalleryThumbnails, Check, X, Bell, Clock,
  BookOpen, Calculator, MessageCircle, XCircle, Star, ArrowRight, Sun, Send, Bot, Loader2,
  Calendar, Camera, Download, Filter, Search, ArrowLeft, Home, FileText, Save, Users, User,
  Mail, Phone, MapPin, Edit, Trophy, Recycle, ListChecks, FilePlus, ChevronDown, CheckCircle
} from 'lucide-react';
import { Schedule } from '../types';
import { sendMessageToGemini, ChatMessage } from '../services/gemini';

interface TeacherDashboardProps {
  user: any;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onLogout, onNavigate }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  
  // Filter States
  const [filterDateFrom, setFilterDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [filterDateTo, setFilterDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterClass, setFilterClass] = useState('5A');

  // Popup States
  const [showTindakLanjut, setShowTindakLanjut] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showAddPelanggaran, setShowAddPelanggaran] = useState(false);
  
  // Data States
  const [inputNilaiTab, setInputNilaiTab] = useState<'input' | 'resume'>('input');
  const [nilaiType, setNilaiType] = useState('UH');
  const [customNilaiTypes, setCustomNilaiTypes] = useState(['UH', 'UTS', 'UAS']);
  const [trashWeight, setTrashWeight] = useState(0);

  // Journal States
  const [journalJam, setJournalJam] = useState<number[]>([]);
  const [availableJam] = useState([1, 2, 3, 4]); // Simulated locked schedule from Admin
  const [journalPelanggaran, setJournalPelanggaran] = useState<string[]>([]);

  // AI
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const hasTrashRole = true; // Simulate teacher role 'admin_sampah'

  const menuItems = [
      { id: 'jurnal', label: 'Isi Jurnal', icon: FilePenLine, color: 'bg-blue-500' },
      { id: 'nilai', label: 'Input Nilai', icon: Calculator, color: 'bg-teal-500' },
      { id: 'kedisiplinan', label: 'Kedisiplinan', icon: ShieldAlert, color: 'bg-red-500' },
      { id: 'keterlaksanaan_kbm', label: 'Keterlaksanaan', icon: ClipboardCheck, color: 'bg-yellow-500' },
      { id: 'laporan', label: 'Cetak Laporan', icon: Printer, color: 'bg-pink-500' },
      { id: 'presensi_qr', label: 'Scan QR', icon: QrCode, color: 'bg-indigo-600' },
  ];

  // --- FEATURE HEADER COMPONENT ---
  const FeatureHeader = ({ title, icon: Icon, color }: any) => (
      <div className={`relative overflow-hidden rounded-3xl p-6 mb-6 text-white shadow-lg ${color}`}>
          <div className="relative z-10 flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-black mb-1">{title}</h2>
                  <p className="text-white/80 text-sm">SDN BAUJENG 1 • {user.user_metadata?.name || 'Guru'}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <Icon className="w-8 h-8" />
              </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
      </div>
  );

  const handleOpenChat = () => {
      if (!process.env.API_KEY) {
          alert("Fitur Konsultasi AI belum aktif. Mohon hubungi Admin untuk konfigurasi API Key.");
          return;
      }
      setActiveFeature('chat');
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

  const renderFeaturePage = () => {
      if (!activeFeature) return null;

      switch (activeFeature) {
          case 'kedisiplinan':
              return (
                  <div>
                      <FeatureHeader title="Monitoring Kedisiplinan" icon={ShieldAlert} color="bg-gradient-to-r from-red-500 to-pink-600" />
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3">
                          <input type="date" value={filterDateFrom} onChange={e=>setFilterDateFrom(e.target.value)} className="p-2 border rounded-lg text-sm"/>
                          <span className="self-center">-</span>
                          <input type="date" value={filterDateTo} onChange={e=>setFilterDateTo(e.target.value)} className="p-2 border rounded-lg text-sm"/>
                          <select className="p-2 border rounded-lg text-sm"><option>Semua Kelas</option><option>5A</option></select>
                      </div>
                      
                      {/* Tabs */}
                      <div className="flex gap-4 border-b border-gray-200 mb-4">
                          <button onClick={() => setShowReview(false)} className={`pb-2 text-sm font-bold ${!showReview ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400'}`}>Input & Daftar</button>
                          <button onClick={() => setShowReview(true)} className={`pb-2 text-sm font-bold ${showReview ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400'}`}>Review Pelanggaran</button>
                      </div>

                      {!showReview ? (
                          <div className="space-y-3">
                              {['Budi Santoso', 'Eko Patrio'].map((name, i) => (
                                  <div key={i} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                      <div>
                                          <div className="font-bold text-gray-800">{name}</div>
                                          <div className="text-xs text-red-500">Terlambat • 14 Mar 2026</div>
                                      </div>
                                      <button onClick={() => setShowTindakLanjut(true)} className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">Tindak Lanjut</button>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="bg-gray-50 p-4 rounded-xl text-center text-gray-500 text-sm">Review data pelanggaran dalam bentuk grafik/tabel akan muncul disini.</div>
                      )}

                      {/* Popup Tindak Lanjut */}
                      {showTindakLanjut && (
                          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                              <div className="bg-white rounded-2xl w-full max-w-sm p-6">
                                  <h3 className="font-bold text-lg mb-4">Form Tindak Lanjut</h3>
                                  <textarea className="w-full p-3 border rounded-xl mb-4 text-sm" placeholder="Catatan penanganan siswa/wali murid..." rows={4}></textarea>
                                  <div className="flex gap-2">
                                      <button onClick={() => setShowTindakLanjut(false)} className="flex-1 py-2 border rounded-lg text-sm font-bold">Batal</button>
                                      <button onClick={() => { alert("Tersimpan"); setShowTindakLanjut(false); }} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Simpan</button>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              );

          case 'jurnal':
              return (
                  <div>
                      <FeatureHeader title="Jurnal KBM" icon={FilePenLine} color="bg-gradient-to-r from-blue-500 to-indigo-600" />
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Jam Pelajaran (Locked)</label>
                              <div className="flex gap-2">
                                  {[1,2,3,4,5,6,7,8].map(j => (
                                      <div key={j} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${availableJam.includes(j) ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-gray-100 text-gray-300'}`}>
                                          {j}
                                      </div>
                                  ))}
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">* Sesuai jadwal admin</p>
                          </div>

                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Catatan & Pelanggaran</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                  {journalPelanggaran.map((p, i) => <span key={i} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded border border-red-100">{p}</span>)}
                                  <button onClick={() => setShowAddPelanggaran(true)} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 hover:bg-gray-200">+ Tambah</button>
                              </div>
                              <textarea className="w-full p-3 border rounded-xl text-sm" placeholder="Catatan KBM..."></textarea>
                          </div>

                          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                              <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Validasi & Resume</h4>
                              <div className="text-xs text-green-700 space-y-1">
                                  <p>• Kehadiran: 28 Hadir, 2 Sakit</p>
                                  <p>• Materi: Tuntas</p>
                              </div>
                          </div>
                          
                          <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200">Kirim Jurnal</button>
                      </div>
                      
                      {showAddPelanggaran && (
                          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                              <div className="bg-white rounded-xl p-4 w-full max-w-xs">
                                  <h4 className="font-bold mb-3">Jenis Pelanggaran</h4>
                                  <div className="grid grid-cols-2 gap-2 mb-4">
                                      {['Rambut Panjang', 'Seragam', 'Gaduh', 'Terlambat'].map(t => (
                                          <button key={t} onClick={() => { setJournalPelanggaran([...journalPelanggaran, t]); setShowAddPelanggaran(false); }} className="p-2 border rounded hover:bg-gray-50 text-xs">{t}</button>
                                      ))}
                                  </div>
                                  <button onClick={() => setShowAddPelanggaran(false)} className="w-full py-2 bg-gray-100 rounded text-xs font-bold">Batal</button>
                              </div>
                          </div>
                      )}
                  </div>
              );

          case 'nilai':
              return (
                  <div>
                      <FeatureHeader title="Input Nilai Siswa" icon={Calculator} color="bg-gradient-to-r from-teal-400 to-emerald-600" />
                      
                      <div className="flex gap-4 border-b border-gray-200 mb-4 bg-white px-4 pt-2 rounded-t-2xl">
                          <button onClick={() => setInputNilaiTab('input')} className={`pb-3 text-sm font-bold border-b-2 ${inputNilaiTab === 'input' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-400'}`}>Input Data</button>
                          <button onClick={() => setInputNilaiTab('resume')} className={`pb-3 text-sm font-bold border-b-2 ${inputNilaiTab === 'resume' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-400'}`}>Resume Nilai</button>
                      </div>

                      {inputNilaiTab === 'input' ? (
                          <div className="space-y-4">
                              <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                                  {customNilaiTypes.map(t => (
                                      <button key={t} onClick={() => setNilaiType(t)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${nilaiType === t ? 'bg-teal-600 text-white' : 'bg-white border text-gray-500'}`}>{t}</button>
                                  ))}
                                  <button onClick={() => { const n = prompt('Nama Tipe (mis: PH1)'); if(n) setCustomNilaiTypes([...customNilaiTypes, n]); }} className="px-3 py-2 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">+</button>
                              </div>

                              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                  <table className="w-full text-sm">
                                      <thead className="bg-teal-50 text-teal-800">
                                          <tr><th className="p-3 text-left w-10">No</th><th className="p-3 text-left">NISN</th><th className="p-3 text-left">Nama</th><th className="p-3 w-20">Nilai</th></tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                          {[1,2,3].map((i) => (
                                              <tr key={i}>
                                                  <td className="p-3 text-center">{i}</td>
                                                  <td className="p-3 text-gray-500 font-mono text-xs">3045{i}</td>
                                                  <td className="p-3 font-bold">Siswa {i}</td>
                                                  <td className="p-3"><input type="number" className="w-full p-1 border rounded text-center font-bold" placeholder="0"/></td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                              <button className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-lg">Simpan Nilai</button>
                          </div>
                      ) : (
                          <div className="bg-white p-6 rounded-2xl shadow-sm text-center text-gray-500">
                              Grafik pencapaian nilai siswa akan tampil disini.
                          </div>
                      )}
                  </div>
              );

          case 'finance': // Only for admin_sampah role
              return (
                  <div>
                      <FeatureHeader title="Input Bank Sampah" icon={Recycle} color="bg-gradient-to-r from-green-600 to-emerald-700" />
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Berat Sampah (Kg)</label>
                          <input type="number" step="0.1" value={trashWeight} onChange={e=>setTrashWeight(parseFloat(e.target.value))} className="w-full p-4 text-3xl font-black text-center border-2 border-green-100 rounded-2xl mb-4 focus:border-green-500 outline-none" />
                          <div className="grid grid-cols-2 gap-3 mb-6">
                              {['Plastik', 'Kertas', 'Botol', 'Kardus'].map(t => (
                                  <button key={t} className="p-3 border rounded-xl hover:bg-green-50 text-sm font-bold text-gray-600">{t}</button>
                              ))}
                          </div>
                          <button onClick={() => { setTrashWeight(0); alert("Data tersimpan ke Admin Keuangan"); }} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700">Input Setoran</button>
                      </div>
                  </div>
              );

          case 'laporan':
              return (
                  <div>
                      <FeatureHeader title="Cetak Laporan" icon={Printer} color="bg-gradient-to-r from-pink-500 to-rose-500" />
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 text-center">
                          <Printer className="w-16 h-16 text-pink-200 mx-auto mb-4"/>
                          <h3 className="font-bold text-gray-800 text-lg mb-2">Cetak Jurnal & Absensi</h3>
                          <p className="text-sm text-gray-500 mb-6">Dokumen akan dicetak dengan Kop Surat Sekolah resmi.</p>
                          <button onClick={() => alert("Preview PDF dengan Kop Surat Sekolah ditampilkan...")} className="px-6 py-3 bg-pink-500 text-white font-bold rounded-xl shadow-lg hover:bg-pink-600">Preview & Cetak</button>
                      </div>
                  </div>
              );

          case 'keterlaksanaan_kbm':
              return (
                  <div>
                      <FeatureHeader title="Keterlaksanaan KBM" icon={ClipboardCheck} color="bg-gradient-to-r from-yellow-400 to-orange-500" />
                      
                      {/* Reward Widget */}
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-2xl border border-orange-200 mb-6 flex items-center justify-between">
                          <div>
                              <div className="text-xs font-bold text-orange-600 uppercase mb-1">Top Performance</div>
                              <div className="font-black text-xl text-orange-800">1. Hj. Siti Aminah</div>
                              <div className="text-xs text-orange-600">2. Drs. Supriyanto</div>
                          </div>
                          <Trophy className="w-12 h-12 text-orange-400 drop-shadow-sm" />
                      </div>

                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                          <h4 className="font-bold text-gray-700 mb-4">Status Pengisian Hari Ini</h4>
                          {/* List of teachers status... */}
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl mb-2">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><Check className="w-4 h-4 text-green-600"/></div>
                                  <div className="text-sm font-bold text-gray-700">Anda (5A)</div>
                              </div>
                              <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded">Lengkap</span>
                          </div>
                      </div>
                  </div>
              );
          
          case 'chat':
              return (
                  <div className="flex flex-col h-[calc(100vh-140px)]">
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {chatMessages.map((m, i) => (
                              <div key={i} className={`p-3 rounded-xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white self-end ml-auto' : 'bg-white border self-start'}`}>{m.text}</div>
                          ))}
                          {isChatLoading && <div className="text-xs text-gray-400 italic">Bisma AI sedang mengetik...</div>}
                      </div>
                      <form onSubmit={handleSendChat} className="p-2 bg-white border-t flex gap-2">
                          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} className="flex-1 p-2 border rounded-xl outline-none" placeholder="Tanya Bisma..." />
                          <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl"><Send className="w-5 h-5"/></button>
                      </form>
                  </div>
              );

          default:
              return <div className="p-10 text-center text-gray-400">Halaman ini belum tersedia.</div>;
      }
  };

  if (activeFeature) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
              <div className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setActiveFeature(null)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors">
                          <ArrowLeft className="w-6 h-6" />
                      </button>
                      <h2 className="text-lg font-bold text-gray-800">Menu Guru</h2>
                  </div>
                  <button onClick={onLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">Keluar</button>
              </div>
              <div className="flex-grow p-6 max-w-3xl mx-auto w-full">
                  {renderFeaturePage()}
              </div>
          </div>
      );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen w-full flex flex-col pb-24 relative bg-[#F8F9FD]">
      <header className="sticky top-0 z-50 glass-panel border-b border-white/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="relative">
               <img src="https://picsum.photos/id/20/100/100" className="h-10 w-10 rounded-full border-2 border-white shadow-sm" alt="profile" />
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white"></div>
            </div>
            <div>
               <h2 className="text-sm font-bold text-dark leading-tight">{user.user_metadata?.name || 'Guru'}</h2>
               <p className="text-xs text-gray-500 font-medium">Pengajar SD</p>
            </div>
        </div>
        <button onClick={onLogout} className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><LogOut className="w-5 h-5" /></button>
      </header>

      <main className="flex-grow px-4 md:px-6 pt-6 z-10 max-w-5xl mx-auto w-full animate-fade-in-up">
        {/* Welcome Section */}
        <div className="mb-8">
            <h1 className="text-2xl font-black text-dark mb-1">Dashboard</h1>
            <p className="text-gray-500 text-sm">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            {menuItems.map((item) => (
                <div key={item.id} onClick={() => setActiveFeature(item.id)} className="group bg-white rounded-3xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300 ${item.color}`}>
                        <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 text-center">{item.label}</span>
                </div>
            ))}
            {/* Special Role Menu */}
            {hasTrashRole && (
                <div onClick={() => setActiveFeature('finance')} className="group bg-white rounded-3xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md bg-green-600"><Recycle className="w-6 h-6 text-white" /></div>
                    <span className="text-xs font-bold text-gray-600 text-center">Input Sampah</span>
                </div>
            )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-6 py-3 z-50 flex justify-around items-center">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex flex-col items-center gap-1 text-blue-600">
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-bold">Dashboard</span>
          </button>
          <button onClick={handleOpenChat} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-6 h-6" />
              <span className="text-[10px] font-medium">Bisma AI</span>
          </button>
          <button onClick={() => setActiveFeature('profile')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
              <User className="w-6 h-6" />
              <span className="text-[10px] font-medium">Profil</span>
          </button>
      </nav>
    </div>
  );
};

export default TeacherDashboard;