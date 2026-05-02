import React, { useEffect, useEffectEvent, useRef, useState } from "react";
import io from "socket.io-client";

const SOCKET_URL = "http://localhost:8080";
const SOCKET_EVENTS = ["detection_update", "new-detections"];
const SIMULATED_LABELS = ["person", "bottle", "cell phone", "chair", "laptop"];
const FALLBACK_DELAY_MS = 2500;
const SIMULATION_INTERVAL_MS = 1200;
const HISTORY_LIMIT = 10;
const DEFAULT_VIDEO_SIZE = { width: 640, height: 480 };

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeDetections = (payload) => {
  const items = Array.isArray(payload) ? payload : [payload];

  return items
    .filter(Boolean)
    .map((item) => {
      const bbox = Array.isArray(item.bbox) ? item.bbox : null;

      if (!bbox || bbox.length !== 4) {
        return null;
      }

      const [x1, y1, x2, y2] = bbox.map((value) => Number(value));

      if ([x1, y1, x2, y2].some((value) => Number.isNaN(value))) {
        return null;
      }

      const normalizedConfidence = Number(item.confidence ?? 0);

      return {
        label: item.label || "unknown",
        confidence: Number.isNaN(normalizedConfidence)
          ? 0
          : normalizedConfidence,
        bbox: [x1, y1, x2, y2],
      };
    })
    .filter(Boolean);
};

const formatConfidence = (confidence) =>
  `${Math.round(Number(confidence || 0) * 100)}%`;

const createSimulatedDetections = (width, height, tick) => {
  const count = 1 + (tick % 3);

  return Array.from({ length: count }, (_, index) => {
    const boxWidth = Math.round(width * (0.17 + index * 0.04));
    const boxHeight = Math.round(height * (0.24 + index * 0.02));
    const centerX =
      width * (0.24 + index * 0.22) +
      Math.sin((tick + index * 11) / 6) * width * 0.08;
    const centerY =
      height * (0.34 + index * 0.11) +
      Math.cos((tick + index * 9) / 7) * height * 0.06;
    const x1 = clamp(Math.round(centerX - boxWidth / 2), 0, width - boxWidth);
    const y1 = clamp(
      Math.round(centerY - boxHeight / 2),
      0,
      height - boxHeight
    );
    const confidence =
      0.72 + ((Math.sin((tick + index * 5) / 5) + 1) / 2) * 0.24;

    return {
      label: SIMULATED_LABELS[(tick + index) % SIMULATED_LABELS.length],
      confidence: Number(confidence.toFixed(2)),
      bbox: [x1, y1, x1 + boxWidth, y1 + boxHeight],
    };
  });
};

const badgeStyles = {
  base: {
    borderRadius: "999px",
    padding: "8px 12px",
    fontSize: "0.84rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
    border: "1px solid transparent",
  },
  active: {
    background: "rgba(44, 122, 92, 0.14)",
    color: "#184f39",
    borderColor: "rgba(44, 122, 92, 0.24)",
  },
  loading: {
    background: "rgba(178, 92, 20, 0.12)",
    color: "#8f480f",
    borderColor: "rgba(178, 92, 20, 0.2)",
  },
  error: {
    background: "rgba(180, 54, 54, 0.12)",
    color: "#8d2222",
    borderColor: "rgba(180, 54, 54, 0.24)",
  },
  waiting: {
    background: "rgba(16, 57, 92, 0.1)",
    color: "#184569",
    borderColor: "rgba(16, 57, 92, 0.18)",
  },
  simulation: {
    background: "rgba(125, 86, 10, 0.12)",
    color: "#7d560a",
    borderColor: "rgba(125, 86, 10, 0.2)",
  },
};

const getCameraTone = (status) => {
  if (status === "active") {
    return badgeStyles.active;
  }

  if (status === "loading") {
    return badgeStyles.loading;
  }

  return badgeStyles.error;
};

const getDataTone = (status) => {
  if (status === "socket connected") {
    return badgeStyles.active;
  }

  if (status === "simulation") {
    return badgeStyles.simulation;
  }

  return badgeStyles.waiting;
};

