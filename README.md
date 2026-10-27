# Obra Econômica

Aplicação responsiva em Next.js para organizar insumos de construção, calcular custos e comparar ofertas.

## Funcionalidades
- Cadastro de materiais com categoria, unidade, quantidade e preço unitário.
- Cálculo automático de subtotais e total dos itens precificados.
- Lista guardada localmente no navegador.
- Pesquisa de anúncios em links diretos no Mercado Livre e na Shopee.
- Botão **Comparar preços** para consultar a API de backend quando a aplicação estiver hospedada com servidor e credenciais configuradas.
- Exportação CSV compatível com Excel.
- Interface adaptada para computador e celular.

## Rodar localmente
1. Instale Node.js 20 ou superior.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local` e preencha apenas credenciais próprias.
4. Execute `npm run dev`.
5. Abra o endereço local mostrado no terminal.

## Publicação
- O workflow `.github/workflows/deploy.yml` publica uma versão estática em GitHub Pages. Ela serve para testar a interface, mas não executa APIs de servidor.
- Para pesquisa automática, importe este repositório na Vercel. O `next.config.ts` detecta a configuração de produção normal e mantém as rotas API ativas.
- Configure as variáveis do projeto na Vercel em **Settings → Environment Variables** e faça um novo deploy.
- A página do GitHub Pages continua como demonstração estática; para a busca automática, use o endereço da aplicação implantada na Vercel.

## Variáveis de ambiente do backend
- `MERCADOLIVRE_ACCESS_TOKEN`: token válido para chamar a API do Mercado Livre. A rota também tenta a consulta pública sem token, mas o acesso depende das políticas e permissões vigentes da API.
- `SHOPEE_APP_ID` e `SHOPEE_APP_SECRET`: credenciais da Open API de afiliados da Shopee. A conta precisa ter acesso liberado à API.

Não salve segredos no código, nem envie o arquivo `.env.local` para o GitHub. A rota nunca retorna as credenciais ao navegador.

## Como a comparação funciona
A rota `GET /api/search?q=...` consulta as fontes disponíveis, padroniza nome, preço e link e retorna o estado de cada marketplace. Os resultados da Shopee usam o catálogo disponibilizado pela API de afiliados; isso pode não incluir todo o catálogo público. A disponibilidade do Mercado Livre depende das regras atuais da API.

Os preços variam por anúncio, região, embalagem, disponibilidade e frete. Compare especificações equivalentes e confirme o custo final na loja antes de comprar. O app não fabrica cotações.

## Limitações e próxima fase
- A pesquisa automática só funciona depois do deploy com backend e das credenciais exigidas pelas fontes.
- O preço mínimo exibido é o informado pela fonte; ainda é necessário validar unidade/embalagem e frete para decidir a opção realmente mais econômica.
- Para uso público, adicione rate limiting persistente, monitoramento de quota e uma política de cache antes de divulgar amplamente.
- Depois, implementar importação de Excel/CSV e salvamento de várias obras em conta de usuário.
