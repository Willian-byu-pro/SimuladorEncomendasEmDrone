// ---------- Variáveis globais ----------
let dronesList = [];   // vai conter instâncias de Drone
let ordersList = [];   // vai conter instâncias de Order
// ---------- Prioridade global (reutilizável) ----------
const priorityOrder = { high: 1, medium: 2, low: 3 };

// ---------- Função utilitária ---------- (Função fornecida pela IA)
function calcDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}



// ---------- Classe Drone (simplificada, com bateria) ----------
class Drone {
  constructor(id, maxWeight, maxDistanceKm, image = "") {
    this.id = id;
    this.maxWeight = Number(maxWeight);
    this.maxDistanceKm = Number(maxDistanceKm);
    this.remainingWeight = Number(maxWeight);
    this.assignedOrders = []; // manter histórico/seqüência de IDs atribuídos
    this.image = image;
    // novos campos
    this.battery = 100.0;                 // % de bateria (100 = cheio)
    this.batteryPerKm = 1.0;             // porcentagem gasta por km (ajustável)
    this.trips = [];                     // histórico simples de viagens - fica vazil por padrão
  }

  canCarry(order) {
    return this.remainingWeight >= order.weight;  //Verifica se a capacidade do drone é compativel com o peso do pedido.
  }

  // checa alcance físico (round trip) sem considerar bateria
  canReachPhysically(order, hubX = 0, hubY = 0) {
    const d = calcDistance(hubX, hubY, order.x, order.y); //Calcula a distancia até o pedido
    return (d * 2) <= this.maxDistanceKm; //Verifica a distancia completa ida e volta.
  }

  // checa se há bateria para uma distância estimada (km)
  hasBatteryFor(distanceKm) {
    const required = distanceKm * this.batteryPerKm; //multiplica para saber a autonomia (distancia * 1.0)
    return this.battery >= required; // o calculo precisa ser menor ou igual ao total da carga do drone 
  }

  // registra um pedido como "alocado" no drone (mantém assignedOrders)
  assign(order) { //cada drone posssuira uma lista de ordem individual por simulação de acordo com os parametros de sua capacidade
    // *** PATCH: tornar assign() robusto e seguro contra NaN/strings ***
    const w = Number(order.weight) || 0;
    // evita duplicata na lista de alocados (mantemos histórico sem repetições)
    if (!this.assignedOrders.find(x => x.id === order.id)) {
      this.assignedOrders.push(order);
    }
    
    this.remainingWeight = Number(this.remainingWeight) - w; // diminuímos a "capacidade temporária" enquanto monta a viagem - atualiza  a capacidade de peso do drone

    // proteção: não deixar negativo nem NaN
    if (!isFinite(this.remainingWeight) || this.remainingWeight < 0) {
      this.remainingWeight = 0;
    }

    // log útil para debug
    console.log(`[assign] Drone ${this.id} atribuído ${order.id} (${w}kg). remainingWeight=${this.remainingWeight}`);
  }



//****************************************** Nesta parte do codigo utilizei IA para encontrar o erro de duplicata e a seguir foi a solução encontrada************ */

  // registra uma viagem: diminui bateria e guarda histórico
  doTrip(tripOrders, estDistanceKm) {
    // marca pedidos como entregues e guarda timestamps simples
    tripOrders.forEach(o => {
      o.assigned = true;
      o.deliveredAt = Date.now();
      // garante que o pedido está listado em assignedOrders para a UI (se ainda não estiver)
      if (!this.assignedOrders.find(x => x.id === o.id)) {
        this.assignedOrders.push(o);
      }
    });
//****************************************//********************************



    // consumir bateria (simplificação)
    const consume = estDistanceKm * this.batteryPerKm;
    this.battery = Math.max(0, this.battery - consume); //o numeral:0 trrava o calculo apenas em numeros positivos- baterias não possuem carga negativa

    // salva viagem simples no histórico
    this.trips.push({ orders: tripOrders.map(o => o.id), distanceKm: estDistanceKm, when: Date.now() });

 

    console.log(`[doTrip] Drone ${this.id} fez viagem ${estDistanceKm}km. bateria=${this.battery.toFixed(1)}%. remainingWeight apos viagem=${this.remainingWeight}`);
  }
}

