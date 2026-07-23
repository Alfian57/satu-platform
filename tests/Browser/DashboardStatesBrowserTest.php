<?php

use App\Models\User;

test('reference dashboard states render in a real browser', function (string $state) {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => $state]))
        ->assertDataAttribute('@dashboard-root', 'dashboard-state', $state)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues();
})->with([
    'revision',
    'first-run',
    'empty',
    'loading',
    'long-content',
    'partial-permission',
    'error',
    'stale',
]);

test('unknown dashboard preview state falls back to revision', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'not-supported']))
        ->assertDataAttribute(
            '@dashboard-root',
            'dashboard-state',
            'revision',
        )
        ->assertSee('Lengkapi bukti kontribusi');
});

test('long dashboard content never creates document overflow', function (int $width, int $height) {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'long-content']))
        ->resize($width, $height)
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        )
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with([
    'compact mobile' => [320, 800],
    'tablet portrait' => [768, 1024],
    'small laptop' => [1366, 768],
    'desktop reference' => [1672, 941],
]);

test('mobile reading order keeps the docket before the ledger and context rail', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'revision']))
        ->resize(320, 800)
        ->assertScript(
            <<<'JS'
function() {
    const docket = document.querySelector('[data-test="dashboard-docket"]');
    const ledger = document.querySelector('[data-test="dashboard-ledger"]');
    const rail = document.querySelector('[data-test="dashboard-context-rail"]');

    return Boolean(
        docket
        && ledger
        && rail
        && docket.getBoundingClientRect().top < ledger.getBoundingClientRect().top
        && ledger.getBoundingClientRect().top < rail.getBoundingClientRect().top
    );
}
JS,
            true,
        )
        ->assertScript(
            <<<'JS'
function() {
    const themeToggle = document.querySelector('[data-test="theme-toggle"]');

    if (!themeToggle) {
        return false;
    }

    const bounds = themeToggle.getBoundingClientRect();

    return bounds.width >= 44 && bounds.height >= 44;
}
JS,
            true,
        )
        ->assertScript(
            <<<'JS'
function() {
    const header = document.querySelector('header');

    if (!header) {
        return false;
    }

    const bounds = header.getBoundingClientRect();

    return bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth;
}
JS,
            true,
        )
        ->assertScript(
            <<<'JS'
function() {
    const ledger = document.querySelector('[data-test="dashboard-ledger"]');
    const content = ledger?.textContent ?? '';

    return content.includes('Project')
        && content.includes('Berikutnya')
        && content.includes('Batas');
}
JS,
            true,
        )
        ->assertScript(
            <<<'JS'
function() {
    const trigger = document.querySelector('[data-test="sidebar-trigger"]');

    if (!trigger) {
        return false;
    }

    const bounds = trigger.getBoundingClientRect();

    return bounds.width >= 44 && bounds.height >= 44;
}
JS,
            true,
        )
        ->assertScript(
            <<<'JS'
function() {
    const userMenu = document.querySelector('[data-test="user-menu-button"]');

    if (!userMenu) {
        return false;
    }

    const bounds = userMenu.getBoundingClientRect();

    return bounds.width >= 44 && bounds.height >= 44;
}
JS,
            true,
        )
        ->assertScript(
            <<<'JS'
function() {
    const mobileFacts = document.querySelector('[data-test="dashboard-project-mobile-facts"]');
    const firstFact = mobileFacts?.children[0];
    const label = firstFact?.children[0];
    const value = firstFact?.children[1];

    if (!label || !value) {
        return false;
    }

    return label.getBoundingClientRect().bottom <= value.getBoundingClientRect().top;
}
JS,
            true,
        )
        ->assertScript(
            <<<'JS'
function() {
    const markers = Array.from(
        document.querySelectorAll('[data-test="dashboard-recommendation-marker"]'),
    );

    return markers.length > 0 && markers.every((marker) => {
        return marker.tagName === 'SPAN'
            && !marker.hasAttribute('role')
            && !marker.hasAttribute('aria-checked');
    });
}
JS,
            true,
        )
        ->assertNoAccessibilityIssues();
});

