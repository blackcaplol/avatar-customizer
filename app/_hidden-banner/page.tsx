"use client";

// Kept in a private route folder so the banner customizer can be restored later.

import {
  Check,
  Copy,
  Dices,
  Download,
  Image as ImageIcon,
  Link2,
  Lock,
  Palette,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";

type BannerFormat = "png" | "jpeg" | "webp" | "gif" | "svg";
type SurpriseMode = "complementary" | "random";
type BannerExample = {
  name: string;
  start: string;
  end: string;
  mark: string;
  markEnd?: string;
  rainbow?: boolean;
};

const bannerDefaults = {
  start: "#4A4A4A",
  end: "#101010",
  mark: "#FFFFFF",
  markEnd: "#FFFFFF",
  gradientAngle: 45,
};

const bannerExamples: BannerExample[] = [
  { name: "Source Gray", ...bannerDefaults },
  { name: "Whitecap", start: "#559BE2", end: "#3528AD", mark: "#FFFFFF" },
  {
    name: "Rainbow",
    start: "#FF3B30",
    end: "#5856D6",
    mark: "#FFF1B8",
    rainbow: true,
  },
  { name: "Midnight", start: "#28344A", end: "#090D16", mark: "#E8EEF9" },
  { name: "Citrus", start: "#D8681F", end: "#552108", mark: "#FFF3D6" },
  { name: "Forest", start: "#4E7A46", end: "#142C17", mark: "#F0F7E9" },
  { name: "Violet", start: "#8652C7", end: "#291247", mark: "#F6EDFF" },
];

const rainbowColors = {
  background: [
    "#FF3B30",
    "#FF9500",
    "#FFCC00",
    "#34C759",
    "#0A84FF",
    "#5856D6",
    "#AF52DE",
  ],
  mark: [
    "#FFF1F0",
    "#FFF3D9",
    "#FFF9CC",
    "#E1F8E7",
    "#E0F1FF",
    "#E8E7FF",
    "#F5E2FA",
  ],
};

function addRainbowStops(gradient: CanvasGradient, colors: string[]) {
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
}

function makeCyclingGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
  angle: number,
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const reach = Math.hypot(width, height) / 2;
  const offsetX = Math.cos(angle) * reach;
  const offsetY = Math.sin(angle) * reach;
  const gradient = context.createLinearGradient(
    centerX - offsetX,
    centerY - offsetY,
    centerX + offsetX,
    centerY + offsetY,
  );
  addRainbowStops(gradient, colors);
  return gradient;
}

function gradientEndpoints(angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  const offsetX = Math.cos(radians) / 2;
  const offsetY = Math.sin(radians) / 2;
  return {
    x1: 0.5 - offsetX,
    y1: 0.5 - offsetY,
    x2: 0.5 + offsetX,
    y2: 0.5 + offsetY,
  };
}

function makeTwoColorGradient(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  start: string,
  end: string,
  angle: number,
) {
  const points = gradientEndpoints(angle);
  const gradient = context.createLinearGradient(
    points.x1 * width,
    points.y1 * height,
    points.x2 * width,
    points.y2 * height,
  );
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  return gradient;
}

function svgRainbowStops(colors: string[]) {
  return colors
    .map(
      (color, index) =>
        `<stop offset="${index / (colors.length - 1)}" stop-color="${color}"/>`,
    )
    .join("");
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const offset = l - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green, blue] = [chroma, secondary, 0];
  else if (segment < 2) [red, green, blue] = [secondary, chroma, 0];
  else if (segment < 3) [red, green, blue] = [0, chroma, secondary];
  else if (segment < 4) [red, green, blue] = [0, secondary, chroma];
  else if (segment < 5) [red, green, blue] = [secondary, 0, chroma];
  else [red, green, blue] = [chroma, 0, secondary];

  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

