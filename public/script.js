function applyFilter() {
  const column = document.getElementById('filterColumn').value;
  const value = document.getElementById('filterValue').value;
  fetch(`/api/filter?column=${column}&value=${value}`)
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById('resultsTable');
      table.innerHTML = '';

      if (data.length === 0) {
        table.innerHTML = '<tr><td>No results found</td></tr>';
        return;
      }

      // Create table headers
      const headers = Object.keys(data[0]);
      const headerRow = document.createElement('tr');
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      // Create table rows
      data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
          const td = document.createElement('td');
          td.textContent = row[header];
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
    });
}
