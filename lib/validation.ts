import { z } from "zod";
const imageUrl = z.string().max(2000).refine(value => /^\/api\/photos\/[a-f0-9-]+\.(jpg|png|webp)$/.test(value) || /^https:\/\//.test(value), "Foto tidak valid");
export const carSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/), brand: z.string().trim().min(1).max(80), name: z.string().trim().min(1).max(160),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1), price: z.number().int().min(1).max(100000000000),
  mileage: z.number().int().min(0).max(5000000), transmission: z.enum(["Otomatis", "Manual"]), fuel: z.enum(["Bensin", "Diesel", "Hybrid", "Listrik"]),
  color: z.string().trim().min(1).max(50), status: z.enum(["Tersedia", "Dipesan", "Terjual"]), location: z.string().trim().min(1).max(150),
  bodyType: z.enum(["MPV", "SUV", "Sedan", "Hatchback", "Crossover", "Coupe", "Pickup", "Van", "Lainnya"]).optional(),
  description: z.string().max(6000), photos: z.array(imageUrl).min(1).max(20), highlights: z.array(z.string().trim().min(1).max(80)).max(6),
});
export const settingsSchema = z.object({
  name: z.string().trim().min(1).max(100), tagline: z.string().trim().min(1).max(180), whatsapp: z.string().max(25).refine(s => !s || /^(\+62|62|0)\d{8,13}$/.test(s), "Nomor WhatsApp tidak valid"),
  address: z.string().max(400), logo: z.union([z.literal(""), imageUrl]),
  slides: z.array(z.object({title: z.string().trim().min(1).max(150), description: z.string().max(400), image: imageUrl})).min(1).max(5),
});
