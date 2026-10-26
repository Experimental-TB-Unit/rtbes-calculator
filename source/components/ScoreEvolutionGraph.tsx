import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import type { Visit, Evaluation } from "../model.ts";
Chart.register(...registerables);
export default function ScoreEvolutionGraph({
  visits,
  results,
}: {
  visits: Visit[];
  results: Evaluation[];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const chart = new Chart(canvas.current, {
      type: "line",
      data: {
        datasets: (
          [
            ["activityScore", "Activity", "#4f46e5"],
            ["nonActivityScore", "Non-activity", "#0d9488"],
          ] as const
        ).map(([key, label, color]) => ({
          label,
          borderColor: color,
          backgroundColor: color,
          tension: 0,
          spanGaps: false,
          pointRadius: 4,
          data: results.map((r, i) => ({
            x: visits[i].day ?? i,
            y: r.score?.[key] ?? null,
          })),
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            type: "linear",
            title: { display: true, text: "Days since baseline" },
          },
          y: { beginAtZero: true, title: { display: true, text: "Score" } },
        },
        plugins: { legend: { position: "top" } },
      },
    });
    return () => chart.destroy();
  }, [visits, results]);
  return (
    <section className="bg-white rounded-xl p-6 border border-slate-200 mt-8">
      <h2 className="text-lg font-bold">Score evolution</h2>
      <p className="text-sm text-slate-500 mb-4">
        Each follow-up compares with the preceding visit. Incomplete visits have
        no plotted score.
      </p>
      <div style={{ height: 300 }}>
        <canvas
          ref={canvas}
          role="img"
          aria-label="RTBES scores against elapsed days"
        />
      </div>
      <table className="w-full text-sm mt-4">
        <thead>
          <tr>
            <th>Visit</th>
            <th>Day</th>
            <th>Activity</th>
            <th>Non-activity</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={visits[i].id} className="text-center border-t">
              <td>{i ? `FU ${i}` : "Baseline"}</td>
              <td>{visits[i].day ?? "—"}</td>
              <td>{r.score?.activityScore ?? "—"}</td>
              <td>{r.score?.nonActivityScore ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
