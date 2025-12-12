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
    this.assignedOrders = [];
    this.image = image;

    // novos campos
    this.battery = 100.0;                 // % de bateria (100 = cheio)
    this.batteryPerKm = 1.0;             // porcentagem gasta por km (ajustável)
    this.trips = [];                     // histórico simples de viagens
  }

  canCarry(order) {
    return this.remainingWeight >= order.weight;
  }

  // checa alcance físico (round trip) sem considerar bateria
  canReachPhysically(order, hubX = 0, hubY = 0) {
    const d = calcDistance(hubX, hubY, order.x, order.y);
    return (d * 2) <= this.maxDistanceKm;
  }

  // checa se há bateria para uma distância estimada (km)
  hasBatteryFor(distanceKm) {
    const required = distanceKm * this.batteryPerKm;
    return this.battery >= required;
  }

  // registra um pedido como "alocado" no drone (mantém assignedOrders)
  assign(order) { //cada drone posssuira uma lista de ordem individual por simulação de acordo com os parametros
    this.assignedOrders.push(order);
    // diminuímos a "capacidade temporária" enquanto monta a viagem - atualiza o a capacidade de peso do drone
    this.remainingWeight -= order.weight;
  }



//****************************************** Nesta parte do codigo utilizei IA para encontrar o erro de duplicata e a seguir foi a solução encontrada************ */

  // registra uma viagem: diminui bateria e guarda histórico
  doTrip(tripOrders, estDistanceKm) {
    // marca pedidos como entregues e guarda timestamps simples
    tripOrders.forEach(o => {
      o.assigned = true;
      o.deliveredAt = Date.now();
      // garante que o pedido está listado em assignedOrders para a UI
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

    // reset capacidade para próxima viagem (assumimos que volta ao hub entre viagens)
    this.remainingWeight = this.maxWeight;
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
    this.assigned = false;
    this.deliveredAt = null;
  }

  distFromHub(hubX = 0, hubY = 0) {
    return calcDistance(hubX, hubY, this.x, this.y);
  }
}

// ---------- Getters (globalmente acessíveis) ----------
function getDrones() {
  return dronesList;
}

function getOrders() {
  return ordersList;
}

// ---------- Carregamento dos drones (async) ----------
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
      status.textContent = `Espaço Restante: ${d.remainingWeight}Kg | Pedidos: ${d.assignedOrders.length}`;
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
function updateDroneStatus(drones) {
  const container = document.getElementById('drones');
  if (!container) return;
  const cards = container.querySelectorAll('.drone');

  drones.forEach((drone, idx) => {
    const card = cards[idx];
    if (!card) return;
    let status = card.querySelector('.drone-status');
    if (!status) {
      status = document.createElement('p');
      status.classList.add('drone-status');
      card.appendChild(status);
    }
    // mostra carga, pedidos alocados (ids), bateria e número de viagens
    const pedidosText = drone.assignedOrders.length ? drone.assignedOrders.map(o => o.id).join(', ') : '—';
    status.textContent = `Carga restante: ${drone.remainingWeight.toFixed(2)} Kg | Pedidos: ${pedidosText} | Bateria: ${drone.battery.toFixed(1)}% | Viagens: ${drone.trips.length}`;
  });
}

// ---------- Função para desenhar a tabela de pedidos atual (opcional) ----------
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

// ---------- simulateDistribution (agrupa pedidos por viagem - versão corrigida) ----------
function simulateDistribution() {
  const drones = getDrones();
  const orders = getOrders().slice(); // copia lista

  // reset básico dos drones
  drones.forEach(d => {
    d.assignedOrders = [];
    d.remainingWeight = d.maxWeight;
    d.trips = [];
    d.battery = 100.0; // começa cheia a simulação
  });

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
      const remaining = pending.filter(o => !o.assigned);
      if (remaining.length === 0) break;

      // montar uma viagem greedy
      let capLeft = drone.maxWeight;
      const tripGroup = [];

      for (const order of remaining) {
        if (order.assigned) continue;
        if (order.weight > capLeft) continue;

        const trialGroup = tripGroup.concat([order]);
        const estDist = estTripDistanceKm(trialGroup);

        if (estDist <= drone.maxDistanceKm && drone.hasBatteryFor(estDist)) {
          tripGroup.push(order);
          capLeft -= order.weight;
          // marcar temporariamente como alocado na capacidade local
          drone.assign(order);
        }
      }

      if (tripGroup.length > 0) {
        const estDist = estTripDistanceKm(tripGroup);
        // realiza a viagem (marca delivered, consome bateria e histórico)
        drone.doTrip(tripGroup, estDist);
        somethingAllocated = true;
      } else {
        // nenhum pedido coube nessa iteração para esse drone
        break;
      }
    }
  }

  // atualizar a interface
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
