const doctors = [
  {
    id: "kavitha1506",
    name: "Dr. Kavitha Raman",
    specialtyKey: "generalPhysician",
    image: "https://png.pngtree.com/png-vector/20240528/ourmid/pngtree-indian-doctor-woman-smiling-at-camera-png-image_12531120.png",
    initials: "KR"
  },
  {
    id: "Arjun1306",
    name: "Dr. Arjun Kumar",
    specialtyKey: "cardiologist",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=180&h=220&q=80",
    initials: "AK"
  },
  {
    id: "Nila1106",
    name: "Dr. Nila Srinivasan",
    specialtyKey: "dermatologist",
    image: "https://static.vecteezy.com/system/resources/thumbnails/047/883/550/small/young-indian-female-doctor-isolated-photo.jpg",
    initials: "NS"
  }
];

const translations = {
  en: {
    mainNavigation: "Main navigation", clinicHome: "Morrow Clinic Chennai home", chooseLanguage: "Choose language",
    workspace: "Workspace", overview: "Overview", appointments: "Appointments", careTeam: "Care team",
    needHelp: "Need a hand?", helpCopy: "Our team is here to help.", myClinic: "My clinic", patientPortal: "Patient portal",
    clinicLocation: "Chennai, Tamil Nadu · IST", clinicOpen: "Clinic open", welcomeEyebrow: "YOUR HEALTH, IN GOOD COMPANY",
    welcomeTitle: "Good care starts here", welcomeCopy: "Find your specialist and make time for what matters.",
    meetCareTeam: "Meet your care team", heroLabel: "Clinic appointment booking", heroKicker: "A LITTLE TIME FOR YOU",
    heroTitle: "Feeling better<br>is a good plan.", heroCopy: "Appointments with thoughtful people, at a time that works for you.",
    bookVisit: "Book a visit", heroImage: "A doctor ready to welcome a patient", heroNote: "Here for all<br>of your tomorrows.",
    clinicOverview: "Clinic overview", upcomingVisits: "UPCOMING VISITS", onCalendar: "On your calendar",
    specialists: "SPECIALISTS", readyToSeeYou: "Ready to see you", nextStep: "YOUR NEXT STEP",
    healthierDay: "A healthier day starts here", bookAppointment: "Book an appointment", yourSchedule: "YOUR SCHEDULE",
    filterAppointments: "Filter appointments", upcoming: "Upcoming", past: "Past", bookingEyebrow: "LET'S GET YOU SORTED",
    bookingCopy: "Choose a specialist and a time that suits you.", yourName: "Your name", namePlaceholder: "e.g. Kavitha Raman",
    contactLabel: "Email or mobile number", contactPlaceholder: "Email or 10-digit Indian mobile",
    chooseSpecialist: "Choose a specialist", selectDoctor: "Select a doctor", date: "Date", time: "Time",
    selectTime: "Select time", visitReason: "What would you like help with?", optional: "Optional",
    reasonPlaceholder: "A short note for your doctor", confirmAppointment: "Confirm appointment",
    confirmationNote: "You're almost done! Please review your appointment details before confirming.",
    privacyNote: "Demo portal. Details stay in this browser only.", peopleWhoListen: "PEOPLE WHO LISTEN",
    teamCaption: "Good humans. Good medicine.", footerNote: "Demo portal · Appointments are saved on this device",
    generalPhysician: "General physician", cardiologist: "Cardiologist", dermatologist: "Dermatologist",
    emptyUpcomingTitle: "Nothing on the calendar yet", emptyUpcomingCopy: "Your next visit can be the first step toward feeling better.",
    emptyPastTitle: "No past appointments", emptyPastCopy: "Completed visits will show up here.", findTime: "Find a time that works →",
    clinicSpecialist: "Clinic specialist", clinicVisit: "Clinic visit", cancel: "Cancel",
    confirmCancel: name => `Cancel the appointment for ${name}?`, cancelSuccess: "Appointment cancelled.",
    storageError: "Browser storage is unavailable. Your changes may not be saved.", appointmentConfirmed: "Appointment confirmed.",
    completeFields: "Please complete each required field.", chooseFuture: "Choose a future date and time.",
    invalidContact: "Enter a valid email address or Indian mobile number.", slotTaken: "That time is already booked with this specialist. Choose another slot.",
    bookedMessage: (name, date, time) => `You're booked with ${name} on ${date} at ${time}.`
  }
};

