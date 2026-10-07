import { useEffect, useRef, type RefObject } from "react";
import {
  idle,
  capture,
} from "../../../pip-project-kit/assets/animation/assets.json";

// Drawing registration and capture timing from the supplied prototype, without its host wrapper.
export function Pip({
  saved,
  quiet,
  played,
}: {
  saved: number;
  quiet: boolean;
  played: RefObject<number>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const canvas = ref.current!,
      context = canvas.getContext("2d")!;
    const image = new Image();
    const asset = saved ? capture : idle;
    const animate = saved > played.current;
    played.current = saved;
    let timer: ReturnType<typeof setTimeout>,
      disposed = false,
      frame = 0;
    const times = [120, 90, 90, 90, 100, 100, 100, 100, 140, 140, 110, 0];
    function draw() {
      if (disposed) return;
      const [anchorX, anchorY] = idle.anchors[0];
      const [dx, dy, scale, angle] = asset.alignment[frame];
      context.clearRect(0, 0, 256, 256);
      context.save();
      context.translate(128 - anchorX * 1.2, 239 - anchorY * 1.2);
      context.scale(1.2, 1.2);
      context.translate(96, 96);
      context.rotate(-angle);
      context.scale(1 / scale, 1 / scale);
      context.translate(-96 - dx, -96 - dy);
      context.drawImage(
        image,
        (frame % 4) * 192,
        Math.floor(frame / 4) * 192,
        192,
        192,
        0,
        0,
        192,
        192,
      );
      context.restore();
      canvas.dataset.frame = String(frame);
      if (
        animate &&
        !quiet &&
        !reduced.matches &&
        !document.hidden &&
        frame < 11
      )
        timer = setTimeout(() => {
          frame++;
          draw();
        }, times[frame]);
    }
    function settle() {
      clearTimeout(timer);
      frame = saved ? 11 : 0;
      if (image.complete) draw();
    }
    image.src = asset.src;
    image
      .decode()
      .then(() => {
        frame = saved && (!animate || quiet || reduced.matches) ? 11 : 0;
        draw();
      })
      .catch(() => {});
    reduced.addEventListener("change", settle);
    document.addEventListener("visibilitychange", settle);
    return () => {
      disposed = true;
      clearTimeout(timer);
      reduced.removeEventListener("change", settle);
      document.removeEventListener("visibilitychange", settle);
    };
  }, [saved, quiet, played]);
  return (
    <canvas
      ref={ref}
      width={256}
      height={256}
      role="img"
      aria-label="Pip, an apricot bird"
    />
  );
}
