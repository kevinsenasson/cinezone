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

// ***********************carousel acteurs***********************
async function chargerActeursPopulaires() {
  const apiKey = "c60699cfb590fac613bd4224390bd432";
  const url = `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=fr-FR&page=1`;
  const response = await fetch(url);
  const data = await response.json();
  const wrapper = document.getElementById('swiperActorsWrapper');
  wrapper.innerHTML = "";

  data.results.forEach(acteur => {
    wrapper.innerHTML += `
      <div class="swiper-slide text-center">
        <img 
          src="${acteur.profile_path ? 'https://image.tmdb.org/t/p/w300' + acteur.profile_path : 'https://via.placeholder.com/220x320?text=No+Image'}"
          alt="${acteur.name}" 
          style="width:220px;height:320px;object-fit:cover;border-radius:18px;box-shadow:0 6px 24px rgba(0,0,0,0.22);margin:auto;display:block;"
          class="mb-2"
        >
        <div class="fw-bold">${acteur.name}</div>
      </div>
    `;
  });

  // Initialise Swiper après avoir injecté les slides
  new Swiper('#swiper-actors', {
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },
    loop: true,
    speed: 500,
    slidesPerGroup: 1,
    effect: 'coverflow',
    coverflowEffect: {
    rotate: 10,
    stretch: -20,
    depth: 50,
    modifier: 1,
    slideShadows: false,
    },
    breakpoints: {
      0:   { slidesPerView: 1, spaceBetween: 16 },
      620: { slidesPerView: 2, spaceBetween: 16 },
      768: { slidesPerView: 3, spaceBetween: 24 },
      1200:{ slidesPerView: 5, spaceBetween: 32 }
    }
  });
}

// Appelle la fonction au chargement de la page
window.addEventListener("DOMContentLoaded", async () => {
  await chargerGenres();
  await chargerFilmsTendances();
  await chargerActeursPopulaires();
});
// *********************** fin carousel acteurs***********************