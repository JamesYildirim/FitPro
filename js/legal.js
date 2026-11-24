// KVKK aydınlatma metni ve yurt dışına aktarım açık rızası.
// Metin değişirse LEGAL_VERSION'ı artır: kayıtlı kullanıcılardan bir sonraki açılışta yeniden onay istenir.
//
// DOLDURULMASI GEREKENLER (veri sorumlusu bilgileri — boş kalırsa metinde "belirtilmedi" görünür):
export const CONTROLLER = {
  name: "Ahmet YILDIRIM",          // uygulamanın sahibi (veri sorumlusu)
  email: "ahmt.yildrim@gmail.com", // KVKK başvuruları ve iletişim için e-posta adresi
};
export const SUPABASE_REGION = "Japonya, Tokyo"; // Supabase panelinde Project Settings → General → Region

export const LEGAL_VERSION = 1;
export const LEGAL_DATE = "2026-11-24";

// Yurt dışına veri aktarılan hizmetler (KVKK m.9)
export const RECIPIENTS = [
  {
    name: "Supabase Inc.", country: () => `${SUPABASE_REGION ? `Sunucular: ${SUPABASE_REGION}` : "Yurt dışı"}; şirket ABD merkezli`,
    what: "E-posta adresin, şifrenin özeti (şifrenin kendisi değil), uygulamaya girdiğin tüm veriler (profil, program, antrenman geçmişi, yemek ve kilo kayıtları, ayarlar), oturum açarken IP adresin",
    why: "Hesabını açmak ve verilerini telefon ve bilgisayar arasında eşitlemek; hesap onay ve şifre sıfırlama e-postalarını göndermek",
    when: "Her zaman (hesap açtığında ve her eşitlemede)",
    url: "https://supabase.com/privacy",
  },
  {
    name: "GitHub Inc. (GitHub Pages)", country: () => "ABD",
    what: "Uygulamayı açtığında IP adresin ve tarayıcı bilgisi (sunucu kayıtları)",
    why: "Uygulama dosyalarını tarayıcına ulaştırmak (barındırma)",
    when: "Uygulamayı her açtığında",
    url: "https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement",
  },
  {
    name: "Anthropic PBC", country: () => "ABD",
    what: "Seçtiğin yemek fotoğrafı ve yazdığın not",
    why: "Fotoğraftan kalori ve makro tahmini",
    when: "Yalnızca kendi API anahtarını girip “Kaloriyi tahmin et”e bastığında; ilk kullanımda ayrıca açık rızan istenir",
    url: "https://www.anthropic.com/legal/privacy",
  },
];

