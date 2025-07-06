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
        const rows = csv.split(/\r?\n/);
        const punkteTabelle = [25, 22, 19, 16, 14, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
        let foundHeader = false;
        tableBody.innerHTML = "";

        // Titel setzen
        const fileName = filePath.split("/").pop().replace(".csv", "");
        const parts = fileName.split("_");
        if (parts.length === 2) {
          const strecke = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          titleEl.textContent = `${strecke} GP – ${parts[1].replaceAll(".", ".")}`;
        } else {
          titleEl.textContent = fileName;
        }

        for (const row of rows) {
          const clean = row.trim();
          if (!foundHeader && clean.toLowerCase().includes("pos") && clean.toLowerCase().includes("fahrer")) {
            foundHeader = true;
            continue;
          }
          if (!foundHeader || clean === "") continue;

          const values = clean.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.replace(/^"|"$/g, ""));
          if (values.length >= 8) {
            const [pos, fahrer, team, grid, stopps, beste, zeit] = values;
            const punkte = punkteTabelle[parseInt(pos) - 1] || 0;
            const teamImg = `<img src="Teams/${team}.png" alt="${team}" class="team-logo">`;
            tableBody.innerHTML += `<tr><td class="rank-${pos}">${pos}</td><td>${fahrer}</td><td>${teamImg}</td><td>${grid}</td><td>${stopps}</td><td>${beste}</td><td>${zeit}</td><td>${punkte}</td></tr>`;
          }
        }

        if (!foundHeader) {
          tableBody.innerHTML = '<tr><td colspan="8">Keine Ergebnisdaten gefunden.</td></tr>';
        }
      });
  }
});
