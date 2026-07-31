export function ogImageElement() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#09090b",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0) 70%)",
          display: "flex",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#8b5cf6",
            boxShadow: "0 0 40px 8px rgba(139,92,246,0.8)",
          }}
        />
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: "#f4f4f5" }}>
          Stranger Chat
        </div>
      </div>
      <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#a1a1aa" }}>
        Live video &amp; text, no sign-up hassle
      </div>
    </div>
  );
}
