import React, { useState, useEffect } from 'react';
import PublicDashboard from './components/PublicDashboard';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import JournalForm from './components/JournalForm';
import { Download, X } from 'lucide-react';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Listen to the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Timer for 20 seconds
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 20000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredPrompt(null);
        } else {
            // Fallback instruction for browsers/environments where the prompt isn't automated
            alert("Untuk menginstall aplikasi:\n\n1. Ketuk menu browser (titik tiga ⋮ atau ikon Share)\n2. Pilih 'Tambahkan ke Layar Utama' atau 'Install App'");
        }
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up">
            <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 pl-3 pr-2 py-2 bg-white/90 backdrop-blur-md border border-gray-200 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 group"
            >
                <div className="bg-blue-50 text-blue-600 p-1 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Download className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-sans font-medium text-gray-700 group-hover:text-gray-900 pr-1">Install</span>
                
                <div className="w-px h-3 bg-gray-300 mx-1"></div>
                
                <div 
                    onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
                >
                    <X className="w-3 h-3" />
                </div>
            </button>
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