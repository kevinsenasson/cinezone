// ==================== VARIABLES GLOBALES ET GENRES ====================
const apiKey = "c60699cfb590fac613bd4224390bd432";
let genreMap = {};

// ==================== GESTION DE LA LISTE PERSONNALISÉE ====================
function getListePerso() {
  let liste = JSON.parse(localStorage.getItem('listePerso') || '{}');
  if (!liste.films) liste.films = [];
  if (!liste.series) liste.series = [];
  if (!liste.emissiontv) liste.emissiontv = [];
  if (!liste.acteurs) liste.acteurs = [];
  return liste;
}
function saveListePerso(liste) {
  localStorage.setItem('listePerso', JSON.stringify(liste));
}
function estDansListePerso(itemId, type) {
  const liste = getListePerso();
  let arr;
  if (type === "film") arr = liste.films;
  else if (type === "serie") arr = liste.series;
  else if (type === "emissiontv") arr = liste.emissiontv;
  else if (type === "acteur") arr = liste.acteurs;
  return arr && arr.some(el => String(el.id) === String(itemId));
}
function ajouterALaListePerso(item, type) {
  const liste = getListePerso();
  let arr;
  if (type === "film") arr = liste.films;
  else if (type === "serie") arr = liste.series;
  else if (type === "emissiontv") arr = liste.emissiontv;
  else if (type === "acteur") arr = liste.acteurs;
  if (!arr.find(el => el.id === item.id)) {
    arr.push(item);
    saveListePerso(liste);
    afficherMessage("Ajouté à votre liste personnalisée !");
  }
}
function retirerDeLaListePerso(itemId, type) {
  const liste = getListePerso();
  let arr;
  if (type === "film") arr = liste.films;
  else if (type === "serie") arr = liste.series;
  else if (type === "emissiontv") arr = liste.emissiontv;
  else if (type === "acteur") arr = liste.acteurs;
  const idx = arr.findIndex(el => String(el.id) === String(itemId));
  if (idx !== -1) {
    arr.splice(idx, 1);
    saveListePerso(liste);
    afficherMessage("Retiré de votre liste personnalisée !");
  }
}

// Genres pour les différents types
const genresMovie = [
  { id: "all", name: "Tout" },
  { id: 28, name: "Action" },
  { id: 35, name: "Comédie" },
  { id: 18, name: "Drame" },
  { id: 16, name: "Animation" },
  { id: 27, name: "Horreur" },
  { id: 10749, name: "Romance" },
  { id: 12, name: "Aventure" },
  { id: 53, name: "Thriller" }
];
const genresTV = [
  { id: "all", name: "Tout" },
  { id: 10759, name: "Action & Aventure" },
  { id: 35, name: "Comédie" },
  { id: 18, name: "Drame" },
  { id: 16, name: "Animation" },
  { id: 10762, name: "Enfants" },
  { id: 9648, name: "Mystère" },
  { id: 10765, name: "Science-Fiction & Fantastique" }
];
const genresTVShow = [
  { id: "all", name: "Tout" },
  { id: 10764, name: "Émission TV" },
  { id: 10767, name: "Talk" },
  { id: 99, name: "Documentaire" }
];

