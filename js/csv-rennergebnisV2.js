/******** CONFIG ********/
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTvZNCfnebfXU_g03bJTk7T6oipiGCT6qEyY9CV9TgDyH0i-qozWaoAxVVW_W8zs5giE32BOivxFYXM/pub?gid=150040148&single=true&output=csv";

// so viele Zeilen durchsuchen wir nach der Kopfzeile mit "Rennen"
const HEADER_SCAN_ROWS = 30;

// so viele Fahrerzeilen rendern (F1: 20)
const DRIVER_ROWS = 20;

/******** CSV Parser (robust mit Quotes/Kommas/CRLF) ********/
function parseCSV(text) {
  const rows = [];
  let row = [], cur = "", inQuotes = false;
  for (let i=0; i<text.length; i++) {
    const ch = text[i], next = text[i+1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      row.push(cur); cur = "";
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (cur !== "" || row.length) { row.push(cur); rows.push(row); row = []; cur=""; }
      if (ch === '\r' && next === '\n') i++;
    } else {
      cur += ch;
    }
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

/******** Helpers ********/
const norm = s => String(s ?? "").trim();
function findFirstRowIndex(rows, pred, maxRows=HEADER_SCAN_ROWS) {
  for (let r = 0; r < Math.min(rows.length, maxRows); r++) {
    if (pred(rows[r] || [], r)) return r;
  }
  return -1;
}
function findCol(row, label) {
  const needle = label.toLowerCase();
  for (let c = 0; c < row.length; c++) {
    if (norm(row[c]).toLowerCase() === needle) return c;
  }
  return -1;
}
function extractImageUrl(val){
  if (!val) return "";
  const m = String(val).match(/https?:\/\/[^\s")]+/);
  return m ? m[0] : "";
}

/******** Auto-Lokalisierung der „Rennen“-Sektion ********/
function detectRaceColumns(rows) {
  // 1) Zeile finden, die die Zelle "Rennen" enthält (irgendwo in den ersten N Zeilen)
  const rennenHeaderRowIdx = findFirstRowIndex(rows, (row) => row.some(cell => norm(cell) === "Rennen"));
  if (rennenHeaderRowIdx === -1) throw new Error("Konnte die 'Rennen'-Sektion in den Kopfzeilen nicht finden.");

  // 2) In der gleichen Zeile ODER in der nächsten Zeile nach Spaltenüberschriften suchen
  //    (manchmal stehen die Unterüberschriften eine Zeile tiefer)
  const candidateRows = [rows[rennenHeaderRowIdx], rows[rennenHeaderRowIdx + 1] || []];

  let rowIdxForLabels = -1, cRang=-1, cFahrer=-1, cKonstrukteur=-1, cPunkte=-1;
  for (let k = 0; k < candidateRows.length; k++) {
    const row = candidateRows[k] || [];
    cRang         = findCol(row, "Rang");
    cFahrer       = findCol(row, "Fahrer");
    cKonstrukteur = findCol(row, "Konstrukteur");
    cPunkte       = findCol(row, "Punkte");
    if (cFahrer !== -1 && cKonstrukteur !== -1) { rowIdxForLabels = rennenHeaderRowIdx + k; break; }
  }
  if (rowIdxForLabels === -1) {
    throw new Error("Konnte die Spalten 'Fahrer'/'Konstrukteur' nicht lokalisieren.");
  }

  // 3) Optional: Logo = Spalte direkt rechts von "Konstrukteur", wenn diese Zellen wie IMAGE/URL aussehen
  let cLogo = cKonstrukteur + 1;

  return {
    headerRow: rowIdxForLabels,
    cols: { rang: cRang, fahrer: cFahrer, konstrukteur: cKonstrukteur, logo: cLogo, punkte: cPunkte }
  };
}

/******** Render ********/
async function loadRaceCSV() {
  const tbody = document.querySelector(".results-table tbody");
  tbody.innerHTML = `<tr><td colspan="8">Lade Rennergebnis…</td></tr>`;
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error("CSV fetch failed: " + res.status);
    const text = await res.text();
    const rows = parseCSV(text);

    // Spalten dynamisch anhand der „Rennen“-Sektion ermitteln
    const { headerRow, cols } = detectRaceColumns(rows);

    // Daten beginnen i. d. R. 1–2 Zeilen unter den Labels; hier: nächste Zeile
    const firstDataRow = headerRow + 1;

    tbody.innerHTML = "";
    let rendered = 0;

    for (let r = firstDataRow; r < rows.length && rendered < DRIVER_ROWS; r++) {
      const row = rows[r] || [];
      const name = norm(row[cols.fahrer]);
      const team = norm(row[cols.konstrukteur]);
      const punkte = norm(row[cols.punkte]);
      // akzeptiere nur „echte“ Fahrerzeilen: Fahrer oder Team vorhanden
      if (!name && !team && !punkte) continue;

      const rang = cols.rang !== -1 ? norm(row[cols.rang]) : "";
      let teamCell = team;
      // Logo, falls direkt rechts neben „Konstrukteur“
      if (cols.logo > -1 && row[cols.logo]) {
        const logoUrl = extractImageUrl(row[cols.logo]);
        if (logoUrl) teamCell = `<img src="${logoUrl}" alt="" style="height:18px;vertical-align:middle;margin-right:6px;">${teamCell}`;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${rang}</td>
        <td>${name}</td>
        <td>${teamCell}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td>${punkte}</td>
      `;
      tbody.appendChild(tr);
      rendered++;
    }

    if (!rendered) {
      tbody.innerHTML = `<tr><td colspan="8">Keine Ergebnisdaten unter 'Rennen' gefunden.</td></tr>`;
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="8">Fehler: ${err.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", loadRaceCSV);
