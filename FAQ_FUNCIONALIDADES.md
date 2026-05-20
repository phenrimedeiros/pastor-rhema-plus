# Pastor Rhema PLUS - Resumo de Funcionalidades em Formato FAQ

Este documento resume as funcionalidades atuais do sistema para servir como base de um FAQ, manual de uso ou passo a passo para usuarios do aplicativo.

## Visao Geral

### O que e o Pastor Rhema PLUS?

O Pastor Rhema PLUS e uma plataforma web para auxiliar pastores, pregadores, professores biblicos e lideres na preparacao de sermoes, estudos e atendimentos pastorais com apoio de IA.

O sistema combina:

- fluxo guiado de preparo de sermoes;
- chat pastoral com IA;
- Biblia interativa;
- gabinete pastoral;
- biblioteca de sermoes;
- controle de planos Simple e Plus;
- PWA instalavel no celular;
- idiomas Portugues, Ingles e Espanhol.

### Quais planos existem?

Existem dois planos principais:

- **Simple**: libera Chat, Gabinete Pastoral, Biblia Interativa e Perfil.
- **Plus**: libera tudo do Simple e tambem Dashboard, Plano de Serie, Estudo e Contexto, Estrutura do Sermao, Ilustracoes, Aplicacoes, Sermao Final e Meus Sermoes.

Quando um usuario Simple tenta acessar uma area Plus, o sistema mostra uma tela de upgrade com opcoes para usar o chat ou abrir a pagina de upgrade.

### Quais areas aparecem no menu?

Para usuarios Plus:

- Dashboard
- Plano de Serie
- Estudo e Contexto
- Estrutura do Sermao
- Ilustracoes
- Aplicacoes
- Sermao Final
- Meus Sermoes
- Pastor Rhema Chat
- Gabinete Pastoral
- Biblia Interativa
- Meu Perfil
- Suporte

Para usuarios Simple:

- Pastor Rhema Chat
- Gabinete Pastoral
- Biblia Interativa
- Meu Perfil
- Suporte
- Upgrade para Plus

## Acesso e Conta

### Como o usuario entra no sistema?

1. Acessa `https://app.pastorrhema.com`.
2. Informa email e senha na tela de login.
3. O sistema valida a sessao.
4. Se autenticado, redireciona para `/dashboard`.
5. Se o usuario for Simple e tentar entrar no Dashboard, e redirecionado para `/chat`.

### O que acontece na tela inicial `/`?

A rota inicial apenas verifica a sessao:

- usuario autenticado vai para `/dashboard`;
- usuario sem sessao vai para `/login`.

Durante a verificacao, aparece uma tela de carregamento com a mensagem "Entrando no Pastor Rhema...".

### Como o usuario solicita acesso?

A tela atual esta orientada para login e recuperacao de senha. O link "Nao tem acesso?" leva para a pagina oficial de acesso ou contratacao.

O fluxo esperado e:

1. usuario solicita ou adquire o acesso pelo canal oficial;
2. recebe as instrucoes no email usado no cadastro;
3. entra com email e senha;
4. pode alterar a senha depois em Meu Perfil.

### Como funciona recuperacao de senha?

1. Na tela de login, o usuario clica em "Esqueceu a senha?".
2. Informa o email.
3. O sistema envia um link de redefinicao.
4. O link leva para `/reset-password`.
5. O usuario informa nova senha e confirmacao.
6. Se a senha tiver pelo menos 6 caracteres e os campos baterem, o sistema salva e redireciona para o Dashboard.

### O que o usuario pode alterar em Meu Perfil?

Na pagina `/profile`, o usuario pode:

- ver email da conta;
- ver plano atual;
- alterar nome exibido no app;
- alterar senha;
- confirmar que o email nao e editavel diretamente nessa tela.

Apos trocar a senha, o sistema desconecta o usuario e manda para o login.

## Recursos Gerais do App

### Como funciona o seletor de idioma?

O app tem suporte a:

- Portugues;
- Ingles;
- Espanhol.

