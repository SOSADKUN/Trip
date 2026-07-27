// ---------- MOCK DATA ----------
// Shaped to match the Firestore "destinations" documents:
// badge, budget, city, country, img, pdf, rating, remarks: [],
// continent, visited, wishlist
//
// NOTE: for real filtering to work (Asia/Europe/... and Visited/Wishlist),
// each document in your Firestore "destinations" collection needs these
// extra fields:
//   continent : "Asia" | "Europe" | "Oceania" | "America"
//   visited   : true / false
//   wishlist  : true / false
// You mentioned you'll map these later — until then, anything missing
// just won't match a continent/visited/wishlist filter (it will still
// show up under "All" and in search).
let destinations = [
  {
    id:"mock-0", country:"Japan", city:"Tokyo", rating:4.8, budget:"3500",
    badge:"Trending", continent:"Asia", visited:false, wishlist:true,
    img:"https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop",
    pdf:"pdf/japan.pdf",
    remarks:["Cherry blossoms in April are unreal", "Try the ramen in Shinjuku"]
  },
  {
    id:"mock-1", country:"Greece", city:"Santorini", rating:4.7, budget:"6200",
    badge:"Popular", continent:"Europe", visited:true, wishlist:false,
    img:"https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop",
    pdf:"pdf/greece.pdf",
    remarks:["Sunset at Oia is worth the crowd"]
  },
  {
    id:"mock-2", country:"France", city:"Paris", rating:4.9, budget:"4800",
    badge:"Trending", continent:"Europe", visited:false, wishlist:true,
    img:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
    pdf:"pdf/france.pdf",
    remarks:["Book the Louvre tickets ahead", "Great in early autumn"]
  },
  {
    id:"mock-3", country:"Thailand", city:"Phuket", rating:4.6, budget:"2800",
    badge:"Best Value", continent:"Asia", visited:true, wishlist:false,
    img:"https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=80&w=800&auto=format&fit=crop",
    pdf:"pdf/thailand.pdf",
    remarks:["Island hopping is a must", "Bring reef-safe sunscreen"]
  },
];

// Fallback numbers shown instantly, replaced by real totals from the
// Firestore "records" collection once it loads (see data.js: loadRecordsStats).
const statsMeta = [
  { key:"countries_explored", icon:"🌐", label:"Countries explored" },
  { key:"cities_discovered",  icon:"🏙️", label:"Cities discovered" },
  { key:"wishlist_places",    icon:"♡",  label:"Wishlist places" },
  { key:"visited_places",     icon:"✈️", label:"Visited places" },
  { key:"upcoming_trips",     icon:"🗓️", label:"Upcoming trips" },
];
let statsData = {
  countries_explored: 24, cities_discovered: 68,
  wishlist_places: 18, visited_places: 12, upcoming_trips: 3
};

const filters = [
  { label:"All",           key:"all",         active:true },
  { label:"🌏 Asia",       key:"asia" },
  { label:"🌍 Europe",     key:"europe" },
  { label:"🌊 Oceania",    key:"oceania" },
  { label:"🌎 America",    key:"america" },
  { label:"♡ Visited",     key:"visited" },
  { label:"○ Not Visited", key:"not-visited" },
  { label:"♡ Wishlist",    key:"wishlist" },
];

let currentFilterKey = "all";
let currentSearchTerm = "";

// ---------- RENDER: STATS ----------
const statsRow = document.getElementById("statsRow");
function renderStats(data){
  statsRow.innerHTML = "";
  statsMeta.forEach(s => {
    statsRow.innerHTML += `
      <div class="stat">
        <div class="stat-icon">${s.icon}</div>
        <div>
          <div class="stat-value">${Number(data[s.key]) || 0}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      </div>`;
  });
}
renderStats(statsData); // instant fallback render

// ---------- RENDER: FILTER CHIPS ----------
const filterChips = document.getElementById("filterChips");
function renderFilterChips(){
  filterChips.innerHTML = "";
  filters.forEach(f => {
    filterChips.innerHTML += `<button class="chip ${f.key === currentFilterKey ? "active" : ""}" data-key="${f.key}">${f.label}</button>`;
  });
  filterChips.innerHTML += `<button class="chip more">☰ More Filters</button>`;
}
renderFilterChips();

filterChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if(!chip || chip.classList.contains("more")) return;
  currentFilterKey = chip.getAttribute("data-key");
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  applyFilters();
});

// ---------- HELPERS ----------
function formatBudget(budget){
  const n = Number(budget);
  return `RM ${isNaN(n) ? budget : n.toLocaleString()}`;
}

function remarkCount(d){
  return Array.isArray(d.remarks) ? d.remarks.length : 0;
}

function matchesFilter(d, key){
  switch(key){
    case "all": return true;
    case "asia": return (d.continent || "").toLowerCase() === "asia";
    case "europe": return (d.continent || "").toLowerCase() === "europe";
    case "oceania": return (d.continent || "").toLowerCase() === "oceania";
    case "america": return (d.continent || "").toLowerCase() === "america";
    case "visited": return d.visited === true;
    case "not-visited": return d.visited !== true;
    case "wishlist": return d.wishlist === true;
    default: return true;
  }
}

