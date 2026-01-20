import React, { useState } from 'react';
import { 
  BookOpen, Award, Calendar, 
  LogOut, Star, Recycle, FileText, Wallet, ArrowUpRight,
  Sun, Moon, Utensils, Heart, Users, CheckCircle, ArrowLeft, Clock, X, AlertTriangle, Trophy, Home, Bot, DoorOpen, Send, ListChecks, PenTool
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
          <header className="bg-blue-500 p-6 text-white flex items-center gap-4 shadow-lg sticky top-0 z-30 rounded-b-3xl">
              <button onClick={() => setActiveView('dashboard')} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><ArrowLeft className="w-5 h-5"/></button>
              <h1 className="font-bold text-lg">Buku Tugas</h1>
          </header>
          
          <div className="p-4">
              <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-blue-100 max-w-xs mx-auto">
                  <button onClick={() => setTaskTab('active')} className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${taskTab === 'active' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>Tugas Aktif</button>
                  <button onClick={() => setTaskTab('resume')} className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${taskTab === 'resume' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>Selesai</button>
              </div>

              {taskTab === 'active' ? (
                  <div className="space-y-6 pb-24">
                      {activeTasks.map(t => (
                          <div key={t.id} className="bg-yellow-50 p-0 rounded-3xl shadow-md border-b-4 border-yellow-200 overflow-hidden relative group">
                              {/* Tape Effect */}
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-white/30 backdrop-blur-sm rotate-2 shadow-sm border border-white/20"></div>

                              <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs border-2 border-white">{t.subject.substring(0,2)}</div>
                                        <span className="text-sm font-bold text-gray-700">{t.subject}</span>
                                    </div>
                                    <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-full border border-red-200">Deadline: {t.deadline}</span>
                                </div>
                                <h3 className="font-black text-gray-800 text-xl mb-2">{t.title}</h3>
                                <p className="text-sm text-gray-600 mb-4 bg-white/50 p-3 rounded-xl border border-yellow-100 italic">
                                    "{t.description}"
                                </p>
                                
                                <div className="space-y-3">
                                    <input type="text" placeholder="Tempel Link Tugas Disini..." className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-400 focus:ring-0 outline-none" />
                                    <button onClick={() => handleTaskSubmit(t.id)} className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-blue-600">
                                        <Send className="w-4 h-4"/> Kumpulkan Tugas
                                    </button>
                                </div>
                              </div>
                          </div>
                      ))}
                      {activeTasks.length === 0 && (
                          <div className="text-center py-10">
                              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                  <Star className="w-12 h-12 text-green-500 fill-green-500"/>
                              </div>
                              <h3 className="font-bold text-gray-600">Hore! Tugas Kosong</h3>
                              <p className="text-xs text-gray-400">Kamu sudah mengerjakan semuanya.</p>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="space-y-3 pb-24">
                      {completedTasks.map(t => (
                          <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-100 opacity-70">
                              <div className="flex justify-between">
                                  <div className="font-bold text-gray-700 line-through">{t.title}</div>
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
                  { id: 'tasks', label: 'Tugas', icon: PenTool, color: 'from-red-400 to-red-600', shadow: 'shadow-red-200' }, 
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