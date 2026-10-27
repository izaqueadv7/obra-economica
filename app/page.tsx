"use client";

import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";

type Material = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number | null;
};

type MarketOffer = {
  id: string;
  marketplace: string;
  title: string;
  price: number | null;
  url: string;
  imageUrl?: string | null;
  seller?: string | null;
  freeShipping?: boolean | null;
};

type MarketSource = {
  marketplace: string;
  status: "ok" | "empty" | "not_configured" | "needs_auth" | "error";
  message: string;
  count: number;
};

type SearchState = {
  loading: boolean;
  offers: MarketOffer[];
  sources: MarketSource[];
  error?: string;
};

const categories = [
  "Todos os materiais", "Cimento e argamassa", "Alvenaria", "Aço e estrutura",
  "Areia, brita e agregados", "Instalações elétricas", "Instalações hidráulicas",
  "Pisos e revestimentos", "Pintura e acabamento", "Cobertura", "Ferramentas", "Outros",
];
const units = ["un.", "saco", "kg", "t", "m", "m²", "m³", "barra", "rolo", "caixa", "lata", "l"];
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const marketUrl = (market: "ml" | "sh", name: string) => market === "ml"
  ? "https://lista.mercadolivre.com.br/" + encodeURIComponent(name).replace(/%20/g, "-")
  : "https://shopee.com.br/search?keyword=" + encodeURIComponent(name);

