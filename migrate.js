const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws'); // استدعاء مكتبة الـ WebSocket يدويًا لتوافقية Node 20
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://rpzrafhjjpqmukbutaaj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwenJhZmhqanBxbXVrYnV0YWFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODUzNjcwOSwiZXhwIjoyMTA0MTEyNzA5fQ.C1zcpOgxIJSUh7al8xszi5-LWT1nTAHS0wBbCo9hRTw';

// تمرير الـ WebSocket ضمن خيارات الاتصال لحل المشكلة فوراً
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

async function migrateData() {
  console.log('[*] جاري قراءة ملف الأرشيف...');
  const filePath = path.join(__dirname, 'sabbah_full_archive.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const items = JSON.parse(rawData);

  console.log(`[+] تم العثور على ${items.length} عملاً. جاري الحقن...`);

  for (const item of items) {
    // توليد slug فريد من عنوان المسلسل
    const generatedSlug = (item.title || 'series')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7);

    // جلب رابط الصورة من مختلف الاحتمالات الممكنة في الأرشيف
    const posterUrl = item.image || item.poster || item.cover || item.img || '';

    const { error } = await supabase
      .from('series')
      .insert([
        {
          slug: generatedSlug,
          title: { ar: item.title, en: item.title },
          synopsis: { ar: item.subtitle || '', en: '' },
          poster_url: posterUrl,
          is_featured_slider: false
        }
      ]);

    if (error) {
      console.error(`[-] خطأ في إدخال العمل ${item.title}:`, error.message);
    } else {
      console.log(`[✓] تم إدخال: ${item.title} (مع الصورة)`);
    }
  }
  console.log('[!!!] اكتملت عملية الحقن بنجاح!');
}

migrateData().catch(err => console.error("Fatal Error:", err));