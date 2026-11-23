// Eşitleme kararı (saf fonksiyon, testlerde kullanılır).
// meta:  cihazdaki eşitleme bilgisi { userId, dirty, syncedAt }
//        userId   → bu cihazdaki verinin ait olduğu hesap (null: hesap öncesi yerel veri)
//        dirty    → son eşitlemeden sonra cihazda değişiklik var
//        syncedAt → cihazın en son gördüğü bulut sürümü (sunucu updated_at)
// cloud: buluttaki satır { updated_at } ya da hiç yoksa null
// Döner: "push" (cihazdakini gönder) | "pull" (buluttakini al) | "reset" (cihazı boşalt) | "ask" (kullanıcıya sor) | "none"
export function decide({ meta, userId, localHasData, cloud }) {
  if (meta.userId !== userId) {
    if (meta.userId) return cloud ? "pull" : "reset"; // başka hesabın verisi bu cihazda kalmış
    if (!localHasData) return cloud ? "pull" : "none"; // boş cihaz
    return cloud ? "ask" : "push";                     // hesap öncesi yerel veri: bulut boşsa taşı, doluysa sor
  }
  if (!cloud) return localHasData || meta.dirty ? "push" : "none";
  const remoteChanged = cloud.updated_at !== meta.syncedAt;
  if (!remoteChanged) return meta.dirty ? "push" : "none";
  return meta.dirty ? "ask" : "pull"; // başka cihazda değişmiş; burada da değişiklik varsa sor
}
