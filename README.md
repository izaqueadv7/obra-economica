# Obra Econômica

Aplicação responsiva em Next.js para organizar insumos de construção, estimar custos e pesquisar anúncios no Mercado Livre e Shopee.

## O que já funciona
- Cadastro de materiais com categoria, unidade e quantidade.
- Informar e editar o preço unitário.
- Cálculo automático dos subtotais e total dos itens precificados.
- Busca de anúncios no Mercado Livre e na Shopee por material.
- Salvamento da lista no armazenamento local do navegador.
- Lista de exemplo para testar a interface.
- Exportação CSV compatível com Excel.
- Layout para computador e celular.

## Executar localmente
1. Instale Node.js 20 ou superior.
2. Execute `npm install`.
3. Execute `npm run dev`.
4. Abra o endereço informado no terminal.

## Publicação pelo GitHub Pages
O workflow em `.github/workflows/deploy.yml` compila o Next.js como site estático e publica a pasta `out` quando houver push na branch `main`. Em **Settings → Pages**, selecione **GitHub Actions** como fonte, caso ainda não esteja ativada. O site ficará disponível em:

https://izaqueadv7.github.io/obra-economica/

## Importante sobre os preços
A versão inicial **não consulta preços automaticamente**. Os botões abrem buscas nos marketplaces, e é necessário conferir o valor no anúncio, a especificação, o vendedor, a embalagem, o prazo e o frete. A lista não inventa ou apresenta valores demonstrativos como cotações reais.

## Próxima fase
- Avaliar e integrar as APIs oficiais disponíveis.
- Confirmar a permissão necessária para consulta de produtos no Mercado Livre e Shopee.
- Implementar um backend para pesquisas automáticas, sem expor chaves no navegador.
- Normalizar peso, dimensão, embalagem, preço e frete.
- Indicar a fonte e a data/hora de cada preço recebido.
- Importar lista de insumos em Excel/CSV.

Nunca inclua chaves ou tokens de API em arquivos frontend públicos. Segredos devem ser mantidos em variáveis de ambiente do servidor.