// ==================== CHARGEMENT DES GENRES ====================
async function chargerGenres() {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=fr-FR`;
  const response = await fetch(url);
  const data = await response.json();
  genreMap = data.genres.reduce((acc, genre) => {
    acc[genre.id] = genre.name;
    return acc;
  }, {});
}

// ==================== RECHERCHE DE FILMS ====================
async function rechercherFilms(query, cibleSuggestions = "suggestions") {
  const suggestions = document.getElementById(cibleSuggestions);
  suggestions.innerHTML = "";
  if (query.length < 1) return;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.results.length === 0) {
    suggestions.innerHTML = `<li class="list-group-item">Aucun résultat trouvé</li>`;
    return;
  }
  data.results.slice(0, 10).forEach((film) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = film.title;
    li.onclick = () => afficherDetailsFilm(film);
    suggestions.appendChild(li);
  });
}

// ==================== GESTION DES SUGGESTIONS ====================
document.addEventListener("click", (e) => {
  // Suggestions principales
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const suggestions = document.getElementById("suggestions");
  if (
    suggestions &&
    !suggestions.contains(e.target) &&
    e.target !== searchInput &&
    e.target !== searchButton
  ) {
    suggestions.innerHTML = "";
  }
  // Suggestions du modal
  const modalSearchInput = document.getElementById("modalSearchInput");
  const modalSearchButton = document.getElementById("modalSearchButton");
  const modalSuggestions = document.getElementById("modalSuggestions");
  if (
    modalSuggestions &&
    !modalSuggestions.contains(e.target) &&
    e.target !== modalSearchInput &&
    e.target !== modalSearchButton
  ) {
    modalSuggestions.innerHTML = "";
  }
});

// ==================== RECHERCHE D'ACTEURS, FILMS, SERIES ET EMISSIONS TV DANS LA BARRE DE RECHERCHE ====================
document.getElementById('searchBar').addEventListener('input', async function() {
  const query = this.value.trim();
  const suggestions = document.getElementById('suggestions');
  if (query.length < 2) {
    suggestions.innerHTML = '';
    return;
  }
  // Lancer les trois recherches en parallèle
  const [filmsRes, seriesRes, acteursRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(query)}`).then(r => r.json()),
    fetch(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(query)}`).then(r => r.json()),
    fetch(`https://api.themoviedb.org/3/search/person?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(query)}`).then(r => r.json())
  ]);
  suggestions.innerHTML = '';
  // Afficher les films trouvés
  (filmsRes.results || []).slice(0, 5).forEach(film => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center';
    li.style.cursor = 'pointer';
    li.innerHTML = `
      ${film.poster_path ? `<img src="https://image.tmdb.org/t/p/w45${film.poster_path}" style="width:32px;height:45px;object-fit:cover;border-radius:4px;margin-right:8px;">` : ''}
      <span>${film.title}</span>
      <span class="badge bg-primary ms-auto">Film</span>
    `;
    li.addEventListener('click', () => {
      suggestions.innerHTML = '';
      afficherDetailsFilm(film);
    });
    suggestions.appendChild(li);
  });
  // Afficher les séries trouvées
  (seriesRes.results || []).slice(0, 5).forEach(serie => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center';
    li.style.cursor = 'pointer';
    li.innerHTML = `
      ${serie.poster_path ? `<img src="https://image.tmdb.org/t/p/w45${serie.poster_path}" style="width:32px;height:45px;object-fit:cover;border-radius:4px;margin-right:8px;">` : ''}
      <span>${serie.name}</span>
      <span class="badge bg-info ms-auto">Série/Émission TV</span>
    `;
    li.addEventListener('click', () => {
      suggestions.innerHTML = '';
      afficherDetailsFilm(serie); // Utilise la même fonction pour afficher les détails
    });
    suggestions.appendChild(li);
  });
  // Afficher les acteurs trouvés
  (acteursRes.results || []).slice(0, 5).forEach(acteur => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center';
    li.style.cursor = 'pointer';
    li.innerHTML = `
      ${acteur.profile_path ? `<img src="https://image.tmdb.org/t/p/w45${acteur.profile_path}" style="width:32px;height:45px;object-fit:cover;border-radius:4px;margin-right:8px;">` : ''}
      <span>${acteur.name}</span>
      <span class="badge bg-success ms-auto">Acteur</span>
    `;
    li.addEventListener('click', () => {
      suggestions.innerHTML = '';
      document.getElementById('searchBar').value = acteur.name;
      afficherDetailsActeur(acteur.id);
    });
    suggestions.appendChild(li);
  });
  // Si aucun résultat
  if (suggestions.innerHTML === '') {
    suggestions.innerHTML = `<li class="list-group-item">Aucun résultat trouvé</li>`;
  }
});
// Entrée clavier pour sélectionner le premier résultat
document.getElementById('searchBar').addEventListener('keydown', function(e) {
  const suggestions = document.getElementById('suggestions');
  if (e.key === 'Enter' && suggestions.firstChild) {
    e.preventDefault();
    suggestions.firstChild.click();
  }
});

