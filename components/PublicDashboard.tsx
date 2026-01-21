import React, { useEffect, useState } from 'react';
import { LogIn, Users, Calendar, Trophy, Megaphone, Clock, Home, Search, User, Info, MessageCircle, ChevronDown, ChevronUp, X, ArrowLeft, BellOff } from 'lucide-react';
import { DashboardStats, AppConfig } from '../types';
import { supabase } from '../services/supabase';

interface PublicDashboardProps {
  onLoginClick: () => void;
}

const PublicDashboard: React.FC<PublicDashboardProps> = ({ onLoginClick }) => {
  const [time, setTime] = useState(new Date());
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [searchView, setSearchView] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Dynamic Stats State
  const [classStats, setClassStats] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const initData = async () => {
        try {
            setLoadingConfig(true);
            setLoadingStats(true);

            // 1. Fetch App Config
            const { data: configData } = await supabase.from('app_config').select('*').single();
            if (configData) setAppConfig(configData);

            // 2. Fetch Students for Real Stats
            const { data: studentData, error } = await supabase.from('students').select('class_name');
            
            if (studentData) {
                const stats: Record<string, number> = {};
                // Initialize common classes with 0 to ensure they appear even if empty
                ['1A', '1B', '2A', '2B', '3A', '4A', '5A', '6A'].forEach(c => stats[c] = 0);
                
                studentData.forEach((s) => {
                    const cls = s.class_name || 'Lainnya';
                    stats[cls] = (stats[cls] || 0) + 1;
                });
                setClassStats(stats);
            }

        } catch (e) {
            console.error("Error loading data", e);
        } finally {
            setLoadingConfig(false);
            setLoadingStats(false);
        }
    };

    initData();

    return () => clearInterval(timer);
  }, []);

  const handleWhatsAppClick = () => {
      const num = '6285749662221'; 
      window.open(`https://wa.me/${num}`, '_blank');
  };

  // Color Helper for Announcement Widget
  const getColorClasses = (color: string | undefined) => {
    const safeColor = color || 'yellow';
    switch(safeColor) {
      case 'blue': return { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconText: 'text-blue-600', text: 'text-blue-600', accent: 'bg-blue-600' };
      case 'green': return { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-100', iconText: 'text-green-600', text: 'text-green-600', accent: 'bg-green-600' };
      case 'pink': return { bg: 'bg-pink-50', border: 'border-pink-100', iconBg: 'bg-pink-100', iconText: 'text-pink-600', text: 'text-pink-600', accent: 'bg-pink-600' };
      case 'purple': return { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', iconText: 'text-purple-600', text: 'text-purple-600', accent: 'bg-purple-600' };
      default: return { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', iconText: 'text-amber-700', text: 'text-amber-700', accent: 'bg-amber-500' };
    }
  };

  const theme = getColorClasses(appConfig?.announcementColor);

  const getDateDisplay = (dateStr: string | undefined) => {
      if (!dateStr) return { day: '--', month: '---' };
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { day: '--', month: '---' };
      return {
          day: date.getDate(),
          month: date.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()
      };
  };

  const dateDisplay = getDateDisplay(appConfig?.announcementDate);

  if (searchView) {
      return (
          <div className="min-h-screen flex flex-col bg-white">
              <header className="bg-[#0F2167] p-4 text-white flex items-center gap-4 shadow-md sticky top-0 z-50">
                  <button onClick={() => setSearchView(false)} className="p-2 hover:bg-white/20 rounded-full">
                      <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="font-bold text-lg">Pencarian Informasi Sekolah</h1>
              </header>
              <div className="flex-1 w-full h-full relative">
                  <iframe 
                    src="https://www.sdnbaujeng1.sch.id/" 
                    className="w-full h-[calc(100vh-64px)] border-0" 
                    title="School Website"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans pb-24 relative overflow-hidden">
      
      {/* --- STICKY HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-[#0F2167] to-[#1e3a8a] shadow-lg px-4 py-3 md:px-8 transition-all duration-300 rounded-b-3xl md:rounded-b-none border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="relative cursor-pointer">
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-lg"></div>
                    <img
                        src={appConfig?.logoUrl1x1 || "https://i.imghippo.com/files/kldd1383bkc.png"}
                        alt="Logo"
                        className="relative h-12 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
                        onError={(e) => (e.currentTarget.src = "https://i.imghippo.com/files/kldd1383bkc.png")}
                    />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter drop-shadow-sm uppercase">{appConfig?.appName || 'BISMA'}</h1>
                    <p className="text-amber-400 font-bold tracking-wide text-[10px] md:text-xs uppercase">{appConfig?.schoolName || 'SDN BAUJENG 1'}</p>
                </div>
            </div>
            
            {/* Time Widget (Desktop) */}
            <div className="hidden md:block text-right text-white">
                 <div className="font-bold text-lg leading-none">{time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}</div>
                 <div className="text-xs opacity-90 text-blue-200">{time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
            </div>
        </div>
      </header>

      {/* Spacer for Fixed Header */}
      <div className="h-24 md:h-20"></div>

      {/* Main Content Grid */}
      <main className="p-4 md:p-8 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up relative z-10">
        
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Interactive Welcome Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-blue-100 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-[#0F2167] to-[#D97706]"></div>
                 
                 <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">
                    Selamat Datang! 👋
                 </h2>
                 <p className="text-gray-600 text-sm leading-relaxed">
                     Pantau aktivitas sekolah {appConfig?.schoolName || 'SDN Baujeng 1'} dengan mudah.
                 </p>
            </div>

            {/* Statistik Siswa - DYNAMIC */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-gray-100">
                 <div className="flex items-center gap-2 mb-4">
                     <div className="w-8 h-8 bg-blue-100 text-[#0F2167] rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5" />
                     </div>
                     <h3 className="font-bold text-gray-800 text-lg">Info Kelas & Jumlah Siswa</h3>
                 </div>
                 
                 {loadingStats ? (
                     <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 animate-pulse">
                         {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-gray-200 rounded-2xl"></div>)}
                     </div>
                 ) : (
                     <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {Object.keys(classStats).sort().map((cls) => (
                            <div key={cls} className="bg-white border-2 border-slate-100 rounded-2xl p-2 text-center hover:bg-blue-50 hover:border-blue-200 transition-all cursor-default shadow-sm group">
                                <div className="text-xl font-black text-[#0F2167] group-hover:text-blue-600 transition-colors">{classStats[cls]}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Kelas {cls}</div>
                            </div>
                        ))}
                     </div>
                 )}
            </div>
            
        </div>

        {/* Right Column (Widgets) */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Pengumuman Hari Ini - DYNAMIC */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.iconText}`}><Megaphone className="w-6 h-6"/></div>
                    <h3 className="font-black text-gray-800 text-lg leading-tight">Pengumuman Sekolah</h3>
                </div>
                
                {loadingConfig ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-2xl"></div>
                    </div>
                ) : appConfig && appConfig.announcementTitle ? (
                    <div className="relative z-10">
                        <div className="flex gap-4 items-start">
                            {/* Date Block */}
                            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl ${theme.bg} ${theme.text} shrink-0 border-2 ${theme.border}`}>
                                <span className="text-2xl font-black leading-none">{dateDisplay.day}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">{dateDisplay.month}</span>
                            </div>
                            
                            {/* Content */}
                            <div className="pt-1 flex-1">
                                <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${theme.text} bg-white/50 inline-block px-2 py-0.5 rounded-md`}>
                                    {appConfig.announcementType || 'Info'}
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm mb-1 leading-snug">{appConfig.announcementTitle}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mb-2">
                                    <Clock className="w-3.5 h-3.5"/>
                                    <span>{appConfig.announcementTime || 'Waktu tidak ditentukan'}</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    {appConfig.announcementDesc}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // EMPTY STATE
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <BellOff className="w-10 h-10 text-gray-300 mx-auto mb-2"/>
                        <p className="text-xs font-bold text-gray-400">Belum ada pengumuman aktif.</p>
                        <p className="text-[10px] text-gray-400 mt-1">Silahkan cek kembali nanti.</p>
                    </div>
                )}

                {/* Decor Blob */}
                {appConfig && appConfig.announcementTitle && (
                    <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full opacity-10 ${theme.accent}`}></div>
                )}
            </div>

            {/* Login CTA (Desktop Only) */}
            <div className="hidden lg:block bg-[#0F2167] rounded-3xl p-6 text-center text-white relative overflow-hidden shadow-xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                 <h3 className="font-bold text-lg mb-2 relative z-10">Area Guru & Siswa</h3>
                 <p className="text-xs text-blue-200 mb-6 relative z-10">Silahkan login untuk akses jurnal & tugas.</p>
                 <button
                        onClick={onLoginClick}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold text-sm hover:from-amber-600 hover:to-amber-700 transition-colors shadow-lg shadow-amber-900/50 relative z-10 flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-4 h-4"/> Masuk Aplikasi
                </button>
            </div>

        </div>

      </main>

      {/* --- FIXED BOTTOM NAVIGATION (Mobile) --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-6 py-3 z-50 md:hidden">
          <div className="flex justify-around items-center">
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex flex-col items-center gap-1 text-[#0F2167]">
                  <Home className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Beranda</span>
              </button>
              <button onClick={() => setSearchView(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#0F2167] transition-colors">
                  <Search className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Cari</span>
              </button>
              <button onClick={onLoginClick} className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#0F2167] transition-colors">
                  <User className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Login</span>
              </button>
              <button onClick={() => setIsInfoOpen(true)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#0F2167] transition-colors">
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
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                          <Info className="w-8 h-8 text-[#0F2167]"/>
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
                              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all active:scale-95"
                          >
                              <MessageCircle className="w-5 h-5" /> Chat WhatsApp Admin
                          </button>
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