O seletor aparece no topo da versao desktop e no menu inferior/mobile. As traducoes cobrem navegacao, login, dashboard, fluxo de sermao, Biblia, pastoral, perfil, pesquisa de satisfacao e onboarding.

### O app pode ser instalado como aplicativo no celular?

Sim. O app tem manifest PWA e service worker.

No Android/Desktop, o sistema tenta usar o prompt nativo de instalacao. No iOS, ele mostra uma instrucao manual para tocar em Compartilhar e depois em Adicionar a Tela de Inicio.

### Para que serve o Versiculo do Dia?

O Versiculo do Dia aparece dentro do layout principal do app, quando disponivel.

Ele:

- mostra um versiculo diario;
- muda conforme o idioma;
- pode ser fechado pelo usuario durante o dia;
- permite gerar uma imagem compartilhavel em PNG;
- usa compartilhamento nativo do dispositivo quando possivel ou baixa a imagem.

### Para que serve a pesquisa de satisfacao?

A pesquisa aparece dentro do app para coletar feedback do usuario uma vez.

Ela pergunta:

- nota NPS de 0 a 10;
- perfil do usuario, como pastor titular, lider, professor biblico etc.;
- ferramenta principal usada;
- percepcao de tempo economizado;
- qualidade da IA;
- clareza do fluxo;
- personalizacao;
- maior dificuldade;
- melhoria que faria o usuario usar mais;
- comentarios abertos.

O usuario pode responder, fechar ou deixar para depois na sessao atual.

## Dashboard

### Para que serve o Dashboard?

O Dashboard e a tela principal do usuario Plus. Ele mostra o progresso da semana atual dentro da serie ativa e orienta o proximo passo do preparo do sermao.

### O que aparece no Dashboard quando existe uma serie ativa?

O Dashboard mostra:

- titulo da semana atual;
- passagem biblica;
- nome da serie;
- numero da semana atual;
- progresso do preparo;
- proximo passo recomendado;
- status da semana;
- checklist das etapas;
- botao para iniciar ou continuar;
- botao para abrir Meus Sermoes;
- estatisticas do usuario;
- resumo do sermo em preparo;
- ultimo sermo pregado/arquivado.

### O que aparece quando o usuario ainda nao tem serie?

O sistema mostra um convite para criar a primeira serie e um botao para abrir o formulario de planejamento.

Para usuarios Plus novos sem historico, pode aparecer tambem um tour de onboarding.

### Como funciona o progresso da semana?

O progresso considera cinco etapas:

1. Estudo e Contexto
2. Estrutura do Sermao
3. Ilustracoes
4. Aplicacoes
5. Sermao Final

Cada etapa fica bloqueada ate a anterior ter conteudo salvo. O Dashboard calcula quantas etapas estao concluidas e mostra a porcentagem.

### Como marcar uma semana como concluida?

Quando todas as etapas estao prontas, aparece o botao para concluir a semana.

Ao concluir:

1. o sermo completo e salvo no historico;
2. a serie avanca para a proxima semana;
3. se era a ultima semana, a serie e arquivada;
4. o contador de sermoes do mes e atualizado;
5. a tela recarrega com a nova semana ou estado final.

### Quais estatisticas aparecem no Dashboard?

O Dashboard mostra:

- sermoes do mes;
- sequencia semanal;
- progresso da serie ativa.

## Onboarding

### Quando o tour de onboarding aparece?

O tour aparece para usuario Plus que ainda nao tem series e ainda nao dispensou o tour no navegador.

### O que o onboarding ensina?

O tour tem quatro passos:

1. criar uma serie;
2. entender o fluxo de cinco etapas;
3. conhecer o Chat;
4. conhecer a Biblia Interativa.

Cada passo tem uma acao direta que leva para a rota correspondente.

## Plano de Serie

### Para que serve a pagina Plano de Serie?

A pagina `/series` serve para criar uma serie de sermoes com IA e visualizar a serie ativa com suas semanas.