const storageKey = "morrow-clinic-appointments";
const form = document.querySelector("#booking-form");
const doctorSelect = document.querySelector("#doctor-select");
const dateInput = document.querySelector("#visit-date");
const timeSelect = document.querySelector("#visit-time");
const list = document.querySelector("#appointment-list");
const message = document.querySelector("#form-message");
const toast = document.querySelector("#toast");
let activeFilter = "upcoming";
let toastTimer;

function t(key, ...values) {
  const value = translations.en[key] ?? key;
  return typeof value === "function" ? value(...values) : value;
}

function applyLanguage() {
  document.documentElement.lang = "en-IN";
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const value = t(element.dataset.i18n);
    if (element.dataset.i18n === "heroTitle" || element.dataset.i18n === "heroNote") {
      element.innerHTML = value;
    } else {
      element.textContent = value;
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(element => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });
  document.querySelector("#today-label").textContent = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata", weekday: "short", month: "short", day: "numeric"
  });
  renderDoctors();
  renderAppointments();
}

function locale() {
  return "en-IN";
}

function localDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function indiaDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 6, 30));
}

function indiaTimeString(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).format(date);
}

function readAppointments() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let appointments = readAppointments();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function saveAppointments() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(appointments));
    return true;
  } catch {
    showToast(t("storageError"));
    return false;
  }
}

function isUpcoming(appointment) {
  return `${appointment.date}T${appointment.time}` >= `${localDateString()}T${indiaTimeString()}`;
}

