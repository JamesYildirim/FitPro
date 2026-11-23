// Supabase bağlantı bilgileri: Supabase panelinde Project Settings > API (Data API) sayfasından alınır.
// "anon public" anahtarı tarayıcıda kullanılmak için tasarlanmıştır; veriye erişimi veritabanındaki
// satır güvenliği (RLS) kuralları sınırlar. "service_role" anahtarını ASLA buraya yazma.
export const SUPABASE_URL = "https://jtbsgdvthamexevgtpaz.supabase.co";      // örnek: "https://abcdefghijkl.supabase.co"
export const SUPABASE_ANON_KEY = "sb_publishable_iucxmBgDccQVQEFxqQlQnw_3Ak0odKo"; // "anon public" ya da "publishable" anahtar

export const cloudConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
