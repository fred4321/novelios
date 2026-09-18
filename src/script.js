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
    var robot = { x: 400, y: 245, tx: 400, ty: 245, w: 34, h: 32 };
    var shots = [];
    var threats = [];
    var bonuses = [];
    var threatTypes = [
      { name: "BUG", color: "#ff4f64" },
      { name: "RETARD", color: "#ffad32" },
      { name: "PANNE", color: "#ffe14a" },
      { name: "DÉPASSEMENT", color: "#b879ff" },
      { name: "CONGÉS", color: "#45dbb2" },
      { name: "TURNOVER", color: "#59a8ff" },
      { name: "PLANTAGE", color: "#57d7ff" },
      { name: "CRASH", color: "#ff704d" }
    ];
    var score = 0;
    var lives = 3;
    var deploymentGoal = 7000;
    var phases = ["Cadrage", "Préparation", "Déploiement", "Mise en service"];
    var bonusTypes = [
      { name: "ANTICIPATION", color: "#57d7ff", symbol: "A", description: "obstacles ralentis" },
      { name: "COORDINATION", color: "#68cc58", symbol: "C", description: "tirs renforcés" },
      { name: "ARBITRAGE", color: "#f0bf00", symbol: "X", description: "écran dégagé" },
      { name: "AVANCE", color: "#b879ff", symbol: "+", description: "bouclier activé" }
    ];
    var gameState = "ready";
    var gameVisible = false;
    var lastFrame = 0;
    var lastSpawn = 0;
    var nextBonusAt = 0;
    var slowUntil = 0;
    var wideUntil = 0;
    var shieldUntil = 0;
    var bonusMessageUntil = 0;
    var bonusMessage = "";
    var gameFrame = 0;
    var progressFill = shmup.querySelector("[data-shmup-progress]");
    var progressSteps = Array.from(shmup.querySelectorAll("[data-shmup-steps] li"));
    var gameStatus = shmup.querySelector("[data-shmup-status]");
    var resultPanel = shmup.querySelector("[data-shmup-result]");
    var resultTitle = shmup.querySelector("[data-shmup-result-title]");
    var resultCopy = shmup.querySelector("[data-shmup-result-copy]");
    var projectLink = shmup.querySelector("[data-shmup-project-link]");
    var retryButton = shmup.querySelector("[data-shmup-retry]");

    function gamePointer(event) {
      var rect = gameCanvas.getBoundingClientRect();
      robot.tx = Math.max(18, Math.min(gameWidth - 18, (event.clientX - rect.left) * gameWidth / rect.width));
      robot.ty = Math.max(55, Math.min(gameHeight - 20, (event.clientY - rect.top) * gameHeight / rect.height));
    }

    function resetGame() {
      shots = [];
      threats = [];
      bonuses = [];
      score = 0;
      lives = 3;
      lastSpawn = performance.now();
      nextBonusAt = lastSpawn + 5000;
      slowUntil = 0;
      wideUntil = 0;
      shieldUntil = 0;
      bonusMessageUntil = 0;
      gameState = "running";
      resultPanel.hidden = true;
      resultPanel.classList.remove("is-won", "is-lost");
      updateProgress(lastSpawn);
    }

    function fire() {
      var reinforced = performance.now() < wideUntil;
      shots.push({ x: robot.x - (reinforced ? 13 : 7), y: robot.y - 15, w: reinforced ? 9 : 4 });
      shots.push({ x: robot.x + (reinforced ? 13 : 7), y: robot.y - 15, w: reinforced ? 9 : 4 });
    }

    function spawnThreat(now) {
      var type = threatTypes[Math.floor(Math.random() * threatTypes.length)];
      threats.push({
        x: 28 + Math.random() * (gameWidth - 56),
        y: -30,
        w: 38,
        h: 38,
        speed: 44 + Math.min(42, score / 42) + Math.random() * 20,
        name: type.name,
        color: type.color
      });
      lastSpawn = now;
    }

    function spawnBonus(now) {
      var type = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
      bonuses.push({ x: 36 + Math.random() * (gameWidth - 72), y: -24, w: 30, h: 30, speed: 50, name: type.name, color: type.color, symbol: type.symbol, description: type.description });
      nextBonusAt = now + 6500 + Math.random() * 3500;
    }

    function updateProgress(now) {
      var progress = Math.min(1, score / deploymentGoal);
      var phaseIndex = Math.min(3, Math.floor(progress * 4));
      progressFill.style.transform = "scaleX(" + progress.toFixed(3) + ")";
      progressSteps.forEach(function (step, index) {
        step.classList.toggle("is-complete", index < phaseIndex || progress === 1);
        step.classList.toggle("is-active", index === phaseIndex && progress < 1);
      });
      if (gameState === "running") {
        var activeEffects = [];
        if (now < slowUntil) activeEffects.push("ANTICIPATION");
        if (now < wideUntil) activeEffects.push("COORDINATION");
        if (now < shieldUntil) activeEffects.push("AVANCE");
        gameStatus.classList.toggle("is-bonus", now < bonusMessageUntil || activeEffects.length > 0);
        gameStatus.textContent = now < bonusMessageUntil ? bonusMessage : "Phase " + (phaseIndex + 1) + "/4 · " + phases[phaseIndex] + (activeEffects.length ? " · " + activeEffects.join(" + ") : "");
      }
    }

    function endGame(state) {
      gameState = state;
      resultPanel.hidden = false;
      var won = state === "won";
      resultPanel.classList.toggle("is-won", won);
      resultPanel.classList.toggle("is-lost", !won);
      resultTitle.textContent = won ? "Mise en production réussie !" : "Les obstacles ont pris le dessus…";
      resultCopy.textContent = won ? "Votre projet est en service." : "Nouvelle tentative ?";
      projectLink.hidden = !won;
      retryButton.hidden = won;
      gameStatus.textContent = won ? "PROJET LIVRÉ · MISE EN SERVICE TERMINÉE" : "PROJET INTERROMPU · RETENTEZ VOTRE CHANCE";
      gameStatus.classList.toggle("is-bonus", won);
    }

    function overlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function hitRobot(now) {
      if (now < shieldUntil) {
        bonusMessage = "AVANCE · obstacle absorbé par le bouclier";
        bonusMessageUntil = now + 1200;
        return true;
      }
      lives = Math.max(0, lives - 1);
      if (lives <= 0) endGame("over");
      return true;
    }

    function collectBonus(bonus, now) {
      if (bonus.name === "ANTICIPATION") slowUntil = now + 6000;
      if (bonus.name === "COORDINATION") wideUntil = now + 7000;
      if (bonus.name === "ARBITRAGE") {
        score = Math.min(deploymentGoal, score + threats.length * 100);
        threats = [];
      }
      if (bonus.name === "AVANCE") shieldUntil = now + 6000;
      bonusMessage = bonus.name + " · " + bonus.description;
      bonusMessageUntil = now + 1800;
      if (score >= deploymentGoal) endGame("won");
    }

    function updateGame(delta, now) {
      if (gameState !== "running") return;
      var follow = reduceMotion ? 1 : Math.min(1, delta * 12);
      robot.x += (robot.tx - robot.x) * follow;
      robot.y += (robot.ty - robot.y) * follow;
      shots.forEach(function (shot) { shot.y -= 340 * delta; });
      threats.forEach(function (threat) { threat.y += threat.speed * (now < slowUntil ? .52 : 1) * delta; });
      bonuses.forEach(function (bonus) { bonus.y += bonus.speed * delta; });
      shots = shots.filter(function (shot) {
        var hit = threats.find(function (threat) {
          return overlap({ x: shot.x - shot.w / 2, y: shot.y - 6, w: shot.w, h: 12 }, { x: threat.x - threat.w / 2, y: threat.y - threat.h / 2, w: threat.w, h: threat.h });
        });
        if (hit) {
          threats.splice(threats.indexOf(hit), 1);
          score += 100;
          if (score >= deploymentGoal) endGame("won");
          return false;
        }
        return shot.y > -10;
      });
      threats = threats.filter(function (threat) {
        var box = { x: threat.x - threat.w / 2, y: threat.y - threat.h / 2, w: threat.w, h: threat.h };
        if (overlap(box, { x: robot.x - robot.w / 2, y: robot.y - robot.h / 2, w: robot.w, h: robot.h })) return !hitRobot(now);
        if (threat.y > gameHeight + 20) return !hitRobot(now);
        return true;
      });
      bonuses = bonuses.filter(function (bonus) {
        var box = { x: bonus.x - bonus.w / 2, y: bonus.y - bonus.h / 2, w: bonus.w, h: bonus.h };
        if (overlap(box, { x: robot.x - robot.w / 2, y: robot.y - robot.h / 2, w: robot.w, h: robot.h })) {
          collectBonus(bonus, now);
          return false;
        }
        return bonus.y < gameHeight + 24;
      });
      if (gameState === "running" && now - lastSpawn > Math.max(610, 1120 - score * .18)) spawnThreat(now);
      if (gameState === "running" && now >= nextBonusAt && bonuses.length === 0) spawnBonus(now);
      updateProgress(now);
    }

    function pixelText(text, x, y, size, color, align) {
      gameContext.fillStyle = color;
      gameContext.font = size + 'px "Geist Pixel", monospace';
      gameContext.textAlign = align || "left";
      gameContext.fillText(text, x, y);
    }

    function drawRobot() {
      var x = Math.round(robot.x), y = Math.round(robot.y);
      gameContext.save();
      gameContext.translate(x, y);
      gameContext.scale(.84, .84);
      x = 0; y = 0;
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
      gameContext.restore();
      if (performance.now() < shieldUntil) {
        gameContext.save();
        gameContext.strokeStyle = "#b879ff";
        gameContext.lineWidth = 3;
        gameContext.shadowColor = "#b879ff";
        gameContext.shadowBlur = 12;
        gameContext.beginPath();
        gameContext.arc(Math.round(robot.x), Math.round(robot.y), 27, 0, Math.PI * 2);
        gameContext.stroke();
        gameContext.restore();
      }
    }

    function drawBonus(context, bonus, x, y, scale) {
      context.save();
      context.translate(x, y);
      context.rotate(Math.PI / 4);
      context.fillStyle = "rgba(7, 16, 25, .92)";
      context.strokeStyle = bonus.color;
      context.lineWidth = 3 * scale;
      context.shadowColor = bonus.color;
      context.shadowBlur = 12 * scale;
      context.fillRect(-10 * scale, -10 * scale, 20 * scale, 20 * scale);
      context.strokeRect(-10 * scale, -10 * scale, 20 * scale, 20 * scale);
      context.rotate(-Math.PI / 4);
      context.fillStyle = bonus.color;
      context.font = Math.round(13 * scale) + 'px "Geist Pixel", monospace';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(bonus.symbol, 0, 1);
      context.restore();
    }

    function drawThreatIcon(context, threat, x, y, scale) {
      function rect(rx, ry, rw, rh) { context.fillRect(x + rx * scale, y + ry * scale, rw * scale, rh * scale); }
      context.save();
      context.fillStyle = threat.color;
      context.strokeStyle = threat.color;
      context.lineWidth = 2 * scale;
      context.shadowColor = threat.color;
      context.shadowBlur = 7 * scale;
      if (threat.name === "BUG") {
        rect(-5, -6, 10, 13); rect(-9, -3, 18, 3); rect(-8, 4, 5, 3); rect(3, 4, 5, 3); rect(-5, -10, 3, 4); rect(2, -10, 3, 4);
      } else if (threat.name === "RETARD") {
        context.beginPath(); context.arc(x, y, 9 * scale, 0, Math.PI * 2); context.stroke();
        context.beginPath(); context.moveTo(x, y); context.lineTo(x, y - 6 * scale); context.lineTo(x + 5 * scale, y + 3 * scale); context.stroke(); rect(-3, -13, 6, 3);
      } else if (threat.name === "PANNE") {
        context.beginPath(); context.moveTo(x + 2 * scale, y - 12 * scale); context.lineTo(x - 7 * scale, y + scale); context.lineTo(x - scale, y + scale); context.lineTo(x - 4 * scale, y + 12 * scale); context.lineTo(x + 8 * scale, y - 3 * scale); context.lineTo(x + scale, y - 3 * scale); context.fill();
      } else if (threat.name === "IMPRÉVU") {
        context.beginPath(); context.moveTo(x, y - 12 * scale); context.lineTo(x + 11 * scale, y + 9 * scale); context.lineTo(x - 11 * scale, y + 9 * scale); context.closePath(); context.stroke(); rect(-1.5, -5, 3, 8); rect(-1.5, 5, 3, 3);
      } else if (threat.name === "CONGÉS") {
        context.beginPath(); context.arc(x + 6 * scale, y - 6 * scale, 5 * scale, 0, Math.PI * 2); context.fill(); rect(-8, 4, 16, 3); rect(-1, -7, 3, 12); rect(-8, -6, 7, 3); rect(-6, -9, 5, 3); rect(2, -2, 7, 3);
      } else if (threat.name === "TURNOVER") {
        context.beginPath(); context.arc(x, y - 5 * scale, 4 * scale, 0, Math.PI * 2); context.fill(); rect(-7, 1, 14, 7); rect(-12, 8, 7, 3); rect(5, 8, 7, 3); rect(-12, 5, 3, 6); rect(9, 5, 3, 6);
      } else if (threat.name === "PLANTAGE") {
        context.strokeRect(x - 10 * scale, y - 8 * scale, 20 * scale, 15 * scale); rect(-3, 7, 6, 4); rect(-7, 11, 14, 2); context.beginPath(); context.moveTo(x - 5 * scale, y - 4 * scale); context.lineTo(x + 5 * scale, y + 4 * scale); context.moveTo(x + 5 * scale, y - 4 * scale); context.lineTo(x - 5 * scale, y + 4 * scale); context.stroke();
      } else {
        rect(-3, -12, 6, 7); rect(-3, 5, 6, 7); rect(-12, -3, 7, 6); rect(5, -3, 7, 6); rect(-8, -8, 5, 5); rect(3, 3, 5, 5); rect(3, -8, 5, 5); rect(-8, 3, 5, 5); rect(-3, -3, 6, 6);
      }
      context.restore();
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
      shots.forEach(function (shot) { gameContext.fillStyle = "#f0bf00"; gameContext.fillRect(Math.round(shot.x - shot.w / 2), Math.round(shot.y) - 7, shot.w, 12); });
      threats.forEach(function (threat) {
        drawThreatIcon(gameContext, threat, Math.round(threat.x), Math.round(threat.y), 1.15);
      });
      bonuses.forEach(function (bonus) { drawBonus(gameContext, bonus, Math.round(bonus.x), Math.round(bonus.y), 1); });
      drawRobot();
      pixelText("SCORE  " + String(score).padStart(5, "0"), 16, 23, 12, "#f7f8f8");
      pixelText("CRÉDITS  " + "■".repeat(lives), gameWidth - 16, 23, 12, lives === 1 ? "#d94a4a" : "#68cc58", "right");
      if (gameState !== "running") {
        gameContext.fillStyle = "rgba(5,8,11,.72)";
        gameContext.fillRect(0, 0, gameWidth, gameHeight);
        var won = gameState === "won";
        var lost = gameState === "over";
        pixelText(won ? "MISE EN PRODUCTION RÉUSSIE !" : lost ? "LES OBSTACLES ONT PRIS LE DESSUS…" : "BUG BLASTER", gameWidth / 2, 125, won || lost ? 18 : 24, won ? "#68cc58" : lost ? "#d94a4a" : "#68cc58", "center");
        pixelText(won ? "VOTRE PROJET EST EN SERVICE" : lost ? "NOUVELLE TENTATIVE ?" : "CLIQUEZ POUR DÉMARRER", gameWidth / 2, 155, 15, "#f7f8f8", "center");
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
      if (gameState === "ready" || gameState === "over") resetGame(); else if (gameState === "running") fire();
      gameCanvas.focus();
    });
    gameCanvas.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.code !== "Space") return;
      event.preventDefault();
      if (gameState === "ready" || gameState === "over") resetGame(); else if (gameState === "running") fire();
    });
    var gameLegend = shmup.querySelector("[data-shmup-legend]");
    threatTypes.forEach(function (type) {
      var item = document.createElement("span");
      var icon = document.createElement("canvas");
      icon.width = 32; icon.height = 32;
      item.appendChild(icon);
      item.appendChild(document.createTextNode(type.name));
      gameLegend.appendChild(item);
      drawThreatIcon(icon.getContext("2d"), type, 16, 16, .85);
    });
    var bonusLegend = shmup.querySelector("[data-shmup-bonus-legend]");
    bonusTypes.forEach(function (type) {
      var item = document.createElement("span");
      var icon = document.createElement("canvas");
      icon.width = 32; icon.height = 32;
      item.appendChild(icon);
      item.appendChild(document.createTextNode(type.name + " · " + type.description));
      bonusLegend.appendChild(item);
      drawBonus(icon.getContext("2d"), type, 16, 16, .78);
    });
    retryButton.addEventListener("click", resetGame);
    whenVisible([shmup], function () {
      gameVisible = true;
      resetGame();
      startGameLoop();
    }, { threshold: 0.05 });
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