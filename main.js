window.onload = function () {
    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    const saltoSonido = document.getElementById("salto-sonido");
    const monedaSonido = document.getElementById("moneda-sonido");
    const aplastarSonido = document.getElementById("aplastar-sonido");
    const golpeSonido = document.getElementById("golpe-sonido");
    const gameOverSonido = document.getElementById("game-over-sonido");


    const startButton = document.getElementById("start-button");
    const botonPausa = document.getElementById("boton-pausa");
    const botonReiniciar = document.getElementById("boton-reiniciar");

    botonPausa.disabled = true;
    botonReiniciar.disabled = true;

    const livesDisplay = document.getElementById("lives");  // Elemento para mostrar las vidas
    const highScoreDisplay = document.getElementById("high-score"); // Elemento para mostrar la mejor puntuación
    const scoreDisplay = document.getElementById("score");  // Elemento para mostrar la puntuación actual
    const nivelDisplay = document.getElementById("nivel-actual");  // Elemento para mostrar el nivel actual

    let lives = 3; // Vidas iniciales
    let nivel = 1; // Nivel inicial
    let score = 0; // Puntuación actual
    let ultimoHito = 0; 

    let highScore = localStorage.getItem("highScore") || 0; // Mejor puntuación
    let gameRunning = false; // Indica si el juego está en ejecución. Por defecto, el juego no está en ejecución.

    highScoreDisplay.textContent = `Mejor Puntuación: ${highScore}`;
    scoreDisplay.textContent = `Puntuación: ${score}`;
    nivelDisplay.textContent = `Nivel: ${nivel}`;

    let personajeMario;
    let nubes = [];
    let enemigos = [];
    let posicion = 0;

    const TOPEDERECHA = 580;
    const TOPEIZQUIERDA = 0;
    const TOPEABAJO = canvas.height - 82;

    const ENEMY_SPEED = 1.5;
    const ENEMY_GENERATION_INTERVAL = 3000;
    const NUBE_VELOCIDAD = 1; // Velocidad de las nubes
    const NUBE_INTERVALO = 1500;
    const ENEMY_BASE_SPEED = 1.5; // Velocidad base de los enemigos
    let velocidadEnemigoActual = ENEMY_BASE_SPEED;

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

            if (saltoSonido) {
                saltoSonido.currentTime = 0; // Reiniciar el sonido si ya se está reproduciendo
                saltoSonido.play();
            }
        }
    }

    class Enemigo {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.ancho = 30;
            this.alto = 30;
            this.velocidad = velocidadEnemigoActual; 
            this.sprite = [[294, 185], [313, 185]];
            this.spriteIndex = 0;
            this.animacionDelay = 300; // Tiempo entre fotogramas en milisegundos
            this.animacionTimer = 0;  // Temporizador para el cambio de sprite
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

        dibujar(deltaTime) {
            if (!imagenPersonajes) return;

            // Animar antes de dibujar
            this.animar(deltaTime);

            ctx.drawImage(
                imagenPersonajes,
                this.sprite[this.spriteIndex][0], this.sprite[this.spriteIndex][1],
                20, 20,
                this.x, this.y,
                this.ancho, this.alto
            );
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

    function actualizarNivel() {
        const nuevoNivel = Math.floor(score / 100) + 1; // Calcula el nivel según la puntuación
        if (nuevoNivel > nivel) {
            nivel = nuevoNivel; // Actualiza el nivel
            nivelDisplay.textContent = `Nivel: ${nivel}`; // Muestra el nuevo nivel
            ajustarVelocidadEnemigos(); // Incrementa la velocidad de los enemigos
        }
    }

    function comprobarIncrementoVida() {
        if (score >= ultimoHito + 500) { // Si la puntuación supera el siguiente múltiplo de 500
            lives++; // Incrementa una vida
            ultimoHito += 500; // Actualiza el último hito alcanzado
            livesDisplay.textContent = `Vidas: ${lives}`; // Actualiza el texto de las vidas
        }
    }

    function ajustarVelocidadEnemigos() {
        enemigos.forEach(enemigo => {
            enemigo.velocidad *= 1.25; // Incrementa la velocidad de cada enemigo
        });
        ajustarVelocidadBase(); // Ajusta la velocidad base para los nuevos enemigos
    }

    function ajustarVelocidadBase() {
        velocidadEnemigoActual *= 1.25; // Incrementa la velocidad base de los nuevos enemigos
    }

    class CajaMoneda {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.ancho = 32;
            this.alto = 32;
            this.velocidad = 2; // Velocidad de desplazamiento de derecha a izquierda

            // Coordenadas de los sprites de la animación
            this.sprites = [
                [385, 18],  // Primer fotograma
                [385, 82], // Segundo fotograma

            ];
            this.spriteIndex = 0;       // Índice del fotograma actual
            this.animacionDelay = 200; // Tiempo entre fotogramas (ms)
            this.animacionTimer = 0;    // Temporizador para la animación
        }

        mover() {
            this.x -= this.velocidad;
        }

        animar(deltaTime) {
            this.animacionTimer += deltaTime;

            if (this.animacionTimer >= this.animacionDelay) {
                // Cambiar al siguiente fotograma
                this.spriteIndex = (this.spriteIndex + 1) % this.sprites.length;
                this.animacionTimer = 0;
            }
        }

        dibujar() {
            if (!tileSuelo) return;
            const [spriteX, spriteY] = this.sprites[this.spriteIndex];

            ctx.drawImage(
                tileSuelo.imagen,
                spriteX, spriteY, 16, 13.8, // Coordenadas y tamaño del sprite en la imagen
                this.x, this.y, this.ancho, this.alto // Coordenadas y tamaño en el canvas
            );
        }

        fueraDePantalla() {
            return this.x + this.ancho < 0;
        }

        colisionConMario(mario) {
            const colisionX = mario.x < this.x + this.ancho && mario.x + mario.ancho > this.x;
            const colisionY = mario.y < this.y + this.alto && mario.y + mario.alto > this.y;

            return colisionX && colisionY;
        }
    }

    // Array para almacenar las cajas de monedas
    let cajasMoneda = [];

    // Función para generar cajas de monedas
    function generarCajaMoneda() {
        if (!gameRunning || paused) return;

        const x = canvas.width; // Aparecen desde la derecha
        const y = (canvas.height - 190) - (Math.random() * 50);
        const caja = new CajaMoneda(x, y);
        cajasMoneda.push(caja);
    }

    // Actualizar la lógica de las cajas de monedas en cada cuadro
    function actualizarCajasMoneda(deltaTime) {
        cajasMoneda.forEach((caja, index) => {
            caja.mover();
            caja.animar(deltaTime); // Actualizar animación
            caja.dibujar();

            // Comprobar colisión con Mario
            if (caja.colisionConMario(personajeMario)) {
                cajasMoneda.splice(index, 1); // Eliminar la caja
                score += 10; // Incrementar puntuación actual
                scoreDisplay.textContent = `Puntuación: ${score}`;
                if (monedaSonido) {
                    monedaSonido.currentTime = 0; // Reiniciar el sonido si ya se está reproduciendo
                    monedaSonido.play();
                }
            }

            // Eliminar cajas que salen de la pantalla
            if (caja.fueraDePantalla()) {
                cajasMoneda.splice(index, 1);
            }
        });
    }



    function detenerJuego() {
        gameRunning = false;
        paused = true;
        teclas.derecha = false;
        teclas.izquierda = false;
        teclas.arriba = false;
        botonPausa.disabled = true;
        botonReiniciar.disabled = false;
        startButton.disabled = true;

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
        botonPausa.textContent = "Pausar juego"; // Restablece el texto del botón "Pausar juego"
        personajeMario = new Mario(10, 318);
        enemigos = [];
        nubes = [];
        lives = 3;
        score = 0;
        nivel = 1;
        ultimoHito = 0;
        velocidadEnemigoActual = ENEMY_BASE_SPEED; // Restablece la velocidad base de los enemigos
        livesDisplay.textContent = `Vidas: ${lives}`;
        scoreDisplay.textContent = `Puntuación: ${score}`;
        nivelDisplay.textContent = `Nivel: ${nivel}`;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore); // Guardar mejor puntuación
            highScoreDisplay.textContent = `Mejor Puntuación: ${highScore}`;
        }

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

    function actualizarJuego(deltaTime) {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (tileSuelo) {
            dibujarSuelo(tileSuelo);
        }

        if (personajeMario) {
            personajeMario.mover();
            personajeMario.dibujar();
        }

        actualizarCajasMoneda(deltaTime);

        enemigos.forEach((enemigo, index) => {
            enemigo.mover();
            enemigo.dibujar(16);

            const colision = detectarColision(personajeMario, enemigo);
            if (colision === "aplastar") {
                enemigos.splice(index, 1);
                score += 20;
                scoreDisplay.textContent = `Puntuación: ${score}`;

                if (aplastarSonido) {
                    aplastarSonido.currentTime = 0; // Reiniciar el sonido si ya se está reproduciendo
                    aplastarSonido.play();
                }

            } else if (colision === "colision") {
                enemigos.splice(index, 1);
                lives--;
                livesDisplay.textContent = `Vidas: ${lives}`;

                if (golpeSonido) {
                    golpeSonido.currentTime = 0; // Reiniciar el sonido si ya se está reproduciendo
                    golpeSonido.play();
                }


                if (lives <= 0) {
                    detenerJuego();
                    if (gameOverSonido) {
                        gameOverSonido.currentTime = 0; // Reiniciar el sonido si ya se está reproduciendo
                        gameOverSonido.play();

                        // Esperar a que el sonido termine antes de mostrar el alert
                        gameOverSonido.onended = () => {
                            if (score > highScore) {
                                highScore = score;
                                localStorage.setItem("highScore", highScore); // Guardar mejor puntuación
                                highScoreDisplay.textContent = `Mejor Puntuación: ${highScore}`;

                            }

                            alert("¡Has perdido! Reinicia el juego.");

                        };
                    }
                }
            }

            if (enemigo.fueraDePantalla()) {
                enemigos.splice(index, 1);
            }
        });


        actualizarNivel();
        comprobarIncrementoVida();

        nubes.forEach((nube, index) => {
            nube.mover();
            nube.animar(16); // Simular deltaTime fijo
            nube.dibujar();

            if (nube.fueraDePantalla()) {
                nubes.splice(index, 1);
            }
        });
    }


    const CAJA_MONEDA_INTERVALO = 4000;
    setInterval(generarCajaMoneda, CAJA_MONEDA_INTERVALO);

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
        actualizarJuego(deltaTime);

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