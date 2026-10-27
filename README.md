# Obra Econômica

Aplicação inicial para organizar insumos de construção e pesquisar ofertas em marketplaces.

## Funcionalidades atuais
- Cadastro de materiais, categorias, unidades, quantidades e preços.
- Cálculo automático de subtotais e total dos itens com preço informado.
- Links de pesquisa no Mercado Livre e Shopee para cada insumo.
- Sugestões de materiais comuns.
- Exportação CSV compatível com Excel.
- Layout responsivo.

## Executar
Abra `index.html` no navegador. Não é necessária instalação nesta versão estática.

## Limitações importantes
Este commit **não busca nem extrai preços automaticamente** e não calcula frete. Os links abrem pesquisas dos marketplaces; confira anúncio, vendedor, especificações, embalagem, estoque e frete. Nenhum preço de demonstração é tratado como cotação real.

## Próximas etapas
1. Migrar a interface para Next.js e separar os componentes.
2. Implementar API de servidor para pesquisar anúncios usando integrações oficiais e autorizadas.
3. Confirmar permissões e escopos disponíveis para Mercado Livre e Shopee.
4. Normalizar especificações, embalagens, preço e custo de entrega.
5. Incluir data/hora da consulta, origem dos dados e avisos de disponibilidade.
6. Criar importação de planilhas XLSX/CSV.

Não coloque tokens ou chaves de API no HTML público. Credenciais devem ficar somente em variáveis de ambiente no servidor.
