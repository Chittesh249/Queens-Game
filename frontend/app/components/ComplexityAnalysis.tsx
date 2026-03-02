"use client";

import { useEffect, useState } from "react";
import * as api from "../utils/api";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    LogarithmicScale,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    LogarithmicScale,
    Title,
    Tooltip,
    Legend
);

interface BenchmarkResult {
    algorithm: string;
    n: number;
    timeMs: number;
    statesExplored: number;
    spaceComplexity: number;
}

export default function ComplexityAnalysis({ onBack }: { onBack: () => void }) {
    const [data, setData] = useState<BenchmarkResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getBenchmarks()
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching benchmarks:", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "50px",
                color: "#333",
                background: "rgba(255,255,255,0.8)",
                borderRadius: "20px",
                backdropFilter: "blur(10px)"
            }}>
                <div style={{ fontSize: 20, marginBottom: 20 }}>Benchmarking Algorithms...</div>
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "4px solid #ccc",
                    borderTop: "4px solid #333",
                    animation: "spin 1s linear infinite"
                }} />
                <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    const algorithms = ["Greedy", "Minimax DP", "Backtracking"];
    const sizes = Array.from(new Set(data.map(d => d.n))).sort((a, b) => a - b);

    const colors = {
        "Greedy": "#43CBFF",
        "Minimax DP": "#9708CC",
        "Backtracking": "#F97794"
    };

    const timeData = {
        labels: sizes,
        datasets: algorithms.map((algo) => ({
            label: algo,
            data: sizes.map(n => data.find(d => d.algorithm === algo && d.n === n)?.timeMs || 0),
            borderColor: colors[algo as keyof typeof colors],
            backgroundColor: colors[algo as keyof typeof colors] + "80",
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 8,
        })),
    };

    const spaceData = {
        labels: sizes,
        datasets: algorithms.map((algo) => ({
            label: algo,
            data: sizes.map(n => data.find(d => d.algorithm === algo && d.n === n)?.statesExplored || 0),
            borderColor: colors[algo as keyof typeof colors],
            backgroundColor: colors[algo as keyof typeof colors] + "80",
            tension: 0.3,
            pointRadius: 5,
            pointHoverRadius: 8,
        })),
    };

    return (
        <div style={{
            padding: "40px",
            maxWidth: "1100px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "30px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.3)"
        }}>
            <button
                onClick={onBack}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#333",
                    background: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    marginBottom: "30px",
                    transition: "all 0.2s"
                }}
                onMouseOver={e => {
                    e.currentTarget.style.transform = "translateX(-4px)";
                    e.currentTarget.style.background = "#f9f9f9";
                }}
                onMouseOut={e => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.background = "#fff";
                }}
            >
                <span>←</span> Back to Menu
            </button>

            <h1 style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#1a1a1a",
                marginBottom: "10px",
                textAlign: "center"
            }}>Algorithm Performance</h1>
            <p style={{
                textAlign: "center",
                color: "#666",
                marginBottom: "40px",
                fontSize: "16px"
            }}>Comparative analysis of time and space complexity across board sizes</p>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
                gap: "40px"
            }}>
                <div style={{
                    background: "#fff",
                    padding: "25px",
                    borderRadius: "20px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                }}>
                    <h3 style={{ marginBottom: "20px", color: "#444", fontSize: "18px" }}>Time Complexity (Execution Time)</h3>
                    <Line
                        data={timeData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { position: 'bottom' },
                                tooltip: {
                                    callbacks: {
                                        label: (context: any) => `${context.dataset.label}: ${context.raw} ms`
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: { display: true, text: 'Time (ms)', font: { weight: 'bold' } }
                                },
                                x: {
                                    title: { display: true, text: 'Board Size (N)', font: { weight: 'bold' } }
                                }
                            }
                        }}
                    />
                </div>

                <div style={{
                    background: "#fff",
                    padding: "25px",
                    borderRadius: "20px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                }}>
                    <h3 style={{ marginBottom: "20px", color: "#444", fontSize: "18px" }}>Space Complexity (States Explored)</h3>
                    <Line
                        data={spaceData}
                        options={{
                            responsive: true,
                            plugins: {
                                legend: { position: 'bottom' },
                                tooltip: {
                                    callbacks: {
                                        label: (context: any) => `${context.dataset.label}: ${Number(context.raw).toLocaleString()} states`
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    type: 'logarithmic',
                                    title: { display: true, text: 'States (Log Scale)', font: { weight: 'bold' } },
                                    ticks: {
                                        callback: (value: any) => {
                                            if (value === 0) return "0";
                                            return value.toLocaleString();
                                        }
                                    }
                                },
                                x: {
                                    title: { display: true, text: 'Board Size (N)', font: { weight: 'bold' } }
                                }
                            }
                        }}
                    />
                </div>
            </div>

            <div style={{
                marginTop: "40px",
                padding: "20px",
                background: "rgba(67, 203, 255, 0.1)",
                borderRadius: "15px",
                fontSize: "14px",
                color: "#444",
                lineHeight: "1.6"
            }}>
                <strong>Analysis Note:</strong>
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                    <li><strong>Greedy Algorithm (Cyan):</strong> Linear complexity. Quick but heuristic-based.</li>
                    <li><strong>Minimax DP (Purple):</strong> Efficient search using memoization; scales better for smaller $N$.</li>
                    <li><strong>Pure Backtracking (Pink):</strong> Exponential complexity. Shows the raw computational cost for large board sizes.</li>
                </ul>
            </div>
        </div>
    );
}
