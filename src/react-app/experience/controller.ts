import { MotionClock } from './clock';
import { domainPoints, drawDomain, interpolatePoints } from './domains';
import { createOpeningRenderer, OPENING_DURATION, type SpecimenImages } from './opening';
import { pages, previousPage, resolvePage } from './pages';
import caterpillarURL from '../assets/caterpillar-line-art.png';
import chrysalisURL from '../assets/chrysalis-line-art.png';
function loadImages(images: SpecimenImages, signal: AbortSignal) {
    return Promise.all(Object.entries({ caterpillar: caterpillarURL, chrysalis: chrysalisURL }).map(([name, src]) => new Promise<void>(resolve => {
        const image = new Image();
        images[name as keyof SpecimenImages] = image;
        let timeout = 0;
        const done = () => { clearTimeout(timeout); image.onload = null; image.onerror = null; resolve(); };
        timeout = window.setTimeout(done, 5000);
        signal.addEventListener('abort', done, { once: true });
        image.onload = () => { void image.decode().catch(() => { }).then(done); };
        // The exact silhouette particles still render if a specimen image fails.
        image.onerror = done;
        image.src = src;
    })));
}
/** React owns the shell. This scoped controller owns graphics and transient DOM state. */
export function mountExperience(root: HTMLElement) {
    const select = <T extends HTMLElement = HTMLElement>(selector: string) => {
        const element = root.querySelector<T>(selector);
        if (!element)
            throw new Error(`Missing experience element: ${selector}`);
        return element;
    };
    const scene = select('.px-scene'), copy = select('.px-copy'), title = select('.px-title');
    const prompt = select('.px-prompt'), kicker = select('.px-kicker'), contact = select<HTMLAnchorElement>('.px-contact');
    const next = select<HTMLAnchorElement>('.px-next'), nextLabel = select('.px-next-label');
    const back = select<HTMLButtonElement>('.px-back'), position = select('.px-position');
    const menu = select('.px-menu'), toggle = select<HTMLButtonElement>('.px-menu-toggle');
    const footer = select('.px-footer'), replay = select<HTMLButtonElement>('.px-replay');
    const canvas = select<HTMLCanvasElement>('.px-canvas'), originCanvas = select<HTMLCanvasElement>('.px-origin');
    const fallback = select('.px-fallback');
    const ctx = canvas.getContext('2d'), originContext = originCanvas.getContext('2d');
    const wordmarkHTML = `Ple${select('.px-home .px-mark').outerHTML}gent`;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const abort = new AbortController(), { signal } = abort;
    const images: SpecimenImages = {};
    const ready = loadImages(images, signal);
    const origin = originContext ? createOpeningRenderer(originContext, images) : null;
    const openingClock = new MotionClock(), transitionClock = new MotionClock();
    let active = resolvePage(location.pathname).index;
    let seen = false, inView = !('IntersectionObserver' in window), disposed = false, generation = 0;
    let width = 0, height = 0, resizeFrame = 0, openingTime = 0;
    let currentPoints = domainPoints(active);
    let copyAnimation: Animation | null = null;
    let revealAnimations: Animation[] = [];
    let touch: {
        x: number;
        y: number;
        time: number;
    } | null = null;
    let wheelTotal = 0, wheelAt = 0, wheelLock = 0;
    const diagnostics = { draws: 0, intervals: [] as number[], drawMs: [] as number[], lastTime: 0 };
    const frozen = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('sceneTime') ?? NaN) : NaN;
    const freezeTime = Number.isFinite(frozen) ? Math.max(0, Math.min(OPENING_DURATION, frozen)) : null;
    function cancelCopy() {
        copyAnimation?.cancel();
        copyAnimation = null;
        revealAnimations.forEach(animation => animation.cancel());
        revealAnimations = [];
    }
    function syncPause() {
        const paused = document.hidden || !menu.hidden || !inView;
        openingClock.pause(paused);
        transitionClock.pause(paused);
        diagnostics.lastTime = 0;
    }
    function renderText(focus = false) {
        const page = pages[active];
        title.textContent = page.title;
        title.setAttribute('aria-label', page.label);
        title.classList.toggle('px-wordmark', active === 0);
        if (active === 0)
            title.innerHTML = wordmarkHTML;
        copy.classList.toggle('px-about', page.path === '/about/');
        prompt.textContent = page.prompt;
        kicker.hidden = active === 0;
        contact.hidden = active !== 6;
        nextLabel.textContent = page.invitation;
        next.href = pages[page.next].path;
        position.hidden = active < 1 || active > 4;
        position.textContent = `${active} / 4`;
        position.setAttribute('aria-label', `Domain ${active} of 4`);
        back.hidden = active === 0;
        root.querySelectorAll<HTMLElement>('[data-go]').forEach(element => {
            if (Number(element.dataset.go) === active)
                element.setAttribute('aria-current', 'page');
            else
                element.removeAttribute('aria-current');
        });
        document.title = active === 0 ? 'Plexigent — Connecting Dots' : `${page.label} — Plexigent`;
        document.querySelector('meta[name="description"]')?.setAttribute('content', `${page.label}. ${page.prompt}`);
        document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://plexigent.com${page.path}`);
        if (import.meta.env.DEV)
            root.dataset.page = page.path;
        if (focus)
            (active === 0 && !seen && !reduced.matches ? scene : title).focus({ preventScroll: true });
    }
    function setupMode() {
        scene.classList.toggle('px-is-home', active === 0);
        scene.classList.remove('px-origin-done');
        originCanvas.hidden = active !== 0 || !origin;
        canvas.hidden = active === 0 || !ctx;
        fallback.hidden = active !== 0 || !!origin;
        footer.classList.toggle('px-waiting', active === 0);
        replay.hidden = true;
    }
    function drawPoints() {
        if (ctx && width)
            drawDomain(ctx, currentPoints, width, height);
    }
    function drawOpening(t: number) {
        openingTime = t;
        const start = performance.now();
        origin?.draw(t);
        if (t >= 13.15) {
            scene.classList.add('px-origin-done');
            revealAnimations.forEach(animation => { animation.currentTime = Math.min(1100, (t - 13.15) * 1000); });
        }
        if (t >= OPENING_DURATION) {
            seen = true;
            footer.classList.remove('px-waiting');
            replay.hidden = reduced.matches || !origin;
            revealAnimations.forEach(animation => animation.cancel());
            revealAnimations = [];
        }
        if (import.meta.env.DEV) {
            diagnostics.draws++;
            diagnostics.drawMs.push(performance.now() - start);
            if (diagnostics.lastTime && t > diagnostics.lastTime)
                diagnostics.intervals.push((t - diagnostics.lastTime) * 1000);
            diagnostics.lastTime = t;
            root.dataset.originTime = t.toFixed(3);
            root.dataset.originPhase = t < 3.4 ? 'dots' : t < 6.35 ? 'consumption' : t < 10.85 ? 'metamorphosis' : t < OPENING_DURATION ? 'emergence' : 'butterfly';
            root.dataset.draws = String(diagnostics.draws);
            if (t >= OPENING_DURATION) {
                const sorted = [...diagnostics.intervals].sort((a, b) => a - b);
                root.dataset.frameP95 = String(sorted[Math.floor(sorted.length * .95)] ?? 0);
                root.dataset.frameP99 = String(sorted[Math.floor(sorted.length * .99)] ?? 0);
                root.dataset.drawMeanMs = String(diagnostics.drawMs.reduce((a, b) => a + b, 0) / diagnostics.drawMs.length);
            }
        }
    }
    function resize() {
        resizeFrame = 0;
        if (disposed || !menu.hidden)
            return;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        if (active === 0) {
            const w = originCanvas.clientWidth, h = originCanvas.clientHeight;
            if (w && h) {
                origin?.resize(w, h, dpr);
                drawOpening(openingTime);
            }
        }
        else if (ctx) {
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawPoints();
        }
    }
    function queueResize() {
        if (!resizeFrame)
            resizeFrame = requestAnimationFrame(resize);
    }
    function startOpening(animate: boolean) {
        const mine = ++generation;
        openingClock.stop();
        cancelCopy();
        openingTime = reduced.matches || !animate || !origin ? OPENING_DURATION : freezeTime ?? 0;
        scene.classList.remove('px-origin-done');
        footer.classList.add('px-waiting');
        replay.hidden = true;
        diagnostics.draws = 0;
        diagnostics.intervals = [];
        diagnostics.drawMs = [];
        diagnostics.lastTime = 0;
        resize();
        if (openingTime >= OPENING_DURATION)
            drawOpening(OPENING_DURATION);
        void ready.then(() => {
            if (disposed || mine !== generation || active !== 0)
                return;
            if (openingTime < OPENING_DURATION && !reduced.matches) {
                revealAnimations = [
                    copy.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease', fill: 'both' }),
                    copy.animate([{ transform: 'translateY(12px)' }, { transform: 'translateY(0)' }], { duration: 1100, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }),
                ];
                revealAnimations.forEach(animation => { animation.pause(); animation.currentTime = 0; });
            }
            syncPause();
            if (freezeTime !== null && !reduced.matches && animate)
                drawOpening(freezeTime);
            else
                openingClock.start(OPENING_DURATION, drawOpening, () => { }, openingTime);
        });
    }
    function setMenu(open: boolean, restoreFocus = true) {
        menu.hidden = !open;
        scene.hidden = open;
        footer.hidden = open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        select('.px-menu-label').textContent = open ? 'Close' : 'Menu';
        syncPause();
        if (open)
            menu.querySelector<HTMLAnchorElement>('a')?.focus();
        else {
            resize();
            if (restoreFocus)
                toggle.focus({ preventScroll: true });
        }
    }
    function normalizeURL() {
        if (location.pathname !== pages[active].path)
            history.replaceState(null, '', pages[active].path + location.search + location.hash);
    }
    function show(index: number, historyMode: 'push' | 'pop' = 'push') {
        if (index < 0 || index >= pages.length)
            return;
        if (index === active) {
            setMenu(false);
            normalizeURL();
            return;
        }
        ++generation;
        openingClock.stop();
        transitionClock.stop();
        cancelCopy();
        const from = currentPoints;
        const to = domainPoints(index);
        active = index;
        if (historyMode === 'push')
            history.pushState(null, '', pages[index].path);
        else
            normalizeURL();
        // Reveal before measuring, but do not resume an obsolete scene.
        setMenu(false, false);
        setupMode();
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (active === 0) {
            renderText(true);
            startOpening(!seen);
            return;
        }
        resize();
        if (reduced.matches) {
            renderText(true);
            currentPoints = to;
            drawPoints();
            return;
        }
        copyAnimation = copy.animate([
            { opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-10px)' },
        ], { duration: 180, easing: 'ease-out', fill: 'both' });
        copyAnimation.pause();
        copyAnimation.currentTime = 0;
        let incoming = false;
        transitionClock.start(.72, elapsed => {
            currentPoints = interpolatePoints(from, to, elapsed / .72);
            drawPoints();
            if (elapsed >= .18 && !incoming) {
                incoming = true;
                copyAnimation?.cancel();
                renderText(true);
                copyAnimation = copy.animate([
                    { opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' },
                ], { duration: 468, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
                copyAnimation.pause();
            }
            if (copyAnimation)
                copyAnimation.currentTime = incoming ? Math.min(468, (elapsed - .18) * 1000) : elapsed * 1000;
        }, () => { copyAnimation?.cancel(); copyAnimation = null; });
    }
    const advance = () => show(pages[active].next);
    const canGesture = () => menu.hidden && !transitionClock.running && !(active === 0 && openingTime < OPENING_DURATION)
        && document.documentElement.scrollHeight <= window.innerHeight + 2 && (visualViewport?.scale ?? 1) <= 1;
    const plainClick = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;
    root.querySelectorAll<HTMLAnchorElement>('[data-go]').forEach(link => link.addEventListener('click', event => {
        if (!plainClick(event))
            return;
        event.preventDefault();
        show(Number(link.dataset.go));
    }, { signal }));
    toggle.addEventListener('click', () => setMenu(menu.hidden), { signal });
    next.addEventListener('click', event => { if (plainClick(event)) {
        event.preventDefault();
        advance();
    } }, { signal });
    back.addEventListener('click', () => show(previousPage(active)), { signal });
    replay.addEventListener('click', () => { scene.focus({ preventScroll: true }); startOpening(true); }, { signal });
    root.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !menu.hidden) {
            event.preventDefault();
            setMenu(false);
            return;
        }
        if (!menu.hidden) {
            if (event.key === 'Tab') {
                const items = [select<HTMLAnchorElement>('.px-home'), toggle, ...menu.querySelectorAll<HTMLAnchorElement>('a')];
                const index = items.indexOf(document.activeElement as HTMLAnchorElement);
                if (event.shiftKey && index <= 0) {
                    event.preventDefault();
                    items[items.length - 1]?.focus();
                }
                else if (!event.shiftKey && index === items.length - 1) {
                    event.preventDefault();
                    items[0].focus();
                }
            }
            return;
        }
        if ((event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]') || event.metaKey || event.ctrlKey || event.altKey || !canGesture())
            return;
        if (event.key === 'ArrowDown' || event.key === 'PageDown') {
            event.preventDefault();
            advance();
        }
        if (event.key === 'ArrowUp' || event.key === 'PageUp') {
            event.preventDefault();
            show(previousPage(active));
        }
    }, { signal });
    scene.addEventListener('touchstart', event => {
        if (event.touches.length !== 1 || !canGesture() || (event.target as HTMLElement).closest('a,button')) {
            touch = null;
            return;
        }
        const t = event.touches[0];
        touch = { x: t.clientX, y: t.clientY, time: performance.now() };
    }, { passive: true, signal });
    scene.addEventListener('touchend', event => {
        if (!touch || !canGesture()) {
            touch = null;
            return;
        }
        const t = event.changedTouches[0], dy = t.clientY - touch.y, dx = t.clientX - touch.x;
        if (Math.abs(dy) > 65 && Math.abs(dy) > Math.abs(dx) * 1.5 && performance.now() - touch.time < 700) {
            if (dy < 0)
                advance();
            else
                show(previousPage(active));
        }
        touch = null;
    }, { passive: true, signal });
    scene.addEventListener('touchcancel', () => { touch = null; }, { passive: true, signal });
    root.addEventListener('wheel', event => {
        const now = performance.now();
        const gap = now - wheelAt;
        wheelAt = now;
        if (gap > 160)
            wheelTotal = 0;
        if (!canGesture() || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || now < wheelLock || (gap < 160 && wheelTotal === Infinity))
            return;
        const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
        if (Math.sign(delta) !== Math.sign(wheelTotal))
            wheelTotal = 0;
        wheelTotal += delta;
        if (Math.abs(wheelTotal) >= 80) {
            if (wheelTotal > 0)
                advance();
            else
                show(previousPage(active));
            wheelTotal = Infinity;
            wheelLock = now + 850;
        }
    }, { passive: true, signal });
    window.addEventListener('popstate', () => show(resolvePage(location.pathname).index, 'pop'), { signal });
    document.addEventListener('visibilitychange', syncPause, { signal });
    reduced.addEventListener('change', () => {
        if (active === 0) {
            if (reduced.matches)
                startOpening(false);
            else
                replay.hidden = !seen || !origin;
        }
        else if (reduced.matches)
            transitionClock.finish();
    }, { signal });
    window.addEventListener('resize', queueResize, { signal });
    window.visualViewport?.addEventListener('resize', queueResize, { signal });
    const observer = new ResizeObserver(queueResize);
    observer.observe(scene);
    const intersection = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        syncPause();
    }, { threshold: .1 }) : null;
    intersection?.observe(root);
    normalizeURL();
    setupMode();
    renderText();
    resize();
    syncPause();
    if (active === 0)
        startOpening(true);
    return () => {
        disposed = true;
        ++generation;
        abort.abort();
        openingClock.stop();
        transitionClock.stop();
        cancelCopy();
        cancelAnimationFrame(resizeFrame);
        observer.disconnect();
        intersection?.disconnect();
    };
}
