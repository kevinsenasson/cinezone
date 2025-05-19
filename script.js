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


async function rechercherFilms(query, cibleSuggestions = "suggestions") {
  const suggestions = document.getElementById(cibleSuggestions);
  suggestions.innerHTML = ""; // Réinitialiser les suggestions

  if (query.length < 1) return; // Ne pas rechercher si la saisie est vide

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(
    query
  )}`;
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

async function chargerActeursPopulaires() {
  try {
    const url = `https://api.themoviedb.org/3/person/popular?api_key=${apiKey}&language=fr-FR&page=1`;
    const response = await fetch(url);
    const data = await response.json();

    const carouselTrack = document.getElementById("carouselActorsTrack");
    carouselTrack.innerHTML = ""; // Réinitialiser le contenu

    // Ajouter chaque acteur au carrousel
    data.results.forEach((acteur) => {
      const li = document.createElement("li");

      const actorImg = document.createElement("img");
      actorImg.src = acteur.profile_path
        ? `https://image.tmdb.org/t/p/w200${acteur.profile_path}`
        : "https://via.placeholder.com/200x300?text=Image+non+disponible";
      actorImg.alt = acteur.name;

      const actorName = document.createElement("p");
      actorName.textContent = acteur.name;

      li.appendChild(actorImg);
      li.appendChild(actorName);
      carouselTrack.appendChild(li);
    });

    // Initialiser le carrousel
    initialiserCarouselNetflix();
  } catch (error) {
    console.error("Erreur lors du chargement des acteurs populaires :", error);
  }
}

function initialiserCarouselNetflix() {
  const track = document.getElementById("carouselActorsTrack");
  const prevButton = document.getElementById("prevActors");
  const nextButton = document.getElementById("nextActors");
  const items = track.querySelectorAll("li");

  // Fonction pour recalculer la largeur des éléments
  function updateItemWidth() {
    const containerWidth = track.parentElement.offsetWidth; // Largeur du conteneur visible
    const isMobile = window.innerWidth <= 768;
    const visibleItems = isMobile ? 1 : 6; // 1 image sur mobile, 6 sur desktop
    const itemWidth = containerWidth / visibleItems;
  
    items.forEach((item) => {
      item.style.flex = `0 0 ${itemWidth}px`;
      item.style.maxWidth = `${itemWidth}px`;
      item.style.textAlign = "center"; // Centrer le contenu des éléments
    });
  
    return { itemWidth, visibleItems };
  }

  let { itemWidth, visibleItems } = updateItemWidth();
  let currentPosition = visibleItems * itemWidth;

  // Dupliquer les premiers et derniers éléments pour un effet infini
  for (let i = 0; i < visibleItems; i++) {
    const firstClone = items[i].cloneNode(true);
    const lastClone = items[items.length - 1 - i].cloneNode(true);
    track.appendChild(firstClone); // Ajouter les clones à la fin
    track.insertBefore(lastClone, track.firstChild); // Ajouter les clones au début
  }

  // Ajuster la position initiale pour compenser les clones
  track.style.transform = `translateX(-${currentPosition}px)`;

  // Gérer le clic sur le bouton "Suivant"
  nextButton.addEventListener("click", () => {
    currentPosition += itemWidth;
    track.style.transition = "transform 0.5s ease-in-out";
    track.style.transform = `translateX(-${currentPosition}px)`;

    // Réinitialiser la position pour un effet infini
    if (currentPosition >= (items.length + visibleItems) * itemWidth) {
      currentPosition = visibleItems * itemWidth;
      setTimeout(() => {
        track.style.transition = "none";
        track.style.transform = `translateX(-${currentPosition}px)`;
      }, 500); // Attendre la fin de la transition
    }
  });

  // Gérer le clic sur le bouton "Précédent"
  prevButton.addEventListener("click", () => {
    currentPosition -= itemWidth;
    track.style.transition = "transform 0.5s ease-in-out";
    track.style.transform = `translateX(-${currentPosition}px)`;

    // Réinitialiser la position pour un effet infini
    if (currentPosition <= 0) {
      currentPosition = items.length * itemWidth;
      setTimeout(() => {
        track.style.transition = "none";
        track.style.transform = `translateX(-${currentPosition}px)`;
      }, 500); // Attendre la fin de la transition
    }
  });

  // Recalculer la largeur des éléments lors du redimensionnement de la fenêtre
  window.addEventListener("resize", () => {
    const updatedValues = updateItemWidth();
    itemWidth = updatedValues.itemWidth;
    visibleItems = updatedValues.visibleItems;
    currentPosition = visibleItems * itemWidth;
    track.style.transition = "none";
    track.style.transform = `translateX(-${currentPosition}px)`;
  });
}

// Charger les acteurs populaires au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  chargerActeursPopulaires();
});

window.addEventListener("DOMContentLoaded", async () => {
  await chargerGenres();
  await chargerFilmsTendances();
});