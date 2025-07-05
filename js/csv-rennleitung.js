document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("csvInput");
  const tbody = document.querySelector(".race-control-table tbody");
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

  fileInput.addEventListener("change", function () {
    if (fileInput.files.length === 0) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const csv = e.target.result;
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
        tbody.innerHTML = '<tr><td colspan="6">Keine Rennleitungsdaten gefunden.</td></tr>';
      }
    };

    reader.readAsText(fileInput.files[0]);
  });
});