// ==================== AFFICHAGE DES DETAILS FILM (MODAL) ====================
async function afficherDetailsFilm(film) {
  try {
    // Récupérer les détails des acteurs via l'API TMDB
    const urlCredits = `https://api.themoviedb.org/3/movie/${film.id}/credits?api_key=${apiKey}&language=fr-FR`;
    const responseCredits = await fetch(urlCredits);
    const dataCredits = await responseCredits.json();

    document.getElementById("filmPoster").src = film.poster_path
      ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
      : "https://via.placeholder.com/500x750?text=Image+non+disponible";
    document.getElementById("filmTitle").textContent = film.title || film.name || "Titre non disponible";
    document.getElementById("filmRating").textContent = film.vote_average
      ? film.vote_average.toFixed(1)
      : "N/A";
    document.getElementById("filmVotes").textContent = film.vote_count || "0";
    document.getElementById("filmSynopsis").textContent = film.overview || "Aucun synopsis disponible.";

    // Ajouter les acteurs principaux avec leurs images
    const actorsList = document.getElementById("filmActors");
    actorsList.innerHTML = "";
    const actors = dataCredits.cast.slice(0, 5);
    if (actors.length > 0) {
      actors.forEach((actor) => {
        const actorDiv = document.createElement("div");
        actorDiv.className = "text-center";
        const actorImg = document.createElement("img");
        actorImg.src = actor.profile_path
          ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
          : "https://via.placeholder.com/200x300?text=Image+non+disponible";
        actorImg.alt = actor.name;
        actorImg.className = "img-fluid rounded";
        const actorName = document.createElement("p");
        actorName.textContent = actor.name;
        actorName.className = "mt-2";
        actorDiv.appendChild(actorImg);
        actorDiv.appendChild(actorName);
        actorsList.appendChild(actorDiv);
      });
    } else {
      actorsList.innerHTML = "<p>Aucun acteur trouvé</p>";
    }

    // Bouton liste personnalisée
    const btnZone = document.getElementById("addToListButton");
    if (btnZone) {
      const dejaAjoute = estDansListePerso(film.id, "film");
      if (dejaAjoute) {
        btnZone.innerHTML = `<i class="bi bi-check-circle"></i> Ajouté <button class="btn btn-danger btn-sm ms-2" onclick="if(confirm('Retirer de la liste ?')){retirerDeLaListePerso(${film.id},'film');afficherDetailsFilm(${JSON.stringify(film)})}"><i class="bi bi-x"></i></button>`;
        btnZone.disabled = true;
      } else {
        btnZone.innerHTML = `<i class="bi bi-plus"></i> Ajouter à ma liste personnalisée`;
        btnZone.disabled = false;
        btnZone.onclick = () => { ajouterALaListePerso(film, "film"); afficherDetailsFilm(film); };
      }
    }

    // Afficher la modal
    const modal = new bootstrap.Modal(document.getElementById("filmDetailsModal"));
    modal.show();
  } catch (error) {
    console.error("Erreur lors de l'affichage des détails du film :", error);
  }
}

// ==================== CAROUSEL FILMS TENDANCES ====================
async function chargerFilmsTendances() {
  const url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=fr-FR`;
  const response = await fetch(url);
  const data = await response.json();
  const carouselInner = document.getElementById("carouselInner");
  carouselInner.innerHTML = "";
  if (!data.results.length) {
    carouselInner.innerHTML = `
      <div class="carousel-item active">
        <div class="text-center py-5">
          <h3>Aucun film tendance pour le moment.</h3>
        </div>
      </div>`;
    return;
  }
  data.results.forEach((film, index) => {
    const isActive = index === 0 ? "active" : "";
    const imageUrl = film.backdrop_path
      ? `https://image.tmdb.org/t/p/original${film.backdrop_path}`
      : "https://via.placeholder.com/1280x720?text=Image+non+disponible";
    const note = film.vote_average.toFixed(1);
    const votes = film.vote_count;
    const genres = film.genre_ids.map((id) => genreMap[id]).join(", ");
    const dejaAjoute = estDansListePerso(film.id, "film");
    const btnGroup = dejaAjoute
      ? `<button class="btn btn-success btn-sm" disabled><i class="bi bi-check-circle"></i> Ajouté</button>
         <button class="btn btn-danger btn-sm ms-2" onclick="if(confirm('Retirer de la liste ?')){retirerDeLaListePerso(${film.id},'film');chargerFilmsTendances();}"><i class="bi bi-x"></i></button>`
      : `<button class="btn btn-outline-primary btn-sm" onclick="ajouterALaListePerso(${JSON.stringify(film)},'film');chargerFilmsTendances();"><i class="bi bi-plus"></i> Ajouter à ma liste</button>`;
    const item = `
      <div class="carousel-item ${isActive}">
        <img src="${imageUrl}" alt="${film.title}" class="d-block w-100">
        <div class="carousel-info">
          <h5>${film.title}</h5>
          <p><strong>Genres :</strong> ${genres}</p>
          <p>${film.overview.substring(0, 150)}...</p>
          <p>
            <i class="bi bi-star-fill text-warning"></i> ${note} / 10
            &nbsp;&nbsp;
            <i class="bi bi-hand-thumbs-up"></i> ${votes} votes
          </p>
          <div class="btn-group">
            ${btnGroup}
          </div>
        </div>
      </div>`;
    carouselInner.insertAdjacentHTML("beforeend", item);
  });
}