function matchesSearch(d, term){
  if(!term) return true;
  const haystack = `${d.country || ""} ${d.city || ""} ${d.badge || ""}`.toLowerCase();
  return haystack.includes(term.toLowerCase());
}

function applyFilters(){
  const filtered = destinations.filter(d =>
    matchesFilter(d, currentFilterKey) && matchesSearch(d, currentSearchTerm)
  );
  renderCards(filtered);
}

// ---------- RENDER: DESTINATION CARDS ----------
const cardGrid = document.getElementById("cardGrid");
const noResults = document.getElementById("noResults");

function renderCards(list){
  cardGrid.innerHTML = "";
  noResults.style.display = list.length ? "none" : "block";

  list.forEach((d) => {
    // use the destination's own id (from Firestore, or "mock-N" for fallback
    // data) so clicks/toggles always refer back to the right destination,
    // even after searching/filtering re-orders what's on screen.
    cardGrid.innerHTML += `
      <div class="card" data-id="${d.id}">
        <div class="card-media">
          <img src="${d.img}" alt="${d.city}, ${d.country}">
          <span class="card-badge">${d.badge}</span>
          <span class="card-fav" data-fav>${d.wishlist ? "♥" : "♡"}</span>
        </div>
        <div class="card-body">
          <div class="card-title">${d.country}</div>
          <div class="card-loc">${d.city}</div>
          <div class="card-meta">
            <div class="card-rating"><span class="star">★</span>${d.rating} <span class="count">(${remarkCount(d)} remarks)</span></div>
            <div class="card-price">Budget <strong>${formatBudget(d.budget)}</strong></div>
          </div>
        </div>
      </div>`;
  });
}

renderCards(destinations); // instant fallback render

// ---------- SEARCH ----------
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

searchInput.addEventListener("input", (e) => {
  currentSearchTerm = e.target.value.trim();
  applyFilters();
});
searchInput.addEventListener("keydown", (e) => {
  if(e.key === "Enter") applyFilters();
});
searchBtn.addEventListener("click", applyFilters);

// "♡ View Wishlist" hero button jumps to the destinations grid filtered to wishlist
document.querySelectorAll("[data-filter-shortcut]").forEach(el => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    currentFilterKey = el.getAttribute("data-filter-shortcut");
    renderFilterChips();
    applyFilters();
    document.getElementById("featured").scrollIntoView({ behavior:"smooth" });
  });
});

// ---------- WISHLIST TOGGLE ----------
async function toggleWishlist(destinationId, heartEl){
  const d = destinations.find(dest => dest.id === destinationId);
  if(!d) return;

  const newValue = !d.wishlist;
  d.wishlist = newValue;
  heartEl.textContent = newValue ? "♥" : "♡";

  // Only write to Firestore for real destinations (not the local mock fallback)
  if(destinationId.startsWith("mock-")) return;

  try {
    await window.firestoreUpdateDoc(
      window.firestoreDoc(window.db, "destinations", destinationId),
      { wishlist: newValue }
    );
  } catch (err) {
    console.error("Could not update wishlist in Firestore:", err);
    // revert on failure
    d.wishlist = !newValue;
    heartEl.textContent = d.wishlist ? "♥" : "♡";
  }

  // if we're currently viewing the wishlist filter, removing a place should
  // drop it out of view immediately
  if(currentFilterKey === "wishlist") applyFilters();
}

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

  // Point the button straight at the standalone PDF preview page,
  // passing the file path + a friendly title as query params.
  // This is a normal link now — no click interception, no overlay.
  modalPdfBtn.href = destination.pdf
    ? `pdf-viewer.html?src=${encodeURIComponent(destination.pdf)}&title=${encodeURIComponent(destination.city + ", " + destination.country)}`
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
  const card = e.target.closest(".card");
  if(!card) return;
  const id = card.getAttribute("data-id");

  if(e.target.hasAttribute("data-fav")){
    toggleWishlist(id, e.target);
    return;
  }

  const destination = destinations.find(d => d.id === id);
  if(destination) openModal(destination);
});

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if(e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closeModal();
});

// ---------- FIREBASE: load real destinations + stats once Firebase is ready ----------
window.addEventListener("firebase-ready", async () => {
  // Destinations
  try {
    const db = window.db;
    const snapshot = await window.firestoreGetDocs(window.firestoreCollection(db, "destinations"));

    if (!snapshot.empty) {
      destinations = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      applyFilters(); // replace fallback with real Firestore data (respecting any active search/filter)
    } else {
      console.log("Firestore 'destinations' collection is empty — showing fallback mock data for now.");
    }
  } catch (err) {
    console.error("Could not load destinations from Firestore, showing fallback data:", err);
  }

  // Stats (from the "records" collection, e.g. records/r001)
  try {
    const records = await window.loadRecordsStats();
    if (records) {
      statsData = records;
      renderStats(statsData);
    } else {
      console.log("Firestore 'records' collection is empty — showing fallback stats for now.");
    }
  } catch (err) {
    console.error("Could not load stats from Firestore, showing fallback stats:", err);
  }
});