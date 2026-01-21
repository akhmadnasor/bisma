import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, XCircle, Send, Check, ShieldAlert, ListChecks, Calendar, UserX, UserCheck } from 'lucide-react';
import { supabase } from '../services/supabase';
import { MOCK_STUDENTS_FALLBACK } from '../constants';

interface JournalFormProps {
  user: any;
  onBack: () => void;
}

const JournalForm: React.FC<JournalFormProps> = ({ user, onBack }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [mySchedules, setMySchedules] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  
  // Form States
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  // Attendance: Default empty implies "Hadir" in UI logic, but we store explicitly on save.
  // We track "Non-Present" mainly for UI interaction.
  const [attendance, setAttendance] = useState<Record<string, string>>({}); 

  const [pembelajaran, setPembelajaran] = useState([{ mapel: '', jam: [] as string[], materi: '' }]);
  const [disciplineNotes, setDisciplineNotes] = useState<string[]>([]);
  const [otherNote, setOtherNote] = useState('');
  const [kebersihan, setKebersihan] = useState('');

  // 1. Fetch Teacher's Schedule to populate dropdowns
  useEffect(() => {
      const fetchSchedule = async () => {
          // Get schedules for this teacher
          const { data } = await supabase
            .from('schedules')
            .select('*')
            .eq('teacher_name', user.user_metadata?.name);
          
          if (data && data.length > 0) {
              setMySchedules(data);
              // Extract unique classes
              const uniqueClasses = Array.from(new Set(data.map((s: any) => s.class_name))).sort();
              setAvailableClasses(uniqueClasses);
          } else {
              // Fallback if no schedule: Fetch all classes
              const { data: allData } = await supabase.from('students').select('class_name');
              if (allData) {
                  const uniqueClasses = Array.from(new Set(allData.map((s: any) => s.class_name))).sort();
                  setAvailableClasses(uniqueClasses);
              }
          }
      };
      fetchSchedule();
  }, [user]);

  // 2. When Class Changes: Fetch Students & Filter Subjects
  useEffect(() => {
    if (selectedClass) {
        // Fetch students
        const fetchStudents = async () => {
            const { data } = await supabase.from('students').select('*').eq('class_name', selectedClass).order('name');
            setStudents(data || MOCK_STUDENTS_FALLBACK);
            // Reset attendance when class changes
            setAttendance({});
        };
        fetchStudents();

        // Filter Subjects based on Schedule for this Class
        const subjectsForClass = mySchedules
            .filter(s => s.class_name === selectedClass)
            .map(s => s.subject);
        
        // If teacher has specific subjects scheduled, use them. Otherwise allow standard subjects.
        if (subjectsForClass.length > 0) {
            setAvailableSubjects(Array.from(new Set(subjectsForClass)));
        } else {
            setAvailableSubjects([]); // Will fallback to standard list in render
        }
    }
  }, [selectedClass, mySchedules]);

  // Helper: Count Present
  const totalStudents = students.length;
  const totalAbsent = Object.values(attendance).filter(v => ['S','I','A','D'].includes(v)).length;
  const totalPresent = totalStudents - totalAbsent;

  const handleNext = () => {
      if (step === 1 && !selectedClass) return alert('Pilih kelas terlebih dahulu');
      if (step === 2 && pembelajaran.some(p => !p.mapel || !p.materi)) return alert('Lengkapi data pembelajaran');
      setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const toggleAttendance = (studentId: string, status: string) => {
      setAttendance(prev => {
          const current = prev[studentId];
          // If clicking the same status, toggle off (back to Hadir)
          if (current === status) {
              const newState = { ...prev };
              delete newState[studentId]; // Delete means "Hadir"
              return newState;
          }
          return { ...prev, [studentId]: status };
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!kebersihan) return alert('Pilih status kebersihan');
      
      setLoading(true);
      try {
          const finalNotes = [...disciplineNotes];
          if (otherNote) finalNotes.push(otherNote);

          const { data: journal, error } = await supabase.from('journals').insert({
              teacher_id: user.id,
              class_name: selectedClass,
              material: JSON.stringify(pembelajaran),
              cleanliness_status: kebersihan,
              validation_status: 'Verified',
              notes: finalNotes.join(', ')
          }).select().single();

          if (error) throw error;

          if (journal) {
              // Prepare attendance records
              // Default everyone to 'H' unless in attendance object
              const attendanceEntries = students.map(s => ({
                  journal_id: journal.id,
                  student_name: s.name,
                  status: attendance[s.id] || 'H' // Default Hadir
              }));
              
              if (attendanceEntries.length > 0) {
                 await supabase.from('attendance_logs').insert(attendanceEntries);
              }
          }

          alert('Jurnal berhasil disimpan!');
          onBack();
      } catch (err: any) {
          console.error(err);
          alert(`Gagal menyimpan: ${err.message}`);
      } finally {
          setLoading(false);
      }
  };

  const updatePembelajaran = (index: number, field: string, value: any) => {
      const newPem = [...pembelajaran];
      (newPem[index] as any)[field] = value;
      setPembelajaran(newPem);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F8F9FD]">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-black text-gray-800">Jurnal KBM</h2>
            <p className="text-xs text-blue-600 font-bold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 mt-2 max-w-3xl mx-auto w-full">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8 px-4 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
              {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`flex flex-col items-center gap-2 transition-all duration-500 ${step >= i ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg transition-all ${step >= i ? 'bg-blue-600 text-white scale-110' : 'bg-white text-gray-400 border border-gray-200'}`}>
                          {step > i ? <Check className="w-5 h-5"/> : i}
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 hidden md:block">
                          {i===1 ? 'Kehadiran' : i===2 ? 'Materi' : i===3 ? 'Catatan' : 'Simpan'}
                      </span>
                  </div>
              ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
             {step === 1 && (
                 <div className="animate-fade-in-up">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Kelas</label>
                        <select 
                            className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">-- Ketuk untuk memilih --</option>
                            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    
                    {selectedClass && (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center">
                                <h3 className="font-bold text-blue-900 flex items-center gap-2"><UserCheck className="w-5 h-5"/> Presensi Siswa</h3>
                                <div className="text-xs font-bold bg-white px-3 py-1 rounded-full text-blue-600 shadow-sm border border-blue-100">
                                    Hadir: {totalPresent} / {totalStudents}
                                </div>
                            </div>
                            <div className="p-2">
                                <p className="text-xs text-center text-gray-400 mb-4 mt-2">Ketuk tombol di sebelah kanan nama siswa <br/> <span className="text-red-500 font-bold">HANYA JIKA SISWA TIDAK HADIR</span></p>
                                <div className="space-y-2">
                                    {students.map((s) => {
                                        const status = attendance[s.id]; // undefined means Hadir
                                        return (
                                            <div key={s.id} className={`flex items-center justify-between p-3 rounded-2xl transition-all border ${status ? 'bg-red-50 border-red-100' : 'bg-white border-gray-50 hover:border-blue-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${status ? 'bg-red-200 text-red-700' : 'bg-blue-100 text-blue-600'}`}>
                                                        {s.name.substring(0,1)}
                                                    </div>
                                                    <span className={`font-bold text-sm ${status ? 'text-red-800' : 'text-gray-700'}`}>{s.name}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {['S', 'I', 'A'].map((type) => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => toggleAttendance(s.id, type)}
                                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${status === type ? 'bg-red-500 text-white shadow-md scale-110' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                        >
                                                            {type}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
             )}

             {step === 2 && (
                 <div className="animate-fade-in-up space-y-4">
                    {pembelajaran.map((pem, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group">
                            <button type="button" onClick={() => setPembelajaran(p => p.filter((_,i) => i !== idx))} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                            
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Mata Pelajaran</label>
                                <select 
                                    className="w-full p-3 bg-gray-50 border-0 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={pem.mapel}
                                    onChange={(e) => updatePembelajaran(idx, 'mapel', e.target.value)}
                                >
                                    <option value="">-- Pilih Mapel --</option>
                                    {availableSubjects.length > 0 ? (
                                        availableSubjects.map(s => <option key={s} value={s}>{s}</option>)
                                    ) : (
                                        // Fallback standard subjects
                                        ['Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'PPKn', 'PAI', 'PJOK', 'Seni Budaya', 'Bahasa Inggris', 'Bahasa Daerah'].map(s => <option key={s} value={s}>{s}</option>)
                                    )}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Jam Ke-</label>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(jam => (
                                        <button
                                            key={jam} 
                                            type="button"
                                            onClick={() => {
                                                const val = jam.toString();
                                                const newJam = pem.jam.includes(val) ? pem.jam.filter(j => j !== val) : [...pem.jam, val];
                                                updatePembelajaran(idx, 'jam', newJam);
                                            }}
                                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${pem.jam.includes(jam.toString()) ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                            {jam}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Materi / Tema</label>
                                <textarea 
                                    className="w-full p-3 bg-gray-50 border-0 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={2}
                                    placeholder="Contoh: Operasi hitung pecahan..."
                                    value={pem.materi}
                                    onChange={(e) => updatePembelajaran(idx, 'materi', e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => setPembelajaran([...pembelajaran, { mapel: '', jam: [], materi: '' }])} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                        <Plus className="w-5 h-5" /> Tambah Mata Pelajaran
                    </button>
                 </div>
             )}

             {step === 3 && (
                 <div className="animate-fade-in-up space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-orange-500"/> Catatan Kejadian
                        </h3>
                        <div className="space-y-3">
                            {['Siswa ramai saat diterangkan', 'Siswa berkelahi', 'Siswa tidur di kelas', 'Tidak mengerjakan PR'].map((note) => (
                                <label key={note} className={`flex items-center p-4 rounded-2xl cursor-pointer transition-all border ${disciplineNotes.includes(note) ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-orange-500 rounded-md"
                                        checked={disciplineNotes.includes(note)}
                                        onChange={() => setDisciplineNotes(p => p.includes(note) ? p.filter(n => n !== note) : [...p, note])}
                                    />
                                    <span className={`ml-3 font-medium ${disciplineNotes.includes(note) ? 'text-orange-800' : 'text-gray-600'}`}>{note}</span>
                                </label>
                            ))}
                        </div>
                        <textarea 
                            className="w-full mt-4 p-4 bg-gray-50 border-0 rounded-2xl text-gray-700 outline-none focus:ring-2 focus:ring-orange-500"
                            rows={3}
                            placeholder="Tulis kejadian lain (opsional)..."
                            value={otherNote}
                            onChange={(e) => setOtherNote(e.target.value)}
                        />
                    </div>
                 </div>
             )}

             {step === 4 && (
                 <div className="animate-fade-in-up space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg text-gray-800 mb-6 text-center">Ringkasan Jurnal</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="p-4 bg-blue-50 rounded-2xl text-center">
                                 <div className="text-xs font-bold text-blue-400 uppercase">Kelas</div>
                                 <div className="font-black text-xl text-blue-800">{selectedClass}</div>
                             </div>
                             <div className="p-4 bg-green-50 rounded-2xl text-center">
                                 <div className="text-xs font-bold text-green-400 uppercase">Hadir</div>
                                 <div className="font-black text-xl text-green-800">{totalPresent} / {totalStudents}</div>
                             </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-gray-400 text-xs uppercase mb-2">Agenda Pembelajaran</h4>
                                {pembelajaran.map((p, i) => (
                                    <div key={i} className="flex gap-3 mb-2 items-start">
                                        <div className="w-1.5 h-10 bg-blue-500 rounded-full shrink-0 mt-1"></div>
                                        <div>
                                            <div className="font-bold text-gray-800">{p.mapel} <span className="text-gray-400 text-xs">(Jam {p.jam.join(',')})</span></div>
                                            <div className="text-sm text-gray-600 leading-tight">{p.materi}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                             <h4 className="font-bold text-gray-800 mb-3">Status Kebersihan</h4>
                             <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setKebersihan('mengarahkan_piket')} className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${kebersihan === 'mengarahkan_piket' ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-100 text-gray-400'}`}>
                                    Siswa Dipandu Piket
                                </button>
                                <button type="button" onClick={() => setKebersihan('sudah_bersih')} className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${kebersihan === 'sudah_bersih' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'}`}>
                                    Kelas Sudah Bersih
                                </button>
                             </div>
                        </div>
                    </div>
                 </div>
             )}

             <div className="flex gap-3 pt-4">
                 {step > 1 && (
                    <button type="button" onClick={handleBack} className="px-6 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                        Kembali
                    </button>
                 )}
                 <button type="button" onClick={step < 4 ? handleNext : handleSubmit} disabled={loading} className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-transform active:scale-95 flex items-center justify-center gap-2">
                     {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (step < 4 ? <>Lanjut <ArrowRight className="w-5 h-5"/></> : <>Kirim Laporan <Send className="w-5 h-5"/></>)}
                 </button>
             </div>
          </form>
      </main>
    </div>
  );
};

export default JournalForm;