// ==================== AFFICHAGE DES CARDS ====================
function displayMovies(movies, container, append = false) {
  if (!append) container.innerHTML = "";
  if (!movies.length) {
    container.innerHTML = "<div class='text-center my-5 w-100'>Aucun film trouvé.</div>";
    return;
  }
  movies.forEach(film => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4 mb-4";
    const card = document.createElement("div");
    card.className = "card h-100";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <img src="${film.poster_path ? "https://image.tmdb.org/t/p/w500" + film.poster_path : "https://via.placeholder.com/500x750?text=No+Image"}" class="card-img-top" alt="${film.title}">
      <div class="card-body">
        <h5 class="card-title" title="${film.title}">${film.title}</h5>
        <p class="card-text">
          <span class="badge bg-violet text-white"><i class="bi bi-star-fill"></i> ${film.vote_average ? film.vote_average.toFixed(1) : "N/A"} / 10</span>
        </p>
        <div class="d-flex gap-2">
          <button class="btn ${estDansListePerso(film.id, "film") ? "btn-success" : "btn-outline-primary"} btn-sm flex-grow-1 btn-ajout-liste">
            <i class="bi ${estDansListePerso(film.id, "film") ? "bi-check-circle" : "bi-plus"}"></i> 
            ${estDansListePerso(film.id, "film") ? "Ajouté" : "Ajouter à ma liste"}
          </button>
          ${estDansListePerso(film.id, "film") ? `<button class="btn btn-danger btn-sm btn-retirer-liste"><i class="bi bi-x"></i></button>` : ""}
        </div>
      </div>
    `;
    // Ajout direct sans ouvrir le modal
    card.querySelector('.btn-ajout-liste').addEventListener('click', function(e) {
      e.stopPropagation();
      if (!estDansListePerso(film.id, "film")) {
        ajouterALaListePerso(film, "film");
        fetchAndDisplay();
      }
    });
    // Retirer de la liste
    if (estDansListePerso(film.id, "film")) {
      card.querySelector('.btn-retirer-liste').addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Retirer de la liste ?')) {
          retirerDeLaListePerso(film.id, "film");
          fetchAndDisplay();
        }
      });
    }
    // Clic sur la card = ouvrir le modal
    card.addEventListener("click", () => afficherDetailsFilm(film));
    col.appendChild(card);
    container.appendChild(col);
  });
}
function displayTV(series, container, append = false) {
  if (!append) container.innerHTML = "";
  if (!series.length) {
    container.innerHTML = "<div class='text-center my-5 w-100'>Aucune série trouvée.</div>";
    return;
  }
  series.forEach(serie => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4 mb-4";
    const card = document.createElement("div");
    card.className = "card h-100";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <img src="${serie.poster_path ? "https://image.tmdb.org/t/p/w500" + serie.poster_path : "https://via.placeholder.com/500x750?text=No+Image"}" class="card-img-top" alt="${serie.name}">
      <div class="card-body">
        <h5 class="card-title" title="${serie.name}">${serie.name}</h5>
        <p class="card-text">
          <span class="badge bg-violet text-white"><i class="bi bi-star-fill"></i> ${serie.vote_average ? serie.vote_average.toFixed(1) : "N/A"} / 10</span>
        </p>
        <div class="d-flex gap-2">
          <button class="btn ${estDansListePerso(serie.id, "serie") ? "btn-success" : "btn-outline-primary"} btn-sm flex-grow-1 btn-ajout-liste">
            <i class="bi ${estDansListePerso(serie.id, "serie") ? "bi-check-circle" : "bi-plus"}"></i> 
            ${estDansListePerso(serie.id, "serie") ? "Ajouté" : "Ajouter à ma liste"}
          </button>
          ${estDansListePerso(serie.id, "serie") ? `<button class="btn btn-danger btn-sm btn-retirer-liste"><i class="bi bi-x"></i></button>` : ""}
        </div>
      </div>
    `;
    card.querySelector('.btn-ajout-liste').addEventListener('click', function(e) {
      e.stopPropagation();
      if (!estDansListePerso(serie.id, "serie")) {
        ajouterALaListePerso(serie, "serie");
        fetchAndDisplay();
      }
    });
    if (estDansListePerso(serie.id, "serie")) {
      card.querySelector('.btn-retirer-liste').addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Retirer de la liste ?')) {
          retirerDeLaListePerso(serie.id, "serie");
          fetchAndDisplay();
        }
      });
    }
    card.addEventListener("click", () => afficherDetailsFilm(serie));
    col.appendChild(card);
    container.appendChild(col);
  });
}

