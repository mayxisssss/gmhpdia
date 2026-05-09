
(function(){
  "use strict";

  const page = document.body.dataset.page || "home";
  const root = document.body.dataset.root || (location.pathname.includes("/pages/") ? "../" : "./");
  let DATA = window.DEFAULT_CMS_DATA || {};

  const esc = (v = "") => String(v).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
  const isUrl = (v = "") => /^(https?:|data:|\/)/.test(String(v));
  const asset = (p = "") => !p ? "" : (isUrl(p) ? p : root + p);
  function isEnabled(value) {
    return value === undefined || value === null || value === "" || value === true || String(value).toLowerCase() === "sim" || String(value).toLowerCase() === "true" || String(value) === "1";
  }

  const href = (p = "") => {
    if(!p) return "#";
    if(/^(https?:|mailto:|tel:|#)/.test(p)) return p;
    if(root === "../") return p.replace(/^pages\//, "");
    return p;
  };

  async function loadData(){
    DATA = window.GAMA_CMS_DATA || window.DEFAULT_CMS_DATA || DATA;
  }

  function deepMerge(target, source){
    if(!source || typeof source !== "object") return target;
    for(const key of Object.keys(source)){
      if(source[key] && typeof source[key] === "object" && !Array.isArray(source[key])){
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else target[key] = source[key];
    }
    return target;
  }

  const navGroups = [
    {label:"Hospital", links:[
      ["Sobre", "pages/sobre.html", "sobre"],
      ["Corpo Clínico", "pages/corpo-clinico.html", "corpo-clinico"]
    ]},
    {label:"Atendimento", links:[
      ["Especialidades", "pages/especialidades.html", "especialidades"],
      ["Exames", "pages/exames.html", "exames"],
      ["Núcleo de Oftalmologia", "pages/nucleo-oftalmologia.html", "nucleo-oftalmologia"]
    ]},
    {label:"Paciente", links:[
      ["Convênios", "pages/convenios.html", "convenios"],
      ["Contato e localização", "pages/contato.html", "contato"]
    ]},
    {label:"Conteúdos", links:[
      ["Notícias", "pages/noticias.html", "noticias"],
      ["Vídeos", "pages/videos.html", "videos"],
      ["Galeria", "pages/galeria.html", "galeria"],
      ["Eventos", "pages/eventos.html", "eventos"]
    ]}
  ];

  function allLinks(){
    return [["Início","index.html","home"], ...navGroups.flatMap(g => g.links)];
  }

  function hFor(p, pg){
    if(pg === "home") return root === "../" ? "../index.html" : "index.html";
    return href(p);
  }

  function enhanceHeader(){ return; }

  function descriptionFor(pg){
    return {
      sobre:"História, missão e valores",
      "corpo-clinico":"Profissionais e especialidades",
      especialidades:"Áreas médicas atendidas",
      exames:"Exames e preparo",
      "nucleo-oftalmologia":"Cuidados com a visão",
      convenios:"Planos atendidos",
      contato:"WhatsApp, mapa e endereço",
      noticias:"Conteúdos e avisos",
      videos:"Vídeos e orientações",
      galeria:"Fotos do hospital",
      eventos:"Campanhas e eventos"
    }[pg] || "";
  }

  function bindDropdowns(){
    document.querySelectorAll(".nav-group-button").forEach(btn => {
      btn.addEventListener("click", () => {
        if(window.innerWidth > 980) return;
        const group = btn.closest(".nav-group");
        group.classList.toggle("is-open");
      });
    });
  }

  function searchIndex(){
    const items = allLinks().map(([label,url,pg]) => ({title:label, text:descriptionFor(pg), url:hFor(url,pg)}));
    (DATA.news || []).filter(n => isEnabled(n.enabled)).forEach(n => items.push({title:n.title, text:n.excerpt || n.content || "Notícia", url:hFor("pages/noticias.html","noticias")}));
    (DATA.specialties || []).forEach(s => items.push({title:s.title, text:s.description || "Especialidade", url:hFor("pages/especialidades.html","especialidades")}));
    (DATA.exams || []).forEach(e => items.push({title:e.title, text:e.description || "Exame", url:hFor("pages/exames.html","exames")}));
    return items;
  }

  function bindMobileSearch(){
    const input = document.querySelector("[data-site-search]");
    const results = document.querySelector("[data-site-search-results]");
    if(!input || !results) return;
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if(!q){ results.innerHTML = ""; return; }
      const found = searchIndex().filter(i => `${i.title} ${i.text}`.toLowerCase().includes(q)).slice(0,8);
      results.innerHTML = found.length
        ? found.map(i => `<a href="${i.url}"><strong>${esc(i.title)}</strong><small>${esc(i.text || "")}</small></a>`).join("")
        : `<p>Nenhum resultado encontrado.</p>`;
    });
  }

  function mediaHTML(item, alt=""){
    if(item.video){
      const src = embedVideo(item.video);
      if(src) return `<div class="dynamic-video"><iframe src="${esc(src)}" title="${esc(alt)}" loading="lazy" allowfullscreen></iframe></div>`;
    }
    if(item.image) return `<img src="${asset(item.image)}" alt="${esc(alt)}">`;
    return `<div class="dynamic-placeholder"><span>${esc((alt || DATA.site?.name || "Gama").slice(0,1))}</span><p>Adicione foto ou vídeo pelo painel</p></div>`;
  }

  function embedVideo(url){
    const u = String(url || "").trim();
    if(!u) return "";
    if(u.includes("youtube.com/watch")){
      try{ const id = new URL(u).searchParams.get("v"); return id ? `https://www.youtube.com/embed/${id}` : ""; }catch(e){}
    }
    if(u.includes("youtu.be/")){
      const id = u.split("youtu.be/")[1]?.split(/[?&]/)[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if(u.includes("youtube.com/embed/") || u.includes("player.vimeo.com")) return u;
    if(/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return u;
    return u;
  }

  function enhanceHome(){
    if(page !== "home") return;
    const main = document.querySelector("[data-page-content]");
    if(!main) return;
    main.querySelectorAll("[data-dynamic-hospital-block]").forEach(el => el.remove());

    const sections = isEnabled(DATA.visibility?.dynamicSections) ? (DATA.dynamicSections || []).filter(s => isEnabled(s.enabled)).map((s, i) => `
      <section class="section dynamic-care-section ${s.layout === "image-left" ? "is-reversed" : ""}">
        <div class="container dynamic-split reveal is-visible">
          <div class="dynamic-copy">
            <span class="kicker">${esc(s.subtitle || "Hospital Dia")}</span>
            <h2>${esc(s.title || "")}</h2>
            <p class="lead">${esc(s.description || "")}</p>
            ${s.highlight ? `<div class="dynamic-highlight">${esc(s.highlight)}</div>` : ""}
            ${s.buttonText ? `<a class="btn btn-primary" href="${href(s.buttonLink)}">${esc(s.buttonText)}</a>` : ""}
          </div>
          <div class="dynamic-media">${mediaHTML(s, s.title)}</div>
        </div>
      </section>`).join("") : "";

    const quickItems = isEnabled(DATA.visibility?.quickHighlights) ? (DATA.quickHighlights || []).filter(h => isEnabled(h.enabled)) : [];
    const highlights = quickItems.length ? `
      <section class="section compact quick-hospital">
        <div class="container quick-hospital-grid reveal is-visible">
          ${quickItems.map(h => `<a class="quick-hospital-card" href="${href(h.link)}">
            <div class="card-icon">${h.image ? `<img src="${asset(h.image)}" alt="${esc(h.title)}">` : esc(h.icon || "+")}</div>
            <strong>${esc(h.title)}</strong><p>${esc(h.text || "")}</p>
          </a>`).join("")}
        </div>
      </section>` : "";

    const news = isEnabled(DATA.visibility?.newsPreview) ? (DATA.news || []).filter(n => isEnabled(n.enabled)).slice(0,3) : [];
    const newsHTML = news.length ? `
      <section class="section hospital-news-preview">
        <div class="container">
          <div class="section-head-row reveal is-visible">
            <div><span class="kicker">Notícias e orientações</span><h2>Informação para pacientes e visitantes</h2></div>
            <a class="btn btn-outline" href="${href("pages/noticias.html")}">Ver todos</a>
          </div>
          <div class="news-grid reveal is-visible">
            ${news.map(cardNews).join("")}
          </div>
        </div>
      </section>` : "";

    const videos = isEnabled(DATA.visibility?.videosPreview) ? (DATA.videos || []).filter(v => isEnabled(v.enabled)).slice(0,2) : [];
    const videosHTML = videos.length ? `
      <section class="section hospital-video-preview">
        <div class="container">
          <div class="section-head-row reveal is-visible">
            <div><span class="kicker">Vídeos</span><h2>Conteúdos em vídeo</h2></div>
            <a class="btn btn-outline" href="${href("pages/videos.html")}">Ver vídeos</a>
          </div>
          <div class="video-grid reveal is-visible">
            ${videos.map(videoCard).join("")}
          </div>
        </div>
      </section>` : "";

    const content = highlights + sections + newsHTML + videosHTML;
    if (content.trim()) {
      const html = `<div data-dynamic-hospital-block>${content}</div>`;
      main.insertAdjacentHTML("beforeend", html);
    }
  }

  function cardNews(n){
    return `<article class="news-card">
      <div class="news-media">${mediaHTML(n, n.title)}</div>
      <div class="news-body">
        <span>${esc(n.category || "Notícia")} · ${esc(n.date || "")}</span>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.excerpt || n.content || "")}</p>
        <a class="card-link" href="${href(n.buttonLink || "pages/noticias.html")}">${esc(n.buttonText || "Saiba mais")}</a>
      </div>
    </article>`;
  }

  function videoCard(v){
    return `<article class="video-card">
      <div class="video-media">${mediaHTML(v, v.title)}</div>
      <div class="video-body">
        <span>${esc(v.category || "Vídeo")}</span>
        <h3>${esc(v.title)}</h3>
        <p>${esc(v.description || "")}</p>
        ${v.buttonText ? `<a class="card-link" href="${href(v.buttonLink)}">${esc(v.buttonText)}</a>` : ""}
      </div>
    </article>`;
  }

  function renderNoticias(){
    if(page !== "noticias") return;
    const mount = document.querySelector("[data-page-content]");
    if(!mount) return;
    const items = isEnabled(DATA.visibility?.newsPage) ? (DATA.news || []).filter(n => isEnabled(n.enabled)) : [];
    mount.innerHTML = `
      <section class="page-hero"><div class="container page-hero-content reveal is-visible"><div class="breadcrumb"><a href="${root === "../" ? "../index.html" : "index.html"}">Início</a><span>/</span><span>Notícias</span></div><span class="kicker">Conteúdos</span><h1>Notícias, avisos e orientações</h1><p class="lead">Área dinâmica para publicar novidades, campanhas, orientações de saúde e comunicados do hospital.</p></div></section>
      <section class="section"><div class="container news-grid">${items.map(cardNews).join("") || "<p>Nenhuma notícia cadastrada no momento.</p>"}</div></section>`;
  }

  function renderVideos(){
    if(page !== "videos") return;
    const mount = document.querySelector("[data-page-content]");
    if(!mount) return;
    const items = isEnabled(DATA.visibility?.videosPage) ? (DATA.videos || []).filter(v => isEnabled(v.enabled)) : [];
    mount.innerHTML = `
      <section class="page-hero"><div class="container page-hero-content reveal is-visible"><div class="breadcrumb"><a href="${root === "../" ? "../index.html" : "index.html"}">Início</a><span>/</span><span>Vídeos</span></div><span class="kicker">Mídia</span><h1>Vídeos e orientações</h1><p class="lead">Publique vídeos institucionais, campanhas, orientações para exames e conteúdos educativos.</p></div></section>
      <section class="section"><div class="container video-grid">${items.map(videoCard).join("") || "<p>Nenhum vídeo cadastrado no momento.</p>"}</div></section>`;
  }

  async function runDynamicEnhancements(){
    await loadData();
    enhanceHome();
    renderNoticias();
    renderVideos();
  }

  window.addEventListener('gama:rendered', (event) => {
    DATA = event.detail?.data || window.GAMA_CMS_DATA || DATA;
    runDynamicEnhancements();
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("[data-site-header] .site-header")) {
      runDynamicEnhancements();
    }
  });
})();
