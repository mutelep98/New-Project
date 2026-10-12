document.documentElement.classList.add("js");
(() => {
  "use strict";
  const config = window.WEDDING_CONFIG || {};
  const couple = config.couple || {};
  const venue = config.venue || {};
  const put = (selector, value) => {
    if (value) document.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  };
  put('[data-couple="first"]', couple.first);
  put('[data-couple="second"]', couple.second);

  const date = config.dateTime ? new Date(config.dateTime) : null;
  const validDate = date && !Number.isNaN(date.getTime());
  const shortDate = validDate ? new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long" }).format(date) : "التاريخ هيتضاف قريبًا";
  const longDate = validDate ? new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date) : "قريبًا";
  const venueText = [venue.name, venue.city].filter(Boolean).join(" — ") || "اسم القاعة والمدينة قريبًا";
  put('[data-detail="date-short"]', shortDate);
  put('[data-detail="date-long"]', longDate);
  put('[data-detail="time"]', config.timeLabel || (validDate ? new Intl.DateTimeFormat("ar-EG", { hour: "numeric", minute: "2-digit" }).format(date) : "هنستناكم على نور"));
  put('[data-detail="venue"]', venueText);
  put('[data-detail="venue-long"]', venueText);

  const hint = document.getElementById("count-hint");
  const counters = Object.fromEntries(["days", "hours", "minutes", "seconds"].map((unit) => [unit, document.querySelector('[data-count="' + unit + '"]')]));
  const tick = () => {
    if (!validDate) return;
    const remaining = Math.max(0, date.getTime() - Date.now());
    const values = { days: Math.floor(remaining / 86400000), hours: Math.floor(remaining / 3600000) % 24, minutes: Math.floor(remaining / 60000) % 60, seconds: Math.floor(remaining / 1000) % 60 };
    Object.entries(values).forEach(([key, value]) => { counters[key].textContent = String(value).padStart(2, "0"); });
    hint.textContent = remaining ? "كل ثانية بتقرّبنا من ليلتنا." : "الليلة بدأت — مستنيينكم!";
  };
  tick();
  if (validDate) window.setInterval(tick, 1000);

  const mapLink = document.getElementById("map-link");
  if (venue.mapUrl) {
    try {
      const url = new URL(venue.mapUrl);
      if (/^https?:$/.test(url.protocol)) {
        mapLink.href = url.href; mapLink.target = "_blank"; mapLink.rel = "noopener noreferrer";
        mapLink.classList.remove("disabled"); mapLink.removeAttribute("aria-disabled"); mapLink.textContent = "افتحوا الخريطة ↗";
      }
    } catch { /* يظل الرابط غير مفعّل حتى إضافة رابط صحيح. */ }
  }

  const calendarLink = document.getElementById("calendar-link");
  if (validDate) {
    const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const end = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    const title = [couple.first, couple.second].filter(Boolean).join(" & ") || "ليلة الفرح";
    const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates: stamp(date) + "/" + stamp(end), details: "مستنيينكم تشاركونا فرحتنا.", location: [venue.name, venue.address, venue.city].filter(Boolean).join(", ") });
    calendarLink.href = "https://calendar.google.com/calendar/render?" + params.toString();
    calendarLink.target = "_blank"; calendarLink.rel = "noopener noreferrer";
    calendarLink.classList.remove("disabled"); calendarLink.removeAttribute("aria-disabled");
  }

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, current) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("reveal-visible"); current.unobserve(entry.target); }
    }), { threshold: 0.12 });
    reveals.forEach((item) => observer.observe(item));
  } else reveals.forEach((item) => item.classList.add("reveal-visible"));

  const path = document.getElementById("route");
  const traveler = document.getElementById("traveler");
  const halo = document.getElementById("halo");
  const hero = document.querySelector(".hero");
  let replaying = false, framePending = false;
  const move = (fraction) => {
    const point = path.getPointAtLength(path.getTotalLength() * Math.max(0, Math.min(1, fraction)));
    [traveler, halo].forEach((dot) => { dot.setAttribute("cx", point.x); dot.setAttribute("cy", point.y); });
  };
  const followScroll = () => {
    framePending = false;
    if (replaying) return;
    move(Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / (hero.offsetHeight * .72))));
  };
  window.addEventListener("scroll", () => {
    if (!framePending) { framePending = true; requestAnimationFrame(followScroll); }
  }, { passive: true });
  window.addEventListener("resize", followScroll);
  followScroll();
  document.getElementById("replay").addEventListener("click", () => {
    replaying = true;
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min(1, (now - start) / 1450);
      move(t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      if (t < 1) requestAnimationFrame(animate); else { replaying = false; followScroll(); }
    };
    requestAnimationFrame(animate);
  });

  const form = document.getElementById("rsvp-form");
  const status = document.getElementById("form-status");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const phone = String(config.whatsappNumber || "").replace(/\D/g, "");
    if (!/^\d{8,15}$/.test(phone)) {
      status.textContent = "أضيفوا رقم واتساب الدولي في wedding-config.js لتفعيل تأكيد الحضور.";
      return;
    }
    const fields = new FormData(form);
    const name = fields.get("guest-name");
    const going = fields.get("attendance") === "yes";
    const guests = fields.get("guest-count");
    const answer = going ? "أكيد هحضر" : "مش هقدر أحضر";
    const message = "أهلًا، أنا " + name + ". " + answer + " فرحكم" + (going ? "، وعددنا " + guests + "." : ".") + " ألف مبروك!";
    status.textContent = "واتساب هيفتح برسالة جاهزة؛ اضغطوا إرسال لتأكيد الرد.";
    window.location.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  });

  const celebrate = () => {
    ["✳", "✦", "·"].forEach((symbol, group) => {
      for (let i = 0; i < (group === 0 ? 6 : 4); i += 1) {
        const spark = document.createElement("span"); spark.className = "spark"; spark.textContent = symbol;
        spark.style.left = (innerWidth * (.35 + Math.random() * .3)) + "px"; spark.style.top = (innerHeight * (.55 + Math.random() * .1)) + "px";
        spark.style.setProperty("--x", ((Math.random() - .5) * 150) + "px"); spark.style.setProperty("--y", (-30 - Math.random() * 120) + "px");
        document.body.append(spark); setTimeout(() => spark.remove(), 1050);
      }
    });
  };
  document.querySelectorAll('input[name="attendance"]').forEach((input) => input.addEventListener("change", () => {
    if (input.checked && input.value === "yes") celebrate();
  }));
})();
