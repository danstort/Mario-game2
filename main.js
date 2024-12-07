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

    let personajeMario;
    let posicion = 0;

    const TOPEDERECHA = 580;

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
            imagen, tileX, tileY, tileSize, tileSize, destinoX, destinoY, tileSize, tileSize
        );
    }

    // Dibujar el suelo con 2 filas de tiles
    function dibujarSuelo(tile) {
        const { tileSize } = tile;
        const canvasHeight = canvas.height;

        for (let y = canvasHeight - tileSize * 2; y < canvasHeight; y += tileSize) {
            for (let x = 0; x < canvas.width; x += tileSize) {
                dibujarTile(tile, x, y);
            }
        }
    }

    let tileSuelo;
    let imagenPersonajes;

    cargarImagen('img/tiles.png').then(imagen => {
        tileSuelo = new Tile(imagen, 0, 0, 16);
    });

    cargarImagen('img/personajes.gif').then(imagen => {
        imagenPersonajes = imagen;
    });

    class Mario {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.animacion = [[312, 0], [330, 0]]; // Posiciones del sprite
            this.ancho = 18;
            this.alto = 34;
            this.velocidad = 1;
        }

        dibujar() {
            if (!imagenPersonajes) return;
            ctx.drawImage(
                imagenPersonajes,
                this.animacion[posicion][0], this.animacion[posicion][1], // Sprite recorte
                18, 34, // Tamaño del recorte
                this.x, this.y, // Posición en canvas
                this.ancho, this.alto // Tamaño en canvas
            );
        }

        animar() {
            posicion = (posicion + 1) % this.animacion.length;
        }
    }

    Mario.prototype.generaPosicionDerecha = function () {

		this.x = this.x + this.velocidad;

		if (this.x > TOPEDERECHA) {

			
			this.x = TOPEDERECHA;
		}

		this.animacion = [[312, 0], [330, 0]];
	}


    function iniciarJuego() {
        if (!gameRunning) {
            gameRunning = true;
            lives = 3;
            livesDisplay.textContent = `Vidas: ${lives}`;
            console.log("Juego iniciado");
            bucleJuego(); // Iniciar el bucle del juego
        }
    }

    function actualizarJuego() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar suelo
        if (tileSuelo) {
            dibujarSuelo(tileSuelo);
        }

        // Dibujar Mario
        if (personajeMario) {
            personajeMario.dibujar();
        }
    }

    function bucleJuego() {
        if (!gameRunning) return;

        actualizarJuego();
        requestAnimationFrame(bucleJuego);
    }

    function iniciarAnimacionMario() {
        setInterval(() => {
            if (gameRunning && personajeMario) {
                personajeMario.animar();
            }
        }, 1000 / 8); // 8 frames por segundo
    }

    personajeMario = new Mario(10, 335);

    function activaMovimiento(evt) {

		switch (evt.keyCode) {


			// Right arrow.
			case 39:
				xDerecha = true;
				break;

			case 37:
				xIzquierda = true;
				break;

			case 38:
				xArriba = true;
				break;

			case 40:
				xAbajo = true;
				break;

		}
	}

    startButton.addEventListener("click", iniciarJuego);

    document.addEventListener("keydown", activaMovimiento, false);
	//document.addEventListener("keyup", desactivaMovimiento, false);
    // Iniciar animación de Mario
    iniciarAnimacionMario();
};