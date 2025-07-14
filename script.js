// script.js

// ————————————————————————————
// CONFIGURAZIONE SUPABASE
// ————————————————————————————
const SUPABASE_URL = 'https://fzbpucvscnfyimefrvzs.supabase.co'  // <-- il tuo URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…'     // <-- la tua anon key
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Nome esatto della tabella in Supabase (aggiorna se hai usato un nome diverso)
const TABLE = 'application_specialist'

// ————————————————————————————
// CARICAMENTO AUTOMATICO
// ————————————————————————————
document.addEventListener('DOMContentLoaded', () => {
  // Se siamo in dipendenti.html (c'è <tbody id="listBody">)…
  if (document.getElementById('listBody')) {
    // Collego il bottone e carico subito la lista
    document.getElementById('btnAdd').onclick = addAS
    loadList()
  }

  // Se siamo in statistiche.html (c'è <canvas id="chartSede">)…
  if (document.getElementById('chartSede')) {
    loadStats()
  }
})

// ————————————————————————————
// FUNZIONI DIPENDENTI
// ————————————————————————————
async function loadList() {
  const tbody = document.getElementById('listBody')
  tbody.innerHTML = ''
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return alert('Errore caricamento: '+error.message)

  data.forEach(r => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${r.nome}</td>
      <td>${r.cognome}</td>
      <td>${r.team}</td>
      <td>${r.ruolo||''}</td>
      <td>${r.sede}</td>
      <td>${r.contratto}</td>
      <td>${Array.isArray(r.ambito)?r.ambito.join(', '):r.ambito||''}</td>
      <td>${Array.isArray(r.clienti)?r.clienti.join(', '):r.clienti||''}</td>
      <td>${r.stato||''}</td>
      <td><button data-id="${r.id}">✕</button></td>
    `
    tr.querySelector('button').onclick = () => deleteAS(r.id)
    tbody.appendChild(tr)
  })
}

async function addAS() {
  // prendo i valori dai campi (ID inName, inSurname, ecc.)
  const nuovo = {
    nome:      document.getElementById('inName').value.trim(),
    cognome:   document.getElementById('inSurname').value.trim(),
    team:      document.getElementById('inTeam').value.trim(),
    ruolo:     document.getElementById('inRole').value.trim(),
    sede:      document.getElementById('inSede').value.trim(),
    contratto: document.getElementById('inContract').value,
    ambito:    document.getElementById('inAmbito').value.split(',').map(s=>s.trim()).filter(s=>s),
    clienti:   document.getElementById('inClients').value.split(',').map(s=>s.trim()).filter(s=>s),
    stato:     document.getElementById('inState').value.trim(),
  }

  const { error } = await sb.from(TABLE).insert(nuovo)
  if (error) return alert('Errore inserimento: '+error.message)

  // resetto i campi
  ;['inName','inSurname','inTeam','inRole','inSede','inContract','inAmbito','inClients','inState']
    .forEach(id => document.getElementById(id).value = '')
  loadList()
}

async function deleteAS(id) {
  if (!confirm('Eliminare questo AS?')) return
  const { error } = await sb.from(TABLE).delete().eq('id', id)
  if (error) return alert('Errore eliminazione: '+error.message)
  loadList()
}

// ————————————————————————————
// FUNZIONI STATISTICHE
// ————————————————————————————
async function loadStats() {
  const { data, error } = await sb
    .from(TABLE)
    .select('sede,team,contratto,ambito,clienti')
  if (error) return alert('Errore statistiche: '+error.message)

  // helper di conteggio
  const countBy = (arr, key) => {
    const m = {}
    arr.forEach(r => {
      const items = Array.isArray(r[key]) ? r[key] : [r[key]]
      items.filter(v=>v).forEach(v => { m[v]=(m[v]||0)+1 })
    })
    return m
  }

  renderPie('chartSede',     'AS per Sede',    countBy(data,'sede'))
  renderPie('chartTeam',     'AS per Team',    countBy(data,'team'))
  renderPie('chartContract', 'AS per Contratto', countBy(data,'contratto'))
  renderPie('chartAmbito',   'AS per Ambito',  countBy(data,'ambito'))
  renderPie('chartClients',  'AS per Clienti', countBy(data,'clienti'))
}

const chartMap = {}
function renderPie(id, title, dataObj) {
  const ctx = document.getElementById(id)?.getContext('2d')
  if (!ctx) return
  if (chartMap[id]) chartMap[id].destroy()
  const labels = Object.keys(dataObj)
  const values = Object.values(dataObj)
  // colori HSL automatici
  const bg = labels.map((_,i) => `hsl(${i*360/labels.length},70%,60%)`)
  chartMap[id] = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data: values, backgroundColor: bg }] },
    options: {
      plugins: {
        title:  { display:true, text:title },
        legend: { position:'bottom' }
      }
    }
  })
}