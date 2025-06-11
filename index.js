const loadingScreen = document.getElementById('loadingScreen');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginSection = document.getElementById('loginSection');
const signupSection = document.getElementById('signupSection');
const mainSection = document.getElementById('mainSection');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const searchForm = document.getElementById('searchForm');
const results = document.getElementById('results');
const searchError = document.getElementById('searchError');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const trendingGrid = document.getElementById('trendingGrid');
const logoutBtn = document.getElementById('logoutBtn');
const videoPlayerContainer = document.getElementById('videoPlayerContainer');
const genreFilter = document.getElementById('genreFilter');
const animePlayer = videojs('animePlayer', { playbackRates: [0.5, 1, 1.5, 2], fluid: true });

// Show loading screen for 2 seconds
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        if (localStorage.getItem('isLoggedIn') === 'true') {
            loginSection.classList.remove('flex');
            signupSection.classList.remove('flex');
            mainSection.classList.add('flex');
            logoutBtn.classList.remove('hidden');
            fetchTrendingAnime();
        } else {
            loginSection.classList.add('flex');
        }
    }, 2000);
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userToken');
    mainSection.classList.remove('flex');
    loginSection.classList.add('flex');
    logoutBtn.classList.add('hidden');
    videoPlayerContainer.classList.add('hidden');
    animePlayer.pause();
    animePlayer.src('');
});

// Toggle between login and signup
showSignup.addEventListener('click', () => {
    loginSection.classList.remove('flex');
    signupSection.classList.add('flex');
});
showLogin.addEventListener('click', () => {
    signupSection.classList.remove('flex');
    loginSection.classList.add('flex');
});

// Client-side signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    if (!username || !email || !password) {
        signupError.textContent = 'Please fill in all fields.';
        signupError.classList.remove('hidden');
        return;
    }
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(user => user.email === email)) {
        signupError.textContent = 'Email already exists.';
        signupError.classList.remove('hidden');
        return;
    }
    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    signupError.textContent = 'Signup successful! Please login.';
    signupError.classList.remove('hidden');
    setTimeout(() => {
        signupSection.classList.remove('flex');
        loginSection.classList.add('flex');
        signupError.classList.add('hidden');
    }, 2000);
});

// Client-side login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (!username || !password) {
        loginError.textContent = 'Please fill in all fields.';
        loginError.classList.remove('hidden');
        return;
    }
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userToken', btoa(`${username}:${password}`));
        loginSection.classList.remove('flex');
        signupSection.classList.remove('flex');
        mainSection.classList.add('flex');
        logoutBtn.classList.remove('hidden');
        fetchTrendingAnime();
    } else {
        loginError.textContent = 'Invalid username or password.';
        loginError.classList.remove('hidden');
    }
});

