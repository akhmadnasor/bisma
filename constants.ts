export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const STANDARD_SUBJECTS = [
    'Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'PPKn', 
    'PAI', 'PJOK', 'Seni Budaya', 'Bahasa Inggris', 'Tematik', 'Bahasa Daerah'
];

// Colors updated to match: #5865F2 (Blue), #57F287 (Green), #FEE75C (Yellow), #EB459E (Pink), #ED4245 (Red)
export const MENU_ITEMS = [
  { id: 'jurnal', label: 'Isi Jurnal', icon: 'FilePenLine', color: 'text-[#5865F2]' }, // Brand Blue
  { id: 'laporan', label: 'Cetak', icon: 'Printer', color: 'text-[#EB459E]' }, // Brand Pink
  { id: 'rekap_absensi', label: 'Kehadiran', icon: 'UserCheck', color: 'text-[#57F287]' }, // Brand Green
  { id: 'keterlaksanaan_kbm', label: 'Keterlaksanaan', icon: 'ClipboardCheck', color: 'text-[#FEE75C]' }, // Brand Yellow
  { id: 'kedisiplinan', label: 'Kedisiplinan', icon: 'ShieldAlert', color: 'text-[#ED4245]' }, // Brand Red
  { id: 'presensi_qr', label: 'Scan QR', icon: 'QrCode', color: 'text-[#5865F2]' }, // Brand Blue
];

export const MOCK_STUDENTS_FALLBACK: any[] = [];