function formatLongDate(dateString) {
  return indiaDate(dateString).toLocaleDateString(locale(), {
    timeZone: "Asia/Kolkata", weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return new Date(Date.UTC(2000, 0, 1, hours, minutes)).toLocaleTimeString(locale(), {
    timeZone: "UTC", hour: "numeric", minute: "2-digit"
  });
}

function doctorById(id) {
  return doctors.find(doctor => doctor.id === id);
}

function renderDoctors() {
  doctorSelect.innerHTML = `<option value="">${escapeHtml(t("selectDoctor"))}</option>` + doctors.map(doctor =>
    `<option value="${doctor.id}">${escapeHtml(doctor.name)} · ${escapeHtml(t(doctor.specialtyKey))}</option>`
  ).join("");

  document.querySelector("#doctor-list").innerHTML = doctors.map(doctor => `
    <article class="doctor-card">
      <div class="doctor-photo" aria-label="${escapeHtml(doctor.name)}">
        <span>${doctor.initials}</span>
        <img src="${doctor.image}" alt="" loading="lazy" onerror="this.remove()">
      </div>
      <div class="doctor-copy">
        <h3>${escapeHtml(doctor.name)}</h3>
        <p>${escapeHtml(t(doctor.specialtyKey))}</p>
        <button class="doctor-book" type="button" data-doctor="${doctor.id}"><span data-i18n="bookVisit">${escapeHtml(t("bookVisit"))}</span><span aria-hidden="true">→</span></button>
      </div>
    </article>
  `).join("");
}

function renderAppointments() {
  const filtered = appointments
    .filter(appointment => isUpcoming(appointment) === (activeFilter === "upcoming"))
    .sort((first, second) => `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`));

  if (!filtered.length) {
    const isPast = activeFilter === "past";
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-illustration" aria-hidden="true">${isPast ? "✓" : "+"}</div>
        <h3>${escapeHtml(t(isPast ? "emptyPastTitle" : "emptyUpcomingTitle"))}</h3>
        <p>${escapeHtml(t(isPast ? "emptyPastCopy" : "emptyUpcomingCopy"))}</p>
        ${isPast ? "" : `<a class="empty-cta" href="#book-visit">${escapeHtml(t("findTime"))}</a>`}
      </div>`;
  } else {
    list.innerHTML = filtered.map(appointment => {
      const doctor = doctorById(appointment.doctorId);
      const date = indiaDate(appointment.date);
      const doctorName = doctor?.name || t("clinicSpecialist");
      const specialty = doctor ? t(doctor.specialtyKey) : t("clinicVisit");
      return `
        <article class="appointment-row">
          <div class="date-tile"><span>${date.toLocaleDateString(locale(), { timeZone: "Asia/Kolkata", month: "short" })}</span><span>${date.toLocaleDateString(locale(), { timeZone: "Asia/Kolkata", day: "numeric" })}</span></div>
          <div class="appointment-info">
            <strong>${escapeHtml(appointment.patientName)} <span aria-hidden="true">·</span> ${escapeHtml(doctorName)}</strong>
            <span>${escapeHtml(appointment.reason || specialty)} · ${formatLongDate(appointment.date)}</span>
          </div>
          <div class="appointment-meta">
            <time>${formatTime(appointment.time)}</time>
            ${activeFilter === "upcoming" ? `<button class="cancel-button" type="button" data-cancel="${escapeHtml(appointment.id)}">${escapeHtml(t("cancel"))}</button>` : ""}
          </div>
        </article>`;
    }).join("");
  }

  updateStats();
}

function updateStats() {
  const upcoming = appointments.filter(isUpcoming).length;
  const next = appointments.filter(isUpcoming)
    .sort((first, second) => `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`))[0];
  document.querySelector("#upcoming-count").textContent = upcoming;
  document.querySelector("#doctor-count").textContent = doctors.length;
  document.querySelector("#next-visit-stat").textContent = next
    ? indiaDate(next.date).toLocaleDateString(locale(), { timeZone: "Asia/Kolkata", month: "short", day: "numeric" })
    : t("bookVisit");
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3200);
}

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `form-message${type ? ` ${type}` : ""}`;
}

dateInput.min = localDateString();
applyLanguage();

document.querySelectorAll(".segment").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".segment").forEach(segment => {
      const selected = segment === button;
      segment.classList.toggle("active", selected);
      segment.setAttribute("aria-pressed", String(selected));
    });
    renderAppointments();
  });
});

document.querySelector("#doctor-list").addEventListener("click", event => {
  const button = event.target.closest("[data-doctor]");
  if (!button) return;
  doctorSelect.value = button.dataset.doctor;
  document.querySelector("#book-visit").scrollIntoView({ behavior: "smooth", block: "start" });
  doctorSelect.focus({ preventScroll: true });
});

list.addEventListener("click", event => {
  const button = event.target.closest("[data-cancel]");
  if (!button) return;
  const appointment = appointments.find(item => String(item.id) === button.dataset.cancel);
  if (!appointment || !window.confirm(t("confirmCancel", appointment.patientName))) return;
  appointments = appointments.filter(item => String(item.id) !== button.dataset.cancel);
  saveAppointments();
  renderAppointments();
  showToast(t("cancelSuccess"));
});

form.addEventListener("submit", event => {
  event.preventDefault();
  setMessage("");

  const formData = new FormData(form);
  const doctorId = String(formData.get("doctor"));
  const doctor = doctorById(doctorId);
  const date = String(formData.get("date"));
  const time = String(formData.get("time"));
  const patientName = String(formData.get("patientName")).trim();
  const contact = String(formData.get("contact")).trim();
  const reason = String(formData.get("reason")).trim();

  if (!doctor || !patientName || !contact || !date || !time) {
    setMessage(t("completeFields"));
    return;
  }
  if (date < localDateString() || (date === localDateString() && time <= indiaTimeString())) {
    setMessage(t("chooseFuture"));
    return;
  }
  const normalizedContact = contact.replace(/[\s()-]/g, "");
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isIndianMobile = /^(?:\+?91)?[6-9]\d{9}$/.test(normalizedContact);
  if (!isEmail && !isIndianMobile) {
    setMessage(t("invalidContact"));
    return;
  }
  if (appointments.some(item => item.doctorId === doctorId && item.date === date && item.time === time)) {
    setMessage(t("slotTaken"));
    return;
  }

  const appointment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    patientName,
    contact,
    doctorId,
    date,
    time,
    reason
  };
  appointments.push(appointment);
  saveAppointments();
  activeFilter = "upcoming";
  document.querySelectorAll(".segment").forEach(segment => {
    const selected = segment.dataset.filter === activeFilter;
    segment.classList.toggle("active", selected);
    segment.setAttribute("aria-pressed", String(selected));
  });
  renderAppointments();
  form.reset();
  dateInput.min = localDateString();
  setMessage(t("bookedMessage", doctor.name, formatLongDate(date), formatTime(time)), "success");
  showToast(t("appointmentConfirmed"));
});