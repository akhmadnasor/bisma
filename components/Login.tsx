import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { ArrowRight, User, Lock, ShieldCheck, Home, Search, Info } from 'lucide-react';

interface LoginProps {
  onSuccess: (user: any) => void;
}

// --- MOCK AUTH DATA ---
const MOCK_TEACHERS = [
  { nip: '198001012005012001', password: 'guru', name: 'Hj. Siti Aminah' },
  { nip: '197502022000031002', password: 'guru', name: 'Drs. Supriyanto' },
  { nip: '199003032019032005', password: 'guru', name: 'Rina Wati, S.Pd' },
  { nip: '198504042010011003', password: 'guru', name: 'Bambang Gentolet' },
  { nip: '12345', password: '1', name: 'Guru Tes' }, // Added Test Account
  { nip: 'user', password: 'user', name: 'Guru Demo' } // Fallback
];

const MOCK_STUDENTS = [
  { nisn: '304910293', password: 'siswa', name: 'Ahmad Dahlan', class: '5A' },
  { nisn: '304910294', password: 'siswa', name: 'Budi Santoso', class: '5A' },
  { nisn: '304910295', password: 'siswa', name: 'Citra Kirana', class: '4B' },
  { nisn: '304910296', password: 'siswa', name: 'Dewi Sartika', class: '6A' },
  { nisn: '304910297', password: 'siswa', name: 'Eko Patrio', class: '3A' },
  { nisn: '2345', password: '1', name: 'Siswa Tes', class: '5A' }, // Added Test Account
  { nisn: 'siswa', password: 'siswa', name: 'Siswa Demo', class: '5A' } // Fallback
];

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState(''); // Email / NIP / NISN
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate Network Delay
    setTimeout(async () => {
        // 1. Super Admin (Both spellings handled as per request)
        if ((identifier === 'superadmin' || identifier === 'supermadmin') && password === 'admin') {
            onSuccess({
            id: 'super-admin-id',
            role: 'superadmin',
            email: 'superadmin@bisma.id',
            user_metadata: { name: 'IT Super Administrator' },
            });
            setLoading(false);
            return;
        }

        // 2. Admin Sekolah (TU)
        if (identifier === 'admin' && password === 'admin') {
            onSuccess({
            id: 'admin-school-id',
            role: 'admin',
            email: 'admin@sekolah.id',
            user_metadata: { name: 'Tata Usaha SDN Baujeng 1' },
            });
            setLoading(false);
            return;
        }

        // 3. Cek Guru (By NIP)
        const teacher = MOCK_TEACHERS.find(t => t.nip === identifier && t.password === password);
        if (teacher) {
            onSuccess({
                id: `teacher-${teacher.nip}`,
                role: 'teacher',
                email: `${teacher.nip}@sekolah.id`,
                user_metadata: { name: teacher.name },
                profile: { name: teacher.name, nip: teacher.nip }
            });
            setLoading(false);
            return;
        }

        // 4. Cek Siswa (By NISN)
        const student = MOCK_STUDENTS.find(s => s.nisn === identifier && s.password === password);
        if (student) {
            onSuccess({
                id: `student-${student.nisn}`,
                role: 'student',
                email: `${student.nisn}@siswa.id`,
                user_metadata: { name: student.name, class_name: student.class },
            });
            setLoading(false);
            return;
        }

        // 5. Fallback: Try Supabase Real Auth
        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: identifier,
                password,
            });

            if (authError) throw authError;

            if (data.user) {
                const { data: profile } = await supabase
                .from('teachers')
                .select('*')
                .eq('id', data.user.id)
                .single();
                
                onSuccess({ ...data.user, profile, role: 'teacher' });
            }
        } catch (err: any) {
            // If supabase fails and no mock data matched
            setError('Login gagal. Periksa Username/NIP/NISN dan Password.');
        } finally {
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-24">
      <div className="w-full max-w-[400px] z-10 animate-fade-in-up">
        
        <div className="glass-panel p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
            {/* Decorative background within card */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

            <div className="text-center mb-8 relative z-10">
                <div className="w-24 h-24 mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-primary rounded-full blur-lg opacity-40 animate-pulse"></div>
                    <img
                        src="https://picsum.photos/id/20/200/200"
                        alt="Logo"
                        className="relative w-full h-full rounded-full border-4 border-white shadow-lg object-cover"
                    />
                </div>
                <h1 className="text-2xl font-black text-dark tracking-tight">BISMA</h1>
                <p className="text-gray-500 text-sm font-medium">Monitoring Kegiatan Belajar Mengajar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                <div className="group">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Username / NIP / NISN"
                            className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-dark font-medium placeholder-gray-400"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="group">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-dark font-medium placeholder-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-danger/10 text-danger text-sm text-center rounded-xl font-medium animate-pulse">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-[#4752C4] text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                >
                    {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        <>
                            <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Masuk Aplikasi
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center space-y-2">
                <p className="text-xs text-gray-400">© 2026 SDN Baujeng 1 • Powered by BISMA</p>
                <p className="text-[10px] text-gray-300">Gunakan akun tes: 12345 (Guru) / 2345 (Siswa)</p>
            </div>
        </div>
      </div>

      {/* --- FLOATING FOOTER NAV --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-6 py-3 z-50">
          <div className="flex justify-around items-center">
              <button onClick={() => window.location.reload()} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
                  <Home className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Beranda</span>
              </button>
              <button onClick={() => window.open('https://www.sdnbaujeng1.sch.id/', '_blank')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
                  <Search className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Cari</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-blue-600">
                  <User className="w-6 h-6" />
                  <span className="text-[10px] font-bold">Login</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors">
                  <Info className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Info</span>
              </button>
          </div>
      </nav>
    </div>
  );
};

export default Login;