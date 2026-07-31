import { ImageResponse } from "next/og";
import { ogImageElement } from "@/lib/ogImage";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(ogImageElement(), { ...size });
}