function randomHex() {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")
    .toUpperCase()}`;
}

function BannerColorField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const update = (next: string) => {
    const normalized = next.startsWith("#") ? next : `#${next}`;
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      onChange(normalized.toUpperCase());
    }
  };

  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-control">
        <input
          aria-label={`${label} color picker`}
          type="color"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <input
          aria-label={`${label} hex value`}
          maxLength={7}
          value={value}
          disabled={disabled}
          onChange={(event) => update(event.target.value)}
        />
      </span>
    </label>
  );
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${source}`));
    image.src = source;
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export default function BannerPage() {
  const [start, setStart] = useState(bannerDefaults.start);
  const [end, setEnd] = useState(bannerDefaults.end);
  const [mark, setMark] = useState(bannerDefaults.mark);
  const [markEnd, setMarkEnd] = useState(bannerDefaults.markEnd);
  const [gradientAngle, setGradientAngle] = useState(
    bannerDefaults.gradientAngle,
  );
  const [synced, setSynced] = useState(false);
  const [width, setWidth] = useState(1500);
  const [height, setHeight] = useState(500);
  const [format, setFormat] = useState<BannerFormat>("png");
  const [quality, setQuality] = useState(92);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [surpriseMode, setSurpriseMode] =
    useState<SurpriseMode>("complementary");
  const [rainbow, setRainbow] = useState(false);
  const availableFormats: BannerFormat[] = rainbow
    ? ["gif", "svg"]
    : ["png", "jpeg", "webp", "svg"];

  const disableRainbow = () => {
    setRainbow(false);
    setFormat((current) => (current === "gif" ? "png" : current));
  };

  const syncFromAvatar = () => {
    try {
      const stored = window.localStorage.getItem("whitecaplol-avatar-palette");
      if (!stored) return;
      const palette = JSON.parse(stored) as {
        background?: string;
        backgroundEnd?: string;
        left?: string;
        leftEnd?: string;
        right?: string;
        gradientAngle?: number;
        rainbow?: boolean;
      };
      if (palette.background) setStart(palette.background);
      if (palette.backgroundEnd ?? palette.right) {
        setEnd(palette.backgroundEnd ?? palette.right ?? bannerDefaults.end);
      }
      if (palette.left) setMark(palette.left);
      if (palette.leftEnd ?? palette.left) {
        setMarkEnd(palette.leftEnd ?? palette.left ?? bannerDefaults.markEnd);
      }
      if (typeof palette.gradientAngle === "number") {
        setGradientAngle(palette.gradientAngle);
      }
      if (palette.rainbow) {
        setRainbow(true);
        if (format !== "gif" && format !== "svg") setFormat("gif");
        if (width > 1500) {
          setWidth(1500);
          setHeight(500);
        }
      }
    } catch {
      // Keep the current banner palette if local data is unavailable.
    }
  };

  const toggleSync = () => {
    const next = !synced;
    setSynced(next);
    if (next) {
      disableRainbow();
      syncFromAvatar();
    }
  };

  const applyExample = (example: BannerExample) => {
    setSynced(false);
    setRainbow(Boolean(example.rainbow));
    if (example.rainbow) {
      if (format !== "gif" && format !== "svg") setFormat("gif");
      if (width > 1500) {
        setWidth(1500);
        setHeight(500);
      }
    } else if (format === "gif") {
      setFormat("png");
    }
    setStart(example.start);
    setEnd(example.end);
    setMark(example.mark);
    setMarkEnd(example.markEnd ?? example.mark);
    setGradientAngle(bannerDefaults.gradientAngle);
  };

  const reset = () => {
    setSynced(false);
    disableRainbow();
    setStart(bannerDefaults.start);
    setEnd(bannerDefaults.end);
    setMark(bannerDefaults.mark);
    setMarkEnd(bannerDefaults.markEnd);
    setGradientAngle(bannerDefaults.gradientAngle);
  };

  const surpriseMe = () => {
    setSynced(false);
    disableRainbow();

    if (surpriseMode === "random") {
      setStart(randomHex());
      setEnd(randomHex());
      setMark(randomHex());
      setMarkEnd(randomHex());
      setGradientAngle(Math.floor(Math.random() * 361));
      return;
    }

    const baseHue = Math.floor(Math.random() * 360);
    const complementHue = (baseHue + 180) % 360;
    const shadeShift = Math.floor(Math.random() * 25) - 12;

    setStart(
      hslToHex(
        baseHue,
        62 + Math.floor(Math.random() * 18),
        43 + Math.floor(Math.random() * 10),
      ),
    );
    setEnd(
      hslToHex(
        (baseHue + shadeShift + 360) % 360,
        58 + Math.floor(Math.random() * 17),
        20 + Math.floor(Math.random() * 12),
      ),
    );
    setMark(
      hslToHex(
        complementHue,
        36 + Math.floor(Math.random() * 20),
        91 + Math.floor(Math.random() * 6),
      ),
    );
    setMarkEnd(
      hslToHex(
        (complementHue + shadeShift + 360) % 360,
        38 + Math.floor(Math.random() * 18),
        73 + Math.floor(Math.random() * 12),
      ),
    );
    setGradientAngle(Math.floor(Math.random() * 361));
  };

  const setDimension = (dimension: "width" | "height", next: number) => {
    const maxWidth = rainbow ? 1500 : 6000;
    if (dimension === "width") {
      const value = Math.min(maxWidth, Math.max(300, next || 300));
      setWidth(value);
      setHeight(Math.round(value / 3));
    } else {
      const value = Math.min(maxWidth / 3, Math.max(100, next || 100));
      setHeight(value);
      setWidth(Math.round(value * 3));
    }
  };

  const makeBannerSvg = async () => {
    const response = await fetch("/banners/discord-vector-mark.svg");
    const source = await response.text();
    const path = source.match(/<path[\s\S]*?\/>/)?.[0];
    if (!path) throw new Error("The vector banner mark is unavailable.");
    const points = gradientEndpoints(gradientAngle);
    const recoloredPath = path.replace(
      /fill="#ffffff"/i,
      `fill="${rainbow ? "url(#banner-mark-rainbow)" : "url(#banner-mark)"}"`,
    );

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1500 500">
  <defs>
    <linearGradient id="banner-bg" x1="${points.x1}" y1="${points.y1}" x2="${points.x2}" y2="${points.y2}">
      ${
        rainbow
          ? `${svgRainbowStops(rainbowColors.background)}
      <animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="2.4s" repeatCount="indefinite"/>`
          : `<stop stop-color="${start}"/>
      <stop offset="1" stop-color="${end}"/>`
      }
    </linearGradient>
    <linearGradient id="banner-mark" x1="${points.x1}" y1="${points.y1}" x2="${points.x2}" y2="${points.y2}">
      <stop stop-color="${mark}"/>
      <stop offset="1" stop-color="${markEnd}"/>
    </linearGradient>
    <linearGradient id="banner-mark-rainbow" x1="0" y1="0" x2="1" y2="1">
      ${svgRainbowStops(rainbowColors.mark)}
      <animateTransform attributeName="gradientTransform" type="rotate" from="180 .5 .5" to="540 .5 .5" dur="2.4s" repeatCount="indefinite"/>
    </linearGradient>
  </defs>
  <rect width="1500" height="500" fill="url(#banner-bg)"/>
  ${recoloredPath}
