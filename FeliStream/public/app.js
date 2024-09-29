const client = new WebTorrent();
const fileInput = document.getElementById('file-input');
const seedButton = document.getElementById('seed-btn');
const downloadButton = document.getElementById('download-btn');
const magnetInput = document.getElementById('magnet-uri');
const videoPlayer = document.getElementById('video-player');
const videoInfo = document.getElementById('video-info');
const videoNameDisplay = document.getElementById('video-name');
const copyButton = document.getElementById('copy-btn');
const magnetList = document.getElementById('magnet-list');

// URL del backend
const BACKEND_URL = 'http://localhost:3001';

// Arreglo para almacenar los Magnet URI activos
let activeMagnets = [];

// Función para mostrar los Magnet URI en la lista
function updateMagnetList() {
    magnetList.innerHTML = ''; // Limpiar la lista actual

    // Añadir cada Magnet URI como un elemento de la lista con su nombre y botones de copiar/eliminar
    activeMagnets.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <strong>${item.name}</strong> - 
            <button onclick="copyToClipboard('${item.magnetURI}')">Copiar enlace</button>
            <button onclick="deleteMagnet('${item.id}')">Eliminar</button>
        `;
        magnetList.appendChild(listItem);
    });
}

// Función para copiar el enlace al portapapeles
function copyToClipboard(magnetURI) {
    const el = document.createElement('textarea');
    el.value = magnetURI;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert('Magnet URI copiado al portapapeles');
}

// Función para subir y compartir un video como peer
seedButton.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (file) {
        client.seed(file, (torrent) => {
            console.log('Seeding... Magnet URI:', torrent.magnetURI);

            // Mostrar el nombre del video y habilitar la opción de copiar el enlace
            videoNameDisplay.textContent = file.name;
            videoInfo.style.display = 'block';

            // Agregar el Magnet URI al botón de copiar
            copyButton.onclick = () => copyToClipboard(torrent.magnetURI);

            // Enviar el Magnet URI al backend
            fetch(`${BACKEND_URL}/magnets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: file.name,
                    magnetURI: torrent.magnetURI
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Magnet URI enviado al backend:', data);

                // Actualizar la lista de Magnet URI activos
                fetchActiveMagnets();
            })
            .catch(error => console.error('Error al enviar el Magnet URI:', error));
        });
    }
});

// Función para obtener la lista de Magnet URI activos desde el backend
function fetchActiveMagnets() {
    fetch(`${BACKEND_URL}/magnets`)
        .then(response => response.json())
        .then(data => {
            activeMagnets = data;
            updateMagnetList();
        })
        .catch(error => console.error('Error al obtener los Magnet URI activos:', error));
}

// Obtener la lista de Magnet URI activos al cargar la página
document.addEventListener('DOMContentLoaded', fetchActiveMagnets);

// Cambia el evento de clic para el botón de reproducir video
// Evento para manejar la reproducción del video desde un Magnet URI
downloadButton.addEventListener('click', () => {
    const magnetURI = magnetInput.value; // Obtener el Magnet URI ingresado

    if (magnetURI) {
        // Limpiar el reproductor de video actual antes de cargar el nuevo
        videoPlayer.pause(); 
        videoPlayer.src = ''; // Limpiar la fuente del video

        // Añadir el torrent utilizando WebTorrent
        client.add(magnetURI, (torrent) => {
            console.log('Torrent agregado:', torrent);

            // Buscar el archivo de video en el torrent (puede ser .mp4, .webm o .ogg)
            const file = torrent.files.find(file => file.name.endsWith('.mp4') || file.name.endsWith('.webm') || file.name.endsWith('.ogg'));

            if (file) {
                console.log('Archivo de video encontrado:', file.name);

                // Mostrar el reproductor de video
                videoPlayer.style.display = 'block'; 
                
                // Renderizar el archivo de video directamente en el reproductor HTML5
                file.renderTo(videoPlayer, {
                    autoplay: true // Iniciar la reproducción automáticamente
                });

                // Opcional: Mostrar el progreso de la descarga
                torrent.on('download', (bytes) => {
                    console.log(`Descargando... ${bytes} bytes`);
                });

                // Cuando el torrent se ha descargado completamente
                torrent.on('done', () => {
                    console.log('Descarga completada');
                });

                // Manejar cualquier error durante la descarga
                torrent.on('error', (err) => {
                    console.error('Error al descargar:', err.message);
                    alert('Error al intentar reproducir el video. Revisa el Magnet URI.');
                });

            } else {
                alert('No se encontró un archivo de video válido en el torrent.');
            }
        });
    } else {
        alert('Por favor, introduce un Magnet URI válido.');
    }
});


// Función para eliminar un Magnet URI
function deleteMagnet(id) {
    fetch(`${BACKEND_URL}/magnets/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al eliminar el Magnet URI');
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
        // Actualizar la lista de Magnet URI activos
        fetchActiveMagnets();
    })
    .catch(error => console.error('Error al eliminar el Magnet URI:', error));
}
