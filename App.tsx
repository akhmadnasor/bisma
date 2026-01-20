import React, { useState } from 'react';
import PublicDashboard from './components/PublicDashboard';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import JournalForm from './components/JournalForm';

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

  return <PublicDashboard onLoginClick={() => setView('login')} />;
}

export default App;