function displayActors(actors, container, append = false) {
  if (!append) container.innerHTML = "";
  if (!actors.length) {
    container.innerHTML = "<div class='text-center my-5 w-100'>Aucun acteur trouvé.</div>";
    return;
  }
  actors.forEach(acteur => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4 mb-4";
    const card = document.createElement("div");
    card.className = "card h-100 text-center";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <img src="${acteur.profile_path ? "https://image.tmdb.org/t/p/w500" + acteur.profile_path : "https://via.placeholder.com/500x750?text=No+Image"}" class="card-img-top" alt="${acteur.name}">
      <div class="card-body">
        <h5 class="card-title" title="${acteur.name}">${acteur.name}</h5>
        <p class="card-text">
          <span class="badge bg-primary">Acteur</span>
        </p>
        <div class="d-flex gap-2">
          <button class="btn ${estDansListePerso(acteur.id, "acteur") ? "btn-success" : "btn-outline-primary"} btn-sm flex-grow-1 btn-ajout-liste">
            <i class="bi ${estDansListePerso(acteur.id, "acteur") ? "bi-check-circle" : "bi-plus"}"></i> 
            ${estDansListePerso(acteur.id, "acteur") ? "Ajouté" : "Ajouter à ma liste"}
          </button>
          ${estDansListePerso(acteur.id, "acteur") ? `<button class="btn btn-danger btn-sm btn-retirer-liste"><i class="bi bi-x"></i></button>` : ""}
        </div>
      </div>
    `;
    card.querySelector('.btn-ajout-liste').addEventListener('click', function(e) {
      e.stopPropagation();
      if (!estDansListePerso(acteur.id, "acteur")) {
        ajouterALaListePerso(acteur, "acteur");
        fetchAndDisplay();
      }
    });
    if (estDansListePerso(acteur.id, "acteur")) {
      card.querySelector('.btn-retirer-liste').addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Retirer de la liste ?')) {
          retirerDeLaListePerso(acteur.id, "acteur");
          fetchAndDisplay();
        }
      });
    }
    card.addEventListener("click", () => afficherDetailsActeur(acteur.id));
    col.appendChild(card);
    container.appendChild(col);
  });
}

// ==================== GESTION DU BOUTON "CHARGER PLUS" ====================
document.getElementById("btnChargerPlus").addEventListener("click", () => {
  currentPage++;
  fetchAndDisplay(true);
});

// ==================== RESET PAGE ====================
function resetAndFetch() {
  currentPage = 1;
  fetchAndDisplay();
}

// ==================== MESSAGE ====================
function afficherMessage(message) {
  const messageDiv = document.getElementById("message");
  if (!messageDiv) return;
  messageDiv.textContent = message;
  messageDiv.style.display = "block";
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}

// ==================== INITIALISATION AU CHARGEMENT ====================
window.addEventListener("DOMContentLoaded", async () => {
  await chargerGenres();
  await chargerFilmsTendances();
  await chargerActeursPopulaires();
});

// ==================== CAROUSEL ACTEURS + OFFCANVAS ACTEUR ====================
async function chargerActeursPopulaires() {
  const url = `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=fr-FR&page=1`;
  const response = await fetch(url);
  const data = await response.json();
  const wrapper = document.getElementById('swiperActorsWrapper');
  wrapper.innerHTML = "";
  data.results.forEach(acteur => {
    wrapper.innerHTML += `
      <div class="swiper-slide text-center" data-id="${acteur.id}">
        <img 
          src="${acteur.profile_path ? 'https://image.tmdb.org/t/p/w300' + acteur.profile_path : 'https://via.placeholder.com/200x280?text=No+Image'}"
          alt="${acteur.name}" 
          class="actor-img"
        >
        <div class="actor-name">${acteur.name}</div>
      </div>
    `;
  });
  // Initialisation Swiper
  new Swiper('#swiper-actors', {
    slidesPerView: 6,
    spaceBetween: 2,
    loop: true,
    freeMode: true,
    speed: 4000,
    autoplay: {
      delay: 0,
      disableOnInteraction: false
    },
    grabCursor: true,
    breakpoints: {
      0:   { slidesPerView: 2, spaceBetween: 1 },
      768: { slidesPerView: 4, spaceBetween: 2 },
      1200:{ slidesPerView: 6, spaceBetween: 2 }
    }
  });
  // Ajoute les événements click APRÈS avoir généré les slides
  document.querySelectorAll('#swiperActorsWrapper .swiper-slide').forEach(slide => {
    slide.addEventListener('click', async function() {
      const acteurId = this.getAttribute('data-id');
      await afficherDetailsActeur(acteurId);
    });
  });
}

// ==================== OFFCANVAS ACTEUR (DROITE) ====================
async function afficherDetailsActeur(acteurId) {
  // Récupère les infos de l'acteur
  const url = `https://api.themoviedb.org/3/person/${acteurId}?api_key=${apiKey}&language=fr-FR`;
  const response = await fetch(url);
  const acteur = await response.json();
  document.getElementById('offcanvasActeurLabel').textContent = acteur.name;
  document.getElementById('acteurPhoto').src = acteur.profile_path ? 'https://image.tmdb.org/t/p/w300' + acteur.profile_path : 'https://via.placeholder.com/200x280?text=No+Image';
  document.getElementById('acteurNaissance').textContent = acteur.birthday || "Inconnue";
  document.getElementById('acteurAge').textContent = acteur.birthday ? calculerAge(acteur.birthday) + " ans" : "Inconnu";
  document.getElementById('acteurBio').textContent = acteur.biography ? acteur.biography.substring(0, 350) + "..." : "Biographie non disponible.";
  // Récupère les films
  const urlFilms = `https://api.themoviedb.org/3/person/${acteurId}/movie_credits?api_key=${apiKey}&language=fr-FR`;
  const responseFilms = await fetch(urlFilms);
  const filmsData = await responseFilms.json();
  const topFilms = (filmsData.cast || []).sort((a, b) => b.popularity - a.popularity).slice(0, 5);
  const filmsDiv = document.getElementById('acteurFilms');
  filmsDiv.innerHTML = "";
  topFilms.forEach(film => {
    filmsDiv.innerHTML += `
      <div class="film-card film-detail" data-film-id="${film.id}">
        <img src="${film.poster_path ? 'https://image.tmdb.org/t/p/w200' + film.poster_path : 'https://via.placeholder.com/140x200?text=No+Image'}" alt="${film.title}">
        <div class="film-title" title="${film.title}">${film.title}</div>
      </div>
    `;
  });
  // Ajoute le bouton "Voir plus" si plus de 5 films
  if (filmsData.cast && filmsData.cast.length > 5) {
    filmsDiv.innerHTML += `
      <div class="film-card voir-plus" onclick="ouvrirTousLesFilmsActeur(${acteurId}, '${acteur.name.replace(/'/g, "\\'")}')">
        <div style="height:80%;display:flex;align-items:center;justify-content:center;">
          <span>Voir plus</span>
        </div>
      </div>
    `;
  }
  // Ajoute le click sur les 5 meilleurs films pour ouvrir l'offcanvas gauche avec détails
  filmsDiv.querySelectorAll('.film-detail').forEach(card => {
    card.addEventListener('click', async function() {
      const filmId = this.getAttribute('data-film-id');
      await ouvrirDetailsFilmOffcanvas(filmId);
    });
  });
  // Ouvre l'offcanvas Bootstrap (droite)
  const offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasActeur'));
  offcanvas.show();
}

// ==================== OFFCANVAS ACTEUR (GAUCHE) : TOUS LES FILMS ====================
async function ouvrirTousLesFilmsActeur(acteurId, acteurNom) {
  const urlFilms = `https://api.themoviedb.org/3/person/${acteurId}/movie_credits?api_key=${apiKey}&language=fr-FR`;
  const responseFilms = await fetch(urlFilms);
  const filmsData = await responseFilms.json();
  document.getElementById('offcanvasFilmsActeurLabel').textContent = `Tous les films de ${acteurNom}`;
  const filmsDiv = document.getElementById('tousLesFilmsActeur');
  filmsDiv.innerHTML = "";
  (filmsData.cast || [])
    .sort((a, b) => b.popularity - a.popularity)
    .forEach(film => {
      filmsDiv.innerHTML += `
        <div class="film-card film-detail-tous" data-film-id="${film.id}">
          <img src="${film.poster_path ? 'https://image.tmdb.org/t/p/w200' + film.poster_path : 'https://via.placeholder.com/140x200?text=No+Image'}" alt="${film.title}">
          <div class="film-title" title="${film.title}">${film.title}</div>
        </div>
      `;
    });
  // Ajoute le click sur chaque film pour ouvrir le offcanvas détail (par-dessus)
  filmsDiv.querySelectorAll('.film-detail-tous').forEach(card => {
    card.addEventListener('click', async function(e) {
      e.stopPropagation();
      const filmId = this.getAttribute('data-film-id');
      await ouvrirDetailFilmOffcanvas(filmId);
    });
  });
  // Ouvre le offcanvas gauche
  const offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasFilmsActeur'));
  offcanvas.show();
}

// ==================== OFFCANVAS FILM (GAUCHE) : DETAILS ====================
async function ouvrirDetailsFilmOffcanvas(filmId) {
  const url = `https://api.themoviedb.org/3/movie/${filmId}?api_key=${apiKey}&language=fr-FR`;
  const response = await fetch(url);
  const film = await response.json();
  // Récupérer les crédits pour les acteurs principaux
  const urlCredits = `https://api.themoviedb.org/3/movie/${filmId}/credits?api_key=${apiKey}&language=fr-FR`;
  const responseCredits = await fetch(urlCredits);
  const dataCredits = await responseCredits.json();
  // Remplir l'offcanvas gauche avec les infos du film
  document.getElementById('offcanvasFilmsActeurLabel').textContent = film.title || "Titre non disponible";
  const filmsDiv = document.getElementById('tousLesFilmsActeur');
  filmsDiv.innerHTML = `
    <div class="text-center mb-3">
      <img src="${film.poster_path ? 'https://image.tmdb.org/t/p/w500' + film.poster_path : 'https://via.placeholder.com/500x750?text=Image+non+disponible'}" alt="${film.title}" class="img-fluid rounded mb-3" style="max-height:350px;">
      <h3>${film.title || "Titre non disponible"}</h3>
      <p><strong>Note :</strong> ${film.vote_average ? film.vote_average.toFixed(1) : "N/A"} / 10 (${film.vote_count || 0} votes)</p>
      <p>${film.overview || "Aucun synopsis disponible."}</p>
      <h5>Acteurs principaux :</h5>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
        ${
          (dataCredits.cast || []).slice(0, 5).map(actor => `
            <div style="text-align:center;">
              <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w200' + actor.profile_path : 'https://via.placeholder.com/90x130?text=No+Image'}" alt="${actor.name}" style="width:70px;height:100px;object-fit:cover;border-radius:8px;">
              <div style="font-size:0.9rem;color:#fff;">${actor.name}</div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
  // Ouvre le offcanvas gauche
  const offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasFilmsActeur'));
  offcanvas.show();
}

// ==================== OFFCANVAS FILM (PAR-DESSUS) : DETAILS ====================
async function ouvrirDetailFilmOffcanvas(filmId) {
  const url = `https://api.themoviedb.org/3/movie/${filmId}?api_key=${apiKey}&language=fr-FR`;
  const response = await fetch(url);
  const film = await response.json();
  // Récupérer les crédits pour les acteurs principaux
  const urlCredits = `https://api.themoviedb.org/3/movie/${filmId}/credits?api_key=${apiKey}&language=fr-FR`;
  const responseCredits = await fetch(urlCredits);
  const dataCredits = await responseCredits.json();
  // Remplir le offcanvas détail (par-dessus)
  document.getElementById('offcanvasDetailFilmLabel').textContent = film.title || "Titre non disponible";
  document.getElementById('contenuDetailFilm').innerHTML = `
    <div class="text-center mb-3">
      <img src="${film.poster_path ? 'https://image.tmdb.org/t/p/w500' + film.poster_path : 'https://via.placeholder.com/500x750?text=Image+non+disponible'}" alt="${film.title}" class="img-fluid rounded mb-3" style="max-height:350px;">
      <h3>${film.title || "Titre non disponible"}</h3>
      <p><strong>Note :</strong> ${film.vote_average ? film.vote_average.toFixed(1) : "N/A"} / 10 (${film.vote_count || 0} votes)</p>
      <p>${film.overview || "Aucun synopsis disponible."}</p>
      <h5>Acteurs principaux :</h5>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
        ${
          (dataCredits.cast || []).slice(0, 5).map(actor => `
            <div style="text-align:center;">
              <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w200' + actor.profile_path : 'https://via.placeholder.com/90x130?text=No+Image'}" alt="${actor.name}" style="width:70px;height:100px;object-fit:cover;border-radius:8px;">
              <div style="font-size:0.9rem;color:#fff;">${actor.name}</div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
  // Ouvre le offcanvas détail (par-dessus)
  const offcanvas = new bootstrap.Offcanvas(document.getElementById('offcanvasDetailFilm'));
  offcanvas.show();
}

// ==================== OUTILS ====================
function calculerAge(dateNaissance) {
  const naissance = new Date(dateNaissance);
  const diff = Date.now() - naissance.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// ==================== FILTRES ET SYNCHRONISATION ====================
document.getElementById('typeSelect').addEventListener('change', function () {
  const value = this.value;
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === value);
  });
  document.querySelector(`.type-btn[data-type="${value}"]`).click();
});
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.getElementById('typeSelect').value = this.dataset.type;
  });
});
function updateGenreSelect() {
  const genreBtns = document.querySelectorAll('#genreFilters .genre-btn');
  const genreSelect = document.getElementById('genreSelect');
  if (!genreSelect) return;
  genreSelect.innerHTML = '';
  genreBtns.forEach(btn => {
    const option = document.createElement('option');
    option.value = btn.dataset.genre;
    option.textContent = btn.textContent.trim();
    if (btn.classList.contains('active')) option.selected = true;
    genreSelect.appendChild(option);
  });
}
updateGenreSelect();
document.getElementById('genreSelect').addEventListener('change', function () {
  const value = this.value;
  document.querySelectorAll('.genre-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.genre === value);
    if (btn.dataset.genre === value) btn.click();
  });
});
document.querySelectorAll('.genre-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.getElementById('genreSelect').value = this.dataset.genre;
  });
});

