const apiKey = "c60699cfb590fac613bd4224390bd432";
const maListe = [];
let genreMap = {};

// Charger les genres
async function chargerGenres() {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=fr-FR`;
  const response = await fetch(url);
  const data = await response.json();

  genreMap = data.genres.reduce((acc, genre) => {
    acc[genre.id] = genre.name;
    return acc;
  }, {});
}

// Recherche de films
async function rechercherFilms(query, cibleSuggestions = "suggestions") {
  const suggestions = document.getElementById(cibleSuggestions);
  suggestions.innerHTML = ""; // Réinitialiser les suggestions

  if (query.length < 1) return; // Ne pas rechercher si la saisie est vide

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

// Gestion des suggestions (fermeture au clic extérieur)
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

// Recherche d'acteurs dans la barre de recherche
document.getElementById('searchBar').addEventListener('input', async function() {
  const query = this.value.trim();
  const suggestions = document.getElementById('suggestions');
  if (query.length < 2) {
    suggestions.innerHTML = '';
    return;
  }

  // Lancer les deux recherches en parallèle
  const [filmsRes, acteursRes] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(query)}`).then(r => r.json()),
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

// Affichage des détails d'un film dans la modal
async function afficherDetailsFilm(film) {
  try {
    // Récupérer les détails des acteurs via l'API TMDB
    const urlCredits = `https://api.themoviedb.org/3/movie/${film.id}/credits?api_key=${apiKey}&language=fr-FR`;
    const responseCredits = await fetch(urlCredits);
    const dataCredits = await responseCredits.json();

    

    // Vérifier si les données du film sont disponibles
    document.getElementById("filmPoster").src = film.poster_path
      ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
      : "https://via.placeholder.com/500x750?text=Image+non+disponible";
    document.getElementById("filmTitle").textContent = film.title || "Titre non disponible";
    document.getElementById("filmRating").textContent = film.vote_average
      ? film.vote_average.toFixed(1)
      : "N/A";
    document.getElementById("filmVotes").textContent = film.vote_count || "0";
    document.getElementById("filmSynopsis").textContent = film.overview || "Aucun synopsis disponible.";

    // Ajouter les acteurs principaux avec leurs images
    const actorsList = document.getElementById("filmActors");
    actorsList.innerHTML = ""; // Réinitialiser la liste
    const actors = dataCredits.cast.slice(0, 5); // Les 5 premiers acteurs
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

    // Afficher la modal
    const modal = new bootstrap.Modal(document.getElementById("filmDetailsModal"));
    modal.show();
  } catch (error) {
    console.error("Erreur lors de l'affichage des détails du film :", error);
  }
}

// Ajouter un gestionnaire d'événements pour les films du carrousel
document.getElementById("carouselInner").addEventListener("click", (event) => {
  const filmId = event.target.dataset.filmId; // Assurez-vous que chaque film a un attribut data-film-id
  if (filmId) {
    // Récupérer les détails du film via l'API
    fetch(
      `https://api.themoviedb.org/3/movie/${filmId}?api_key=${apiKey}&language=fr-FR`
    )
      .then((response) => response.json())
      .then((film) => afficherDetailsFilm(film))
      .catch((error) => console.error("Erreur lors de la récupération du film :", error));
  }
});

