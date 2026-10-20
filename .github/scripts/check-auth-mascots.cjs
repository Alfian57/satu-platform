const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(
    process.env.SATU_PLAYWRIGHT_MODULE || 'playwright',
);

const qaOrigin = process.env.SATU_QA_ORIGIN || 'http://127.0.0.1:8000';
assert.ok(
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(qaOrigin).hostname),
);
const root = path.join(__dirname, '../..');
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'satu-auth-mascots-'));
let count = 0;
const check = (value, message) => {
    assert.ok(value, message);
    count++;
    console.log('PASS ' + message);
};

(async () => {
    for (const name of ['mascot-login-return', 'mascot-register-start']) {
        const master = fs.readFileSync(
            path.join(root, 'resources/images/mascot', name + '.png'),
        );
        check(
            master.readUInt32BE(16) >= 1024 &&
                master.readUInt32BE(16) === master.readUInt32BE(20) &&
                master[25] === 6,
            name + ': master PNG HD ber-alpha.',
        );

        for (const suffix of ['', '-256', '-512']) {
            const image = fs.readFileSync(
                path.join(root, 'public/images', name + suffix + '.webp'),
            );
            check(
                image.toString('ascii', 0, 4) === 'RIFF' &&
                    image.toString('ascii', 8, 12) === 'WEBP' &&
                    image.length < 350000,
                name + suffix + ': WebP nyata dan ukuran ringan.',
            );
        }
    }

    const background = fs.readFileSync(
        path.join(root, 'public/images/auth-entry-background.webp'),
    );
    check(
        background.toString('ascii', 0, 4) === 'RIFF' &&
            background.toString('ascii', 8, 12) === 'WEBP' &&
            background.length < 800000,
        'Latar referensi memakai WebP nyata dengan ukuran terkendali.',
    );
    const provenance = JSON.parse(
        fs.readFileSync(
            path.join(
                root,
                'resources/images/mascot/auth-entry-background.provenance.json',
            ),
            'utf8',
        ),
    );
    check(
        provenance.prompt &&
            fs.existsSync(path.join(root, provenance.reference.file)) &&
            fs.existsSync(path.join(root, provenance.source.file)),
        'Sumber, master dan prompt latar tersimpan di workspace.',
    );

    const browser = await chromium.launch(
        process.env.SATU_BROWSER_EXECUTABLE
            ? { executablePath: process.env.SATU_BROWSER_EXECUTABLE }
            : {},
    );
    const errors = [];
    const mutations = [];

    try {
        const context = await browser.newContext({ reducedMotion: 'reduce' });
        await context.grantPermissions(['local-network-access'], {
            origin: qaOrigin,
        });
        await context.route('**/*', async (route) => {
            const request = route.request();
            const url = new URL(request.url());

            if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
                return route.abort();
            }

            if (url.pathname.includes('_boost/browser-logs')) {
                return route.fulfill({ status: 204 });
            }

            if (request.method() !== 'GET') {
                mutations.push(url.pathname);

                return route.abort();
            }

            return route.continue();
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));

        const inspectLayout = async (label) => {
            await page.evaluate(() => scrollTo(0, 0));
            const layout = await page.evaluate(() => {
                const main = document.querySelector('.auth-entry-main');
                const header = document.querySelector('.auth-entry-header');
                const intro = document.querySelector('.auth-entry-intro');
                const form = document.querySelector('.auth-entry-form');
                const mainRect = main.getBoundingClientRect();
                const headerRect = header.getBoundingClientRect();
                const introRect = intro.getBoundingClientRect();
                const formRect = form.getBoundingClientRect();
                const style = getComputedStyle(main);
                const contentTop = Math.min(introRect.top, formRect.top);
                const contentBottom = Math.max(
                    introRect.bottom,
                    formRect.bottom,
                );
                const availableCenter =
                    (mainRect.top +
                        parseFloat(style.paddingTop) +
                        mainRect.bottom -
                        parseFloat(style.paddingBottom)) /
                    2;

                return {
                    horizontallyCentered:
                        Math.abs(
                            (mainRect.left + mainRect.right) / 2 -
                                innerWidth / 2,
                        ) < 2,
                    verticallyCentered:
                        Math.abs(
                            (contentTop + contentBottom) / 2 - availableCenter,
                        ) < 2,
                    safelyBelowHeader: contentTop >= headerRect.bottom - 1,
                    rightAligned:
                        innerWidth < 1024 ||
                        Math.abs(formRect.right - headerRect.right) < 2,
                    fields: Array.from(
                        document.querySelectorAll('.auth-input-frame input'),
                    ).every((input) => {
                        const frame = input.closest('.auth-input-frame');
                        const icon = frame.querySelector('.auth-input-icon');
                        const inputStyle = getComputedStyle(input);
                        const inputRect = input.getBoundingClientRect();
                        const iconRect = icon.getBoundingClientRect();
                        const toggle = frame.querySelector('button');

                        return (
                            parseFloat(inputStyle.fontSize) >= 16 &&
                            inputRect.height >= 44 &&
                            icon.getAttribute('aria-hidden') === 'true' &&
                            getComputedStyle(icon).pointerEvents === 'none' &&
                            iconRect.left >= inputRect.left &&
                            iconRect.right <=
                                inputRect.left +
                                    parseFloat(inputStyle.paddingLeft) -
                                    4 &&
                            (!toggle ||
                                toggle.getBoundingClientRect().left >=
                                    inputRect.right -
                                        parseFloat(inputStyle.paddingRight))
                        );
                    }),
                    background: (() => {
                        const image = document.querySelector(
                            '.auth-entry-backdrop',
                        );

                        return (
                            image.complete &&
                            image.naturalWidth === 1672 &&
                            image.naturalHeight === 941 &&
                            image.alt === '' &&
                            image.getAttribute('aria-hidden') === 'true' &&
                            getComputedStyle(image).pointerEvents === 'none'
                        );
                    })(),
                };
            });
            check(
                layout.horizontallyCentered &&
                    layout.verticallyCentered &&
                    layout.safelyBelowHeader &&
                    layout.rightAligned,
                label + ': komposisi terpusat dan tidak menabrak header.',
            );
            check(
                layout.fields,
                label +
                    ': isian minimal 44px/16px dan ikon tidak menimpa teks.',
            );
            check(
                layout.background,
                label + ': latar referensi termuat sebagai dekorasi.',
            );
            await page.locator('.auth-entry-footer').scrollIntoViewIfNeeded();
            check(
                await page.locator('.auth-entry-footer').evaluate((footer) => {
                    const rect = footer.getBoundingClientRect();

                    return rect.top >= 0 && rect.bottom <= innerHeight + 1;
                }),
                label + ': bagian akhir form dapat dicapai dengan scroll.',
            );
            await page.evaluate(() => scrollTo(0, 0));
        };

        const fixture = async (routeName, props) => {
            let fixturePage;

            await page.route('**/' + routeName, async (route) => {
                const response = await route.fetch();
                const html = await response.text();
                const pattern =
                    /(<script\b[^>]*data-page="app"[^>]*>)([\s\S]*?)(<\/script>)/;
                const match = html.match(pattern);
                assert.ok(match, 'State Inertia tersedia untuk fixture lokal.');
                const payload = JSON.parse(match[2]);
                Object.assign(payload.props, props);
                fixturePage = payload;
                await route.fulfill({
                    response,
                    body: html
                        .replace('data-server-rendered="true"', '')
                        .replace(
                            pattern,
                            (_, opening, content, closing) =>
                                opening +
                                JSON.stringify(payload).replace(
                                    /</g,
                                    '\\u003c',
                                ) +
                                closing,
                        ),
                });
            });
            await page.goto(new URL(routeName, qaOrigin).href);
            await page
                .locator('.auth-entry-backdrop')
                .evaluate((image) => image.decode());
            await page.evaluate(() => document.fonts.ready);

            return fixturePage;
        };

        for (const [route, pose, greeting] of [
            ['login', 'login-return', 'Halo lagi!'],
            ['register', 'register-start', 'Ayo mulai!'],
        ]) {
            for (const [width, height] of [
                [320, 740],
                [390, 844],
                [768, 1024],
                [1280, 720],
                [1366, 768],
                [1672, 941],
                [1920, 1080],
                [3440, 1440],
            ]) {
                await page.setViewportSize({ width, height });
                await page.goto(new URL(route, qaOrigin).href);
                await page
                    .locator('.auth-welcome-bird img')
                    .evaluate((image) => image.decode());
                await page.evaluate(() => document.fonts.ready);
                await page
                    .locator('.auth-entry-backdrop')
                    .evaluate((image) => image.decode());
                await inspectLayout(route + ' ' + width);

                check(
                    (await page
                        .getByText(
                            'Hanya untuk masuk, tidak tampil di profil publik.',
                            { exact: true },
                        )
                        .count()) === (route === 'login' ? 1 : 0),
                    route +
                        ' ' +
                        width +
                        ': bantuan privasi username hanya ditampilkan di login.',
                );

                check(
                    await page.evaluate((routeName) => {
                        const form =
                            document.querySelector('.auth-entry-fields');
                        const markers = form.querySelectorAll(
                            '.auth-required-marker',
                        );

                        if (routeName === 'login') {
                            return markers.length === 0;
                        }

                        const required =
                            form.querySelectorAll('input[required]');

                        return (
                            markers.length === required.length &&
                            Array.from(required).every((input) => {
                                const label = form.querySelector(
                                    'label[for="' + input.id + '"]',
                                );
                                const marker = label?.querySelector(
                                    '.auth-required-marker',
                                );

                                return (
                                    marker?.textContent.trim() === '*' &&
                                    marker.getAttribute('aria-hidden') ===
                                        'true' &&
                                    getComputedStyle(marker).color ===
                                        'rgb(194, 65, 12)'
                                );
                            })
                        );
                    }, route),
                    route +
                        ' ' +
                        width +
                        ': bintang jingga hanya pada isian wajib register.',
                );

                if (route === 'login' && width >= 1280 && height >= 720) {
                    check(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollHeight <=
                                innerHeight + 1,
                        ),
                        'Login ' + width + ': seluruh isi muat satu layar.',
                    );
                }

                if (route === 'register') {
                    check(
                        await page
                            .locator('.auth-register-fields')
                            .evaluate((grid) => {
                                const container =
                                    document.querySelector(
                                        '.auth-entry-fields',
                                    );
                                const columns =
                                    getComputedStyle(
                                        grid,
                                    ).gridTemplateColumns.split(' ').length;

                                return (
                                    columns ===
                                    (container.getBoundingClientRect().width >=
                                    420
                                        ? 2
                                        : 1)
                                );
                            }),
                        'Register ' + width + ': kolom mengikuti ruang isian.',
                    );
                }

                const bird = page.locator('.auth-welcome-bird');
                check(
                    (await bird.getAttribute('data-pose')) === pose,
                    route + ' ' + width + ': pose sesuai halaman.',
                );
                check(
                    await bird
                        .locator('img')
                        .evaluate(
                            (image) =>
                                image.naturalWidth > 0 &&
                                image.currentSrc.includes(
                                    'mascot-' +
                                        image.closest('[data-pose]').dataset
                                            .pose,
                                ) &&
                                image.alt === '' &&
                                image.getAttribute('aria-hidden') === 'true',
                        ),
                    route +
                        ' ' +
                        width +
                        ': gambar dekoratif termuat dari sumber responsif.',
                );
                check(
                    await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            innerWidth + 1,
                    ),
                    route + ' ' + width + ': tidak ada luapan horizontal.',
                );
                check(
                    await bird.evaluate((element) => {
                        const mascot = element.getBoundingClientRect();
                        const bubble = document
                            .querySelector('.auth-welcome-message')
                            .getBoundingClientRect();
                        const form = document
                            .querySelector('.auth-entry-form')
                            .getBoundingClientRect();
                        const separated = (other) =>
                            mascot.right <= other.left ||
                            mascot.left >= other.right ||
                            mascot.bottom <= other.top ||
                            mascot.top >= other.bottom;

                        return (
                            mascot.left >= 0 &&
                            mascot.right <= innerWidth &&
                            separated(bubble) &&
                            separated(form)
                        );
                    }),
                    route +
                        ' ' +
                        width +
                        ': maskot terpisah dari balon dan formulir.',
                );

                const trigger = bird.getByRole('button', {
                    name: 'Sapa maskot SATU',
                });
                await trigger.focus();
                check(
                    await trigger.evaluate((element) => {
                        const style = getComputedStyle(element);

                        return (
                            getComputedStyle(element).cursor === 'pointer' &&
                            element.getBoundingClientRect().height >= 44 &&
                            style.outlineStyle !== 'none'
                        );
                    }),
                    route +
                        ' ' +
                        width +
                        ': target sapaan dan fokus keyboard tersedia.',
                );
                await page.keyboard.press('Enter');
                check(
                    (await trigger.getAttribute('aria-pressed')) === 'true' &&
                        (await trigger.getByRole('status').innerText()) ===
                            greeting,
                    route +
                        ' ' +
                        width +
                        ': sapaan sesuai pose melalui keyboard.',
                );
                check(
                    await bird
                        .locator('img')
                        .evaluate(
                            (image) =>
                                getComputedStyle(image).animationName ===
                                'none',
                        ),
                    route + ' ' + width + ': reduced motion dihormati.',
                );
                await page.keyboard.press('Enter');
                check(
                    (await trigger.getAttribute('aria-pressed')) === 'false',
                    route + ' ' + width + ': sapaan dapat ditutup kembali.',
                );
                await page.locator('input').first().focus();
                await page.screenshot({
                    path: path.join(artifacts, route + '-' + width + '.png'),
                    fullPage: true,
                });
            }

            await page.emulateMedia({ reducedMotion: 'no-preference' });
            const submit = page.locator(
                route === 'login'
                    ? '[data-test="login-button"]'
                    : '[data-test="register-user-button"]',
            );
            const buttonAppearance = async () =>
                submit.evaluate((button) => {
                    const style = getComputedStyle(button);

                    return JSON.stringify({
                        background: style.background,
                        shadow: style.boxShadow,
                        filter: style.filter,
                        transform: style.transform,
                        translate: style.translate,
                        scale: style.scale,
                        transitionDuration: style.transitionDuration,
                    });
                });

            await submit.scrollIntoViewIfNeeded();
            await page.mouse.move(0, 0);
            const idleAppearance = await buttonAppearance();
            await submit.hover();
            check(
                idleAppearance === (await buttonAppearance()) &&
                    JSON.parse(idleAppearance).transitionDuration === '0s',
                route + ': tombol utama tanpa perubahan atau animasi hover.',
            );
            await submit.focus();
            check(
                await submit.evaluate((button) => {
                    const style = getComputedStyle(button);

                    return (
                        style.cursor === 'pointer' &&
                        style.outlineStyle !== 'none' &&
                        parseFloat(style.outlineWidth) >= 2
                    );
                }),
                route + ': tombol tetap mempunyai pointer dan fokus keyboard.',
            );
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.setViewportSize({ width: 1280, height: 800 });
            await page.evaluate(() => {
                document.body.style.zoom = '2';
            });
            check(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <= innerWidth + 1,
                ),
                route + ': reflow pada zoom 200%.',
            );
            await page.evaluate(() => {
                document.body.style.zoom = '';
            });
            check(
                (await page.locator('input[name="username"]').isVisible()) &&
                    (await page.locator('input[name="password"]').isVisible()),
                route + ': field autentikasi tetap tersedia.',
            );
            const password = page.locator('input[name="password"]');
            const toggle = password.locator('..').getByRole('button', {
                name: 'Tampilkan password',
                exact: true,
            });
            await password.fill('Contoh-sintetis-123');
            await toggle.focus();
            await page.keyboard.press('Enter');
            check(
                (await password.getAttribute('type')) === 'text',
                route + ': toggle password tetap berfungsi melalui keyboard.',
            );
            await password
                .locator('..')
                .getByRole('button', {
                    name: 'Sembunyikan password',
                    exact: true,
                })
                .press('Enter');
            await password.fill('');

            if (route === 'login') {
                const remember = page.getByRole('checkbox', {
                    name: 'Ingat saya',
                });

                check(
                    !(await remember.isChecked()),
                    'Ingat saya tidak dipilih otomatis untuk meniru referensi.',
                );
                await remember.press('Space');
                check(
                    await remember.isChecked(),
                    'Pilihan Ingat saya dapat diubah melalui keyboard.',
                );
            }
        }

        await fixture('register', {
            registration: {
                step: 'otp',
                maskedPhone: 'nomor contoh',
                deliveryStatus: 'queued',
                resendAvailableAt: Math.floor(Date.now() / 1000) + 120,
            },
        });
        await page.locator('[data-test="register-otp-step"]').waitFor();
        await inspectLayout('Register OTP');
        check(
            await page
                .locator('label[for="registration-otp"]')
                .evaluate(
                    (label) =>
                        label.querySelector('.auth-required-marker')
                            ?.textContent === '*' &&
                        document.getElementById('registration-otp').required,
                ),
            'Register OTP: kode wajib juga memiliki penanda bintang.',
        );
        check(
            (await page
                .locator('.auth-welcome-bird')
                .getAttribute('data-pose')) === 'register-start',
            'OTP lokal mempertahankan pose registrasi tanpa mengirim nomor atau kode.',
        );
        const resend = page.locator('[data-test="register-resend-button"]');
        check(
            (await resend.isDisabled()) &&
                (await resend.evaluate(
                    (element) => getComputedStyle(element).cursor,
                )) === 'not-allowed',
            'OTP: cooldown tetap menonaktifkan kirim ulang.',
        );
        await page.setViewportSize({ width: 320, height: 740 });
        await inspectLayout('Register OTP mobile');
        const otp = page.locator('input[autocomplete="one-time-code"]');
        await otp.fill('123456');
        check(
            await otp.evaluate((input) => {
                const style = getComputedStyle(input);
                const boxes = input.parentElement.querySelectorAll('span');

                return (
                    style.backgroundColor === 'rgba(0, 0, 0, 0)' &&
                    style.color === 'rgba(0, 0, 0, 0)' &&
                    Array.from(boxes)
                        .map((box) => box.textContent)
                        .join('') === '123456' &&
                    document.documentElement.scrollWidth <= innerWidth + 1
                );
            }),
            'OTP mobile: enam digit terbaca pada slot tanpa tertutup input.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'register-otp-mobile.png'),
            fullPage: true,
        });
        await page.unroute('**/register');
        await page.setViewportSize({ width: 390, height: 844 });
        const validationPage = await fixture('register', {
            errors: {
                name: 'Contoh validasi: periksa nama lengkap mahasiswa.',
                username:
                    'Contoh validasi: gunakan nama pengguna lain untuk masuk.',
                phone: 'Contoh validasi: periksa kembali nomor WhatsApp.',
                password: 'Contoh validasi: password belum memenuhi ketentuan.',
                password_confirmation:
                    'Contoh validasi: konfirmasi password belum sama.',
                terms_accepted: 'Contoh validasi: persetujuan belum dipilih.',
            },
        });
        const form = page.locator('.auth-entry-fields form');
        const action = await form.getAttribute('action');
        const mockedAction = '**' + new URL(action, qaOrigin).pathname;
        let mockedCommands = 0;

        await page.route(mockedAction, async (route) => {
            assert.equal(route.request().method(), 'POST');
            mockedCommands++;
            await route.fulfill({
                status: 200,
                headers: {
                    'content-type': 'application/json',
                    'x-inertia': 'true',
                },
                body: JSON.stringify(validationPage),
            });
        });
        await form.evaluate((element) => {
            element.noValidate = true;
        });
        await page.locator('[data-test="register-user-button"]').click();
        await page.locator('[data-test="register-error-summary"]').waitFor();
        check(
            mockedCommands === 1,
            'Validasi memakai respons sintetis lokal, bukan command backend.',
        );
        await inspectLayout('Register dengan error panjang');
        check(
            await page.locator('.auth-register-fields').evaluate((grid) =>
                Array.from(grid.querySelectorAll('input')).every((input) => {
                    const describedBy = input
                        .getAttribute('aria-describedby')
                        ?.split(' ');

                    return (
                        input.getAttribute('aria-invalid') === 'true' &&
                        (input.type === 'checkbox' ||
                            getComputedStyle(input).borderColor ===
                                'rgb(180, 35, 24)') &&
                        describedBy?.every((id) => document.getElementById(id))
                    );
                }),
            ),
            'Error isian terhubung dengan pesan dan tidak bergantung pada warna.',
        );
        await page.screenshot({
            path: path.join(artifacts, 'register-validation-mobile.png'),
            fullPage: true,
        });
        await page.unroute('**/register');
        await page.unroute(mockedAction);

        await page.goto(new URL('recover', qaOrigin).href);
        check(
            (await page.locator('.satu-mascot').getAttribute('data-pose')) ===
                'peek',
            'Pemulihan akun tetap memakai pose existing.',
        );
        check(
            mutations.length === 0,
            'Pengujian tidak meneruskan command autentikasi ke backend.',
        );
        check(
            errors.length === 0,
            'Tanpa exception JavaScript: ' + errors.join(', '),
        );
        console.log(count + ' pemeriksaan lulus. Artefak: ' + artifacts);
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
