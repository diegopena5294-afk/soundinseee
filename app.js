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

        // PRUEBA TEMPORAL

        console.log(
            "Intentando acceder al micro..."
        );

        console.log(
            navigator.mediaDevices
        );

        const stream =
            await navigator.mediaDevices
            .getUserMedia({
                audio: true
            });

        alert(
            "✅ Micrófono funcionando"
        );

        console.log(stream);

        const audioContext =
            new(
                window.AudioContext ||
                window.webkitAudioContext
            )();

        // FIX MOVILES

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

        analyser.fftSize = 256;

        source.connect(analyser);

        const data =
            new Uint8Array(
                analyser.frequencyBinCount
            );

        function analizar() {

            analyser.getByteFrequencyData(
                data
            );

            // DEBUG TEMPORAL

            console.log(data);

            let promedio =
                data.reduce(
                    (a, b) => a + b
                ) / data.length;

            console.log(
                "Volumen:",
                promedio
            );

            // DETECCIONES

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

            } else if (
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

            } else {

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

    // CONFIG RAPIDA

    recognition.lang = "es-MX";

    recognition.interimResults = true;

    recognition.continuous = false;

    recognition.maxAlternatives = 1;

    // TEXTO RAPIDO

    recognition.onresult =
        (event) => {

            const resultado =
                event.results[
                    event.results.length - 1
                ];

            const texto =
                resultado[0].transcript;

            textoVoz.innerHTML =
                `✏️ ${texto}`;
        };

    recognition.onerror =
        (e) => {

            console.log(
                "ERROR VOZ:",
                e
            );
        };

    recognition.onend =
        () => {

            console.log(
                "Reconocimiento terminado"
            );
        };

} else {

    textoVoz.innerHTML =
        "⚠️ Voz no compatible";
}

// BOTON

btnStart.addEventListener(
    "click",
    async() => {

        Notification
            .requestPermission();

        btnStart.style.display =
            "none";

        actualizarEstado(
            "🎧 Sistema iniciado"
        );

        await iniciarMicrofono();

        // PRUEBA VOZ

        if (recognition) {

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
