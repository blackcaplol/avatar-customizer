"use client";

import {
  Check,
  Copy,
  Dices,
  Download,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Lock,
  MoveHorizontal,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Type,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ExportFormat = "png" | "jpeg" | "webp" | "gif" | "svg";
type SurpriseMode = "complementary" | "random";
type ExamplePreset = {
  name: string;
  background: string;
  left: string;
  right: string;
  image?: string;
  rainbow?: boolean;
};

const defaults = {
  background: "#559BE2",
  backgroundEnd: "#3528AD",
  left: "#FFFFFF",
  leftEnd: "#F8F8F8",
  right: "#A9A9A9",
  rightEnd: "#C7C7C7",
  gradientAngle: 135,
  split: 50,
  peak: 39,
  edge: 77,
  rotation: 0,
  padding: 0,
  radius: 0,
  label: "",
  labelColor: "#111827",
  labelSize: 8,
  labelY: 17,
};

const sizePresets = [
  { label: "Discord", value: 128 },
  { label: "Standard", value: 512 },
  { label: "HD", value: 1024 },
  { label: "4K", value: 4096 },
];

const examples: ExamplePreset[] = [
  {
    name: "Whitecaplol's Son",
    background: "#C5591B",
    left: "#E5EFF6",
    right: "#8FBAD6",
    image: "/examples/whitecaplol-son.svg",
  },
  {
    name: "Original",
    background: defaults.background,
    left: defaults.left,
    right: defaults.right,
  },
  {
    name: "Rainbow",
    background: "#FF3B30",
    left: "#C9F2D2",
    right: "#64B5F6",
    rainbow: true,
  },
  {
    name: "Red",
    background: "#C62828",
    left: "#FFF2F0",
    right: "#EF9A9A",
  },
  {
    name: "Orange",
    background: "#D65F14",
    left: "#FFF5E6",
    right: "#FFB46A",
  },
  {
    name: "Yellow",
    background: "#D4A800",
    left: "#FFFCE8",
    right: "#F4DC67",
  },
  {
    name: "Green",
    background: "#2E7D32",
    left: "#F1F7E8",
    right: "#9CCC65",
  },
  {
    name: "Blue",
    background: "#1565C0",
    left: "#EAF4FF",
    right: "#90CAF9",
  },
  {
    name: "Indigo",
    background: "#3949AB",
    left: "#F0F1FF",
    right: "#9FA8DA",
  },
  {
    name: "Violet",
    background: "#7B1FA2",
    left: "#FAEEFF",
    right: "#CE93D8",
  },
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
  left: [
    "#FFD7D4",
    "#FFE0B2",
    "#FFF2B0",
    "#C9F2D2",
    "#CDE7FF",
    "#D9D7FF",
    "#EFD4F7",
  ],
  right: [
    "#FF827A",
    "#FFBC66",
    "#FFE066",
    "#72DB8B",
    "#64B5F6",
    "#8C8AE6",
    "#CF85E5",
  ],
};

function addRainbowStops(gradient: CanvasGradient, colors: string[]) {
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
}

function makeCyclingGradient(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: string[],
  angle: number,
) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
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
  x: number,
  y: number,
  width: number,
  height: number,
  start: string,
  end: string,
  angle: number,
) {
  const points = gradientEndpoints(angle);
  const gradient = context.createLinearGradient(
    x + points.x1 * width,
    y + points.y1 * height,
    x + points.x2 * width,
    y + points.y2 * height,
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

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const update = (next: string) => {
    const normalized = next.startsWith("#") ? next : `#${next}`;
    onChange(normalized.toUpperCase());
  };

  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-control">
        <input
          aria-label={`${label} color picker`}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <input
          aria-label={`${label} hex value`}
          maxLength={7}
          value={value}
          onChange={(event) => update(event.target.value)}
        />
      </span>
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit = "%",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider-field">
      <span className="field-label">
        <span>{label}</span>
        <output>
          {value}
          {unit}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export default function Home() {
  const [background, setBackground] = useState(defaults.background);
  const [backgroundEnd, setBackgroundEnd] = useState(defaults.backgroundEnd);
  const [left, setLeft] = useState(defaults.left);
  const [leftEnd, setLeftEnd] = useState(defaults.leftEnd);
  const [right, setRight] = useState(defaults.right);
  const [rightEnd, setRightEnd] = useState(defaults.rightEnd);
  const [gradientAngle, setGradientAngle] = useState(defaults.gradientAngle);
  const [split, setSplit] = useState(defaults.split);
  const [peak, setPeak] = useState(defaults.peak);
  const [edge, setEdge] = useState(defaults.edge);
  const [rotation, setRotation] = useState(defaults.rotation);
  const [padding, setPadding] = useState(defaults.padding);
  const [radius, setRadius] = useState(defaults.radius);
  const [label, setLabel] = useState(defaults.label);
  const [labelColor, setLabelColor] = useState(defaults.labelColor);
  const [labelSize, setLabelSize] = useState(defaults.labelSize);
  const [labelY, setLabelY] = useState(defaults.labelY);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [locked, setLocked] = useState(true);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(92);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [surpriseMode, setSurpriseMode] =
    useState<SurpriseMode>("complementary");
  const [rainbow, setRainbow] = useState(false);

  const mountainTransform = useMemo(() => {
    const scale = 1 - padding / 100;
    return `translate(50 50) rotate(${rotation}) scale(${scale}) translate(-50 -50)`;
  }, [padding, rotation]);

  const leftPath = `M 0 ${edge} L ${split} ${peak} L ${split} 100 L 0 100 Z`;
  const rightPath = `M ${split} ${peak} L 100 ${edge} L 100 100 L ${split} 100 Z`;
  const originalBackground =
    background === defaults.background &&
    backgroundEnd === defaults.backgroundEnd &&
    gradientAngle === defaults.gradientAngle;
  const originalLeft =
    left === defaults.left &&
    leftEnd === defaults.leftEnd &&
    gradientAngle === defaults.gradientAngle;
  const originalRight =
    right === defaults.right &&
    rightEnd === defaults.rightEnd &&
    gradientAngle === defaults.gradientAngle;
  const customGradient = gradientEndpoints(gradientAngle);
  const availableFormats: ExportFormat[] = rainbow
    ? ["gif", "svg"]
    : ["png", "jpeg", "webp", "svg"];

  useEffect(() => {
    window.localStorage.setItem(
      "whitecaplol-avatar-palette",
      JSON.stringify({
        background,
        backgroundEnd,
        left,
        leftEnd,
        right,
        rightEnd,
        gradientAngle,
        rainbow,
      }),
    );
  }, [
    background,
    backgroundEnd,
    left,
    leftEnd,
    right,
    rightEnd,
    gradientAngle,
    rainbow,
  ]);

  const disableRainbow = () => {
    setRainbow(false);
    setFormat((current) => (current === "gif" ? "png" : current));
  };

  const reset = () => {
    disableRainbow();
    setBackground(defaults.background);
    setBackgroundEnd(defaults.backgroundEnd);
    setLeft(defaults.left);
    setLeftEnd(defaults.leftEnd);
    setRight(defaults.right);
    setRightEnd(defaults.rightEnd);
    setGradientAngle(defaults.gradientAngle);
    setSplit(defaults.split);
    setPeak(defaults.peak);
    setEdge(defaults.edge);
    setRotation(defaults.rotation);
    setPadding(defaults.padding);
    setRadius(defaults.radius);
    setLabel(defaults.label);
    setLabelColor(defaults.labelColor);
    setLabelSize(defaults.labelSize);
    setLabelY(defaults.labelY);
  };

  const surpriseMe = () => {
    disableRainbow();

    if (surpriseMode === "random") {
      setBackground(randomHex());
      setBackgroundEnd(randomHex());
      setLeft(randomHex());
      setLeftEnd(randomHex());
      setRight(randomHex());
      setRightEnd(randomHex());
      setGradientAngle(Math.floor(Math.random() * 361));
      return;
    }

    const baseHue = Math.floor(Math.random() * 360);
    const complementHue = (baseHue + 180) % 360;
    const accentShift = Math.floor(Math.random() * 31) - 15;

    setBackground(
      hslToHex(
        baseHue,
        62 + Math.floor(Math.random() * 17),
        43 + Math.floor(Math.random() * 10),
      ),
    );
    setBackgroundEnd(
      hslToHex(
        (baseHue + accentShift + 360) % 360,
        58 + Math.floor(Math.random() * 18),
        23 + Math.floor(Math.random() * 12),
      ),
    );
    setLeft(
      hslToHex(
        complementHue,
        38 + Math.floor(Math.random() * 18),
        92 + Math.floor(Math.random() * 5),
      ),
    );
    setLeftEnd(
      hslToHex(
        (complementHue + accentShift + 360) % 360,
        35 + Math.floor(Math.random() * 18),
        78 + Math.floor(Math.random() * 10),
      ),
    );
    setRight(
      hslToHex(
        (complementHue + accentShift + 360) % 360,
        42 + Math.floor(Math.random() * 18),
        67 + Math.floor(Math.random() * 12),
      ),
    );
    setRightEnd(
      hslToHex(
        (complementHue - accentShift + 360) % 360,
        48 + Math.floor(Math.random() * 18),
        47 + Math.floor(Math.random() * 14),
      ),
    );
    setGradientAngle(Math.floor(Math.random() * 361));
  };

  const applyExample = (example: ExamplePreset) => {
    setRainbow(Boolean(example.rainbow));
    if (example.rainbow) {
      if (format !== "gif" && format !== "svg") setFormat("gif");
      if (width > 1024 || height > 1024) {
        setWidth(512);
        setHeight(512);
      }
    } else if (format === "gif") {
      setFormat("png");
    }
    setBackground(example.background);
    setBackgroundEnd(
      example.name === "Original" ? defaults.backgroundEnd : example.background,
    );
    setLeft(example.left);
    setLeftEnd(example.name === "Original" ? defaults.leftEnd : example.left);
    setRight(example.right);
    setRightEnd(
      example.name === "Original" ? defaults.rightEnd : example.right,
    );
    setGradientAngle(defaults.gradientAngle);
    setSplit(defaults.split);
    setPeak(defaults.peak);
    setEdge(defaults.edge);
    setRotation(defaults.rotation);
    setPadding(defaults.padding);
    setRadius(defaults.radius);
    setLabel(defaults.label);
  };

  const setDimension = (dimension: "width" | "height", value: number) => {
    const safeValue = Math.min(rainbow ? 1024 : 4096, Math.max(64, value || 64));
    if (dimension === "width") {
      setWidth(safeValue);
      if (locked) setHeight(safeValue);
    } else {
      setHeight(safeValue);
      if (locked) setWidth(safeValue);
    }
  };

  const makeSvg = (exportWidth: number, exportHeight: number) => {
    const safeLabel = escapeXml(label.trim());
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${exportWidth}" height="${exportHeight}" viewBox="0 0 100 100">
  <defs>
    <clipPath id="frame"><rect width="100" height="100" rx="${radius / 2}"/></clipPath>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2=".55">
      <stop stop-color="#559be2"/>
      <stop offset=".48" stop-color="#426bc9"/>
      <stop offset="1" stop-color="#3528ad"/>
    </linearGradient>
    <linearGradient id="left" x1=".1" y1=".35" x2=".9" y2=".75">
      <stop stop-color="#fff"/>
      <stop offset=".65" stop-color="#fdfdfd"/>
      <stop offset="1" stop-color="#f8f8f8"/>
    </linearGradient>
    <linearGradient id="right" x1=".18" y1=".05" x2=".78" y2=".9">
      <stop stop-color="#d2d2d2"/>
      <stop offset=".48" stop-color="#a9a9a9"/>
      <stop offset="1" stop-color="#c7c7c7"/>
    </linearGradient>
    <linearGradient id="custom-sky" x1="${customGradient.x1}" y1="${customGradient.y1}" x2="${customGradient.x2}" y2="${customGradient.y2}">
      <stop stop-color="${background}"/>
      <stop offset="1" stop-color="${backgroundEnd}"/>
    </linearGradient>
    <linearGradient id="custom-left" x1="${customGradient.x1}" y1="${customGradient.y1}" x2="${customGradient.x2}" y2="${customGradient.y2}">
      <stop stop-color="${left}"/>
      <stop offset="1" stop-color="${leftEnd}"/>
    </linearGradient>
    <linearGradient id="custom-right" x1="${customGradient.x1}" y1="${customGradient.y1}" x2="${customGradient.x2}" y2="${customGradient.y2}">
      <stop stop-color="${right}"/>
      <stop offset="1" stop-color="${rightEnd}"/>
    </linearGradient>
    <linearGradient id="rainbow-sky" x1="0" y1="0" x2="1" y2="1">
      ${svgRainbowStops(rainbowColors.background)}
      <animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="2.4s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="rainbow-left" x1="0" y1="0" x2="1" y2="1">
      ${svgRainbowStops(rainbowColors.left)}
      <animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="2.4s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="rainbow-right" x1="0" y1="0" x2="1" y2="1">
      ${svgRainbowStops(rainbowColors.right)}
      <animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="2.4s" repeatCount="indefinite"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="100" height="100" fill="${rainbow ? "url(#rainbow-sky)" : originalBackground ? "url(#sky)" : "url(#custom-sky)"}"/>
    <g transform="${mountainTransform}">
      <path d="${leftPath}" fill="${rainbow ? "url(#rainbow-left)" : originalLeft ? "url(#left)" : "url(#custom-left)"}"/>
      <path d="${rightPath}" fill="${rainbow ? "url(#rainbow-right)" : originalRight ? "url(#right)" : "url(#custom-right)"}"/>
    </g>
    ${
      safeLabel
        ? `<text x="50" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="${labelColor}" font-family="Arial, Helvetica, sans-serif" font-size="${labelSize}" font-weight="700">${safeLabel}</text>`
        : ""
    }
  </g>
</svg>`;
  };

  const makeRasterCanvas = (
    exportWidth: number,
    exportHeight: number,
    rainbowAngle = Math.PI / 4,
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;

    const minSide = Math.min(exportWidth, exportHeight);
    const corner = (radius / 50) * minSide;
    context.save();
    context.beginPath();
    context.roundRect(0, 0, exportWidth, exportHeight, corner);
    context.clip();

    if (rainbow) {
      context.fillStyle = makeCyclingGradient(
        context,
        0,
        0,
        exportWidth,
        exportHeight,
        rainbowColors.background,
        rainbowAngle,
      );
    } else if (originalBackground) {
      const skyGradient = context.createLinearGradient(
        0,
        0,
        exportWidth,
        exportHeight * 0.55,
      );
      skyGradient.addColorStop(0, "#559be2");
      skyGradient.addColorStop(0.48, "#426bc9");
      skyGradient.addColorStop(1, "#3528ad");
      context.fillStyle = skyGradient;
    } else {
      context.fillStyle = makeTwoColorGradient(
        context,
        0,
        0,
        exportWidth,
        exportHeight,
        background,
        backgroundEnd,
        gradientAngle,
      );
    }
    context.fillRect(0, 0, exportWidth, exportHeight);

    context.translate(exportWidth / 2, exportHeight / 2);
    context.rotate((rotation * Math.PI) / 180);
    const scale = 1 - padding / 100;
    context.scale(scale, scale);
    context.translate(-exportWidth / 2, -exportHeight / 2);

    const px = (value: number) => (value / 100) * exportWidth;
    const py = (value: number) => (value / 100) * exportHeight;

    if (rainbow) {
      context.fillStyle = makeCyclingGradient(
        context,
        0,
        py(peak),
        px(split),
        exportHeight - py(peak),
        rainbowColors.left,
        rainbowAngle,
      );
    } else if (originalLeft) {
      const leftTop = py(peak);
      const leftHeight = exportHeight - leftTop;
      const leftWidth = px(split);
      const leftGradient = context.createLinearGradient(
        leftWidth * 0.1,
        leftTop + leftHeight * 0.35,
        leftWidth * 0.9,
        leftTop + leftHeight * 0.75,
      );
      leftGradient.addColorStop(0, "#ffffff");
      leftGradient.addColorStop(0.65, "#fdfdfd");
      leftGradient.addColorStop(1, "#f8f8f8");
      context.fillStyle = leftGradient;
    } else {
      context.fillStyle = makeTwoColorGradient(
        context,
        0,
        py(peak),
        px(split),
        exportHeight - py(peak),
        left,
        leftEnd,
        gradientAngle,
      );
    }
    context.beginPath();
    context.moveTo(0, py(edge));
    context.lineTo(px(split), py(peak));
    context.lineTo(px(split), exportHeight);
    context.lineTo(0, exportHeight);
    context.closePath();
    context.fill();

    if (rainbow) {
      context.fillStyle = makeCyclingGradient(
        context,
        px(split),
        py(peak),
        exportWidth - px(split),
        exportHeight - py(peak),
        rainbowColors.right,
        rainbowAngle,
      );
    } else if (originalRight) {
      const rightLeft = px(split);
      const rightTop = py(peak);
      const rightWidth = exportWidth - rightLeft;
      const rightHeight = exportHeight - rightTop;
      const rightGradient = context.createLinearGradient(
        rightLeft + rightWidth * 0.18,
        rightTop + rightHeight * 0.05,
        rightLeft + rightWidth * 0.78,
        rightTop + rightHeight * 0.9,
      );
      rightGradient.addColorStop(0, "#d2d2d2");
      rightGradient.addColorStop(0.48, "#a9a9a9");
      rightGradient.addColorStop(1, "#c7c7c7");
      context.fillStyle = rightGradient;
    } else {
      context.fillStyle = makeTwoColorGradient(
        context,
        px(split),
        py(peak),
        exportWidth - px(split),
        exportHeight - py(peak),
        right,
        rightEnd,
        gradientAngle,
      );
    }
    context.beginPath();
    context.moveTo(px(split), py(peak));
    context.lineTo(exportWidth, py(edge));
    context.lineTo(exportWidth, exportHeight);
    context.lineTo(px(split), exportHeight);
    context.closePath();
    context.fill();
    context.restore();

    if (label.trim()) {
      context.fillStyle = labelColor;
      context.font = `700 ${(labelSize / 100) * minSide}px Arial, Helvetica, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        label.trim(),
        exportWidth / 2,
        py(labelY),
        exportWidth * 0.88,
      );
    }

    return canvas;
  };

  const makeAnimatedGif = async (
    exportWidth: number,
    exportHeight: number,
  ) => {
    const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
    const gif = GIFEncoder();
    const frameCount = 24;
    let palette: number[][] | undefined;

    for (let frame = 0; frame < frameCount; frame += 1) {
      const angle = (frame / frameCount) * Math.PI * 2;
      const canvas = makeRasterCanvas(exportWidth, exportHeight, angle);
      if (!canvas) throw new Error("Canvas is unavailable.");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");
      const pixels = context.getImageData(
        0,
        0,
        exportWidth,
        exportHeight,
      ).data;

      if (!palette) palette = quantize(pixels, 256);
      const indexed = applyPalette(pixels, palette);
      gif.writeFrame(indexed, exportWidth, exportHeight, {
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
    const exportLimit = format === "gif" ? 1024 : 4096;
    const exportWidth = Math.min(exportLimit, Math.max(64, width));
    const exportHeight = Math.min(exportLimit, Math.max(64, height));
    let blob: Blob | null;

    if (format === "svg") {
      blob = new Blob([makeSvg(exportWidth, exportHeight)], {
        type: "image/svg+xml;charset=utf-8",
      });
    } else if (format === "gif") {
      blob = await makeAnimatedGif(exportWidth, exportHeight);
    } else {
      const canvas = makeRasterCanvas(exportWidth, exportHeight);
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
    anchor.download = `whitecaplol-avatar-${exportWidth}x${exportHeight}.${format === "jpeg" ? "jpg" : format}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1800);
  };

  const copyExport = async () => {
    const exportLimit = format === "gif" ? 1024 : 4096;
    const exportWidth = Math.min(exportLimit, Math.max(64, width));
    const exportHeight = Math.min(exportLimit, Math.max(64, height));
    let value: string;

    if (format === "svg") {
      value = makeSvg(exportWidth, exportHeight);
    } else if (format === "gif") {
      value = await blobToDataUrl(
        await makeAnimatedGif(exportWidth, exportHeight),
      );
    } else {
      const canvas = makeRasterCanvas(exportWidth, exportHeight);
      if (!canvas) return;
      value = canvas.toDataURL(
        `image/${format}`,
        format === "png" ? undefined : quality / 100,
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
        <a className="brand" href="#" aria-label="Whitecaplol Avatar Customizer home">
          {/* The favicon itself is used here so the marks cannot drift apart. */}
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
        <span className="privacy-note">
          <Lock size={14} strokeWidth={2} />
          Nothing leaves your browser
        </span>
      </header>

      <section className="intro">
        <div>
          <h1>Become Papa whitecaplol</h1>
        </div>
      </section>

      <section className="workspace">
        <div className="preview-card">
          <div className="panel-heading">
            <span>
              <ImageIcon size={18} />
              Live preview
            </span>
            <button className="text-button" type="button" onClick={reset}>
              <RotateCcw size={15} />
              Reset
            </button>
          </div>

          <div className="preview-stage">
            <div
              className="avatar-frame"
              style={{ borderRadius: `${radius}%` }}
            >
              <svg
                role="img"
                aria-label="Customized Whitecaplol avatar preview"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <clipPath id="preview-frame">
                    <rect width="100" height="100" rx={radius / 2} />
                  </clipPath>
                  <linearGradient id="preview-sky" x1="0" y1="0" x2="1" y2=".55">
                    <stop stopColor="#559be2" />
                    <stop offset=".48" stopColor="#426bc9" />
                    <stop offset="1" stopColor="#3528ad" />
                  </linearGradient>
                  <linearGradient
                    id="preview-left"
                    x1=".1"
                    y1=".35"
                    x2=".9"
                    y2=".75"
                  >
                    <stop stopColor="#fff" />
                    <stop offset=".65" stopColor="#fdfdfd" />
                    <stop offset="1" stopColor="#f8f8f8" />
                  </linearGradient>
                  <linearGradient
                    id="preview-right"
                    x1=".18"
                    y1=".05"
                    x2=".78"
                    y2=".9"
                  >
                    <stop stopColor="#d2d2d2" />
                    <stop offset=".48" stopColor="#a9a9a9" />
                    <stop offset="1" stopColor="#c7c7c7" />
                  </linearGradient>
                  <linearGradient
                    id="preview-custom-sky"
                    x1={customGradient.x1}
                    y1={customGradient.y1}
                    x2={customGradient.x2}
                    y2={customGradient.y2}
                  >
                    <stop stopColor={background} />
                    <stop offset="1" stopColor={backgroundEnd} />
                  </linearGradient>
                  <linearGradient
                    id="preview-custom-left"
                    x1={customGradient.x1}
                    y1={customGradient.y1}
                    x2={customGradient.x2}
                    y2={customGradient.y2}
                  >
                    <stop stopColor={left} />
                    <stop offset="1" stopColor={leftEnd} />
                  </linearGradient>
                  <linearGradient
                    id="preview-custom-right"
                    x1={customGradient.x1}
                    y1={customGradient.y1}
                    x2={customGradient.x2}
                    y2={customGradient.y2}
                  >
                    <stop stopColor={right} />
                    <stop offset="1" stopColor={rightEnd} />
                  </linearGradient>
                  <linearGradient
                    id="preview-rainbow-sky"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    {rainbowColors.background.map((color, index) => (
                      <stop
                        key={color}
                        offset={index / (rainbowColors.background.length - 1)}
                        stopColor={color}
                      />
                    ))}
                    <animateTransform
                      attributeName="gradientTransform"
                      type="rotate"
                      from="0 .5 .5"
                      to="360 .5 .5"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </linearGradient>
                  <linearGradient
                    id="preview-rainbow-left"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    {rainbowColors.left.map((color, index) => (
                      <stop
                        key={color}
                        offset={index / (rainbowColors.left.length - 1)}
                        stopColor={color}
                      />
                    ))}
                    <animateTransform
                      attributeName="gradientTransform"
                      type="rotate"
                      from="0 .5 .5"
                      to="360 .5 .5"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </linearGradient>
                  <linearGradient
                    id="preview-rainbow-right"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    {rainbowColors.right.map((color, index) => (
                      <stop
                        key={color}
                        offset={index / (rainbowColors.right.length - 1)}
                        stopColor={color}
                      />
                    ))}
                    <animateTransform
                      attributeName="gradientTransform"
                      type="rotate"
                      from="0 .5 .5"
                      to="360 .5 .5"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </linearGradient>
                </defs>
                <g clipPath="url(#preview-frame)">
                  <rect
                    width="100"
                    height="100"
                    fill={
                      rainbow
                        ? "url(#preview-rainbow-sky)"
                        : originalBackground
                          ? "url(#preview-sky)"
                          : "url(#preview-custom-sky)"
                    }
                  />
                  <g transform={mountainTransform}>
                    <path
                      d={leftPath}
                      fill={
                        rainbow
                          ? "url(#preview-rainbow-left)"
                          : originalLeft
                            ? "url(#preview-left)"
                            : "url(#preview-custom-left)"
                      }
                    />
                    <path
                      d={rightPath}
                      fill={
                        rainbow
                          ? "url(#preview-rainbow-right)"
                          : originalRight
                            ? "url(#preview-right)"
                            : "url(#preview-custom-right)"
                      }
                    />
                  </g>
                  {label.trim() && (
                    <text
                      x="50"
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={labelColor}
                      fontSize={labelSize}
                      fontWeight="700"
                      fontFamily="Arial, Helvetica, sans-serif"
                    >
                      {label.trim()}
                    </text>
                  )}
                </g>
              </svg>
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

            <div className="preset-row" aria-label="Size presets">
              {sizePresets
                .filter((preset) => !rainbow || preset.value <= 1024)
                .map((preset) => (
                <button
                  type="button"
                  className={
                    width === preset.value && height === preset.value
                      ? "active"
                      : ""
                  }
                  key={preset.value}
                  onClick={() => {
                    setWidth(preset.value);
                    setHeight(preset.value);
                  }}
                >
                  <span>{preset.label}</span>
                  <small>{preset.value}px</small>
                </button>
                ))}
            </div>

            <div className="dimension-row">
              <label>
                Width
                <span>
                  <input
                    type="number"
                    min="64"
                    max={rainbow ? 1024 : 4096}
                    value={width}
                    onChange={(event) =>
                      setDimension("width", Number(event.target.value))
                    }
                  />
                  px
                </span>
              </label>
              <button
                type="button"
                className={`lock-button ${locked ? "active" : ""}`}
                onClick={() => setLocked((current) => !current)}
                aria-label={
                  locked ? "Unlock aspect ratio" : "Lock aspect ratio"
                }
                title={locked ? "Aspect ratio locked" : "Aspect ratio unlocked"}
              >
                <Lock size={16} />
              </button>
              <label>
                Height
                <span>
                  <input
                    type="number"
                    min="64"
                    max={rainbow ? 1024 : 4096}
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
              <button
                className="download-button"
                type="button"
                onClick={download}
              >
                {downloaded ? <Check size={19} /> : <Download size={19} />}
                {downloaded ? "Exported" : "Export avatar"}
              </button>
            </div>
          </div>
        </div>

        <aside className="controls-card">
          <div className="panel-heading controls-heading">
            <span>
              <SlidersHorizontal size={18} />
              Customize
            </span>
          </div>

          <section className="control-section">
            <h2>
              <GalleryHorizontalEnd size={17} />
              Examples
            </h2>
            <div className="example-list">
              {examples.map((example) => {
                const isOriginal = example.name === "Original";
                const active =
                  rainbow === Boolean(example.rainbow) &&
                  background === example.background &&
                  backgroundEnd ===
                    (isOriginal ? defaults.backgroundEnd : example.background) &&
                  left === example.left &&
                  leftEnd === (isOriginal ? defaults.leftEnd : example.left) &&
                  right === example.right &&
                  rightEnd ===
                    (isOriginal ? defaults.rightEnd : example.right) &&
                  gradientAngle === defaults.gradientAngle;

                return (
                  <button
                    className={`example-option ${active ? "active" : ""}`}
                    type="button"
                    key={example.name}
                    onClick={() => applyExample(example)}
                  >
                    <span
                      className={`example-swatch ${example.rainbow ? "rainbow" : ""}`}
                      style={{
                        backgroundColor: example.background,
                        backgroundImage: example.rainbow
                          ? "linear-gradient(135deg, #ff3b30, #ff9500, #ffcc00, #34c759, #0a84ff, #5856d6, #af52de)"
                          : example.image
                            ? `url("${example.image}")`
                            : undefined,
                        backgroundSize: example.rainbow ? "300% 300%" : "cover",
                      }}
                      aria-hidden="true"
                    >
                      {!example.image && !example.rainbow && (
                        <>
                          <span
                            className="example-left"
                            style={{ backgroundColor: example.left }}
                          />
                          <span
                            className="example-right"
                            style={{ backgroundColor: example.right }}
                          />
                        </>
                      )}
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
              <h2>
                <Palette size={17} />
                Colors
              </h2>
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
              <ColorField
                label="Background start"
                value={background}
                onChange={(value) => {
                  disableRainbow();
                  setBackground(value);
                }}
              />
              <ColorField
                label="Background end"
                value={backgroundEnd}
                onChange={(value) => {
                  disableRainbow();
                  setBackgroundEnd(value);
                }}
              />
              <ColorField
                label="Left cap start"
                value={left}
                onChange={(value) => {
                  disableRainbow();
                  setLeft(value);
                }}
              />
              <ColorField
                label="Left cap end"
                value={leftEnd}
                onChange={(value) => {
                  disableRainbow();
                  setLeftEnd(value);
                }}
              />
              <ColorField
                label="Right cap start"
                value={right}
                onChange={(value) => {
                  disableRainbow();
                  setRight(value);
                }}
              />
              <ColorField
                label="Right cap end"
                value={rightEnd}
                onChange={(value) => {
                  disableRainbow();
                  setRightEnd(value);
                }}
              />
              <Slider
                label="Gradient angle"
                value={gradientAngle}
                min={0}
                max={360}
                unit="°"
                onChange={(value) => {
                  disableRainbow();
                  setGradientAngle(value);
                }}
              />
            </div>
          </section>

          <section className="control-section">
            <h2>
              <MoveHorizontal size={17} />
              Shape
            </h2>
            <div className="slider-grid">
              <Slider
                label="Split"
                value={split}
                min={20}
                max={80}
                onChange={setSplit}
              />
              <Slider
                label="Peak height"
                value={peak}
                min={15}
                max={65}
                onChange={setPeak}
              />
              <Slider
                label="Edge height"
                value={edge}
                min={55}
                max={95}
                onChange={setEdge}
              />
              <Slider
                label="Rotation"
                value={rotation}
                min={-20}
                max={20}
                unit="°"
                onChange={setRotation}
              />
              <Slider
                label="Padding"
                value={padding}
                min={0}
                max={24}
                onChange={setPadding}
              />
              <Slider
                label="Corner radius"
                value={radius}
                min={0}
                max={50}
                onChange={setRadius}
              />
            </div>
          </section>

          <section className="control-section text-section">
            <h2>
              <Type size={17} />
              Text overlay
            </h2>
            <label className="text-input">
              Display text
              <input
                type="text"
                maxLength={22}
                value={label}
                placeholder="Optional name or tag"
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <div className="text-settings">
              <ColorField
                label="Text color"
                value={labelColor}
                onChange={setLabelColor}
              />
              <Slider
                label="Text size"
                value={labelSize}
                min={4}
                max={15}
                onChange={setLabelSize}
              />
              <Slider
                label="Position"
                value={labelY}
                min={8}
                max={92}
                onChange={setLabelY}
              />
            </div>
          </section>
        </aside>
      </section>

      <footer>
        <span>Whitecaplol&apos;s Avatar Customizer</span>
        <span>Built for quick, clean exports.</span>
      </footer>
    </main>
  );
}
