// Interactive Mobi demo: scripted copy of the real panel for one calculus problem.
(function () {
  const root = document.getElementById("mobi-demo");
  if (!root) return;
  const $ = (sel) => root.querySelector(sel);
  const tex = (latex, display) =>
    window.katex ? window.katex.renderToString(latex, { displayMode: !!display, throwOnError: false }) : latex;
  const renderMath = (el) =>
    el.querySelectorAll("[data-tex]").forEach((n) => (n.innerHTML = tex(n.dataset.tex, n.hasAttribute("data-display"))));

  // Same wording style the real tutor uses: nudge first, then setup, then the next step.
  const HINTS = [
    "At a peak or a valley the curve goes flat for a moment. What does that tell you about its slope there?",
    "The slope of $f$ is its derivative $f'(x)$. Set it equal to zero and solve for $x$.",
    "You should get $f'(x) = 3x^2 - 3$. Solve $3x^2 - 3 = 0$. What do you divide both sides by?",
  ];
  const WORK = [
    { tex: "f'(x) = 3x^2 - 3", ok: true },
    { tex: "3x^2 - 3 = 0", ok: true },
    { tex: "x^2 = 3", ok: false },
    { tex: "x = \\pm\\sqrt{3}", ok: true },
  ];
  const SOLUTION = [
    { tex: "f'(x) = 3x^2 - 3", why: "Differentiate term by term with the power rule." },
    { tex: "3x^2 - 3 = 0", why: "Peaks and valleys happen where the slope is zero." },
    { tex: "x^2 = 1", why: "Add 3 to both sides, then divide by 3." },
    { tex: "x = \\pm 1", why: "Both square roots count." },
    { tex: "f(-1) = 2,\\quad f(1) = -2", why: "Plug back in: local max at (−1, 2), local min at (1, −2)." },
  ];

  const withMath = (s) => s.replace(/\$([^$]+)\$/g, (_, m) => tex(m));
  let hints = 0;

  const hintList = $("#m-hints"), nudge = $("#m-nudge"), hintBtn = $("#m-hint");
  hintBtn.addEventListener("click", () => {
    if (hints >= HINTS.length) {
      nudge.textContent = "That's every hint. Give it a go, or check your work.";
      nudge.hidden = false;
      return;
    }
    $("#m-hints-empty").hidden = true;
    const li = document.createElement("li");
    li.innerHTML = `<span class="m-rung">${hints + 1}</span><span>${withMath(HINTS[hints])}</span>`;
    hintList.appendChild(li);
    hints++;
    hintBtn.textContent = hints >= HINTS.length ? "No more hints" : "Next hint";
  });

  $("#m-check").addEventListener("click", () => {
    const card = $("#m-check-card");
    const list = card.querySelector(".m-steps");
    list.innerHTML = "";
    WORK.forEach((w, i) => {
      setTimeout(() => {
        const li = document.createElement("li");
        li.className = "m-step" + (w.ok ? "" : " wrong");
        li.innerHTML = tex(w.tex, true) + `<div class="m-flag">${w.ok ? "✓ Checked by SymPy" : "SymPy disagrees with this step"}</div>`;
        list.appendChild(li);
        if (i === WORK.length - 1) card.querySelector(".m-note").hidden = false;
      }, i * 350);
    });
    card.querySelector(".m-note").hidden = true;
    card.hidden = false;
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  const confirmBox = $("#m-confirm");
  const showSolution = () => {
    confirmBox.hidden = true;
    const card = $("#m-solution-card");
    const list = card.querySelector(".m-steps");
    list.innerHTML = "";
    card.hidden = false;
    SOLUTION.forEach((s, i) =>
      setTimeout(() => {
        const li = document.createElement("li");
        li.className = "m-step";
        li.innerHTML = tex(s.tex, true) + `<div class="m-why">${s.why}</div>`;
        list.appendChild(li);
      }, i * 700),
    );
  };
  $("#m-solution").addEventListener("click", () => {
    if (hints < HINTS.length && confirmBox.hidden) {
      confirmBox.querySelector("#m-used").textContent = hints;
      confirmBox.hidden = false;
      return;
    }
    showSolution();
  });
  $("#m-one-more").addEventListener("click", () => {
    confirmBox.hidden = true;
    hintBtn.click();
  });
  $("#m-show-anyway").addEventListener("click", showSolution);

  // ----- "Play with it": drag a point along f(x) = x^3 - 3x and watch the tangent -----
  const svg = $("svg.m-graph");
  const W = 400, H = 240, X0 = -2.6, X1 = 2.6, Y0 = -4.2, Y1 = 4.2;
  const sx = (x) => ((x - X0) / (X1 - X0)) * W;
  const sy = (y) => H - ((y - Y0) / (Y1 - Y0)) * H;
  const f = (x) => x * x * x - 3 * x;
  const df = (x) => 3 * x * x - 3;
  const NS = "http://www.w3.org/2000/svg";
  const add = (tag, attrs, parent = svg) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    parent.appendChild(el);
    return el;
  };
  for (let i = Math.ceil(X0); i <= X1; i++) add("line", { x1: sx(i), x2: sx(i), y1: 0, y2: H, stroke: i ? "rgba(21,23,42,0.07)" : "rgba(21,23,42,0.35)" });
  for (let j = Math.ceil(Y0); j <= Y1; j++) add("line", { x1: 0, x2: W, y1: sy(j), y2: sy(j), stroke: j ? "rgba(21,23,42,0.07)" : "rgba(21,23,42,0.35)" });
  [-2, -1, 1, 2].forEach((i) => {
    const t = add("text", { x: sx(i), y: sy(0) + 15, "text-anchor": "middle", "font-size": 11, fill: "#8d8fa0", "font-family": "JetBrains Mono, monospace" });
    t.textContent = i;
  });
  let d = "";
  for (let x = X0; x <= X1 + 1e-9; x += 0.02) d += (d ? "L" : "M") + sx(x).toFixed(1) + " " + sy(Math.max(Y0 - 2, Math.min(Y1 + 2, f(x)))).toFixed(1);
  add("path", { d, fill: "none", stroke: "#6f8ff0", "stroke-width": 2.5 });
  const tangent = add("line", { stroke: "#ef6fae", "stroke-width": 2 });
  const halo = add("circle", { r: 14, fill: "rgba(239,111,174,0.18)" });
  const dot = add("circle", { r: 7, fill: "#ef6fae" });

  const fmt = (n) => (Math.abs(n) < 0.005 ? "0" : n.toFixed(2));
  let x0 = 0.9;
  function draw() {
    const y = f(x0), m = df(x0);
    const vx = 1, vy = m, len = Math.hypot(sx(vx) - sx(0), sy(vy) - sy(0)), L = 150;
    const ux = ((sx(vx) - sx(0)) / len) * L, uy = ((sy(vy) - sy(0)) / len) * L;
    tangent.setAttribute("x1", sx(x0) - ux); tangent.setAttribute("y1", sy(y) - uy);
    tangent.setAttribute("x2", sx(x0) + ux); tangent.setAttribute("y2", sy(y) + uy);
    [dot, halo].forEach((c) => { c.setAttribute("cx", sx(x0)); c.setAttribute("cy", sy(y)); });
    const flat = Math.abs(m) < 0.15;
    $("#m-readout").innerHTML =
      `<span>${tex("x = " + fmt(x0))}</span><span>${tex("f(x) = " + fmt(y))}</span>` +
      `<span class="${flat ? "flat" : ""}">${tex("\\text{slope} = f'(x) = " + fmt(m))}</span>`;
    $("#m-flat").hidden = !flat;
  }
  function pointerX(e) {
    const r = svg.getBoundingClientRect();
    const x = X0 + ((e.clientX - r.left) / r.width) * (X1 - X0);
    return Math.max(-2.1, Math.min(2.1, x));
  }
  let dragging = false;
  svg.addEventListener("pointerdown", (e) => { dragging = true; svg.setPointerCapture(e.pointerId); x0 = pointerX(e); draw(); });
  svg.addEventListener("pointermove", (e) => { if (dragging) { x0 = pointerX(e); draw(); } });
  svg.addEventListener("pointerup", () => (dragging = false));
  // Snap to the exact turning points so "slope = 0" is easy to find.
  svg.addEventListener("pointerup", () => { if (Math.abs(Math.abs(x0) - 1) < 0.07) { x0 = Math.sign(x0); draw(); } });

  const start = () => { renderMath(root); draw(); };
  if (window.katex) start();
  else window.addEventListener("load", start);
})();
