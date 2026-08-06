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
    var scroll = { current: 0, target: 0, velocity: 0, active: false };

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
                    // labelled chip rides just off the pointer
                    tw = Math.max(64, label.offsetWidth + 24);
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

            b.x = lerp(b.x, tx, snap ? 0.22 : 0.16);
            b.y = lerp(b.y, ty, snap ? 0.22 : 0.16);
            b.w = lerp(b.w, tw, 0.22);
            b.h = lerp(b.h, th, 0.22);

            blob.style.width = b.w.toFixed(1) + "px";
            blob.style.height = b.h.toFixed(1) + "px";
            blob.style.transform = "translate(" + (b.x - b.w / 2).toFixed(1) + "px," + (b.y - b.h / 2).toFixed(1) + "px)";

            d.x = lerp(d.x, mouse.x, 0.42);
            d.y = lerp(d.y, mouse.y, 0.42);
            dot.style.transform = "translate(" + (d.x - 4).toFixed(1) + "px," + (d.y - 4).toFixed(1) + "px)";
        }

        return tick;
    }

    /* ─────────────────────────────  SPLIT TEXT  ─────────────────────────────
       Each character gets its own overflow-hidden box so the glyph can slide up
       from behind the line. <br> and spacing survive the walk. */
    function split(el) {
        var out = [];
        var idx = 0;

        function walk(node, into) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) {
                    child.textContent.split("").forEach(function (c) {
                        if (c === " " || c === "\n") {
                            into.appendChild(document.createTextNode(" "));
                            return;
                        }
                        var span = document.createElement("span");
                        span.className = "ch";
                        var inner = document.createElement("i");
                        inner.textContent = c;
                        inner.style.setProperty("--d", (idx * 16) + "ms");
                        idx++;
                        span.appendChild(inner);
                        into.appendChild(span);
                        out.push(span);
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
        return out;
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
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-in");
                io.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

        targets.forEach(function (el) { io.observe(el); });
    }

    /* ─────────────────────────────  SCRUBBED WORDS  ─────────────────────────────
       The manifesto lights up word by word as it crosses the viewport. */
    function words() {
        var el = $("[data-words]");
        if (!el) return null;

        var text = el.textContent.replace(/\s+/g, " ").trim();
        el.textContent = "";
        var spans = text.split(" ").map(function (w, i, arr) {
            var s = document.createElement("span");
            s.className = "w";
            s.textContent = w + (i < arr.length - 1 ? " " : "");
            el.appendChild(s);
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
        var heroImg = $("#heroImg");
        var lastY = 0;

        return function () {
            var y = window.scrollY;
            var max = Math.max(1, document.documentElement.scrollHeight - innerHeight);

            if (nav) {
                nav.classList.toggle("is-stuck", y > 40);
                // hide on the way down, reveal on the way up — but never over the hero
                nav.classList.toggle("is-hidden", y > 320 && y > lastY + 2);
            }
            if (rail) rail.style.transform = "scaleY(" + (y / max).toFixed(4) + ")";
            if (heroImg && y < innerHeight * 1.2 && !reduced) {
                heroImg.style.transform = "translate3d(0," + (y * 0.16).toFixed(1) + "px,0)";
            }
            lastY = y;
        };
    }

    /* ─────────────────────────────  BOOT  ───────────────────────────── */
    function boot() {
        document.documentElement.classList.add("js");

        var ticks = [];
        try {
            smoothScroll();
            anchors();
            reveals();
            [cursor(), words(), marquees(), chrome()].forEach(function (t) { if (t) ticks.push(t); });
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

        preloader();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