// ---------- Classe Order (com flags usadas pelo algoritmo) ----------
class Order {
  constructor(id, x, y, weight, priority) {
    this.id = id;
    this.x = Number(x);
    this.y = Number(y);
    this.weight = Number(weight);
    this.priority = priority;
    // novos campos para controle
    this.assigned = false; //guarda o estado da entrega sim/não
    this.deliveredAt = null; //Guarda o estado de quando foi entregue no sistema
  }

  distFromHub(hubX = 0, hubY = 0) {
    return calcDistance(hubX, hubY, this.x, this.y); //calcula a distancia
  }
}

// ---------- Getters (globalmente acessíveis) evita o acesso direto as listas ----------
function getDrones() {
  return dronesList;
}

function getOrders() {
  return ordersList;
}



 // ---------- Carregamento dos drones (async) ---------- 
//Esta parte carrega os dados e informaçoes dos drones disponiveis
async function loadDrones() {
  try {
    const response = await fetch('./data/drones.json');
    if (!response.ok) throw new Error(`Falha ao carregar drones.json (status ${response.status})`);
    const dronesRaw = await response.json();
    dronesList = dronesRaw.map(d => new Drone(d.id, d.maxWeight, d.maxDistanceKm, d.image || ""));
    const container = document.getElementById('drones');
    if (!container) return;
    container.innerHTML = "";
    dronesList.forEach(d => {
      const card = document.createElement('div');
      card.classList.add('drone');
      const img = document.createElement('img');
      img.alt = d.id;
      if (d.image) img.src = d.image;
      const title = document.createElement('h2'); title.textContent = d.id;
      const pMaxWeight = document.createElement('p'); pMaxWeight.textContent = `Capacidade Máx: ${d.maxWeight}Kg`;
      const pMaxDistance = document.createElement('p'); pMaxDistance.textContent = `Autonomia: ${d.maxDistanceKm}Km`;
      const status = document.createElement('p'); status.classList.add('drone-status');
      // MOSTRA A CAPACIDADE ATUAL (persistente) e A LISTA DE PEDIDOS ATRIBUÍDOS (para ver sequência/prioridade)
      status.innerHTML = `Carga atual: ${d.remainingWeight.toFixed(2)} Kg <br> Pedidos: ${d.assignedOrders.length ? d.assignedOrders.map(o => o.id).join(', ') : '—'}`;
      if (d.image) card.appendChild(img);
      card.appendChild(title);
      card.appendChild(pMaxWeight);
      card.appendChild(pMaxDistance);
      card.appendChild(status);
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Erro ao carregar drones:", err);
  }
}




// ---------- Atualizar visual dos cards (depois de alocar pedidos) ----------
//estes dados são visiveis ao simular uma distribuição
function updateDroneStatus(drones) {
  const container = document.getElementById('drones');
  if (!container) return;

  const cards = container.querySelectorAll('.drone');
  // debug / checagem da correspondência entre drones e cards
  console.log('[updateDroneStatus] dronesList.length=', drones.length, 'cards.length=', cards.length);

  drones.forEach((drone, idx) => {
    const card = cards[idx];
    if (!card) {
      console.warn(`[updateDroneStatus] card não encontrado para drone idx=${idx} id=${drone.id}`);
      return;
    }
    let status = card.querySelector('.drone-status');
    if (!status) {

      status = document.createElement('p');
      status.classList.add('drone-status');
      card.appendChild(status);
    }
    // mostra carga, pedidos alocados (ids), bateria e número de viagens
    //(lista de IDs) — mantém histórico dos pedidos atribuídos
    const pedidosText = drone.assignedOrders.length ? drone.assignedOrders.map(o => o.id).join(', ') : '—';

 
    const rem = Number.isFinite(drone.remainingWeight) ? drone.remainingWeight : 0;

    status.innerHTML = `
      Carga disponivel: ${rem.toFixed(2)} Kg
      <br>
      Pedidos: ${pedidosText}
      <br>
      Bateria: ${drone.battery.toFixed(1)}% | Viagens: ${drone.trips.length}
    `;
    console.log(`[updateDroneStatus] ${drone.id} -> rem=${rem}`);
  });
}





// ---------- Função para desenhar a tabela de pedidos atual dinamicamente----------
function renderOrdersTable() {
  const tableBody = document.getElementById('ordersTableBody'); 
  if (!tableBody) return;
  tableBody.innerHTML = "";
  ordersList.forEach(order => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.id}</td>
      <td> (${order.x}, ${order.y}) </td>
      <td> ${order.weight} </td>
      <td> ${order.priority} </td>
      <td> ${order.assigned ? 'Sim' : 'Não'} </td>
      <td> ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : '—'} </td>
    `;
    tableBody.appendChild(row);
  });
}





// ---------- simulateDistribution (persistente: não reseta remainingWeight automaticamente) ----------
function simulateDistribution() {
  const drones = getDrones();
  const orders = getOrders().slice(); // copia lista

  // pedidos pendentes (objetos Order)
  const pending = orders.filter(o => !o.assigned);

  // ordenar por prioridade (high -> low) e por distância ao hub
  const prioVal = { high: 1, medium: 2, low: 3 };
  pending.sort((a, b) => {
    if (prioVal[a.priority] !== prioVal[b.priority]) return prioVal[a.priority] - prioVal[b.priority];
    const da = calcDistance(0,0,a.x,a.y), db = calcDistance(0,0,b.x,b.y);
    return da - db;
  });

  // função estimadora de distância de uma viagem com vários pedidos:
  function estTripDistanceKm(group) {
    if (!group.length) return 0;
    const maxD = Math.max(...group.map(o => calcDistance(0,0,o.x,o.y)));
    return maxD * 2;
  }

  // para cada drone, tentamos criar viagens enquanto houver pedidos encaixáveis
  for (const drone of drones) {
    let somethingAllocated = true;

    while (somethingAllocated) {
      somethingAllocated = false;

      // pega apenas pedidos ainda não entregues
      const remaining = pending.filter(o => !o.assigned);
      if (remaining.length === 0) break;

      // montar uma viagem greedy

      let capLeft = drone.remainingWeight;
      const tripGroup = [];

      for (const order of remaining) {
        if (order.assigned) continue;                 // já entregue
        if (order.weight > capLeft) continue;         // não cabe mais na capacidade restante

        const trialGroup = tripGroup.concat([order]);
        const estDist = estTripDistanceKm(trialGroup);

        // checamos bateria e distância
        if (estDist <= drone.maxDistanceKm && drone.hasBatteryFor(estDist)) {
          tripGroup.push(order);
          capLeft -= order.weight;

          // assign() já diminui remainingWeight e adiciona à lista 
          drone.assign(order);

          // Atualiza UI imediatamente (mostra queda na capacidade)
          updateDroneStatus(getDrones());
          renderOrdersTable();
        }
      }

      // se montou viagem, executa
      if (tripGroup.length > 0) {
        const estDist = estTripDistanceKm(tripGroup);

        // doTrip marca como entregue, consome bateria e guarda histórico

        drone.doTrip(tripGroup, estDist);

        // atualizar UI depois da viagem
        updateDroneStatus(getDrones());
        renderOrdersTable();

        somethingAllocated = true;
      } else {
        // nenhum pedido coube nessa rodada
        break;
      }
    }
  }

  // atualização final
  updateDroneStatus(getDrones());
  renderOrdersTable();
}

// ---------- DOMContentLoaded: ligar eventos e carregar drones ----------
document.addEventListener('DOMContentLoaded', () => {
  loadDrones();

  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const x = Number(document.getElementById('inputX').value);
      const y = Number(document.getElementById('inputY').value);
      const weight = Number(document.getElementById('inputWeight').value);
      const priority = document.getElementById('inputPriority').value;
      const order = new Order(Date.now(), x, y, weight, priority);
      ordersList.push(order);
      renderOrdersTable();
      orderForm.reset();
    });
  }

  const btnSimulate = document.getElementById('btnSimulate');
  if (btnSimulate) {
    btnSimulate.addEventListener('click', simulateDistribution);
  }
});