const missing = `<span class="legal-missing">belirtilmedi</span>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Aydınlatma metni (HTML)
export function privacyHtml() {
  const who = CONTROLLER.name ? esc(CONTROLLER.name) : missing;
  const mail = CONTROLLER.email ? `<a href="mailto:${esc(CONTROLLER.email)}">${esc(CONTROLLER.email)}</a>` : missing;
  return `
  <p class="tiny muted">Sürüm ${LEGAL_VERSION} · ${LEGAL_DATE}</p>
  <h3>1. Veri sorumlusu</h3>
  <p>FitPro, ${who} tarafından kişisel kullanım amacıyla geliştirilen ücretsiz bir uygulamadır. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu: ${who}. İletişim: ${mail}.</p>

  <h3>2. Hangi verileri işliyoruz</h3>
  <ul>
    <li><b>Hesap bilgileri:</b> e-posta adresin ve şifren (şifren yalnızca özetlenmiş haliyle saklanır).</li>
    <li><b>Profil bilgileri:</b> cinsiyet, yaş, boy, mevcut ve hedef kilo.</li>
    <li><b>Uygulama kullanımıyla oluşan veriler:</b> antrenman programın ve geçmişin (hareket, set, kilo, tekrar), yemek kayıtların (yiyecek adı, kalori, makrolar), günlük kilo ölçümlerin, uygulama ayarların.</li>
    <li><b>Yemek fotoğrafları:</b> yalnızca fotoğraftan kalori tahmini özelliğini kullanırsan; fotoğraf uygulamada ve hesabında <b>saklanmaz</b>, yalnızca tahmin için gönderilir.</li>
    <li><b>Teknik veriler:</b> uygulamayı açtığında ve oturum açtığında IP adresin ve tarayıcı bilgisi, hizmet sağlayıcıların sunucu kayıtlarında.</li>
  </ul>
  <p>Uygulama reklam, analitik, takip ya da çerez aracı kullanmaz. Konum, rehber ya da cihaz kimliği toplamaz.</p>

  <h3>3. Hangi amaçlarla</h3>
  <ul>
    <li>Hesabını oluşturmak ve oturum açmanı sağlamak,</li>
    <li>profiline ve hedefine göre antrenman programı ile kalori ve makro hedefi hesaplamak,</li>
    <li>antrenman, beslenme ve kilo kayıtlarını tutmak ve ilerlemeni göstermek,</li>
    <li>verilerini cihazların arasında eşitlemek,</li>
    <li>istediğinde yemek fotoğrafından kalori tahmini yapmak.</li>
  </ul>

  <h3>4. Hukuki sebepler</h3>
  <p>Hesap ve uygulama verilerin, uygulamayı kullanman için gerekli olduğundan KVKK m.5/2-c (bir sözleşmenin kurulması ve ifası) kapsamında işlenir. Verilerin yurt dışına aktarılması KVKK m.9 kapsamında <b>açık rızana</b> dayanır (aşağıda). Fotoğraftan kalori tahmini için fotoğrafın gönderilmesi, bu özelliği ilk kullandığında ayrıca verdiğin açık rızaya dayanır.</p>

  <h3>5. Yurt dışına aktarım ve kimlerle paylaşılıyor</h3>
  <p>Uygulama kendi sunucusu olmadan, yurt dışındaki hizmet sağlayıcılar üzerinden çalışır. Verilerin aşağıdaki şirketlere ve ülkelere aktarılır. Bu aktarım bir yeterlilik kararına ya da standart sözleşmeye değil, KVKK m.9 kapsamında <b>açık rızana</b> dayanır. Bu ülkelerde Türkiye'deki koruma düzeyi garanti edilemez.</p>
  <div class="legal-table">${RECIPIENTS.map((r) => `
    <div class="legal-rec"><b>${esc(r.name)}</b> <span class="tiny muted">${esc(r.country())}</span>
      <div class="small"><b>Ne:</b> ${esc(r.what)}</div>
      <div class="small"><b>Neden:</b> ${esc(r.why)}</div>
      <div class="small"><b>Ne zaman:</b> ${esc(r.when)}</div>
      <a class="tiny" href="${r.url}" target="_blank" rel="noopener">Gizlilik politikası</a></div>`).join("")}</div>
  <p>Verilerin bunların dışında hiç kimseyle paylaşılmaz, satılmaz ve reklam için kullanılmaz.</p>

  <h3>6. Ne kadar süre saklanıyor</h3>
  <ul>
    <li>Hesap ve uygulama verilerin hesabın açık olduğu sürece saklanır.</li>
    <li>Profil → Hesap → “Hesabımı kalıcı olarak sil” ile hesabını, e-posta adresini ve buluttaki tüm verilerini istediğin an kendin silebilirsin; silme hemen gerçekleşir ve geri alınamaz. Hizmet sağlayıcının (Supabase) kendi yedeklerinde veriler, onun politikasındaki süre boyunca kalabilir.</li>
    <li>Profil → “Tüm verileri sil” yalnızca uygulama verilerini boşaltır; hesabın açık kalır.</li>
    <li>“Çıkış yap” bu cihazdaki kopyayı ve kaydettiysen API anahtarını cihazdan siler; hesabındaki veriler kalır.</li>
    <li>Yemek fotoğrafları uygulamada saklanmaz. Anthropic'in gönderilen veriyi ne kadar sakladığı Anthropic'in kendi politikasına tabidir.</li>
    <li>Sunucu kayıtlarının (IP adresi) saklama süresi Supabase ve GitHub'ın politikalarına tabidir.</li>
  </ul>

  <h3>7. Hakların (KVKK m.11)</h3>
  <p>Kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi isteme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç çıkmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramışsan zararın giderilmesini talep etme haklarına sahipsin.</p>
  <p>Açık rızanı istediğin zaman geri alabilirsin; uygulama yurt dışındaki sunucular olmadan çalışamadığı için bu, hesabının silinmesi anlamına gelir (Profil → Hesap → “Hesabımı kalıcı olarak sil”). Başvurularını ${mail} adresine iletebilirsin; en geç 30 gün içinde ücretsiz yanıtlanır.</p>`;
}

// Yurt dışına aktarım açık rıza metni (kayıt ekranında ve tek seferlik onay ekranında)
export const TRANSFER_CONSENT =
  `Hesabımın ve uygulamaya girdiğim verilerin, aydınlatma metninde belirtilen amaçlarla Supabase (${SUPABASE_REGION || "yurt dışı"}) ve GitHub (ABD) sunucularına aktarılmasına açık rızam ile izin veriyorum.`;
