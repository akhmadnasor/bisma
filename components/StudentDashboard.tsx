import React, { useState } from 'react';
import { 
  BookOpen, Award, Calendar, 
  LogOut, Star, Recycle, FileText, Wallet, ArrowUpRight,
  Sun, Moon, Utensils, Heart, Users, CheckCircle, ArrowLeft, Clock, X, AlertTriangle, Trophy, Home, Bot, DoorOpen, Send, ListChecks
} from 'lucide-react';
import { Task } from '../types';

interface StudentProps {
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'anak_hebat' | 'prestasi' | 'tasks'>('dashboard');
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  
  // Task State
  const [taskTab, setTaskTab] = useState<'active' | 'resume'>('active');
  const [activeTasks, setActiveTasks] = useState<Task[]>([
      { id: 1, teacher_name: 'Hj. Siti Aminah', subject: 'Matematika', title: 'Latihan Pecahan', description: 'Kerjakan hal 52 nomor 1-5 di buku tulis.', deadline: 'Hari Ini, 23:59', status: 'New' },
      { id: 2, teacher_name: 'Bambang Gentolet', subject: 'PJOK', title: 'Video Senam', description: 'Buat video senam lantai durasi 1 menit.', deadline: 'Besok, 12:00', status: 'New' }
  ]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

  // ... (Keep existing states for bio, habits, popups) ...
  const studentBio = { name: "Rizky Ramadhan", age: "10 Tahun", gender: "Laki-laki", address: "Jl. Melati No. 4, Baujeng" };
  const habits = [
      { id: 'bangun_pagi', label: 'Bangun Pagi', icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-100', desc: 'Catat kegiatan yang ananda lakukan setelah bangun' },
      // ... (other habits)
  ];
  const [showSchedule, setShowSchedule] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleTaskSubmit = (id: number) => {
      const task = activeTasks.find(t => t.id === id);
      if (task) {
          setActiveTasks(activeTasks.filter(t => t.id !== id));
          setCompletedTasks([...completedTasks, { ...task, status: 'Submitted' }]);
          alert("Tugas berhasil dikirim!");
      }
  };

  const renderTasks = () => (
      <div className="min-h-screen bg-[#F0F9FF] font-sans">
          <header className="bg-blue-500 p-6 text-white flex items-center gap-4 shadow-lg sticky top-0 z-30">
              <button onClick={() => setActiveView('dashboard')} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><ArrowLeft className="w-5 h-5"/></button>
              <h1 className="font-bold text-lg">Tugas Sekolah</h1>
          </header>
          
          <div className="p-4">
              <div className="flex bg-white rounded-xl p-1 mb-6 shadow-sm">
                  <button onClick={() => setTaskTab('active')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${taskTab === 'active' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>Tugas Hari Ini</button>
                  <button onClick={() => setTaskTab('resume')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${taskTab === 'resume' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>Riwayat</button>
              </div>

              {taskTab === 'active' ? (
                  <div className="space-y-4 pb-24">
                      {activeTasks.map(t => (
                          <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
                              <div className="flex justify-between items-start mb-2">
                                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">{t.subject}</span>
                                  <span className="text-xs text-red-500 font-bold">{t.deadline}</span>
                              </div>
                              <h3 className="font-bold text-gray-800 text-lg mb-1">{t.title}</h3>
                              <p className="text-sm text-gray-600 mb-4">{t.description}</p>
                              <div className="bg-gray-50 p-3 rounded-xl mb-4">
                                  <input type="text" placeholder="Link Tugas (Google Drive/Youtube)..." className="w-full p-2 bg-white border rounded-lg text-sm mb-2" />
                                  <textarea placeholder="Jawaban / Catatan..." className="w-full p-2 bg-white border rounded-lg text-sm h-20" />
                              </div>
                              <button onClick={() => handleTaskSubmit(t.id)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                  <Send className="w-4 h-4"/> Kirim Tugas
                              </button>
                          </div>
                      ))}
                      {activeTasks.length === 0 && <div className="text-center text-gray-400 mt-10">Hore! Tidak ada tugas aktif.</div>}
                  </div>
              ) : (
                  <div className="space-y-3 pb-24">
                      {completedTasks.map(t => (
                          <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-100 opacity-70">
                              <div className="flex justify-between">
                                  <div className="font-bold text-gray-700">{t.title}</div>
                                  <CheckCircle className="w-5 h-5 text-green-500"/>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{t.subject} • Terkirim</div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
  );

  // If Tasks View
  if (activeView === 'tasks') return renderTasks();

  // (Keep the other renders: Anak Hebat, Prestasi, but ensure Dashboard has the new button)

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#FFF7ED] font-sans pb-28">
      {/* Mobile Top Bar */}
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
        
        {/* KOINKU (Tabungan Sampah) */}
        <div className="bg-gradient-to-br from-[#059669] to-[#10B981] rounded-3xl p-6 text-white shadow-xl shadow-green-200 relative overflow-hidden transform transition-transform hover:scale-[1.02]">
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
                     <h2 className="text-4xl font-black tracking-tight">Rp 45.500</h2>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 text-center text-xs font-bold text-white tracking-wide border border-white/30">
                    "Ubah Sampah Jadi Rupiah!"
                </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* 3D MENU GRID */}
        <div>
            <h3 className="font-bold text-gray-800 mb-4 text-lg px-1">Menu Utama</h3>
            <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'tasks', label: 'Tugas', icon: ListChecks, color: 'from-red-400 to-red-600', shadow: 'shadow-red-200' }, // NEW
                  { id: 'jadwal', label: 'Jadwal', icon: Calendar, color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-200' },
                  { id: 'prestasi', label: 'Prestasi', icon: Award, color: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-200' },
                  { id: 'anak_hebat', label: 'Anak Hebat', icon: Star, color: 'from-yellow-400 to-yellow-600', shadow: 'shadow-yellow-200' },
                  { id: 'lainnya', label: 'Lainnya', icon: FileText, color: 'from-gray-400 to-gray-600', shadow: 'shadow-gray-200' },
                ].map((item, idx) => (
                    <button 
                        key={idx}
                        onClick={() => {
                            if(item.id === 'anak_hebat') setActiveView('anak_hebat');
                            else if (item.id === 'prestasi') setActiveView('prestasi');
                            else if (item.id === 'tasks') setActiveView('tasks');
                            else if (item.id === 'jadwal') setShowSchedule(true);
                            else setShowComingSoon(true);
                        }}
                        className="group flex flex-col items-center gap-2 transition-transform active:scale-95"
                    >
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-b ${item.color} flex items-center justify-center text-white shadow-lg ${item.shadow} border-b-4 border-black/10 group-hover:-translate-y-1 transition-transform`}>
                            <item.icon className="w-7 h-7 drop-shadow-md" />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Poin Kebaikan Summary */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-orange-500 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500"><Star className="w-6 h-6"/></div>
                 <div>
                     <div className="text-xs font-bold text-gray-400">Poin Kebaikan</div>
                     <div className="font-bold text-gray-800 text-lg">125 Poin</div>
                 </div>
             </div>
             <div className="text-xs text-orange-500 font-bold bg-orange-50 px-3 py-1 rounded-full">Level: Bintang Kecil</div>
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

    </div>
  );
};

export default StudentDashboard;