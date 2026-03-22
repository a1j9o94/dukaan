export function App() {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif",
      background: "#fafaf9",
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#c2410c" }}>
          दुकान
        </h1>
        <p style={{ color: "#78716c", marginTop: "0.5rem" }}>
          इन्वेंटरी और हिसाब-किताब
        </p>
      </div>
    </div>
  );
}