### Como criar uma serie?

1. Acesse Plano de Serie.
2. Preencha o tema ou livro biblico.
3. Escolha o numero de semanas, de 4 a 8.
4. Escolha o publico, como congregacao geral, novos convertidos, familias, jovens ou lideranca.
5. Escolha o tom, como pastoral, ensino, evangelistico, expositivo ou devocional.
6. Descreva o objetivo principal da serie.
7. Clique em gerar serie.

### O que a IA gera em uma serie?

A IA retorna:

- nome da serie;
- resumo geral;
- semanas planejadas;
- titulo de cada semana;
- passagem biblica de cada semana;
- foco;
- grande ideia;
- proximo passo sugerido.

O sistema salva a serie e deixa as semanas disponiveis para o preparo.

### O que acontece se a criacao das semanas falhar?

O sistema evita deixar uma serie incompleta. Se houver falha na criacao das semanas, o usuario pode tentar gerar novamente.

## Fluxo de Sermoes

### Como funciona o fluxo completo de preparo?

O fluxo de preparo e guiado por etapas. O usuario cria uma serie, trabalha a semana atual e segue nesta ordem:

1. Estudo e Contexto
2. Estrutura do Sermao
3. Ilustracoes
4. Aplicacoes
5. Sermao Final

Cada etapa usa o conteudo anterior para manter continuidade.

### O sistema salva versoes das geracoes?

Sim. As etapas Estudo, Estrutura, Ilustracoes e Aplicacoes guardam versoes do conteudo gerado.

O usuario pode ver historico, comparar, restaurar e duplicar versoes sem perder o material atual.

## Estudo e Contexto

### Para que serve Estudo e Contexto?

A pagina `/study` gera material de estudo biblico para a semana atual.

Ela ajuda o pastor a compreender a passagem antes de montar o sermo.

### O que a IA gera nessa etapa?

O estudo inclui:

- resumo de contexto literario e historico;
- insight teologico;
- angulo pastoral;
- verdade central;
- necessidade pastoral;
- direcao de pregacao;
- termos-chave;
- referencias cruzadas.

### Como usar essa etapa?

1. Crie uma serie.
2. Entre em Estudo e Contexto.
3. Confira a passagem e a semana atual.
4. Clique para gerar estudo.
5. Leia os blocos principais e o resumo lateral.
6. Se necessario, regenere ou restaure uma versao anterior.
7. Clique para usar o estudo e ir para a Estrutura do Sermao.

## Estrutura do Sermao

### Para que serve Estrutura do Sermao?

A pagina `/builder` transforma o estudo e os dados da semana em uma estrutura pregavel.

### O que a IA gera nessa etapa?

A IA gera:

- tres opcoes de titulo;
- grande ideia;
- introducao;
- exatamente tres pontos principais;
- explicacao de cada ponto;
- transicoes;
- conclusao;
- chamado a acao.

### O usuario pode editar a estrutura?

Sim. O usuario pode:

- escolher o titulo preferido;
- editar a grande ideia;
- editar cada ponto;
- editar explicacoes;
- salvar manualmente;
- contar com salvamento automatico apos pequenas edicoes.

### A estrutura usa continuidade da serie?

Sim. Quando existem semanas anteriores, o sistema usa esse contexto para criar continuidade natural e evitar repeticao.

## Ilustracoes

### Para que serve Ilustracoes?

A pagina `/illustrations` gera exemplos e historias que ajudam a comunicar cada ponto do sermo.

### O que a IA gera?

Ela gera uma ilustracao por ponto, normalmente tres no total, contendo:

- ponto relacionado;
- historia breve;
- conexao com o ponto;
- aplicacao da ilustracao.

### O usuario pode editar as ilustracoes?

Sim. O usuario pode:

- editar a historia;
- editar a conexao;
- decidir quais ilustracoes entram no Sermao Final;
- salvar escolhas;
- regenerar;
- restaurar ou duplicar versoes.

### O que acontece se a estrutura ainda nao existe?

