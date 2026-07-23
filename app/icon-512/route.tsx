import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
        }}
      >
        <div
          style={{
            width: 214,
            height: 214,
            borderRadius: "50%",
            background: "#8b5cf6",
          }}
        />
      </div>
    ),
    { width: 512, height: 512 }
  );
}
