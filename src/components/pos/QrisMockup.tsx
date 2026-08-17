"use client";

import { useMemo } from "react";

const GRID = 25;
const FINDER_SIZE = 7;

/** Angka acak yang selalu sama untuk seed yang sama, supaya pola QR tidak berkedip tiap render */
function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function isFinderArea(row: number, col: number): boolean {
  const inTopLeft = row < FINDER_SIZE + 1 && col < FINDER_SIZE + 1;
  const inTopRight = row < FINDER_SIZE + 1 && col >= GRID - FINDER_SIZE - 1;
  const inBottomLeft = row >= GRID - FINDER_SIZE - 1 && col < FINDER_SIZE + 1;
  return inTopLeft || inTopRight || inBottomLeft;
}

/**
 * Tampilan QRIS untuk peragaan alur pembayaran.
 * Pola kotaknya dibangkitkan acak — sengaja bukan kode QR yang valid, jadi tidak bisa dipindai.
 */
export default function QrisMockup({
  merchantName,
  amount,
  seed = "SIMPLEPOS",
  size = 168,
}: {
  merchantName: string;
  amount: number;
  seed?: string;
  size?: number;
}) {
  const modules = useMemo(() => {
    const numericSeed =
      Array.from(`${seed}-${Math.round(amount)}`).reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0
      ) || 1;
    const random = seededRandom(numericSeed);

    const cells: boolean[][] = [];
    for (let row = 0; row < GRID; row++) {
      const line: boolean[] = [];
      for (let col = 0; col < GRID; col++) {
        line.push(isFinderArea(row, col) ? false : random() > 0.52);
      }
      cells.push(line);
    }
    return cells;
  }, [seed, amount]);

  const cellSize = size / GRID;

  const finderOrigins = [
    { row: 0, col: 0 },
    { row: 0, col: GRID - FINDER_SIZE },
    { row: GRID - FINDER_SIZE, col: 0 },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-lg border border-line bg-white p-3">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Contoh kode QRIS untuk ${merchantName}. Kode ini hanya peragaan dan tidak dapat dipindai.`}
        >
          <rect width={size} height={size} fill="#ffffff" />

          {modules.map((line, row) =>
            line.map((filled, col) =>
              filled ? (
                <rect
                  key={`${row}-${col}`}
                  x={col * cellSize}
                  y={row * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="#18181b"
                />
              ) : null
            )
          )}

          {/* Tiga kotak sudut khas kode QR */}
          {finderOrigins.map((origin) => (
            <g key={`${origin.row}-${origin.col}`}>
              <rect
                x={origin.col * cellSize}
                y={origin.row * cellSize}
                width={FINDER_SIZE * cellSize}
                height={FINDER_SIZE * cellSize}
                fill="#18181b"
              />
              <rect
                x={(origin.col + 1) * cellSize}
                y={(origin.row + 1) * cellSize}
                width={(FINDER_SIZE - 2) * cellSize}
                height={(FINDER_SIZE - 2) * cellSize}
                fill="#ffffff"
              />
              <rect
                x={(origin.col + 2) * cellSize}
                y={(origin.row + 2) * cellSize}
                width={(FINDER_SIZE - 4) * cellSize}
                height={(FINDER_SIZE - 4) * cellSize}
                fill="#18181b"
              />
            </g>
          ))}
        </svg>
      </div>

      <p className="mt-2.5 text-center text-[12px] font-semibold text-ink">{merchantName}</p>
      <p className="text-center text-[11px] text-ink-muted">NMID: ID1024····8891 · Peragaan</p>
    </div>
  );
}
