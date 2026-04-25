import { ImageResponse } from "next/og";

const IMAGE_SIZE = {
  width: 1080,
  height: 1350,
};

const COPY = {
  pt: {
    label: "Versículo do Dia",
    subtitle: "Uma palavra para compartilhar",
    tagline: "Compartilhe esperança hoje",
    brand: "Pastor Rhema",
    stamp: "Rhema",
    locale: "pt-BR",
  },
  en: {
    label: "Verse of the Day",
    subtitle: "A word worth sharing",
    tagline: "Share hope today",
    brand: "Pastor Rhema",
    stamp: "Rhema",
    locale: "en-US",
  },
  es: {
    label: "Versículo del Día",
    subtitle: "Una palabra para compartir",
    tagline: "Comparte esperanza hoy",
    brand: "Pastor Rhema",
    stamp: "Rhema",
    locale: "es-ES",
  },
};

function getVerseFontSize(text = "") {
  const length = text.trim().length;

  if (length > 240) return 46;
  if (length > 200) return 50;
  if (length > 160) return 56;
  if (length > 120) return 62;
  return 68;
}

function formatVerseDate(date, locale) {
  if (!date) return "";

  try {
    const normalizedDate = new Date(`${date}T12:00:00Z`);
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(normalizedDate);
  } catch {
    return date;
  }
}

function sanitizeVerse(value) {
  if (!value || typeof value !== "object") return null;

  const text = typeof value.text === "string" ? value.text.trim().slice(0, 420) : "";
  const ref = typeof value.ref === "string" ? value.ref.trim().slice(0, 120) : "";
  const date = typeof value.date === "string" ? value.date.trim().slice(0, 32) : "";

  if (!text || !ref) return null;

  return { text, ref, date };
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const lang = payload?.lang && COPY[payload.lang] ? payload.lang : "pt";
    const verse = sanitizeVerse(payload?.verse);

    if (!verse) {
      return Response.json({ error: "Invalid verse payload" }, { status: 400 });
    }

    const copy = COPY[lang];
    const verseFontSize = getVerseFontSize(verse.text);
    const formattedDate = formatVerseDate(verse.date, copy.locale);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            overflow: "hidden",
            padding: "48px",
            backgroundColor: "#071a3a",
            color: "#0b2a5b",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-140px",
              right: "-120px",
              width: "440px",
              height: "440px",
              display: "flex",
              borderRadius: "9999px",
              backgroundColor: "rgba(202,161,74,0.34)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "160px",
              right: "-120px",
              width: "260px",
              height: "720px",
              display: "flex",
              borderRadius: "9999px",
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-90px",
              left: "-60px",
              width: "340px",
              height: "340px",
              display: "flex",
              borderRadius: "9999px",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "56px",
              left: "56px",
              right: "56px",
              height: "34px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                width: "210px",
                height: "2px",
                display: "flex",
                alignSelf: "center",
                backgroundColor: "rgba(202,161,74,0.55)",
              }}
            />
            <div
              style={{
                width: "110px",
                height: "110px",
                display: "flex",
                borderRadius: "9999px",
                border: "1px solid rgba(202,161,74,0.28)",
                alignSelf: "flex-start",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              top: "82px",
              left: "82px",
              right: "82px",
              bottom: "82px",
              display: "flex",
              borderRadius: "56px",
              backgroundColor: "rgba(202,161,74,0.18)",
            }}
          />

          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              borderRadius: "56px",
              border: "2px solid rgba(202,161,74,0.34)",
              backgroundColor: "#f7f0e2",
              padding: "52px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "42px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: "66%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    padding: "12px 20px",
                    borderRadius: "9999px",
                    backgroundColor: "#0b2a5b",
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    marginBottom: "18px",
                  }}
                >
                  {copy.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 34,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: "#102f66",
                  }}
                >
                  {copy.subtitle}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  marginLeft: "24px",
                }}
              >
                {formattedDate ? (
                  <div
                    style={{
                      display: "flex",
                      fontSize: 18,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "rgba(16,47,102,0.56)",
                      marginBottom: "14px",
                    }}
                  >
                    {formattedDate}
                  </div>
                ) : null}
                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "9999px",
                    border: "2px solid rgba(202,161,74,0.34)",
                    color: "#caa14a",
                    fontSize: 34,
                    backgroundColor: "rgba(255,255,255,0.58)",
                  }}
                >
                  ✦
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                justifyContent: "center",
                position: "relative",
                borderRadius: "42px",
                backgroundColor: "#fffaf0",
                border: "1px solid rgba(11,42,91,0.08)",
                padding: "52px 46px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "28px",
                  display: "flex",
                  fontSize: 138,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "rgba(202,161,74,0.32)",
                }}
              >
                “
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: verseFontSize,
                  lineHeight: 1.34,
                  fontWeight: 700,
                  fontStyle: "italic",
                  fontFamily: "serif",
                  color: "#12366c",
                  zIndex: 1,
                  paddingTop: "36px",
                }}
              >
                {verse.text}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                justifyContent: "space-between",
                marginTop: "28px",
                borderRadius: "34px",
                overflow: "hidden",
                backgroundColor: "#0b2a5b",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                  padding: "30px 34px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    padding: "10px 18px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(255,255,255,0.12)",
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#f7e0a2",
                  }}
                >
                  {verse.ref}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 20,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    color: "rgba(255,255,255,0.72)",
                    marginTop: "18px",
                  }}
                >
                  {copy.tagline}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "26px 30px",
                  backgroundColor: "#12366c",
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                  display: "flex",
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.58)",
                    marginBottom: "12px",
                  }}
                >
                  {copy.stamp}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px 20px",
                    borderRadius: "9999px",
                    backgroundColor: "#f6c766",
                    color: "#102f66",
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  {copy.brand}
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...IMAGE_SIZE,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return Response.json({ error: "Failed to generate share image" }, { status: 500 });
  }
}
