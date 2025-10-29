/*********************
 * CONFIG (veröffentlichter Link)
 *********************/
const PUBLISHED_E_ID = "2PACX-1vTvZNCfnebfXU_g03bJTk7T6oipiGCT6qEyY9CV9TgDyH0i-qozWaoAxVVW_W8zs5giE32BOivxFYXM";
const GID            = "150040148";   // aus deinem pubhtml-Link: ?gid=150040148

// Datenbereich (rechte Ergebnistabelle)
const DATA_START_ROW = 4;   // erste Fahrerzeile (inkl.)
const DATA_END_ROW   = 23;  // letzte Fahrerzeile (inkl.)

// Spaltenindizes (A=0, ..., Z=25, AA=26, ...):
const COLS = {
  pos:   33,  // AH
  name:  35,  // AJ
  team:  36,  // AK
  logo:  37,  // AL (URL/IMAGE)
  pts:   39   // AN
};

/*********************
 * GViz JSONP Loader (CORS-frei)
 *********************/
function fetchGvizPublished(eId, gid) {
  return new Promise((resolve, reject) => {
    const old = (window.google && window.google.visualization && window.google.visualization.Query && window.google.visualization.Query.setResponse) || null;

    window.google = window.google || {};
    window.google.visualization = window.google.visualization || {};
    window.google.visualization.Query = window.google.visualization.Query || {};

    window.google.visualization.Query.setResponse = function(resp) {
      try {
        if (!resp || resp.status !== "ok") throw new Error("GViz response not ok");
        resolve(resp.table);
      } catch (e) {
        reject(e);
      } finally {
        if (old) window.google.visualization.Query.setResponse = old;
        if (script && script.parentNode) script.parentNode.removeChild(script);
      }
    };

    const url = `https://docs.google.com/spreadsheets/d/e/${eId}/gviz/tq?gid=${encodeURIComponent(gid)}&tqx=out:json`;
    const script = document.createElement("script");
    script.src = url;
    script.onerror = () => reject(new Error("GViz JSONP load failed"));
    document.body.appendChild(script);
  });
}

/*********************
 * Helpers
 *********************/
function raw(c){ return c?.v ?? ""; }
function fmt(c){ return c?.f ?? c?.v ?? ""; } // versucht formatierte Werte zu nutzen

/*********************
 * Render
 *********************/
async function loadRaceOnly() {
  const table = await fetchGvizPublished(PUBLISHED_E_ID, GID);
  const tbody = document.querySelector(".results-table tbody");
  tbody.innerHTML = "";

  for (let r = DATA_START_ROW - 1; r <= DATA_END_ROW - 1; r++) {
    const row = table.rows[r];
    if (!row) continue;
    const c = row.c || [];

    const pos  = fmt(c[COLS.pos]);
    const name = fmt(c[COLS.name]);
    const team = fmt(c[COLS.team]);
    const logo = fmt(c[COLS.logo]); // URL oder leer
    const pts  = fmt(c[COLS.pts]);

    if (!name && !team && !pts) continue; // leere Zeilen überspringen

    // Team + Logo zusammenbauen (Logo optional)
    let teamCell = team || "";
    if (logo) {
      // wenn die Zelle eine IMAGE()-Formel als Text liefert, URL herausziehen
      const urlMatch = String(logo).match(/https?:\/\/[^\s")]+/);
      const url = urlMatch ? urlMatch[0] : logo;
      teamCell = `<img src="${url}" alt="" style="height:18px;vertical-align:middle;margin-right:6px;">${teamCell}`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${pos}</td>
      <td>${name}</td>
      <td>${teamCell}</td>
      <td></td>  <!-- Grid (optional) -->
      <td></td>  <!-- Stopps (optional) -->
      <td></td>  <!-- Beste (optional) -->
      <td></td>  <!-- Zeit  (optional) -->
      <td>${pts}</td>
    `;
    tbody.appendChild(tr);
  }
}

document.addEventListener("DOMContentLoaded", loadRaceOnly);
