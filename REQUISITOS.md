# Requisitos da Loja Aurora

Este documento é a referência para os testes. Os valores monetários estão em reais. O subtotal considera somente os produtos, antes do frete e antes de qualquer desconto.

## Funcionalidades

- RF-01. Uma pessoa pode se cadastrar com nome, e-mail e senha.
- RF-02. Uma pessoa cadastrada pode entrar e sair da conta.
- RF-03. O catálogo lista nome, descrição, categoria, preço e estoque dos produtos.
- RF-04. A busca restringe o catálogo pelo texto informado e a categoria pode ser filtrada.
- RF-05. O carrinho permite incluir itens, alterar quantidades e remover itens.
- RF-06. O sistema controla o estoque de cada produto.
- RF-07. O cliente pode informar um cupom no fechamento da compra.
- RF-08. O pedido contém endereço com rua, número, bairro, cidade, UF e CEP.
- RF-09. O cliente autenticado pode finalizar a compra.
- RF-10. O cliente consulta o histórico e o detalhe dos próprios pedidos.
- RF-11. A área administrativa permite incluir produtos e alterar nome, preço e estoque.

## Regras de negócio

- RN-01. Compras com subtotal de produtos a partir de R$ 200,00 recebem 10% de desconto automático.
- RN-02. Frete grátis para subtotal de produtos a partir de R$ 300,00, calculado antes dos descontos. Abaixo desse valor, o frete é R$ 18,50.
- RN-03. A quantidade de cada item deve ser inteira, positiva e no máximo igual ao estoque disponível.
- RN-04. Cupom vencido deve ser rejeitado. A data de validade vale até o fim do dia informado. Cupom inexistente ou inativo também deve ser rejeitado.
- RN-05. O cupom não se acumula com o desconto automático. A compra recebe apenas o benefício de maior valor. Cupom percentual incide sobre o subtotal dos produtos. Cupom de valor fixo é limitado ao subtotal.
- RN-06. Subtotal, desconto, frete e total devem ter precisão de centavos. O arredondamento é half-up: a partir de meio centavo, o centavo sobe.
- RN-07. O pedido preserva os preços da compra, mesmo que o catálogo seja alterado depois.
- RN-08. A finalização atualiza o estoque e grava o pedido. O pedido continua disponível depois de recarregar a página e de reiniciar o servidor.
- RN-09. Uma confirmação repetida da mesma compra, feita em sequência imediata, não pode gerar dois pedidos.
- RN-10. Cada cliente acessa somente os próprios pedidos, tanto na listagem quanto na consulta por identificador.
- RN-11. Apenas administradores podem incluir ou alterar produtos e estoque.
- RN-12. Preços, descontos e permissões são validados no servidor. O preço enviado pelo navegador não substitui o preço do catálogo.
- RN-13. O endereço de entrega completo é obrigatório para concluir a compra.

## Qualidade de uso

- RNF-01. Cada campo de formulário tem um rótulo associado ao respectivo controle.
- RNF-02. As ações principais, inclusive adicionar ao carrinho e aplicar cupom, podem ser acionadas pelo teclado.
- RNF-03. O foco do teclado é claramente visível.
- RNF-04. A mensagem de erro do cadastro indica qual campo está inválido.
- RNF-05. O carrinho vazio explica a situação e oferece um caminho de volta ao catálogo.

## Desempenho

- RNF-06. A busca não percorre nem reconstrói o catálogo inteiro a cada tecla.
- RNF-07. Atualizar a tela não acumula novos tratadores para o mesmo evento de clique.
- RNF-08. O histórico permanece utilizável quando há muitos pedidos.
- RNF-09. A interface não repete chamadas idênticas e desnecessárias à API.

## Dados de apoio

Contas, cupons, produtos e pedidos iniciais estão descritos no README. O comando `npm run restore` devolve a base a esse estado.
