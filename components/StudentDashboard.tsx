import React, { useState } from 'react';
import { 
  BookOpen, Award, Calendar, 
  LogOut, Star, Recycle, FileText, Wallet, ArrowUpRight,
  Sun, Moon, Utensils, Heart, Users, CheckCircle, ArrowLeft, Clock, X, AlertTriangle, Trophy, Home, Bot, DoorOpen, Send, ListChecks, PenTool, Plus, Camera, Mail
} from 'lucide-react';
import { Task, TrashTransaction } from '../types';

interface StudentProps {
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'anak_hebat' | 'prestasi' | 'tasks' | 'izin'>('dashboard');
  const [showWastePopup, setShowWastePopup] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Mock Data
  const wasteHistory: TrashTransaction[] = [
      { id: 1, date: '2023-10-25', student_name: 'Rizky', type: 'Setor Plastik', weight: 2.5, amount: 7500, status: 'Deposit', description: 'Botol bersih' },
      { id: 2, date: '2023-10-20', student_name: 'Rizky', type: 'Pembelian ATK', weight: 0, amount: 3000, status: 'Withdraw', description: 'Buku Tulis Sidu' },
      { id: 3, date: '2023-10-15', student_name: 'Rizky', type: 'Setor Kardus', weight: 5.0, amount: 7500, status: 'Deposit', description: 'Bekas paket' },
  ];

  // Permission Form State
  const [permissionForm, setPermissionForm] = useState({
      type: 'Sakit',
      date: new Date().toISOString().split('T')[0],
      reason: '',
      photo: null as File | null
  });

