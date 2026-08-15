<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\SkillTaxonomy;
use Illuminate\Database\Seeder;

class SkillTaxonomySeeder extends Seeder
{
    /**
     * Run the database seeds for canonical skill taxonomies.
     */
    public function run(): void
    {
        $skills = [
            // ==========================================
            // 1. Software Engineering - Web & Backend
            // ==========================================
            [
                'name' => 'React',
                'category' => 'software',
                'description' => 'Library JavaScript deklaratif untuk membangun antarmuka pengguna interaktif dan komponen modular.',
                'is_verified' => true,
            ],
            [
                'name' => 'Next.js',
                'category' => 'software',
                'description' => 'Framework React full-stack dengan fitur Server-Side Rendering (SSR), Static Site Generation, dan App Router.',
                'is_verified' => true,
            ],
            [
                'name' => 'TypeScript',
                'category' => 'software',
                'description' => 'Superset JavaScript bertipe statis untuk pengembangan aplikasi skala enterprise yang aman dari bug.',
                'is_verified' => true,
            ],
            [
                'name' => 'JavaScript',
                'category' => 'software',
                'description' => 'Bahasa pemrograman inti web modern untuk logika dinamis klien dan backend runtime.',
                'is_verified' => true,
            ],
            [
                'name' => 'Vue.js',
                'category' => 'software',
                'description' => 'Framework JavaScript progresif yang fleksibel dan mudah diintegrasikan untuk antarmuka pengguna.',
                'is_verified' => true,
            ],
            [
                'name' => 'Nuxt.js',
                'category' => 'software',
                'description' => 'Framework intuitif berbasis Vue.js untuk SSR, SSG, dan performa tinggi.',
                'is_verified' => true,
            ],
            [
                'name' => 'Svelte',
                'category' => 'software',
                'description' => 'Framework modern berbasis kompilasi langsung ke kode DOM murni tanpa Virtual DOM.',
                'is_verified' => true,
            ],
            [
                'name' => 'TailwindCSS',
                'category' => 'software',
                'description' => 'Framework CSS utility-first untuk pembuatan antarmuka modern yang cepat dan sangat responsif.',
                'is_verified' => true,
            ],
            [
                'name' => 'HTML5 / CSS3',
                'category' => 'software',
                'description' => 'Standar fondasi struktur semantik dan styling web modern serta aksesibilitas (a11y).',
                'is_verified' => true,
            ],
            [
                'name' => 'Laravel',
                'category' => 'software',
                'description' => 'Framework PHP elegan untuk pengembangan API, web service monolit, dan sistem enterprise modern.',
                'is_verified' => true,
            ],
            [
                'name' => 'PHP',
                'category' => 'software',
                'description' => 'Bahasa pemrograman server-side tangguh dengan fitur modern OOP dan performa tinggi di PHP 8+.',
                'is_verified' => true,
            ],
            [
                'name' => 'Node.js',
                'category' => 'software',
                'description' => 'Runtime JavaScript berbasis mesin V8 untuk membangun microservices dan REST API asinkron.',
                'is_verified' => true,
            ],
            [
                'name' => 'Express.js',
                'category' => 'software',
                'description' => 'Framework web minimalis dan fleksibel untuk routing dan middleware di Node.js.',
                'is_verified' => true,
            ],
            [
                'name' => 'NestJS',
                'category' => 'software',
                'description' => 'Framework backend Node.js terstruktur berbasis TypeScript dengan pola arsitektur modular terinspirasi Angular.',
                'is_verified' => true,
            ],
            [
                'name' => 'Python',
                'category' => 'software',
                'description' => 'Bahasa serbaguna dengan sintaks bersih untuk backend API, otomasi sistem, dan komputasi data.',
                'is_verified' => true,
            ],
            [
                'name' => 'Django',
                'category' => 'software',
                'description' => 'Framework Python tingkat tinggi dengan arsitektur batteries-included dan ORM tangguh.',
                'is_verified' => true,
            ],
            [
                'name' => 'FastAPI',
                'category' => 'software',
                'description' => 'Framework Python modern berkecepatan tinggi untuk membangun REST API asynchronous dengan auto-dokumentasi OpenAPI.',
                'is_verified' => true,
            ],
            [
                'name' => 'Go (Golang)',
                'category' => 'software',
                'description' => 'Bahasa kompilasi berkinerja tinggi dengan model konkurensi goroutine untuk backend dan microservices skala masif.',
                'is_verified' => true,
            ],
            [
                'name' => 'Java',
                'category' => 'software',
                'description' => 'Bahasa pemrograman OOP tingkat industri untuk sistem berskala enterprise dan perbankan.',
                'is_verified' => true,
            ],
            [
                'name' => 'Spring Boot',
                'category' => 'software',
                'description' => 'Framework Java populer untuk pembuatan standalone production-grade Spring applications.',
                'is_verified' => true,
            ],
            [
                'name' => 'Rust',
                'category' => 'software',
                'description' => 'Bahasa sistem dengan keamanan memori tanpa garbage collector dan performa sekelas C++.',
                'is_verified' => true,
            ],
            [
                'name' => 'RESTful API Design',
                'category' => 'software',
                'description' => 'Perancangan antarmuka pemrograman aplikasi berbasis standar REST, HTTP methods, dan response contract.',
                'is_verified' => true,
            ],
            [
                'name' => 'GraphQL',
                'category' => 'software',
                'description' => 'Bahasa kueri data fleksibel untuk API yang memungkinkan klien meminta data sesuai kebutuhan secara efisien.',
                'is_verified' => true,
            ],
            [
                'name' => 'Microservices Architecture',
                'category' => 'software',
                'description' => 'Pola desain arsitektur modular terdistribusi dengan event-driven broker dan service communication.',
                'is_verified' => true,
            ],

            // ==========================================
            // 2. Mobile Development
            // ==========================================
            [
                'name' => 'Flutter',
                'category' => 'mobile',
                'description' => 'Framework multiplatform buatan Google menggunakan bahasa Dart untuk merilis aplikasi native di iOS dan Android.',
                'is_verified' => true,
            ],
            [
                'name' => 'React Native',
                'category' => 'mobile',
                'description' => 'Framework pengembangan aplikasi seluler native menggunakan basis kode React dan JavaScript.',
                'is_verified' => true,
            ],
            [
                'name' => 'Kotlin',
                'category' => 'mobile',
                'description' => 'Bahasa resmi modern untuk pengembangan aplikasi Android native dan multiplatform.',
                'is_verified' => true,
            ],
            [
                'name' => 'Swift',
                'category' => 'mobile',
                'description' => 'Bahasa pemrograman kuat dan intuitif untuk aplikasi iOS, iPadOS, dan ekosistem Apple.',
                'is_verified' => true,
            ],
            [
                'name' => 'Android Jetpack',
                'category' => 'mobile',
                'description' => 'Kumpulan pustaka dan panduan arsitektur (Compose, ViewModel, Room, LiveData) untuk Android modern.',
                'is_verified' => true,
            ],
            [
                'name' => 'SwiftUI',
                'category' => 'mobile',
                'description' => 'Framework deklaratif modern untuk merancang antarmuka aplikasi di platform Apple.',
                'is_verified' => true,
            ],

            // ==========================================
            // 3. Database, Storage & Big Data
            // ==========================================
            [
                'name' => 'PostgreSQL',
                'category' => 'data',
                'description' => 'Sistem basis data relasional objek open-source dengan dukungan indeks lanjutan, JSONB, dan konkurensi tinggi.',
                'is_verified' => true,
            ],
            [
                'name' => 'MySQL',
                'category' => 'data',
                'description' => 'RDBMS populer dan andal untuk transaksi aplikasi skala besar dengan mesin InnoDB.',
                'is_verified' => true,
            ],
            [
                'name' => 'Redis',
                'category' => 'data',
                'description' => 'Penyimpanan struktur data dalam memori (in-memory) untuk caching, antrean pesan, dan sesi cepat.',
                'is_verified' => true,
            ],
            [
                'name' => 'MongoDB',
                'category' => 'data',
                'description' => 'Basis data dokumen NoSQL berbasis JSON/BSON untuk skema fleksibel dan skalabilitas horizontal.',
                'is_verified' => true,
            ],
            [
                'name' => 'SQLite',
                'category' => 'data',
                'description' => 'Database SQL ringan tanpa server yang tertanam langsung untuk aplikasi lokal, testing, dan mobile.',
                'is_verified' => true,
            ],
            [
                'name' => 'Elasticsearch',
                'category' => 'data',
                'description' => 'Mesin pencarian dan analitik terdistribusi untuk teks lengkap (full-text search) dan data log.',
                'is_verified' => true,
            ],
            [
                'name' => 'Supabase',
                'category' => 'data',
                'description' => 'Alternatif open source Firebase berbasis PostgreSQL dengan autentikasi instan dan realtime database.',
                'is_verified' => true,
            ],
            [
                'name' => 'Firebase',
                'category' => 'data',
                'description' => 'Platform backend Google dengan Firestore, Cloud Functions, Push Notifications, dan auth.',
                'is_verified' => true,
            ],

            // ==========================================
            // 4. Artificial Intelligence & Data Science
            // ==========================================
            [
                'name' => 'Machine Learning',
                'category' => 'data',
                'description' => 'Pengembangan algoritma prediksi, regresi, klasifikasi, dan pipeline evaluasi model data.',
                'is_verified' => true,
            ],
            [
                'name' => 'Deep Learning',
                'category' => 'data',
                'description' => 'Pelatihan jaringan saraf tiruan (neural networks) bertingkat untuk pemrosesan data kompleks.',
                'is_verified' => true,
            ],
            [
                'name' => 'Artificial Intelligence',
                'category' => 'data',
                'description' => 'Perancangan arsitektur sistem cerdas, agen otonom, dan integrasi model penalaran komputasional.',
                'is_verified' => true,
            ],
            [
                'name' => 'Data Science',
                'category' => 'data',
                'description' => 'Eksplorasi data, rekayasa fitur statistik, visualisasi data, dan pemodelan analitik bisnis.',
                'is_verified' => true,
            ],
            [
                'name' => 'PyTorch',
                'category' => 'data',
                'description' => 'Framework deep learning fleksibel untuk riset kecerdasan buatan dan deployment model produksi.',
                'is_verified' => true,
            ],
            [
                'name' => 'TensorFlow',
                'category' => 'data',
                'description' => 'Platform komprehensif open source untuk machine learning dan deployment model skala besar.',
                'is_verified' => true,
            ],
            [
                'name' => 'Pandas & NumPy',
                'category' => 'data',
                'description' => 'Manipulasi matriks komputasi numerik dan pembersihan dataset tabular di Python.',
                'is_verified' => true,
            ],
            [
                'name' => 'Natural Language Processing (NLP)',
                'category' => 'data',
                'description' => 'Pemrosesan teks bahasa alami, tokenisasi, ekstraksi entitas, dan model bahasa besar (LLM).',
                'is_verified' => true,
            ],
            [
                'name' => 'Computer Vision',
                'category' => 'data',
                'description' => 'Pemrosesan citra digital, deteksi objek, segmentasi gambar, dan pengenalan pola visual.',
                'is_verified' => true,
            ],
            [
                'name' => 'Prompt Engineering',
                'category' => 'data',
                'description' => 'Teknik penyusunan instruksi terstruktur untuk model bahasa kecerdasan buatan generatif.',
                'is_verified' => true,
            ],

            // ==========================================
            // 5. Cloud, DevOps & Infrastructure
            // ==========================================
            [
                'name' => 'Docker',
                'category' => 'devops',
                'description' => 'Platform kontainerisasi untuk mengemas aplikasi dan dependensinya secara portabel dan konsisten.',
                'is_verified' => true,
            ],
            [
                'name' => 'Kubernetes',
                'category' => 'devops',
                'description' => 'Sistem orkestrasi otomatisasi deployment, penskalaan, dan pengelolaan kontainer skala klaster.',
                'is_verified' => true,
            ],
            [
                'name' => 'Git',
                'category' => 'devops',
                'description' => 'Sistem kontrol versi terdistribusi untuk kolaborasi kode tim dan pelacakan riwayat commit.',
                'is_verified' => true,
            ],
            [
                'name' => 'CI/CD Pipelines',
                'category' => 'devops',
                'description' => 'Automasi build, testing, dan deployment otomatis untuk rilis software secara cepat dan aman.',
                'is_verified' => true,
            ],
            [
                'name' => 'GitHub Actions',
                'category' => 'devops',
                'description' => 'Otomatisasi alur kerja continuous integration dan delivery terintegrasi di repositori GitHub.',
                'is_verified' => true,
            ],
            [
                'name' => 'Amazon Web Services (AWS)',
                'category' => 'devops',
                'description' => 'Layanan infrastruktur cloud komprehensif termasuk EC2, S3, RDS, Lambda, dan VPC.',
                'is_verified' => true,
            ],
            [
                'name' => 'Google Cloud Platform (GCP)',
                'category' => 'devops',
                'description' => 'Solusi komputasi cloud Google untuk hosting, Cloud Run, BigQuery, dan AI platform.',
                'is_verified' => true,
            ],
            [
                'name' => 'Linux / Bash Scripting',
                'category' => 'devops',
                'description' => 'Administrasi server sistem operasi Linux dan otomatisasi tugas menggunakan skrip shell.',
                'is_verified' => true,
            ],
            [
                'name' => 'Nginx',
                'category' => 'devops',
                'description' => 'Web server berkinerja tinggi, reverse proxy, dan load balancer untuk lalu lintas HTTP.',
                'is_verified' => true,
            ],
            [
                'name' => 'Terraform',
                'category' => 'devops',
                'description' => 'Infrastructure as Code (IaC) untuk mengelola sumber daya cloud secara deklaratif.',
                'is_verified' => true,
            ],

            // ==========================================
            // 6. UI/UX Design & User Research
            // ==========================================
            [
                'name' => 'UI/UX Design',
                'category' => 'design',
                'description' => 'Prinsip desain antarmuka pengguna estetis dan perancangan alur pengalaman pengguna yang intuitif.',
                'is_verified' => true,
            ],
            [
                'name' => 'Figma',
                'category' => 'design',
                'description' => 'Alat desain antarmuka kolaboratif berbasis vektor, auto-layout, komponen varian, dan prototipe interaktif.',
                'is_verified' => true,
            ],
            [
                'name' => 'Design Systems',
                'category' => 'design',
                'description' => 'Penyusunan panduan desain reusable, design tokens, tipografi, warna, dan pola komponen produk.',
                'is_verified' => true,
            ],
            [
                'name' => 'User Research',
                'category' => 'design',
                'description' => 'Riset kualitatif/kuantitatif melalui wawancara pengguna, survei, dan pemetaan personas.',
                'is_verified' => true,
            ],
            [
                'name' => 'Wireframing',
                'category' => 'design',
                'description' => 'Pembuatan kerangka layout awal low-fidelity untuk memetakan hierarki informasi dan arsitektur konten.',
                'is_verified' => true,
            ],
            [
                'name' => 'Usability Testing',
                'category' => 'design',
                'description' => 'Pengujian antarmuka dengan pengguna riil untuk mengevaluasi kemudahan dan efisiensi alur aplikasi.',
                'is_verified' => true,
            ],
            [
                'name' => 'Adobe Illustrator',
                'category' => 'design',
                'description' => 'Pembuatan grafis vektor, ikonografi kustom, ilustrasi digital, dan aset visual identitas merk.',
                'is_verified' => true,
            ],
            [
                'name' => 'Adobe Photoshop',
                'category' => 'design',
                'description' => 'Pengeditan grafis raster, manipulasi gambar, dan compositing visual berkualitas tinggi.',
                'is_verified' => true,
            ],

            // ==========================================
            // 7. Product Management & Project Delivery
            // ==========================================
            [
                'name' => 'Product Management',
                'category' => 'management',
                'description' => 'Penetapan visi produk, penyusunan roadmap, analisis matriks bisnis, dan pemetaan kebutuhan pengguna.',
                'is_verified' => true,
            ],
            [
                'name' => 'Agile / Scrum',
                'category' => 'management',
                'description' => 'Metodologi manajemen proyek berbasis sprint iteratif, daily standup, backlog grooming, dan retrospeksi.',
                'is_verified' => true,
            ],
            [
                'name' => 'QA & Automated Testing',
                'category' => 'management',
                'description' => 'Pengujian mutu perangkat lunak melalui unit test, integration test, dan end-to-end regression.',
                'is_verified' => true,
            ],
            [
                'name' => 'Technical Writing',
                'category' => 'management',
                'description' => 'Dokumentasi teknis API, panduan arsitektur sistem, dan standar operasional perangkat lunak.',
                'is_verified' => true,
            ],
            [
                'name' => 'Team Leadership',
                'category' => 'management',
                'description' => 'Kepemimpinan tim kolaboratif, resolusi konflik, mentoring talenta, dan fasilitasi komunikasi proyek.',
                'is_verified' => true,
            ],

            // ==========================================
            // 8. Cybersecurity & Information Security
            // ==========================================
            [
                'name' => 'Cybersecurity',
                'category' => 'security',
                'description' => 'Prinsip keamanan informasi, enkripsi data, proteksi jaringan, dan pencegahan serangan siber.',
                'is_verified' => true,
            ],
            [
                'name' => 'Web Security & OWASP',
                'category' => 'security',
                'description' => 'Pencegahan kerentanan keamanan web standar OWASP Top 10 seperti XSS, CSRF, dan SQL Injection.',
                'is_verified' => true,
            ],
            [
                'name' => 'Penetration Testing',
                'category' => 'security',
                'description' => 'Audit keamanan sistem melalui simulasi serangan etis untuk menemukan celah kerentanan.',
                'is_verified' => true,
            ],

            // ==========================================
            // 9. Sample Community / User-Created Skills (is_verified = false)
            // Useful for testing admin verification workflows in /platform/skills
            // ==========================================
            [
                'name' => 'Hono.js',
                'category' => 'software',
                'description' => 'Framework web ultrakecil dan cepat untuk Cloudflare Workers, Deno, Bun, dan Node.js.',
                'is_verified' => false,
            ],
            [
                'name' => 'LangChain',
                'category' => 'data',
                'description' => 'Framework orkestrasi aplikasi berbasis Large Language Models (LLMs) dan retrieval-augmented generation (RAG).',
                'is_verified' => false,
            ],
            [
                'name' => 'Bun Runtime',
                'category' => 'software',
                'description' => 'All-in-one JavaScript runtime, bundler, test runner, dan package manager berkecepatan tinggi.',
                'is_verified' => false,
            ],
            [
                'name' => 'Spline 3D',
                'category' => 'design',
                'description' => 'Alat desain 3D kolaboratif berbasis web untuk menciptakan pengalaman interaktif 3D di website.',
                'is_verified' => false,
            ],
            [
                'name' => 'Tauri Framework',
                'category' => 'software',
                'description' => 'Framework untuk membangun aplikasi desktop hemat memori menggunakan frontend web dan backend Rust.',
                'is_verified' => false,
            ],
        ];

        foreach ($skills as $skill) {
            SkillTaxonomy::updateOrCreate(
                ['name' => $skill['name']],
                [
                    'category' => $skill['category'],
                    'description' => $skill['description'],
                    'is_verified' => $skill['is_verified'],
                ]
            );
        }
    }
}
