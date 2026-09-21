const Catalog = (() => {
  const state = { index: null, search: null, pageCache: new Map() };
  async function getIndex() {
    if (!state.index) { const r=await fetch('data/catalog-index.json',{cache:'no-store'}); if(!r.ok) throw new Error('No se pudo cargar el índice'); state.index=await r.json(); }
    return state.index;
  }
  async function getSearchIndex() {
    if (!state.search) { const r=await fetch('data/search-index.json',{cache:'no-store'}); if(!r.ok) throw new Error('No se pudo cargar el buscador'); state.search=await r.json(); }
    return state.search;
  }
  async function getPage(page) {
    const n=Math.max(1,Number(page)||1);
    if(!state.pageCache.has(n)){ const r=await fetch(`data/pages/page-${String(n).padStart(3,'0')}.json`,{cache:'no-store'}); if(!r.ok) throw new Error('No se pudo cargar la página '+n); state.pageCache.set(n,await r.json()); }
    return state.pageCache.get(n);
  }
  async function getProduct(id) {
    const item=(await getSearchIndex()).find(p=>p.id===id);
    if(!item) return null;
    return (await getPage(item.pagina)).productos.find(p=>p.id===id)||null;
  }
  return {getIndex,getSearchIndex,getPage,getProduct};
})();