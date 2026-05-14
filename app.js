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

let escuchando = false;

// IPHONE

const esIPhone =
    /iPhone|iPad|iPod/i.test(
        navigator.userAgent
    );

console.log(
    "¿Es iPhone?",
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
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            actualizarEstado(
                "❌ Micrófono no compatible"
            );

            alert(
                "Micrófono no compatible"
            );

            return;
        }

        // FIX IPHONE

        const stream =
            await navigator.mediaDevices
            .getUserMedia({

                audio: {

                    echoCancellation: false,

                    noiseSuppression: false,

                    autoGainControl: false
                }
            });

        console.log(
            "Micro funcionando"
        );

        const audioContext =
            new(
                window.AudioContext ||
                window.webkitAudioContext
            )();

        // FIX IOS

        if (
            audioContext.state ===
            "suspended"
        ) {

            await audioContext.resume();
        }

        const source =
            audioContext
            .createMediaStreamSource(
                stream
            );

        const analyser =
            audioContext
            .createAnalyser();

        analyser.fftSize =
            esIPhone ? 128 : 256;

        analyser.smoothingTimeConstant =
            0.8;

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
                promedio > 18
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

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    // CONFIG

    recognition.lang = "es-ES";

    recognition.interimResults = true;

    recognition.continuous = true;

    recognition.maxAlternatives = 1;

    // TEXTO COMPLETO

    recognition.onresult =
        (event) => {

            let textoFinal = "";

            for (
                let i = 0;
                i < event.results.length;
                i++
            ) {

                textoFinal +=
                    event.results[i][0]
                    .transcript + " ";
            }

            textoVoz.innerHTML =
                `✏️ ${textoFinal}`;
        };

    // ERROR

    recognition.onerror =
        (e) => {

            console.log(
                "ERROR VOZ:",
                e.error
            );

            // FIX ANDROID

            if (
                e.error === "network"
            ) {

                actualizarEstado(
                    "⚠️ Error de red en voz"
                );
            }
        };

    // REINICIO AUTOMATICO

    recognition.onend =
        () => {

            console.log(
                "Reconocimiento terminado"
            );

            if (
                escuchando &&
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
    async () => {

        btnStart.disabled = true;

        Notification
            .requestPermission();

        actualizarEstado(
            "🎧 Iniciando..."
        );

        // FIX IOS

        try {

            await iniciarMicrofono();

            // SOLO ACTIVAR VOZ
            // EN NO IPHONE

            if (
                recognition &&
                !esIPhone
            ) {

                escuchando = true;

                recognition.start();

                console.log(
                    "Reconocimiento iniciado"
                );
            }

            btnStart.style.display =
                "none";

            actualizarEstado(
                "🎧 Sistema iniciado"
            );

        } catch (e) {

            console.log(e);

            btnStart.disabled = false;

            actualizarEstado(
                "❌ Error al iniciar"
            );
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
