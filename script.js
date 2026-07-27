// ---------- MOCK DATA ----------
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

  const destinations = [
    {
      country:"Japan", city:"Tokyo", rating:4.8, reviews:128, price:"RM 3,500",
      badge:"Trending",
      img:"https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop",
      pdf:"pdf/japan.pdf"
    },
    {
      country:"Greece", city:"Santorini", rating:4.7, reviews:96, price:"RM 6,200",
      badge:"Popular",
      img:"https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop",
      pdf:"pdf/greece.pdf"
    },
    {
      country:"France", city:"Paris", rating:4.9, reviews:156, price:"RM 4,800",
      badge:"Trending",
      img:"https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
      pdf:"pdf/france.pdf"
    },
    {
      country:"Thailand", city:"Phuket", rating:4.6, reviews:88, price:"RM 2,800",
      badge:"Best Value",
      img:"https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=80&w=800&auto=format&fit=crop",
      pdf:"pdf/thailand.pdf"
    },
  ];

  // ---------- RENDER ----------
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

  const filterChips = document.getElementById("filterChips");
  filters.forEach(f => {
    filterChips.innerHTML += `<button class="chip ${f.active ? "active" : ""}">${f.label}</button>`;
  });
  filterChips.innerHTML += `<button class="chip more">☰ More Filters</button>`;

  const cardGrid = document.getElementById("cardGrid");
  destinations.forEach((d, i) => {
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
            <div class="card-rating"><span class="star">★</span>${d.rating} <span class="count">(${d.reviews})</span></div>
            <div class="card-price">From <strong>${d.price}</strong></div>
          </div>
        </div>
      </div>`;
  });

  // Toggle filter chip active state
  filterChips.addEventListener("click", (e) => {
    if(e.target.classList.contains("chip") && !e.target.classList.contains("more")){
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      e.target.classList.add("active");
    }
  });

  // ---------- MODAL (destination popup) ----------
  const modalOverlay = document.getElementById("modalOverlay");
  const modalImg = document.getElementById("modalImg");
  const modalTitle = document.getElementById("modalTitle");
  const modalLoc = document.getElementById("modalLoc");
  const modalPdfBtn = document.getElementById("modalPdfBtn");
  const modalClose = document.getElementById("modalClose");

  function openModal(destination){
    modalImg.src = destination.img;
    modalImg.alt = `${destination.city}, ${destination.country}`;
    modalTitle.textContent = destination.country;
    modalLoc.textContent = destination.city;
    modalPdfBtn.href = destination.pdf;
    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden"; // prevent background scroll
  }

  function closeModal(){
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  cardGrid.addEventListener("click", (e) => {
    // Don't open the modal if the heart icon was clicked
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
    if(e.target === modalOverlay) closeModal(); // click outside the box closes it
  });
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeModal();
  });