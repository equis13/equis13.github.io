// ID del Spreadsheet de Google
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

async function loadNoticias() {
  try {
    const noticias = await fetchSheetTab('Noticias');

    const getRecientes = (cat) => noticias
      .filter(n => (n.categoria || '').toString().toLowerCase().trim() === cat)
      .slice(-5)
      .slice(-2);

    const cineItems = getRecientes('cine');
    const wrestlingItems = getRecientes('wrestling');
    const serieItems = getRecientes('serie');

    const seleccionadas = [
      cineItems[0], wrestlingItems[0], serieItems[0],
      serieItems[1], wrestlingItems[1], cineItems[1]
    ].filter(Boolean);

    const container = document.querySelector('#bottom .container');
    if (!container) return;
    container.innerHTML = '';

    seleccionadas.forEach(n => {
      const hasText = n.texto_completo && n.texto_completo.toString().trim() !== '';
      const hasLink = n.link && n.link.toString().trim() !== '';
      
      let clickHandler = '';
      let hrefAttr = '#';

      if (hasText) {
        clickHandler = `onclick="openModal('${encodeURIComponent(JSON.stringify(n))}'); return false;"`;
      } else if (hasLink) {
        hrefAttr = n.link;
      }

      const card = document.createElement('div');
      card.className = 'news';
      card.innerHTML = `
        <a href="${hrefAttr}" ${clickHandler} style="cursor:pointer;">
          <b>${n.fecha_mes}</b> 
          <span class="cat">${n.fecha_dia}</span> 
          ${n.titulo}
        </a> 
        <p style="font-size: 16px; padding: 15px 14px 0px 8px; line-height: 200%; text-align:center">
          <img class="efe_img" src="${n.foto}" alt="${n.titulo}"/>
          <br/>
          ${n.resumen}
        </p>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    console.error('Error cargando noticias:', e);
  }
}

async function loadResenas() {
  try {
    const resenas = await fetchSheetTab('Resenas');
    
    const getRandom = (arr, n) => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, n);
    };

    const musicItems = getRandom(resenas.filter(r => (r.categoria || '').toString().toLowerCase().trim() === 'music'), 2);
    const filmItems = getRandom(resenas.filter(r => (r.categoria || '').toString().toLowerCase().trim() === 'film'), 2);
    const serieItems = getRandom(resenas.filter(r => (r.categoria || '').toString().toLowerCase().trim() === 'serie'), 2);

    const col1 = [musicItems[0], filmItems[0], serieItems[0]].filter(Boolean);
    const col2 = [musicItems[1], filmItems[1], serieItems[1]].filter(Boolean);

    const menu2Container = document.querySelector('.menu2');
    if (!menu2Container || (col1.length === 0 && col2.length === 0)) return;

    const renderCol = (list) => list.map(r => `
      <li>
        <a href="${r.link || '#'}" target="_blank">
          <b>${r.tipo}</b> <span class="cat">${(r.categoria || '').toUpperCase()}</span> ${r.titulo}
        </a> 
        <p><img class="efe_img" src="${r.foto}" alt="${r.titulo}"/></p>
      </li>
    `).join('');

    menu2Container.innerHTML = `
      <ul id="efemerides">${renderCol(col1)}</ul>
      <ul id="efemerides">${renderCol(col2)}</ul>
    `;
  } catch (e) {
    console.error('Error cargando reseñas:', e);
  }
}

function openModal(jsonEncodedData) {
  const data = JSON.parse(decodeURIComponent(jsonEncodedData));
  
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

window.onclick = function(event) {
  const modal = document.getElementById('news-modal');
  if (event.target === modal) {
    closeModal();
  }
};

// PWA: Registro del Service Worker e instalación
let deferredPrompt;

document.addEventListener('DOMContentLoaded', () => {
  loadNoticias();
  loadResenas();
  
  // Toggle Menú Móvil
  const navButton = document.querySelector('button[aria-expanded]');
  if (navButton) {
    navButton.addEventListener('click', () => {
      const expanded = navButton.getAttribute('aria-expanded') === 'true';
      navButton.setAttribute('aria-expanded', !expanded);
    });
  }

  // Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registrado con éxito:', reg.scope))
        .catch(err => console.error('Error al registrar SW:', err));
    });
  }

  // Instalación PWA
  const btnInstall = document.getElementById('btn-install');
  if (btnInstall) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    btnInstall.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('El usuario aceptó la instalación');
        }
        deferredPrompt = null;
      } else {
        alert('Para instalar la App en tu dispositivo:\n- En Android/Chrome: Usa los 3 puntos y presiona "Añadir a la pantalla de inicio".\n- En iOS/Safari: Toca Compartir y "Agregar a inicio".');
      }
    });
  }
});
