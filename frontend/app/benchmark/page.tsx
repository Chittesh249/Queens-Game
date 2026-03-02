"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface BenchmarkData {
  labels: string[];
  datasets: {
    [key: string]: number[];
  };
  csvData: string;
}

export default function BenchmarkPage() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sizes, setSizes] = useState("4,5,6,7,8");

  const runBenchmark = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/game/benchmark?sizes=${sizes}`
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error running benchmark:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  const chartData = data
    ? {
        labels: data.labels,
        datasets: [
          {
            label: "Greedy",
            data: data.datasets["Greedy"],
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
          {
            label: "Backtracking",
            data: data.datasets["Backtracking"],
            borderColor: "rgb(54, 162, 235)",
            backgroundColor: "rgba(54, 162, 235, 0.5)",
          },
          {
            label: "Branch and Bound",
            data: data.datasets["Branch and Bound"],
            borderColor: "rgb(255, 206, 86)",
            backgroundColor: "rgba(255, 206, 86, 0.5)",
          },
          {
            label: "Divide and Conquer",
            data: data.datasets["Divide and Conquer"],
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
          },
          {
            label: "Dynamic Programming",
            data: data.datasets["Dynamic Programming"],
            borderColor: "rgb(153, 102, 255)",
            backgroundColor: "rgba(153, 102, 255, 0.5)",
          },
        ],
      }
    : null;

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Algorithm Performance Comparison",
        font: {
          size: 18,
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Time (milliseconds)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Board Size (N)",
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Algorithm Performance Benchmark
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 items-center mb-4">
            <label className="font-semibold">Board Sizes:</label>
            <input
              type="text"
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
              className="border rounded px-3 py-2 w-48"
              placeholder="4,5,6,7,8"
            />
            <button
              onClick={runBenchmark}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Running..." : "Run Benchmark"}
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Running benchmarks...</p>
            </div>
          )}

          {chartData && !loading && (
            <div className="mb-8">
              <Line options={options} data={chartData} />
            </div>
          )}

          {data && !loading && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">CSV Data for Export</h2>
              <textarea
                readOnly
                value={data.csvData}
                className="w-full h-48 p-4 border rounded font-mono text-sm bg-gray-50"
              />
              <button
                onClick={() => {
                  const blob = new Blob([data.csvData], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "benchmark_results.csv";
                  a.click();
                }}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Download CSV
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Algorithm Descriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h3 className="font-bold text-red-500">Greedy</h3>
              <p className="text-sm text-gray-600">
                Makes locally optimal choices. Fast but may not find optimal solution.
                Time: O(N³)
              </p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-bold text-blue-500">Backtracking</h3>
              <p className="text-sm text-gray-600">
                Tries all possibilities, backtracks on failure. Guaranteed to find solution.
                Time: O(N!)
              </p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-bold text-yellow-600">Branch and Bound</h3>
              <p className="text-sm text-gray-600">
                Backtracking with pruning using bounds. Faster than pure backtracking.
                Time: O(N!) worst, much better in practice
              </p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-bold text-teal-500">Divide and Conquer</h3>
              <p className="text-sm text-gray-600">
                Splits problem into subproblems. Uses bitmasks for efficiency.
                Time: O(N!)
              </p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-bold text-purple-500">Dynamic Programming</h3>
              <p className="text-sm text-gray-600">
                Minimax with memoization for two-player games. Optimal for game theory.
                Time: O(b^d) where b=branching, d=depth
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