// ==================== INIT FILTRES ====================
let currentType = "movie";
let currentGenre = "all";
document.addEventListener("DOMContentLoaded", () => {
  renderGenres();
  fetchAndDisplay();
});

// ==================== RENDU DES GENRES ====================
function renderGenres() {
  const genreFilters = document.getElementById("genreFilters");
  genreFilters.innerHTML = "";
  let genres = [];
  if (currentType === "movie") genres = genresMovie;
  else if (currentType === "tv") genres = genresTV;
  else if (currentType === "tvshow") genres = genresTVShow;
  if (currentType === "person") {
    genreFilters.innerHTML = "";
    updateGenreSelect();
    return;
  }
  genres.forEach(g => {
    const btn = document.createElement("button");
    btn.className = "btn genre-btn " + (g.id === "all" ? "btn-secondary active" : "btn-outline-secondary");
    btn.textContent = g.name;
    btn.dataset.genre = g.id;
    btn.onclick = () => {
      document.querySelectorAll(".genre-btn").forEach(b => b.classList.remove("active", "btn-secondary"));
      btn.classList.add("active", "btn-secondary");
      btn.classList.remove("btn-outline-secondary");
      currentGenre = g.id;
      fetchAndDisplay();
      updateGenreSelect();
    };
    genreFilters.appendChild(btn);
  });
  updateGenreSelect();
}