A pagina avisa que a Estrutura do Sermao precisa ser concluida antes, e oferece botao para voltar ao construtor.

## Aplicacoes

### Para que serve Aplicacoes?

A pagina `/application` transforma a mensagem em acoes praticas para a congregacao.

### O que a IA gera?

Ela gera:

- aplicacoes relacionadas a cada ponto;
- contexto de uso na vida diaria;
- palavra de encorajamento;
- desafio semanal;
- perguntas de reflexao.

### O usuario pode editar o desafio semanal?

Sim. O desafio semanal pode ser editado, salvo manualmente ou salvo automaticamente apos alteracao.

### O que acontece se a estrutura ainda nao existe?

A pagina informa que a estrutura e necessaria para gerar aplicacoes.

## Sermao Final

### Para que serve Sermao Final?

A pagina `/final` reune o conteudo salvo da semana em um sermo completo, pronto para revisar, copiar, imprimir ou exportar.

### O que entra no Sermao Final?

O Sermao Final usa:

- titulo escolhido;
- passagem;
- nome da serie;
- grande ideia;
- introducao;
- pontos principais;
- explicacoes;
- ilustracoes marcadas para entrar no final;
- aplicacoes;
- transicoes;
- conclusao;
- chamado a acao;
- desafio semanal.

### O usuario pode editar o Sermao Final?

Sim. O modo de edicao permite ajustar:

- titulo;
- grande ideia;
- introducao;
- pontos;
- explicacoes;
- transicoes;
- conclusao;
- chamado a acao;
- desafio semanal.

Os ajustes finais sao salvos de volta nas etapas correspondentes.

### Quais modos existem no Sermao Final?

Existem dois modos:

- **Modo revisao**: mostra o sermo com painel lateral de exportacao e checklist.
- **Modo leitura**: foca no texto do sermo, com layout mais limpo.

### Como exportar o sermo?

A pagina oferece:

- copiar para area de transferencia;
- imprimir ou salvar como PDF pelo navegador;
- baixar arquivo Word `.doc`.

### O que a checklist final verifica?

A checklist mostra se existem:

- grande ideia definida;
- tres pontos estruturados;
- ilustracoes adicionadas;
- aplicacoes prontas.

## Meus Sermoes

### Para que serve Meus Sermoes?

A pagina `/sermons` funciona como biblioteca de planejamento e historico de sermoes.

### O que aparece nessa pagina?

Ela mostra:

- total de series;
- quantidade de sermoes pregados;
- quantidade de sermoes planejados;
- busca por termo;
- filtro por todos, pregados ou planejados;
- lista de sermoes pregados;
- series expansivas com semanas;
- progresso de cada semana;
- preview do sermo selecionado.

### Como um sermo entra na biblioteca de pregados?

Quando o usuario conclui uma semana no Dashboard, o conteudo da semana entra na biblioteca de sermoes pregados.

### O usuario pode copiar um sermo antigo?

Sim. A biblioteca permite copiar o conteudo formatado de um sermo pregado para a area de transferencia.

## Pastor Rhema Chat

### Para que serve o Chat?

A pagina `/chat` e uma conversa livre com o assistente pastoral "Pastor Rhema".

Ela ajuda com:

- sermoes completos;
- estudos verso a verso;
- planejamento de series;
- ideias para eventos;
- explicacoes biblicas;
- insights pastorais;
- aplicacoes praticas.

### Como o Chat responde?

O prompt do sistema orienta a IA a responder com estrutura clara para celular, linguagem pastoral, foco biblico, aplicacoes concretas e integridade ao tratar pontos incertos.

### O Chat salva historico?

Sim. As conversas ficam salvas na conta do usuario para que ele possa voltar depois e continuar de onde parou.

### O usuario pode criar ou apagar conversas?

Sim.

O usuario pode:

- iniciar novo chat;
- abrir conversas antigas;
- excluir conversas do historico;
- continuar uma conversa existente.

## Biblia Interativa

### Para que serve a Biblia Interativa?

