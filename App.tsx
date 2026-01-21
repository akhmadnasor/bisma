import React, { useState, useEffect } from 'react';
import PublicDashboard from './components/PublicDashboard';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import JournalForm from './components/JournalForm';
import { Download, X, Smartphone } from 'lucide-react';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        // Listen to the beforeinstallprompt event (Android/Chrome)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true); // Show immediately when browser says it's installable
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Timer to show prompt/instruction if event doesn't fire (e.g. iOS or PWA already installable but event missed)
        // We use a short delay so it doesn't annoy user immediately upon load
        const timer = setTimeout(() => {
            // If prompt hasn't fired yet, show manual instructions (useful for iOS)
            if (!deferredPrompt) {
               setIsVisible(true);
            }
        }, 3000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, [deferredPrompt]);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsVisible(false);
            }
        } else {
            // Manual Instructions for iOS or non-supported browsers
            const msg = isIOS 
                ? "Untuk menginstall aplikasi di iPhone/iPad:\n\n1. Ketuk tombol Share (ikon kotak dengan panah ke atas) di bawah layar Safari.\n2. Gulir ke bawah dan pilih 'Tambah ke Layar Utama' (Add to Home Screen)."
                : "Untuk menginstall aplikasi:\n\n1. Ketuk menu browser (titik tiga ⋮ di pojok kanan atas).\n2. Pilih 'Tambahkan ke Layar Utama' atau 'Install App'.";
            alert(msg);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up w-[90%] max-w-sm">
            <div
                className="flex items-center justify-between pl-4 pr-3 py-3 bg-[#0F2167] text-white rounded-2xl shadow-2xl shadow-blue-900/40 border border-white/10 backdrop-blur-md cursor-pointer"
                onClick={handleInstallClick}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-xl animate-pulse">
                        <Smartphone className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-blue-200 uppercase tracking-wide">Aplikasi Sekolah</span>
                        <span className="text-sm font-bold">Install BISMA App</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleInstallClick();
                        }}
                        className="bg-yellow-500 hover:bg-yellow-400 text-[#0F2167] text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Install
                    </button>
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setIsVisible(false); 
                        }}
                        className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

function App() {
  const [view, setView] = useState<'public' | 'login' | 'dashboard' | 'journal' | 'iframe'>('public');
  const [user, setUser] = useState<any>(null);
  const [iframeSrc, setIframeSrc] = useState('');
  const [iframeTitle, setIframeTitle] = useState('');

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('public');
  };

  const handleNavigate = (page: string) => {
    if (page === 'jurnal') {
      setView('journal');
    } else if (page === 'rpp') {
        setIframeSrc('https://sigmabai.netlify.app/');
        setIframeTitle('RPP Generator');
        setView('iframe');
    } else if (page === 'galeri') {
        setIframeSrc('https://www.sdnbaujeng1.sch.id/');
        setIframeTitle('Galeri Sekolah');
        setView('iframe');
    } else {
      // For other pages, we'll just show a placeholder alert in this demo
      alert(`Fitur "${page}" sedang dalam pengembangan untuk versi 2026.`);
    }
  };

  if (view === 'login') {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  // Role-based Routing
  if (view === 'dashboard' && user) {
      if (user.role === 'superadmin') {
          return <SuperAdminDashboard onLogout={handleLogout} />;
      }
      if (user.role === 'admin') {
          return <AdminDashboard onLogout={handleLogout} />;
      }
      if (user.role === 'student') {
          return <StudentDashboard onLogout={handleLogout} />;
      }
      // Default to Teacher Dashboard
      return (
        <TeacherDashboard 
            user={user} 
            onLogout={handleLogout} 
            onNavigate={handleNavigate}
        />
      );
  }

  if (view === 'journal' && user) {
    return <JournalForm user={user} onBack={() => setView('dashboard')} />;
  }

  if (view === 'iframe') {
      return (
        <div className="flex flex-col h-screen">
            <header className="bg-gradient-to-r from-[#5865F2] to-[#EB459E] p-4 text-white flex items-center gap-4 shadow-md">
                <button onClick={() => setView('dashboard')} className="p-2 rounded-full hover:bg-white/20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                </button>
                <h1 className="text-xl font-bold">{iframeTitle}</h1>
            </header>
            <iframe src={iframeSrc} className="flex-grow border-0 w-full" title={iframeTitle} />
        </div>
      )
  }

  return (
    <>
      <PublicDashboard onLoginClick={() => setView('login')} />
      <InstallPWA />
    </>
  );
}

export default App;