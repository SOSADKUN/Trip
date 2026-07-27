// ---------- MOCK DATA ----------
// Shaped to match the Firestore "destinations" documents:
// badge, budget, city, country, img, pdf, rating, remarks: []
const stats = [
  { icon:"🌐", value:24, label:"Countries explored" },
  { icon:"🏙️", value:68, label:"Cities discovered" },
  { icon:"♡", value:18, label:"Wishlist places" },
  { icon:"✈️", value:12, label:"Visited places" },
  { icon:"🗓️", value:3, label:"Upcoming trips" },
];

const filters = [
  { label:"All", active:true },
  { label:"🌏 Asia" },
  { label:"🌍 Europe" },
  { label:"🌊 Oceania" },
  { label:"🌎 America" },
  { label:"♡ Visited" },
  { label:"○ Not Visited" },
  { label:"♡ Wishlist" },
];

// Fallback data — shown instantly, replaced by Firestore data once it loads
let destinations = [
  {
    country:"Japan", city:"Tokyo", rating:4.8, budget:"3500",
    badge:"Trending",
    img:"https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop",
    pdf:"pdf/japan.pdf",
    remarks:["Cherry blossoms in April are unreal", "Try the ramen in Shinjuku"]
  },
  {
    country:"Greece", city:"Santorini", rating:4.7, budget:"6200",
    badge:"Popular",
    img:"https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop",
    pdf:"pdf/greece.pdf",
    remarks:["Sunset at Oia is worth the crowd"]
  },
  {
    country:"France", city:"Paris", rating:4.9, budget:"4800",
    badge:"Trending",
    img:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
    pdf:"pdf/france.pdf",
    remarks:["Book the Louvre tickets ahead", "Great in early autumn"]
  },
  {
    country:"Thailand", city:"Phuket", rating:4.6, budget:"2800",
    badge:"Best Value",
    img:"https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=80&w=800&auto=format&fit=crop",
    pdf:"pdf/thailand.pdf",
    remarks:["Island hopping is a must", "Bring reef-safe sunscreen"]
  },
];

// ---------- RENDER: STATS ----------
const statsRow = document.getElementById("statsRow");
stats.forEach(s => {
  statsRow.innerHTML += `
    <div class="stat">
      <div class="stat-icon">${s.icon}</div>
      <div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    </div>`;
});

// ---------- RENDER: FILTER CHIPS ----------
const filterChips = document.getElementById("filterChips");
filters.forEach(f => {
  filterChips.innerHTML += `<button class="chip ${f.active ? "active" : ""}">${f.label}</button>`;
});
filterChips.innerHTML += `<button class="chip more">☰ More Filters</button>`;

filterChips.addEventListener("click", (e) => {
  if(e.target.classList.contains("chip") && !e.target.classList.contains("more")){
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    e.target.classList.add("active");
  }
});

// ---------- HELPERS ----------
function formatBudget(budget){
  const n = Number(budget);
  return `RM ${isNaN(n) ? budget : n.toLocaleString()}`;
}

function remarkCount(d){
  return Array.isArray(d.remarks) ? d.remarks.length : 0;
}

// ---------- RENDER: DESTINATION CARDS ----------
const cardGrid = document.getElementById("cardGrid");

function renderCards(list){
  cardGrid.innerHTML = "";
  list.forEach((d, i) => {
    cardGrid.innerHTML += `
      <div class="card" data-index="${i}">
        <div class="card-media">
          <img src="${d.img}" alt="${d.city}, ${d.country}">
          <span class="card-badge">${d.badge}</span>
          <span class="card-fav" data-fav>♡</span>
        </div>
        <div class="card-body">
          <div class="card-title">${d.country}</div>
          <div class="card-loc">${d.city}</div>
          <div class="card-meta">
            <div class="card-rating"><span class="star">★</span>${d.rating} <span class="count">(${remarkCount(d)} remarks)</span></div>
            <div class="card-price">From <strong>${formatBudget(d.budget)}</strong></div>
          </div>
        </div>
      </div>`;
  });
}

renderCards(destinations); // instant fallback render

// ---------- MODAL (destination popup) ----------
const modalOverlay = document.getElementById("modalOverlay");
const modalImg = document.getElementById("modalImg");
const modalTitle = document.getElementById("modalTitle");
const modalLoc = document.getElementById("modalLoc");
const modalRating = document.getElementById("modalRating");
const modalBudget = document.getElementById("modalBudget");
const modalRemarks = document.getElementById("modalRemarks");
const modalPdfBtn = document.getElementById("modalPdfBtn");
const modalClose = document.getElementById("modalClose");

function openModal(destination){
  modalImg.src = destination.img;
  modalImg.alt = `${destination.city}, ${destination.country}`;
  modalTitle.textContent = destination.country;
  modalLoc.textContent = destination.city;
  modalRating.textContent = `★ ${destination.rating}`;
  modalBudget.textContent = `From ${formatBudget(destination.budget)}`;
  modalPdfBtn.href = destination.pdf
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(destination.pdf)}&embedded=true`
    : "#";

  modalRemarks.innerHTML = "";
  (destination.remarks || []).forEach(r => {
    modalRemarks.innerHTML += `<li>${r}</li>`;
  });

  modalOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal(){
  modalOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

cardGrid.addEventListener("click", (e) => {
  if(e.target.hasAttribute("data-fav")){
    e.target.textContent = e.target.textContent === "♡" ? "♥" : "♡";
    return;
  }
  const card = e.target.closest(".card");
  if(!card) return;
  const index = card.getAttribute("data-index");
  openModal(destinations[index]);
});

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if(e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeModal();
});

// ---------- FIRESTORE: load real destinations once Firebase is ready ----------
window.addEventListener("firebase-ready", async () => {
  try {
    const db = window.db;
    const snapshot = await window.firestoreGetDocs(window.firestoreCollection(db, "destinations"));

    if (!snapshot.empty) {
      destinations = snapshot.docs.map(doc => doc.data());
      renderCards(destinations); // replace fallback with real Firestore data
    } else {
      console.log("Firestore 'destinations' collection is empty — showing fallback mock data for now.");
    }
  } catch (err) {
    console.error("Could not load destinations from Firestore, showing fallback data:", err);
  }
});