// Charger les films tendances
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

    // Récupérer les genres
    const genres = film.genre_ids.map((id) => genreMap[id]).join(", ");

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
            <button class="btn btn-success btn-sm" onclick="ajouterALaListe(this, '${film.title}')">
              Ajouter à ma liste
            </button>
          </div>
        </div>
      </div>`;
    carouselInner.insertAdjacentHTML("beforeend", item);
  });
}

function afficherMessage(message) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = message;
  messageDiv.style.display = "block";
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}

function ajouterALaListe(button, titreFilm) {
  if (!maListe.includes(titreFilm)) {
    maListe.push(titreFilm);

    const parentDiv = button.parentElement;
    parentDiv.innerHTML = `
      <button class="btn btn-secondary btn-sm" disabled>
        <i class="bi bi-check-circle-fill"></i> Ajouté
      </button>
      <button class="btn btn-danger btn-sm" onclick="supprimerDeLaListe('${titreFilm}', this)">
        <i class="bi bi-x-circle"></i>
      </button>`;
    afficherMessage(
      `"${titreFilm}" a été ajouté à votre liste personnalisée.`
    );
  }
}

function supprimerDeLaListe(titreFilm, deleteButton) {
  const index = maListe.indexOf(titreFilm);
  if (index !== -1) {
    maListe.splice(index, 1);
    const parentDiv = deleteButton.parentElement;
    parentDiv.innerHTML = `
      <button class="btn btn-success btn-sm" onclick="ajouterALaListe(this, '${titreFilm}')">
        Ajouter à ma liste
      </button>`;
    afficherMessage(
      `"${titreFilm}" a été supprimé de votre liste personnalisée.`
    );
  }
}

// Initialisation au chargement de la page
window.addEventListener("DOMContentLoaded", async () => {
  await chargerGenres();
  await chargerFilmsTendances();
});

// ***********************carousel acteurs + offcanvas acteur*************************

// Charger les acteurs populaires dans le Swiper
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

// Affiche la fiche acteur (offcanvas droite)
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

// Ouvre l'offcanvas gauche avec tous les films de l'acteur
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

// Ouvre l'offcanvas gauche avec les détails d'un film
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

// Ouvre un offcanvas par-dessus avec les détails d'un film (depuis la liste complète)
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

// Calculer l'âge à partir de la date de naissance
function calculerAge(dateNaissance) {
  const naissance = new Date(dateNaissance);
  const diff = Date.now() - naissance.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Appel au chargement de la page
window.addEventListener("DOMContentLoaded", async () => {
  await chargerActeursPopulaires();
});

// *********************** fin carousel acteurs + offcanvas acteur*************************

// ================== GENRES ==================
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

// ================== INIT ==================
let currentType = "movie";
let currentGenre = "all";

document.addEventListener("DOMContentLoaded", () => {
  renderGenres();
  fetchAndDisplay();
});

// ================== RENDU DES GENRES ==================
function renderGenres() {
  const genreFilters = document.getElementById("genreFilters");
  genreFilters.innerHTML = "";
  let genres = [];
  if (currentType === "movie") genres = genresMovie;
  else if (currentType === "tv") genres = genresTV;
  else if (currentType === "tvshow") genres = genresTVShow;
  // Pas de genre pour les acteurs
  if (currentType === "person") {
    genreFilters.innerHTML = "";
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
    };
    genreFilters.appendChild(btn);
  });
}

// ================== RENDU DES TYPES ==================
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

// ================== FETCH & DISPLAY ==================
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

// ================== AFFICHAGE DES CARDS ==================
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
      <img src="${film.poster_path ? "https://image.tmdb.org/t/p/w500" + film.poster_path : ""}" class="card-img-top" alt="${film.title}">
      <div class="card-body">
        <h5 class="card-title" title="${film.title}">${film.title}</h5>
        <p class="card-text">
          <span class="badge bg-warning text-dark"><i class="bi bi-star-fill"></i> ${film.vote_average ? film.vote_average.toFixed(1) : "N/A"} / 10</span>
        </p>
      </div>
    `;
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
      <img src="${serie.poster_path ? "https://image.tmdb.org/t/p/w500" + serie.poster_path : ""}" class="card-img-top" alt="${serie.name}">
      <div class="card-body">
        <h5 class="card-title" title="${serie.name}">${serie.name}</h5>
        <p class="card-text">
          <span class="badge bg-warning text-dark"><i class="bi bi-star-fill"></i> ${serie.vote_average ? serie.vote_average.toFixed(1) : "N/A"} / 10</span>
        </p>
      </div>
    `;
    // Tu peux ajouter un event ici si tu veux ouvrir un détail série
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
      <img src="${acteur.profile_path ? "https://image.tmdb.org/t/p/w500" + acteur.profile_path : ""}" class="card-img-top" alt="${acteur.name}">
      <div class="card-body">
        <h5 class="card-title" title="${acteur.name}">${acteur.name}</h5>
        <p class="card-text">
          <span class="badge bg-primary">Acteur</span>
        </p>
      </div>
    `;
    card.addEventListener("click", () => afficherDetailsActeur(acteur.id));
    col.appendChild(card);
    container.appendChild(col);
  });
}y

let currentPage = 1;
let totalPages = 1;

// Modifie fetchAndDisplay pour gérer la pagination
async function fetchAndDisplay(append = false) {
  const container = document.getElementById("resultatsCartes");
  if (!append) container.innerHTML = '<div class="text-center my-5 w-100"><div class="spinner-border text-primary"></div></div>';
  let url = "";
  let results = [];
  if (currentType === "movie") {
    url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=fr-FR&sort_by=popularity.desc&page=${currentPage}${currentGenre !== "all" ? "&with_genres=" + currentGenre : ""}`;
    const data = await fetch(url).then(r => r.json());
    results = data.results;
    totalPages = data.total_pages;
    displayMovies(results, container, append);
  }
  // ... (idem pour séries)
  document.getElementById("btnChargerPlus").style.display = (currentPage < totalPages) ? "inline-block" : "none";
}

// Modifie displayMovies pour append si besoin
function displayMovies(movies, container, append = false) {
  if (!append) container.innerHTML = "";
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
      </div>
    `;
    // Ajoute le click pour ouvrir le modal
    card.addEventListener("click", () => afficherDetailsFilm(film));
    col.appendChild(card);
    container.appendChild(col);
  });
}

// Gestion du bouton "Charger plus"
document.getElementById("btnChargerPlus").addEventListener("click", () => {
  currentPage++;
  fetchAndDisplay(true);
});

// Remets la page à 1 à chaque changement de filtre/type
function resetAndFetch() {
  currentPage = 1;
  fetchAndDisplay();
}
// Appelle resetAndFetch() au lieu de fetchAndDisplay() dans tes listeners de filtres/types.

