window.onload = function () {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    const startButton = document.getElementById("start-button");
    const livesDisplay = document.getElementById("lives");
    const highScoreDisplay = document.getElementById("high-score");

    let lives = 3;
    let highScore = localStorage.getItem("highScore") || 0;
    let gameRunning = false;

    highScoreDisplay.textContent = `Mejor Puntuación: ${highScore}`;

    // Clase para manejar un tile
    function Tile(imagen, tileX, tileY, tileSize) {
        this.imagen = imagen;
        this.tileX = tileX;
        this.tileY = tileY;
        this.tileSize = tileSize;
    }

    // Cargar imagen
    function cargarImagen(url) {
        return new Promise(resolve => {
            const imagen = new Image();
            imagen.onload = () => resolve(imagen);
            imagen.src = url;
        });
    }

    // Función para dibujar un tile específico
    function dibujarTile(tile, destinoX, destinoY) {
        const { imagen, tileX, tileY, tileSize } = tile;
        ctx.drawImage(
            imagen,           // Imagen fuente
            tileX, tileY,     // Coordenadas del tile en la imagen
            tileSize, tileSize, // Tamaño del tile en la imagen
            destinoX, destinoY, // Coordenadas en el canvas
            tileSize, tileSize  // Tamaño en el canvas
        );
    }

    // Dibujar el suelo con 2 filas de tiles
    function dibujarSuelo(tile) {
        const { tileSize } = tile;
        const canvasHeight = canvas.height;

        // Dibujar 2 filas desde el borde inferior del canvas
        for (let y = canvasHeight - tileSize * 2; y < canvasHeight; y += tileSize) {
            for (let x = 0; x < canvas.width; x += tileSize) {
                dibujarTile(tile, x, y);
            }
        }
    }

    // Inicializar el tile del suelo
    let tileSuelo;

    cargarImagen('img/tiles.png').then(imagen => {
        tileSuelo = new Tile(imagen, 0, 0, 16); // Tile de suelo en (0, 25) con tamaño 25x25
    });

    // Función para iniciar el juego
    function iniciarJuego() {
        if (!gameRunning) {
            gameRunning = true;
            lives = 3;
            livesDisplay.textContent = `Vidas: ${lives}`;
            console.log("Juego iniciado");
        }

        // Esperar a que el tile esté listo antes de dibujar el suelo
        if (tileSuelo) {
            dibujarSuelo(tileSuelo);
        } else {
            console.error("El tile del suelo no está listo.");
        }
    }

    // Añadir event listener al botón de inicio
    startButton.addEventListener("click", iniciarJuego);
};