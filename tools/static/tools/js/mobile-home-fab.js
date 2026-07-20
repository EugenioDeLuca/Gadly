(function() {
    var STORAGE_KEY = "gadly-home-fab-pos";
    var INTRO_KEY = "gadly-home-fab-intro-shown";
    var INTRO_CLASS = "mobile-home-fab--intro-pulse";
    var USER_POS_CLASS = "mobile-home-fab--user-positioned";
    var LAYOUT_PENDING_CLASS = "mobile-home-fab--layout-pending";
    /** Lato FAB utente in CSS (coerente con .mobile-home-fab--user-positioned). */
    var FAB_USER_PX = 62;
    var isHomepage = function() { return document.body.classList.contains("homepage"); };
    var inited = false;
    var MARGIN = 8;
    var MIN_R = 28;
    /** Schermi larghi (es. 34"): più distanza dai bordi per clamp e ancoraggio proporzionale. */
    function fabEdgeMarginPx(iw) {
        iw = iw != null ? iw : layoutW();
        if (iw >= 2560) return 34;
        if (iw >= 2200) return 26;
        if (iw >= 1920) return 22;
        return MARGIN;
    }
    function fabMinRightInsetPx(iw) {
        iw = iw != null ? iw : layoutW();
        if (iw >= 3840) return 96;
        if (iw >= 3440) return 84;
        if (iw >= 2560) return 72;
        if (iw >= 2200) return 56;
        if (iw >= 1920) return 48;
        /* Mobile/tablet: FAB fino quasi al bordo destro (prima MIN_R=28 bloccava ~2 cm) */
        if (iw > 0 && iw <= 1280) return MARGIN;
        return MIN_R;
    }
    function fabDefaultRightStr() {
        var iw = layoutW();
        if (iw >= 2560) return "64px";
        if (iw >= 2200) return "56px";
        if (iw >= 1920) return "52px";
        return "28px";
    }
    function fabDefaultBottomStr() {
        var iw = layoutW();
        if (iw >= 2560) return "calc(144px + env(safe-area-inset-bottom))";
        if (iw >= 2200) return "calc(132px + env(safe-area-inset-bottom))";
        if (iw >= 1920) return "calc(124px + env(safe-area-inset-bottom))";
        return "calc(96px + env(safe-area-inset-bottom))";
    }
    /**
     * v17: `right` e `bottom` in % di innerWidth / innerHeight.
     * Schermo più largo/alto → più pixel dal bordo con la stessa posizione “logica”.
     */
    var POS_SCHEMA = 17;
    /** Durante drag: non usare innerWidth/innerHeight che cambiano a metà gesto. */
    var fabDragIw = null;
    var fabDragIh = null;

    function parseFabPx(propVal) {
        if (!propVal || typeof propVal !== "string") return null;
        var t = propVal.trim();
        if (!t || t.indexOf("px") === -1) return null;
        var n = parseFloat(t);
        return isNaN(n) ? null : Math.round(n);
    }

    function markIntroShown() {
        try {
            localStorage.setItem(INTRO_KEY, "1");
        } catch (e) {}
    }

    function dismissIntroPulse(fab) {
        if (!fab.classList.contains(INTRO_CLASS)) return;
        fab.classList.remove(INTRO_CLASS);
        markIntroShown();
    }

    function maybeStartIntroPulse(fab, link) {
        try {
            if (localStorage.getItem(INTRO_KEY) === "1") return;
        } catch (e) {
            return;
        }
        if (!link) return;
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            markIntroShown();
            return;
        }
        fab.classList.add(INTRO_CLASS);
        setTimeout(function() {
            dismissIntroPulse(fab);
        }, 1500);
    }

    function layoutW() {
        var w =
            typeof window.innerWidth === "number" && window.innerWidth > 0
                ? window.innerWidth
                : (document.documentElement && document.documentElement.clientWidth) || 0;
        return Math.round(w);
    }
    function layoutH() {
        var h =
            typeof window.innerHeight === "number" && window.innerHeight > 0
                ? window.innerHeight
                : (document.documentElement && document.documentElement.clientHeight) || 0;
        return Math.round(h);
    }

    /**
     * Usa il rettangolo del visual viewport solo quando è davvero diverso dal layout
     * (mobile: barra indirizzi, zoom, overscroll). Su desktop evita mismatch sub-pixel
     * tra vv e innerWidth che “ballano” il FAB.
     */
    function useVisualViewportForFab() {
        var vv = window.visualViewport;
        if (!vv || vv.width <= 0 || vv.height <= 0) return false;
        if (typeof vv.scale === "number" && vv.scale > 1.02) return true;
        if (Math.abs(vv.offsetLeft) > 1) return true;
        if (Math.abs(vv.offsetTop) > 1) return true;
        var iw = layoutW();
        var ih = layoutH();
        if (ih > 0 && vv.height < ih - 40) return true;
        if (iw > 0 && vv.width < iw - 40) return true;
        return false;
    }

    function layoutWForClamp() {
        return fabDragIw != null ? fabDragIw : layoutW();
    }
    function layoutHForClamp() {
        return fabDragIh != null ? fabDragIh : layoutH();
    }

    function legacyFabSideForMigration(iw) {
        if (iw > 0 && iw <= 768) return 58;
        return 62;
    }

    function layoutFabSide() {
        var w = layoutW();
        if (w > 0 && w <= 768) return 58;
        return 62;
    }

    function layoutFabSideForEl(fab) {
        if (fab && fab.classList.contains(USER_POS_CLASS)) {
            var w = layoutW();
            return (w > 0 && w <= 768) ? 58 : FAB_USER_PX;
        }
        return layoutFabSide();
    }

    function clamp01(t) {
        return Math.max(0, Math.min(1, t));
    }

    /** px CSS con 2 decimali: meno quantizzazione di Math.round (±0,5px) → meno “salto” al resize / dopo drag. */
    function posPx(n) {
        var x = Number(n);
        if (!isFinite(x)) x = 0;
        return (Math.round(x * 100) / 100) + "px";
    }

    function clampLTValues(iw, ih, S, left, top) {
        if (iw <= 0 || ih <= 0) {
            return { left: left, top: top };
        }
        var m = fabEdgeMarginPx(iw);
        var minR = fabMinRightInsetPx(iw);
        var maxL = Math.max(m, iw - S - minR);
        var maxT = Math.max(m, ih - S - m);
        return {
            left: Math.max(m, Math.min(maxL, left)),
            top: Math.max(m, Math.min(maxT, top))
        };
    }

    function movableW(iw, S) {
        var m = fabEdgeMarginPx(iw);
        var minR = fabMinRightInsetPx(iw);
        var maxL = Math.max(m, iw - S - minR);
        return Math.max(0, maxL - m);
    }
    function movableH(ih, S, iw) {
        iw = iw != null ? iw : layoutW();
        var m = fabEdgeMarginPx(iw);
        var maxT = Math.max(m, ih - S - m);
        return Math.max(0, maxT - m);
    }

    function normSlStFromLayoutLT(iw, ih, S, left, top) {
        var c = clampLTValues(iw, ih, S, left, top);
        var mw = movableW(iw, S);
        var mh = movableH(ih, S, iw);
        var m = fabEdgeMarginPx(iw);
        return {
            sl: mw <= 0 ? 0.5 : clamp01((c.left - m) / mw),
            st: mh <= 0 ? 0.5 : clamp01((c.top - m) / mh)
        };
    }

    function leftTopFromNorm(iw, ih, S, nx, ny) {
        var m = fabEdgeMarginPx(iw);
        var mw = movableW(iw, S);
        var mh = movableH(ih, S, iw);
        var left = mw <= 0 ? m : m + nx * mw;
        var top = mh <= 0 ? m : m + ny * mh;
        return { left: left, top: top };
    }

    function rSpanForRB(iw, S) {
        var m = fabEdgeMarginPx(iw);
        var minR = fabMinRightInsetPx(iw);
        return Math.max(0, iw - S - m - minR);
    }
    function bSpanForRB(ih, S, iw) {
        iw = iw != null ? iw : layoutW();
        var m = fabEdgeMarginPx(iw);
        return Math.max(0, ih - S - 2 * m);
    }

    function normFromRB(iw, ih, S, r, b) {
        var m = fabEdgeMarginPx(iw);
        var minR = fabMinRightInsetPx(iw);
        var rs = rSpanForRB(iw, S);
        var bs = bSpanForRB(ih, S, iw);
        var nr = rs > 0 ? clamp01((r - minR) / rs) : 0.5;
        var nb = bs > 0 ? clamp01((b - m) / bs) : 0.5;
        return { nr: nr, nb: nb };
    }

    function rbFromNorm(iw, ih, S, nr, nb) {
        nr = clamp01(nr);
        nb = clamp01(nb);
        var m = fabEdgeMarginPx(iw);
        var minR = fabMinRightInsetPx(iw);
        var rs = rSpanForRB(iw, S);
        var bs = bSpanForRB(ih, S, iw);
        var r = minR + nr * rs;
        var b = m + nb * bs;
        r = Math.max(minR, Math.min(iw - S - m, r));
        b = Math.max(m, Math.min(ih - S - m, b));
        return { r: Math.round(r), b: Math.round(b) };
    }

    function fabSizeForClamp(fab) {
        return layoutFabSideForEl(fab);
    }

    function visualClampBox(fab) {
        var vv = window.visualViewport;
        if (!vv || vv.width <= 0 || vv.height <= 0) return null;
        if (!useVisualViewportForFab()) return null;
        var S = fabSizeForClamp(fab);
        var iw = layoutW();
        var m = fabEdgeMarginPx(iw);
        var minR = fabMinRightInsetPx(iw);
        var minL = vv.offsetLeft + m;
        var maxL = vv.offsetLeft + Math.max(m, vv.width - S - minR);
        var minT = vv.offsetTop + m;
        var maxT = vv.offsetTop + Math.max(m, vv.height - S - m);
        return { vv: vv, minL: minL, maxL: maxL, minT: minT, maxT: maxT };
    }

    function normFromFabRect(rect, fab) {
        var S = fabSizeForClamp(fab);
        var box = visualClampBox(fab);
        if (box) {
            var spanL = box.maxL - box.minL;
            var spanT = box.maxT - box.minT;
            var sl = spanL <= 0 ? 0.5 : clamp01((rect.left - box.minL) / spanL);
            var st = spanT <= 0 ? 0.5 : clamp01((rect.top - box.minT) / spanT);
            return { sl: sl, st: st };
        }
        var iw = layoutW();
        var ih = layoutH();
        return normSlStFromLayoutLT(iw, ih, S, rect.left, rect.top);
    }

    function applyNorm(fab, sl, st) {
        sl = clamp01(sl);
        st = clamp01(st);
        var box = visualClampBox(fab);
        if (box) {
            var spanL = box.maxL - box.minL;
            var spanT = box.maxT - box.minT;
            var left = box.minL + sl * (spanL <= 0 ? 0 : spanL);
            var top = box.minT + st * (spanT <= 0 ? 0 : spanT);
            fab.classList.add(USER_POS_CLASS);
            fab.style.setProperty("left", posPx(left), "important");
            fab.style.setProperty("top", posPx(top), "important");
            fab.style.setProperty("right", "auto", "important");
            fab.style.setProperty("bottom", "auto", "important");
            fab.style.transform = "none";
            return;
        }
        var iw = layoutW();
        var ih = layoutH();
        var S = fabSizeForClamp(fab);
        var m = fabEdgeMarginPx(iw);
        var mw = movableW(iw, S);
        var mh = movableH(ih, S, iw);
        var left2 = m + sl * (mw <= 0 ? 0 : mw);
        var top2 = m + st * (mh <= 0 ? 0 : mh);
        fab.classList.add(USER_POS_CLASS);
        fab.style.setProperty("left", posPx(left2), "important");
        fab.style.setProperty("top", posPx(top2), "important");
        fab.style.setProperty("right", "auto", "important");
        fab.style.setProperty("bottom", "auto", "important");
        fab.style.transform = "none";
    }

    function applyRB(fab, r, b) {
        fab.classList.add(USER_POS_CLASS);
        fab.style.setProperty("right", r + "px", "important");
        fab.style.setProperty("bottom", b + "px", "important");
        fab.style.setProperty("left", "auto", "important");
        fab.style.setProperty("top", "auto", "important");
        fab.style.transform = "none";
    }

    function clampPRPB(pr, pb, iw, ih, S) {
        if (iw <= 0 || ih <= 0) return { pr: pr, pb: pb };
        var r = (Number(pr) / 100) * iw;
        var b = (Number(pb) / 100) * ih;
        var cr = clampRB(r, b, iw, ih, S);
        return { pr: (cr.r / iw) * 100, pb: (cr.b / ih) * 100 };
    }

    function posPct(n) {
        var x = Number(n);
        if (!isFinite(x)) x = 0;
        return (Math.round(x * 10000) / 10000) + "%";
    }

    function applyRBPercent(fab, pr, pb) {
        fab.classList.add(USER_POS_CLASS);
        fab.style.setProperty("right", posPct(pr), "important");
        fab.style.setProperty("bottom", posPct(pb), "important");
        fab.style.setProperty("left", "auto", "important");
        fab.style.setProperty("top", "auto", "important");
        fab.style.transform = "none";
    }

    /** Inset destro/basso (px layout) clampati alla finestra corrente. */
    function clampRB(r, b, iw, ih, S) {
        if (iw <= 0 || ih <= 0) {
            return { r: Math.round(r), b: Math.round(b) };
        }
        var m = fabEdgeMarginPx(iw);
        var minR = fabMinRightInsetPx(iw);
        var rmax = iw - S - m;
        var bmax = ih - S - m;
        return {
            r: Math.max(minR, Math.min(rmax, Math.round(r))),
            b: Math.max(m, Math.min(bmax, Math.round(b)))
        };
    }

    /** v17: inset in % viewport; legacy r/b o nr/nb → %. */
    function applyFabDual(fab, rec) {
        fab.classList.add(USER_POS_CLASS);
        var iw = layoutW();
        var ih = layoutH();
        var S = fabSizeForClamp(fab);
        if (typeof rec.pr === "number" && typeof rec.pb === "number") {
            var cp = clampPRPB(rec.pr, rec.pb, iw, ih, S);
            applyRBPercent(fab, cp.pr, cp.pb);
            return;
        }
        if (typeof rec.pr === "number" && typeof rec.bp === "number") {
            var cr1 = clampRB((Number(rec.pr) / 100) * iw, Number(rec.bp), iw, ih, S);
            var cp1 = clampPRPB((cr1.r / iw) * 100, (cr1.b / ih) * 100, iw, ih, S);
            applyRBPercent(fab, cp1.pr, cp1.pb);
            return;
        }
        if (typeof rec.r === "number" && typeof rec.b === "number") {
            var cr0 = clampRB(rec.r, rec.b, iw, ih, S);
            var cp0 = clampPRPB((cr0.r / iw) * 100, (cr0.b / ih) * 100, iw, ih, S);
            applyRBPercent(fab, cp0.pr, cp0.pb);
            return;
        }
        if (typeof rec.nr === "number" && typeof rec.nb === "number") {
            var rbN = rbFromNorm(iw, ih, S, rec.nr, rec.nb);
            var crN = clampRB(rbN.r, rbN.b, iw, ih, S);
            var cpN = clampPRPB((crN.r / iw) * 100, (crN.b / ih) * 100, iw, ih, S);
            applyRBPercent(fab, cpN.pr, cpN.pb);
            return;
        }
        if (typeof rec.sl === "number" && typeof rec.st === "number") {
            applyNorm(fab, clamp01(rec.sl), clamp01(rec.st));
        }
    }

    function applyVisualSnap(fab, sr, sb) {
        var vv = window.visualViewport;
        if (!vv) {
            return false;
        }
        var S = FAB_USER_PX;
        var l = vv.offsetLeft + vv.width - sr - S;
        var t = vv.offsetTop + vv.height - sb - S;
        fab.classList.add(USER_POS_CLASS);
        fab.style.setProperty("left", posPx(l), "important");
        fab.style.setProperty("top", posPx(t), "important");
        fab.style.setProperty("right", "auto", "important");
        fab.style.setProperty("bottom", "auto", "important");
        fab.style.transform = "none";
        return true;
    }

    function clearUserStyles(fab) {
        fab.classList.remove(USER_POS_CLASS);
        fab.style.removeProperty("left");
        fab.style.removeProperty("top");
        fab.style.removeProperty("right");
        fab.style.removeProperty("bottom");
        fab.style.right = fabDefaultRightStr();
        fab.style.bottom = fabDefaultBottomStr();
        fab.style.transform = "none";
        /* Rimuovi pending solo dopo aver applicato il canton default (evita un frame visibile “nel vuoto”). */
        fab.classList.remove(LAYOUT_PENDING_CLASS);
    }

    function savePosFromInsets(cr, sl, st) {
        var iw = layoutW();
        var ih = layoutH();
        var cr2 = clampRB(cr.r, cr.b, iw, ih, FAB_USER_PX);
        var pr0 = iw > 0 ? (cr2.r / iw) * 100 : 0;
        var pb0 = ih > 0 ? (cr2.b / ih) * 100 : 0;
        var cp = clampPRPB(pr0, pb0, iw, ih, FAB_USER_PX);
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    v: POS_SCHEMA,
                    pr: cp.pr,
                    pb: cp.pb,
                    r: cr2.r,
                    b: cr2.b,
                    sl: typeof sl === "number" ? clamp01(sl) : 0.5,
                    st: typeof st === "number" ? clamp01(st) : 0.5
                })
            );
        } catch (e) {}
        return {
            pr: cp.pr,
            pb: cp.pb,
            sl: typeof sl === "number" ? clamp01(sl) : 0.5,
            st: typeof st === "number" ? clamp01(st) : 0.5
        };
    }

    function migrateNxNyToPixel(fab, nx, ny, Sdecode) {
        var iw = layoutW();
        var ih = layoutH();
        var S = FAB_USER_PX;
        var lt = leftTopFromNorm(iw, ih, Sdecode, nx, ny);
        var c = clampLTValues(iw, ih, S, lt.left, lt.top);
        var n = normSlStFromLayoutLT(iw, ih, S, c.left, c.top);
        var r0 = Math.round(iw - c.left - S);
        var b0 = Math.round(ih - c.top - S);
        var cr = clampRB(r0, b0, iw, ih, S);
        fab.classList.add(USER_POS_CLASS);
        return savePosFromInsets(cr, n.sl, n.st);
    }

    function migrateLegacyToPixel(fab, p) {
        var iw = layoutW();
        var ih = layoutH();
        var Snew = FAB_USER_PX;
        var left;
        var top;
        if (typeof p.r === "number" && typeof p.b === "number") {
            left = iw - Number(p.r) - Snew;
            top = ih - Number(p.b) - Snew;
        } else if (typeof p.left === "number" && typeof p.top === "number") {
            left = p.left;
            top = p.top;
        } else if (typeof p.nx === "number" && typeof p.ny === "number") {
            var Sold = legacyFabSideForMigration(iw);
            var lt0 = leftTopFromNorm(iw, ih, Sold, p.nx, p.ny);
            left = lt0.left;
            top = lt0.top;
        } else {
            return null;
        }
        var c = clampLTValues(iw, ih, Snew, left, top);
        var n = normSlStFromLayoutLT(iw, ih, Snew, c.left, c.top);
        var r0 = Math.round(iw - c.left - Snew);
        var b0 = Math.round(ih - c.top - Snew);
        var cr = clampRB(r0, b0, iw, ih, Snew);
        fab.classList.add(USER_POS_CLASS);
        return savePosFromInsets(cr, n.sl, n.st);
    }

    function loadPos(fab) {
        try {
            var s = localStorage.getItem(STORAGE_KEY);
            if (!s) return null;
            var p = JSON.parse(s);
            if (p.v === POS_SCHEMA && typeof p.pr === "number" && typeof p.pb === "number") {
                fab.classList.add(USER_POS_CLASS);
                return {
                    pr: Number(p.pr),
                    pb: Number(p.pb),
                    sl: typeof p.sl === "number" ? clamp01(p.sl) : 0.5,
                    st: typeof p.st === "number" ? clamp01(p.st) : 0.5
                };
            }
            if (p.v === 16 && typeof p.r === "number" && typeof p.b === "number") {
                fab.classList.add(USER_POS_CLASS);
                var iw16 = layoutW();
                var ih16 = layoutH();
                var cr16 = clampRB(p.r, p.b, iw16, ih16, FAB_USER_PX);
                var sl16 = typeof p.sl === "number" ? clamp01(p.sl) : 0.5;
                var st16 = typeof p.st === "number" ? clamp01(p.st) : 0.5;
                return savePosFromInsets(cr16, sl16, st16);
            }
            if (p.v === 15) {
                fab.classList.add(USER_POS_CLASS);
                var iw15 = layoutW();
                var ih15 = layoutH();
                var cr15;
                if (typeof p.r === "number" && typeof p.b === "number") {
                    cr15 = clampRB(p.r, p.b, iw15, ih15, FAB_USER_PX);
                } else if (typeof p.pr === "number" && typeof p.bp === "number") {
                    cr15 = clampRB(
                        (Number(p.pr) / 100) * iw15,
                        Number(p.bp),
                        iw15,
                        ih15,
                        FAB_USER_PX
                    );
                } else if (typeof p.pr === "number" && typeof p.pb === "number") {
                    var r15 = (Number(p.pr) / 100) * iw15;
                    var b15 = (Number(p.pb) / 100) * ih15;
                    cr15 = clampRB(r15, b15, iw15, ih15, FAB_USER_PX);
                } else {
                    return null;
                }
                var sl15 = typeof p.sl === "number" ? clamp01(p.sl) : 0.5;
                var st15 = typeof p.st === "number" ? clamp01(p.st) : 0.5;
                return savePosFromInsets(cr15, sl15, st15);
            }
            if (p.v === 14 && typeof p.pr === "number" && typeof p.pb === "number") {
                fab.classList.add(USER_POS_CLASS);
                var iw14 = layoutW();
                var ih14 = layoutH();
                var r14 = (Number(p.pr) / 100) * iw14;
                var b14 = (Number(p.pb) / 100) * ih14;
                var cr14 = clampRB(r14, b14, iw14, ih14, FAB_USER_PX);
                var sl14 = typeof p.sl === "number" ? clamp01(p.sl) : 0.5;
                var st14 = typeof p.st === "number" ? clamp01(p.st) : 0.5;
                return savePosFromInsets(cr14, sl14, st14);
            }
            if (p.v === 13 && typeof p.nr === "number" && typeof p.nb === "number") {
                fab.classList.add(USER_POS_CLASS);
                var iw13 = layoutW();
                var ih13 = layoutH();
                var rb13 = rbFromNorm(iw13, ih13, FAB_USER_PX, p.nr, p.nb);
                var cr13 = clampRB(rb13.r, rb13.b, iw13, ih13, FAB_USER_PX);
                var sl13 = typeof p.sl === "number" ? clamp01(p.sl) : 0.5;
                var st13 = typeof p.st === "number" ? clamp01(p.st) : 0.5;
                return savePosFromInsets(cr13, sl13, st13);
            }
            if (p.v === 12 && typeof p.r === "number" && typeof p.b === "number") {
                fab.classList.add(USER_POS_CLASS);
                var iw12 = layoutW();
                var ih12 = layoutH();
                var cr12 = clampRB(p.r, p.b, iw12, ih12, FAB_USER_PX);
                var sl12 = typeof p.sl === "number" ? clamp01(p.sl) : 0.5;
                var st12 = typeof p.st === "number" ? clamp01(p.st) : 0.5;
                return savePosFromInsets(cr12, sl12, st12);
            }
            if (p.v === 11 && typeof p.sl === "number" && typeof p.st === "number") {
                fab.classList.add(USER_POS_CLASS);
                applyNorm(fab, clamp01(p.sl), clamp01(p.st));
                var iwM = layoutW();
                var ihM = layoutH();
                var rectM = fab.getBoundingClientRect();
                var crM = clampRB(
                    Math.round(iwM - rectM.right),
                    Math.round(ihM - rectM.bottom),
                    iwM,
                    ihM,
                    FAB_USER_PX
                );
                var nM = normFromFabRect(rectM, fab);
                return savePosFromInsets(crM, nM.sl, nM.st);
            }
            if ((p.v === 10 || p.v === 9) && typeof p.r === "number" && typeof p.b === "number") {
                fab.classList.add(USER_POS_CLASS);
                if (window.visualViewport && typeof p.sr === "number" && typeof p.sb === "number") {
                    applyVisualSnap(fab, p.sr, p.sb);
                } else {
                    applyRB(fab, Math.round(p.r), Math.round(p.b));
                }
                var iw10 = layoutW();
                var ih10 = layoutH();
                var rect10 = fab.getBoundingClientRect();
                var cr10 = clampRB(
                    Math.round(iw10 - rect10.right),
                    Math.round(ih10 - rect10.bottom),
                    iw10,
                    ih10,
                    FAB_USER_PX
                );
                var n10 = normFromFabRect(rect10, fab);
                return savePosFromInsets(cr10, n10.sl, n10.st);
            }
            if (p.v === 8 && typeof p.nr === "number" && typeof p.nb === "number") {
                fab.classList.add(USER_POS_CLASS);
                var iw8 = layoutW();
                var ih8 = layoutH();
                var S8 = layoutFabSideForEl(fab);
                var rb8 = rbFromNorm(iw8, ih8, S8, p.nr, p.nb);
                var left8 = iw8 - rb8.r - S8;
                var top8 = ih8 - rb8.b - S8;
                var c8 = clampLTValues(iw8, ih8, S8, left8, top8);
                var n8 = normSlStFromLayoutLT(iw8, ih8, S8, c8.left, c8.top);
                var cr8 = clampRB(rb8.r, rb8.b, iw8, ih8, S8);
                return savePosFromInsets(cr8, n8.sl, n8.st);
            }
            if (p.v === 7 && typeof p.r === "number" && typeof p.b === "number") {
                fab.classList.add(USER_POS_CLASS);
                var iw7 = layoutW();
                var ih7 = layoutH();
                var S7 = layoutFabSideForEl(fab);
                var n7 = normFromRB(iw7, ih7, S7, p.r, p.b);
                var rb7 = rbFromNorm(iw7, ih7, S7, n7.nr, n7.nb);
                var left7 = iw7 - rb7.r - S7;
                var top7 = ih7 - rb7.b - S7;
                var c7 = clampLTValues(iw7, ih7, S7, left7, top7);
                var n7b = normSlStFromLayoutLT(iw7, ih7, S7, c7.left, c7.top);
                var cr7 = clampRB(rb7.r, rb7.b, iw7, ih7, S7);
                return savePosFromInsets(cr7, n7b.sl, n7b.st);
            }
            if (p.v === 6 && typeof p.nr === "number" && typeof p.nb === "number") {
                fab.classList.add(USER_POS_CLASS);
                var iw0 = layoutW();
                var ih0 = layoutH();
                var Suse = FAB_USER_PX;
                var rb = rbFromNorm(iw0, ih0, Suse, p.nr, p.nb);
                var left0 = iw0 - rb.r - Suse;
                var top0 = ih0 - rb.b - Suse;
                var c0 = clampLTValues(iw0, ih0, Suse, left0, top0);
                var n6 = normSlStFromLayoutLT(iw0, ih0, Suse, c0.left, c0.top);
                var cr6 = clampRB(rb.r, rb.b, iw0, ih0, Suse);
                return savePosFromInsets(cr6, n6.sl, n6.st);
            }
            if (p.v === 5 && typeof p.nx === "number" && typeof p.ny === "number") {
                return migrateNxNyToPixel(fab, p.nx, p.ny, 62);
            }
            if ((p.v === 4 || p.v === 3) && typeof p.nx === "number" && typeof p.ny === "number") {
                return migrateLegacyToPixel(fab, p);
            }
            return migrateLegacyToPixel(fab, p);
        } catch (e) {}
        return null;
    }

    function applySavedOrDefault(fab) {
        var pos = loadPos(fab);
        if (!pos) {
            clearUserStyles(fab);
            return;
        }
        /* Boot inline in base.html ha già applicato v17: evita secondo setProperty (flash). */
        if (
            !fab.classList.contains(LAYOUT_PENDING_CLASS) &&
            fab.classList.contains(USER_POS_CLASS) &&
            typeof pos.pr === "number" &&
            typeof pos.pb === "number"
        ) {
            return;
        }
        applyFabDual(fab, pos);
    }

    function clampToViewportLT(fab, left, top) {
        var box = visualClampBox(fab);
        if (box) {
            return {
                left: Math.max(box.minL, Math.min(box.maxL, left)),
                top: Math.max(box.minT, Math.min(box.maxT, top))
            };
        }
        var S = layoutFabSideForEl(fab);
        return clampLTValues(layoutWForClamp(), layoutHForClamp(), S, left, top);
    }

    function clampAndApplyLT(fab, left, top) {
        var c = clampToViewportLT(fab, left, top);
        fab.style.setProperty("left", posPx(c.left), "important");
        fab.style.setProperty("top", posPx(c.top), "important");
        fab.style.setProperty("right", "auto", "important");
        fab.style.setProperty("bottom", "auto", "important");
        fab.style.transform = "none";
        fab.classList.add(USER_POS_CLASS);
        return c;
    }

    function persistPixelFromRect(fab) {
        var rect = fab.getBoundingClientRect();
        var iw = layoutW();
        var ih = layoutH();
        var cr = clampRB(Math.round(iw - rect.right), Math.round(ih - rect.bottom), iw, ih, FAB_USER_PX);
        var n = normFromFabRect(rect, fab);
        fab.classList.add(USER_POS_CLASS);
        var rec = savePosFromInsets(cr, n.sl, n.st);
        applyFabDual(fab, rec);
    }

    function finishFabReveal(fab) {
        if (fab && fab.classList.contains(LAYOUT_PENDING_CLASS)) {
            fab.classList.remove(LAYOUT_PENDING_CLASS);
        }
    }

    function init() {
        var fab = document.getElementById("mobile-home-fab");
        if (!fab) {
            return;
        }
        if (isHomepage()) {
            fab.style.display = "none";
            fab.classList.remove(LAYOUT_PENDING_CLASS);
            return;
        }
        fab.style.display = "block";
        fab.style.removeProperty("--home-fab-bg");
        fab.style.removeProperty("--home-fab-icon");
        fab.style.removeProperty("--home-fab-border");
        fab.style.removeProperty("--home-fab-icon-stroke");

        if (inited) {
            applySavedOrDefault(fab);
            finishFabReveal(fab);
            return;
        }
        inited = true;

        var link = fab.querySelector(".mobile-home-fab-link");
        var dragging = false;
        var mouseDragging = false;
        var touchDragging = false;
        var gestureWasDrag = false;
        /** Sopprime solo il click fantasma subito dopo un drag (non 450ms). */
        var suppressNextLinkClick = false;
        var activePointerId = null;
        var activeTouchId = null;
        var inputType = "mouse";
        var pressX = 0;
        var pressY = 0;
        var pointerOffsetX = 0;
        var pointerOffsetY = 0;
        var DRAG_DIST_TOUCH_PX = 8;
        var DRAG_DIST_MOUSE_PX = 3;
        /** Dopo un touch, ignora mousedown sintetico del browser. */
        var ignoreMouseUntil = 0;

        applySavedOrDefault(fab);
        finishFabReveal(fab);

        window.addEventListener("orientationchange", function() {
            var f = document.getElementById("mobile-home-fab");
            if (!f || isHomepage()) return;
            applySavedOrDefault(f);
        });

        function dragThresholdSq(type) {
            var px = type === "mouse" ? DRAG_DIST_MOUSE_PX : DRAG_DIST_TOUCH_PX;
            return px * px;
        }

        function goHomeFromFab() {
            if (!link || !link.href) return;
            window.location.href = link.getAttribute("href");
        }

        function hardResetGesture() {
            dragging = false;
            mouseDragging = false;
            touchDragging = false;
            gestureWasDrag = false;
            fabDragIw = null;
            fabDragIh = null;
            activePointerId = null;
            activeTouchId = null;
            fab.classList.remove("is-dragging");
            try {
                document.body.style.userSelect = "";
            } catch (err) { /* ignore */ }
        }

        function beginGesture(clientX, clientY, type) {
            fabDragIw = layoutW();
            fabDragIh = layoutH();
            inputType = type;
            var rect = fab.getBoundingClientRect();
            pressX = clientX;
            pressY = clientY;
            pointerOffsetX = clientX - rect.left;
            pointerOffsetY = clientY - rect.top;
            dragging = true;
            gestureWasDrag = false;
        }

        function moveGesture(clientX, clientY) {
            if (!dragging) return;
            var dxp = clientX - pressX;
            var dyp = clientY - pressY;
            if (!gestureWasDrag && dxp * dxp + dyp * dyp > dragThresholdSq(inputType)) {
                gestureWasDrag = true;
                dismissIntroPulse(fab);
                fab.classList.add("is-dragging");
                var rect = fab.getBoundingClientRect();
                clampAndApplyLT(fab, rect.left, rect.top);
            }
            if (!gestureWasDrag) return;
            if (inputType === "mouse") {
                try {
                    document.body.style.userSelect = "none";
                } catch (err) { /* ignore */ }
            }
            clampAndApplyLT(fab, clientX - pointerOffsetX, clientY - pointerOffsetY);
        }

        /**
         * @param {string} type
         * @param {{ navigate?: boolean }} [opts]
         */
        function endGesture(type, opts) {
            if (!dragging) return;
            opts = opts || {};
            var shouldNavigate = opts.navigate !== false;
            var wasDrag = gestureWasDrag;

            dragging = false;
            mouseDragging = false;
            touchDragging = false;
            fabDragIw = null;
            fabDragIh = null;
            activePointerId = null;
            activeTouchId = null;
            fab.classList.remove("is-dragging");
            gestureWasDrag = false;
            try {
                document.body.style.userSelect = "";
            } catch (err) { /* ignore */ }

            if (wasDrag) {
                var rect = fab.getBoundingClientRect();
                clampAndApplyLT(fab, rect.left, rect.top);
                persistPixelFromRect(fab);
                suppressNextLinkClick = true;
                return;
            }

            if (shouldNavigate && (type === "touch" || type === "mouse")) {
                dismissIntroPulse(fab);
                goHomeFromFab();
            }
        }

        function findTouch(list, id) {
            if (!list) return null;
            for (var i = 0; i < list.length; i++) {
                if (list[i].identifier === id) return list[i];
            }
            return null;
        }

        /* —— Desktop mouse —— */
        function onMouseDown(e) {
            if (e.button !== 0) return;
            if (touchDragging || Date.now() < ignoreMouseUntil) return;
            if (dragging) hardResetGesture();
            mouseDragging = true;
            beginGesture(e.clientX, e.clientY, "mouse");
        }

        function onMouseMove(e) {
            if (!mouseDragging) return;
            if ((e.buttons & 1) !== 1) {
                onMouseUp(e);
                return;
            }
            e.preventDefault();
            moveGesture(e.clientX, e.clientY);
        }

        function onMouseUp() {
            if (!mouseDragging) return;
            mouseDragging = false;
            endGesture("mouse");
        }

        /* —— Mobile touch (affidabile; niente pointer capture) —— */
        function onTouchStart(e) {
            if (e.touches.length !== 1) return;
            if (dragging) hardResetGesture();
            ignoreMouseUntil = Date.now() + 900;
            var t = e.touches[0];
            activeTouchId = t.identifier;
            touchDragging = true;
            beginGesture(t.clientX, t.clientY, "touch");
        }

        function onTouchMove(e) {
            if (!touchDragging || !dragging) return;
            var t = findTouch(e.touches, activeTouchId) || findTouch(e.changedTouches, activeTouchId);
            if (!t) return;
            moveGesture(t.clientX, t.clientY);
            if (gestureWasDrag) {
                e.preventDefault();
            }
        }

        function onTouchEnd(e) {
            if (!touchDragging || !dragging) return;
            if (activeTouchId != null && !findTouch(e.changedTouches, activeTouchId)) return;
            endGesture("touch", { navigate: true });
        }

        function onTouchCancel() {
            if (!touchDragging || !dragging) return;
            endGesture("touch", { navigate: false });
        }

        function blockFabContextMenu(e) {
            e.preventDefault();
        }

        if (link) {
            link.addEventListener("click", function(e) {
                if (suppressNextLinkClick) {
                    suppressNextLinkClick = false;
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            link.setAttribute("draggable", "false");
            link.addEventListener("contextmenu", blockFabContextMenu);
        }
        fab.addEventListener("contextmenu", blockFabContextMenu);

        fab.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        window.addEventListener("mouseup", onMouseUp);

        fab.addEventListener("touchstart", onTouchStart, { passive: true });
        document.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
        document.addEventListener("touchend", onTouchEnd, { capture: true });
        document.addEventListener("touchcancel", onTouchCancel, { capture: true });

        window.addEventListener("blur", function() {
            if (mouseDragging) onMouseUp();
            else if (touchDragging) endGesture("touch", { navigate: false });
            else if (dragging) hardResetGesture();
        });
        document.addEventListener("visibilitychange", function() {
            if (document.visibilityState !== "visible" && dragging) {
                if (mouseDragging) onMouseUp();
                else endGesture("touch", { navigate: false });
            }
        });
        window.addEventListener("pageshow", function() {
            hardResetGesture();
            suppressNextLinkClick = false;
        });

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                if (isHomepage()) return;
                var f = document.getElementById("mobile-home-fab");
                if (!f) return;
                maybeStartIntroPulse(f, f.querySelector(".mobile-home-fab-link"));
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
