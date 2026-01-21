import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Award, Calendar, 
  LogOut, Star, Recycle, FileText, Wallet, ArrowUpRight,
  Sun, Moon, Utensils, Heart, Users, CheckCircle, ArrowLeft, Clock, X, AlertTriangle, Trophy, Home, Bot, DoorOpen, Send, ListChecks, PenTool, Plus, Camera, Mail, TrendingDown
} from 'lucide-react';
import { Task, TrashTransaction } from '../types';
import { supabase } from '../services/supabase';

interface StudentProps {
  user: any; // Add user prop
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentProps> = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'anak_hebat' | 'prestasi' | 'tasks' | 'izin'>('dashboard');
  const [showWastePopup, setShowWastePopup] = useState(false);
  const [wasteHistory, setWasteHistory] = useState<TrashTransaction[]>([]);
  const [wasteBalance, setWasteBalance] = useState(0);

  // Permission Form State
  const [permissionForm, setPermissionForm] = useState({
      type: 'Sakit',
      date: new Date().toISOString().split('T')[0],
      reason: '',
      photo: null as File | null
  });

  // Determine Avatar from DB or fallback
  const gender = user.profile?.jenis_kelamin || (user.user_metadata?.name?.toLowerCase().includes('putri') ? 'P' : 'L');
  
  const avatarUrl = gender === 'P' 
    ? "https://cdn-icons-png.flaticon.com/512/2922/2922566.png" 
    : "https://cdn-icons-png.flaticon.com/512/2922/2922510.png";

  useEffect(() => {
      fetchWasteData();
  }, [user]);

  const fetchWasteData = async () => {
      // Fetch data where student_id matches current user
      // Assuming user.id corresponds to student_id or finding via metadata
      const { data } = await supabase.from('trash_transactions')
          .select('*')
          .eq('student_id', user.id) // Assuming user.id is the numeric student ID
          .order('date', { ascending: false });
      
      if (data) {
          setWasteHistory(data);
          const balance = data.reduce((acc: number, curr: any) => {
              return curr.status === 'Deposit' ? acc + curr.amount : acc - curr.amount;
          }, 0);
          setWasteBalance(balance);
      }
  };

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
                  <div className="text-3xl font-black mt-1">Rp {wasteBalance.toLocaleString()}</div>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
                  <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Riwayat Transaksi</h4>
                  <div className="space-y-3">
                      {wasteHistory.length === 0 ? (
                          <div className="text-center text-gray-400 py-8 text-xs italic">Belum ada transaksi sampah.</div>
                      ) : (
                          wasteHistory.map((item) => (
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
                          ))
                      )}
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
                                  <span className="text-xs font-bold">Ketuk untuk ambil foto</span>
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setPermissionForm({...permissionForm, photo: e.target.files?.[0] || null})} />
                              </label>
                          </div>
                      </div>

                      <button type="submit" className="w-full mt-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                          Kirim Permohonan
                      </button>
                  </div>
              </form>
          </div>
      </div>
  );

  // Main Dashboard Render
  if (activeView === 'izin') return renderPermissionForm();

  if (activeView !== 'dashboard') {
    return (
        <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-6 text-center font-sans">
            <Trophy className="w-16 h-16 text-indigo-300 mb-4"/>
            <h2 className="text-xl font-bold text-gray-700">Fitur Segera Hadir</h2>
            <p className="text-gray-500 mb-6">Menu ini sedang dalam pengembangan.</p>
            <button onClick={() => setActiveView('dashboard')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">Kembali</button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] pb-24 relative overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-indigo-600 p-6 pt-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden z-10">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
         
         <div className="flex justify-between items-start relative z-10">
             <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-white rounded-full p-1 shadow-md">
                     <img src={avatarUrl} className="w-full h-full object-contain" alt="Student" />
                 </div>
                 <div>
                     <p className="text-indigo-200 text-xs font-medium mb-0.5">Selamat Pagi,</p>
                     <h2 className="text-white font-black text-xl leading-tight">{user.user_metadata?.name || 'Siswa'}</h2>
                     <span className="inline-block bg-white/20 px-2 py-0.5 rounded text-[10px] text-white font-bold mt-1">
                         {user.user_metadata?.class_name || 'Siswa SD'}
                     </span>
                 </div>
             </div>
             <button onClick={onLogout} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors">
                 <LogOut className="w-5 h-5" />
             </button>
         </div>

         {/* Quick Stats Card */}
         <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-between items-center text-white">
             <div className="text-center">
                 <div className="text-xs text-indigo-200 mb-1">Kehadiran</div>
                 <div className="font-black text-lg">100%</div>
             </div>
             <div className="w-px h-8 bg-white/20"></div>
             <div className="text-center cursor-pointer" onClick={() => setShowWastePopup(true)}>
                 <div className="text-xs text-indigo-200 mb-1">Tabungan</div>
                 <div className="font-black text-lg">Rp {wasteBalance.toLocaleString()}</div>
             </div>
             <div className="w-px h-8 bg-white/20"></div>
             <div className="text-center">
                 <div className="text-xs text-indigo-200 mb-1">Poin</div>
                 <div className="font-black text-lg">0</div>
             </div>
         </div>
      </header>

      {/* Menu Grid */}
      <div className="px-6 py-6 grid grid-cols-2 gap-4 relative z-10">
          <button onClick={() => setActiveView('izin')} className="bg-white p-4 rounded-3xl shadow-sm border border-indigo-50 flex flex-col items-center gap-3 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6"/>
              </div>
              <span className="font-bold text-gray-700 text-sm">Izin Tidak Masuk</span>
          </button>
          
          <button onClick={() => setActiveView('tasks')} className="bg-white p-4 rounded-3xl shadow-sm border border-indigo-50 flex flex-col items-center gap-3 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <ListChecks className="w-6 h-6"/>
              </div>
              <span className="font-bold text-gray-700 text-sm">Tugas Sekolah</span>
          </button>
          
          <button onClick={() => setShowWastePopup(true)} className="bg-white p-4 rounded-3xl shadow-sm border border-indigo-50 flex flex-col items-center gap-3 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                  <Recycle className="w-6 h-6"/>
              </div>
              <span className="font-bold text-gray-700 text-sm">Bank Sampah</span>
          </button>

          <button onClick={() => setActiveView('anak_hebat')} className="bg-white p-4 rounded-3xl shadow-sm border border-indigo-50 flex flex-col items-center gap-3 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6"/>
              </div>
              <span className="font-bold text-gray-700 text-sm">Anak Hebat</span>
          </button>
      </div>

      {/* Today's Schedule Preview */}
      <div className="px-6 mb-20">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-indigo-50">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-500"/> Jadwal Hari Ini
                  </h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold">{new Date().toLocaleDateString('id-ID', {weekday: 'long'})}</span>
              </div>
              <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="font-bold text-gray-400 text-xs w-10">07:00</div>
                      <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
                      <div>
                          <div className="font-bold text-gray-800 text-sm">Upacara Bendera</div>
                          <div className="text-xs text-gray-400">Lapangan Sekolah</div>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="font-bold text-gray-400 text-xs w-10">08:00</div>
                      <div className="w-1 h-8 bg-orange-500 rounded-full"></div>
                      <div>
                          <div className="font-bold text-gray-800 text-sm">Matematika</div>
                          <div className="text-xs text-gray-400">Bu Guru</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Popups */}
      {showWastePopup && renderWastePopup()}

    </div>
  );
};

export default StudentDashboard;