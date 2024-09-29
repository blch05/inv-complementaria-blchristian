const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Asegúrate de instalar uuid

const app = express();
const port = 3001;
const magnetsFilePath = path.join(__dirname, 'magnets.json');

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Función para leer los Magnet URIs desde el archivo
function readMagnetsFromFile() {
    if (fs.existsSync(magnetsFilePath)) {
        const data = fs.readFileSync(magnetsFilePath);
        return JSON.parse(data);
    }
    return [];
}

// Función para escribir los Magnet URIs en el archivo
function writeMagnetsToFile(magnets) {
    fs.writeFileSync(magnetsFilePath, JSON.stringify(magnets, null, 2));
}

// Obtener la lista de Magnet URIs
app.get('/magnets', (req, res) => {
    const magnets = readMagnetsFromFile();
    res.json(magnets);
});

// Agregar un nuevo Magnet URI
app.post('/magnets', (req, res) => {
    const { name, magnetURI } = req.body;
    const magnets = readMagnetsFromFile();
    
    // Crear un objeto Magnet URI con un ID único
    const newMagnet = {
        id: uuidv4(), // Generar un ID único
        name,
        magnetURI
    };
    
    magnets.push(newMagnet);
    writeMagnetsToFile(magnets);
    res.json({ message: 'Magnet URI agregado', magnet: newMagnet });
});

// Eliminar un Magnet URI
app.delete('/magnets/:id', (req, res) => {
    const { id } = req.params;
    const magnets = readMagnetsFromFile();
    const updatedMagnets = magnets.filter(magnet => magnet.id !== id);

    if (magnets.length === updatedMagnets.length) {
        return res.status(404).json({ message: 'Magnet URI no encontrado' });
    }

    writeMagnetsToFile(updatedMagnets);
    res.json({ message: 'Magnet URI eliminado' });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});
