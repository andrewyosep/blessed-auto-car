export type Car = {
  id: string; brand: string; name: string; year: number; price: number;
  mileage: number; transmission: string; fuel: string; color: string;
  status: "Tersedia" | "Dipesan" | "Terjual"; location: string;
  description: string; photos: string[]; highlights: string[]; bodyType?: string; demo?: boolean;
};
export type Slide = { title: string; description: string; image: string };
export type Settings = { name: string; tagline: string; whatsapp: string; address: string; logo: string; slides: Slide[] };
export const photo = (id: string, width = 1000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
export const defaultSettings: Settings = {
  name: "Blessed Auto Car", tagline: "Mobil bekas, pilihan yang lebih personal.", whatsapp: "", address: "", logo: "",
  slides: [
    { title: "Mobil pilihan.\nPerjalanan baru.", description: "Dari mobil harian sampai kendaraan keluarga. Cari yang sesuai anggaran, kenali detailnya, lalu lihat langsung di showroom.", image: photo("photo-1503376780353-7e6692767b70", 1600) },
    { title: "Lebih lega.\nLebih banyak cerita.", description: "Pilih MPV atau SUV untuk menemani rutinitas dan rencana perjalanan keluarga.", image: photo("photo-1519641471654-76ce0107ad1b", 1600) },
    { title: "Cari detailnya.\nTemukan cocoknya.", description: "Saring menurut harga, tahun, dan kilometer. Simpan pilihanmu, lalu tanyakan kondisi unit kepada kami.", image: photo("photo-1492144534655-ae79c964c9d7", 1600) },
  ],
};
const base = { transmission: "Otomatis", fuel: "Bensin", color: "Putih", location: "Lokasi menyusul", description: "Unit contoh untuk melihat tampilan katalog. Spesifikasi, harga, dan foto hanya ilustrasi, bukan penawaran mobil yang dijual.", demo: true };
export const demoCars: Car[] = [
  { ...base, id: "demo-1", bodyType: "MPV", location: "Tangerang", brand: "Toyota", name: "Innova Zenix 2.0 V", year: 2023, price: 385000000, mileage: 24000, status: "Tersedia", highlights: ["Pilihan keluarga"], photos: [photo("photo-1519641471654-76ce0107ad1b")] },
  { ...base, id: "demo-2", bodyType: "SUV", location: "Jakarta", brand: "Honda", name: "HR-V 1.5 SE", year: 2022, price: 298000000, mileage: 32000, status: "Tersedia", highlights: ["Kilometer rendah"], photos: [photo("photo-1533473359331-0135ef1b58bf")] },
  { ...base, id: "demo-3", bodyType: "Sedan", location: "Tangerang", brand: "BMW", name: "320i Sport", year: 2021, price: 525000000, mileage: 28000, color: "Biru", status: "Dipesan", highlights: ["Sedan"], photos: [photo("photo-1555215695-3004980ad54e")] },
  { ...base, id: "demo-4", bodyType: "Sedan", location: "Jakarta", brand: "Mercedes-Benz", name: "C 200 Avantgarde", year: 2020, price: 495000000, mileage: 41000, color: "Hitam", status: "Tersedia", highlights: ["Sedan"], photos: [photo("photo-1618843479313-40f8afb4b4d8")] },
  { ...base, id: "demo-5", bodyType: "SUV", location: "Bekasi", brand: "Toyota", name: "Fortuner 2.4 VRZ", year: 2022, price: 465000000, mileage: 37000, fuel: "Diesel", status: "Terjual", highlights: ["SUV"], photos: [photo("photo-1519641471654-76ce0107ad1b")] },
  { ...base, id: "demo-6", bodyType: "Sedan", location: "Tangerang", brand: "Honda", name: "Civic 1.5 Turbo", year: 2021, price: 375000000, mileage: 29000, color: "Abu-abu", status: "Tersedia", highlights: ["Sedan"], photos: [photo("photo-1492144534655-ae79c964c9d7")] },
  { ...base, id: "demo-7", brand: "Toyota", name: "Avanza 1.5 G", bodyType: "MPV", location: "Tangerang", year: 2020, price: 178000000, mileage: 56000, transmission: "Manual", status: "Tersedia", highlights: ["MPV"], photos: [photo("photo-1503376780353-7e6692767b70")] },
  { ...base, id: "demo-8", brand: "Honda", name: "Brio Satya E", bodyType: "Hatchback", location: "Bekasi", year: 2023, price: 163000000, mileage: 18000, transmission: "Manual", color: "Abu-abu", status: "Tersedia", highlights: ["Hatchback"], photos: [photo("photo-1533473359331-0135ef1b58bf")] },
  { ...base, id: "demo-9", brand: "Mitsubishi", name: "Xpander Ultimate", bodyType: "MPV", location: "Jakarta", year: 2022, price: 245000000, mileage: 41000, status: "Tersedia", highlights: ["MPV"], photos: [photo("photo-1519641471654-76ce0107ad1b")] },
];
export const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
export const number = (value: number) => new Intl.NumberFormat("id-ID").format(value);
export function whatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "62");
  return /^62\d{8,13}$/.test(digits) ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}
