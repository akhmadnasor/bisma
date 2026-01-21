import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { User, Lock, ShieldCheck, Home, Search, Info } from 'lucide-react';

interface LoginProps {
  onSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState(''); // Email / NIP / NISN
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        // 1. Super Admin (Hardcoded for Safety/Recovery)
        if ((identifier === 'superadmin' || identifier === 'supermadmin') && password === 'admin') {
            onSuccess({
                id: 'super-admin-id',
                role: 'superadmin',
                email: 'superadmin@bisma.id',
                user_metadata: { name: 'IT Super Administrator' },
            });
            return;
        }

        // 2. Admin Sekolah (TU) (Hardcoded or could be in DB)
        if (identifier === 'admin' && password === 'admin') {
            onSuccess({
                id: 'admin-school-id',
                role: 'admin',
                email: 'admin@sekolah.id',
                user_metadata: { name: 'Tata Usaha SDN Baujeng 1' },
            });
            return;
        }

        // 3. Cek Database GURU (Teachers Table)
        // Kita cek apakah NIP dan Password cocok di tabel public.teachers
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('*')
            .eq('nip', identifier)
            .eq('password', password) // Note: In production, hash this!
            .eq('status', 'Active')
            .single();

        if (teacher && !teacherError) {
            onSuccess({
                id: teacher.id.toString(), // Use DB ID
                role: 'teacher',
                email: `${teacher.nip}@sekolah.id`,
                user_metadata: { 
                    name: teacher.name,
                    nip: teacher.nip 
                },
                profile: teacher 
            });
            return;
        }

        // 4. Cek Database SISWA (Students Table)
        // Kita cek apakah NISN dan Password cocok di tabel public.students
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('nisn', identifier)
            .eq('password', password)
            .eq('status', 'Active')
            .single();

        if (student && !studentError) {
            onSuccess({
                id: student.id.toString(),
                role: 'student',
                email: `${student.nisn}@siswa.id`,
                user_metadata: { 
                    name: student.name, 
                    class_name: student.class_name,
                    nisn: student.nisn
                },
                profile: student
            });
            return;
        }

        // 5. Jika tidak ditemukan di manapun
        throw new Error('Username atau Password salah.');

    } catch (err: any) {
        console.error("Login Error:", err);
        setError('Login gagal. Periksa Username/NIP/NISN dan Password.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#F1F5F9]">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-[#0F2167] rounded-b-[3rem] z-0"></div>

      <div className="w-full max-w-[360px] z-10 flex flex-col items-center">
        
        {/* LOGO SECTION - STANDALONE */}
        <div className="mb-8 relative z-20">
            {/* Logo Image with Gold Shimmer Animation */}
            <img
                src="https://i.imghippo.com/files/kldd1383bkc.png"
                alt="Logo Sekolah"
                className="h-44 w-auto object-contain animate-gold-shimmer drop-shadow-2xl"
            />
        </div>

        {/* LOGIN CARD - SEPARATE */}
        <div className="w-full glass-panel pt-10 pb-10 px-8 rounded-[2rem] shadow-2xl relative overflow-hidden animate-fade-in-up border border-white">
            <div className="text-center mb-8 relative z-10">
                <h1 className="text-4xl font-black text-primary tracking-tight mb-2">BISMA</h1>
                <div className="h-1.5 w-12 bg-warning mx-auto rounded-full mb-3"></div>
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.3em]">Sistem Monitoring KBM</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                <div className="group">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="NIP (Guru) / NISN (Siswa)"
                            className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-dark font-bold text-sm placeholder-gray-400"
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
                            className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-dark font-bold text-sm placeholder-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs text-center rounded-xl font-bold animate-pulse">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0F2167] hover:bg-[#1e3a8a] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/30 transition-all active:scale-95 flex items-center justify-center gap-2 group transform hover:-translate-y-0.5 mt-2"
                >
                    {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        <>
                            <ShieldCheck className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                            MASUK APLIKASI
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center space-y-3 relative z-10">
                <p className="text-[10px] text-gray-400 font-medium">© 2026 SDN Baujeng 1</p>
                <div className="inline-block px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                     <p className="text-[10px] text-gray-400 font-medium">Masuk menggunakan Data Sekolah</p>
                </div>
            </div>
        </div>
      </div>

      {/* --- FLOATING FOOTER NAV --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] px-6 py-3 z-50">
          <div className="flex justify-around items-center max-w-md mx-auto">
              <button onClick={() => window.location.reload()} className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors group">
                  <Home className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                  <span className="text-[10px] font-medium">Beranda</span>
              </button>
              <button onClick={() => window.open('https://www.sdnbaujeng1.sch.id/', '_blank')} className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors group">
                  <Search className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                  <span className="text-[10px] font-medium">Cari</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-primary">
                  <div className="bg-blue-50 p-1.5 rounded-full -mt-1 mb-0.5 text-primary">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold">Login</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors group">
                  <Info className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                  <span className="text-[10px] font-medium">Info</span>
              </button>
          </div>
      </nav>
    </div>
  );
};

export default Login;