test('small laptop first viewport preserves the complete priority scan path', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'revision']))
        ->resize(1366, 768)
        ->assertScript(
            <<<'JS'
function() {
    const primaryAction = document.querySelector('[data-test="dashboard-primary-action"]');
    const projectRows = document.querySelectorAll('[data-test="dashboard-project-row"]');
    const recommendationReason = document.querySelector('[data-test="dashboard-recommendation-reason"]');
    const required = [primaryAction, projectRows[0], projectRows[1], recommendationReason];

    return required.every((element) => {
        if (!element) {
            return false;
        }

        const bounds = element.getBoundingClientRect();

        return bounds.top >= 0 && bounds.bottom <= window.innerHeight;
    });
}
JS,
            true,
        );
});

test('dashboard page grid fills the remaining main height', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'revision']))
        ->resize(1366, 768)
        ->assertScript(
            <<<'JS'
function() {
    const main = document.querySelector('[data-slot="sidebar-inset"]');
    const header = main?.querySelector(':scope > header');
    const page = main?.querySelector(':scope > [data-slot="app-page"]');

    if (!main || !header || !page) {
        return false;
    }

    const mainBounds = main.getBoundingClientRect();
    const headerBounds = header.getBoundingClientRect();
    const pageBounds = page.getBoundingClientRect();

    return pageBounds.top >= headerBounds.bottom - 1
        && pageBounds.bottom >= mainBounds.bottom - 1
        && pageBounds.height >= mainBounds.height - headerBounds.height - 1;
}
JS,
            true,
        );
});

test('primary dashboard action works with the keyboard without navigating', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'revision']))
        ->keys('@dashboard-primary-action', 'Enter')
        ->assertSee('Data demo sintetis')
        ->assertScript(
            'window.location.pathname + window.location.search',
            '/dashboard?state=revision',
        );
});

test('navbar theme shortcut switches and persists an explicit theme', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'revision']))
        ->inLightMode()
        ->assertScript(
            "document.querySelector('[data-test=\"theme-toggle\"]')?.getAttribute('aria-label')",
            'Aktifkan mode gelap',
        )
        ->click('@theme-toggle')
        ->assertScript(
            "document.documentElement.classList.contains('dark')",
            true,
        )
        ->assertScript("localStorage.getItem('appearance')", 'dark')
        ->assertScript(
            "document.cookie.includes('appearance=dark')",
            true,
        )
        ->assertScript(
            "document.querySelector('[data-test=\"theme-toggle\"]')?.getAttribute('aria-label')",
            'Aktifkan mode terang',
        )
        ->click('@theme-toggle')
        ->assertScript(
            "document.documentElement.classList.contains('dark')",
            false,
        )
        ->assertScript("localStorage.getItem('appearance')", 'light')
        ->assertScript(
            "document.cookie.includes('appearance=light')",
            true,
        )
        ->assertScript(
            "document.querySelector('[data-test=\"theme-toggle\"]')?.getAttribute('aria-label')",
            'Aktifkan mode gelap',
        )
        ->assertNoAccessibilityIssues()
        ->assertNoJavaScriptErrors();
});

test('enabled dashboard controls expose a pointer cursor', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'revision']))
        ->resize(1366, 768)
        ->assertScript(
            <<<'JS'
function() {
    const selectors = [
        '[data-test="theme-toggle"]',
        '[data-test="sidebar-trigger"]',
        '[data-test="user-menu-button"]',
        '[data-test="dashboard-primary-action"]',
        '[data-test="dashboard-project-row"] button',
    ];

    return selectors.every((selector) => {
        const element = document.querySelector(selector);

        return element && getComputedStyle(element).cursor === 'pointer';
    });
}
JS,
            true,
        )
        ->click('@user-menu-button')
        ->assertScript(
            <<<'JS'
function() {
    const menuItem = document.querySelector('[role="menuitem"]');

    return menuItem && getComputedStyle(menuItem).cursor === 'pointer';
}
JS,
            true,
        );
});

