console.log("App iniciada");

// ELEMENTOS

const btnStart =
    document.getElementById("btnStart");

const estado =
    document.getElementById("estado");

const textoVoz =
    document.getElementById("textoVoz");

const modoSelector =
    document.getElementById("modoSelector");

const historial =
    document.getElementById("historial");

// VARIABLES

let modoActual = "casa";

let ultimoHistorial = "";

let ultimoTiempoHistorial = 0;

let ultimaNotificacion = 0;

// DETECTAR IPHONE

const esIPhone =
    /iPhone|iPad|iPod/i.test(
        navigator.userAgent
    );

console.log(
    "¿Es iPhone?:",
    esIPhone
);

// MODOS

modoSelector.addEventListener(
    "change",
    () => {

        modoActual =
            modoSelector.value;

        actualizarEstado(
            `⚙️ ${modoActual.toUpperCase()}`
        );
    }
);

// NOTIFICACIONES

function enviarNotificacion(
    titulo,
    texto
) {

    const ahora = Date.now();

    if (
        Notification.permission !==
        "granted"
    ) return;

    if (
        ahora - ultimaNotificacion <
        10000
    ) return;

    ultimaNotificacion = ahora;

    const n =
        new Notification(
            titulo,
            {
                body: texto
            }
        );

    setTimeout(() => {

        n.close();

    }, 4000);
}

// HISTORIAL

function agregarHistorial(texto) {

    const ahora = Date.now();

    if (
        texto === ultimoHistorial ||
        ahora - ultimoTiempoHistorial <
        3000
    ) return;

    ultimoHistorial = texto;

    ultimoTiempoHistorial = ahora;

    const item =
        document.createElement("div");

    item.className =
        "historial-item";

    item.innerHTML =
        `[${new Date().toLocaleTimeString()}] ${texto}`;

    historial.prepend(item);

    setTimeout(() => {

        item.remove();

    }, 10000);

    while (
        historial.children.length > 5
    ) {

        historial.removeChild(
            historial.lastChild
        );
    }
}

// ESTADO

function actualizarEstado(texto) {

    estado.innerHTML = texto;
}

// INTERFAZ

function cambiarModo(tipo) {

    document.body.className =
        tipo;
}

// MICROFONO

async function iniciarMicrofono() {

    try {

        console.log(
            "Intentando acceder al micro..."
        );

        if (
            !navigator.mediaDevices
        ) {

            alert(
                "Micrófono no compatible"
            );

            return;
        }

        const stream =
            await navigator.mediaDevices
            .getUserMedia({
                audio: true
            });

        console.log(
            "Micro funcionando"
        );

        const audioContext =
            new(
                window.AudioContext ||
                window.webkitAudioContext
            )();

        // FIX IPHONE

        if (
            audioContext.state ===
            "suspended"
        ) {

            await audioContext.resume();
        }

        // VALIDACION IPHONE

        if (
            audioContext.state !==
            "running"
        ) {

            alert(
                "iPhone bloqueó el audio"
            );

            return;
        }

        const source =
            audioContext
            .createMediaStreamSource(
                stream
            );

        const analyser =
            audioContext
            .createAnalyser();

        // FIX IPHONE

        analyser.fftSize =
            esIPhone ? 128 : 256;

        source.connect(analyser);

        const data =
            new Uint8Array(
                analyser.frequencyBinCount
            );

        function analizar() {

            analyser.getByteFrequencyData(
                data
            );

            let promedio =
                data.reduce(
                    (a, b) => a + b
                ) / data.length;

            console.log(
                "Volumen:",
                promedio
            );

            // ALERTA

            if (promedio > 85) {

                cambiarModo(
                    "alerta"
                );

                actualizarEstado(
                    "🚨 Sonido fuerte"
                );

                agregarHistorial(
                    "🚨 Emergencia"
                );

                enviarNotificacion(
                    "🚨 ALERTA",
                    "Sonido fuerte detectado"
                );

            }

            // VOZ

            else if (
                promedio > 20
            ) {

                cambiarModo(
                    "voz"
                );

                actualizarEstado(
                    "🗣️ Voz detectada"
                );

                agregarHistorial(
                    "🗣️ Voz detectada"
                );

            }

            // NORMAL

            else {

                cambiarModo(
                    "normal"
                );

                actualizarEstado(
                    "🎧 Escuchando..."
                );
            }

            requestAnimationFrame(
                analizar
            );
        }

        analizar();

    } catch (error) {

        console.log(
            "ERROR MICRO:",
            error
        );

        actualizarEstado(
            "❌ Micrófono bloqueado"
        );

        alert(
            "❌ Permite acceso al micrófono"
        );
    }
}

// VOZ A TEXTO

let recognition = null;

if (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition
) {

    recognition =
        new(
            window.SpeechRecognition ||
            window.webkitSpeechRecognition
        )();

    // CONFIG

    recognition.lang = "es-ES";

    recognition.interimResults =
        true;

    recognition.continuous =
        true;

    recognition.maxAlternatives =
        1;

    // TEXTO RAPIDO

    recognition.onresult =
        (event) => {

            let texto = "";

            for (
                let i =
                event.resultIndex;

                i <
                event.results.length;

                i++
            ) {

                texto +=
                    event.results[i][0]
                    .transcript;
            }

            textoVoz.innerHTML =
                `✏️ ${texto}`;
        };

    // ERROR

    recognition.onerror =
        (e) => {

            console.log(
                "ERROR VOZ:",
                e
            );
        };

    // REINICIAR

    recognition.onend =
        () => {

            console.log(
                "Reconocimiento terminado"
            );

            // REINICIAR SOLO EN ANDROID/WINDOWS

            if (
                !esIPhone
            ) {

                try {

                    recognition.start();

                } catch (e) {

                    console.log(e);
                }
            }
        };

} else {

    textoVoz.innerHTML =
        "⚠️ Voz no compatible";
}

// BOTON

btnStart.addEventListener(
    "click",
    () => {

        Notification
            .requestPermission();

        btnStart.style.display =
            "none";

        actualizarEstado(
            "🎧 Sistema iniciado"
        );

        // SIN AWAIT PARA IPHONE

        iniciarMicrofono();

        // ACTIVAR VOZ SOLO
        // EN NO IPHONE

        if (
            recognition &&
            !esIPhone
        ) {

            try {

                recognition.start();

                console.log(
                    "Reconocimiento iniciado"
                );

            } catch (e) {

                console.log(e);
            }
        }
    }
);

// SERVICE WORKER

if (
    "serviceWorker" in navigator
) {

    navigator.serviceWorker
        .register("sw.js")

    .then(() => {

        console.log(
            "SW activo"
        );

    })

    .catch((e) => {

        console.log(
            "ERROR SW:",
            e
        );

    });
}