const App = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);
  const simulationTickRef = useRef(0);
  const hasRealDetectionsRef = useRef(false);

  const [detections, setDetections] = useState([]);
  const [cameraStatus, setCameraStatus] = useState("loading");
  const [cameraMessage, setCameraMessage] = useState(
    "Initialisation de la webcam..."
  );
  const [dataStatus, setDataStatus] = useState("waiting");
  const [videoSize, setVideoSize] = useState(DEFAULT_VIDEO_SIZE);

  const syncCanvasToVideo = useEffectEvent(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const width = video.videoWidth || DEFAULT_VIDEO_SIZE.width;
    const height = video.videoHeight || DEFAULT_VIDEO_SIZE.height;

    if (canvas.width !== width) {
      canvas.width = width;
    }

    if (canvas.height !== height) {
      canvas.height = height;
    }

    setVideoSize((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height }
    );
  });

  const drawBoxes = useEffectEvent((items) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    syncCanvasToVideo();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    items.forEach((item) => {
      if (!Array.isArray(item.bbox) || item.bbox.length !== 4) {
        return;
      }

      const [x1, y1, x2, y2] = item.bbox;
      const width = Math.max(x2 - x1, 0);
      const height = Math.max(y2 - y1, 0);

      if (width === 0 || height === 0) {
        return;
      }

      ctx.strokeStyle = "#7CFF6B";
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);

      const label = `${item.label} (${formatConfidence(item.confidence)})`;
      ctx.font = "600 16px Segoe UI";
      const textWidth = ctx.measureText(label).width;
      const textX = x1;
      const textY = y1 > 28 ? y1 - 10 : y1 + 24;

      ctx.fillStyle = "rgba(8, 18, 12, 0.82)";
      ctx.fillRect(textX - 6, textY - 18, textWidth + 12, 24);
      ctx.fillStyle = "#DDFDE0";
      ctx.fillText(label, textX, textY);
    });
  });

  const stopSimulation = useEffectEvent(() => {
    if (simulationIntervalRef.current) {
      window.clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  });

  const pushDetections = useEffectEvent((payload, source) => {
    const normalized = normalizeDetections(payload);

    if (!normalized.length) {
      drawBoxes([]);
      return;
    }

    if (source === "socket") {
      hasRealDetectionsRef.current = true;
      stopSimulation();
      setDataStatus("socket connected");
    }

    const historyItems = normalized.map((item, index) => ({
      ...item,
      id: `${source}-${Date.now()}-${index}`,
      source,
    }));

    setDetections((current) =>
      [...historyItems, ...current].slice(0, HISTORY_LIMIT)
    );
    drawBoxes(normalized);
  });

  const startSimulation = useEffectEvent(() => {
    if (simulationIntervalRef.current || hasRealDetectionsRef.current) {
      return;
    }

    setDataStatus("simulation");
    simulationIntervalRef.current = window.setInterval(() => {
      const width = videoRef.current?.videoWidth || DEFAULT_VIDEO_SIZE.width;
      const height = videoRef.current?.videoHeight || DEFAULT_VIDEO_SIZE.height;

      simulationTickRef.current += 1;
      pushDetections(
        createSimulatedDetections(width, height, simulationTickRef.current),
        "simulation"
      );
    }, SIMULATION_INTERVAL_MS);
  });

  useEffect(() => {
    let isCancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("error");
        setCameraMessage("Ton navigateur ne supporte pas l'acces webcam.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        setCameraStatus("active");
        setCameraMessage("Webcam activee. Le flux video est disponible.");
      } catch (error) {
        const reason =
          error && typeof error === "object" && "name" in error
            ? error.name
            : "";

        if (reason === "NotAllowedError") {
          setCameraStatus("denied");
          setCameraMessage(
            "L'acces a la webcam a ete refuse. Autorise la camera pour voir le direct."
          );
          return;
        }

        if (reason === "NotFoundError") {
          setCameraStatus("error");
          setCameraMessage(
            "Aucune webcam detectee sur cette machine. Branche une camera puis recharge la page."
          );
          return;
        }

        setCameraStatus("error");
        setCameraMessage(
          "Impossible de lancer la webcam pour le moment. Verifie les permissions du navigateur."
        );
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return undefined;
    }

    const handleMetadata = () => {
      syncCanvasToVideo();
      drawBoxes([]);
    };

    video.addEventListener("loadedmetadata", handleMetadata);
    window.addEventListener("resize", handleMetadata);

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
      window.removeEventListener("resize", handleMetadata);
    };
  }, [drawBoxes, syncCanvasToVideo]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1200,
      timeout: 2500,
    });

    socketRef.current = socket;

    const handleConnect = () => {
      if (!hasRealDetectionsRef.current) {
        setDataStatus("socket connected");
      }
    };

    const handleDisconnect = () => {
      if (simulationIntervalRef.current) {
        setDataStatus("simulation");
        return;
      }

      if (!hasRealDetectionsRef.current) {
        setDataStatus("waiting");
      }
    };

    const handleSocketDetections = (payload) => {
      pushDetections(payload, "socket");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    SOCKET_EVENTS.forEach((eventName) =>
      socket.on(eventName, handleSocketDetections)
    );

    fallbackTimeoutRef.current = window.setTimeout(() => {
      if (!hasRealDetectionsRef.current) {
        startSimulation();
      }
    }, FALLBACK_DELAY_MS);

    return () => {
      if (fallbackTimeoutRef.current) {
        window.clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = null;
      }

      stopSimulation();
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      SOCKET_EVENTS.forEach((eventName) =>
        socket.off(eventName, handleSocketDetections)
      );
      socket.disconnect();
      socketRef.current = null;
    };
  }, [pushDetections, startSimulation, stopSimulation]);

  return (
    <div
      style={{
        minHeight: "100svh",
        padding: "32px 20px",
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top, rgba(252, 220, 168, 0.42), transparent 30%), linear-gradient(180deg, #f8f2e8 0%, #f5efe3 52%, #f1ebe1 100%)",
      }}
    >
      <div
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "28px",
          borderRadius: "28px",
          background: "rgba(255, 252, 247, 0.88)",
          boxShadow: "0 24px 50px rgba(104, 76, 39, 0.12)",
          border: "1px solid rgba(118, 92, 54, 0.12)",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#7A5A31",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              ObjectVision AI
            </p>
            <h1
              style={{
                margin: "8px 0 10px",
                fontSize: "clamp(2rem, 4vw, 3.4rem)",
                lineHeight: 1,
                color: "#23180E",
              }}
            >
              Webcam live monitoring
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: "700px",
                color: "#5F4A33",
                lineHeight: 1.5,
              }}
            >
              Le flux video vient maintenant du navigateur. Si le backend temps
              reel ne repond pas, le frontend reste vivant avec une simulation
              locale pour tester l'overlay et l'historique.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <span
              style={{ ...badgeStyles.base, ...getCameraTone(cameraStatus) }}
            >
              Camera:{" "}
              {cameraStatus === "active"
                ? "active"
                : cameraStatus === "loading"
                ? "chargement"
                : cameraStatus === "denied"
                ? "refusee"
                : "erreur"}
            </span>
            <span style={{ ...badgeStyles.base, ...getDataTone(dataStatus) }}>
              Donnees:{" "}
              {dataStatus === "socket connected"
                ? "socket connecte"
                : dataStatus === "simulation"
                ? "simulation"
                : "en attente"}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.2fr) minmax(280px, 1fr)",
            gap: "20px",
          }}
        >
          <section>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: `${videoSize.width} / ${videoSize.height}`,
                borderRadius: "22px",
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, rgba(14, 21, 28, 0.96), rgba(35, 56, 43, 0.9))",
                boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />

              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              />

              {cameraStatus !== "active" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    padding: "24px",
                    textAlign: "center",
                    color: "#F8F5EE",
                    background: "rgba(8, 12, 18, 0.42)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: "0 0 10px",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                      }}
                    >
                      {cameraStatus === "loading"
                        ? "Connexion a la webcam..."
                        : "Flux webcam indisponible"}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        maxWidth: "460px",
                        color: "rgba(248, 245, 238, 0.86)",
                        lineHeight: 1.5,
                      }}
                    >
                      {cameraMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p
              style={{
                margin: "14px 0 0",
                color: "#6E5538",
                fontSize: "0.94rem",
              }}
            >
              {cameraMessage}
            </p>
          </section>

          <aside
            style={{
              borderRadius: "22px",
              background: "rgba(246, 239, 226, 0.9)",
              border: "1px solid rgba(120, 88, 42, 0.12)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "1.15rem",
                  color: "#2B1C0E",
                }}
              >
                Etat du flux
              </h2>
              <p style={{ margin: 0, color: "#6B5439", lineHeight: 1.55 }}>
                {dataStatus === "simulation"
                  ? "Le backend live ne repond pas encore, la simulation garde l'interface active."
                  : dataStatus === "socket connected"
                  ? "Le frontend est pret a recevoir les detections en direct via socket."
                  : "Le frontend attend un flux backend. Une simulation demarre automatiquement si rien n'arrive."}
              </p>
            </div>

            <div>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: "1.15rem",
                  color: "#2B1C0E",
                }}
              >
                Historique recent
              </h2>

              {detections.length === 0 ? (
                <p style={{ margin: 0, color: "#7A6245", lineHeight: 1.55 }}>
                  Aucune detection recue pour l'instant. Le panneau se remplira
                  des que le socket ou la simulation enverra des donnees.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {detections.map((detection) => (
                    <div
                      key={detection.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "16px",
                        background: "rgba(255, 255, 255, 0.72)",
                        border: "1px solid rgba(120, 88, 42, 0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <strong style={{ color: "#241609" }}>
                          {detection.label}
                        </strong>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color:
                              detection.source === "socket"
                                ? "#225B42"
                                : "#8A6412",
                          }}
                        >
                          {detection.source === "socket" ? "live" : "mock"}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.92rem",
                          color: "#624C33",
                          lineHeight: 1.5,
                        }}
                      >
                        Confiance {formatConfidence(detection.confidence)} |
                        BBox {detection.bbox.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default App;
