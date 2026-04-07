# QA Mobile em Producao

## Objetivo
Validar a experiencia real no celular da versao publicada do Pastor Rhema PLUS, priorizando fluxo principal, leitura, navegacao, formularios e estados de erro.

## Ambiente recomendado
- Testar em 1 iPhone e 1 Android, se possivel
- Navegador principal do aparelho
- Uma rodada em aba anonima
- Rede normal 4G/5G ou Wi-Fi domestico

## Prioridade P0
Se qualquer item abaixo falhar, vale corrigir antes de seguir para novos refinamentos.

### 1. Login e sessao
- Abrir `/login`
- Verificar se o layout entra corretamente na largura da tela
- Confirmar que nao existe corte lateral nem scroll horizontal
- Tocar nos campos e verificar se o teclado nao cobre o botao principal
- Fazer login
- Confirmar redirecionamento correto para `dashboard`

Criterio de aceite:
- Sem quebra visual
- Sem elementos fora da tela
- Sem travamento ao abrir teclado

### 2. Navegacao global
- Abrir o menu mobile em pelo menos 4 telas
- Navegar entre `dashboard`, `series`, `study`, `chat`, `support`
- Fechar e reabrir o menu algumas vezes
- Confirmar se o fundo escurecido funciona e se o drawer abre/fecha sem falhas

Criterio de aceite:
- Menu abre sempre
- Menu fecha ao tocar fora
- Nenhuma tela fica “presa” com overlay

### 3. Dashboard
- Verificar hero principal
- Testar CTA principal
- Testar botao `My Sermons`
- Confirmar que os cards inferiores aparecem em coluna no celular

Criterio de aceite:
- Titulos legiveis
- Botoes com toque confortavel
- Sem colisao entre cards e textos

### 4. Fluxo principal do produto
- `series`
- `study`
- `builder`
- `illustrations`
- `application`
- `final`

Em cada tela:
- Confirmar leitura confortavel
- Confirmar que cards longos nao ficam espremidos
- Verificar se os botoes principais ocupam bem a largura no mobile
- Verificar se o conteudo gerado e facil de escanear

Criterio de aceite:
- Sem scroll horizontal
- Sem texto cortado
- CTA final sempre visivel apos scroll natural

## Prioridade P1

### 5. Chat
- Abrir chat
- Verificar estado inicial
- Enviar mensagem curta
- Enviar mensagem mais longa
- Abrir teclado e confirmar se o input continua utilizavel
- Testar botao `nova conversa`

Criterio de aceite:
- Conversa continua legivel
- Baloes com largura boa
- Input nao fica escondido

### 6. Suporte
- Abrir lista de tickets
- Abrir ticket existente
- Criar novo ticket
- Escrever resposta com teclado aberto

Criterio de aceite:
- Lista e thread ficam legiveis
- Campo de resposta continua acessivel
- Nenhum botao fica pequeno demais

### 7. Sermons
- Abrir lista de series
- Expandir e recolher uma serie
- Abrir um item ativo

Criterio de aceite:
- Cabecalhos nao colidem
- Badges e progresso continuam legiveis
- Item ativo e facil de identificar

## Prioridade P2

### 8. Idioma e detalhes de UI
- Alternar idioma pelo menu
- Verificar se labels grandes nao quebram o layout
- Confirmar se nao existem espacos estranhos entre secoes

### 9. Estados de erro e vazio
- Validar mensagens de erro em login
- Validar estado vazio de suporte
- Validar telas sem conteudo gerado

## O que anotar durante o teste
Para cada problema encontrado, registrar:
- tela
- aparelho
- navegador
- o que aconteceu
- o que era esperado
- print ou video curto

## Modelo rapido de retorno
Use este formato:

```md
- Tela: Chat
- Aparelho: iPhone 14 / Safari
- Problema: teclado cobre parte do input ao responder
- Esperado: input permanecer totalmente visivel
- Severidade: P1
```

## Recomendacao de execucao
1. Fazer primeiro uma passada P0 completa
2. Se P0 estiver ok, fazer P1
3. Me enviar apenas os bugs encontrados
4. Eu corrijo em lote por prioridade