test('dashboard respects the dark color scheme', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'revision']))
        ->inDarkMode()
        ->assertScript(
            "document.documentElement.classList.contains('dark')",
            true,
        )
        ->assertNoAccessibilityIssues()
        ->assertNoJavaScriptErrors();
});

test('loading state keeps the next action available and announces deferred regions', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'loading']))
        ->assertSee('Lengkapi bukti kontribusi')
        ->assertScript(
            "document.querySelector('[data-test=\"dashboard-projects-loading\"]').getAttribute('role')",
            'status',
        )
        ->assertScript(
            "document.querySelector('[data-test=\"dashboard-recommendation-loading\"]').getAttribute('role')",
            'status',
        )
        ->assertMissing('@dashboard-project-count');
});

test('long content limits the first ledger batch and offers the remainder', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'long-content']))
        ->resize(320, 800)
        ->assertCount('@dashboard-project-row', 3)
        ->assertSee('Lihat 9 project lainnya')
        ->assertScript(
            'document.documentElement.scrollWidth <= document.documentElement.clientWidth',
            true,
        );
});

test('partial permission explains availability while hiding protected actions', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'partial-permission']))
        ->assertSee('Afiliasi kampus sedang ditinjau')
        ->assertSee('Bergabung ke tim dan kirim kontribusi')
        ->assertScript(
            <<<'JS'
function() {
    return Array.from(document.querySelectorAll('button')).every((button) => {
        return !/bergabung ke tim|kirim kontribusi/i.test(button.textContent ?? '');
    });
}
JS,
            true,
        );
});

test('empty regions provide explicit next actions', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'empty']))
        ->assertSee('Belum ada project aktif')
        ->assertSee('Belum ada rekomendasi yang cukup kuat');
});

test('error regions provide explicit recovery actions', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'error']))
        ->assertSee('Daftar project belum berhasil dimuat')
        ->assertSee('Data profilmu tetap aman')
        ->click('Coba muat project')
        ->assertSee('Data demo sintetis');
});

test('stale summary exposes its timestamp and a non-destructive reload action', function () {
    $this->actingAs(User::factory()->create());

    visit(route('dashboard', ['state' => 'stale']))
        ->assertSee('Ada perubahan terbaru')
        ->assertSee('Terakhir diperbarui 16.42 WIB')
        ->click('Muat ulang ringkasan')
        ->assertSee('Data demo sintetis')
        ->assertScript(
            'window.location.pathname + window.location.search',
            '/dashboard?state=stale',
        );
});

test('reference dashboard produces the P07 approval evidence', function (
    string $state,
    int $width,
    int $height,
    bool $darkMode,
    bool $fullPage,
    string $filename,
) {
    $this->actingAs(User::factory()->create([
        'name' => 'Dian Pratama',
    ]));

    $page = $darkMode
        ? visit(route('dashboard', ['state' => $state]))->inDarkMode()
        : visit(route('dashboard', ['state' => $state]));

    $page->resize($width, $height)
        ->assertDataAttribute('@dashboard-root', 'dashboard-state', $state)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs()
        ->assertNoAccessibilityIssues()
        ->screenshot($fullPage, $filename);
})->with([
    'revision light desktop' => [
        'revision',
        1366,
        768,
        false,
        false,
        'p07-revision-light-1366x768',
    ],
    'revision light mobile' => [
        'revision',
        320,
        800,
        false,
        true,
        'p07-revision-light-320x800-full',
    ],
    'revision dark desktop' => [
        'revision',
        1366,
        768,
        true,
        false,
        'p07-revision-dark-1366x768',
    ],
    'long content light mobile' => [
        'long-content',
        320,
        800,
        false,
        true,
        'p07-long-content-light-320x800-full',
    ],
]);
