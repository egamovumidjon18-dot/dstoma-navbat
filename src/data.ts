// DIQQAT: Bu faqat development uchun mock ma'lumotlar.
// Production da real database ishlatiladi.

import { Clinic, Doctor, Service, QueueItem, CodeSnippet, SaaSPayment } from './types';

export const INITIAL_CLINICS: Clinic[] = [];

export const INITIAL_SERVICES: Service[] = [];

export const INITIAL_DOCTORS: Doctor[] = [];

export const INITIAL_QUEUES: QueueItem[] = [];

export const DJANGO_SOLUTIONS: CodeSnippet[] = [
  {
    title: '1. Railway Migratsiya Xatoligini Tuzatish (No Such Table)',
    language: 'bash',
    description: 'sqlite3.OperationalError: no such table: dentistry_clinic xatoligini to\'g\'ri bartaraf etish. Bu xatolik odatda: 1) Eager queries (import-time so\'rovlar) urls.py, admin.py yoki forms.py da jadval yaratilmasdan oldin ishlaganda, yoki 2) Migratsiya fayllari git-ga yuklanmaganligi sababli yuzaga keladi.',
    filename: 'Railway Build & Fix Strategy',
    code: `# 1. INTEGRATSIYALASHGAN YANGI RAILWAY BUILD BUYRUG'I (Tavsiya etiladi):
# Ushbu buyruq avval makemigrations-ni yaratib, keyin bazaga qo'llaydi va staticlarni yig'adi:
python manage.py makemigrations dentistry_clinic && python manage.py migrate && python manage.py collectstatic --noinput

# 2. XATOLIKNING ENG ASOSIY SABABI (Eager Import Queries):
# Agar models.py dan ma'lumotlarni URLs yoki Admin fayllarida modul yuklanish paytida (import) so'rab qo'ysangiz, migrate buyrug'idan oldin server o'chadi.
# Masalan (NOTAVSIYA etiladi - Crash xavfi):
# choices = [(c.id, c.name) for c in Clinic.objects.all()] # <-- Bu import paytidayoq bazaga ulanadi!
#
# YECHIM: So'rovlarni har doim callable funksiyalarga yoki lazy load orqali bajarish kerak (ModelChoiceField yoki funksiya ichiga o'tkazish).

# 3. AGAR MIGRATSIYA ZIDDIYATLARI BO'LSA (Railway Console-da):
# Bazani o'chirib qayta qurish va migratsiyalarni to'g'irlash:
# python manage.py makemigrations --merge --noinput
# python manage.py migrate --run-syncdb

# 4. MUTAXASSIS TAVSIYASI:
# Mahalliy kompuyteringizda "git status" orqali "dentistry_clinic/migrations/" papkasini tekshiring. 
# Agar migratsiyalar .gitignore ichida bo'lsa, ularni o'chiring va "git add dentistry_clinic/migrations/*.py" bilan GitHub-ga yuklang.`
  },
  {
    title: '2. Multi-Tenant Subdomain Middleware',
    language: 'python',
    description: 'Bemor subdomain orqali kirganda (masalan samarqand.dstoma-navbat-lk2p.vercel.app), klinika aniqlanadi va "request.clinic" sifatida request-ga biriktiriladi. Bu barcha SQL so\'rovlarini shu klinika doirasida cheklash imkonini beradi.',
    filename: 'dstoma/middleware.py',
    code: `import django
from django.shortcuts import get_object_or_404
from dentistry_clinic.models import Clinic

class MultiClinicMiddleware:
    """
    Subdomain yoki session dagi ma'lumot asosida joriy klinikani aniqlaydigan Middleware
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host_parts = request.get_host().split('.')
        
        # Mahalliy va test portlarini hisobga olish (masalan samarqand.localhost:8000)
        # Agar subdomain bo'lsa (host_parts uzunligi 2 tadan ko'p bo'lsa va www bo'lmasa)
        if len(host_parts) > 2 and host_parts[0] != 'www':
            subdomain = host_parts[0]
            try:
                request.clinic = Clinic.objects.get(subdomain=subdomain, is_active=True)
            except Clinic.DoesNotExist:
                request.clinic = None
        else:
            # Agar asosiy domenda bo'lsa, session yoki default klinika tanlanishini tekshiramiz
            clinic_id = request.session.get('selected_clinic_id')
            if clinic_id:
                try:
                    request.clinic = Clinic.objects.get(id=clinic_id, is_active=True)
                except Clinic.DoesNotExist:
                    request.clinic = Clinic.objects.filter(is_active=True).first()
            else:
                # Birinchi joriy klinikani default qilib olamiz
                request.clinic = Clinic.objects.filter(is_active=True).first()

        # views dagi qulaylik uchun helper funksiyani biriktirish
        # Masalan view ichida: request.get_current_clinic() deb chaqirish mumkin
        def get_current_clinic():
            return request.clinic
        request.get_current_clinic = get_current_clinic

        response = self.get_response(request)
        return response`
  },
  {
    title: '3. Multi-Tenant filterlarni views.py da qo\'llash',
    language: 'python',
    description: 'Multi-Tenant tizimida ForeignKey qo\'shilgandan so\'ng har bir so\'rovga filter qo\'yilishi shart. Quyidagi misolda shifokorlar va navbatlarni faqat joriy klinika doirasida olish ko\'rsatilgan.',
    filename: 'dentistry_clinic/views.py',
    code: `@login_required
def doctor_queue_view(request):
    # Har doim joriy klinikani middleware yordamida aniqlaymiz:
    clinic = request.get_current_clinic()
    if not clinic:
        return render(request, 'errors/no_clinic.html', status=404)
        
    # Faqat shu klinikadosh shifokorlar va navbatlar olinadi:
    active_queues = Queue.objects.filter(
        clinic=clinic, 
        is_completed=False,
        doctor__user=request.user
    ).order_by('number')
    
    return render(request, 'clinic/doctor_panel.html', {
        'clinic': clinic,
        'queues': active_queues
    })`
  },
  {
    title: '4. Google Maps xaritasida klinikalar (Template)',
    language: 'html',
    description: 'Samarqand shahridagi va boshqa barcha klinikalarni latitude & longitude boyicha Google Maps xaritasida marker korinishida chiqaradigan html and javascript kodi. Har bir markerni bosganda joriy klinika sahifasiga yo\'l ko\'rsatiladi.',
    filename: 'templates/clinics_map.html',
    code: `{% extends "base.html" %}
{% block content %}
<div class="container my-5">
    <h2 class="text-center mb-4 font-weight-bold text-primary">DStoma Klinikalar Xaritasi</h2>
    <p class="text-muted text-center leading-relaxed">O'zingizga eng yaqin stomatologiya klinikasini tanlang va onlayn navbat oling.</p>
    
    <!-- Google Map joylashadigan kontent -->
    <div id="clinics-map-container" style="width: 100%; height: 500px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);"></div>
</div>

<!-- Klinikalar ro'yxatini JavaScriptga xavfsiz uzatish (json_script filtri juda tavsiya etiladi) -->
{{ clinics_json|json_script:"clinics-data" }}

<script>
    function initMap() {
        // Samarqand shahri markazi default koordinatasi
        const defaults = { lat: 39.6542, lng: 66.9597 };
        
        // Elementdan klinika ma'lumotlarini yuklaymiz
        const dataElement = document.getElementById('clinics-data');
        const clinics = JSON.parse(dataElement.textContent || '[]');
        
        // Google xaritasini boshlang'ich nuqta bilan ochish
        const map = new google.maps.Map(document.getElementById("clinics-map-container"), {
            zoom: 11,
            center: clinics.length > 0 ? { lat: Number(clinics[0].latitude), lng: Number(clinics[0].longitude) } : defaults,
            mapId: "DSTOMA_CLINIC_DIRECTORY_MAP_ID", // Advanced markers uchun kerak
        });
        
        const infoWindow = new google.maps.InfoWindow();
        
        // Klinikalar ustidan aylanib, markerlar qo'yamiz
        clinics.forEach(clinic => {
            if (!clinic.latitude || !clinic.longitude) return;
            
            const position = { 
                lat: Number(clinic.latitude), 
                lng: Number(clinic.longitude) 
            };
            
            // AdvancedMarker instansiyasini hosil qilish
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: map,
                position: position,
                title: clinic.name
            });
            
            // Marker bosilganda info darcha ochilishi
            marker.addListener("gmp-click", () => {
                const contentStr = \`
                    <div style="padding: 8px; font-family: sans-serif;">
                        <h5 style="margin: 0 0 4px 0; color: #1a73e8; font-weight: bold;">\${clinic.name}</h5>
                        <p style="margin: 0 0 6px 0; font-size: 13px; color: #5f6368;">\${clinic.address}</p>
                        <p style="margin: 0 0 10px 0; font-size: 12px;">📞 <a href="tel:\${clinic.phone}">\${clinic.phone}</a></p>
                        <a href="https://\${clinic.subdomain}.dstoma-navbat-lk2p.vercel.app" 
                           target="_blank" 
                           style="display: inline-block; background-color: #1a73e8; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500;">
                           Navbatga Yozilish ➜
                        </a>
                    </div>
                \`;
                infoWindow.setContent(contentStr);
                infoWindow.open({
                    anchor: marker,
                    map,
                });
            });
        });
    }
</script>

<!-- Google Maps API o'rnatish - Advanced Markers "libraries=marker" talab qiladi -->
<script src="https://maps.googleapis.com/maps/api/js?key={{ GOOGLE_MAPS_API_KEY }}&callback=initMap&v=weekly&libraries=marker" defer></script>
{% endblock %}
`
  },
  {
    title: '5. Django SEO Meta Teglar & Sitemap.xml',
    language: 'python',
    description: 'Google qidiruv robotlariga barcha subdomendagi klinikalarni index-lashni ko\'rsatish va saytni yuqoriga chiqarish uchun dynamic Sitemap va SEO Meta boshqaruvini shakllantiramiz.',
    filename: 'dentistry_clinic/sitemaps.py',
    code: `from django.contrib.sitemaps import Sitemap
from dentistry_clinic.models import Clinic, Doctor

class ClinicSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.9

    def items(self):
        # Faqat faol klinikalardan tashkil topadi
        return Clinic.objects.filter(is_active=True)

    def location(self, item):
        # Multitenant saytlarda to'liq subdomain linkini qaytaramiz
        return f"https://{item.subdomain}.dstoma-navbat-lk2p.vercel.app/"

class DoctorSitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.7

    def items(self):
        return Doctor.objects.select_related('clinic').all()

    def location(self, item):
        return f"https://{item.clinic.subdomain}.dstoma-navbat-lk2p.vercel.app/doctors/{item.id}/"

# urls.py dagi mapping:
# path('sitemap.xml', sitemap, {'sitemaps': {'clinics': ClinicSitemap, 'doctors': DoctorSitemap}}, name='django.contrib.sitemaps.views.sitemap')`
  },
  {
    title: '6. Google Search Console & SEO Monitoring',
    language: 'text',
    description: 'Saytni Google Search Console (GSC) orqali monitoring qilish, sitemap.xml-ni yuborish va index-lash samaradorligini oshirish bo\'yicha to\'liq yo\'riqnoma.',
    filename: 'Google Search Console Guide.md',
    code: `GOOGLE SEARCH CONSOLE RO'YXATDAN O'TKAZISH QADAMLARI:

1. GOOGLE SEARCH CONSOLE-GA KIRISH:
   - https://search.google.com/search-console/ sahifasiga Google hisobingiz yordamida kiring.

2. MULK (PROPERTY) QO'SHISH:
   - "Mulk qo'shish" (Add Property) tugmasini bosing.
   - Tanlov uchun ikki tomon bor: "Domain" (barcha subdomenlar uchun) yoki "URL prefix" (faqat yagona manzil uchun).
   - "Domain" variantini tanlab "dstoma.uz" (yoki o'zingizning domeningizni) kiriting. Bu eng yaxshi yo'l, chunki u samarqand.dstoma-navbat-lk2p.vercel.app, buxoro.dstoma-navbat-lk2p.vercel.app kabi barcha multi-tenant subdomenlarni bitta mulkda qamrab oladi.

3. DOMENGA EGALIKNI TASDIQLASH (DNS Verification):
   - Google sizga maxsus TXT record beradi (masalan: google-site-verification=xxxxxxxxx).
   - Domain registratoringiz paneliga (GoDaddy, Namecheap, Reg.uz yoki Cloudflare) kiring.
   - DNS sozlamalariga kiring va yangi "TXT" yozuvini profilga kiriting:
     * Type: TXT
     * Name: @ (yoki bo'sh qoldiring)
     * Value: google-site-verification=xxxxxxxxx (Google bergan kod)
   - "Tasdiqlash" (Verify) tugmasini bosing. DNS yangilanishi 5-15 daqiqa olishi mumkin.

4. SITEMAP.XML FAOL SUBMISSION (Yuborish):
   - Google Search Console-ning chap menyusidan "Sitemaps" bo'limiga kiring.
   - "Yangi sitemap qo'shish" (Add a new sitemap) maydoniga sitemap.xml manzilini yozing:
     * dstoma.uz/sitemap.xml
   - "Yuborish" (Submit) tugmasini bosing. Google haftalik ravishda barcha subdomen va sahifalarni avtomat o'qib boradi.

5. URL INSPECTION (Majburiy tezkor indekslash uchun):
   - Agar yangi klinika yoki maqola qo'shsangiz, yuqoridagi qidiruv maydoniga (URL inspection) to'liq linkni kiriting (masalan: https://samarqand.dstoma-navbat-lk2p.vercel.app/).
   - "Indekslashni so'rash" (Request Indexing) tugmasini bosing. Bu Google botlarini bir necha soat ichida sahifani tekshirishga majburlaydi.`
  }
];
