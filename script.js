// ——————————————————————————————————
//  Supabase + Statistiche + Dipendenti
// ——————————————————————————————————
const SUPABASE_URL = 'https://fzbpucvscnfyimefrvzs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…'
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
const TABLE = 'application_specialists'

document.addEventListener('DOMContentLoaded', () => {
  // Dipendenti
  if (document.getElementById('listBody')) {
    document.getElementById('btnAdd').onclick = addAS
    loadList()
  }
  // Statistiche
  if (document.getElementById('chartSede')) {
    loadStats()
  }
})

async function loadList() {
  const tbody = document.getElementById('listBody')
  tbody.innerHTML = ''
  const { data, error } = await sb.from(TABLE).select('*').order('created_at',{ascending:false})
  if (error) return alert('Errore caricamento: '+error.message)
  data.forEach(r => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${r.nome}</td><td>${r.cognome}</td><td>${r.team}</td><td>${r.ruolo||''}</td>
      <td>${r.sede}</td><td>${r.contratto}</td>
      <td>${(r.ambito||[]).join(', ')}</td>
      <td>${(r.clienti||[]).join(', ')}</td><td>${r.stato||''}</td>
      <td><button data-id="${r.id}">✕</button></td>`
    tr.querySelector('button').onclick = () => deleteAS(r.id)
    tbody.appendChild(tr)
  })
}

async function addAS() {
  const n = id => document.getElementById(id).value.trim()
  const record = {
    nome: n('inName'), cognome: n('inSurname'), team: n('inTeam'),
    ruolo: n('inRole'), sede: n('inSede'), contratto: n('inContract'),
    ambito: n('inAmbito').split(',').map(s=>s.trim()).filter(s=>s),
    clienti: n('inClients').split(',').map(s=>s.trim()).filter(s=>s),
    stato: n('inState'),
  }
  const { error } = await sb.from(TABLE).insert(record)
  if (error) return alert('Errore inserimento: '+error.message)
  ;['inName','inSurname','inTeam','inRole','inSede','inContract','inAmbito','inClients','inState']
    .forEach(id => document.getElementById(id).value = '')
  loadList()
}

async function deleteAS(id) {
  if(!confirm('Eliminare questo AS?')) return
  const { error } = await sb.from(TABLE).delete().eq('id',id)
  if (error) return alert('Errore eliminazione: '+error.message)
  loadList()
}

async function loadStats() {
  const { data, error } = await sb.from(TABLE)
    .select('sede,team,contratto,ambito,clienti')
  if (error) return alert('Errore statistiche: '+error.message)
  const countBy = key => {
    const m = {}
    data.forEach(r => {
      ;(Array.isArray(r[key])?r[key]:[r[key]]).filter(v=>v)
        .forEach(v=>m[v]=(m[v]||0)+1)
    })
    return m
  }
  renderPie('chartSede','AS per Sede',countBy('sede'))
  renderPie('chartTeam','AS per Team',countBy('team'))
  renderPie('chartContract','AS per Contratto',countBy('contratto'))
  renderPie('chartAmbito','AS per Ambito',countBy('ambito'))
  renderPie('chartClients','AS per Clienti',countBy('clienti'))
}

const charts = {}
function renderPie(id,title,dataObj) {
  const el = document.getElementById(id)
  if (!el) return
  const ctx = el.getContext('2d')
  if (charts[id]) charts[id].destroy()
  const labels = Object.keys(dataObj),
        values = Object.values(dataObj),
        bg = labels.map((_,i)=>`hsl(${i*360/labels.length},70%,60%)`)
  charts[id] = new Chart(ctx,{
    type:'pie',
    data:{labels,datasets:[{data:values,backgroundColor:bg}]},
    options:{plugins:{title:{display:true,text:title},legend:{position:'bottom'}}}
  })
}