</svg>`;
  };

  const makeCanvas = async (rainbowAngle = Math.PI / 4) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    if (rainbow) {
      context.fillStyle = makeCyclingGradient(
        context,
        width,
        height,
        rainbowColors.background,
        rainbowAngle,
      );
    } else {
      context.fillStyle = makeTwoColorGradient(
        context,
        width,
        height,
        start,
        end,
        gradientAngle,
      );
    }
    context.fillRect(0, 0, width, height);

    const vector = await loadImage("/banners/discord-vector-mark.svg");
    const markCanvas = document.createElement("canvas");
    markCanvas.width = width;
    markCanvas.height = height;
    const markContext = markCanvas.getContext("2d");
    if (!markContext) return null;
    markContext.drawImage(vector, 0, 0, width, height);
    markContext.globalCompositeOperation = "source-in";
    markContext.fillStyle = rainbow
      ? makeCyclingGradient(
          markContext,
          width,
          height,
          rainbowColors.mark,
          rainbowAngle + Math.PI,
        )
      : makeTwoColorGradient(
          markContext,
          width,
          height,
          mark,
          markEnd,
          gradientAngle,
        );
    markContext.fillRect(0, 0, width, height);
    context.drawImage(markCanvas, 0, 0);
    return canvas;
  };

  const makeAnimatedGif = async () => {
    const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
    const gif = GIFEncoder();
    const frameCount = 24;
    let palette: number[][] | undefined;

    for (let frame = 0; frame < frameCount; frame += 1) {
      const angle = (frame / frameCount) * Math.PI * 2;
      const canvas = await makeCanvas(angle);
      if (!canvas) throw new Error("Canvas is unavailable.");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");
      const pixels = context.getImageData(0, 0, width, height).data;

      if (!palette) palette = quantize(pixels, 256);
      const indexed = applyPalette(pixels, palette);
      gif.writeFrame(indexed, width, height, {
        palette: frame === 0 ? palette : undefined,
        delay: 100,
        repeat: 0,
      });
    }

    gif.finish();
    const bytes = gif.bytes();
    const data = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    return new Blob([data], { type: "image/gif" });
  };

  const download = async () => {
    let blob: Blob | null;
    if (format === "svg") {
      blob = new Blob([await makeBannerSvg()], {
        type: "image/svg+xml;charset=utf-8",
      });
    } else if (format === "gif") {
      blob = await makeAnimatedGif();
    } else {
      const canvas = await makeCanvas();
      if (!canvas) return;
      blob = await new Promise((resolve) =>
        canvas.toBlob(
          resolve,
          `image/${format}`,
          format === "png" ? undefined : quality / 100,
        ),
      );
    }

    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `whitecaplol-banner-${width}x${height}.${format === "jpeg" ? "jpg" : format}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1800);
  };

  const copyExport = async () => {
    let value: string;
    if (format === "svg") {
      value = await makeBannerSvg();
    } else if (format === "gif") {
      value = await blobToDataUrl(await makeAnimatedGif());
    } else {
      const canvas = await makeCanvas();
      if (!canvas) return;
      value = await blobToDataUrl(
        await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject()),
            `image/${format}`,
            format === "png" ? undefined : quality / 100,
          ),
        ),
      );
    }

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main>
      <header className="site-header">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="brand" href="/" aria-label="Whitecaplol Avatar Customizer home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="brand-mark"
            src="/favicon.svg"
            width={38}
            height={38}
            alt=""
          />
          <span>
            <strong>Whitecaplol&apos;s</strong>
            <small>Avatar Customizer</small>
          </span>
        </a>
        <nav className="tool-nav" aria-label="Customizer pages">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">Avatar</a>
          <a className="active" href="/banner">
            Banner
          </a>
        </nav>
        <span className="privacy-note">
          <Lock size={14} strokeWidth={2} />
          Nothing leaves your browser
        </span>
      </header>

      <section className="intro banner-intro">
        <h1>Build the matching banner.</h1>
      </section>

      <section className="workspace banner-workspace">
        <div className="preview-card">
          <div className="panel-heading">
            <span>
              <ImageIcon size={18} />
              Banner preview
            </span>
            <span className="vector-badge">Vectorized</span>
          </div>

          <div className="banner-preview-stage">
            <div
              className={`banner-canvas ${rainbow ? "rainbow" : ""}`}
              style={{
                backgroundImage: rainbow
                  ? `linear-gradient(135deg, ${rainbowColors.background.join(", ")})`
                  : `linear-gradient(${gradientAngle}deg, ${start}, ${end})`,
                backgroundSize: rainbow ? "300% 300%" : "cover",
              }}
            >
              <div
                className={`banner-vector-mark ${rainbow ? "rainbow" : ""}`}
                style={{
                  backgroundColor: mark,
                  backgroundImage: rainbow
                    ? `linear-gradient(135deg, ${rainbowColors.mark.join(", ")})`
                    : `linear-gradient(${gradientAngle}deg, ${mark}, ${markEnd})`,
                  backgroundSize: rainbow ? "300% 300%" : "cover",
                  WebkitMaskImage:
                    'url("/banners/discord-vector-mark.svg")',
                  maskImage: 'url("/banners/discord-vector-mark.svg")',
                }}
              />
            </div>
          </div>

          <div className="export-panel">
            <div className="export-topline">
              <div>
                <span className="export-title">Export settings</span>
                <span className="export-summary">
                  {width} × {height}px · {format.toUpperCase()}
                </span>
              </div>
              <div className="format-tabs" aria-label="Export format">
                {availableFormats.map((item) => (
                  <button
                    className={format === item ? "active" : ""}
                    type="button"
                    key={item}
                    onClick={() => setFormat(item)}
                  >
                    {item === "jpeg" ? "JPG" : item.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="banner-size-presets">
              {[
                { name: "Discord", width: 1500, height: 500 },
                { name: "HD", width: 3000, height: 1000 },
                { name: "Large", width: 4500, height: 1500 },
              ]
                .filter((preset) => !rainbow || preset.width <= 1500)
                .map((preset) => (
                  <button
                    className={
                      width === preset.width && height === preset.height
                        ? "active"
                        : ""
                    }
                    type="button"
                    key={preset.name}
                    onClick={() => {
                      setWidth(preset.width);
                      setHeight(preset.height);
                    }}
                  >
                    <span>{preset.name}</span>
                    <small>
                      {preset.width} × {preset.height}
                    </small>
                  </button>
                ))}
            </div>

            <div className="dimension-row banner-dimensions">
              <label>
                Width
                <span>
                  <input
                    type="number"
                    min="300"
                    max={rainbow ? 1500 : 6000}
                    value={width}
                    onChange={(event) =>
                      setDimension("width", Number(event.target.value))
                    }
                  />
                  px
                </span>
              </label>
              <span className="ratio-lock" title="Banner ratio locked to 3:1">
                <Lock size={15} />
              </span>
              <label>
                Height
                <span>
                  <input
                    type="number"
                    min="100"
                    max={rainbow ? 500 : 2000}
                    value={height}
                    onChange={(event) =>
                      setDimension("height", Number(event.target.value))
                    }
                  />
                  px
                </span>
              </label>
              <label className="quality-field">
                Quality
                <span>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    disabled={
                      format === "png" ||
                      format === "gif" ||
                      format === "svg"
                    }
                    value={quality}
                    onChange={(event) =>
                      setQuality(
                        Math.min(100, Math.max(10, Number(event.target.value))),
                      )
                    }
                  />
                  %
                </span>
              </label>
            </div>

            <div className="export-actions">
              <button className="copy-button" type="button" onClick={copyExport}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied
                  ? "Copied"
                  : format === "svg"
                    ? "Copy SVG code"
                    : "Copy Base64"}
              </button>
              <button className="download-button" type="button" onClick={download}>
                {downloaded ? <Check size={19} /> : <Download size={19} />}
                {downloaded ? "Exported" : "Export banner"}
              </button>
            </div>
          </div>
        </div>

        <aside className="controls-card banner-controls">
          <div className="panel-heading controls-heading">
            <span>
              <Palette size={18} />
              Banner colors
            </span>
            <button className="text-button" type="button" onClick={reset}>
              <RotateCcw size={15} />
              Reset
            </button>
          </div>

          <section className="control-section">
            <div className="sync-row">
              <span className="sync-icon">
                <Link2 size={17} />
              </span>
              <span>
                <strong>Sync with avatar</strong>
                <small>Use the current profile-picture palette</small>
              </span>
              <button
                className={`toggle ${synced ? "active" : ""}`}
                type="button"
                role="switch"
                aria-checked={synced}
                onClick={toggleSync}
              >
                <span />
              </button>
            </div>
          </section>

          <section className="control-section">
            <h2>Examples</h2>
            <div className="banner-example-list">
              {bannerExamples.map((example) => {
                const active =
                  !synced &&
                  rainbow === Boolean(example.rainbow) &&
                  start === example.start &&
                  end === example.end &&
                  mark === example.mark &&
                  markEnd === (example.markEnd ?? example.mark) &&
                  gradientAngle === bannerDefaults.gradientAngle;
                return (
                  <button
                    className={active ? "active" : ""}
                    type="button"
                    key={example.name}
                    onClick={() => applyExample(example)}
                  >
                    <span
                      className={`banner-example-swatch ${example.rainbow ? "rainbow" : ""}`}
                      style={{
                        backgroundImage: example.rainbow
                          ? `linear-gradient(135deg, ${rainbowColors.background.join(", ")})`
                          : `linear-gradient(to top right, ${example.start}, ${example.end})`,
                        backgroundSize: example.rainbow ? "300% 300%" : "cover",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: example.mark,
                          backgroundImage: example.rainbow
                            ? `linear-gradient(135deg, ${rainbowColors.mark.join(", ")})`
                            : `linear-gradient(${bannerDefaults.gradientAngle}deg, ${example.mark}, ${example.markEnd ?? example.mark})`,
                        }}
                      />
                    </span>
                    <span>{example.name}</span>
                    {active && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="control-section">
            <div className="section-heading">
              <h2>Colors</h2>
              <button
                className="surprise-button"
                type="button"
                onClick={surpriseMe}
              >
                <Dices size={14} />
                Surprise me
              </button>
            </div>
            <div className="surprise-mode" aria-label="Surprise color mode">
              <span>Surprise mode</span>
              <div>
                <button
                  className={
                    surpriseMode === "complementary" ? "active" : ""
                  }
                  type="button"
                  onClick={() => setSurpriseMode("complementary")}
                >
                  Complementary
                </button>
                <button
                  className={surpriseMode === "random" ? "active" : ""}
                  type="button"
                  onClick={() => setSurpriseMode("random")}
                >
                  Fully random
                </button>
              </div>
            </div>
            <div className="color-grid">
              <BannerColorField
                label="Gradient start"
                value={start}
                disabled={synced}
                onChange={(value) => {
                  disableRainbow();
                  setStart(value);
                }}
              />
              <BannerColorField
                label="Gradient end"
                value={end}
                disabled={synced}
                onChange={(value) => {
                  disableRainbow();
                  setEnd(value);
                }}
              />
              <BannerColorField
                label="Logo start"
                value={mark}
                disabled={synced}
                onChange={(value) => {
                  disableRainbow();
                  setMark(value);
                }}
              />
              <BannerColorField
                label="Logo end"
                value={markEnd}
                disabled={synced}
                onChange={(value) => {
                  disableRainbow();
                  setMarkEnd(value);
                }}
              />
              <label className="slider-field">
                <span className="field-label">
                  <span>Gradient angle</span>
                  <output>{gradientAngle}°</output>
                </span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={gradientAngle}
                  disabled={synced}
                  onChange={(event) => {
                    disableRainbow();
                    setGradientAngle(Number(event.target.value));
                  }}
                />
              </label>
            </div>
          </section>
        </aside>
      </section>

      <footer>
        <span>Whitecaplol&apos;s Banner Customizer</span>
        <span>Vectorized from the supplied source banner.</span>
      </footer>
    </main>
  );
}
