export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Colors updated to match: #5865F2 (Blue), #57F287 (Green), #FEE75C (Yellow), #EB459E (Pink), #ED4245 (Red)
export const MENU_ITEMS = [
  { id: 'jurnal', label: 'Isi Jurnal', icon: 'FilePenLine', color: 'text-[#5865F2]' }, // Brand Blue
  { id: 'laporan', label: 'Cetak', icon: 'Printer', color: 'text-[#EB459E]' }, // Brand Pink
  { id: 'rekap_absensi', label: 'Kehadiran', icon: 'UserCheck', color: 'text-[#57F287]' }, // Brand Green
  { id: 'keterlaksanaan_kbm', label: 'Keterlaksanaan', icon: 'ClipboardCheck', color: 'text-[#FEE75C]' }, // Brand Yellow
  { id: 'kedisiplinan', label: 'Kedisiplinan', icon: 'ShieldAlert', color: 'text-[#ED4245]' }, // Brand Red
  { id: 'presensi_qr', label: 'Scan QR', icon: 'QrCode', color: 'text-[#5865F2]' }, // Brand Blue
];

export const MOCK_STUDENTS_FALLBACK = [
  { id: 1, nisn: '1001', name: 'Ahmad Dahlan', class_name: 'Kelas 1' },
  { id: 2, nisn: '1002', name: 'Budi Santoso', class_name: 'Kelas 1' },
  { id: 3, nisn: '1003', name: 'Citra Kirana', class_name: 'Kelas 2' },
  { id: 4, nisn: '1004', name: 'Dewi Sartika', class_name: 'Kelas 6' },
];