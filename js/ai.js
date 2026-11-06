/* RuteSolo - Chatbot AI (Gemini via api/ai.php, fallback balasan lokal) */
const AI_ENDPOINT = API_BASE + '/ai.php';
let aiHistory = [];

const aiFab = document.getElementById('aiFab');
const aiChatContainer = document.getElementById('aiChatContainer');
const aiChatClose = document.getElementById('aiChatClose');
const aiChatMessages = document.getElementById('aiChatMessages');
const aiChatInput = document.getElementById('aiChatInput');
const aiChatSend = document.getElementById('aiChatSend');

function toggleChat() {
    if (!aiChatContainer) return;
    aiChatContainer.classList.toggle('active');
    if (aiChatContainer.classList.contains('active')) {
        if (aiChatMessages.children.length === 0) {
            addMessage('bot', 'Halo, Wisatawan! 👋<br>Saya RuteSolo AI, asisten virtual yang siap membantu perjalanan Anda di Solo.');
            setTimeout(() => {
                addMessage('bot', 'Ada yang bisa saya bantu terkait rekomendasi tempat wisata atau rute transportasi di Solo?');
            }, 800);
        }
        if (aiChatInput) aiChatInput.focus();
    }
}

function addMessage(sender, text) {
    if (!aiChatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender}`;
    msgDiv.innerHTML = text;
    aiChatMessages.appendChild(msgDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

async function handleSend() {
    if (!aiChatInput) return;
    const text = aiChatInput.value.trim();
    if (!text) return;

    addMessage('user', escapeHtml(text));
    aiChatInput.value = '';

    // Snapshot riwayat sebelumnya (maks 12) untuk dikirim ke backend.
    // Backend akan menambahkan pesan terbaru dari field "message".
    const historyForRequest = aiHistory.slice(-12);

    // Simpan pesan user ke riwayat lokal.
    aiHistory.push({ role: 'user', text: text });
    if (aiHistory.length > 12) aiHistory = aiHistory.slice(-12);

    try {
        const response = await fetch(AI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                history: historyForRequest
            })
        });

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();

        if (!data || typeof data.reply !== 'string' || data.reply.trim() === '') {
            throw new Error('Empty reply from AI');
        }

        // Simpan jawaban model ke riwayat lokal.
        aiHistory.push({ role: 'model', text: data.reply });
        if (aiHistory.length > 12) aiHistory = aiHistory.slice(-12);

        // Tampilkan jawaban dengan aman (tanpa raw HTML) & dukung newline.
        addMessage('bot', escapeHtml(data.reply).replace(/\n/g, '<br>'));
        createIconsSafe();
    } catch (error) {
        // Fallback ke balasan template lokal jika Gemini tidak tersedia.
        const fallbackReply = generateAiReply(text.toLowerCase());
        addMessage('bot', fallbackReply);
        createIconsSafe();
    }
}

function generateAiReply(query) {
    // 1. Check for greetings
    if (/halo|hai|hello|pagi|siang|malam|assalamualaikum/.test(query)) {
        return 'Halo! Ada yang bisa saya bantu untuk perjalanan Anda di Solo? Anda bisa bertanya tentang tempat wisata, kuliner, atau transportasi.';
    }

    // 2. Check for transport modes
    if (/bst|bus/.test(query)) return 'BST (Batik Solo Trans) adalah bus rapid transit dengan tarif flat Rp 3.700. Anda bisa melihat rute BST di peta atau di kartu destinasi.';
    if (/krl|kereta/.test(query)) return 'KRL Commuter Line melayani rute Solo-Jogja dengan tarif flat Rp 8.000. Stasiun utama di Solo adalah Solo Balapan dan Purwosari.';
    if (/ojol|gojek|grab|ojek/.test(query)) return 'Ojol (GoRide/GrabBike) sangat praktis untuk last-mile. Estimasi tarifnya sekitar Rp 2.000/km + biaya booking Rp 2.500.';

    // 3. Check for categories
    const categories = ['budaya', 'sejarah', 'kuliner', 'makanan', 'belanja', 'taman', 'rekreasi', 'museum', 'edukasi'];
    const matchedCategory = categories.find(cat => query.includes(cat));
    if (matchedCategory) {
        const recs = DEST.filter(d => 
            d.category.toLowerCase().includes(matchedCategory) || 
            d.tags.some(t => t.toLowerCase().includes(matchedCategory)) ||
            d.desc.toLowerCase().includes(matchedCategory)
        ).slice(0, 3);
        
        if (recs.length > 0) {
            let reply = `Berikut rekomendasi tempat untuk kategori <strong>${matchedCategory}</strong>:<br><ul style="padding-left:16px; margin-top:8px;">`;
            recs.forEach(r => {
                reply += `<li style="margin-bottom:4px;"><strong>${escapeHtml(r.name)}</strong> - ${escapeHtml(r.category)}</li>`;
            });
            reply += '</ul>Anda bisa melihat rute transportasinya di kartu destinasi di halaman utama.';
            return reply;
        }
    }

    // 4. Check for specific destination names
    const matchedDest = DEST.find(d => query.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(query));
    if (matchedDest) {
        const entry = ENTRY_FEES[matchedDest.id] || { fee: 0, free: true, note: '' };
        const feeText = entry.free ? 'Gratis' : formatRp(entry.fee) + (entry.note ? ` (${entry.note})` : '');
        return `Tentu! <strong>${escapeHtml(matchedDest.name)}</strong> adalah destinasi ${escapeHtml(matchedDest.category)}. <br><br>${escapeHtml(matchedDest.desc)}<br><br>Tiket masuk: <strong>${feeText}</strong>.<br>Anda bisa melihat opsi transportasi dan estimasi biaya di kartu destinasi pada bagian "Wisata paling populer".`;
    }

    // 5. Check for "rekomendasi" / "wisata" / "tempat"
    if (/rekomendasi|wisata|tempat|liburan|jalan-jalan|jalan jalan/.test(query)) {
        const recs = DEST.slice(0, 3);
        let reply = `Berikut beberapa rekomendasi tempat wisata populer di Solo:<br><ul style="padding-left:16px; margin-top:8px;">`;
        recs.forEach(r => {
            reply += `<li style="margin-bottom:4px;"><strong>${escapeHtml(r.name)}</strong> - ${escapeHtml(r.category)}</li>`;
        });
        reply += '</ul>Anda bisa menjelajahi lebih banyak destinasi di halaman utama.';
        return reply;
    }

    // 6. Fallback
    return 'Maaf, saya belum mengerti pertanyaan Anda. Anda bisa bertanya tentang:<br>- Rekomendasi tempat (contoh: "kuliner", "museum", "batik")<br>- Transportasi (contoh: "BST", "KRL", "Ojol")<br>- Destinasi spesifik (contoh: "Keraton", "Pasar Klewer")';
}

function initAiChat() {
    if (aiFab) aiFab.addEventListener('click', toggleChat);
    if (aiChatClose) aiChatClose.addEventListener('click', toggleChat);
    if (aiChatSend) aiChatSend.addEventListener('click', handleSend);
    if (aiChatInput) {
        aiChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }
}
