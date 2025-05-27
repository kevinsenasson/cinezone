// ==================== AFFICHAGE DES FILMS ====================
function afficherFilms() {
  const container = document.getElementById('liste-films');
  container.innerHTML = '';
  const listePerso = JSON.parse(localStorage.getItem('listePerso') || '{}');
  if (!listePerso.films || listePerso.films.length === 0) {
    container.innerHTML = "<div class='text-center text-muted'>Aucun film ajouté.</div>";
    return;
  }
  listePerso.films.forEach(film => {
    const col = document.createElement('div');
    col.className = "col-12 col-md-6 col-lg-4 mb-4";
    col.innerHTML = `
      <div class="card h-100" style="cursor:pointer;">
        <img src="${film.poster_path ? "https://image.tmdb.org/t/p/w500" + film.poster_path : "https://via.placeholder.com/500x750?text=No+Image"}" class="card-img-top" alt="${film.title}">
        <div class="card-body">
          <h5 class="card-title" title="${film.title}">${film.title}</h5>
          <p class="card-text">
            <span class="badge bg-violet text-white"><i class="bi bi-star-fill"></i> ${film.vote_average ? film.vote_average.toFixed(1) : "N/A"} / 10</span>
          </p>
          <button class="btn btn-success me-2" disabled>
            <i class="bi bi-check-circle"></i> Ajouté
          </button>
          <button class="btn btn-danger btn-remove" data-type="film" data-id="${film.id}">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    `;
    col.querySelector('.card').addEventListener('click', e => {
      if (!e.target.classList.contains('btn-remove')) afficherModalFilm(film);
    });
    container.appendChild(col);
  });
}

// ==================== AFFICHAGE DES SERIES ET EMISSIONTV ====================

function afficherSeriesEtEmissionTV() {
  const container = document.getElementById('liste-series-emissiontv');
  container.innerHTML = '';
  const listePerso = JSON.parse(localStorage.getItem('listePerso') || '{}');
  const series = (listePerso.series || []);
  const emissiontv = (listePerso.emissiontv || []);
  const tout = [...series, ...emissiontv];
  if (tout.length === 0) {
    container.innerHTML = "<div class='text-center text-muted'>Aucune série ou émission TV ajoutée.</div>";
    return;
  }
  tout.forEach(item => {
    const col = document.createElement('div');
    col.className = "col-12 col-md-6 col-lg-4 mb-4";
    col.innerHTML = `
      <div class="card h-100" style="cursor:pointer;">
        <img src="${item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : "https://via.placeholder.com/500x750?text=No+Image"}" class="card-img-top" alt="${item.name}">
        <div class="card-body">
          <h5 class="card-title" title="${item.name}">${item.name}</h5>
          <p class="card-text">
            <span class="badge bg-violet text-white"><i class="bi bi-star-fill"></i> ${item.vote_average ? item.vote_average.toFixed(1) : "N/A"} / 10</span>
            <span class="badge bg-secondary ms-2">${series.includes(item) ? "Série" : "Émission TV"}</span>
          </p>
          <button class="btn btn-success me-2" disabled>
            <i class="bi bi-check-circle"></i> Ajouté
          </button>
          <button class="btn btn-danger btn-remove" data-type="${series.includes(item) ? "serie" : "emissiontv"}" data-id="${item.id}">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    `;
    col.querySelector('.card').addEventListener('click', e => {
      if (!e.target.classList.contains('btn-remove')) afficherModalSerie(item);
    });
    container.appendChild(col);
  });
}