// Improved scraping method with fallback
async function fetchAnimeData(endpoint, params = {}) {
    const baseUrl = 'https://api.consumet.org';
    const fallbackUrl = 'https://api.enime.moe';
    try {
        const url = new URL(`${baseUrl}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        let res = await fetch(url);
        if (!res.ok) {
            console.warn('Consumet API failed, trying Enime API...');
            const fallback = new URL(`${fallbackUrl}${endpoint.replace('/anime', '')}`);
            Object.keys(params).forEach(key => fallback.searchParams.append(key, params[key]));
            res = await fetch(fallback);
        }
        if (!res.ok) throw new Error('API request failed');
        return await res.json();
    } catch (err) {
        console.error(`Fetch error for ${endpoint}:`, err);
        throw err;
    }
}

// Fetch trending anime
async function fetchTrendingAnime() {
    trendingGrid.innerHTML = '<p class="text-gray-400">Loading...</p>';
    try {
        const genre = genreFilter.value;
        const data = await fetchAnimeData('/anime/trending', genre ? { genre } : {});
        trendingGrid.innerHTML = '';
        if (data.results?.length) {
            data.results.forEach(anime => {
                const div = document.createElement('div');
                div.className = 'bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition';
                div.innerHTML = `
                    <img src="${anime.coverImage?.large || anime.image || 'https://via.placeholder.com/180x240'}" alt="${anime.title.romaji || anime.title}" class="w-full h-60 object-cover">
                    <h3 class="p-2 text-sm text-center">${anime.title.romaji || anime.title}</h3>
                `;
                div.addEventListener('click', () => fetchEpisodes(anime.id, results));
                trendingGrid.appendChild(div);
            });
        } else {
            trendingGrid.innerHTML = '<p class="text-gray-400">No trending anime available. <button onclick="fetchTrendingAnime()" class="text-pink-500">Retry</button></p>';
        }
    } catch (err) {
        trendingGrid.innerHTML = '<p class="text-gray-400">Failed to load trending anime. <button onclick="fetchTrendingAnime()" class="text-pink-500">Retry</button></p>';
    }
}

// Search anime
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('animeSearch').value.trim();
    const genre = genreFilter.value;
    if (!query && !genre) {
        searchError.textContent = 'Enter an anime name or select a genre.';
        searchError.classList.remove('hidden');
        return;
    }
    searchError.classList.add('hidden');
    results.innerHTML = '<p class="text-gray-400">Loading...</p>';
    try {
        const params = {};
        if (query) params.query = query;
        if (genre) params.genre = genre;
        const data = await fetchAnimeData('/anime/search', params);
        results.innerHTML = '';
        if (data.results?.length) {
            data.results.forEach(anime => {
                const div = document.createElement('div');
                div.className = 'flex gap-4 bg-gray-800 p-4 rounded-lg mb-4';
                div.innerHTML = `
                    <img src="${anime.coverImage?.large || anime.image || 'https://via.placeholder.com/80x120'}" alt="${anime.title.romaji || anime.title}" class="w-20 h-28 object-cover rounded">
                    <div>
                        <h3 class="text-lg font-semibold">${anime.title.romaji || anime.title}</h3>
                        <button class="episode-btn px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 transition" data-id="${anime.id}">Download</button>
                        <button class="stream-btn px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition" data-id="${anime.id}">Stream</button>
                    </div>
                `;
                div.querySelector('.episode-btn').addEventListener('click', () => fetchEpisodes(anime.id, results));
                div.querySelector('.stream-btn').addEventListener('click', () => streamEpisode(anime.id));
                results.appendChild(div);
            });
        } else {
            results.innerHTML = '<p class="text-gray-400">No results found.</p>';
        }
    } catch (err) {
        searchError.textContent = 'Failed to search anime. Please try again.';
        searchError.classList.remove('hidden');
        results.innerHTML = '';
    }
});

// Fetch episodes for download
async function fetchEpisodes(id, container) {
    try {
        const data = await fetchAnimeData(`/anime/info/${id}`);
        const episodes = data.episodes || [];
        let episodeHtml = '<div class="mt-4">';
        episodes.slice(0, 50).forEach(ep => {
            episodeHtml += `<button class="download-btn px-3 py-1 bg-pink-500 text-white rounded hover:bg-pink-600 transition m-1" data-id="${id}" data-ep="${ep.number}">Download Ep ${ep.number}</button>`;
        });
        episodeHtml += '</div>';
        container.innerHTML = episodeHtml;
        container.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ep = btn.dataset.ep;
                try {
                    const streamData = await fetchAnimeData(`/anime/watch/${id}/${ep}`);
                    if (streamData.sources?.length) {
                        window.open(streamData.sources[0].url, '_blank');
                    } else {
                        alert('No download link available.');
                    }
                } catch (err) {
                    alert('Failed to fetch download link.');
                }
            });
        });
    } catch (err) {
        alert('Failed to fetch episodes.');
    }
}

// Stream episode
async function streamEpisode(id) {
    try {
        const data = await fetchAnimeData(`/anime/watch/${id}/1`);
        if (data.sources?.length) {
            videoPlayerContainer.classList.remove('hidden');
            animePlayer.src({ type: 'video/mp4', src: data.sources[0].url });
            animePlayer.play();
            window.scrollTo({ top: videoPlayerContainer.offsetTop, behavior: 'smooth' });
        } else {
            alert('No streaming link available.');
        }
    } catch (err) {
        alert('Failed to load stream.');
    }
}

// Update trending anime on genre change
genreFilter.addEventListener('change', fetchTrendingAnime);