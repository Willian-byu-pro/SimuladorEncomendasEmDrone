// ---------- Variáveis globais ----------
let dronesList = [];   // vai conter instâncias de Drone
let ordersList = [];   // vai conter instâncias de Order
// ---------- Prioridade global (reutilizável) ----------
const priorityOrder = { high: 1, medium: 2, low: 3 };

// ---------- Função utilitária ----------
function calcDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---------- Classe Drone ----------
class Drone {
  constructor(id, maxWeight, maxDistanceKm, image = "") {
    this.id = id;
    this.maxWeight = Number(maxWeight);
    this.maxDistanceKm = Number(maxDistanceKm);
    this.remainingWeight = Number(maxWeight);
    this.assignedOrders = [];
    this.image = image;
    this.battery = 100.0;               
    this.batteryPerKm = 1.0;           
    this.trips = [];                   
  }

  canCarry(order) {
    return this.remainingWeight >= order.weight; 
  }

  canReachPhysically(order, hubX = 0, hubY = 0) {
    const d = calcDistance(hubX, hubY, order.x, order.y);
    return (d * 2) <= this.maxDistanceKm;
  }

  hasBatteryFor(distanceKm) {
    const required = distanceKm * this.batteryPerKm;
    return this.battery >= required;
  }

  assign(order) { 
    if (this.assignedOrders.find(x => x.id === order.id)) return;
    this.assignedOrders.push(order);
    this.remainingWeight = Math.max(0, this.remainingWeight - order.weight);
    order.assigned = true;
  }

  // registra uma viagem: diminui bateria e guarda histórico
  doTrip(tripOrders, estDistanceKm) {
    tripOrders.forEach(o => {
      o.assigned = true;
      o.deliveredAt = Date.now();
      if (!this.assignedOrders.find(x => x.id === o.id)) {
        this.assignedOrders.push(o);
      }
    });

    const consume = estDistanceKm * this.batteryPerKm;
    this.battery = Math.max(0, this.battery - consume);

    this.trips.push({ 
      orders: tripOrders.map(o => o.id), 
      distanceKm: estDistanceKm, 
      when: Date.now() 
    });
  }
}

// ---------- Classe Order ----------
class Order {
  constructor(id, x, y, weight, priority) {
    this.id = id;
    this.x = Number(x);
    this.y = Number(y);
    this.weight = Number(weight);
    this.priority = priority;
    this.assigned = false; 
    this.deliveredAt = null; 
  }

  distFromHub(hubX = 0, hubY = 0) {
    return calcDistance(hubX, hubY, this.x, this.y);
  }
}

// ---------- Getters ----------
function getDrones() {
  return dronesList;
}
function getOrders() {
  return ordersList;
}

// ---------- Carregamento dos drones ----------
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

// ---------- Atualizar cards ----------
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

    const pedidosText = drone.assignedOrders.length ? drone.assignedOrders.map(o => o.id).join(', ') : '—';
    status.textContent = `Carga restante: ${drone.remainingWeight.toFixed(2)} Kg | Pedidos: ${pedidosText} | Bateria: ${drone.battery.toFixed(1)}% | Viagens: ${drone.trips.length}`;
  });
}

// ---------- Tabela de pedidos ----------
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

// ---------- simulateDistribution ----------
function simulateDistribution() {
  const drones = getDrones();
  const orders = getOrders().slice(); 

  drones.forEach(d => {
    d.assignedOrders = [];
    d.remainingWeight = d.maxWeight;
    d.trips = [];
    d.battery = 100.0;
  });

  const pending = orders.filter(o => !o.assigned);

  const prioVal = { high: 1, medium: 2, low: 3 };
  pending.sort((a, b) => {
    if (prioVal[a.priority] !== prioVal[b.priority]) return prioVal[a.priority] - prioVal[b.priority];
    const da = calcDistance(0,0,a.x,a.y), db = calcDistance(0,0,b.x,b.y);
    return da - db;
  });

  function estTripDistanceKm(group) {
    if (!group.length) return 0;
    const maxD = Math.max(...group.map(o => calcDistance(0,0,o.x,o.y)));
    return maxD * 2;
  }

  for (const drone of drones) {
    let somethingAllocated = true;
    while (somethingAllocated) {
      somethingAllocated = false;
      const remaining = pending.filter(o => !o.assigned);
      if (remaining.length === 0) break;

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
        }
      }

      if (tripGroup.length > 0) {
        const estDist = estTripDistanceKm(tripGroup);

        tripGroup.forEach(o => {
          drone.assign(o);
        });

        drone.doTrip(tripGroup, estDist);
        somethingAllocated = true;
      } else {
        break;
      }
    }
  }

  updateDroneStatus(getDrones());
  renderOrdersTable();
}

// ---------- DOM ----------
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