// ==================== AFFICHAGE ACTEURS ====================
function afficherActeurs() {
  const container = document.getElementById('liste-acteurs');
  container.innerHTML = '';
  const listePerso = JSON.parse(localStorage.getItem('listePerso') || '{}');
  if (!listePerso.acteurs || listePerso.acteurs.length === 0) {
    container.innerHTML = "<div class='text-center text-muted'>Aucun acteur ajouté.</div>";
    return;
  }
  listePerso.acteurs.forEach(acteur => {
    const col = document.createElement('div');
    col.className = "col-12 col-md-6 col-lg-4 mb-4";
    col.innerHTML = `
      <div class="card h-100" style="cursor:pointer;">
        <img src="${acteur.profile_path ? "https://image.tmdb.org/t/p/w500" + acteur.profile_path : "https://via.placeholder.com/500x750?text=No+Image"}" class="card-img-top" alt="${acteur.name}">
        <div class="card-body">
          <h5 class="card-title" title="${acteur.name}">${acteur.name}</h5>
          <button class="btn btn-success me-2" disabled>
            <i class="bi bi-check-circle"></i> Ajouté
          </button>
          <button class="btn btn-danger btn-remove" data-type="acteur" data-id="${acteur.id}">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    `;
    col.querySelector('.card').addEventListener('click', e => {
      if (!e.target.classList.contains('btn-remove')) afficherOffcanvasActeur(acteur);
    });
    container.appendChild(col);
  });
}
// ==================== SUPPRESSION AVEC CONFIRMATION ====================
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btn-remove')) {
    e.stopPropagation();
    const type = e.target.dataset.type;
    const id = e.target.dataset.id;
    if (confirm("Voulez-vous vraiment retirer cet élément de votre liste ?")) {
      retirerDeLaListe(type, id);
    }
  }
});

function retirerDeLaListe(type, id) {
  const listePerso = JSON.parse(localStorage.getItem('listePerso') || '{}');
  let arr;
  if (type === "film") arr = listePerso.films;
  else if (type === "serie") arr = listePerso.series;
  else if (type === "emissiontv") arr = listePerso.emissiontv;
  else if (type === "acteur") arr = listePerso.acteurs;
  if (!arr) return;
  const idx = arr.findIndex(item => String(item.id) === String(id));
  if (idx !== -1) arr.splice(idx, 1);
  localStorage.setItem('listePerso', JSON.stringify(listePerso));
  afficherFilms();
  afficherSeriesEtEmissionTV(); // <-- remplace afficherSeries() et afficherEmissionTV()
  afficherActeurs();
}

// ==================== MODAL FILM/SERIE/EMISSION ====================
function afficherModalFilm(film) {
  document.getElementById('filmDetailsModalBody').innerHTML = `
    <div class="text-center">
      <img src="${film.poster_path ? "https://image.tmdb.org/t/p/w500" + film.poster_path : "https://via.placeholder.com/500x750?text=No+Image"}" class="img-fluid mb-3" style="max-height:350px;">
      <h3>${film.title || film.name}</h3>
      <p><strong>Note :</strong> ${film.vote_average ? film.vote_average.toFixed(1) : "N/A"} / 10</p>
      <p>${film.overview || "Aucun synopsis disponible."}</p>
    </div>
  `;
  new bootstrap.Modal(document.getElementById('filmDetailsModal')).show();
}
function afficherModalSerie(serie) {
  afficherModalFilm(serie);
}

// ==================== OFFCANVAS ACTEUR ====================
function afficherOffcanvasActeur(acteur) {
  document.getElementById('offcanvasActeurLabel').textContent = acteur.name;
  document.getElementById('offcanvasActeurBody').innerHTML = `
    <div class="text-center mb-3">
      <img src="${acteur.profile_path ? "https://image.tmdb.org/t/p/w300" + acteur.profile_path : "https://via.placeholder.com/200x280?text=No+Image"}" class="img-fluid rounded mb-3" style="max-height:200px;">
      <h4>${acteur.name}</h4>
      <p>${acteur.biography ? acteur.biography.substring(0, 350) + "..." : "Biographie non disponible."}</p>
    </div>
    <div id="acteurFilmsMini"></div>
  `;
  new bootstrap.Offcanvas(document.getElementById('offcanvasActeur')).show();
}

// ==================== INITIALISATION ====================
afficherFilms();
afficherSeriesEtEmissionTV();
afficherActeurs();