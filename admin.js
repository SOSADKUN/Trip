// ---------- STATE ----------
let destinations = []; // each item: { id, country, city, badge, budget, rating, img, pdf, remarks }

// ---------- ELEMENTS ----------
const form = document.getElementById("destinationForm");
const formHeading = document.getElementById("formHeading");
const editingIdInput = document.getElementById("editingId");

const fCountry = document.getElementById("fCountry");
const fCity = document.getElementById("fCity");
const fBadge = document.getElementById("fBadge");
const fBudget = document.getElementById("fBudget");
const fRating = document.getElementById("fRating");
const fRemarks = document.getElementById("fRemarks");
const fImg = document.getElementById("fImg");
const fPdf = document.getElementById("fPdf");
const currentImgLabel = document.getElementById("currentImgLabel");
const currentPdfLabel = document.getElementById("currentPdfLabel");

const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formStatus = document.getElementById("formStatus");

const adminList = document.getElementById("adminList");
const adminEmpty = document.getElementById("adminEmpty");

// ---------- HELPERS ----------
function formatBudget(budget){
  const n = Number(budget);
  return `RM ${isNaN(n) ? budget : n.toLocaleString()}`;
}

function resetForm(){
  form.reset();
  editingIdInput.value = "";
  currentImgLabel.textContent = "";
  currentPdfLabel.textContent = "";
  formHeading.textContent = "Add a Destination";
  submitBtn.textContent = "Save Destination";
  cancelEditBtn.hidden = true;
  formStatus.textContent = "";
}

function startEdit(destination){
  editingIdInput.value = destination.id;
  fCountry.value = destination.country || "";
  fCity.value = destination.city || "";
  fBadge.value = destination.badge || "";
  fBudget.value = destination.budget || "";
  fRating.value = destination.rating || "";
  fRemarks.value = Array.isArray(destination.remarks) ? destination.remarks.join("\n") : "";
  currentImgLabel.textContent = destination.img ? "Current: image on file (leave blank to keep)" : "";
  currentPdfLabel.textContent = destination.pdf ? "Current: PDF on file (leave blank to keep)" : "";

  formHeading.textContent = `Editing ${destination.country} · ${destination.city}`;
  submitBtn.textContent = "Update Destination";
  cancelEditBtn.hidden = false;
  formStatus.textContent = "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

cancelEditBtn.addEventListener("click", resetForm);

// ---------- RENDER LIST ----------
function renderList(){
  if(destinations.length === 0){
    adminEmpty.style.display = "block";
    adminList.innerHTML = "";
    adminList.appendChild(adminEmpty);
    return;
  }
  adminEmpty.style.display = "none";

  adminList.innerHTML = "";
  destinations.forEach(d => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-row-media">
        ${d.img ? `<img src="${d.img}" alt="${d.city}">` : `<div class="admin-row-noimg">No image</div>`}
      </div>
      <div class="admin-row-info">
        <div class="admin-row-title">${d.country} <span>· ${d.city}</span></div>
        <div class="admin-row-meta">
          <span>★ ${d.rating ?? "-"}</span>
          <span>${formatBudget(d.budget)}</span>
          <span>${d.badge || ""}</span>
          <span>${Array.isArray(d.remarks) ? d.remarks.length : 0} remarks</span>
          ${d.pdf ? `<a href="${d.pdf}" target="_blank" rel="noopener">PDF ↗</a>` : `<span class="no-pdf">No PDF</span>`}
        </div>
      </div>
      <div class="admin-row-actions">
        <button class="btn-edit" data-id="${d.id}">Edit</button>
        <button class="btn-delete" data-id="${d.id}">Delete</button>
      </div>
    `;
    adminList.appendChild(row);
  });
}

adminList.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".btn-edit");
  const deleteBtn = e.target.closest(".btn-delete");

  if(editBtn){
    const destination = destinations.find(d => d.id === editBtn.dataset.id);
    if(destination) startEdit(destination);
    return;
  }

  if(deleteBtn){
    const id = deleteBtn.dataset.id;
    const destination = destinations.find(d => d.id === id);
    const confirmed = confirm(`Delete ${destination?.country || "this destination"}? This can't be undone.`);
    if(!confirmed) return;

    deleteBtn.disabled = true;
    deleteBtn.textContent = "Deleting...";
    try {
      await window.firestoreDeleteDoc(window.firestoreDoc(window.db, "destinations", id));
      destinations = destinations.filter(d => d.id !== id);
      renderList();
      if(editingIdInput.value === id) resetForm();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Couldn't delete — check the console for details.");
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Delete";
    }
  }
});

// ---------- LOAD DESTINATIONS ----------
async function loadDestinations(){
  try {
    const snapshot = await window.firestoreGetDocs(window.firestoreCollection(window.db, "destinations"));
    destinations = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    renderList();
  } catch (err) {
    console.error("Failed to load destinations:", err);
    adminEmpty.textContent = "Couldn't load destinations — check the console.";
  }
}

window.addEventListener("firebase-ready", loadDestinations);

// ---------- ADD / UPDATE ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const editingId = editingIdInput.value;
  const existing = editingId ? destinations.find(d => d.id === editingId) : null;

  submitBtn.disabled = true;
  formStatus.textContent = "Uploading files...";

  try {
    const imgFile = fImg.files[0];
    const pdfFile = fPdf.files[0];

    const [imgUrl, pdfUrl] = await Promise.all([
      imgFile ? window.uploadToCloudinary(imgFile) : Promise.resolve(existing?.img || ""),
      pdfFile ? window.uploadToCloudinary(pdfFile) : Promise.resolve(existing?.pdf || "")
    ]);

    const remarks = fRemarks.value
      .split("\n")
      .map(r => r.trim())
      .filter(Boolean);

    const destinationData = {
      country: fCountry.value.trim(),
      city: fCity.value.trim(),
      badge: fBadge.value.trim() || "New",
      budget: fBudget.value,
      rating: Number(fRating.value),
      img: imgUrl,
      pdf: pdfUrl,
      remarks
    };

    formStatus.textContent = "Saving to database...";

    if(editingId){
      await window.firestoreUpdateDoc(window.firestoreDoc(window.db, "destinations", editingId), destinationData);
      destinations = destinations.map(d => d.id === editingId ? { id: editingId, ...destinationData } : d);
    } else {
      const docRef = await window.firestoreAddDoc(window.firestoreCollection(window.db, "destinations"), destinationData);
      destinations.push({ id: docRef.id, ...destinationData });
    }

    renderList();
    formStatus.textContent = "Saved!";
    setTimeout(resetForm, 700);
  } catch (err) {
    console.error("Save failed:", err);
    formStatus.textContent = "Something went wrong — check the console.";
  } finally {
    submitBtn.disabled = false;
  }
});