function parseCSVLine(line) {
  const regex = /"(?:[^"]|"")*"/g;
  const matches = line.match(regex);
  if (!matches) return [];
  return matches.map(s => s.slice(1, -1).replace(/""/g, '"'));
}

function csvToJson(csv) {
  if(typeof csv === "string")
    csv = csv.trim().split('\n');
  
  const lines = csv;
  const headers = parseCSVLine(lines[0]);
  const data = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    return headers.reduce((obj, key, i) => {
      obj[key] = values[i];
      return obj;
    }, {});
  });
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector(".results-table tbody");
  const titleEl = document.getElementById("rennen-title");
  const rennenList = document.getElementById("rennenList");

  // Rennen aus JSON laden
  fetch("data/rennen.json")
    .then(res => res.json())
    .then(data => {
      data.forEach(file => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.textContent = file.replace(".csv", "").replace(/_/g, " ");
        button.onclick = () => ladeRennen(`ergebnisse/${file}`);
        li.appendChild(button);
        rennenList.appendChild(li);
      });
    });

  function ladeRennen(filePath) {
    fetch(filePath)
      .then(res => res.text())
      .then(csv => {
        const rows = csv.split("\n")
        rows.map(row => row.trim());

        const dataset2IndexStart = rows.findIndex(row => row.length == 0)

        const leaderboard = rows.splice(0, dataset2IndexStart)
        const raceManagment = rows.splice(3, rows.length - 3)

        const punkteTabelle = [25, 22, 19, 16, 14, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

        const data = {
          leaderboard: csvToJson(leaderboard),
          raceManagment: csvToJson(raceManagment)
        }

        data.leaderboard.forEach((val, index) => val["Pkt."] = punkteTabelle[index] || 0)

        tableBody.innerHTML = "";
        data.leaderboard.forEach(r => {
          const teamImg = `<img src="Teams/${r.Team}.png" alt="${r.Team}" class="team-logo">`;
          tableBody.innerHTML += `<tr><td class="rank-${r["Pos."]}">${r["Pos."]}</td><td>${r.Fahrer}</td><td>${teamImg}</td><td>${r.Grid}</td><td>${r.Stopps}</td><td>${r.Beste}</td><td>${r.Zeit}</td><td>${r["Pkt."]}</td></tr>`;
        })

        // Titel setzen
        const fileName = filePath.split("/").pop().replace(".csv", "");
        const parts = fileName.split("_");
        if (parts.length === 2) {
          const strecke = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          titleEl.textContent = `${strecke} GP – ${parts[1].replaceAll(".", ".")}`;
        } else {
          titleEl.textContent = fileName;
        }
      });
  }
});