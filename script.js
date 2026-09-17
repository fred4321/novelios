/** Interactions de la version statique Novelios, sans dépendance. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timers = [];

  function later(callback, delay) {
    var timer = window.setTimeout(callback, reduceMotion ? 0 : delay);
    timers.push(timer);
    return timer;
  }

  function whenVisible(elements, callback, options) {
    var items = Array.from(elements).filter(Boolean);
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(callback);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        callback(entry.target);
        observer.unobserve(entry.target);
      });
    }, options || { threshold: 0.18, rootMargin: "0px 0px -8%" });
    items.forEach(function (item) { observer.observe(item); });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  // Menu mobile : l'export statique contient les deux styles d'état,
  // mais ne fournit pas l'interaction Framer qui les faisait basculer.
  var mobileNav = document.querySelector(".framer-MHHwW.framer-v-vjcvp0");
  if (mobileNav) {
    var mobileMenuButton = mobileNav.querySelector(".framer-yhc8gt");
    var mobileMenuParts = [
      mobileNav.querySelector(".framer-wmv9a5"),
      mobileNav.querySelector(".framer-1bx7p0f")
    ].filter(Boolean);

    function setMobileMenu(open, returnFocus) {
      mobileNav.classList.toggle("framer-v-vjcvp0", !open);
      mobileNav.classList.toggle("framer-v-1l1vqpb", open);
      mobileNav.classList.toggle("is-menu-open", open);
      mobileMenuButton.setAttribute("aria-expanded", String(open));
      mobileMenuButton.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      mobileMenuParts.forEach(function (part) { part.inert = !open; });
      if (!open && returnFocus) mobileMenuButton.focus();
    }

    setMobileMenu(false, false);
    mobileMenuButton.addEventListener("click", function () {
      setMobileMenu(mobileMenuButton.getAttribute("aria-expanded") !== "true", false);
    });
    mobileNav.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () { setMobileMenu(false, false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileMenuButton.getAttribute("aria-expanded") === "true") {
        setMobileMenu(false, true);
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 810 && mobileMenuButton.getAttribute("aria-expanded") === "true") {
        setMobileMenu(false, false);
      }
    });
  }

  // Entrées éditoriales au défilement, proches des transitions Framer.
  var revealSelector = [
    "section [data-framer-name='Marker']",
    "section [data-framer-name='Headline']",
    "section [data-framer-name='Sub']",
    "section [data-framer-name='CTAs']",
    "section [data-framer-name='Plan Panel']",
    "section [data-framer-name='Copy']",
    "section .nct-head",
    "section .nct-aside",
    "section .nct-form"
  ].join(",");
  var revealItems = Array.from(document.querySelectorAll(revealSelector));
  revealItems.forEach(function (item, index) {
    item.classList.add("motion-reveal");
    item.style.setProperty("--motion-delay", (index % 4) * 70 + "ms");
  });
  document.documentElement.classList.add("motion-enabled");
  whenVisible(revealItems, function (item) { item.classList.add("is-visible"); }, { threshold: 0.12, rootMargin: "0px 0px -5%" });

  // Couche premium : progression, lumière ambiante et profondeur au pointeur.
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var progress = document.createElement("div");
  progress.className = "premium-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.appendChild(progress);

  var ambient = document.createElement("div");
  ambient.className = "premium-ambient";
  ambient.setAttribute("aria-hidden", "true");
  document.body.appendChild(ambient);

  var particleCanvas = document.createElement("canvas");
  particleCanvas.className = "premium-particles";
  particleCanvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(particleCanvas);

  var premiumFrame = 0;
  var pointerX = window.innerWidth * 0.72;
  var pointerY = window.innerHeight * 0.22;
  function paintPremiumLayer() {
    premiumFrame = 0;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    progress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    if (finePointer && !reduceMotion) {
      ambient.style.setProperty("--ambient-x", pointerX + "px");
      ambient.style.setProperty("--ambient-y", pointerY + "px");
    }
    document.documentElement.classList.toggle("premium-scrolled", window.scrollY > 24);
  }
  function requestPremiumPaint() {
    if (!premiumFrame) premiumFrame = requestAnimationFrame(paintPremiumLayer);
  }
  window.addEventListener("scroll", requestPremiumPaint, { passive: true });
  window.addEventListener("resize", requestPremiumPaint);
  if (finePointer && !reduceMotion) {
    window.addEventListener("pointermove", function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      ambient.classList.add("is-awake");
      requestPremiumPaint();
    }, { passive: true });
    document.documentElement.classList.add("premium-pointer");
  }
  paintPremiumLayer();

  // Quelques poussières lumineuses, surtout dans les marges de la composition.
  var particleContext = particleCanvas.getContext("2d");
  var particleItems = [];
  var particleAnimationFrame = 0;
  var particleLastTime = 0;
  var particleWidth = 0;
  var particleHeight = 0;

  function createParticle(index, count) {
    var edge = index < Math.round(count * 0.72);
    var left = index % 2 === 0;
    var x = edge
      ? (left ? 0.025 + Math.random() * 0.17 : 0.805 + Math.random() * 0.17)
      : 0.18 + Math.random() * 0.64;
    return {
      x: x * particleWidth,
      y: Math.random() * particleHeight,
      radius: 0.7 + Math.random() * 1.35,
      alpha: 0.24 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: 0.00018 + Math.random() * 0.00028,
      driftX: (Math.random() - 0.5) * 0.018,
      driftY: -0.006 - Math.random() * 0.018,
      depth: 0.25 + Math.random() * 0.75,
      blue: Math.random() > 0.32
    };
  }

  function sizeParticleField() {
    if (!particleContext) return;
    var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    particleWidth = window.innerWidth;
    particleHeight = window.innerHeight;
    particleCanvas.width = Math.round(particleWidth * ratio);
    particleCanvas.height = Math.round(particleHeight * ratio);
    particleCanvas.style.width = particleWidth + "px";
    particleCanvas.style.height = particleHeight + "px";
    particleContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    var count = particleWidth < 810 ? 16 : Math.min(34, Math.max(24, Math.round(particleWidth / 48)));
    particleItems = Array.from({ length: count }, function (_, index) {
      return createParticle(index, count);
    });
    if (reduceMotion) drawParticleField(0, true);
  }

  function drawParticleField(time, still) {
    if (!particleContext) return;
    var delta = particleLastTime ? Math.min(32, time - particleLastTime) : 16;
    particleLastTime = time;
    particleContext.clearRect(0, 0, particleWidth, particleHeight);
    var pointerOffsetX = finePointer ? (pointerX / Math.max(1, particleWidth) - 0.5) * 8 : 0;
    var pointerOffsetY = finePointer ? (pointerY / Math.max(1, particleHeight) - 0.5) * 6 : 0;

    particleItems.forEach(function (particle) {
      if (!still) {
        particle.x += particle.driftX * delta;
        particle.y += particle.driftY * delta;
        if (particle.y < -10) particle.y = particleHeight + 10;
        if (particle.x < -10) particle.x = particleWidth + 10;
        if (particle.x > particleWidth + 10) particle.x = -10;
      }
      var pulse = still ? 0.72 : 0.58 + Math.sin(time * particle.speed + particle.phase) * 0.28;
      var x = particle.x + pointerOffsetX * particle.depth;
      var y = particle.y + pointerOffsetY * particle.depth;
      var alpha = particle.alpha * pulse;
      particleContext.beginPath();
      particleContext.arc(x, y, particle.radius, 0, Math.PI * 2);
      particleContext.fillStyle = particle.blue
        ? "rgba(126, 188, 255, " + alpha.toFixed(3) + ")"
        : "rgba(235, 246, 255, " + alpha.toFixed(3) + ")";
      particleContext.shadowBlur = particle.radius > 1.35 ? 9 : 5;
      particleContext.shadowColor = particle.blue ? "rgba(74, 154, 240, .64)" : "rgba(220, 242, 255, .58)";
      particleContext.fill();
    });
    particleContext.shadowBlur = 0;
  }

  function animateParticleField(time) {
    particleAnimationFrame = 0;
    if (reduceMotion || document.hidden) return;
    drawParticleField(time, false);
    particleAnimationFrame = requestAnimationFrame(animateParticleField);
  }

  function startParticleField() {
    if (!reduceMotion && !document.hidden && !particleAnimationFrame) {
      particleLastTime = 0;
      particleAnimationFrame = requestAnimationFrame(animateParticleField);
    }
  }

  sizeParticleField();
  startParticleField();
  window.addEventListener("resize", sizeParticleField);

  // Reflet local et perspective limitée aux panneaux structurants.
  var premiumCards = document.querySelectorAll("[data-framer-name='Plan Panel'], .framer-1ivk1cu, .nct-form");
  premiumCards.forEach(function (card) {
    card.classList.add("premium-card");
    if (!finePointer || reduceMotion) return;
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      var localX = event.clientX - rect.left;
      var localY = event.clientY - rect.top;
      var x = localX / rect.width - 0.5;
      var y = localY / rect.height - 0.5;
      card.style.setProperty("--spot-x", localX + "px");
      card.style.setProperty("--spot-y", localY + "px");
      card.style.setProperty("--card-rx", (-y * 1.6).toFixed(2) + "deg");
      card.style.setProperty("--card-ry", (x * 2.2).toFixed(2) + "deg");
      card.classList.add("is-pointed");
    }, { passive: true });
    card.addEventListener("pointerleave", function () {
      card.classList.remove("is-pointed");
      card.style.setProperty("--card-rx", "0deg");
      card.style.setProperty("--card-ry", "0deg");
    });
  });

  // Les boutons principaux attirent légèrement le pointeur et portent un éclat.
  document.querySelectorAll("a[data-reset='button'], .nct-submit").forEach(function (button) {
    button.classList.add("premium-cta");
    if (!finePointer || reduceMotion) return;
    button.addEventListener("pointermove", function (event) {
      var rect = button.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      button.style.setProperty("--cta-x", x + "px");
      button.style.setProperty("--cta-y", y + "px");
      button.style.setProperty("--cta-mx", ((x / rect.width - 0.5) * 5).toFixed(2) + "px");
      button.style.setProperty("--cta-my", ((y / rect.height - 0.5) * 4).toFixed(2) + "px");
    }, { passive: true });
    button.addEventListener("pointerleave", function () {
      button.style.setProperty("--cta-mx", "0px");
      button.style.setProperty("--cta-my", "0px");
    });
  });

  // Mise en évidence du chapitre courant dans la navigation desktop.
  var navLinks = Array.from(document.querySelectorAll(".framer-MHHwW .framer-wmv9a5 a[href^='#']"));
  var navTargets = navLinks.map(function (link) {
    return document.querySelector(link.getAttribute("href"));
  }).filter(Boolean);
  if ("IntersectionObserver" in window && navTargets.length) {
    var activeSection = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle("is-current", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-28% 0px -62%", threshold: 0 });
    navTargets.forEach(function (section) { activeSection.observe(section); });
  }

  // Notifications du hero : la file avance toutes les 3,2 secondes.
  document.querySelectorAll(".ncq-counter").forEach(function (counter) {
    var scene = counter.previousElementSibling;
    if (!scene || !scene.querySelector(".ncq-wrap")) return;
    var labels = [
      "Architecture du socle validée",
      "Parcours utilisateur intégré",
      "Tests automatisés exécutés",
      "Environnement de recette prêt",
      "Migration de données vérifiée",
      "Version candidate déployée"
    ];
    var nextLabel = 0;
    var countNode = Array.from(counter.childNodes).find(function (node) {
      return node.nodeType === Node.TEXT_NODE && /\d+/.test(node.nodeValue);
    });
    function cycle() {
      if (document.hidden) return;
      var wraps = scene.querySelectorAll(".ncq-wrap");
      var first = wraps[0];
      if (!first) return;
      first.setAttribute("data-exiting", "");
      later(function () {
        first.removeAttribute("data-exiting");
        scene.appendChild(first);
        var pills = scene.querySelectorAll(".ncq-pill");
        pills.forEach(function (pill, index) {
          pill.classList.remove("ncq-done", "ncq-running", "ncq-queued");
          pill.classList.add(index === 0 ? "ncq-done" : index === 1 ? "ncq-running" : "ncq-queued");
          var status = pill.querySelector(".ncq-status");
          if (status && status.lastChild) status.lastChild.nodeValue = index === 0 ? "Livré" : index === 1 ? "En cours" : "En attente";
        });
        var queued = scene.querySelectorAll(".ncq-task")[2];
        if (queued) queued.textContent = labels[nextLabel++ % labels.length];
        if (countNode) countNode.nodeValue = String((Number(countNode.nodeValue.match(/\d+/)[0]) || 0) + 1);
      }, 430);
    }
    if (!reduceMotion) timers.push(window.setInterval(cycle, 3200));
  });

  // Tableau principal : construction progressive des lignes et jauges.
  whenVisible(document.querySelectorAll(".tb-root"), function (root) {
    root.classList.add("tb-live", "tb-anim");
    var fill = root.querySelector(".tb-fill");
    if (fill) {
      fill.style.width = "0%";
      requestAnimationFrame(function () { fill.style.width = "78%"; });
    }
    root.querySelectorAll(".tb-tick, .tb-block").forEach(function (item, index) {
      item.classList.remove("tb-lit");
      later(function () { item.classList.add("tb-lit"); }, 240 + index * 110);
    });
    root.querySelectorAll(".tb-row-i").forEach(function (row, index) {
      row.style.animationDelay = index * 90 + "ms";
    });
  });

  // Règles de cadrage : cases, cadence, suppression et ajout.
  document.querySelectorAll(".nso-root").forEach(function (root) {
    var list = root.querySelector(".nso-list");
    var count = root.querySelector(".nso-count");
    var input = root.querySelector(".nso-input");
    var cadence = ["à chaque étape", "chaque semaine", "à la demande"];
    function updateCount() {
      if (count && list) count.textContent = list.querySelectorAll(".nso-row:not(.is-leaving)").length + " actives";
    }
    function toggle(row) {
      if (!row) return;
      var done = row.classList.toggle("is-done");
      var check = row.querySelector(".nso-check");
      if (check) check.setAttribute("aria-checked", String(done));
    }
    root.addEventListener("click", function (event) {
      var row = event.target.closest(".nso-row");
      if (!row) return;
      var remove = event.target.closest(".nso-x");
      var chip = event.target.closest(".nso-chip");
      if (remove) {
        row.classList.add("is-leaving");
        later(function () { row.remove(); updateCount(); }, 300);
      } else if (chip) {
        var current = Math.max(0, cadence.indexOf(chip.textContent.trim()));
        chip.textContent = cadence[(current + 1) % cadence.length];
      } else {
        toggle(row);
      }
    });
    root.addEventListener("keydown", function (event) {
      if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("nso-check")) {
        event.preventDefault();
        toggle(event.target.closest(".nso-row"));
      }
    });
    if (input && list) {
      input.addEventListener("input", function () {
        var indicator = root.querySelector(".nso-enter");
        if (indicator) indicator.classList.toggle("is-on", Boolean(input.value.trim()));
      });
      input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" || !input.value.trim()) return;
        var row = document.createElement("li");
        row.className = "nso-row is-fresh";
        row.innerHTML = '<span class="nso-check" role="checkbox" aria-checked="false" tabindex="0"><svg class="nso-tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.4 L6.9 11.2 L12 5.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span><span class="nso-text"></span><button type="button" class="nso-chip">à la demande</button><button type="button" class="nso-x" aria-label="Supprimer"><span aria-hidden="true">×</span></button>';
        row.querySelector(".nso-text").textContent = input.value.trim();
        list.appendChild(row);
        input.value = "";
        updateCount();
      });
    }
    updateCount();
  });

  // Plan : écriture séquencée puis déplacement de l'état en cours.
  whenVisible(document.querySelectorAll(".npw-root"), function (root) {
    root.classList.add("npw-armed");
    requestAnimationFrame(function () {
      root.classList.remove("npw-armed");
      root.classList.add("npw-run");
    });
    if (reduceMotion) return;
    var rows = Array.from(root.querySelectorAll(".npw-row:not(.npw-stop)"));
    var current = 0;
    function runNext() {
      rows.forEach(function (row) {
        row.classList.remove("is-running");
        var oldBar = row.querySelector(".npw-bar");
        if (oldBar) oldBar.remove();
      });
      var row = rows[current++ % rows.length];
      if (!row) return;
      row.classList.add("is-running");
      var bar = document.createElement("span");
      bar.className = "npw-bar";
      bar.setAttribute("aria-hidden", "true");
      row.prepend(bar);
    }
    later(function () {
      runNext();
      timers.push(window.setInterval(runNext, 2100));
    }, 2300);
  });

  // Frise de projet : le canvas SSR était vide sans hydratation Framer.
  document.querySelectorAll(".nrl-root").forEach(function (root) {
    var canvas = root.querySelector(".nrl-canvas");
    var handle = root.querySelector(".nrl-handle");
    if (!canvas || !handle) return;
    var context = canvas.getContext("2d");
    var value = Number(handle.getAttribute("aria-valuenow")) || 360;
    var dragging = false;

    function label(minutes) {
      var day = Math.max(1, Math.min(10, Math.round(minutes / 60) + 1));
      return "J" + String(day).padStart(2, "0");
    }
    function draw() {
      var rect = root.getBoundingClientRect();
      var width = Math.max(300, Math.round(rect.width));
      var height = Math.max(150, Math.round(rect.height));
      var ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      var left = 24;
      var right = width - 24;
      var center = height * 0.55;
      var cursor = left + value / 600 * (right - left);
      var gradient = context.createLinearGradient(left, 0, right, 0);
      gradient.addColorStop(0, "rgba(29,112,217,.85)");
      gradient.addColorStop(value / 600, "rgba(29,112,217,.45)");
      gradient.addColorStop(Math.min(1, value / 600 + .002), "rgba(255,255,255,.12)");
      gradient.addColorStop(1, "rgba(255,255,255,.06)");
      context.fillStyle = gradient;
      context.fillRect(left, center, right - left, 1);

      context.font = "500 10px Inter, sans-serif";
      context.textAlign = "center";
      for (var index = 0; index <= 10; index += 1) {
        var x = left + index / 10 * (right - left);
        var passed = index * 60 <= value;
        context.fillStyle = passed ? "rgba(208,214,224,.8)" : "rgba(138,143,152,.42)";
        context.fillRect(Math.round(x), center - (index % 2 ? 3 : 6), 1, index % 2 ? 7 : 13);
        if (index % 2 === 0) context.fillText("J" + String(index + 1).padStart(2, "0"), x, center + 28);
      }

      context.fillStyle = "rgba(240,191,0,.16)";
      context.fillRect(cursor - 11, 0, 22, height);
      context.fillStyle = "#f0bf00";
      context.fillRect(Math.round(cursor), 18, 1, height - 36);
      context.beginPath();
      context.arc(cursor, center, 5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(247,248,248,.92)";
      context.font = "500 11px Inter, sans-serif";
      context.fillText("JALON · " + label(value), cursor, 18);

      handle.style.left = Math.round(cursor - 11) + "px";
      handle.setAttribute("aria-valuenow", String(value));
      handle.setAttribute("aria-valuetext", label(value));
    }
    function setFromPointer(event) {
      var rect = root.getBoundingClientRect();
      value = Math.round(Math.max(0, Math.min(1, (event.clientX - rect.left - 24) / Math.max(1, rect.width - 48))) * 600 / 60) * 60;
      draw();
    }
    root.classList.add("nrl-grab");
    root.addEventListener("pointerdown", function (event) {
      dragging = true;
      root.classList.add("nrl-drag");
      root.setPointerCapture(event.pointerId);
      setFromPointer(event);
      handle.focus({ preventScroll: true });
    });
    root.addEventListener("pointermove", function (event) { if (dragging) setFromPointer(event); });
    root.addEventListener("pointerup", function () { dragging = false; root.classList.remove("nrl-drag"); });
    handle.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      if (event.key === "Home") value = 0;
      else if (event.key === "End") value = 600;
      else value = Math.max(0, Math.min(600, value + (event.key === "ArrowRight" ? 60 : -60)));
      draw();
    });
    window.addEventListener("resize", draw);
    draw();
  });

  // Graphiques : croissance des barres et activation successive des lignes.
  whenVisible(document.querySelectorAll(".npc-root"), function (root) {
    var values = [2, 4, 7, 11, 9, 14, 12, 8, 5, 3, 6, 4];
    root.querySelectorAll(".npc-bar").forEach(function (bar, index) {
      var height = values[index % values.length] / 14 * 134;
      later(function () {
        bar.setAttribute("height", height.toFixed(2));
        bar.setAttribute("y", (150 - height).toFixed(2));
      }, index * 45);
    });
    var rows = Array.from(root.querySelectorAll(".npc-row"));
    rows.forEach(function (row, index) {
      later(function () {
        rows.forEach(function (item) { item.classList.remove("is-active"); });
        row.classList.add("is-active");
      }, 600 + index * 650);
    });
  });

  // Rail latéral synchronisé au défilement.
  var rails = Array.from(document.querySelectorAll(".nlr-root"));
  function updateRails() {
    rails.forEach(function (root) {
      var rect = root.getBoundingClientRect();
      var height = Math.max(1, rect.height);
      var progress = Math.max(0, Math.min(height, window.innerHeight * 0.42 - rect.top));
      var fill = root.querySelector(".nlr-fill");
      var head = root.querySelector(".nlr-head");
      if (fill) fill.style.height = progress + "px";
      if (head) {
        head.style.transform = "translate3d(0," + progress + "px,0)";
        head.style.opacity = progress > 1 && progress < height - 1 ? "1" : "0";
      }
      root.querySelectorAll(".nlr-node").forEach(function (node) {
        node.classList.toggle("nlr-node-lit", node.offsetTop <= progress + 2);
      });
    });
  }
  if (rails.length && !reduceMotion) {
    var railFrame = 0;
    window.addEventListener("scroll", function () {
      if (railFrame) return;
      railFrame = requestAnimationFrame(function () { railFrame = 0; updateRails(); });
    }, { passive: true });
    window.addEventListener("resize", updateRails);
    updateRails();
  } else {
    rails.forEach(function (root) {
      root.querySelectorAll(".nlr-node").forEach(function (node) { node.classList.add("nlr-node-lit"); });
    });
  }

  // Carte du footer : inclinaison subtile au pointeur.
  document.querySelectorAll("[data-framer-name='Footer Visual']").forEach(function (card) {
    if (reduceMotion) return;
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = "perspective(900px) rotateX(" + (-y * 5).toFixed(2) + "deg) rotateY(" + (x * 7).toFixed(2) + "deg) translateZ(5px)";
      card.style.boxShadow = "0 24px 60px -34px rgba(0,0,0,.8)";
    });
    card.addEventListener("pointerleave", function () {
      card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
      card.style.boxShadow = "0 0 0 0 rgba(0,0,0,0)";
    });
  });


  // Formulaire de contact : validation locale puis envoi sans quitter la page.
  document.querySelectorAll("[data-nct-form]").forEach(function (form) {
    var status = form.querySelector("[data-nct-status]");
    var submit = form.querySelector(".nct-submit");
    // L'action est relue à chaque envoi : le point de collecte peut être
    // renseigné au déploiement sans retoucher ce script.
    function endpointOf() {
      var action = form.getAttribute("action") || "";
      return action.indexOf("VOTRE_ID_FORMSPREE") === -1 ? action : "";
    }

    function fieldError(field) {
      var holder = field.closest(".nct-field") || field.closest(".nct-consent");
      return holder ? holder.querySelector("[data-nct-error]") : null;
    }
    function setError(field, message) {
      var node = fieldError(field);
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (!node) return;
      node.textContent = message || "";
      node.classList.toggle("is-on", Boolean(message));
    }
    function validate(field) {
      var value = (field.value || "").trim();
      if (field.type === "checkbox") {
        return field.checked ? "" : "Merci de cocher cette case pour continuer.";
      }
      if (field.required && !value) return "Ce champ est requis.";
      if (field.type === "email" && value && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(value)) {
        return "Cette adresse email semble incomplète.";
      }
      if (field.name === "message" && value && value.length < 12) {
        return "Quelques mots de plus nous aideraient à vous répondre.";
      }
      return "";
    }

    var fields = Array.from(form.querySelectorAll("[required]"));
    fields.forEach(function (field) {
      var event = field.type === "checkbox" ? "change" : "blur";
      field.addEventListener(event, function () { setError(field, validate(field)); });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") setError(field, validate(field));
      });
    });

    function say(message, state) {
      if (!status) return;
      status.textContent = message;
      status.classList.remove("is-ok", "is-ko");
      if (state) status.classList.add(state);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var firstInvalid = null;
      fields.forEach(function (field) {
        var message = validate(field);
        setError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        say("Quelques champs sont à compléter.", "is-ko");
        firstInvalid.focus({ preventScroll: false });
        return;
      }
      var endpoint = endpointOf();
      if (!endpoint) {
        say("Formulaire non relié : renseignez votre identifiant Formspree dans l’attribut action.", "is-ko");
        return;
      }
      if (submit) submit.disabled = true;
      say("Envoi en cours…");
      window.fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      }).then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        form.reset();
        fields.forEach(function (field) { setError(field, ""); });
        say("Message envoyé. Nous revenons vers vous sous 24 h.", "is-ok");
      }).catch(function () {
        say("L’envoi a échoué. Écrivez-nous à contact@novelios.fr.", "is-ko");
      }).then(function () {
        if (submit) submit.disabled = false;
      });
    });
  });

  // Bandeau clients : la piste dupliquée assure une boucle sans couture.
  document.querySelectorAll(".nlg-viewport").forEach(function (viewport) {
    var tracks = viewport.querySelectorAll(".nlg-track");
    if (tracks.length < 2) return;
    whenVisible([viewport], function () { viewport.classList.add("is-live"); }, { threshold: 0.05 });
  });

  // Bug Blaster : shoot'em up canvas volontairement compact et sans dépendance.
  var shmup = document.querySelector("[data-j01-shmup]");
  if (shmup) {
    var gameCanvas = shmup.querySelector("canvas");
    var gameContext = gameCanvas.getContext("2d");
    var gameWidth = gameCanvas.width;
    var gameHeight = gameCanvas.height;
    var robot = { x: 400, y: 245, tx: 400, ty: 245, w: 40, h: 38 };
    var shots = [];
    var threats = [];
    var threatNames = ["BUG", "RETARD", "PANNE", "IMPRÉVU"];
    var score = 0;
    var lives = 3;
    var gameState = "ready";
    var gameVisible = false;
    var lastFrame = 0;
    var lastSpawn = 0;
    var gameFrame = 0;

    function gamePointer(event) {
      var rect = gameCanvas.getBoundingClientRect();
      robot.tx = Math.max(18, Math.min(gameWidth - 18, (event.clientX - rect.left) * gameWidth / rect.width));
      robot.ty = Math.max(55, Math.min(gameHeight - 20, (event.clientY - rect.top) * gameHeight / rect.height));
    }

    function resetGame() {
      shots = [];
      threats = [];
      score = 0;
      lives = 3;
      lastSpawn = performance.now();
      gameState = "running";
    }

    function fire() {
      shots.push({ x: robot.x - 8, y: robot.y - 16 });
      shots.push({ x: robot.x + 8, y: robot.y - 16 });
    }

    function spawnThreat(now) {
      var name = threatNames[Math.floor(Math.random() * threatNames.length)];
      threats.push({
        x: 38 + Math.random() * (gameWidth - 76),
        y: -30,
        w: name === "IMPRÉVU" ? 66 : 56,
        h: 42,
        speed: 48 + Math.min(85, score / 18) + Math.random() * 25,
        name: name
      });
      lastSpawn = now;
    }

    function overlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function hitRobot() {
      lives = Math.max(0, lives - 1);
      if (lives <= 0) gameState = "over";
      return true;
    }

    function updateGame(delta, now) {
      if (gameState !== "running") return;
      var follow = reduceMotion ? 1 : Math.min(1, delta * 12);
      robot.x += (robot.tx - robot.x) * follow;
      robot.y += (robot.ty - robot.y) * follow;
      shots.forEach(function (shot) { shot.y -= 340 * delta; });
      threats.forEach(function (threat) { threat.y += threat.speed * delta; });
      shots = shots.filter(function (shot) {
        var hit = threats.find(function (threat) {
          return overlap({ x: shot.x - 2, y: shot.y - 6, w: 4, h: 12 }, { x: threat.x - threat.w / 2, y: threat.y - threat.h / 2, w: threat.w, h: threat.h });
        });
        if (hit) {
          threats.splice(threats.indexOf(hit), 1);
          score += 100;
          return false;
        }
        return shot.y > -10;
      });
      threats = threats.filter(function (threat) {
        var box = { x: threat.x - threat.w / 2, y: threat.y - threat.h / 2, w: threat.w, h: threat.h };
        if (overlap(box, { x: robot.x - 20, y: robot.y - 19, w: 40, h: 38 })) return !hitRobot(threat);
        if (threat.y > gameHeight + 20) return !hitRobot(threat);
        return true;
      });
      if (now - lastSpawn > Math.max(430, 1050 - score * .45)) spawnThreat(now);
    }

    function pixelText(text, x, y, size, color, align) {
      gameContext.fillStyle = color;
      gameContext.font = size + 'px "Geist Pixel", monospace';
      gameContext.textAlign = align || "left";
      gameContext.fillText(text, x, y);
    }

    function drawRobot() {
      var x = Math.round(robot.x), y = Math.round(robot.y);
      // Antenne et oreilles.
      gameContext.fillStyle = "#68cc58";
      gameContext.fillRect(x - 2, y - 24, 4, 5);
      gameContext.fillRect(x - 4, y - 27, 8, 4);
      gameContext.fillStyle = "#47739f";
      gameContext.fillRect(x - 22, y - 14, 5, 12);
      gameContext.fillRect(x + 17, y - 14, 5, 12);
      // Tête, visage et yeux.
      gameContext.fillStyle = "#1d70d9";
      gameContext.fillRect(x - 18, y - 19, 36, 20);
      gameContext.fillStyle = "#72b8ff";
      gameContext.fillRect(x - 13, y - 14, 26, 10);
      gameContext.fillStyle = "#071019";
      gameContext.fillRect(x - 9, y - 11, 5, 5);
      gameContext.fillRect(x + 4, y - 11, 5, 5);
      gameContext.fillRect(x - 5, y - 2, 10, 3);
      // Corps, cœur et bras-canons.
      gameContext.fillStyle = "#175aa9";
      gameContext.fillRect(x - 14, y + 2, 28, 17);
      gameContext.fillRect(x - 22, y + 4, 8, 12);
      gameContext.fillRect(x + 14, y + 4, 8, 12);
      gameContext.fillStyle = "#68cc58";
      gameContext.fillRect(x - 3, y + 7, 6, 6);
      // Propulseurs.
      gameContext.fillStyle = "#f0bf00";
      gameContext.fillRect(x - 11, y + 19, 7, 7);
      gameContext.fillRect(x + 4, y + 19, 7, 7);
    }

    function drawThreatIcon(threat, x, y) {
      gameContext.strokeStyle = "#f7f8f8";
      gameContext.fillStyle = "#f7f8f8";
      gameContext.lineWidth = 2;
      if (threat.name === "BUG") {
        gameContext.fillRect(x - 5, y - 5, 10, 10);
        gameContext.fillRect(x - 8, y - 2, 16, 4);
        gameContext.fillRect(x - 4, y - 8, 3, 3);
        gameContext.fillRect(x + 1, y - 8, 3, 3);
      } else if (threat.name === "RETARD") {
        gameContext.beginPath(); gameContext.arc(x, y - 1, 8, 0, Math.PI * 2); gameContext.stroke();
        gameContext.beginPath(); gameContext.moveTo(x, y - 1); gameContext.lineTo(x, y - 6); gameContext.moveTo(x, y - 1); gameContext.lineTo(x + 5, y + 2); gameContext.stroke();
      } else if (threat.name === "PANNE") {
        gameContext.beginPath(); gameContext.moveTo(x + 2, y - 10); gameContext.lineTo(x - 6, y + 1); gameContext.lineTo(x, y + 1); gameContext.lineTo(x - 2, y + 10); gameContext.lineTo(x + 7, y - 3); gameContext.lineTo(x + 1, y - 3); gameContext.fill();
      } else {
        pixelText("!", x, y + 7, 20, "#f7f8f8", "center");
      }
    }

    function drawGame(now) {
      gameContext.fillStyle = "#0c1117";
      gameContext.fillRect(0, 0, gameWidth, gameHeight);
      for (var i = 0; i < 34; i += 1) {
        var sy = (i * 67 + (reduceMotion ? 0 : now * (.012 + i % 3 * .005))) % gameHeight;
        gameContext.fillStyle = i % 5 ? "#243140" : "#47739f";
        gameContext.fillRect((i * 97) % gameWidth, sy, i % 4 ? 2 : 3, i % 4 ? 2 : 3);
      }
      gameContext.strokeStyle = "rgba(104,204,88,.18)";
      gameContext.beginPath(); gameContext.moveTo(0, gameHeight - 28); gameContext.lineTo(gameWidth, gameHeight - 28); gameContext.stroke();
      shots.forEach(function (shot) { gameContext.fillStyle = "#f0bf00"; gameContext.fillRect(Math.round(shot.x) - 2, Math.round(shot.y) - 7, 4, 12); });
      threats.forEach(function (threat) {
        var x = Math.round(threat.x - threat.w / 2), y = Math.round(threat.y - threat.h / 2);
        gameContext.fillStyle = threat.name === "BUG" ? "#b93642" : threat.name === "RETARD" ? "#a15f29" : "#8f3949";
        gameContext.fillRect(x, y, threat.w, threat.h);
        gameContext.fillStyle = "#0c1117";
        gameContext.fillRect(x + 3, y + 3, threat.w - 6, threat.h - 6);
        drawThreatIcon(threat, threat.x, threat.y - 7);
        pixelText(threat.name, threat.x, threat.y + 15, threat.name === "IMPRÉVU" ? 7 : 8, "#f7f8f8", "center");
      });
      drawRobot();
      pixelText("SCORE  " + String(score).padStart(5, "0"), 16, 23, 12, "#f7f8f8");
      pixelText("VIES  " + "■".repeat(lives), gameWidth - 16, 23, 12, lives === 1 ? "#d94a4a" : "#68cc58", "right");
      if (gameState !== "running") {
        gameContext.fillStyle = "rgba(5,8,11,.72)";
        gameContext.fillRect(0, 0, gameWidth, gameHeight);
        pixelText(gameState === "over" ? "GAME OVER" : "BUG BLASTER", gameWidth / 2, 125, 24, gameState === "over" ? "#d94a4a" : "#68cc58", "center");
        pixelText(gameState === "over" ? "SCORE  " + score + " · CLIQUEZ POUR REJOUER" : "CLIQUEZ POUR DÉMARRER", gameWidth / 2, 155, 11, "#f7f8f8", "center");
      }
    }

    function gameLoop(now) {
      gameFrame = 0;
      var delta = Math.min(.034, (now - lastFrame) / 1000 || 0);
      lastFrame = now;
      updateGame(delta, now);
      drawGame(now);
      if (gameVisible && !document.hidden) gameFrame = requestAnimationFrame(gameLoop);
    }

    function startGameLoop() {
      if (!gameFrame && gameVisible && !document.hidden) {
        lastFrame = performance.now();
        gameFrame = requestAnimationFrame(gameLoop);
      }
    }

    gameCanvas.addEventListener("pointermove", gamePointer);
    gameCanvas.addEventListener("pointerdown", function (event) {
      gamePointer(event);
      if (gameState !== "running") resetGame(); else fire();
      gameCanvas.focus();
    });
    gameCanvas.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.code !== "Space") return;
      event.preventDefault();
      if (gameState !== "running") resetGame(); else fire();
    });
    whenVisible([shmup], function () { gameVisible = true; startGameLoop(); }, { threshold: 0.05 });
    drawGame(0);
  }

  document.addEventListener("visibilitychange", function () {
    document.documentElement.classList.toggle("animations-paused", document.hidden);
    document.querySelectorAll(".tb-root").forEach(function (root) { root.classList.toggle("tb-paused", document.hidden); });
    document.querySelectorAll(".npw-root").forEach(function (root) { root.classList.toggle("npw-paused", document.hidden); });
    if (document.hidden && particleAnimationFrame) {
      cancelAnimationFrame(particleAnimationFrame);
      particleAnimationFrame = 0;
    } else {
      startParticleField();
      if (typeof startGameLoop === "function") startGameLoop();
    }
  });

  window.addEventListener("pagehide", function () {
    if (particleAnimationFrame) cancelAnimationFrame(particleAnimationFrame);
    if (gameFrame) cancelAnimationFrame(gameFrame);
    timers.forEach(function (timer) {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
  });
}());