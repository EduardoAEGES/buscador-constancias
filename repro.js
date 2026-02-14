
const csvData = `"0106672532De","0106672532De_Carrillo Larez, Barbara Del Valle.pdf","https://drive.google.com/file/d/1NFI1I-QPHqrdwbcJAK5SYy3vRYsyge9V/preview?usp=drivesdk"`;

const rows = [csvData];
const baseDatos = [];

rows.forEach(fila => {
  const columnas = fila.split(",");
  console.log("Original: ", fila);
  console.log("Split columns: ", columnas);
  if (columnas.length >= 3) {
    // Current logic in index.html
    const codigo = columnas[0].replace(/"/g, "").trim();
    const nombre = columnas[1].replace(/"/g, "").trim();
    // This is where the bug is likely happening
    const url = columnas[2].replace(/"/g, "").trim();
    
    console.log("Parsed URL: ", url);
  }
});
