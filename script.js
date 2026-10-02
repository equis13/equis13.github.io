const SPREADSHEET_ID = '1Fhl26Rla6TJ5QL2G-LKQ_YGweRg6OACLrz8EU0H4nB4';

async function fetchSheetTab(tabName) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url);
  const text = await res.text();
  const jsonText = text.substring(47, text.length - 2);
  const data = JSON.parse(jsonText);
  
  const cols = data.table.cols.map(c => c && c.label ? c.label.toLowerCase().trim() : '');
  return data.table.rows.map(r => {
    let rowObj = {};
    r.c.forEach((cell, idx) => {
      if (cols[idx]) {
        rowObj[cols[idx]] = cell && cell.v !== null ? cell.v : '';
      }
    });
    return rowObj;
  });
}

/* Carga exactamente 3 noticias con la estructura de 1/3 imagen y 2/3 info */
async function loadNoticias() {
  try {
    const noticias = await fetchSheetTab('Noticias');
    const seleccionadas = noticias.slice(-4).reverse();

    const container = document.getElementById('noticias-container');
    if (!container) return;
    container.innerHTML = '';

    seleccionadas.forEach(n => {
      const card = document.createElement('div');
      card.className = 'news';
      card.innerHTML = `
        <div class="news-img-container">
          <img class="efe_img" src="${n.foto || 'x13.jpg'}" alt="${n.titulo}" data-news='${JSON.stringify(n).replace(/'/g, "&apos;")}'>
        </div>
        <div class="news-content">
          <a class="news-title-btn" data-news='${JSON.stringify(n).replace(/'/g, "&apos;")}'>
            <span class="cat">${n.fecha_dia || 'INFO'}</span> ${n.titulo}
          </a>
          <p>${n.resumen || ''}</p>
        </div>
      `;
      container.appendChild(card);
    });

    // Delegación de eventos para abrir el modal
    container.querySelectorAll('.efe_img, .news-title-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const newsData = JSON.parse(el.getAttribute('data-news'));
        openModal(newsData);
      });
    });

  } catch (e) {
    console.error('Error cargando noticias:', e);
  }
}

/* Carga exactamente 3 reseñas con la estructura de 1/3 imagen y 2/3 info */
async function loadResenas() {
  try {
    const resenas = await fetchSheetTab('Resenas');
    const seleccionadas = resenas.slice(0, 6);

    const menu2Container = document.getElementById('resenas-container');
    if (!menu2Container) return;

    let html = '<ul style="padding:0; list-style:none; width:100%; display:grid; gap:15px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">';
    
    seleccionadas.forEach(r => {
      html += `
        <li class="news" style="margin:0;">
          <div class="news-img-container">
            <img class="efe_img" src="${r.foto || 'x13.jpg'}" alt="${r.titulo}"/>
          </div>
          <div class="news-content">
            <a href="${r.link || '#'}" target="_blank">
              <span class="cat">${(r.categoria || 'RESEÑA').toUpperCase()}</span> ${r.titulo}
            </a>
            <p><b>${r.tipo || ''}</b></p>
          </div>
        </li>
      `;
    });

    html += '</ul>';
    menu2Container.innerHTML = html;
  } catch (e) {
    console.error('Error cargando reseñas:', e);
  }
}

function openModal(data) {
  document.getElementById('modal-title').innerText = data.titulo || '';
  document.getElementById('modal-date-cat').innerText = `${data.fecha_mes || ''} ${data.fecha_dia || ''} | Categoria: ${(data.categoria || '').toUpperCase()}`;
  document.getElementById('modal-img').src = data.foto || '';
  document.getElementById('modal-text').innerText = data.texto_completo || '';

  const extLink = document.getElementById('modal-external-link');
  if (data.link && data.link.toString().trim() !== '') {
    extLink.href = data.link;
    extLink.style.display = 'inline-block';
  } else {
    extLink.style.display = 'none';
  }

  document.getElementById('news-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('news-modal').style.display = 'none';
}

// Inicialización de Eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  loadNoticias();
  loadResenas();

  // Menú Responsive Toggle
  const navButton = document.querySelector('button[aria-expanded]');
  if (navButton) {
    navButton.addEventListener('click', () => {
      const expanded = navButton.getAttribute('aria-expanded') === 'true';
      navButton.setAttribute('aria-expanded', !expanded);
    });
  }

  // Cerrar Modal
  const closeBtn = document.getElementById('close-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  window.addEventListener('click', (event) => {
    const modal = document.getElementById('news-modal');
    if (event.target === modal) {
      closeModal();
    }
  });
});
