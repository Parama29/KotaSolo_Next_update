/* RuteSolo - Galeri foto */

// Gallery

function renderGallery() {
    const stage   = document.getElementById('galleryStage');
    const filmEl  = document.getElementById('dots');
    if (!GALLERY || !GALLERY.length) {
        stage.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:240px;padding:40px 20px;"><svg width="64" height="64" viewBox="0 0 80 80" fill="none" aria-hidden="true"><circle cx="40" cy="40" r="38" stroke="var(--border-strong)" stroke-width="2"/><circle cx="28" cy="34" r="4" fill="var(--text-3)"/><circle cx="52" cy="34" r="4" fill="var(--text-3)"/><path d="M26 54 Q40 46 54 54" stroke="var(--text-3)" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg><p style="margin-top:16px;color:var(--text-3);font-size:14px;font-family:\'Plus Jakarta Sans\',sans-serif">Galeri foto tidak tersedia</p></div>';
        filmEl.innerHTML = '';
        return;
    }
    if (!stage.dataset.built) {
        stage.innerHTML =
            GALLERY.map((item, index) => `
                <img class="${index === 0 ? 'active' : ''}" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}"
                     loading="lazy" decoding="async" onerror="this.style.display='none'">
            `).join('')
            + `
            <button class="arrow prev" id="prev" aria-label="Foto sebelumnya"><i data-lucide="chevron-left"></i></button>
            <button class="arrow next" id="next" aria-label="Foto berikutnya"><i data-lucide="chevron-right"></i></button>
            <div class="caption">
                <span class="badge" id="gCount"></span>
                <h3 id="gTitle"></h3>
                <p id="gDesc"></p>
            </div>`;
        filmEl.innerHTML = GALLERY.map((item, index) => `
            <button class="thumb" data-i="${index}"
                    aria-label="Lihat foto ${escapeHtml(item.name)}"
                    style="background-image:url('${escapeHtml(item.img)}')"><span class="thumb-overlay"></span></button>
        `).join('');
        document.getElementById('prev').onclick = () => goGallery(-1);
        document.getElementById('next').onclick = () => goGallery(1);
        filmEl.querySelectorAll('.thumb').forEach(button => {
            button.onclick = () => {
                gIndex = Number(button.dataset.i);
                renderGallery();
                resetTimer();
                const target = document.getElementById('galeri');
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };
        });
        stage.dataset.built = '1';
        createIconsSafe();
    }
    const current = GALLERY[gIndex];
    stage.querySelectorAll('img').forEach((img, index) => img.classList.toggle('active', index === gIndex));
    filmEl.querySelectorAll('.thumb').forEach((thumb, index) => thumb.classList.toggle('active', index === gIndex));
    document.getElementById('gCount').textContent = (gIndex + 1) + ' / ' + GALLERY.length;
    document.getElementById('gTitle').textContent = current.name;
    document.getElementById('gDesc').textContent = current.desc;
}

function goGallery(direction) {
    gIndex = (gIndex + direction + GALLERY.length) % GALLERY.length;
    renderGallery();
    resetTimer();
}

function resetTimer() {
    clearInterval(gTimer);
    gTimer = setInterval(() => {
        gIndex = (gIndex + 1) % GALLERY.length;
        renderGallery();
    }, 4500);
}
