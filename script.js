/* ══════════════════════════════════════════════════════════════════════════
   Motion system
   ─ smooth scroll (lerped native scroll, so position:fixed still behaves)
   ─ magnetic difference-blend cursor with morph + tooltips
   ─ per-character mask reveals, block rises, scrubbed word reveal
   ─ velocity-linked marquees, nav behaviour, scroll rail, hero parallax
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
    "use strict";

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var lerp = function (a, b, t) { return a + (b - a) * t; };
    var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

    /* ─────────────────────────────  PRELOADER  ───────────────────────────── */
    function preloader() {
        var el = $("#preloader");
        if (!el) return Promise.resolve();

        var words = $$(".preloader__word", el);
        document.body.classList.add("is-locked");

        if (reduced) {
            el.classList.add("is-done");
            document.body.classList.remove("is-locked");
            setTimeout(function () { el.remove(); }, 100);
            return Promise.resolve();
        }

        requestAnimationFrame(function () { el.classList.add("is-loading"); });

        return new Promise(function (done) {
            var i = 0;
            var step = function () {
                if (i > 0) words[i - 1].classList.remove("is-on");
                if (i < words.length) {
                    words[i].classList.add("is-on");
                    i++;
                    setTimeout(step, i === words.length ? 620 : 380);
                } else {
                    el.classList.add("is-done");
                    document.body.classList.remove("is-locked");
                    setTimeout(function () { el.remove(); }, 1100);
                    done();
                }
            };
            setTimeout(step, 260);
        });
    }

    /* ─────────────────────────────  SMOOTH SCROLL  ─────────────────────────────
       Wheel input is intercepted and eased into the real scroll position, so the
       page keeps native scrollbars, anchors, and fixed positioning. Touch and
       keyboard fall through to the browser untouched. */
    var scroll = { current: 0, target: 0, velocity: 0, active: false, lastTick: 0 };

    function smoothScroll() {
        if (reduced || !finePointer) {
            scroll.current = scroll.target = window.scrollY;
            window.addEventListener("scroll", function () {
                scroll.velocity = window.scrollY - scroll.current;
                scroll.current = scroll.target = window.scrollY;
            }, { passive: true });
            return;
        }

        scroll.current = scroll.target = window.scrollY;
        scroll.active = true;

        var maxScroll = function () {
            return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        };

        window.addEventListener("wheel", function (e) {
            if (e.ctrlKey) return;                       // pinch-zoom
            if (document.body.classList.contains("is-locked")) return;
            // if the animation loop has stalled (backgrounded tab, blocked main
            // thread) swallowing the wheel would leave the page unscrollable —
            // hand it back to the browser instead
            if (performance.now() - scroll.lastTick > 250) {
                scroll.target = scroll.current = window.scrollY;
                return;
            }
            e.preventDefault();
            scroll.target = clamp(scroll.target + e.deltaY, 0, maxScroll());
        }, { passive: false });

        // anything that moves the page by other means (anchors, keys, scrollbar)
        window.addEventListener("scroll", function () {
            if (Math.abs(window.scrollY - scroll.current) > 120) {
                scroll.target = scroll.current = window.scrollY;
            }
        }, { passive: true });

        window.addEventListener("resize", function () {
            scroll.target = clamp(scroll.target, 0, maxScroll());
        });
    }

    function smoothScrollTick() {
        if (!scroll.active) return;
        scroll.lastTick = performance.now();
        var next = lerp(scroll.current, scroll.target, 0.1);
        if (Math.abs(next - scroll.current) < 0.08) next = scroll.target;
        scroll.velocity = next - scroll.current;
        scroll.current = next;
        if (Math.abs(window.scrollY - scroll.current) > 0.4) window.scrollTo(0, scroll.current);
    }

    /* anchors ease to their target through the same pipeline */
    function anchors() {
        $$('a[href^="#"]').forEach(function (a) {
            a.addEventListener("click", function (e) {
                var id = a.getAttribute("href");
                if (id === "#" || id.length < 2) return;
                var t = document.getElementById(id.slice(1));
                if (!t) return;
                e.preventDefault();
                var y = t.getBoundingClientRect().top + window.scrollY - 70;
                if (scroll.active) {
                    scroll.target = clamp(y, 0, document.documentElement.scrollHeight - window.innerHeight);
                } else {
                    window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
                }
            });
        });
    }

    /* ─────────────────────────────  CURSOR  ─────────────────────────────
       A bone square in `mix-blend-mode: difference`. Idle it trails the pointer;
       over a target it morphs to that element's box and the element leans back. */
    function cursor() {
        var blob = $("#blob"), dot = $("#blobDot"), label = $("#blobLabel");
        if (!blob || !dot || !finePointer || reduced) return null;

        document.documentElement.classList.add("has-blob");

        var mouse = { x: innerWidth / 2, y: innerHeight / 2 };
        var b = { x: mouse.x, y: mouse.y, w: 40, h: 40 };
        var d = { x: mouse.x, y: mouse.y };
        var snap = null;          // element currently held
        var snapRect = null;
        var magnet = null;

        document.addEventListener("mousemove", function (e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            blob.classList.add("is-on");
            dot.classList.add("is-on");
        }, { passive: true });

        document.addEventListener("mouseleave", function () {
            blob.classList.remove("is-on");
            dot.classList.remove("is-on");
        });

        function release() {
            if (magnet) { magnet.style.transform = ""; magnet.style.transition = ""; magnet = null; }
            snap = null;
            snapRect = null;
            blob.classList.remove("is-snapped", "is-label");
            dot.classList.remove("is-hidden");
            label.textContent = "";
        }

        function grab(el) {
            snap = el;
            var tip = el.getAttribute("data-tooltip");
            if (tip) {
                label.textContent = tip;
                blob.classList.add("is-label");
                blob.classList.remove("is-snapped");
                dot.classList.remove("is-hidden");
            } else {
                blob.classList.add("is-snapped");
                blob.classList.remove("is-label");
                dot.classList.add("is-hidden");
                magnet = el;
                el.style.transition = "transform .45s cubic-bezier(.16,1,.3,1)";
            }
        }

        document.addEventListener("mouseover", function (e) {
            var el = e.target.closest ? e.target.closest("[data-blob]") : null;
            if (el && el !== snap) { release(); grab(el); }
            else if (!el && snap) { release(); }
        }, { passive: true });

        // a snapped target can be removed or re-laid-out under the pointer
        window.addEventListener("scroll", function () {
            if (snap && !snap.isConnected) release();
        }, { passive: true });

        function tick() {
            var tw = 40, th = 40, tx = mouse.x, ty = mouse.y;

            if (snap && snap.isConnected) {
                if (blob.classList.contains("is-label")) {
                    // labelled chip rides just off the pointer. offsetWidth is
                    // the label's own intrinsic width (padding included) — it
                    // must never be derived from the blob this is sizing.
                    tw = Math.max(64, label.offsetWidth);
                    th = 34;
                    tx = mouse.x + tw / 2 + 14;
                    ty = mouse.y + th / 2 + 14;
                    if (tx + tw / 2 > innerWidth - 8) tx = mouse.x - tw / 2 - 14;
                } else {
                    snapRect = snap.getBoundingClientRect();
                    tw = snapRect.width + 10;
                    th = snapRect.height + 10;
                    tx = snapRect.left + snapRect.width / 2;
                    ty = snapRect.top + snapRect.height / 2;

                    if (magnet && snap.hasAttribute("data-blob")) {
                        var mx = (mouse.x - tx) * 0.16;
                        var my = (mouse.y - ty) * 0.16;
                        magnet.style.transform = "translate(" + mx.toFixed(2) + "px," + my.toFixed(2) + "px)";
                    }
                }
            }

            // idle roam is deliberately slower than the target-fit — the shape
            // has to catch up to the pointer rather than sit glued to it, which
            // is what reads as weight. Snapped stays close to the old pace so
            // magnetic targets still feel precise, not sluggish.
            var prevX = b.x, prevY = b.y;
            var posLerp = snap ? 0.21 : 0.115;
            b.x = lerp(b.x, tx, posLerp);
            b.y = lerp(b.y, ty, posLerp);
            b.w = lerp(b.w, tw, 0.21);
            b.h = lerp(b.h, th, 0.21);

            blob.style.width = b.w.toFixed(1) + "px";
            blob.style.height = b.h.toFixed(1) + "px";

            // a little momentum while roaming free: the shape leans and
            // stretches into its own velocity, then relaxes square once it
            // catches up. Switched off while snapped so a magnetic fit stays
            // exact instead of wobbling against the button it just landed on.
            var extra = "";
            if (!snap) {
                var vx = b.x - prevX, vy = b.y - prevY;
                var speed = Math.hypot(vx, vy);
                if (speed > 0.15) {
                    var angle = Math.atan2(vy, vx) * 180 / Math.PI;
                    var stretch = clamp(speed * 0.05, 0, 0.22);
                    extra = " rotate(" + angle.toFixed(1) + "deg) scale(" + (1 + stretch).toFixed(3) + "," + (1 - stretch * 0.55).toFixed(3) + ") rotate(" + (-angle).toFixed(1) + "deg)";
                }
            }
            blob.style.transform = "translate(" + (b.x - b.w / 2).toFixed(1) + "px," + (b.y - b.h / 2).toFixed(1) + "px)" + extra;

            d.x = lerp(d.x, mouse.x, 0.42);
            d.y = lerp(d.y, mouse.y, 0.42);
            dot.style.transform = "translate(" + (d.x - 4).toFixed(1) + "px," + (d.y - 4).toFixed(1) + "px)";
        }

        return tick;
    }

    /* ─────────────────────────────  SPLIT TEXT  ─────────────────────────────
       Each character gets its own overflow-hidden box so the glyph can slide up
       from behind the line. Characters are inline-block, which would otherwise
       let the browser break a line mid-word, so each word is wrapped in its own
       nowrap box. <br> and spacing survive the walk. */
    function split(el) {
        var idx = 0;

        function chars(word, into) {
            var wrap = document.createElement("span");
            wrap.className = "wd";
            word.split("").forEach(function (c) {
                var span = document.createElement("span");
                span.className = "ch";
                var inner = document.createElement("i");
                inner.textContent = c;
                inner.style.setProperty("--d", (idx * 16) + "ms");
                idx++;
                span.appendChild(inner);
                wrap.appendChild(span);
            });
            into.appendChild(wrap);
        }

        function walk(node, into) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) {
                    child.textContent.split(/(\s+)/).forEach(function (token) {
                        if (!token) return;
                        if (/^\s+$/.test(token)) into.appendChild(document.createTextNode(" "));
                        else chars(token, into);
                    });
                } else if (child.nodeName === "BR") {
                    into.appendChild(document.createElement("br"));
                } else {
                    var clone = child.cloneNode(false);
                    into.appendChild(clone);
                    walk(child, clone);
                }
            });
        }

        var frag = document.createDocumentFragment();
        walk(el, frag);
        el.textContent = "";
        el.appendChild(frag);
    }

    function reveals() {
        $$("[data-split]").forEach(function (el) { split(el); });

        $$("[data-rise]").forEach(function (el) {
            var delay = el.getAttribute("data-rise-delay");
            if (delay) el.style.setProperty("--d", delay + "ms");
        });

        var targets = $$("[data-split], [data-rise]");

        if (!("IntersectionObserver" in window) || reduced) {
            targets.forEach(function (el) { el.classList.add("is-in"); });
            return null;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-in");
                io.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

        targets.forEach(function (el) { io.observe(el); });

        // a backgrounded or zero-height viewport reports innerHeight 0, which
        // would sweep nothing at all — floor it rather than measure nonsense
        var viewport = function () {
            return Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 640);
        };

        var sweep = function (edge) {
            for (var i = pending.length - 1; i >= 0; i--) {
                var el = pending[i];
                if (el.classList.contains("is-in")) { pending.splice(i, 1); continue; }
                if (el.getBoundingClientRect().top < edge) {
                    el.classList.add("is-in");
                    io.unobserve(el);
                    pending.splice(i, 1);
                }
            }
        };
        var pending = targets.slice();

        /* Safety net. An IntersectionObserver reports the state it finds at
           callback time, so an element that enters and leaves the viewport
           between two deliveries — a trackpad fling, a jump to an anchor, a
           restored scroll position — can be skipped and left at opacity 0
           permanently. Content nobody can read is worse than content that
           arrives without its animation, so re-check the stragglers and let the
           observer win the race whenever it can.

           Deliberately not driven off the shared rAF loop: frames stop entirely
           in a backgrounded tab, which is exactly a case this has to survive.
           Timers keep firing (throttled), so the net still closes. */
        var last = 0;
        var catchUp = function () {
            var now = performance.now();
            if (now - last < 300) return;
            last = now;
            sweep(viewport() * 0.88);
            if (!pending.length) {
                window.removeEventListener("scroll", catchUp);
                clearInterval(timer);
            }
        };
        var timer = setInterval(catchUp, 500);
        window.addEventListener("scroll", catchUp, { passive: true });

        /* The observer deliberately holds its trigger back until an element is
           12% clear of the fold, which is right for a section scrolling into
           view and wrong for the first screen — the hero's own call to action
           lands inside that dead strip and would sit invisible until the reader
           scrolled past it. Sweep the opening viewport by hand once the
           preloader has lifted, so the hero plays its entrance on cue. */
        return function () { sweep(viewport()); };
    }

    /* ─────────────────────────────  HALFTONE  ─────────────────────────────
       The reference renders photography as a cell grid rather than as a
       picture. Ported off its fragment shader, which does three things worth
       keeping exactly:

         · the cell mark is a SQUARE — the shader measures Chebyshev distance
           (max(|x|,|y|)) from the cell centre, not radial, so every mark is a
           block. Circles read as a screen-door overlay laid on top of a photo;
           blocks read as the photo actually being built out of print cells.
         · SIZE carries the tone and alpha stays flat. That is the whole trick.
           Fading dots in and out just looks like a dissolve.
         · cells the image does not reach still get a tiny idle dot, half of
           them, chosen by a hash of the cell id — so empty ground is a live
           dot field instead of dead space.

       On a 2D canvas that costs two batched paths per frame (one fill for the
       blocks, one for the idle field), and the loop parks itself as soon as
       every cell has settled, so the steady state is free. */
    var HT = {
        cell:   6,      // CSS px per cell on desktop — finer grid, more subject
        cellSm: 4,
        min:    .04,    // block half-size at black, as a fraction of the cell
        max:    .47,    // ...and at white. Just short of touching: at .5 the
                        // blocks fuse and highlights become solid slabs — the
                        // grid must survive even in the brightest region.
        idle:   .05,    // the resting dot in cells the image does not reach
        block:  "rgba(255,255,255,.95)",
        rest:   "rgba(176,194,226,.34)",
        tau:    .30,    // seconds for a cell to ease onto its target

        clip:   .02,    // fraction of cells clipped at each end by auto-levels
        scurve: .55,    // how hard the midtones are pushed apart
        body:   .78,    // weight of plain tone in the final coverage
        edge:   .85,    // ...and of the outline pass
        ease:   .18     // how fast the black/white points may travel per frame
    };

    function halftone() {
        var hosts = $$("[data-halftone]");
        if (!hosts.length) return null;

        // the mark is the point of the effect, so with reduced motion the grid
        // is still drawn — it simply arrives already settled instead of developing
        var rigs = [];

        hosts.forEach(function (host) {
            var img = $("img", host);
            if (!img) return;

            /* A frame sheet instead of a video, given as "cols,rows,count".
               Video was the obvious choice and the wrong one: scrubbing means
               setting currentTime, and a browser refuses to seek at all unless
               the server answers HTTP Range requests — so the hero silently
               froze on frame one behind any static file server that does not
               (python -m http.server among them). A sheet is just an image.
               It cannot fail to seek, needs nothing from the host, and since
               the grid resolves to ~183 cells across, the frames can be small
               enough that the whole strip undercuts the video it replaced. */
            var sheet = null;
            var spec = (host.getAttribute("data-halftone-sheet") || "").split(",");
            if (spec.length === 3) {
                sheet = { cols: +spec[0], rows: +spec[1], count: +spec[2] };
                if (!(sheet.cols > 0 && sheet.rows > 0 && sheet.count > 0)) sheet = null;
            }
            var stage = sheet ? host.closest("[data-scrub]") : null;

            // where the camera looks: the point of the frame that cover-crops
            // keep centred when the viewport is narrower than the footage
            var focus = { x: .5, y: .45 };
            var fspec = (host.getAttribute("data-halftone-focus") || "").split(",");
            if (fspec.length === 2 && isFinite(+fspec[0])) focus = { x: +fspec[0], y: +fspec[1] };

            // "x,y,w,h" as fractions of the frame: the region the tail of the
            // runway dives into. Here, the laptop's white screen.
            var zoomRect = null;
            var zspec = (host.getAttribute("data-halftone-zoom") || "").split(",");
            if (zspec.length === 4 && isFinite(+zspec[0])) {
                zoomRect = { x: +zspec[0], y: +zspec[1], w: +zspec[2], h: +zspec[3] };
            }
            var canvas = document.createElement("canvas");
            canvas.className = "halftone";
            canvas.setAttribute("aria-hidden", "true");
            host.appendChild(canvas);

            var gain = parseFloat(host.getAttribute("data-halftone-gain"));
            if (!isFinite(gain)) gain = .52;
            // gamma trades shadow detail against highlight restraint: above 1
            // crushes the darks (right for a bright still behind type), at 1 the
            // darks keep their structure (right for a clip that opens on a dim
            // room and has to read as something on the very first frame)
            var gamma = parseFloat(host.getAttribute("data-halftone-gamma"));
            if (!isFinite(gamma)) gamma = 1.25;

            // luma is a byte, so the whole tone curve is 256 possible answers.
            // A live rig re-tones every cell every frame; looking the answer up
            // beats ~22k pow() calls per frame for an identical result.
            var tone = new Float32Array(256);
            for (var t = 0; t < 256; t++) tone[t] = clamp(Math.pow(t / 255, gamma) * gain, 0, 1);

            var ctx = canvas.getContext("2d");
            if (!ctx) return;
            var sampler = document.createElement("canvas");
            var sctx = sampler.getContext("2d", { willReadFrequently: true });
            if (!sctx) return;

            var rig = {
                host: host, img: img, canvas: canvas, ctx: ctx,
                sampler: sampler, sctx: sctx,
                w: 0, h: 0, cell: 0, cols: 0, rows: 0,
                lum: null, cov: null, rest: null,
                reveal: (reduced || sheet) ? 1 : 0, ready: false, dirty: true,
                // a scrubbed strip re-samples on every frame change and has no
                // develop pass: the picture is already there, it is the frame
                // that moves. A short tau leaves just enough phosphor trail to
                // read as motion rather than as a cut between unrelated grids.
                live: !!sheet, tau: sheet ? .085 : HT.tau, frame: 0, at: -1,
                sheet: sheet, stage: stage, zt: 0
            };

            rig.measure = function () {
                var r = host.getBoundingClientRect();
                var w = Math.round(r.width), h = Math.round(r.height);
                if (!w || !h) return;

                if (w === rig.w && h === rig.h) {
                    // right size already — but a first pass that ran before the
                    // image decoded left the tone buffer empty, so try again
                    if (!rig.ready) { rig.sample(); rig.dirty = true; }
                    return;
                }

                rig.w = w; rig.h = h;
                rig.cell = w < 700 ? HT.cellSm : HT.cell;
                rig.cols = Math.ceil(w / rig.cell);
                rig.rows = Math.ceil(h / rig.cell);

                canvas.width = w; canvas.height = h;
                sampler.width = rig.cols; sampler.height = rig.rows;

                var n = rig.cols * rig.rows;
                rig.lum = new Float32Array(n);
                rig.cov = new Float32Array(n);
                rig.raw = new Float32Array(n);
                rig.cov2 = new Float32Array(n);
                rig.rest = new Uint8Array(n);
                rig.lo = -1; rig.hi = -1;    // auto-levels re-find their footing
                rig.seeded = false;          // fresh buffer needs the hash re-rolled
                rig.sample();
                rig.dirty = true;
            };

            /* One draw of the photograph into a cols×rows buffer gives exactly
               one luminance sample per cell — the browser's own downscale does
               the box-filtering, so there is no per-pixel loop over the source. */
            rig.sample = function () {
                var iw = img.naturalWidth, ih = img.naturalHeight;
                if (!iw || !ih) return;

                // a sheet samples one cell of the strip; a plain photo is the
                // whole image
                var sx = 0, sy = 0, sw = iw, sh = ih;
                if (sheet) {
                    sw = iw / sheet.cols;
                    sh = ih / sheet.rows;
                    sx = (rig.frame % sheet.cols) * sw;
                    sy = ((rig.frame / sheet.cols) | 0) * sh;
                }

                /* The dive. Zoom happens here, in sampling space, not by scaling
                   the canvas: the source window shrinks toward the target rect,
                   the grid re-reads it, and the dots stay cell-sized and crisp
                   at any magnification — a scaled-up canvas would just blur.
                   Linear rect interpolation reads as accelerating zoom (scale is
                   the reciprocal of window size), which is the right shape for
                   a dive; smoothstep takes the edge off both ends. */
                var fx = focus.x, fy = focus.y;
                if (zoomRect && rig.zt > 0) {
                    var z = rig.zt;
                    z = z * z * (3 - 2 * z);
                    var rx = zoomRect.x * z, ry = zoomRect.y * z;
                    var rw = 1 + (zoomRect.w - 1) * z, rh = 1 + (zoomRect.h - 1) * z;
                    // re-express the focus point relative to the shrinking
                    // window; as the window converges on the target this drifts
                    // to its centre, so the dive always lands dead-on
                    fx = clamp((fx - rx) / rw, 0, 1);
                    fy = clamp((fy - ry) / rh, 0, 1);
                    sx += rx * sw; sy += ry * sh;
                    sw *= rw; sh *= rh;
                }

                // cover-fit, sliding the crop window so the focus point stays
                // as close to the viewport centre as the frame allows
                var cols = rig.cols, rows = rig.rows;
                var scale = Math.max(cols / sw, rows / sh);
                var dw = sw * scale, dh = sh * scale;
                var dx = clamp(cols / 2 - fx * dw, cols - dw, 0);
                var dy = clamp(rows / 2 - fy * dh, rows - dh, 0);
                sctx.clearRect(0, 0, cols, rows);
                sctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

                var data;
                try {
                    data = sctx.getImageData(0, 0, cols, rows).data;
                } catch (e) {
                    return;                       // tainted canvas — leave the plain <img> up
                }

                /* Imaging pipeline, in order:

                   1 · auto-levels. The clip swings from a dim hallway to a
                       blown-out window; any fixed curve flattens one end or the
                       other. Each frame's histogram donates its own black and
                       white points (clipping HT.clip of cells at each end), so
                       every frame spends the full output range on the tones it
                       actually contains. The points ease frame-to-frame rather
                       than jumping, or the whole field would flicker at cuts in
                       exposure.
                   2 · s-curve around the midpoint pushes walls and window apart
                       — that separation, not overall brightness, is what makes
                       the room legible as a room.
                   3 · Sobel edge magnitude, added on top. Tone says "this area
                       is bright"; edges say "this is where the window frame,
                       the door, the desk actually are." The outlines are what
                       make the shot discernible as your footage rather than as
                       abstract weather.
                   4 · per-placement gamma/gain (the `tone` table) still shapes
                       the result to sit under whatever vignette the section has. */
                var n = cols * rows;
                var raw = rig.raw;
                for (var i = 0; i < n; i++) {
                    var p = i * 4;
                    raw[i] = data[p] * .299 + data[p + 1] * .587 + data[p + 2] * .114;
                }

                // 1 · histogram → black/white points
                var hist = new Uint32Array(256);
                for (i = 0; i < n; i++) hist[raw[i] | 0]++;
                var clip = n * HT.clip, acc = 0, lo = 0, hi = 255;
                for (i = 0; i < 256; i++) { acc += hist[i]; if (acc > clip) { lo = i; break; } }
                acc = 0;
                for (i = 255; i >= 0; i--) { acc += hist[i]; if (acc > clip) { hi = i; break; } }
                if (hi - lo < 24) { lo = Math.max(0, lo - 12); hi = Math.min(255, hi + 12); }

                if (rig.lo < 0) { rig.lo = lo; rig.hi = hi; }
                rig.lo += (lo - rig.lo) * HT.ease;
                rig.hi += (hi - rig.hi) * HT.ease;
                var span = Math.max(24, rig.hi - rig.lo);

                var lum = rig.lum;
                for (i = 0; i < n; i++) {
                    var v = (raw[i] - rig.lo) / span;
                    v = v < 0 ? 0 : v > 1 ? 1 : v;
                    // 2 · s-curve: v + k·(smoothstep − v)
                    var s3 = v * v * (3 - 2 * v);
                    lum[i] = v + HT.scurve * (s3 - v);
                }

                // 3 · Sobel on the levelled tone, folded into coverage
                var W = cols;
                for (var y2 = 1; y2 < rows - 1; y2++) {
                    var r0 = (y2 - 1) * W, r1 = y2 * W, r2 = (y2 + 1) * W;
                    for (var x2 = 1; x2 < W - 1; x2++) {
                        var a = lum[r0 + x2 - 1], b = lum[r0 + x2], c = lum[r0 + x2 + 1];
                        var d2 = lum[r1 + x2 - 1],                  e2 = lum[r1 + x2 + 1];
                        var f = lum[r2 + x2 - 1], g = lum[r2 + x2], h2 = lum[r2 + x2 + 1];
                        var gx = (c + 2 * e2 + h2) - (a + 2 * d2 + f);
                        var gy = (f + 2 * g + h2) - (a + 2 * b + c);
                        var mag = Math.sqrt(gx * gx + gy * gy) * .7;
                        rig.cov2[r1 + x2] = mag > 1 ? 1 : mag;
                    }
                }

                // 4 · combine, then shape through the per-placement tone table
                var cov2 = rig.cov2;
                for (i = 0; i < n; i++) {
                    var t2 = lum[i] * HT.body + cov2[i] * HT.edge;
                    lum[i] = tone[(t2 > 1 ? 1 : t2) * 255 | 0];
                }

                // the shader's cell hash, kept so the idle field is stable across
                // resizes rather than reshuffling. Fixed per layout, so it is built
                // once here rather than re-rolled on every frame of a live rig.
                if (!rig.seeded) {
                    for (i = 0; i < n; i++) {
                        var hsh = Math.sin((i % cols) * 12.9898 + ((i / cols) | 0) * 78.233) * 43758.5453;
                        rig.rest[i] = (hsh - Math.floor(hsh)) > .5 ? 1 : 0;
                    }
                    rig.seeded = true;
                }
                rig.ready = true;
                // only now is there a grid worth showing. Hiding the source any
                // earlier means a failed read (a tainted canvas under file://)
                // leaves an empty black panel instead of the plain photograph.
                host.classList.add("is-halftone");
            };

            rig.step = function (dt, settled) {
                if (!rig.ready) return;
                var cov = rig.cov, lum = rig.lum, cols = rig.cols, rows = rig.rows;
                // once the develop is long past due, land on the target outright
                // rather than easing — frames may have been suspended for minutes
                var k = settled ? 1 : (1 - Math.exp(-dt / rig.tau));
                var moving = false;

                for (var y = 0; y < rows; y++) {
                    // the reveal runs as a soft front down the frame, so the
                    // picture develops rather than fading up all at once
                    var front = clamp(rig.reveal * 1.45 - (y / rows) * .45, 0, 1);
                    front = front * front * (3 - 2 * front);
                    var row = y * cols;
                    for (var x = 0; x < cols; x++) {
                        var i = row + x;
                        var t = lum[i] * front;
                        var d = t - cov[i];
                        if (d > .0015 || d < -.0015) { cov[i] += d * k; moving = true; }
                        else cov[i] = t;
                    }
                }
                if (moving) rig.dirty = true;
            };

            rig.paint = function () {
                var c = rig.ctx, cell = rig.cell, cols = rig.cols, n = cols * rig.rows;
                var cov = rig.cov, rest = rig.rest;
                var span = HT.max - HT.min;

                c.clearRect(0, 0, rig.w, rig.h);

                c.beginPath();
                for (var i = 0; i < n; i++) {
                    var v = cov[i];
                    if (v <= .012) continue;
                    var half = (HT.min + span * v) * cell;
                    c.rect((i % cols) * cell + cell / 2 - half,
                           ((i / cols) | 0) * cell + cell / 2 - half,
                           half * 2, half * 2);
                }
                c.fillStyle = HT.block;
                c.fill();

                var r = HT.idle * cell;
                c.beginPath();
                for (i = 0; i < n; i++) {
                    if (!rest[i] || cov[i] > .30) continue;
                    c.rect((i % cols) * cell + cell / 2 - r,
                           ((i / cols) | 0) * cell + cell / 2 - r,
                           r * 2, r * 2);
                }
                c.fillStyle = HT.rest;
                c.fill();
            };

            var start = function () {
                if (rig.ready) return;
                rig.measure();
                rig.dirty = true;
            };
            if (img.complete && img.naturalWidth) start();
            else img.addEventListener("load", start, { once: true });

            if ("ResizeObserver" in window) {
                new ResizeObserver(function () { rig.measure(); }).observe(host);
            } else {
                window.addEventListener("resize", function () { rig.measure(); });
            }

            rigs.push(rig);
        });

        if (!rigs.length) return null;

        /* Deliberately no IntersectionObserver here. The grid is not decoration
           layered over a photograph — it IS the photograph, so anything that can
           fail to fire takes the image with it. The proximity test rides along
           in the paint loop instead: if frames are running the picture develops,
           and if they are not then nothing was going to draw anyway. */
        var near = function (host) {
            var vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 640);
            var r = host.getBoundingClientRect();
            return r.top < vh * 1.25 && r.bottom > vh * -0.25;
        };

        var DEVELOP = 1150;          // ms for the reveal front to cross the frame
        var prev = 0;

        return function () {
            var now = performance.now();
            // a generous clamp: frames stop entirely in a background tab, and on
            // return the grid should catch up in one step, not crawl back
            var dt = prev ? Math.min(.25, (now - prev) / 1000) : 0;
            prev = now;

            for (var i = 0; i < rigs.length; i++) {
                var rig = rigs[i];
                if (!rig.ready) { rig.measure(); continue; }

                if (!rig.lit && near(rig.host)) { rig.lit = true; rig.litAt = now; }
                if (!rig.lit) continue;

                // pick the frame the runway is pointing at, and re-read the sheet
                // only when that lands on a different one — a parked scrub costs
                // nothing, and the grid never redraws for sub-frame scrolling.
                // data-scrub-end reserves the tail of the runway for whatever the
                // stage does after the footage (here, the whiteout): the clip
                // spends itself over [0, end] and then holds its last frame.
                if (rig.live && rig.stage) {
                    var sr = rig.stage.getBoundingClientRect();
                    var run = sr.height - (window.innerHeight || 640);
                    var pr = run > 0 ? clamp(-sr.top / run, 0, 1) : 0;
                    var end = parseFloat(rig.stage.getAttribute("data-scrub-end"));
                    if (!isFinite(end) || end <= 0 || end > 1) end = 1;

                    // footage spends itself over [0, end]; the leftover tail is
                    // the dive into the zoom target on the held last frame
                    var f = Math.round(clamp(pr / end, 0, 1) * (rig.sheet.count - 1));
                    var zt = end < 1 ? clamp((pr - end) / (1 - end), 0, 1) : 0;

                    if (f !== rig.at || Math.abs(zt - rig.zt) > .004) {
                        rig.at = rig.frame = f;
                        rig.zt = zt;
                        rig.sample();
                        rig.dirty = true;
                    }
                }

                var age = now - rig.litAt;
                /* Wall clock, not summed frame deltas — a tab that was away for a
                   minute should come back to a settled picture, not replay the
                   whole develop from the first frame it is granted.
                   A live rig has no develop at all: it is already showing a frame
                   and the playhead is what moves, so it stays fully open and
                   keeps the short-tau easing rather than ever snapping. */
                var next = (reduced || rig.live) ? 1 : clamp(age / DEVELOP, 0, 1);
                if (next !== rig.reveal) { rig.reveal = next; rig.dirty = true; }

                rig.step(dt, !rig.live && age > DEVELOP + 1500);
                if (rig.dirty) { rig.paint(); rig.dirty = false; }
            }
        };
    }

    /* ─────────────────────────────  SCRUB  ─────────────────────────────
       The reference's landing: a tall runway with a pinned stage inside it, and
       scroll position mapped straight onto video.currentTime. The clip is never
       played — it is a strip of frames the reader drags a playhead across.

       Two details make or break it. The clip must be encoded with keyframes
       every couple of frames, or every seek has to decode forward from a distant
       keyframe and the scrub tears. And it is never handed to play(), because a
       playing video fights the playhead you are setting.

       Frames here are not shown directly — the halftone rig above samples this
       element every time its time changes, so what lands on screen is the room
       redrawn as dots. */
    function scrub() {
        var stage = $("[data-scrub]");
        if (!stage) return null;

        var progress = -1;
        var landed = false;

        var tick = function () {
            var r = stage.getBoundingClientRect();
            var runway = r.height - (window.innerHeight || 640);
            // reduced motion collapses the runway in CSS, which lands here as
            // nothing to scrub — the grid holds whichever frame it opened on
            if (runway <= 0) return;

            var p = clamp(-r.top / runway, 0, 1);
            if (Math.abs(p - progress) < .0004) return;

            /* The cut. Once the flash reaches full white there is nothing left
               to scrub — making the reader push through another viewport of
               blank white before the next section arrives is dead scroll. So
               the moment the whiteout completes on the way DOWN, jump straight
               to the next section: the flash is the cover for the cut, exactly
               as it is in film. Crossing detection, not a threshold test — a
               page restored mid-way or scrolled upward through white must not
               fire it — and it re-arms only after backing well out of the dive,
               so easing near the end cannot double-trigger. */
            if (progress >= 0 && !landed && progress < .995 && p >= .995) {
                landed = true;
                progress = 1;
                stage.style.setProperty("--p", "1.0000");
                window.scrollTo(0, Math.round(window.scrollY + r.top + r.height));
                return;
            }
            if (landed && p < .9) landed = false;

            progress = p;
            stage.style.setProperty("--p", p.toFixed(4));
        };

        // --p feeds the whiteout and the copy fade, so it follows scroll even
        // when the frame loop is throttled (background tab, low-power mode) —
        // same lesson as the reveal safety net: never gate CSS state on rAF
        window.addEventListener("scroll", tick, { passive: true });

        return tick;
    }

    /* ─────────────────────────────  DOT GLOBE  ─────────────────────────────
       The reference's other dot animation: a sphere of dots turning slowly
       behind its scale claim. Ported from its canvas loop, keeping the pieces
       that give it weight —

         · dots are drawn as flat rects, WIDER than they are tall, so the
           sphere reads as latitude rows rather than a cloud of specks
         · both size and alpha scale with how squarely a dot faces the viewer,
           and anything past the limb is dropped, which is what sells the
           curvature without any shading
         · it turns at a steady 7.2°/sec and eases its tilt toward 16°

       Points are laid out on a Fibonacci sphere, which spaces them evenly
       without the pole-crowding a lat/lon grid gives you. */
    function globe() {
        var host = $("[data-globe]");
        if (!host) return null;

        var canvas = document.createElement("canvas");
        canvas.setAttribute("aria-hidden", "true");
        host.appendChild(canvas);
        var ctx = canvas.getContext("2d");
        if (!ctx) return null;

        var N = 2800;
        var pts = new Float32Array(N * 4);          // x, y, z, weight
        var golden = Math.PI * (3 - Math.sqrt(5));
        for (var i = 0; i < N; i++) {
            var y = 1 - (i / (N - 1)) * 2;
            var r = Math.sqrt(Math.max(0, 1 - y * y));
            var th = golden * i;
            pts[i * 4]     = Math.cos(th) * r;
            pts[i * 4 + 1] = y;
            pts[i * 4 + 2] = Math.sin(th) * r;
            // a stable per-dot weight so the field has texture instead of
            // reading as a machine-perfect lattice
            var h = Math.sin(i * 12.9898) * 43758.5453;
            pts[i * 4 + 3] = .45 + .55 * (h - Math.floor(h));
        }

        // the places behind the work on this page, as lat/lon
        var marks = [
            [41.14, -73.26],    // Fairfield, CT
            [40.91, -73.12],    // Stony Brook, NY
            [40.77, -73.11],    // Bohemia, NY
            [41.32, -73.09],    // Shelton, CT
            [37.77, -122.42]    // San Francisco, CA
        ].map(function (p) {
            var la = p[0] * Math.PI / 180, lo = p[1] * Math.PI / 180;
            return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
        });

        var spin = 0, tilt = 0, size = 0, dpr = 1, prev = 0;

        var measure = function () {
            var w = Math.round(host.getBoundingClientRect().width);
            var d = Math.min(2, window.devicePixelRatio || 1);
            if (w === size && d === dpr) return;
            size = w; dpr = d;
            canvas.width = Math.round(w * d);
            canvas.height = Math.round(w * d);
            canvas.style.width = w + "px";
            canvas.style.height = w + "px";
        };
        measure();
        if ("ResizeObserver" in window) new ResizeObserver(measure).observe(host);
        else window.addEventListener("resize", measure);

        return function () {
            if (size <= 0) { measure(); return; }

            var now = performance.now();
            var dt = prev ? Math.min(.25, (now - prev) / 1000) : 0;
            prev = now;

            if (!reduced) spin = (spin + 7.2 * dt) % 360;
            tilt += (16 - tilt) * (1 - Math.exp(-dt / .5));

            var rad = Math.PI / 180;
            var g = spin * rad, t = tilt * rad;
            var cw = Math.cos(g), sw = Math.sin(g);
            var ck = Math.cos(t), sk = Math.sin(t);
            var S = size / 2, R = .92 * S;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, size, size);

            ctx.beginPath();
            ctx.arc(S, S, R, 0, 2 * Math.PI);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255,255,255,.13)";
            ctx.stroke();

            var unit = 2 * R * rad;
            ctx.fillStyle = "#FFFFFF";
            for (i = 0; i < N; i++) {
                var p = i * 4;
                var ax = pts[p], ay = pts[p + 1], az = pts[p + 2], wt = pts[p + 3];
                var s = ax * cw - az * sw;
                var face = sk * ay + ck * s;              // toward the viewer
                if (face <= .015) continue;               // past the limb
                var dw = unit * (.3 + .42 * face) * wt;
                var dh = Math.max(.75, .3 * unit * wt);
                ctx.globalAlpha = (.18 + .44 * face) * wt;
                ctx.fillRect(S + R * (az * cw + ax * sw) - dw / 2,
                             S - R * (ck * ay - sk * s) - dh / 2, dw, dh);
            }

            var m = Math.max(2, .013 * R);
            ctx.fillStyle = "#2C63FF";
            for (i = 0; i < marks.length; i++) {
                var q = marks[i];
                var s2 = q[0] * cw - q[2] * sw;
                var f2 = sk * q[1] + ck * s2;
                if (f2 <= .03) continue;
                ctx.globalAlpha = .35 + .65 * f2;
                ctx.fillRect(S + R * (q[2] * cw + q[0] * sw) - m / 2,
                             S - R * (ck * q[1] - sk * s2) - m / 2, m, m);
            }
            ctx.globalAlpha = 1;
        };
    }

    /* ─────────────────────────────  COUNTERS  ─────────────────────────────
       The figures in Receipts run up to their value the first time the card
       lands. Only elements carrying data-count animate — "4:54" is a time, not
       a quantity, so it is left alone rather than counted through nonsense. */
    function counters() {
        var els = $$("[data-count]");
        if (!els.length) return;

        if (reduced || !("IntersectionObserver" in window)) return;   // markup already holds the final value

        var run = function (el) {
            var end = parseFloat(el.getAttribute("data-count"));
            if (!isFinite(end)) return;
            var suffix = el.getAttribute("data-suffix") || "";
            var dur = 1500;
            var t0 = performance.now();
            var settled = false;

            /* These figures are claims, not decoration — 5% and 50% are not the
               same sentence. A bare rAF chain can be suspended mid-count (a
               backgrounded tab, a stalled compositor) and strand the number at
               whatever partial value it had reached, so a timer guarantees the
               true value lands regardless of whether the frames keep coming. */
            var settle = function () {
                if (settled) return;
                settled = true;
                el.textContent = end + suffix;
            };
            var backstop = setTimeout(settle, dur + 400);

            (function step(now) {
                if (settled) return;
                var p = clamp((now - t0) / dur, 0, 1);
                if (p >= 1) { clearTimeout(backstop); settle(); return; }
                el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;  // ease-out cubic
                requestAnimationFrame(step);
            })(t0);
        };

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                run(entry.target);
                io.unobserve(entry.target);
            });
        }, { threshold: 0.6 });

        els.forEach(function (el) { io.observe(el); });
    }

    /* ─────────────────────────────  SCRUBBED WORDS  ─────────────────────────────
       The manifesto lights up word by word as it crosses the viewport. */
    function words() {
        var el = $("[data-words]");
        if (!el) return null;

        var text = el.textContent.replace(/\s+/g, " ").trim();
        el.textContent = "";
        // the gap lives between the boxes, not inside them — an inline-block
        // eats a trailing space and the sentence closes up
        var spans = text.split(" ").map(function (w, i, arr) {
            var s = document.createElement("span");
            s.className = "w";
            s.textContent = w;
            el.appendChild(s);
            if (i < arr.length - 1) el.appendChild(document.createTextNode(" "));
            return s;
        });

        if (reduced) {
            spans.forEach(function (s) { s.style.opacity = 1; });
            return null;
        }

        return function () {
            var r = el.getBoundingClientRect();
            // 0 when the block enters from below, 1 once it has cleared the middle
            var p = clamp(1 - (r.top - innerHeight * 0.18) / (innerHeight * 0.62), 0, 1);
            var lit = p * spans.length;
            for (var i = 0; i < spans.length; i++) {
                spans[i].style.opacity = clamp(lit - i, 0, 1) * 0.84 + 0.16;
            }
        };
    }

    /* ─────────────────────────────  MARQUEES  ─────────────────────────────
       Base drift plus scroll velocity, so the strips lean into the scroll. */
    function marquees() {
        var rigs = $$("[data-marquee]").map(function (root) {
            var track = $("[data-marquee-track]", root);
            if (!track) return null;

            var original = track.innerHTML;
            track.innerHTML = original + original;          // seamless wrap

            return {
                track: track,
                x: 0,
                width: 0,
                speed: parseFloat(root.getAttribute("data-marquee-speed")) || 0.5,
                measure: function () { this.width = track.scrollWidth / 2; }
            };
        }).filter(Boolean);

        rigs.forEach(function (r) { r.measure(); });
        window.addEventListener("resize", function () { rigs.forEach(function (r) { r.measure(); }); });

        if (reduced) return null;

        return function () {
            var boost = clamp(scroll.velocity * 0.35, -26, 26);
            rigs.forEach(function (r) {
                if (!r.width) r.measure();
                r.x -= r.speed + boost;
                if (r.x <= -r.width) r.x += r.width;
                if (r.x > 0) r.x -= r.width;
                r.track.style.transform = "translate3d(" + r.x.toFixed(2) + "px,0,0)";
            });
        };
    }

    /* ─────────────────────────────  CHROME  ───────────────────────────── */
    function chrome() {
        var nav = $("#nav");
        var rail = $("#scrollRail");
        var hero = $(".hero");
        var lastY = 0;

        return function () {
            var y = window.scrollY;
            var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);

            if (nav) {
                // the bar only lands once the room is behind you — dropping a
                // backdrop over the hero at 40px would cut across the walk
                var past = hero ? hero.getBoundingClientRect().bottom <= 80 : y > 40;
                nav.classList.toggle("is-stuck", past);
                nav.classList.toggle("is-hidden", past && y > lastY + 2);
            }
            if (rail) rail.style.transform = "scaleY(" + (y / max).toFixed(4) + ")";
            lastY = y;
        };
    }

    /* ─────────────────────────────  BOOT  ───────────────────────────── */
    function boot() {
        document.documentElement.classList.add("js");

        var ticks = [];
        var reveal = null;
        try {
            smoothScroll();
            anchors();
            reveal = reveals();
            counters();
            // scrub before halftone: the playhead moves, then the grid re-reads it
            [scrub(), halftone(), globe(), cursor(), words(), marquees(), chrome()]
                .forEach(function (t) { if (t) ticks.push(t); });
        } catch (err) {
            // never leave the page stuck mid-reveal because one module threw
            $$("[data-rise], [data-split]").forEach(function (el) { el.classList.add("is-in"); });
            if (window.console) console.error(err);
        }

        (function frame() {
            smoothScrollTick();
            for (var i = 0; i < ticks.length; i++) ticks[i]();
            requestAnimationFrame(frame);
        })();

        preloader().then(function () {
            if (reveal) reveal();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