  const handlePermissionSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Permohonan izin berhasil dikirim! Menunggu validasi guru.");
      setActiveView('dashboard');
  };

  const renderWastePopup = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative shrink-0">
                  <button onClick={() => setShowWastePopup(false)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold mb-1">Tabungan Sampah</h3>
                  <p className="text-green-100 text-xs opacity-90">Saldo saat ini</p>
                  <div className="text-3xl font-black mt-1">Rp 12.000</div>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
                  <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Riwayat Transaksi</h4>
                  <div className="space-y-3">
                      {wasteHistory.map((item) => (
                          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${item.status === 'Deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                      {item.status === 'Deposit' ? <ArrowUpRight className="w-4 h-4"/> : <ArrowUpRight className="w-4 h-4 rotate-180"/>}
                                  </div>
                                  <div>
                                      <div className="font-bold text-gray-800 text-sm">{item.type}</div>
                                      <div className="text-xs text-gray-400">{item.date} • {item.description}</div>
                                  </div>
                              </div>
                              <div className={`font-bold font-mono text-sm ${item.status === 'Deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.status === 'Deposit' ? '+' : '-'} Rp {item.amount.toLocaleString()}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderPermissionForm = () => (
      <div className="min-h-screen bg-[#F0F9FF] font-sans">
          <header className="bg-indigo-600 p-6 text-white flex items-center gap-4 shadow-lg sticky top-0 z-30 rounded-b-3xl">
              <button onClick={() => setActiveView('dashboard')} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><ArrowLeft className="w-5 h-5"/></button>
              <h1 className="font-bold text-lg">Form Izin Siswa</h1>
          </header>
          
          <div className="p-6 max-w-md mx-auto">
              <form onSubmit={handlePermissionSubmit} className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-50">
                      <h3 className="font-bold text-gray-800 mb-4 text-center">Data Ketidakhadiran</h3>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tanggal</label>
                              <input 
                                type="date" 
                                value={permissionForm.date}
                                onChange={e => setPermissionForm({...permissionForm, date: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Izin</label>
                              <div className="flex gap-4">
                                  {['Sakit', 'Izin'].map(type => (
                                      <label key={type} className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all text-center font-bold ${permissionForm.type === type ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-white text-gray-400'}`}>
                                          <input type="radio" className="hidden" name="type" onClick={() => setPermissionForm({...permissionForm, type: type})}/>
                                          {type}
                                      </label>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Alasan Lengkap</label>
                              <textarea 
                                rows={3}
                                placeholder="Contoh: Demam tinggi sejak semalam..."
                                value={permissionForm.reason}
                                onChange={e => setPermissionForm({...permissionForm, reason: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Foto Surat Dokter / Bukti (Opsional)</label>
                              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
                                  <Camera className="w-8 h-8 mb-2"/>
                                  <span className="text-xs">Ketuk untuk upload foto</span>
                                  <input type="file" className="hidden" accept="image/*" />
                              </label>
                          </div>
                      </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-transform flex items-center justify-center gap-2">
                      <Send className="w-5 h-5"/> Kirim Permohonan
                  </button>
              </form>
          </div>
      </div>
  );

  // Render Logic
  if (activeView === 'izin') return renderPermissionForm();
  
  // (Assuming 'tasks' render function from previous code is preserved or imported)
  
  return (
    <div className="min-h-screen bg-[#FFF7ED] font-sans pb-28">
      {/* Top Bar */}
      <header className="bg-orange-500 p-6 pb-28 rounded-b-[40px] shadow-lg relative overflow-hidden">
         <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
         <div className="flex justify-between items-start relative z-10 text-white">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full border-2 border-white/50 p-1">
                    <img src="https://picsum.photos/id/64/100/100" className="w-full h-full rounded-full object-cover" alt="Siswa" />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight">Hai, Rizky!</h1>
                    <p className="text-orange-100 text-xs">Kelas 5A • SDN Baujeng 1</p>
                </div>
            </div>
            <button onClick={onLogout} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><LogOut className="w-5 h-5"/></button>
         </div>
      </header>

      <main className="px-5 -mt-20 relative z-20 space-y-8 animate-fade-in-up">
        
        {/* KOINKU (Tabungan Sampah) - Clickable */}
        <button 
            onClick={() => setShowWastePopup(true)}
            className="w-full text-left bg-gradient-to-br from-[#059669] to-[#10B981] rounded-3xl p-6 text-white shadow-xl shadow-green-200 relative overflow-hidden transform transition-transform hover:scale-[1.02] active:scale-95"
        >
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                        <Recycle className="w-4 h-4 text-white"/>
                        <span className="text-xs font-bold tracking-wide">TABUNGAN SAMPAH</span>
                    </div>
                    <Recycle className="w-8 h-8 text-white/80"/>
                </div>
                <div className="space-y-1 mb-4">
                     <p className="text-sm text-green-100 font-medium">Total Saldo Saat Ini</p>
                     <h2 className="text-4xl font-black tracking-tight">Rp 12.000</h2>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 text-center text-xs font-bold text-white tracking-wide border border-white/30 flex items-center justify-center gap-2">
                    <Star className="w-3 h-3 text-yellow-300 fill-yellow-300"/> Klik untuk lihat riwayat
                </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        </button>

        {/* 3D MENU GRID */}
        <div>
            <h3 className="font-bold text-gray-800 mb-4 text-lg px-1">Menu Utama</h3>
            <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'tasks', label: 'Tugas', icon: PenTool, color: 'from-red-400 to-red-600', shadow: 'shadow-red-200' }, 
                  { id: 'jadwal', label: 'Jadwal', icon: Calendar, color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-200' },
                  { id: 'izin', label: 'Izin/Sakit', icon: Mail, color: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-200' }, // Changed
                  { id: 'prestasi', label: 'Prestasi', icon: Award, color: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-200' },
                  { id: 'anak_hebat', label: 'Anak Hebat', icon: Star, color: 'from-yellow-400 to-yellow-600', shadow: 'shadow-yellow-200' },
                  { id: 'lainnya', label: 'Lainnya', icon: FileText, color: 'from-gray-400 to-gray-600', shadow: 'shadow-gray-200' },
                ].map((item, idx) => (
                    <button 
                        key={idx}
                        onClick={() => {
                            if(item.id === 'izin') setActiveView('izin');
                            else if(item.id === 'tasks') setActiveView('tasks');
                            else setShowComingSoon(true);
                        }}
                        className="group flex flex-col items-center gap-2 transition-transform active:scale-95"
                    >
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-b ${item.color} flex items-center justify-center text-white shadow-lg ${item.shadow} border-b-4 border-black/10 group-hover:-translate-y-1 transition-transform`}>
                            {item.id === 'izin' ? <Mail className="w-7 h-7 drop-shadow-md" /> : <item.icon className="w-7 h-7 drop-shadow-md" />}
                        </div>
                        <span className="text-xs font-bold text-gray-600">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
      </main>

      {/* FOOTER */}
      <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-full shadow-2xl p-2 flex justify-between items-center max-w-sm mx-auto border border-white/50">
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all ${activeView === 'dashboard' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  <Home className={`w-6 h-6 ${activeView === 'dashboard' ? 'fill-orange-600' : ''}`}/>
                  <span className="text-[10px] font-bold">Home</span>
              </button>

              <button 
                onClick={() => { setShowComingSoon(true); }}
                className="flex-1 -mt-8"
              >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border-4 border-[#FFF7ED] transform transition-transform active:scale-95">
                      <Bot className="w-8 h-8 text-white"/>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 block text-center mt-1">Tanya Bisma</span>
              </button>

              <button 
                onClick={onLogout}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                  <DoorOpen className="w-6 h-6"/>
                  <span className="text-[10px] font-bold">Keluar</span>
              </button>
          </div>
      </div>

      {showWastePopup && renderWastePopup()}
      
      {showComingSoon && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up" onClick={() => setShowComingSoon(false)}>
              <div className="bg-white rounded-3xl p-8 text-center max-w-sm shadow-2xl">
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                      <Star className="w-10 h-10 text-yellow-500 fill-yellow-500"/>
                  </div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">Coming Soon!</h3>
                  <p className="text-gray-500 text-sm">Fitur ini sedang dalam pengembangan oleh tim IT Sekolah.</p>
                  <button onClick={() => setShowComingSoon(false)} className="mt-6 w-full py-3 bg-gray-900 text-white font-bold rounded-xl">Oke, Ditunggu!</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentDashboard;