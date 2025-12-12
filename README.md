Projeto Encomendas em Drones


Contexto

Fui contratado por uma startup de logística que está testando entregas por drones em áreas urbanas. A ideia é criar uma simulação que gerencie pedidos, drones e voos, seguindo as regras de capacidade, distância e prioridade.


Regras Básicas

Capacidade: cada drone suporta até X kg e pode viajar até Y km por carga.

Mapeamento: a cidade funciona como uma malha de coordenadas 2D.

Sistema de Pedidos: cada pedido tem:

localização (X, Y)

peso do pacote

prioridade (baixa, média ou alta)


-----------------------------------------------------------------Desenvolvimento
Comecei implementando exatamente as regras básicas. O projeto foi feito em JavaScript, HTML e CSS.
O sistema primeiro carrega uma lista de drones de um arquivo .json.
Depois, um formulário é exibido para o usuário informar:

coordenada X

coordenada Y

peso do pacote

-----------------------------------------------------------------prioridade
Cada pedido é salvo em uma lista e recebe um ID gerado com Date.now().
Quando a simulação roda, os pedidos são distribuídos entre os drones de acordo com:

capacidade máxima,

autonomia,

e prioridade (alta → média → baixa).


Também adicionei um segundo estágio que mostra:

status do pedido (entregue ou não),

percentual de bateria dos drones,

quantidade de viagens feitas.

Cada drone mantém uma lista própria dos pedidos atribuídos a ele. Isso permite calcular quando será necessário fazer mais de uma viagem, considerando peso total e distância.

Requisitos
Navegador atualizado (Chrome, Edge, Firefox)
Não requer instalação
Só precisa de um mini servidor local porque o projeto usa fetch() para carregar arquivos JSON


-----------------------------------------------------------------Como executar (passo a passo)
Opção A — Pelo terminal

Clone ou baixe o repositório:

git clone https://github.com/willian-byu-pro/SimuladorEncomendasEmDrone.git
cd SimuladorEncomendasEmDrone

Inicie um servidor local:

****************************************Com Python 3:

python -m http.server 8000

Depois abra: http://localhost:8000

****************************************Com Node (http-server):

npm install -g http-server
http-server -p 8000


****************************************Com npx (sem instalar nada):

npx http-server -p 8000




Opção B — VS Code (Live Server)
Abra a pasta do projeto no VS Code.
Instale a extensão Live Server.
Clique com o botão direito em index.html → Open with Live Server.

Obs: o comando cd serve para entrar em uma pasta no terminal.
Ex.: cd SimuladorEncomendasEmDrone te coloca dentro da pasta do projeto.

-----------------------------------------------------------------Como interagir com o simulador

Preencha o formulário com X, Y, peso (kg) e prioridade, e envie para adicionar à fila.
Confira sua fila de pedidos.
Clique em Simular distribuição.

A interface mostra:
quais pedidos cada drone recebeu,
ordem de entrega,
status (entregue / não entregue),
bateria estimada,
número de viagens por drone.

-----------------------------------------------------------------Notas

Todo o código foi revisado e corrigido com ajuda de IA.

A função calcDistance() foi sugerida e ajustada com orientação da IA.

O código contém comentários para facilitar a leitura e entendimento da lógica.
