import React, { useEffect, useState } from 'react';
import { LogIn, Users, Calendar, Trophy, Megaphone, Clock, Home, Search, User, Info, MessageCircle, ChevronDown, ChevronUp, X, ArrowLeft } from 'lucide-react';
import { DashboardStats } from '../types';

interface PublicDashboardProps {
  onLoginClick: () => void;
}

const PublicDashboard: React.FC<PublicDashboardProps> = ({ onLoginClick }) => {
  const [time, setTime] = useState(new Date());
  const [isDescVisible, setIsDescVisible] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [searchView, setSearchView] = useState(false);

  // Default Mock Config
  const config = {
      waNumber: '6285749662221',
      announcementTitle: 'Pengumuman Hari Ini',
      announcementItems: [
          { date: '15 Mar', title: 'Rapat Wali Murid', desc: 'Pembagian Raport Tengah Semester', time: '08:00 - Selesai' },
          { date: '21 Mar', title: 'Pondok Ramadhan', desc: 'Kegiatan keagamaan siswa', time: '07:00 - 11:00' }
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
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-yellow-400 shadow-lg px-4 py-3 md:px-8 transition-all duration-300">
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
                    <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter drop-shadow-sm">BISMA APP</h1>
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
      <div className="h-20"></div>

      {/* Main Content Grid */}
      <main className="p-4 md:p-8 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
        
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* Interactive Welcome Card */}
            <div 
                onClick={() => setIsDescVisible(!isDescVisible)}
                className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100 cursor-pointer hover:shadow-md transition-all relative overflow-hidden group"
            >
                 <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-blue-500 to-yellow-400"></div>
                 <div className="flex justify-between items-center mb-2">
                     <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full inline-block">Portal Utama</span>
                     {isDescVisible ? <ChevronUp className="w-5 h-5 text-gray-400"/> : <ChevronDown className="w-5 h-5 text-gray-400"/>}
                 </div>
                 
                 <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-1 group-hover:text-blue-700 transition-colors">
                    Selamat Datang BISMA APP
                 </h2>
                 
                 <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isDescVisible ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                     <p className="text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
                         Pantau aktivitas, agenda sekolah, dan perkembangan terkini SDN Baujeng 1 melalui dashboard ini. 
                         Kami berkomitmen memberikan layanan informasi yang transparan dan akuntabel bagi seluruh wali murid.
                         <br/><br/>
                         <span className="text-xs font-bold text-blue-500">Tap kartu ini untuk menutup informasi.</span>
                     </p>
                 </div>
                 {!isDescVisible && <p className="text-xs text-gray-400 mt-1 animate-pulse">Ketuk untuk melihat detail...</p>}
            </div>

            {/* Statistik Siswa */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-gray-800 text-lg">Statistik Siswa</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">Total: 177</span>
                 </div>
                 
                 <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((cls) => (
                        <div key={cls} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3 text-center hover:bg-blue-100 transition-colors">
                            <div className="text-lg font-black text-blue-700">{stats.classStats[cls.toString()] || 0}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Kelas {cls}</div>
                        </div>
                    ))}
                 </div>
            </div>
            
        </div>

        {/* Right Column (Widgets) */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Pengumuman Hari Ini (Previously Agenda) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border-t-4 border-yellow-400">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><Megaphone className="w-5 h-5"/></div>
                    <h3 className="font-bold text-gray-800 text-lg">{config.announcementTitle}</h3>
                </div>
                <div className="space-y-4">
                    {config.announcementItems.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start group">
                            <div className="bg-gray-100 px-3 py-2 rounded-xl text-center min-w-[60px] group-hover:bg-blue-100 transition-colors">
                                <span className="block text-xl font-black text-gray-700 group-hover:text-blue-700">{item.date.split(' ')[0]}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase group-hover:text-blue-400">{item.date.split(' ')[1]}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {item.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Login CTA (Desktop Only - Updated Text) */}
            <div className="hidden lg:block bg-gradient-to-br from-[#23272A] to-[#0F172A] rounded-3xl p-6 text-center text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                 <h3 className="font-bold text-lg mb-2 relative z-10">Login</h3>
                 <p className="text-xs text-gray-400 mb-6 relative z-10">Masuk sebagai Guru, Siswa, atau Admin.</p>
                 <button
                        onClick={onLoginClick}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/50 relative z-10 flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-4 h-4"/> Masuk Aplikasi
                </button>
            </div>

        </div>

      </main>

      {/* --- FIXED BOTTOM NAVIGATION (Melayang) --- */}
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
                  <span className="text-[10px] font-medium">Informasi</span>
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