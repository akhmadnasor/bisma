import React, { useEffect, useState } from 'react';
import { LogIn, Users, Calendar, Trophy, Megaphone, Clock, Home, Search, User, Info, MessageCircle, ChevronDown, ChevronUp, X, ArrowLeft } from 'lucide-react';
import { DashboardStats, AppConfig } from '../types';

interface PublicDashboardProps {
  onLoginClick: () => void;
}

const PublicDashboard: React.FC<PublicDashboardProps> = ({ onLoginClick }) => {
  const [time, setTime] = useState(new Date());
  const [isDescVisible, setIsDescVisible] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [searchView, setSearchView] = useState(false);

  // Mock Config (Would be passed down in a real app)
  const config = {
      waNumber: '6285749662221',
      announcementTitle: 'Pengumuman Hari Ini',
      announcementColor: 'yellow', // Default, can be 'yellow', 'blue', 'green', 'pink', 'purple'
      announcementItems: [
          { dateDay: '15', dateMonth: 'MAR', title: 'Rapat Wali Murid', desc: 'Pembagian Raport Tengah Semester', time: '08:00 - Selesai' },
          { dateDay: '21', dateMonth: 'MAR', title: 'Pondok Ramadhan', desc: 'Kegiatan keagamaan siswa', time: '07:00 - 11:00' }
      ],
      searchUrl: 'https://www.sdnbaujeng1.sch.id/' 
  };

  const [stats] = useState<DashboardStats>({
    completedKBM: 12,
    totalScheduled: 15,
    percentage: 80,
    classStats: { '1': 28, '2': 30, '3': 29, '4': 32, '5': 30, '6': 28 },
    notYetTaught: []
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleWhatsAppClick = () => {
      window.open(`https://wa.me/${config.waNumber}`, '_blank');
  };

  // Color Helper for Announcement Widget
  const getColorClasses = (color: string) => {
    switch(color) {
      case 'blue': return { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconText: 'text-blue-600', text: 'text-blue-600' };
      case 'green': return { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-100', iconText: 'text-green-600', text: 'text-green-600' };
      case 'pink': return { bg: 'bg-pink-50', border: 'border-pink-100', iconBg: 'bg-pink-100', iconText: 'text-pink-600', text: 'text-pink-600' };
      case 'purple': return { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', iconText: 'text-purple-600', text: 'text-purple-600' };
      default: return { bg: 'bg-yellow-50', border: 'border-yellow-100', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600', text: 'text-yellow-600' };
    }
  };

  const theme = getColorClasses(config.announcementColor);

  // Internal Search View (Iframe)
  if (searchView) {
      return (
          <div className="min-h-screen flex flex-col bg-white">
              <header className="bg-blue-600 p-4 text-white flex items-center gap-4 shadow-md sticky top-0 z-50">
                  <button onClick={() => setSearchView(false)} className="p-2 hover:bg-white/20 rounded-full">
                      <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="font-bold text-lg">Pencarian Informasi Sekolah</h1>
              </header>
              <div className="flex-1 w-full h-full relative">
                  <iframe 
                    src={config.searchUrl} 
                    className="w-full h-[calc(100vh-64px)] border-0" 
                    title="School Website"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans pb-24">
      
      {/* --- STICKY HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-yellow-400 shadow-lg px-4 py-3 md:px-8 transition-all duration-300 rounded-b-3xl md:rounded-b-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="relative group cursor-pointer">
                    <img
                        src="https://picsum.photos/id/20/200/200"
                        alt="Logo"
                        className="relative h-10 w-10 md:h-12 md:w-12 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter drop-shadow-sm">BISMA</h1>
                    <p className="text-blue-50 font-medium tracking-wide text-[10px] md:text-xs">SDN BAUJENG 1</p>
                </div>
            </div>
            
            {/* Time Widget (Desktop) */}
            <div className="hidden md:block text-right text-white">
                 <div className="font-bold text-lg leading-none">{time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}</div>
                 <div className="text-xs opacity-90">{time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
            </div>
        </div>
      </header>

      {/* Spacer for Fixed Header */}
      <div className="h-24 md:h-20"></div>

      {/* Main Content Grid */}
      <main className="p-4 md:p-8 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
        
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Interactive Welcome Card (Simplified for SD) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-blue-500 to-yellow-400"></div>
                 
                 <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">
                    Selamat Datang! 👋
                 </h2>
                 <p className="text-gray-600 text-sm leading-relaxed">
                     Pantau aktivitas sekolah SDN Baujeng 1 dengan mudah.
                 </p>
            </div>

            {/* Statistik Siswa (Friendly Cards) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                 <div className="flex items-center gap-2 mb-4">
                     <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5" />
                     </div>
                     <h3 className="font-bold text-gray-800 text-lg">Info Kelas</h3>
                 </div>
                 
                 <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((cls) => (
                        <div key={cls} className="bg-white border-2 border-blue-50 rounded-2xl p-2 text-center hover:bg-blue-50 hover:border-blue-200 transition-all cursor-default">
                            <div className="text-xl font-black text-blue-600">{stats.classStats[cls.toString()] || 0}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Kelas {cls}</div>
                        </div>
                    ))}
                 </div>
            </div>
            
        </div>

        {/* Right Column (Widgets) */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Pengumuman Hari Ini (Redesigned as requested) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.iconText}`}><Megaphone className="w-6 h-6"/></div>
                    <h3 className="font-black text-gray-800 text-lg leading-tight">{config.announcementTitle}</h3>
                </div>
                
                <div className="space-y-4">
                    {config.announcementItems.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                            {/* Date Block */}
                            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl ${theme.bg} ${theme.text} shrink-0`}>
                                <span className="text-2xl font-black leading-none">{item.dateDay}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">{item.dateMonth}</span>
                            </div>
                            
                            {/* Content */}
                            <div className="pt-1">
                                <h4 className="font-bold text-gray-800 text-sm mb-1">{item.title}</h4>
                                <p className="text-xs text-gray-500 mb-2 leading-snug">{item.desc}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                                    <Clock className="w-3.5 h-3.5"/>
                                    <span>{item.time}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Login CTA (Desktop Only) */}
            <div className="hidden lg:block bg-[#23272A] rounded-3xl p-6 text-center text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                 <h3 className="font-bold text-lg mb-2 relative z-10">Area Guru & Siswa</h3>
                 <p className="text-xs text-gray-400 mb-6 relative z-10">Silahkan login untuk akses jurnal & tugas.</p>
                 <button
                        onClick={onLoginClick}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/50 relative z-10 flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-4 h-4"/> Masuk Aplikasi
                </button>
            </div>

        </div>

      </main>

      {/* --- FIXED BOTTOM NAVIGATION (Mobile) --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-6 py-3 z-50 md:hidden">
          <div className="flex justify-around items-center">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex flex-col items-center gap-1 text-blue-600">
                  <Home className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Beranda</span>
              </button>
              <button onClick={() => setSearchView(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
                  <Search className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Cari</span>
              </button>
              <button onClick={onLoginClick} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
                  <User className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Login</span>
              </button>
              <button onClick={() => setIsInfoOpen(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
                  <Info className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Info</span>
              </button>
          </div>
      </nav>

      {/* --- INFO POPUP MODAL --- */}
      {isInfoOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative">
                  <button onClick={() => setIsInfoOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X className="w-5 h-5 text-gray-600"/></button>
                  
                  <div className="p-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <Info className="w-8 h-8 text-blue-600"/>
                      </div>
                      <h3 className="text-xl font-black text-center text-gray-800 mb-2">Panduan Informasi</h3>
                      <p className="text-center text-gray-500 text-xs mb-6">
                          Apabila Anda mengalami kendala atau membutuhkan informasi lebih lanjut mengenai BISMA APP, silakan hubungi admin sekolah.
                      </p>

                      <div className="space-y-3">
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <h4 className="font-bold text-sm text-gray-700 mb-1">Cara Pengisian Data</h4>
                              <p className="text-xs text-gray-500">Pastikan data yang diinputkan sesuai dengan dokumen resmi sekolah.</p>
                          </div>
                          
                          <button 
                              onClick={handleWhatsAppClick}
                              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all active:scale-95"
                          >
                              <MessageCircle className="w-5 h-5" /> Chat WhatsApp Admin
                          </button>
                          <p className="text-[10px] text-center text-gray-400">Nomor: +{config.waNumber}</p>
                      </div>
                  </div>
                  <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                      <button onClick={() => setIsInfoOpen(false)} className="text-sm font-bold text-gray-600 hover:text-gray-800">Tutup</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default PublicDashboard;