export default function Home() {
  const [items, setItems] = useState<Material[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("un.");
  const [price, setPrice] = useState("");
  const [toast, setToast] = useState("");
  const [searches, setSearches] = useState<Record<number, SearchState>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("obra-economica-materials");
      if (stored) setItems(JSON.parse(stored) as Material[]);
    } catch {
      localStorage.removeItem("obra-economica-materials");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("obra-economica-materials", JSON.stringify(items));
  }, [items, hydrated]);

  const pricedItems = useMemo(() => items.filter((item) => item.price !== null), [items]);
  const total = useMemo(() => pricedItems.reduce((sum, item) => sum + item.quantity * (item.price ?? 0), 0), [pricedItems]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  function addMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qty = Number(quantity);
    const priceValue = price.trim() === "" ? null : Number(price);
    if (!name.trim()) return;
    if (!Number.isFinite(qty) || qty <= 0) {
      notify("Informe uma quantidade maior que zero.");
      return;
    }
    if (priceValue !== null && (!Number.isFinite(priceValue) || priceValue < 0)) {
      notify("Confira o preço informado.");
      return;
    }
    setItems((current) => [...current, {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: name.trim(), category, quantity: qty, unit, price: priceValue,
    }]);
    setName("");
    setQuantity("1");
    setPrice("");
    notify("Material adicionado à lista.");
  }

  function updateItem(id: number, update: Partial<Material>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  }

  function removeItem(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
    notify("Material removido.");
  }

  function loadExample() {
    const example: Material[] = [
      { id: Date.now() + 1, name: "Cimento CP II 50 kg", category: "Cimento e argamassa", quantity: 20, unit: "saco", price: null },
      { id: Date.now() + 2, name: "Tijolo cerâmico 8 furos", category: "Alvenaria", quantity: 1500, unit: "un.", price: null },
      { id: Date.now() + 3, name: "Areia média", category: "Areia, brita e agregados", quantity: 3, unit: "m³", price: null },
      { id: Date.now() + 4, name: "Aço CA-50 10 mm (12 m)", category: "Aço e estrutura", quantity: 12, unit: "barra", price: null },
    ];
    setItems((current) => current.length ? [...current, ...example] : example);
    notify("Materiais de exemplo adicionados. Eles não incluem preços.");
  }

  function exportCsv() {
    if (!items.length) {
      notify("Adicione pelo menos um material para exportar.");
      return;
    }
    const rows = [
      ["Material", "Categoria", "Quantidade", "Unidade", "Preço unitário (R$)", "Subtotal (R$)", "Pesquisa Mercado Livre", "Pesquisa Shopee"],
      ...items.map((item) => [
        item.name, item.category, String(item.quantity), item.unit,
        item.price === null ? "" : String(item.price),
        item.price === null ? "" : (item.quantity * item.price).toFixed(2),
        marketUrl("ml", item.name), marketUrl("sh", item.name),
      ]),
    ];
    const csv = "\ufeff" + rows.map((row) => row.map((cell) => '"' + cell.replace(/"/g, '""') + '"').join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "orcamento-obra-economica.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    notify("CSV exportado. Abra-o no Excel.");
  }

  async function compareOffers(item: Material) {
    if (typeof window !== "undefined" && window.location.hostname.endsWith("github.io")) {
      setSearches((current) => ({ ...current, [item.id]: { loading: false, offers: [], sources: [], error: "A versão do GitHub Pages é estática e não tem backend para consultar APIs. Abra a versão hospedada no Vercel para pesquisa automática; os links diretos abaixo continuam funcionando." } }));
      return;
    }
    setSearches((current) => ({ ...current, [item.id]: { loading: true, offers: [], sources: [] } }));
    try {
      const response = await fetch("/api/search?q=" + encodeURIComponent(item.name), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível consultar as fontes de preços.");
      setSearches((current) => ({ ...current, [item.id]: { loading: false, offers: data.offers || [], sources: data.sources || [] } }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha inesperada ao consultar os marketplaces.";
      setSearches((current) => ({ ...current, [item.id]: { loading: false, offers: [], sources: [], error: message } }));
    }
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#" aria-label="Obra Econômica início">
          <span className="logo">⌂</span>
          <span>Obra Econômica<small>ORÇAMENTO INTELIGENTE</small></span>
        </a>
        <div className="topActions"><span className="statusPill">● Versão inicial</span><button className="button outline" onClick={() => { if (!items.length || window.confirm("Deseja apagar todos os materiais desta lista?")) { setItems([]); notify("Lista limpa."); } }}>Nova lista</button></div>
      </header>

      <main className="page">
        <section className="hero">
          <div>
            <div className="eyebrow">SUA OBRA, GASTANDO MELHOR</div>
            <h1>Compare materiais.<br />Planeje cada real.</h1>
            <p>Monte sua lista de insumos, calcule o custo da obra e pesquise ofertas no Mercado Livre e na Shopee sem perder o controle do orçamento.</p>
            <button className="button lightButton" onClick={() => document.getElementById("material-name")?.focus()}>+ Adicionar primeiro material</button>
          </div>
          <div className="heroTotal">
            <div className="eyebrow">CUSTO DOS ITENS COM PREÇO</div>
            <div className="heroAmount">{brl(total)}</div>
            <p>O total considera os preços que você preencher na lista. Confira os anúncios antes de comprar.</p>
          </div>
        </section>

        <div className="workspace">
          <aside className="panel formPanel">
            <h2>Adicionar material</h2>
            <p className="subheading">Cadastre um insumo ou use as sugestões rápidas.</p>
            <form onSubmit={addMaterial}>
              <div className="field">
                <label htmlFor="material-name">Nome do material *</label>
                <input id="material-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={180} placeholder="Ex.: Cimento CP II 50 kg" />
              </div>
              <div className="field">
                <label htmlFor="category">Categoria</label>
                <select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((option) => <option key={option}>{option}</option>)}</select>
              </div>
              <div className="fieldGrid">
                <div className="field">
                  <label htmlFor="quantity">Quantidade</label>
                  <input id="quantity" type="number" min="0.01" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor="unit">Unidade</label>
                  <select id="unit" value={unit} onChange={(event) => setUnit(event.target.value)}>{units.map((option) => <option key={option}>{option}</option>)}</select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="price">Preço unitário conhecido (R$)</label>
                <input id="price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Opcional" />
              </div>
              <button className="button primary full" type="submit">Adicionar à lista</button>
            </form>
            <p className="helper">Dica: informe peso, dimensões, marca ou especificação técnica para comparar produtos equivalentes.</p>
            <div className="quickItems">
              <button onClick={() => { setName("Cimento CP II 50 kg"); setCategory("Cimento e argamassa"); setUnit("saco"); }}>+ Cimento</button>
              <button onClick={() => { setName("Tijolo cerâmico 8 furos"); setCategory("Alvenaria"); setUnit("un."); }}>+ Tijolo</button>
              <button onClick={() => { setName("Areia média"); setCategory("Areia, brita e agregados"); setUnit("m³"); }}>+ Areia</button>
              <button onClick={() => { setName("Aço CA-50 10 mm (12 m)"); setCategory("Aço e estrutura"); setUnit("barra"); }}>+ Aço</button>
              <button onClick={() => { setName("Tubo PVC soldável 25 mm"); setCategory("Instalações hidráulicas"); setUnit("un."); }}>+ Tubo PVC</button>
            </div>
          </aside>

          <section className="results">
            <div className="metrics">
              <div className="metric"><div className="metricLabel">ITENS NA LISTA</div><div className="metricValue">{items.length}</div><div className="metricNote">Materiais cadastrados</div></div>
              <div className="metric"><div className="metricLabel">ITENS PRECIFICADOS</div><div className="metricValue">{pricedItems.length}</div><div className="metricNote">Com preço informado</div></div>
              <div className="metric"><div className="metricLabel">VALOR ESTIMADO</div><div className="metricValue">{brl(total)}</div><div className="metricNote">Frete não incluído</div></div>
            </div>

            <div className="toolbar"><h2>Sua lista de materiais</h2><div className="toolbarActions"><button className="button outline smallButton" onClick={exportCsv}>Exportar CSV</button><button className="button outline smallButton" onClick={loadExample}>Carregar exemplo</button></div></div>
            <div className="tableShell">
              {items.length === 0 ? (
                <div className="emptyState"><div className="emptyIcon">▧</div><h3>Sua lista começa aqui</h3><p>Adicione materiais para organizar quantidades, estimar custos e pesquisar anúncios nos marketplaces.</p><button className="button primary" onClick={() => document.getElementById("material-name")?.focus()}>Adicionar material</button></div>
              ) : (
                <div className="tableScroll"><table><thead><tr><th>Material / categoria</th><th>Qtd.</th><th>Preço unit.</th><th>Total</th><th>Pesquisar oferta</th><th aria-label="Ações" /></tr></thead>
                <tbody>{items.map((item) => <Fragment key={item.id}><tr>
                  <td><div className="productName">{item.name}</div><div className="itemMeta"><span className="categoryTag">{item.category}</span></div></td>
                  <td><div className="quantityCell"><input className="quantityInput" aria-label={"Quantidade de " + item.name} type="number" min="0.01" step="any" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Math.max(0.01, Number(event.target.value) || 0.01) })} /><span>{item.unit}</span></div></td>
                  <td><input className="priceInput" aria-label={"Preço unitário de " + item.name} type="number" min="0" step="0.01" placeholder="R$ —" value={item.price === null ? "" : item.price} onChange={(event) => updateItem(item.id, { price: event.target.value === "" ? null : Math.max(0, Number(event.target.value) || 0) })} /></td>
                  <td className="subtotal">{item.price === null ? "—" : brl(item.quantity * item.price)}</td>
                  <td><div className="marketLinks"><button className="marketSearchButton" disabled={searches[item.id]?.loading} onClick={() => compareOffers(item)}>{searches[item.id]?.loading ? "Pesquisando…" : "Comparar preços"}</button><a className="marketButton ml" href={marketUrl("ml", item.name)} target="_blank" rel="noreferrer">ML ↗</a><a className="marketButton sh" href={marketUrl("sh", item.name)} target="_blank" rel="noreferrer">Shopee ↗</a></div></td>
                  <td><button className="removeButton" aria-label={"Remover " + item.name} onClick={() => removeItem(item.id)}>×</button></td>
                </tr>{searches[item.id] && <tr><td colSpan={6}><div className="offersPanel">{searches[item.id].loading ? <p>Consultando as fontes configuradas…</p> : searches[item.id].error ? <p className="offerMessage">{searches[item.id].error}</p> : <><div className="offersHeading">Resultados para “{item.name}” <span>Confira especificação, embalagem, vendedor e frete antes de comparar.</span></div>{searches[item.id].sources.map((source) => <p key={source.marketplace} className={"sourceStatus source-" + source.status}><strong>{source.marketplace}:</strong> {source.message}</p>)}{searches[item.id].offers.length ? <div className="offerGrid">{searches[item.id].offers.map((offer) => <article className="offerCard" key={offer.marketplace + "-" + offer.id}><div className="offerMarket">{offer.marketplace}</div><div className="offerTitle">{offer.title}</div><div className="offerPrice">{offer.price === null ? "Preço não informado" : brl(offer.price)}</div>{offer.seller && <div className="offerSeller">Vendedor: {offer.seller}</div>}{offer.freeShipping === true && <div className="freeShipping">Frete grátis indicado</div>}<a href={offer.url} target="_blank" rel="noreferrer" className="offerLink">Ver anúncio ↗</a></article>)}</div> : <p className="offerMessage">Nenhuma oferta foi devolvida pelas fontes disponíveis para esta consulta.</p>}</>}</div></td></tr>} </Fragment>)}</tbody></table></div>
              )}
            </div>
            <div className="totalBar"><div><span>TOTAL DOS MATERIAIS COM PREÇO INFORMADO</span><p>Preencha os preços encontrados para calcular o orçamento.</p></div><strong>{brl(total)}</strong></div>
            <p className="disclaimer"><strong>Transparência:</strong> esta versão abre pesquisas nos marketplaces; ainda não consulta preços automaticamente. Confira preço, vendedor, embalagem, prazo e frete no anúncio antes de comprar. Nenhum preço fictício é mostrado como cotação real.</p>
          </section>
        </div>
      </main>
      <footer><span>Obra Econômica · Projeto inicial</span><span>Compare especificações, vendedores, prazo e frete.</span></footer>
      <div className={"toast" + (toast ? " toastVisible" : "")} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
