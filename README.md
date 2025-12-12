--------------------------------------------------------------Projeto – Simulador de Encomendas por Drones--------------------------------------------------

Contexto

Fui contratado por uma startup de logística que está testando entregas por drones em áreas urbanas. A missão aqui é simples e old school: seguir as regras como elas sempre foram feitas — peso, autonomia, prioridade — e montar uma simulação confiável que distribui pedidos entre drones.

O sistema gerencia:

pedidos,

drones,

rotas,

e o processo de entrega como um todo.

Tudo baseado em capacidade, distância e prioridade do pacote.

-----------------------------------------------------Regras Básicas--------------------------------------------------------------

Capacidade: cada drone suporta até X kg e possui autonomia de Y km por carga.

Mapeamento: a cidade funciona como um plano cartesiano 2D.

Pedidos: cada pedido contém:

coordenadas X e Y,

peso do pacote,

prioridade (baixa, média, alta).

--------------------------------------------------------------Desenvolvimento--------------------------------------------------------------

Comecei implementando exatamente as regras acima.
O projeto foi desenvolvido utilizando JavaScript, HTML e CSS.

O fluxo inicial é simples:

O sistema carrega a lista de drones a partir de um arquivo JSON.

Um formulário permite ao usuário informar:

posição (X, Y),

peso,

prioridade.


Cada pedido é salvo em uma lista interna e recebe um ID baseado em Date.now().

Quando a simulação é executada, os pedidos são distribuídos entre os drones considerando:

capacidade máxima,

autonomia disponível,

prioridade (alta → média → baixa).


Além disso, implementei um segundo estágio que apresenta:

status do pedido (entregue ou pendente),

bateria estimada dos drones,

quantidade de viagens realizadas por drone.

Cada drone mantém sua própria lista de pedidos, o que permite calcular automaticamente quando é necessário fazer múltiplas viagens, levando em consideração peso total, distância e prioridade.

--------------------------------------------------------------Requisitos--------------------------------------------------------------

Navegador atualizado (Chrome, Edge ou Firefox)

Não requer instalação

Um mini servidor local é necessário para carregar arquivos JSON via fetch()

(Nada complicado — é só subir um servidor e abrir o navegador.)

--------------------------------------------------------------Como executar--------------------------------------------------------------

Opção A — Pelo terminal

1. Clone ou baixe o repositório:

git clone https://github.com/willian-byu-pro/SimuladorEncomendasEmDrone.git
cd SimuladorEncomendasEmDrone


2. Inicie um servidor local:

✔ Python 3
python -m http.server 8000


Depois acesse: http://localhost:8000

✔ Node (http-server)
npm install -g http-server
http-server -p 8000

✔ Via npx (sem instalar nada)
npx http-server -p 8000


Opção B — VS Code (Live Server)

Abra o projeto no VS Code

Instale a extensão Live Server

Clique com o botão direito em index.html → Open with Live Server

Obs.:
O comando cd serve para entrar em uma pasta via terminal.
Exemplo: cd SimuladorEncomendasEmDrone te coloca dentro da pasta do projeto.

--------------------------------------------------------------Como interagir com o simulador--------------------------------------------------------------

Preencha o formulário com X, Y, peso (kg) e prioridade.

Envie para adicionar à fila.

Clique em Simular distribuição.

A interface exibe:

pedidos atribuídos por drone,

ordem de entrega (ID → esquerda para direita),

status atual do pedido,

bateria estimada,

quantidade de viagens realizadas.

Obs.:
Se nenhum drone atender aos requisitos de entrega (peso/distância/autonomia), o pedido permanece com status não entregue.

--------------------------------------------------------------Notas--------------------------------------------------------------

Todo o código foi revisado e refinado com apoio de IA.

A função calcDistance() foi sugerida e adaptada com suporte da IA.

O código contém comentários explicativos para facilitar leitura e manutenção.
