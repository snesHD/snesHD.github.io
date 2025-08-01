document.addEventListener("DOMContentLoaded", function () {
  const tbody = document.querySelector(".race-control-table tbody");
  const rennenList = document.getElementById("rennenList");
  const titleEl = document.getElementById("rennen-title");

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
        tbody.innerHTML = "";

        let foundHeader = false;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i].trim();

          if (
            !foundHeader &&
            row.toLowerCase().includes("runde") &&
            row.toLowerCase().includes("fahrer") &&
            row.toLowerCase().includes("strafe")
          ) {
            foundHeader = true;
            continue;
          }

          if (!foundHeader || row === "") continue;

          const values = row
            .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
            .map((v) => v.replace(/^"|"$/g, ""));

          if (values.length >= 6) {
            const [zeit, runde, fahrer, team, vorfall, strafe] = values;
            const teamImg = `<img src="Teams/${team}.png" alt="${team}" class="team-logo">`;
            tbody.innerHTML += `<tr><td>${zeit}</td><td>${runde}</td><td>${fahrer}</td><td>${teamImg}</td><td>${vorfall}</td><td>${strafe}</td></tr>`;
          }
        }

        if (!foundHeader) {
          tbody.innerHTML =
            '<tr><td colspan="6">Keine Rennleitungsdaten gefunden.</td></tr>';
        }

        // Titel setzen (optional)
        if (titleEl) {
          const fileName = filePath.split("/").pop().replace(".csv", "");
          const parts = fileName.split("_");
          if (parts.length === 2) {
            const strecke = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            titleEl.textContent = `${strecke} GP – ${parts[1]}`;
          } else {
            titleEl.textContent = fileName;
          }
        }
      });
  }
});
