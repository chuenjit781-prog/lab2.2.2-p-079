// Application Logic for เที่ยวไหนดีสุรินทร์ (Tiew Nai Dee Surin)

let currentCategory = 'all';
let currentDistrict = 'all';
let searchQuery = '';
let wishlist = [];

// Initialize LocalStorage for Wishlist and Posts
function initStorage() {
  try {
    const savedWishlist = localStorage.getItem('surin_wishlist');
    if (savedWishlist) {
      wishlist = JSON.parse(savedWishlist);
    }
  } catch (e) {
    wishlist = [];
  }
}

function saveWishlist() {
  try {
    localStorage.setItem('surin_wishlist', JSON.stringify(wishlist));
    updateWishlistBadge();
  } catch (e) {
    console.error("Failed to save wishlist", e);
  }
}

function getCommunityPosts() {
  try {
    const saved = localStorage.getItem('surin_community_posts');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(e);
  }
  return [...SURIN_COMMUNITY_POSTS];
}

function saveCommunityPosts(posts) {
  try {
    localStorage.setItem('surin_community_posts', JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }
}

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white';
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform translate-y-4 opacity-0 ${bgClass}`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-lg"></i>
    <span class="text-sm font-medium">${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  // Animate out after 3.2s
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Toggle Wishlist item
function toggleWishlist(placeId, event) {
  if (event) event.stopPropagation();

  const index = wishlist.indexOf(placeId);
  const place = SURIN_PLACES.find(p => p.id === placeId);
  const placeName = place ? place.name.split(' (')[0] : 'สถานที่';

  if (index > -1) {
    wishlist.splice(index, 1);
    showToast(`นำ "${placeName}" ออกจากรายการโปรดแล้ว`, 'info');
  } else {
    wishlist.push(placeId);
    showToast(`บันทึก "${placeName}" ลงในรายการโปรดแล้ว ❤️`, 'success');
  }

  saveWishlist();
  renderPlaces();
  renderWishlistModal();
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-count-badge');
  const mobileBadge = document.getElementById('mobile-wishlist-count');
  if (badge) {
    badge.textContent = wishlist.length;
    badge.classList.toggle('hidden', wishlist.length === 0);
  }
  if (mobileBadge) {
    mobileBadge.textContent = wishlist.length;
    mobileBadge.classList.toggle('hidden', wishlist.length === 0);
  }
}

// Render Places Grid
function renderPlaces() {
  const grid = document.getElementById('places-grid');
  const countSpan = document.getElementById('results-count');
  if (!grid) return;

  const filtered = SURIN_PLACES.filter(place => {
    const matchCategory = (currentCategory === 'all' || place.category === currentCategory);
    const matchDistrict = (currentDistrict === 'all' || place.districtId === currentDistrict);
    
    let matchSearch = true;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      matchSearch = place.name.toLowerCase().includes(q) ||
                    place.description.toLowerCase().includes(q) ||
                    place.district.toLowerCase().includes(q) ||
                    place.tags.some(t => t.toLowerCase().includes(q));
    }
    return matchCategory && matchDistrict && matchSearch;
  });

  if (countSpan) {
    countSpan.textContent = `พบ ${filtered.length} สถานที่`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center bg-amber-50/50 rounded-3xl border border-amber-200/60 p-8">
        <div class="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
          <i class="fa-solid fa-magnifying-glass-location"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">ไม่พบสถานที่ที่ตรงกับเงื่อนไขการค้นหา</h3>
        <p class="text-gray-600 text-sm max-w-md mx-auto mb-6">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองอำเภอและหมวดหมู่เพื่อดูสถานที่ท่องเที่ยวทั้งหมดในสุรินทร์</p>
        <button onclick="resetFilters()" class="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium px-5 py-2.5 rounded-full shadow-lg shadow-amber-600/20 transition-all hover:scale-105">
          <i class="fa-solid fa-rotate-left"></i> ดูสถานที่ทั้งหมด
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(place => {
    const isSaved = wishlist.includes(place.id);
    return `
      <div class="place-card group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer" onclick="openPlaceModal('${place.id}')">
        <!-- Card Image -->
        <div class="relative h-56 overflow-hidden bg-slate-100">
          <img src="${place.image}" alt="${place.name}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onerror="this.src='https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80'">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          
          <!-- Badges on top -->
          <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span class="inline-flex items-center gap-1.5 bg-amber-600/95 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full shadow-md">
              <i class="fa-solid fa-map-pin text-[10px]"></i> ${place.district}
            </span>
            ${place.featured ? '<span class="inline-flex items-center gap-1 bg-red-600/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm"><i class="fa-solid fa-fire"></i> ยอดนิยม</span>' : ''}
          </div>

          <!-- Wishlist Heart Button -->
          <button onclick="toggleWishlist('${place.id}', event)" title="${isSaved ? 'นำออกจากที่บันทึก' : 'บันทึกในรายการโปรด'}" class="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${isSaved ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110' : 'bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 shadow-md backdrop-blur-sm'}">
            <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart text-base"></i>
          </button>

          <!-- Bottom Title Overlay -->
          <div class="absolute bottom-3 left-3 right-3 text-white">
            <div class="flex items-center justify-between text-xs text-amber-300 mb-1 font-medium">
              <span>${place.categoryLabel}</span>
              <span class="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm text-white">
                <i class="fa-solid fa-star text-amber-400 text-xs"></i> ${place.rating} (${place.reviewsCount})
              </span>
            </div>
            <h3 class="font-bold text-lg leading-tight line-clamp-1 drop-shadow-sm group-hover:text-amber-200 transition-colors">
              ${place.name}
            </h3>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <p class="text-xs text-amber-800 font-medium mb-1.5 line-clamp-1 flex items-center gap-1.5">
              <i class="fa-solid fa-sparkles text-amber-500"></i> ${place.highlight}
            </p>
            <p class="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">
              ${place.description}
            </p>
            
            <!-- Tags -->
            <div class="flex flex-wrap gap-1.5 mb-4">
              ${place.tags.slice(0, 3).map(tag => `
                <span class="text-[11px] bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 px-2.5 py-0.5 rounded-lg border border-slate-200/60 transition-colors">
                  #${tag}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Card Footer Info -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-gray-500">
            <span class="flex items-center gap-1.5 truncate max-w-[170px]" title="${place.hours}">
              <i class="fa-regular fa-clock text-amber-600"></i> ${place.hours}
            </span>
            <span class="font-semibold text-amber-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              ดูรายละเอียด <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Reset filters to default
function resetFilters() {
  currentCategory = 'all';
  currentDistrict = 'all';
  searchQuery = '';
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  
  const districtSelect = document.getElementById('district-filter');
  if (districtSelect) districtSelect.value = 'all';

  // update category pill styling
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.classList.remove('active', 'bg-amber-600', 'text-white', 'shadow-md', 'shadow-amber-600/30');
    btn.classList.add('bg-white', 'text-gray-700', 'border-slate-200');
    if (btn.dataset.category === 'all') {
      btn.classList.add('active', 'bg-amber-600', 'text-white', 'shadow-md', 'shadow-amber-600/30');
      btn.classList.remove('bg-white', 'text-gray-700', 'border-slate-200');
    }
  });

  renderPlaces();
}

// Place Detail Modal
function openPlaceModal(placeId) {
  const place = SURIN_PLACES.find(p => p.id === placeId);
  if (!place) return;

  const modal = document.getElementById('place-modal');
  const content = document.getElementById('place-modal-content');
  if (!modal || !content) return;

  const isSaved = wishlist.includes(place.id);

  content.innerHTML = `
    <!-- Modal Header Image -->
    <div class="relative h-72 md:h-80 w-full overflow-hidden">
      <img src="${place.image}" alt="${place.name}" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
      
      <!-- Close button -->
      <button onclick="closePlaceModal()" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all">
        <i class="fa-solid fa-xmark text-lg"></i>
      </button>

      <!-- Badge row -->
      <div class="absolute top-4 left-4 flex gap-2">
        <span class="bg-amber-500/95 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
          <i class="fa-solid fa-landmark mr-1"></i> ${place.categoryLabel}
        </span>
        <span class="bg-black/40 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20">
          <i class="fa-solid fa-map-pin mr-1"></i> ${place.district}
        </span>
      </div>

      <!-- Title inside header -->
      <div class="absolute bottom-5 left-5 right-5 text-white">
        <div class="flex items-center gap-2 mb-2">
          <div class="flex items-center text-amber-400 text-sm">
            ${Array(5).fill(0).map((_, i) => `<i class="fa-solid fa-star ${i < Math.floor(place.rating) ? 'text-amber-400' : 'text-slate-400'} text-xs"></i>`).join('')}
          </div>
          <span class="text-sm font-semibold">${place.rating}</span>
          <span class="text-xs text-white/70">(${place.reviewsCount} รีวิวจากนักท่องเที่ยว)</span>
        </div>
        <h2 class="text-2xl md:text-3xl font-extrabold leading-snug drop-shadow-md">
          ${place.name}
        </h2>
      </div>
    </div>

    <!-- Modal Body Content -->
    <div class="p-6 md:p-8 space-y-6">
      <!-- Highlight box -->
      <div class="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
          <i class="fa-solid fa-sparkles"></i>
        </div>
        <div>
          <h4 class="font-bold text-amber-900 text-sm mb-1">จุดเด่นห้ามพลาด</h4>
          <p class="text-sm text-amber-950 font-medium">${place.highlight}</p>
        </div>
      </div>

      <!-- Detailed Description -->
      <div>
        <h4 class="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <i class="fa-solid fa-book-open text-amber-600"></i> ข้อมูลและเรื่องราวน่าสนใจ
        </h4>
        <p class="text-sm md:text-base text-gray-700 leading-relaxed">
          ${place.description}
        </p>
      </div>

      <!-- Fast Specs Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-ticket text-sm"></i>
          </div>
          <div>
            <div class="text-xs text-gray-500 font-medium">ค่าเข้าชม / บัตรผ่าน</div>
            <div class="text-sm font-bold text-gray-800">${place.price}</div>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <i class="fa-regular fa-clock text-sm"></i>
          </div>
          <div>
            <div class="text-xs text-gray-500 font-medium">เวลาเปิด - ปิด</div>
            <div class="text-sm font-bold text-gray-800">${place.hours}</div>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <i class="fa-regular fa-sun text-sm"></i>
          </div>
          <div>
            <div class="text-xs text-gray-500 font-medium">ช่วงเวลาและแสงที่แนะนำ</div>
            <div class="text-sm font-bold text-gray-800">${place.bestTime}</div>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-hourglass-half text-sm"></i>
          </div>
          <div>
            <div class="text-xs text-gray-500 font-medium">ระยะเวลาที่ควรเผื่อ</div>
            <div class="text-sm font-bold text-gray-800">${place.recommendedTime}</div>
          </div>
        </div>
      </div>

      <!-- Facilities -->
      <div>
        <h4 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <i class="fa-solid fa-list-check text-amber-600"></i> สิ่งอำนวยความสะดวก
        </h4>
        <div class="flex flex-wrap gap-2">
          ${place.facilities.map(fac => `
            <span class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200">
              <i class="fa-solid fa-check text-emerald-600 text-xs"></i> ${fac}
            </span>
          `).join('')}
        </div>
      </div>

      <!-- Location info -->
      <div class="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
        <i class="fa-solid fa-location-dot text-amber-600 text-lg mt-0.5"></i>
        <div>
          <span class="text-xs font-semibold text-amber-900 block mb-0.5">พิกัดสถานที่</span>
          <span class="text-sm text-gray-700">${place.location}</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <button onclick="toggleWishlist('${place.id}'); openPlaceModal('${place.id}');" class="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm ${isSaved ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}">
          <i class="${isSaved ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-base"></i>
          <span>${isSaved ? 'บันทึกแล้วในรายการโปรด' : 'เพิ่มในรายการโปรด'}</span>
        </button>

        <a href="${place.mapsUrl}" target="_blank" rel="noopener noreferrer" class="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-amber-600/30 transition-all hover:scale-[1.02]">
          <i class="fa-solid fa-diamond-turn-right text-base"></i>
          <span>นำทางด้วย Google Maps</span>
        </a>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closePlaceModal() {
  const modal = document.getElementById('place-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// Wishlist Modal Render
function openWishlistModal() {
  renderWishlistModal();
  const modal = document.getElementById('wishlist-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeWishlistModal() {
  const modal = document.getElementById('wishlist-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function renderWishlistModal() {
  const listContainer = document.getElementById('wishlist-items-container');
  if (!listContainer) return;

  const savedPlaces = SURIN_PLACES.filter(p => wishlist.includes(p.id));

  if (savedPlaces.length === 0) {
    listContainer.innerHTML = `
      <div class="py-12 text-center text-gray-500">
        <div class="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
          <i class="fa-regular fa-heart"></i>
        </div>
        <p class="font-bold text-gray-800 text-base mb-1">ยังไม่มีสถานที่ในรายการโปรด</p>
        <p class="text-xs text-gray-500 max-w-xs mx-auto">กดไอคอนหัวใจบนการ์ดสถานที่ท่องเที่ยว เพื่อบันทึกทริปในฝันของคุณไว้ดูภายหลัง</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = `
    <div class="space-y-3">
      ${savedPlaces.map(place => `
        <div class="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-amber-50/60 rounded-2xl border border-slate-200/80 transition-colors">
          <div class="flex items-center gap-3.5 overflow-hidden cursor-pointer flex-1" onclick="closeWishlistModal(); openPlaceModal('${place.id}')">
            <img src="${place.image}" alt="${place.name}" class="w-14 h-14 rounded-xl object-cover shrink-0">
            <div class="min-w-0">
              <h4 class="font-bold text-sm text-gray-900 truncate">${place.name}</h4>
              <p class="text-xs text-amber-700 flex items-center gap-1 font-medium mt-0.5">
                <i class="fa-solid fa-map-pin text-[10px]"></i> ${place.district} • ${place.categoryLabel}
              </p>
            </div>
          </div>
          <button onclick="toggleWishlist('${place.id}'); renderWishlistModal();" class="p-2 text-slate-400 hover:text-red-500 transition-colors" title="ลบออกจากรายการ">
            <i class="fa-solid fa-trash-can text-sm"></i>
          </button>
        </div>
      `).join('')}
    </div>
    
    <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
      <button onclick="clearWishlist()" class="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1">
        <i class="fa-solid fa-rotate-left"></i> ล้างรายการทั้งหมด
      </button>
      <button onclick="window.print()" class="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm">
        <i class="fa-solid fa-print"></i> พิมพ์รายการทริป
      </button>
    </div>
  `;
}

function clearWishlist() {
  if (confirm("ต้องการล้างสถานที่ที่บันทึกไว้ทั้งหมดหรือไม่?")) {
    wishlist = [];
    saveWishlist();
    renderPlaces();
    renderWishlistModal();
    showToast("ล้างรายการโปรดเรียบร้อยแล้ว", "info");
  }
}

// Community Posts logic
function renderCommunityFeed() {
  const container = document.getElementById('community-feed-container');
  if (!container) return;

  const posts = getCommunityPosts();

  container.innerHTML = posts.map(post => {
    return `
      <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
        <!-- Post Author Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <img src="${post.avatar}" alt="${post.author}" class="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/20">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-gray-900 text-sm">${post.author}</h4>
                <span class="text-[11px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">${post.badge || 'สมาชิกกลุ่ม'}</span>
              </div>
              <span class="text-xs text-gray-400 font-medium">${post.timeAgo}</span>
            </div>
          </div>
          ${post.placeTag ? `
            <span class="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
              <i class="fa-solid fa-location-dot text-[11px] text-amber-600"></i> ${post.placeTag}
            </span>
          ` : ''}
        </div>

        <!-- Post Content -->
        <h3 class="font-bold text-base text-gray-800 mb-2 leading-snug">${post.title}</h3>
        <p class="text-sm text-gray-600 leading-relaxed mb-4">${post.content}</p>

        <!-- Post Images -->
        ${post.images && post.images.length > 0 ? `
          <div class="rounded-2xl overflow-hidden mb-4 max-h-80 bg-slate-100">
            <img src="${post.images[0]}" alt="รูปภาพประกอบ" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer">
          </div>
        ` : ''}

        <!-- Post Footer Reactions -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-gray-500">
          <button onclick="likePost('${post.id}')" class="flex items-center gap-1.5 hover:text-red-500 transition-colors font-medium">
            <i class="fa-solid fa-thumbs-up text-amber-600"></i>
            <span>ถูกใจ (${post.likes || 0})</span>
          </button>
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5 hover:text-amber-700 cursor-pointer">
              <i class="fa-regular fa-comment text-slate-400"></i>
              <span>${post.commentsCount || 0} ความคิดเห็น</span>
            </span>
            <button onclick="sharePost('${post.id}')" class="flex items-center gap-1 hover:text-amber-700">
              <i class="fa-solid fa-share-nodes"></i> แชร์
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function likePost(postId) {
  const posts = getCommunityPosts();
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.likes = (post.likes || 0) + 1;
    saveCommunityPosts(posts);
    renderCommunityFeed();
    showToast("ขอบคุณที่ร่วมส่งกำลังใจให้เพื่อนสมาชิก!");
  }
}

function sharePost(postId) {
  if (navigator.share) {
    navigator.share({
      title: 'เที่ยวไหนดีสุรินทร์',
      text: 'ชวนดูโพสต์และรีวิวเที่ยวสุรินทร์ดีๆ จากกลุ่มเที่ยวไหนดีสุรินทร์',
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast("คัดลอกลิงก์เรียบร้อยแล้ว สามารถส่งต่อให้เพื่อนได้เลย!", "info");
  }
}

// Open / Close New Post Modal
function openNewPostModal() {
  const modal = document.getElementById('new-post-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

function closeNewPostModal() {
  const modal = document.getElementById('new-post-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

function handleCreatePost(event) {
  event.preventDefault();
  const authorName = document.getElementById('post-author').value.trim();
  const postTitle = document.getElementById('post-title').value.trim();
  const postContent = document.getElementById('post-content').value.trim();
  const postPlace = document.getElementById('post-place').value.trim();
  const postImage = document.getElementById('post-image-url').value.trim();

  if (!authorName || !postTitle || !postContent) {
    showToast("กรุณากรอกข้อมูลให้ครบถ้วนก่อนส่งรีวิว", "info");
    return;
  }

  const newPost = {
    id: "post-" + Date.now(),
    author: authorName,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    timeAgo: "เมื่อสักครู่",
    badge: "สมาชิกใหม่ ✨",
    title: postTitle,
    content: postContent,
    placeTag: postPlace || "สุรินทร์น่าเที่ยว",
    likes: 1,
    commentsCount: 0,
    images: postImage ? [postImage] : ["https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=600&q=80"]
  };

  const posts = getCommunityPosts();
  posts.unshift(newPost);
  saveCommunityPosts(posts);

  // Reset form
  event.target.reset();
  closeNewPostModal();
  renderCommunityFeed();
  showToast("โพสต์รีวิวของคุณขึ้นสู่ชุมชนแล้ว ขอบคุณที่ร่วมแชร์!", "success");

  // Scroll to community section smoothly
  const communitySection = document.getElementById('community');
  if (communitySection) {
    communitySection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Interactive Trip Planner Generator
function generateSmartTrip() {
  const days = document.getElementById('plan-days').value;
  const style = document.getElementById('plan-style').value;
  const transport = document.getElementById('plan-transport').value;
  const resultContainer = document.getElementById('trip-plan-results');

  if (!resultContainer) return;

  let planHtml = '';

  if (days === '1') {
    planHtml = `
      <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 border border-amber-200/80 shadow-md">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-amber-200">
          <div>
            <span class="inline-block bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-1">ทริป 1 วัน (ไปเช้า-เย็นกลับ)</span>
            <h3 class="text-xl md:text-2xl font-black text-gray-900">“วันเดียว เที่ยวไฮไลต์ปราสาทขอม & สัมผัสวิถีไหมงาม”</h3>
          </div>
          <span class="text-xs bg-white text-amber-800 font-semibold px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-sm flex items-center gap-1.5">
            <i class="fa-solid fa-car"></i> เดินทางโดย: ${transport === 'car' ? 'รถยนต์ส่วนตัว' : (transport === 'moto' ? 'มอเตอร์ไซค์' : 'รถสาธารณะ/เหมารถ')}
          </span>
        </div>

        <!-- Timeline steps -->
        <div class="relative border-l-2 border-amber-400 pl-6 ml-3 space-y-6">
          <div class="relative">
            <div class="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-600 ring-4 ring-amber-100"></div>
            <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">08:00 - 09:30 น.</span>
            <h4 class="font-bold text-gray-900 text-base mt-1">เริ่มต้นวันด้วยการกราบสักการะศาลหลักเมือง & วัดบูรพาราม</h4>
            <p class="text-xs md:text-sm text-gray-600 mt-0.5">กราบหลวงพ่อพระชีว์และสรีรสังขารหลวงปู่ดุลย์ อตุโล เพื่อความเป็นสิริมงคล เดินชมศิลปะขอมประยุกต์</p>
          </div>

          <div class="relative">
            <div class="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-600 ring-4 ring-amber-100"></div>
            <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">10:00 - 12:00 น.</span>
            <h4 class="font-bold text-gray-900 text-base mt-1">ยลโฉมมรดกโลก “ปราสาทศีขรภูมิ” หินทราย 5 ยอด</h4>
            <p class="text-xs md:text-sm text-gray-600 mt-0.5">ชมภาพสลักนางอัปสราและทับหลังศิวนาฏราชที่สมบูรณ์ที่สุด พักจิบกาแฟสดชุมชนศีขรภูมิ</p>
          </div>

          <div class="relative">
            <div class="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-600 ring-4 ring-amber-100"></div>
            <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">12:15 - 13:30 น.</span>
            <h4 class="font-bold text-gray-900 text-base mt-1">มื้อเที่ยงจัดเต็ม: ร้านเจ๊เน้ย ส้มตำไก่ย่างสุรินทร์</h4>
            <p class="text-xs md:text-sm text-gray-600 mt-0.5">ส้มตำปลาร้ารสนัว ไก่ย่างเตาถ่านหนังกรอบ และกุนเชียงทอดร้อนๆ เมล็ดข้าวเหนียวหอมนุ่ม</p>
          </div>

          <div class="relative">
            <div class="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-amber-600 ring-4 ring-amber-100"></div>
            <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">14:00 - 16:00 น.</span>
            <h4 class="font-bold text-gray-900 text-base mt-1">ชมกรรมวิธีการทอผ้าไหมยกทองโบราณ “บ้านท่าสว่าง”</h4>
            <p class="text-xs md:text-sm text-gray-600 mt-0.5">ตื่นตากับกี่ทอผ้าขนาด 2 ชั้น และช้อปผ้าไหมสุรินทร์แท้เป็นของฝากทรงคุณค่า</p>
          </div>

          <div class="relative">
            <div class="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></div>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">16:30 - 18:30 น.</span>
            <h4 class="font-bold text-gray-900 text-base mt-1">รับลมเย็นชมอาทิตย์อัสดงที่ “อ่างเก็บน้ำห้วยเสนง” / เดินชิม “ถนนคนเดินเซราะกราว”</h4>
            <p class="text-xs md:text-sm text-gray-600 mt-0.5">นั่งชิลริมน้ำ หรือถ้าเป็นเสาร์-อาทิตย์ แวะลุยสตรีทฟู้ดพื้นถิ่นที่ถนนคนเดินเซราะกราว ปิดท้ายทริป 1 วันอย่างประทับใจ</p>
          </div>
        </div>
      </div>
    `;
  } else if (days === '2') {
    planHtml = `
      <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 border border-amber-200/80 shadow-md">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-amber-200">
          <div>
            <span class="inline-block bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-1">ทริป 2 วัน 1 คืน</span>
            <h3 class="text-xl md:text-2xl font-black text-gray-900">“ทริปฮีลใจเมืองช้าง วิถีชาวกูย พักชิลริมเขื่อน & ตามรอยขอมพันปี”</h3>
          </div>
          <span class="text-xs bg-white text-amber-800 font-semibold px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-sm flex items-center gap-1.5">
            <i class="fa-solid fa-car"></i> เดินทางโดย: ${transport === 'car' ? 'รถยนต์ส่วนตัว' : 'รถยนต์/เหมารถ'}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Day 1 -->
          <div class="bg-white/80 p-5 rounded-2xl border border-amber-200/60 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-7 h-7 bg-amber-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">D1</span>
              <h4 class="font-extrabold text-gray-900 text-base">วันที่ 1: มนต์เสน่ห์ช้างไทย & แสงเย็นห้วยเสนง</h4>
            </div>
            <ul class="space-y-4 text-xs md:text-sm text-gray-700">
              <li class="flex items-start gap-2">
                <i class="fa-solid fa-circle-dot text-amber-600 text-[10px] mt-1 shrink-0"></i>
                <div><b>09:00 - 12:00:</b> หมู่บ้านช้างบ้านตากลาง ท่าตูม ชมการแสดงช้าง ป้อนอาหาร และร่วมกิจกรรมอาบน้ำช้างที่แม่น้ำมูล</div>
              </li>
              <li class="flex items-start gap-2">
                <i class="fa-solid fa-circle-dot text-amber-600 text-[10px] mt-1 shrink-0"></i>
                <div><b>12:30 - 13:30:</b> รับประทานอาหารพื้นถิ่นริมน้ำมูล เมนูปลาแม่น้ำสดๆ ส้มตำรสเด็ด</div>
              </li>
              <li class="flex items-start gap-2">
                <i class="fa-solid fa-circle-dot text-amber-600 text-[10px] mt-1 shrink-0"></i>
                <div><b>14:30 - 16:30:</b> แวะเช็กอินคาเฟ่สุดชิค 361 หรือ The Barn House & Farm เติมความสดชื่น</div>
              </li>
              <li class="flex items-start gap-2">
                <i class="fa-solid fa-circle-dot text-amber-600 text-[10px] mt-1 shrink-0"></i>
                <div><b>17:00 - 19:30:</b> ชมพระอาทิตย์ตกดินริมอ่างเก็บน้ำห้วยเสนง ชิมปลาเผาริมเขื่อน และเช็กอินเข้าที่พักในเมือง</div>
              </li>
            </ul>
          </div>

          <!-- Day 2 -->
          <div class="bg-white/80 p-5 rounded-2xl border border-amber-200/60 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">D2</span>
              <h4 class="font-extrabold text-gray-900 text-base">วันที่ 2: ศีขรภูมิ เขาพนมสวาย & ช้อปผ้าไหม</h4>
            </div>
            <ul class="space-y-4 text-xs md:text-sm text-gray-700">
              <li class="flex items-start gap-2">
                <i class="fa-solid fa-circle-dot text-emerald-600 text-[10px] mt-1 shrink-0"></i>
                <div><b>08:00 - 09:30:</b> สักการะหลวงพ่อพระชีว์ วัดบูรพาราม และศาลหลักเมืองสุรินทร์</div>
              </li>
              <li class="flex items-start gap-2">
                <i class="fa-solid fa-circle-dot text-emerald-600 text-[10px] mt-1 shrink-0"></i>
                <div><b>10:00 - 12:00:</b> เดินทางไปปราสาทศีขรภูมิ ถ่ายภาพลวดลายนางอัปสราหินทรายสุดงดงาม</div>
              </li>
              <li class="flex items-start gap-2">
                <i class="fa-solid fa-circle-dot text-emerald-600 text-[10px] mt-1 shrink-0"></i>
                <div><b>13:30 - 15:30:</b> พิชิตยอดเขา วนอุทยานพนมสวาย เคาะระฆัง 1,080 ใบ เสริมสิริมงคล</div>
              </li>
              <li class="flex items-start gap-2">
                <i class="fa-solid fa-circle-dot text-emerald-600 text-[10px] mt-1 shrink-0"></i>
                <div><b>16:00 - 17:30:</b> ช้อปของฝากผ้าไหมท่าสว่าง และแวะซื้อกุนเชียง 5 ดาวสุรินทร์ เดินทางกลับโดยสวัสดิภาพ</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    `;
  } else {
    planHtml = `
      <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 border border-amber-200/80 shadow-md">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-amber-200">
          <div>
            <span class="inline-block bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-1">ทริป 3 วัน 2 คืน (Surin Complete Adventure)</span>
            <h3 class="text-xl md:text-2xl font-black text-gray-900">“เจาะลึกอีสานใต้ ปราสาทชายแดนตาเมือน ช้าง วิถีไหม และธรรมชาติผืนป่า”</h3>
          </div>
          <span class="text-xs bg-white text-amber-800 font-semibold px-3.5 py-1.5 rounded-xl border border-amber-300 shadow-sm flex items-center gap-1.5">
            <i class="fa-solid fa-compass"></i> เที่ยวครบ 4 โซนรอบสุรินทร์
          </span>
        </div>

        <div class="space-y-4 text-xs md:text-sm">
          <div class="p-4 bg-white/90 rounded-2xl border border-amber-200/60">
            <span class="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-xs mr-2">วันที่ 1</span>
            <b>ตัวเมืองสุรินทร์ & ศิลปวัฒนธรรม:</b> สักการะศาลหลักเมือง, วัดบูรพาราม, ศึกษากี่ทอผ้าไหมยกทองโบราณบ้านท่าสว่าง, คาเฟ่ 361 และดินเนอร์ที่ถนนคนเดินเซราะกราว
          </div>
          <div class="p-4 bg-white/90 rounded-2xl border border-amber-200/60">
            <span class="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-xs mr-2">วันที่ 2</span>
            <b>มนต์เสน่ห์เมืองช้าง & ปราสาทศีขรภูมิ:</b> เต็มอิ่มกับกิจกรรมหมู่บ้านช้างตากลาง อ.ท่าตูม (การแสดง, อาบน้ำช้าง), ต่อด้วยปราสาทหิน 5 ยอดศีขรภูมิ แสงเย็นสวยงาม และรับประทานอาหารอีสานแท้
          </div>
          <div class="p-4 bg-white/90 rounded-2xl border border-amber-200/60">
            <span class="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-xs mr-2">วันที่ 3</span>
            <b>ลุยแนวชายแดนพนมดงรัก & ตลาดช่องจอม:</b> สำรวจกลุ่มปราสาทตาเมือน (ตาเมือนธม โต๊ด) ปราสาทภูมิโปนที่เก่าแก่ที่สุด แวะช้อปปิ้งของพื้นบ้านตลาดช่องจอม ชิมกุนเชียงของฝากสุรินทร์
          </div>
        </div>
      </div>
    `;
  }

  resultContainer.innerHTML = planHtml;
  resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast("จัดแผนท่องเที่ยวสำเร็จแล้ว!", "success");
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  updateWishlistBadge();
  renderPlaces();
  renderCommunityFeed();

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderPlaces();
    });
  }

  // District Filter select
  const districtSelect = document.getElementById('district-filter');
  if (districtSelect) {
    districtSelect.addEventListener('change', (e) => {
      currentDistrict = e.target.value;
      renderPlaces();
    });
  }

  // Category buttons
  const catButtons = document.querySelectorAll('.cat-pill');
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => {
        b.classList.remove('active', 'bg-amber-600', 'text-white', 'shadow-md', 'shadow-amber-600/30');
        b.classList.add('bg-white', 'text-gray-700', 'border-slate-200');
      });
      btn.classList.add('active', 'bg-amber-600', 'text-white', 'shadow-md', 'shadow-amber-600/30');
      btn.classList.remove('bg-white', 'text-gray-700', 'border-slate-200');

      currentCategory = btn.dataset.category || 'all';
      renderPlaces();
    });
  });

  // Mobile navigation drawer toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.toggle('hidden');
    });
  }

  if (closeDrawerBtn && mobileDrawer) {
    closeDrawerBtn.addEventListener('click', () => {
      mobileDrawer.classList.add('hidden');
    });
  }

  // Close modals when clicking backdrop
  window.addEventListener('click', (e) => {
    const placeModal = document.getElementById('place-modal');
    const wishlistModal = document.getElementById('wishlist-modal');
    const newPostModal = document.getElementById('new-post-modal');

    if (e.target === placeModal) closePlaceModal();
    if (e.target === wishlistModal) closeWishlistModal();
    if (e.target === newPostModal) closeNewPostModal();
  });
});
