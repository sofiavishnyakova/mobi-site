// Interactive Mobi demo: a scripted copy of the real panel for one integral problem.
// It never calls the real tutor (that needs an account); questions it can't
// answer point to the app.
(function () {
  const root = document.getElementById("mobi-demo");
  if (!root) return;
  const $ = (sel) => root.querySelector(sel);
  const tex = (latex, display) =>
    window.katex ? window.katex.renderToString(latex, { displayMode: !!display, throwOnError: false }) : latex;
  const withMath = (s) => s.replace(/\$([^$]+)\$/g, (_, m) => tex(m));
  const renderMath = (el) =>
    el.querySelectorAll("[data-tex]").forEach((n) => (n.innerHTML = tex(n.dataset.tex, n.hasAttribute("data-display"))));

  // Same shape as the real tutor: a nudge, then the setup, then the next step.
  const HINTS = [
    "The area under a curve between two points is a definite integral. Which integral describes this area?",
    "You want $\\int_0^2 x^2\\,dx$. What function has $x^2$ as its derivative?",
    "An antiderivative of $x^2$ is $\\tfrac{x^3}{3}$. Evaluate it at $2$ and at $0$, then subtract.",
  ];
  const SOLUTION = [
    { tex: "\\int_0^2 x^2\\,dx", why: "The area under the curve from 0 to 2 is a definite integral." },
    { tex: "= \\left[\\tfrac{x^3}{3}\\right]_0^2", why: "Power rule for integrals: raise the power by 1, divide by the new power." },
    { tex: "= \\tfrac{2^3}{3} - \\tfrac{0^3}{3}", why: "Plug in the top limit, then subtract the bottom limit." },
    { tex: "= \\tfrac{8}{3} \\approx 2.67", why: "That's the area, in square units." },
  ];

  // ----- hints -----
  let hints = 0;
  const hintBtn = $("#m-hint");
  hintBtn.addEventListener("click", () => {
    if (hints >= HINTS.length) {
      $("#m-nudge").textContent = "That's every hint. Give it a go, or ask a question below.";
      $("#m-nudge").hidden = false;
      return;
    }
    $("#m-hints-empty").hidden = true;
    const li = document.createElement("li");
    li.innerHTML = `<span class="m-rung">${hints + 1}</span><span>${withMath(HINTS[hints])}</span>`;
    $("#m-hints").appendChild(li);
    hints++;
    hintBtn.textContent = hints >= HINTS.length ? "No more hints" : "Next hint";
  });

  // Checking real work needs the app (it reads your screen), so the demo points there.
  $("#m-check").addEventListener("click", () => {
    const card = $("#m-check-card");
    card.hidden = false;
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // ----- worked solution, gated like the app ("try one more hint first?") -----
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
      $("#m-used").textContent = hints;
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

  // ----- "Play with it": Riemann rectangles under x^2 on [0, 2] -----
  const svg = $("svg.m-graph");
  const W = 400, H = 240, X0 = -0.6, X1 = 2.6, Y0 = -0.6, Y1 = 4.6, A = 0, B = 2, EXACT = 8 / 3;
  const sx = (x) => ((x - X0) / (X1 - X0)) * W;
  const sy = (y) => H - ((y - Y0) / (Y1 - Y0)) * H;
  const f = (x) => x * x;
  const NS = "http://www.w3.org/2000/svg";
  const add = (tag, attrs, parent = svg) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    parent.appendChild(el);
    return el;
  };
  for (let i = 0; i <= 2; i++) add("line", { x1: sx(i), x2: sx(i), y1: 0, y2: H, stroke: i ? "rgba(21,23,42,0.07)" : "rgba(21,23,42,0.35)" });
  for (let j = 0; j <= 4; j++) add("line", { x1: 0, x2: W, y1: sy(j), y2: sy(j), stroke: j ? "rgba(21,23,42,0.07)" : "rgba(21,23,42,0.35)" });
  [1, 2].forEach((i) => {
    add("text", { x: sx(i), y: sy(0) + 15, "text-anchor": "middle", "font-size": 11, fill: "#8d8fa0", "font-family": "JetBrains Mono, monospace" }).textContent = i;
  });
  [2, 4].forEach((j) => {
    add("text", { x: sx(0) - 8, y: sy(j) + 4, "text-anchor": "end", "font-size": 11, fill: "#8d8fa0", "font-family": "JetBrains Mono, monospace" }).textContent = j;
  });
  const rects = add("g", {});
  let d = "";
  for (let x = X0; x <= X1 + 1e-9; x += 0.02) d += (d ? "L" : "M") + sx(x).toFixed(1) + " " + sy(Math.min(Y1 + 1, f(x))).toFixed(1);
  add("path", { d, fill: "none", stroke: "#6f8ff0", "stroke-width": 2.5 });

  const slider = $("#m-n");
  function drawRects() {
    const n = Number(slider.value);
    const w = (B - A) / n;
    let sum = 0;
    rects.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const x = A + i * w;
      const h = f(x + w / 2); // midpoint rule, like the app's default
      sum += h * w;
      add("rect", {
        x: sx(x), y: sy(h), width: sx(x + w) - sx(x), height: sy(0) - sy(h),
        fill: "rgba(60,195,209,0.22)", stroke: "#3cc3d1", "stroke-width": 1,
      }, rects);
    }
    $("#m-n-val").textContent = n;
    $("#m-readout").innerHTML =
      `<span>${n} rectangles ≈ <b>${sum.toFixed(4)}</b></span>` +
      `<span>exact area = <b>${EXACT.toFixed(4)}</b> (error ${Math.abs(EXACT - sum).toFixed(4)})</span>`;
  }
  slider.addEventListener("input", drawRects);

  // ----- "Ask about this": a few prepared answers, like the real tutor's style -----
  const ANSWERS = [
    {
      match: /(area|why.*integral|integral.*why|rectangle)/i,
      text: "Picture slicing the region into thin rectangles: each has width $dx$ and height $x^2$, so its area is $x^2\\,dx$. The integral adds up infinitely many of them. Try sliding $n$ up in the graph above. What happens to the error?",
    },
    {
      match: /(divid|\b3\b|three|power|antideriv|x\^?3|cube)/i,
      text: "Work backwards from a derivative: $\\frac{d}{dx}x^3 = 3x^2$, which is 3 times too big. Dividing by 3 fixes that, so $\\frac{d}{dx}\\frac{x^3}{3} = x^2$. Can you see the general rule for $x^n$?",
    },
    {
      match: /(\bdx\b|d x|what.*mean|width|slice)/i,
      text: "$dx$ stands for the width of each thin slice. As the slices get thinner and thinner, the sum of (height × width) becomes the exact area. It also tells you which variable you're integrating.",
    },
    {
      match: /(answer|result|8\s*\/\s*3|2\.6|how much|what is the area)/i,
      text: "I'd rather you get there yourself! Use hint 3 above. If you're still stuck after trying it, Show solution walks through every step.",
    },
  ];
  const FALLBACK =
    "In this demo I can only answer a few questions about this problem. Download Mobi to ask about anything on your screen.";

  const chat = $("#m-chat");
  function say(role, html) {
    const div = document.createElement("div");
    div.className = `m-msg ${role}`;
    div.innerHTML = html;
    chat.appendChild(div);
    return div;
  }
  function ask(q) {
    q = q.trim();
    if (!q) return;
    say("user", q.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]));
    const thinking = say("assistant thinking", "Thinking…");
    const hit = ANSWERS.find((a) => a.match.test(q));
    setTimeout(() => {
      thinking.classList.remove("thinking");
      thinking.innerHTML = hit ? withMath(hit.text) : `${FALLBACK} <a href="#download">Download Mobi</a>`;
      thinking.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 800);
  }
  $("#m-suggest").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    ask(e.target.textContent);
    e.target.remove();
    if (!$("#m-suggest").children.length) $("#m-suggest").hidden = true;
  });
  $("#m-ask").addEventListener("submit", (e) => {
    e.preventDefault();
    ask($("#m-q").value);
    $("#m-q").value = "";
  });

  const start = () => { renderMath(root); drawRects(); };
  if (window.katex) start();
  else window.addEventListener("load", start);
})();
