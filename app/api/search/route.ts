import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  marketplace: string;
  title: string;
  price: number | null;
  url: string;
  imageUrl?: string | null;
  seller?: string | null;
  freeShipping?: boolean | null;
};

type SourceResult = {
  marketplace: string;
  status: "ok" | "empty" | "not_configured" | "needs_auth" | "error";
  message: string;
  count: number;
  offers: Offer[];
};

function money(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^\d,.-]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function searchMercadoLivre(query: string): Promise<SourceResult> {
  const token = process.env.MERCADOLIVRE_ACCESS_TOKEN;
  const url = new URL("https://api.mercadolibre.com/sites/MLB/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = "Bearer " + token;

  try {
    const response = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();

    if (!response.ok) {
      const needsAuth = response.status === 401 || response.status === 403;
      return {
        marketplace: "Mercado Livre",
        status: needsAuth ? "needs_auth" : "error",
        message: needsAuth
          ? "A API recusou a consulta. Configure um Access Token válido no backend e confira as permissões do aplicativo."
          : "A API respondeu com erro HTTP " + response.status + ". Tente novamente mais tarde.",
        count: 0,
        offers: [],
      };
    }

    const rows = Array.isArray(body.results) ? body.results : [];
    const offers: Offer[] = rows.map((item: Record<string, any>) => ({
      id: String(item.id ?? item.permalink ?? Math.random()),
      marketplace: "Mercado Livre",
      title: String(item.title ?? "Produto sem título"),
      price: money(item.price),
      url: String(item.permalink ?? ""),
      imageUrl: typeof item.thumbnail === "string" ? item.thumbnail : null,
      seller: typeof item.seller?.nickname === "string" ? item.seller.nickname : null,
      freeShipping: typeof item.shipping?.free_shipping === "boolean" ? item.shipping.free_shipping : null,
    })).filter((item: Offer) => item.url.startsWith("https://") && item.title);

    return {
      marketplace: "Mercado Livre",
      status: offers.length ? "ok" : "empty",
      message: offers.length
        ? offers.length + " anúncios retornados pela API. Confira detalhes e frete na loja."
        : "A consulta foi aceita, mas nenhum anúncio foi retornado para este termo.",
      count: offers.length,
      offers,
    };
  } catch {
    return {
      marketplace: "Mercado Livre",
      status: "error",
      message: "Não foi possível acessar a API do Mercado Livre agora. Verifique a conexão ou tente novamente.",
      count: 0,
      offers: [],
    };
  }
}

async function searchShopee(query: string): Promise<SourceResult> {
  const appId = process.env.SHOPEE_APP_ID;
  const secret = process.env.SHOPEE_APP_SECRET;

  if (!appId || !secret) {
    return {
      marketplace: "Shopee",
      status: "not_configured",
      message: "Integração aguardando App ID e Secret da API oficial de afiliados Shopee nas variáveis de ambiente do backend.",
      count: 0,
      offers: [],
    };
  }

  const graphQuery =
    "query SearchProductOffers { productOfferV2(keyword: " +
    JSON.stringify(query) +
    ", listType: 0, sortType: 4, page: 1, limit: 20) { nodes { itemId productName productLink offerLink imageUrl priceMin priceMax priceDiscountRate sales ratingStar shopId shopName } pageInfo { page limit hasNextPage } } }";
  const payload = JSON.stringify({ query: graphQuery });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHash("sha256")
    .update(appId + timestamp + payload + secret)
    .digest("hex");

  try {
    const response = await fetch("https://open-api.affiliate.shopee.com.br/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "SHA256 Credential=" + appId + ", Timestamp=" + timestamp + ", Signature=" + signature,
      },
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const body = await response.json();

    if (!response.ok || (Array.isArray(body.errors) && body.errors.length > 0)) {
      const detail = Array.isArray(body.errors) && body.errors[0]?.message
        ? String(body.errors[0].message)
        : "HTTP " + response.status;
      const needsAuth = response.status === 401 || response.status === 403;
      return {
        marketplace: "Shopee",
        status: needsAuth ? "needs_auth" : "error",
        message: "A API de afiliados da Shopee não aceitou a consulta: " + detail,
        count: 0,
        offers: [],
      };
    }

    const nodes = body?.data?.productOfferV2?.nodes;
    const rows = Array.isArray(nodes) ? nodes : [];
    const offers: Offer[] = rows.map((item: Record<string, any>) => ({
      id: String(item.itemId ?? item.offerLink ?? item.productLink ?? Math.random()),
      marketplace: "Shopee",
      title: String(item.productName ?? "Produto sem título"),
      price: money(item.priceMin),
      url: String(item.offerLink || item.productLink || ""),
      imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
      seller: typeof item.shopName === "string" ? item.shopName : null,
      freeShipping: null,
    })).filter((item: Offer) => item.url.startsWith("https://") && item.title);

    return {
      marketplace: "Shopee",
      status: offers.length ? "ok" : "empty",
      message: offers.length
        ? offers.length + " ofertas retornadas pela API de afiliados. O catálogo depende das permissões da conta."
        : "A consulta não retornou ofertas para este termo. A API de afiliados não representa necessariamente todo o catálogo público.",
      count: offers.length,
      offers,
    };
  } catch {
    return {
      marketplace: "Shopee",
      status: "error",
      message: "Não foi possível acessar a API de afiliados da Shopee. Confira a liberação da API e tente novamente.",
      count: 0,
      offers: [],
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, 120);

  if (query.length < 2) {
    return Response.json({ error: "Informe um termo de pesquisa com pelo menos 2 caracteres." }, { status: 400 });
  }

  const [mercadoLivre, shopee] = await Promise.all([
    searchMercadoLivre(query),
    searchShopee(query),
  ]);

  const sources = [mercadoLivre, shopee].map(({ marketplace, status, message, count }) => ({
    marketplace, status, message, count,
  }));
  const offers = [...mercadoLivre.offers, ...shopee.offers]
    .sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));

  return Response.json(
    { query, offers, sources, count: offers.length, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
