console.log(tf);

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
            titulo, {
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

        const stream =
            await navigator.mediaDevices
            .getUserMedia({
                audio: true
            });

        const audioContext =
            new(
                window.AudioContext ||
                window.webkitAudioContext
            )();

        const source =
            audioContext
            .createMediaStreamSource(
                stream
            );

        const analyser =
            audioContext
            .createAnalyser();

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

            // DETECCIONES

            if (promedio > 85) {

                cambiarModo("alerta");

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
                promedio > 40
            ) {

                cambiarModo("voz");

                actualizarEstado(
                    "🗣️ Voz detectada"
                );

                agregarHistorial(
                    "🗣️ Voz detectada"
                );

            } else {

                cambiarModo("normal");

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

        console.log(error);

        actualizarEstado(
            "❌ Micrófono bloqueado"
        );

        alert(
            "Permite el acceso al micrófono"
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

    recognition.lang = "es-MX";

    recognition.continuous = true;

    recognition.onresult =
        (event) => {

            let texto = "";

            for (
                let i = event.resultIndex; i < event.results.length; i++
            ) {

                texto +=
                    event.results[i][0]
                    .transcript + " ";
            }

            textoVoz.innerHTML =
                `✏️ ${texto}`;
        };
}

// BOTON

btnStart.addEventListener(
    "click",
    async() => {

        Notification.requestPermission();

        btnStart.style.display =
            "none";

        actualizarEstado(
            "🎧 Sistema iniciado"
        );

        await iniciarMicrofono();

        if (recognition) {

            recognition.start();
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

        console.log(e);

    });
}
