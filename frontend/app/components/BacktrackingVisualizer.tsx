"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import * as api from "../utils/api";

type VisualizerStep = {
    type: "TRY" | "PLACE" | "REMOVE" | "CONFLICT" | "SUCCESS" | "BACKTRACK";
    position: number;
    queens: number[];
    message: string;
};

type Props = {
    n: number;
    regions: number[];
    boxColors: string[];
    hasBorder: any[];
    onBack: () => void;
};

export default function BacktrackingVisualizer({ n, regions, boxColors, hasBorder, onBack }: Props) {
    const [steps, setSteps] = useState<VisualizerStep[]>([]);
    const [currentStepIdx, setCurrentStepIdx] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(500); // ms
    const [isLoading, setIsLoading] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSteps = async () => {
            setIsLoading(true);
            try {
                const data = await api.getBacktrackingSteps(n, regions);
                setSteps(data);
                setCurrentStepIdx(0);
            } catch (err) {
                console.error("Failed to fetch backtracking steps:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSteps();
    }, [n, regions]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying && currentStepIdx < steps.length - 1) {
            timer = setTimeout(() => {
                setCurrentStepIdx((prev) => prev + 1);
            }, speed);
        } else if (currentStepIdx >= steps.length - 1) {
            setIsPlaying(false);
        }
        return () => clearTimeout(timer);
    }, [isPlaying, currentStepIdx, steps.length, speed]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentStepIdx]);

    const currentStep = steps[currentStepIdx] || null;
    const currentQueens = currentStep ? currentStep.queens : [];
    const highlightPos = currentStep ? currentStep.position : -1;

    const handleStepForward = () => {
        if (currentStepIdx < steps.length - 1) {
            setCurrentStepIdx(currentStepIdx + 1);
        }
    };

    const handleStepBackward = () => {
        if (currentStepIdx > 0) {
            setCurrentStepIdx(currentStepIdx - 1);
        }
    };

    const handleRestart = () => {
        setCurrentStepIdx(0);
        setIsPlaying(false);
    };

    const handleSkipToEnd = () => {
        setCurrentStepIdx(steps.length - 1);
        setIsPlaying(false);
    };

    if (isLoading) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                padding: "40px",
                background: "rgba(255,255,255,0.8)",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}>Optimizing Strategy...</div>
                <div style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #FF6A88", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            width: "100%",
            maxWidth: "1200px",
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <button
                    onClick={onBack}
                    style={{
                        padding: "8px 16px",
                        fontSize: "14px",
                        fontWeight: "600",
                        borderRadius: "6px",
                        border: "none",
                        background: "#fff",
                        color: "#333",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "transform 0.1s ease, box-shadow 0.1s ease",
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                    }}
                >
                    <span>←</span> Back
                </button>
                <h2 style={{ color: "#333", margin: 0, fontSize: "28px", fontWeight: "800" }}>Backtracking Visualizer</h2>
                <div style={{ width: "100px" }}></div>
            </div>

            <div style={{
                display: "flex",
                gap: "40px",
                flexWrap: "wrap",
                justifyContent: "center",
                width: "100%",
            }}>
                {/* Board Section */}
                <div style={{ flex: "1.2", minWidth: "300px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${n}, minmax(40px, 60px))`,
                            gridTemplateRows: `repeat(${n}, minmax(40px, 60px))`,
                            gap: "0",
                            border: "4px solid #2c3e50",
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
                        }}
                    >
                        {Array.from({ length: n * n }).map((_, i) => {
                            const hasQueen = currentQueens.includes(i);
                            const isHighlight = highlightPos === i;
                            const bgColor = boxColors[i];
                            const border = hasBorder[i];

                            let overlayColor = "transparent";
                            if (isHighlight) {
                                if (currentStep?.type === "TRY") overlayColor = "rgba(255, 235, 59, 0.6)";
                                else if (currentStep?.type === "CONFLICT") overlayColor = "rgba(244, 67, 54, 0.6)";
                                else if (currentStep?.type === "PLACE") overlayColor = "rgba(76, 175, 80, 0.6)";
                                else if (currentStep?.type === "REMOVE" || currentStep?.type === "BACKTRACK") overlayColor = "rgba(158, 158, 158, 0.6)";
                            }

                            const borderStyle = {
                                borderTop: border.top ? "2px solid rgba(0,0,0,0.2)" : "1px solid rgba(0,0,0,0.05)",
                                borderRight: border.right ? "2px solid rgba(0,0,0,0.2)" : "1px solid rgba(0,0,0,0.05)",
                                borderBottom: border.bottom ? "2px solid rgba(0,0,0,0.2)" : "1px solid rgba(0,0,0,0.05)",
                                borderLeft: border.left ? "2px solid rgba(0,0,0,0.2)" : "1px solid rgba(0,0,0,0.05)",
                            };

                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: bgColor,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "relative",
                                        ...borderStyle,
                                    }}
                                >
                                    <div style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: overlayColor,
                                        zIndex: 1,
                                        transition: speed > 100 ? "background-color 0.2s ease" : "none",
                                    }} />
                                    {hasQueen && (
                                        <span style={{
                                            filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.4))",
                                            fontSize: n > 8 ? "24px" : "32px",
                                            zIndex: 2,
                                            transform: isHighlight ? "scale(1.2)" : "scale(1)",
                                            transition: speed > 100 ? "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : "none",
                                        }}>
                                            👑
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Controls */}
                    <div style={{
                        marginTop: "24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "20px",
                        width: "100%",
                        background: "rgba(255,255,255,0.9)",
                        padding: "24px",
                        borderRadius: "16px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                        border: "1px solid rgba(255,255,255,0.3)"
                    }}>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
                            <button
                                onClick={handleRestart}
                                style={{ ...btnStyle, background: "#f1f2f6", color: "#333", border: "1px solid #ccc" }}
                            >
                                ↺ RESTART
                            </button>
                            <button
                                onClick={handleStepBackward}
                                disabled={currentStepIdx <= 0}
                                style={btnStyle}
                            >
                                ◀ PREV
                            </button>
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                style={{
                                    ...btnStyle,
                                    background: isPlaying ? "#ff4757" : "#2ed573",
                                    color: "#fff",
                                    width: "110px",
                                    border: "none",
                                    fontWeight: "800",
                                    boxShadow: isPlaying ? "0 4px 12px rgba(255, 71, 87, 0.3)" : "0 4px 12px rgba(46, 213, 115, 0.3)"
                                }}
                            >
                                {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
                            </button>
                            <button
                                onClick={handleStepForward}
                                disabled={currentStepIdx >= steps.length - 1}
                                style={btnStyle}
                            >
                                NEXT ▶
                            </button>
                            <button
                                onClick={handleSkipToEnd}
                                style={{
                                    ...btnStyle,
                                    background: "#3498db",
                                    color: "#fff",
                                    border: "none",
                                    fontWeight: "800",
                                    boxShadow: "0 4px 12px rgba(52, 152, 219, 0.3)"
                                }}
                            >
                                ⏭ END
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#666" }}>ANIMATION SPEED</span>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#333" }}>{speed}ms</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="1000"
                                step="10"
                                value={speed}
                                onChange={(e) => setSpeed(parseInt(e.target.value))}
                                style={{
                                    width: "100%",
                                    accentColor: "#FF6A88",
                                    cursor: "pointer"
                                }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#999" }}>
                                <span>FAST</span>
                                <span>SLOW</span>
                            </div>
                        </div>

                        <div style={{
                            fontSize: "14px",
                            color: "#333",
                            fontWeight: "800",
                            background: "#f1f2f6",
                            padding: "4px 12px",
                            borderRadius: "20px"
                        }}>
                            STEP {currentStepIdx + 1} / {steps.length}
                        </div>
                    </div>
                </div>

                {/* Logs Section */}
                <div style={{
                    flex: "1",
                    minWidth: "300px",
                    height: "500px",
                    background: "#1e1e1e",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
                }}>
                    <div style={{ padding: "12px 20px", background: "#333", color: "#eee", fontWeight: "bold", borderBottom: "1px solid #444" }}>
                        Execution Log
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                        {steps.slice(0, currentStepIdx + 1).map((step, idx) => (
                            <div key={idx} style={{
                                padding: "6px 10px",
                                fontSize: "13px",
                                borderLeft: `4px solid ${getTypeColor(step.type)}`,
                                marginBottom: "4px",
                                background: idx === currentStepIdx ? "rgba(255,255,255,0.1)" : "transparent",
                                color: idx === currentStepIdx ? "#fff" : "#aaa",
                                fontFamily: "monospace"
                            }}>
                                <span style={{ color: "#666", marginRight: "8px" }}>[{idx + 1}]</span>
                                {step.message}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function getTypeColor(type: string) {
    switch (type) {
        case "TRY": return "#FFEB3B";
        case "PLACE": return "#4CAF50";
        case "REMOVE": return "#9E9E9E";
        case "CONFLICT": return "#F44336";
        case "SUCCESS": return "#2196F3";
        case "BACKTRACK": return "#FF9800";
        default: return "#fff";
    }
}

const btnStyle = {
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: "600",
    borderRadius: "6px",
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    transition: "all 0.2s"
};