// ==================== RENDU DES TYPES ====================
document.querySelectorAll(".type-btn").forEach(btn => {
  btn.addEventListener("click", function() {
    document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active", "btn-primary"));
    this.classList.add("active", "btn-primary");
    this.classList.remove("btn-outline-primary");
    currentType = this.dataset.type;
    currentGenre = "all";
    renderGenres();
    fetchAndDisplay();
  });
});

// ==================== FETCH & DISPLAY ====================
let currentPage = 1;
let totalPages = 1;
async function fetchAndDisplay(append = false) {
  const container = document.getElementById("resultatsCartes");
  if (!append) container.innerHTML = '<div class="text-center my-5 w-100"><div class="spinner-border text-primary"></div></div>';
  let url = "";
  let results = [];
  let data = {};
  if (currentType === "movie") {
    url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=fr-FR&sort_by=popularity.desc&page=${currentPage}${currentGenre !== "all" ? "&with_genres=" + currentGenre : ""}`;
    data = await fetch(url).then(r => r.json());
    results = data.results;
    totalPages = data.total_pages;
    displayMovies(results, container, append);
  } else if (currentType === "tv" || currentType === "tvshow") {
    url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=fr-FR&sort_by=popularity.desc&page=${currentPage}${currentGenre !== "all" ? "&with_genres=" + currentGenre : ""}`;
    data = await fetch(url).then(r => r.json());
    results = data.results;
    totalPages = data.total_pages;
    displayTV(results, container, append);
  } else if (currentType === "person") {
    url = `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=fr-FR&page=${currentPage}`;
    data = await fetch(url).then(r => r.json());
    results = data.results;
    totalPages = data.total_pages;
    displayActors(results, container, append);
  }
  document.getElementById("btnChargerPlus").style.display = (currentPage < totalPages) ? "inline-block" : "none";
}