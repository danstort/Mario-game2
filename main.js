window.onload = function () {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    const startButton = document.getElementById("start-button");
    const botonPausa = document.getElementById("boton-pausa");
    const botonReiniciar = document.getElementById("boton-reiniciar");

    botonPausa.disabled = true;
    botonReiniciar.disabled = true;

    const livesDisplay = document.getElementById("lives");
    const highScoreDisplay = document.getElementById("high-score");

    let lives = 3;
    let highScore = localStorage.getItem("highScore") || 0;
    let gameRunning = false;

    highScoreDisplay.textContent = `Mejor Puntuación: ${highScore}`;

    let personajeMario;
    let nubes = [];
    let enemigos = [];
    let posicion = 0;

    const TOPEDERECHA = 580;
    const TOPEIZQUIERDA = 0;
    const TOPEABAJO = canvas.height - 82;

    const ENEMY_SPEED = 2;
    const ENEMY_GENERATION_INTERVAL = 3000;
    const NUBE_VELOCIDAD = 1; // Velocidad de las nubes
    const NUBE_INTERVALO = 5000;

    let paused = false;
    let enemyIntervalId = null; // Identificador del intervalo para enemigos
    let nubeIntervaloId = null; // Identificador del intervalo para nubes
    let tileSuelo;
    let imagenNubes;
    let imagenPersonajes;

    function cargarImagen(url) {
        return new Promise(resolve => {
            const imagen = new Image();
            imagen.onload = () => resolve(imagen);
            imagen.src = url;
        });
    }

    cargarImagen('img/tiles.png').then(imagen => {
        tileSuelo = new Tile(imagen, 0, 0, 16);
        imagenNubes = imagen;
    });

    cargarImagen('img/personajes.gif').then(imagen => {
        imagenPersonajes = imagen;
    });

    class Tile {
        constructor(imagen, tileX, tileY, tileSize) {
            this.imagen = imagen;
            this.tileX = tileX;
            this.tileY = tileY;
            this.tileSize = tileSize;
        }
    }


    class Nube {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.ancho = 64;
            this.alto = 32;
            this.velocidad = NUBE_VELOCIDAD;
            this.sprite = [[0, 320.4], [0, 415]]; // Coordenadas de los sprites de las nubes
            this.spriteIndex = 0;
            this.animacionDelay = 300; // Tiempo entre fotogramas
            this.animacionTimer = 0;
        }

        mover() {
            this.x -= this.velocidad;
        }

        animar(deltaTime) {
            this.animacionTimer += deltaTime;

            if (this.animacionTimer >= this.animacionDelay) {
                this.spriteIndex = (this.spriteIndex + 1) % this.sprite.length;
                this.animacionTimer = 0;
            }
        }

        dibujar() {
            if (!imagenNubes) return;
            ctx.drawImage(
                imagenNubes,
                this.sprite[this.spriteIndex][0], this.sprite[this.spriteIndex][1],
                40, 25,
                this.x, this.y,
                this.ancho, this.alto
            );
        }

        fueraDePantalla() {
            return this.x + this.ancho < 0;
        }
    }

    function generarNube() {
        if (!gameRunning || paused) return;
        const x = canvas.width;
        const y = Math.random() * (canvas.height / 2 - 50); // Mitad superior del canvas
        const nube = new Nube(x, y);
        nubes.push(nube);
    }


    class Mario {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.animacion = [[312, 0], [330, 0]];
            this.ancho = 27;
            this.alto = 51;
            this.velocidad = 2;

            this.saltando = false;
            this.velocidadSalto = 0;
            this.gravedad = 0.5;

            this.animacionDelay = 140;
            this.animacionTimer = 0;
        }

        dibujar() {
            if (!imagenPersonajes) return;
            ctx.drawImage(
                imagenPersonajes,
                this.animacion[posicion][0], this.animacion[posicion][1],
                18, 34,
                this.x, this.y,
                this.ancho, this.alto
            );
        }

        animar(deltaTime) {
            this.animacionTimer += deltaTime;

            if (this.animacionTimer >= this.animacionDelay) {
                posicion = (posicion + 1) % this.animacion.length;
                this.animacionTimer = 0;
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
                this.y -= this.velocidadSalto;
                this.velocidadSalto -= this.gravedad;

                if (this.y >= TOPEABAJO) {
                    this.y = TOPEABAJO;
                    this.saltando = false;
                }
            }
        }

        saltar() {
            if (!this.saltando) {
                this.saltando = true;
                this.velocidadSalto = 13;
            }
        }
    }

    class Enemigo {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.ancho = 30;
            this.alto = 30;
            this.velocidad = ENEMY_SPEED;
            this.sprite = [[294, 185], [314, 185]];
            this.spriteIndex = 0;
        }

        mover() {
            this.x -= this.velocidad;
        }

        dibujar() {
            if (!imagenPersonajes) return;
            ctx.drawImage(
                imagenPersonajes,
                this.sprite[this.spriteIndex][0], this.sprite[this.spriteIndex][1],
                20, 20,
                this.x, this.y,
                this.ancho, this.alto
            );

            this.spriteIndex = (this.spriteIndex + 1) % this.sprite.length;
        }

        fueraDePantalla() {
            return this.x + this.ancho < 0;
        }
    }

    function generarEnemigo() {
        if (!gameRunning || paused) return;
        const enemigo = new Enemigo(canvas.width, TOPEABAJO + 20);
        enemigos.push(enemigo);
    }

    function detectarColision(mario, enemigo) {
        const colisionX = mario.x < enemigo.x + enemigo.ancho && mario.x + mario.ancho > enemigo.x;
        const colisionY = mario.y < enemigo.y + enemigo.alto && mario.y + mario.alto > enemigo.y;

        if (colisionX && colisionY) {
            if (mario.y + mario.alto - enemigo.y < enemigo.alto / 2) {
                return "aplastar";
            }
            return "colision";
        }
        return null;
    }

    function detenerJuego() {
        gameRunning = false;
        paused = true;
        teclas.derecha = false;
        teclas.izquierda = false;
        teclas.arriba = false;
        botonPausa.disabled = true;
        botonReiniciar.disabled = false;

        clearInterval(enemyIntervalId); // Detener el intervalo de generación de enemigos
    }

    function iniciarJuego() {
        if (!gameRunning) {
            gameRunning = true;

            botonPausa.disabled = false;
            botonReiniciar.disabled = false;

            lives = 3;
            livesDisplay.textContent = `Vidas: ${lives}`;
            console.log("Juego iniciado");

            bucleJuego(0);

            clearInterval(enemyIntervalId); // Limpiar cualquier intervalo anterior
            enemyIntervalId = setInterval(generarEnemigo, ENEMY_GENERATION_INTERVAL);
            clearInterval(nubeIntervaloId); // Limpiar cualquier intervalo anterior
            nubeIntervaloId = setInterval(generarNube, NUBE_INTERVALO);
        }
    }

    function reiniciarJuego() {
        detenerJuego();
        paused = false;
        personajeMario = new Mario(10, 318);
        enemigos = [];
        lives = 3;
        livesDisplay.textContent = `Vidas: ${lives}`;
        highScore = 0;
        highScoreDisplay.textContent = `Mejor Puntuación: ${highScore}`;
        iniciarJuego();
    }

    personajeMario = new Mario(10, 318);

    const teclas = {
        derecha: false,
        izquierda: false,
        arriba: false,
    };

    function activaMovimiento(evt) {
        switch (evt.keyCode) {
            case 39:
                teclas.derecha = true;
                break;
            case 37:
                teclas.izquierda = true;
                break;
            case 38:
                personajeMario.saltar();
                break;
        }
    }

    function desactivaMovimiento(evt) {
        switch (evt.keyCode) {
            case 39:
                teclas.derecha = false;
                break;
            case 37:
                teclas.izquierda = false;
                break;
        }
    }

    function actualizarJuego() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (tileSuelo) {
            dibujarSuelo(tileSuelo);
        }

        if (personajeMario) {
            personajeMario.mover();
            personajeMario.dibujar();
        }

        enemigos.forEach((enemigo, index) => {
            enemigo.mover();
            enemigo.dibujar();

            const colision = detectarColision(personajeMario, enemigo);
            if (colision === "aplastar") {
                enemigos.splice(index, 1);
                highScore += 20;
                highScoreDisplay.textContent = `Mejor Puntuación: ${highScore}`;
            } else if (colision === "colision") {
                enemigos.splice(index, 1);
                lives--;
                livesDisplay.textContent = `Vidas: ${lives}`;

                if (lives <= 0) {
                    alert("¡Has perdido! Reinicia el juego.");
                    detenerJuego();
                }
            }

            if (enemigo.fueraDePantalla()) {
                enemigos.splice(index, 1);
            }
        });

        nubes.forEach((nube, index) => {
            nube.mover();
            nube.animar(16); // Simular deltaTime fijo
            nube.dibujar();

            if (nube.fueraDePantalla()) {
                nubes.splice(index, 1);
            }
        });
    }

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
        paused = !paused;
        botonPausa.textContent = paused ? "Reanudar juego" : "Pausar juego";

        if (!paused) {
            requestAnimationFrame(bucleJuego);
        }
    }

    startButton.addEventListener("click", iniciarJuego);
    botonPausa.addEventListener("click", pausarJuego);
    botonReiniciar.addEventListener("click", reiniciarJuego);
    document.addEventListener("keydown", activaMovimiento, false);
    document.addEventListener("keyup", desactivaMovimiento, false);
};