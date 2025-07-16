// script.js
document.addEventListener('DOMContentLoaded', async () => {
  // === CONFIGURAZIONE SUPABASE ===
  const sb = supabase.createClient(
    'https://fzbpucvscnfyimefrvzs.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…' // la tua chiave completa
  );

  // ————————————————
  // 1) SEZIONE “DIPENDENTI”
  // ————————————————
  const listBody = document.getElementById('listBody');
  if (listBody) {
    // campi form
    const inName     = document.getElementById('inName');
    const inSurname  = document.getElementById('inSurname');
    const inTeam     = document.getElementById('inTeam');
    const inRole     = document.getElementById('inRole');
    const inSede     = document.getElementById('inSede');
    const inContract = document.getElementById('inContract');
    const inAmbito   = document.getElementById('inAmbito');
    const inClients  = document.getElementById('inClients');
    const inState    = document.getElementById('inState');
    document.getElementById('btnAdd').addEventListener('click', async e => {
      e.preventDefault();
      const record = {
        nome:      inName.value.trim(),
        cognome:   inSurname.value.trim(),
        team:      inTeam.value.trim(),
        ruolo:     inRole.value.trim(),
        sede:      inSede.value.trim(),
        contratto: inContract.value.trim(),
        ambito:    inAmbito.value.split(',').map(s=>s.trim()).filter(s=>s),
        clienti:   inClients.value.split(',').map(s=>s.trim()).filter(s=>s),
        stato:     inState.value.trim(),
      };
      const { error } = await sb.from('application_specialists').insert(record);
      if (error) return alert(error.message);
      [inName,inSurname,inTeam,inRole,inSede,inContract,inAmbito,inClients,inState]
        .forEach(i => i.value='');
      loadList();
    });

    // funzione per caricare la tabella
    async function loadList() {
      listBody.innerHTML = '';
      const { data, error } = await sb
        .from('application_specialists')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return alert(error.message);
      data.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.nome}</td><td>${r.cognome}</td><td>${r.team}</td><td>${r.ruolo||''}</td>
          <td>${r.sede}</td><td>${r.contratto}</td>
          <td>${(r.ambito||[]).join(', ')}</td>
          <td>${(r.clienti||[]).join(', ')}</td>
          <td>${r.stato||''}</td>
          <td><button data-id="${r.id}">✕</button></td>
        `;
        tr.querySelector('button').onclick = async () => {
          if (!confirm('Eliminare questo AS?')) return;
          const { error } = await sb.from('application_specialists')
            .delete().eq('id', r.id);
          if (error) return alert(error.message);
          loadList();
        };
        listBody.appendChild(tr);
      });
    }

    // caricamento iniziale
    loadList();
  }

  // ————————————————
  // 2) SEZIONE “STATISTICHE”
  // ————————————————
  const chartContainer = document.getElementById('chartSede');
  if (chartContainer) {
    const chartMap = {};

    async function loadStats() {
      const { data, error } = await sb
        .from('application_specialists')
        .select('sede,team,contratto,ambito,clienti');
      if (error) return alert(error.message);

      // conta occorrenze per ogni chiave
      const countBy = key => data.reduce((m, r) => {
        const vals = Array.isArray(r[key]) ? r[key] : [r[key]];
        vals.filter(v=>v).forEach(v => m[v] = (m[v]||0)+1);
        return m;
      }, {});

      // disegna ciascuna torta
      renderPie('chartSede',     'AS per Sede',      countBy('sede'));
      renderPie('chartTeam',     'AS per Team',      countBy('team'));
      renderPie('chartContract', 'AS per Contratto', countBy('contratto'));
      renderPie('chartAmbito',   'AS per Ambito',    countBy('ambito'));
      renderPie('chartClients',  'AS per Clienti',   countBy('clienti'));
    }

    function renderPie(id, title, dataObj) {
      const ctx = document.getElementById(id).getContext('2d');
      if (chartMap[id]) chartMap[id].destroy();
      const labels = Object.keys(dataObj);
      const values = Object.values(dataObj);
      const bg     = labels.map((_,i)=>`hsl(${i*360/labels.length},70%,60%)`);
      chartMap[id] = new Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data: values, backgroundColor: bg }] },
        options: { plugins: { title:{ display:true, text:title }, legend:{ position:'bottom' } } }
      });
    }

    // avviare il caricamento dei grafici
    loadStats();
  }
});