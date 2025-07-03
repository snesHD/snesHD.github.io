document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("csvInput");
  const tbody = document.querySelector(".results-table tbody");
  const titleEl = document.getElementById("rennen-title");

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length === 0) return;

    const file = fileInput.files[0];

    // 🟡 Dynamischer Titel basierend auf Dateiname
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // ohne .csv
    const parts = fileName.split("_");
    if (parts.length === 2) {
      const strecke = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const datumParts = parts[1].split(".");
      if (datumParts.length === 3) {
        const datumDE = `${datumParts[0]}.${datumParts[1]}.20${datumParts[2]}`;
        titleEl.textContent = `${strecke} GP – ${datumDE}`;
      } else {
        titleEl.textContent = `${strecke} GP`;
      }
    } else {
      titleEl.textContent = fileName;
    }

    // 🟢 Datei einlesen
    const reader = new FileReader();
    reader.onload = function (e) {
      const csv = e.target.result;
      const rows = csv.split(/\r?\n/);
      tbody.innerHTML = "";

      const punkteTabelle = [25, 22, 19, 16, 14, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
      let foundHeader = false;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i].trim();

        if (
          !foundHeader &&
          row.toLowerCase().includes("pos") &&
          row.toLowerCase().includes("fahrer") &&
          row.toLowerCase().includes("team") &&
          row.toLowerCase().includes("zeit")
        ) {
          foundHeader = true;
          continue;
        }

        if (!foundHeader || row === "") continue;

        const values = row
          .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
          .map((v) => v.replace(/^"|"$/g, ""));

        if (values.length >= 8) {
          const [pos, fahrer, team, grid, stopps, beste, zeit] = values;
          const punkte = punkteTabelle[parseInt(pos, 10) - 1] || 0;
          const teamImg = `<img src="Teams/${team}.png" alt="${team}" class="team-logo">`;
          tbody.innerHTML += `<tr><td class="rank-${pos}">${pos}</td><td>${fahrer}</td><td>${teamImg}</td><td>${grid}</td><td>${stopps}</td><td>${beste}</td><td>${zeit}</td><td>${punkte}</td></tr>`;
        }
      }

      if (!foundHeader) {
        tbody.innerHTML = '<tr><td colspan="8">Keine Ergebnisdaten gefunden.</td></tr>';
      }
    };

    reader.readAsText(file);
  });
});
