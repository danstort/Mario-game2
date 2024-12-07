window.onload = function () {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    const startButton = document.getElementById("start-button");
    const botonPausa = document.getElementById("boton-pausa"); // Botón Pausar
    const botonReiniciar = document.getElementById("boton-reiniciar"); // Botón Reiniciar

    // Deshabilitar botones inicialmente
    botonPausa.disabled = true;
    botonReiniciar.disabled = true;

    const livesDisplay = document.getElementById("lives");
    const highScoreDisplay = document.getElementById("high-score");

    let lives = 3;
    let highScore = localStorage.getItem("highScore") || 0;
    let gameRunning = false;

    highScoreDisplay.textContent = `Mejor Puntuación: ${highScore}`;

    let personajeMario;
    let posicion = 0;

    const TOPEDERECHA = 580;
    const TOPEIZQUIERDA = 0;
    const TOPEARRIBA = 0;
    const TOPEABAJO = canvas.height - 82;

    // Control de teclas pulsadas
    const teclas = {
        derecha: false,
        izquierda: false,
        arriba: false,
        abajo: false,
    };

    let paused = false; // Estado del juego pausado

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

    // Dibujar el suelo con 2 filas de tiles
    function dibujarSuelo(tile) {
        const { tileSize } = tile;
        const canvasHeight = canvas.height;

        for (let y = canvasHeight - tileSize * 2; y < canvasHeight; y += tileSize) {
            for (let x = 0; x < canvas.width; x += tileSize) {
                ctx.drawImage(
                    tile.imagen, tile.tileX, tile.tileY, tileSize, tileSize,
                    x, y, tileSize, tileSize
                );
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
            this.ancho = 27;
            this.alto = 51;
            this.velocidad = 2;

            this.saltando = false;
            this.velocidadSalto = 0;
            this.gravedad = 0.5; // Simula la fuerza de gravedad

            // Control de animación
            this.animacionDelay = 140; // Tiempo en milisegundos entre fotogramas
            this.animacionTimer = 0;   // Temporizador interno
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

        animar(deltaTime) {
            this.animacionTimer += deltaTime;

            if (this.animacionTimer >= this.animacionDelay) {
                posicion = (posicion + 1) % this.animacion.length;
                this.animacionTimer = 0; // Reinicia el temporizador
            }
        }

        mover() {
            if (teclas.derecha) {
                this.x += this.velocidad;
                if (this.x > TOPEDERECHA) this.x = TOPEDERECHA;
                this.animacion = [[312, 0], [330, 0]];
            }
            if (teclas.izquierda) {
                this.x -= this.velocidad;
                if (this.x < TOPEIZQUIERDA) this.x = TOPEIZQUIERDA;
                this.animacion = [[164, 0], [182, 0]];
            }
            if (this.saltando) {
                // Si está saltando, aplica física del salto
                this.y -= this.velocidadSalto; // Aplica velocidad inicial hacia arriba
                this.velocidadSalto -= this.gravedad; // Gravedad reduce la velocidad

                // Detener el salto cuando alcanza el suelo
                if (this.y >= TOPEABAJO) {
                    this.y = TOPEABAJO;
                    this.saltando = false;
                }
            }
        }

        saltar() {
            if (!this.saltando) {
                this.saltando = true;
                this.velocidadSalto = 13; // Velocidad inicial del salto
            }
        }
    }

    function iniciarJuego() {
        if (!gameRunning) {
            gameRunning = true;

            // Habilitar botones
            botonPausa.disabled = false;
            botonReiniciar.disabled = false;

            lives = 3;
            livesDisplay.textContent = `Vidas: ${lives}`;
            console.log("Juego iniciado");
            bucleJuego(0); // Iniciar el bucle del juego
        }
    }

    function actualizarJuego() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar suelo
        if (tileSuelo) {
            dibujarSuelo(tileSuelo);
        }

        // Mover y dibujar Mario
        if (personajeMario) {
            personajeMario.mover();
            personajeMario.dibujar();
        }
    }

    let lastTime = 0;

    function bucleJuego(timeStamp) {
        if (!gameRunning || paused) return;

        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        personajeMario.animar(deltaTime);
        actualizarJuego();

        requestAnimationFrame(bucleJuego);
    }

    function pausarJuego() {
        paused = !paused; // Alterna entre pausado y reanudar
        botonPausa.textContent = paused ? "Reanudar juego" : "Pausar juego";

        if (!paused) {
            requestAnimationFrame(bucleJuego); // Reanuda el bucle
        }
    }

    function reiniciarJuego() {
        gameRunning = false;
        paused = false;
        personajeMario = new Mario(10, 318); // Reinicia Mario
        lives = 3;
        livesDisplay.textContent = `Vidas: ${lives}`;
        iniciarJuego(); // Reinicia el juego
    }

    personajeMario = new Mario(10, 318);

    function activaMovimiento(evt) {
        switch (evt.keyCode) {
            case 39: // Flecha derecha
                teclas.derecha = true;
                break;
            case 37: // Flecha izquierda
                teclas.izquierda = true;
                break;
            case 38: // Flecha arriba
                personajeMario.saltar();
                break;
        }
    }

    function desactivaMovimiento(evt) {
        switch (evt.keyCode) {
            case 39: // Flecha derecha
                teclas.derecha = false;
                break;
            case 37: // Flecha izquierda
                teclas.izquierda = false;
                break;
        }
    }

    startButton.addEventListener("click", iniciarJuego);
    botonPausa.addEventListener("click", pausarJuego);
    botonReiniciar.addEventListener("click", reiniciarJuego);
    document.addEventListener("keydown", activaMovimiento, false);
    document.addEventListener("keyup", desactivaMovimiento, false);
};