import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, XCircle, Send, Check, ShieldAlert, ListChecks } from 'lucide-react';
import { supabase } from '../services/supabase';
import { MOCK_STUDENTS_FALLBACK } from '../constants';
import { Student } from '../types';

interface JournalFormProps {
  user: any;
  onBack: () => void;
}

const JournalForm: React.FC<JournalFormProps> = ({ user, onBack }) => {
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  
  const [pembelajaran, setPembelajaran] = useState([{ mapel: '', jam: [] as string[], materi: '' }]);
  
  // Step 3 Discipline States
  const [disciplineNotes, setDisciplineNotes] = useState<string[]>([]);
  const [otherNote, setOtherNote] = useState('');

  const [kebersihan, setKebersihan] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedClass) {
        // Fetch students from Supabase or fallback
        const fetchStudents = async () => {
            const { data } = await supabase.from('students').select('*').eq('class_name', selectedClass);
            if (data && data.length > 0) {
                setStudents(data);
            } else {
                setStudents(MOCK_STUDENTS_FALLBACK); // Fallback for demo
            }
        };
        fetchStudents();
    }
  }, [selectedClass]);

  const handleNext = () => {
      if (step === 1 && !selectedClass) return alert('Pilih kelas terlebih dahulu');
      if (step === 2 && pembelajaran.some(p => !p.mapel || !p.materi)) return alert('Lengkapi data pembelajaran');
      setStep(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
      setStep(prev => Math.max(prev - 1, 1));
  };

  const toggleDiscipline = (note: string) => {
      setDisciplineNotes(prev => 
          prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]
      );
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!kebersihan) return alert('Pilih status kebersihan');
      
      setLoading(true);
      try {
          // Combine notes
          const finalNotes = [...disciplineNotes];
          if (otherNote) finalNotes.push(otherNote);

          // Insert Journal
          const { data: journal, error } = await supabase.from('journals').insert({
              teacher_id: user.id,
              class_name: selectedClass,
              material: JSON.stringify(pembelajaran),
              cleanliness_status: kebersihan,
              validation_status: 'Verified', // Auto verified by resume check
              notes: finalNotes.join(', ')
          }).select().single();

          if (error) throw error;

          // Insert Attendance
          if (journal) {
              const attendanceEntries = Object.entries(attendance).map(([studentId, status]) => ({
                  journal_id: journal.id,
                  student_name: students.find(s => s.id.toString() === studentId)?.name,
                  status: status
              }));
              
              if (attendanceEntries.length > 0) {
                 await supabase.from('attendance_logs').insert(attendanceEntries);
              }
          }

          alert('Jurnal berhasil disimpan!');
          onBack();
      } catch (err: any) {
          console.error(err);
          // Allow demo to proceed even if Supabase write fails
          alert(`Simulasi: Jurnal Tersimpan (Database Error: ${err.message})`);
          onBack();
      } finally {
          setLoading(false);
      }
  };

  const updatePembelajaran = (index: number, field: string, value: any) => {
      const newPem = [...pembelajaran];
      (newPem[index] as any)[field] = value;
      setPembelajaran(newPem);
  };

  const addPembelajaran = () => setPembelajaran([...pembelajaran, { mapel: '', jam: [], materi: '' }]);
  const removePembelajaran = (idx: number) => setPembelajaran(pembelajaran.filter((_, i) => i !== idx));

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F2F3F5]">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#5865F2] to-[#EB459E] px-4 pb-4 pt-10 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/20 text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Isi Jurnal KBM</h2>
            <p className="text-sm text-white/80 font-normal">{new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 mt-4">
        <div className="max-w-5xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-6 flex items-center justify-between px-2">
             {[1, 2, 3, 4].map(i => (
                 <React.Fragment key={i}>
                    <div className={`flex items-center ${step >= i ? 'text-[#5865F2]' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= i ? 'bg-[#5865F2] text-white border-[#5865F2]' : 'bg-gray-200 border-gray-300'}`}>
                            {step > i ? <Check className="w-5 h-5"/> : i}
                        </div>
                    </div>
                    {i < 4 && <div className={`flex-1 h-1 mx-2 rounded ${step > i ? 'bg-[#5865F2]' : 'bg-gray-200'}`}></div>}
                 </React.Fragment>
             ))}
          </div>

          <form onSubmit={handleSubmit} className="glassmorphism rounded-2xl p-6 shadow-md bg-white">
             {step === 1 && (
                 <div className="animate-fade-in">
                    <h3 className="font-bold text-lg border-b pb-3 mb-4 text-[#23272A]">1. Pilih Kelas & Isi Kehadiran</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700">Pilih Kelas</label>
                        <select 
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#5865F2] outline-none"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">-- Pilih Kelas --</option>
                            <option value="Kelas 1">Kelas 1</option>
                            <option value="Kelas 2">Kelas 2</option>
                            <option value="Kelas 3">Kelas 3</option>
                            <option value="Kelas 4">Kelas 4</option>
                            <option value="Kelas 5">Kelas 5</option>
                            <option value="Kelas 6">Kelas 6</option>
                        </select>
                    </div>
                    
                    {selectedClass && (
                        <div className="mt-6 overflow-x-auto max-h-[50vh]">
                            <table className="w-full text-sm">
                                <thead className="bg-[#F2F3F5] sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left text-gray-700">Nama</th>
                                        <th className="p-2 w-12 text-center text-gray-700">S</th>
                                        <th className="p-2 w-12 text-center text-gray-700">I</th>
                                        <th className="p-2 w-12 text-center text-gray-700">A</th>
                                        <th className="p-2 w-12 text-center text-gray-700">D</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {students.map((s, idx) => (
                                        <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="p-2 text-gray-800">{s.name}</td>
                                            {['S', 'I', 'A', 'D'].map(type => (
                                                <td key={type} className="p-2 text-center">
                                                    <input 
                                                        type="radio" 
                                                        name={`att-${s.id}`} 
                                                        className="w-4 h-4 accent-[#5865F2]" 
                                                        onChange={() => setAttendance({...attendance, [s.id]: type})}
                                                        checked={attendance[s.id] === type}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                 </div>
             )}

             {step === 2 && (
                 <div className="animate-fade-in space-y-6">
                    <h3 className="font-bold text-lg border-b pb-3 mb-4 text-[#23272A]">2. Detail Pembelajaran</h3>
                    {pembelajaran.map((pem, idx) => (
                        <div key={idx} className="border border-gray-200 p-4 rounded-xl relative bg-gray-50">
                            <button type="button" onClick={() => removePembelajaran(idx)} className="absolute top-2 right-2 text-[#ED4245] hover:text-red-700">
                                <XCircle className="w-6 h-6" />
                            </button>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Mata Pelajaran</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5865F2] outline-none"
                                    value={pem.mapel}
                                    onChange={(e) => updatePembelajaran(idx, 'mapel', e.target.value)}
                                >
                                    <option value="">-- Pilih --</option>
                                    <option value="Matematika">Matematika</option>
                                    <option value="IPA">IPA</option>
                                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                                    <option value="PPKn">PPKn</option>
                                    <option value="Tematik">Tematik</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Jam Ke- (Centang)</label>
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(jam => (
                                        <label key={jam} className={`p-2 border rounded cursor-pointer transition-colors ${pem.jam.includes(jam.toString()) ? 'bg-[#5865F2]/10 border-[#5865F2]' : 'bg-white border-gray-300'}`}>
                                            <input 
                                                type="checkbox" 
                                                className="hidden" 
                                                value={jam}
                                                checked={pem.jam.includes(jam.toString())}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const newJam = e.target.checked 
                                                        ? [...pem.jam, val] 
                                                        : pem.jam.filter(j => j !== val);
                                                    updatePembelajaran(idx, 'jam', newJam);
                                                }}
                                            />
                                            <span className={`text-sm font-bold ${pem.jam.includes(jam.toString()) ? 'text-[#5865F2]' : 'text-gray-700'}`}>{jam}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Materi</label>
                                <textarea 
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5865F2] outline-none" 
                                    rows={2}
                                    value={pem.materi}
                                    onChange={(e) => updatePembelajaran(idx, 'materi', e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addPembelajaran} className="flex items-center gap-2 text-[#EB459E] font-bold hover:text-[#5865F2]">
                        <Plus className="w-5 h-5" /> Tambah Mapel
                    </button>
                 </div>
             )}

             {step === 3 && (
                 <div className="animate-fade-in space-y-6">
                    <h3 className="font-bold text-lg border-b pb-3 mb-4 text-[#23272A] flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-500"/> 3. Catatan Kedisiplinan
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Centang jika ada kejadian khusus di kelas hari ini.</p>
                    
                    <div className="space-y-3">
                        {['Berbicara saat diterangkan', 'Mengganggu teman', 'Tidur di kelas'].sort().map((note, idx) => (
                            <label key={idx} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${disciplineNotes.includes(note) ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200 hover:border-red-200'}`}>
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 accent-red-600 rounded"
                                    checked={disciplineNotes.includes(note)}
                                    onChange={() => toggleDiscipline(note)}
                                />
                                <span className={`ml-3 font-medium ${disciplineNotes.includes(note) ? 'text-red-700' : 'text-gray-700'}`}>{note}</span>
                            </label>
                        ))}
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Catatan Lainnya (Opsional)</label>
                        <textarea 
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                            rows={3}
                            placeholder="Tulis kejadian lain..."
                            value={otherNote}
                            onChange={(e) => setOtherNote(e.target.value)}
                        />
                    </div>
                 </div>
             )}

             {step === 4 && (
                 <div className="animate-fade-in space-y-6">
                    <h3 className="font-bold text-lg border-b pb-3 mb-4 text-[#23272A] flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-green-600"/> 4. Validasi & Resume
                    </h3>
                    
                    {/* Resume Card */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs font-bold text-gray-400 uppercase">Kelas</label>
                                 <div className="font-bold text-gray-800">{selectedClass}</div>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-gray-400 uppercase">Total Siswa Hadir</label>
                                 <div className="font-bold text-gray-800">{Object.values(attendance).filter(v => v === 'S' || v === 'I' || v === 'A' || v === 'D').length > 0 ? 'Terisi' : 'Belum diisi'}</div>
                             </div>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Materi Ajar</label>
                            {pembelajaran.map((p, i) => (
                                <div key={i} className="text-sm border-l-4 border-[#5865F2] pl-3 py-1 mb-2 bg-white rounded-r">
                                    <span className="font-bold text-[#5865F2]">{p.mapel}</span> (Jam {p.jam.join(',')}) : {p.materi}
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Catatan Disiplin</label>
                            {disciplineNotes.length > 0 || otherNote ? (
                                <ul className="list-disc list-inside text-sm text-red-600">
                                    {disciplineNotes.map(n => <li key={n}>{n}</li>)}
                                    {otherNote && <li>Lainnya: {otherNote}</li>}
                                </ul>
                            ) : (
                                <span className="text-sm text-green-600 italic">Tidak ada catatan (Kelas Kondusif)</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Status Kebersihan Kelas</label>
                        <div className="space-y-2">
                            <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${kebersihan === 'mengarahkan_piket' ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-gray-200'}`}>
                                <input type="radio" name="keb" value="mengarahkan_piket" onChange={(e)=>setKebersihan(e.target.value)} className="w-4 h-4 accent-[#5865F2]"/>
                                <span className="ml-3 text-gray-700">Guru Mengarahkan Piket</span>
                            </label>
                            <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${kebersihan === 'sudah_bersih' ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200'}`}>
                                <input type="radio" name="keb" value="sudah_bersih" onChange={(e)=>setKebersihan(e.target.value)} className="w-4 h-4 accent-[#5865F2]"/>
                                <span className="ml-3 text-gray-700">Kelas Sudah Bersih</span>
                            </label>
                        </div>
                    </div>
                 </div>
             )}

             <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                 {step > 1 ? (
                    <button type="button" onClick={handleBack} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-gray-600">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </button>
                 ) : <div></div>}
                 
                 {step < 4 ? (
                    <button type="button" onClick={handleNext} className="px-6 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] flex items-center font-bold shadow-md transition-all">
                        Selanjutnya <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                 ) : (
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] flex items-center font-bold shadow-md transition-all">
                        {loading ? 'Mengirim...' : 'Konfirmasi & Kirim'} <Send className="w-4 h-4 ml-2" />
                    </button>
                 )}
             </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default JournalForm;