A pagina `/bible` permite ler a Biblia dentro do app, navegar por livros e capitulos, buscar referencias, copiar versiculos, fazer notas e pedir aprofundamento com IA.

### Quais idiomas a Biblia suporta?

A Biblia local tem dados em:

- Portugues;
- Ingles;
- Espanhol.

### Como escolher um livro?

1. Clique no seletor de livro.
2. Escolha Antigo Testamento ou Novo Testamento.
3. Use a busca do modal se quiser filtrar.
4. Clique no livro desejado.

### Como navegar entre capitulos?

O usuario pode:

- usar botoes anterior/proximo;
- escolher o capitulo no seletor;
- clicar nos atalhos numericos;
- passar automaticamente para o livro anterior/proximo ao chegar nas pontas.

### Como buscar uma referencia?

1. Digite uma referencia, por exemplo `Joao 3:16`.
2. Clique em buscar.
3. O sistema procura a referencia.
4. Se encontrar, abre o livro e capitulo correspondentes.

### Como copiar um versiculo?

Cada versiculo tem um botao de copiar. Ao clicar, o texto e copiado com referencia.

### Como selecionar texto para nota?

1. Clique em um versiculo.
2. Para selecionar intervalo, use Shift ao clicar em outro versiculo.
3. O editor de passagem abre com o texto selecionado.
4. Escreva uma nota, escolha uma cor e salve.

### Quais cores de destaque existem?

As notas podem usar:

- dourado;
- azul;
- verde;
- rose.

### Onde as notas ficam salvas?

As notas ficam salvas na conta do usuario. Se houver indisponibilidade momentanea, o app pode manter uma copia local no navegador para nao perder a nota.

### O usuario pode editar ou excluir notas?

Sim. O painel de notas permite:

- abrir nota para edicao;
- aprofundar nota com IA;
- excluir nota.

### O que e "Aprofundar" na Biblia?

A funcao Aprofundar envia a passagem selecionada e os versiculos proximos para IA e retorna:

- titulo do estudo;
- resumo;
- contexto imediato;
- contexto historico;
- ideias-chave;
- referencias cruzadas;
- aplicacoes pastorais;
- cuidados interpretativos.

## Gabinete Pastoral

### Para que serve o Gabinete Pastoral?

A pagina `/pastoral` ajuda o pastor a preparar respostas pastorais, palavras de conforto e orientacoes para pessoas em necessidade.

### Quais modos existem?

Existem dois modos:

- **O Bom Amigo / Conforto**: para quando o pastor esta cansado, triste ou sobrecarregado e precisa de encorajamento.
- **Aconselhamento**: para preparar uma resposta pastoral a uma pessoa da igreja.

### O que o modo Conforto gera?

Gera:

- empatia;
- versiculo relevante;
- encorajamento;
- oracao.

### O que o modo Aconselhamento gera?

Gera:

- abertura acolhedora;
- base biblica;
- texto biblico-chave;
- resposta pastoral sugerida;
- dicas de abordagem;
- oracao.

### Quais categorias de aconselhamento existem?

O sistema oferece categorias como:

- luto;
- financeiro;
- casamento;
- ansiedade;
- duvida;
- enfermidade;
- outro.

### O resultado pode ser copiado?

Sim. O resultado gerado pode ser copiado para adaptar e enviar ou usar em conversa pastoral.

## Suporte

### Onde fica o suporte?

No menu lateral e no menu mobile ha uma area de Ajuda com orientacoes de uso e contato de suporte.

A rota antiga `/support` redireciona para `/help`.

## Observacoes Para Criar o FAQ Publico

### O que deve ser explicado para usuarios finais?

Priorize:

- como entrar;
- como recuperar senha;
- diferenca entre Simple e Plus;
- como criar primeira serie;
- como seguir o fluxo de sermo;
- como exportar o sermo final;
- como usar Biblia, notas e aprofundamento;
- como usar Chat e Gabinete Pastoral;
- como alterar senha;
- como pedir suporte.
