// Each entry key: "{AreaName}_{BHK}" e.g. "Hebbal_1BHK"
// Each entry has:
//   points: array of { rent, date (YYYY-MM), source }
//   computed: { median, low (p10), high (p90), iqr, n, months_old_p50 }
// The app uses `computed` for display and confidence; `points` for recency calc.
// All data is INDICATIVE — not live market data.

(function() {
  function computeStats(points) {
    if (!points || points.length === 0) return null;
    var vals = points.map(function(p) { return p.rent; }).sort(function(a, b) { return a - b; });
    var n = vals.length;
    var median = n % 2 === 0 ? (vals[n/2-1] + vals[n/2]) / 2 : vals[Math.floor(n/2)];
    var q1 = vals[Math.floor(n * 0.25)];
    var q3 = vals[Math.floor(n * 0.75)];
    var low = vals[Math.floor(n * 0.10)] || vals[0];
    var high = vals[Math.min(Math.floor(n * 0.90), n-1)];
    var iqr = q3 - q1;
    // Recency: months since each data point, find median age
    var now = new Date("2026-11-01");
    var ages = points.map(function(p) {
      var d = new Date(p.date + "-01");
      return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    }).sort(function(a, b) { return a - b; });
    var months_old_p50 = ages[Math.floor(ages.length / 2)];
    return { median: median, low: low, high: high, iqr: iqr, n: n, months_old_p50: months_old_p50 };
  }

  var rawData = {

    // ── Hebbal (High confidence — 18 points) ──────────────────────────────
    "Hebbal_1BHK": [
      { rent: 16000, date: "2026-08", source: "NoBroker" },
      { rent: 17500, date: "2026-07", source: "MagicBricks" },
      { rent: 18000, date: "2026-09", source: "NoBroker" },
      { rent: 15500, date: "2026-06", source: "99acres" },
      { rent: 19000, date: "2026-10", source: "NoBroker" },
      { rent: 17000, date: "2026-08", source: "Local broker" },
      { rent: 16500, date: "2026-07", source: "NoBroker" },
      { rent: 18500, date: "2026-09", source: "MagicBricks" },
      { rent: 17000, date: "2026-05", source: "99acres" },
      { rent: 20000, date: "2026-10", source: "NoBroker" },
      { rent: 15000, date: "2026-04", source: "Local broker" },
      { rent: 18000, date: "2026-06", source: "NoBroker" },
      { rent: 16800, date: "2026-08", source: "MagicBricks" },
      { rent: 17200, date: "2026-09", source: "99acres" },
      { rent: 19500, date: "2026-10", source: "NoBroker" },
      { rent: 16000, date: "2026-07", source: "Local broker" },
      { rent: 18000, date: "2026-11", source: "NoBroker" },
      { rent: 17500, date: "2026-11", source: "MagicBricks" }
    ],
    "Hebbal_2BHK": [
      { rent: 25000, date: "2026-08", source: "NoBroker" },
      { rent: 28000, date: "2026-09", source: "MagicBricks" },
      { rent: 27000, date: "2026-07", source: "99acres" },
      { rent: 30000, date: "2026-10", source: "NoBroker" },
      { rent: 26000, date: "2026-06", source: "Local broker" },
      { rent: 28500, date: "2026-09", source: "NoBroker" },
      { rent: 29000, date: "2026-10", source: "MagicBricks" },
      { rent: 24000, date: "2026-05", source: "99acres" },
      { rent: 27500, date: "2026-08", source: "NoBroker" },
      { rent: 31000, date: "2026-11", source: "NoBroker" },
      { rent: 26500, date: "2026-07", source: "Local broker" },
      { rent: 28000, date: "2026-11", source: "MagicBricks" },
      { rent: 29500, date: "2026-10", source: "99acres" },
      { rent: 27000, date: "2026-09", source: "NoBroker" },
      { rent: 25500, date: "2026-06", source: "Local broker" },
      { rent: 30000, date: "2026-11", source: "NoBroker" }
    ],
    "Hebbal_3BHK": [
      { rent: 38000, date: "2026-08", source: "NoBroker" },
      { rent: 42000, date: "2026-09", source: "MagicBricks" },
      { rent: 40000, date: "2026-10", source: "99acres" },
      { rent: 44000, date: "2026-11", source: "NoBroker" },
      { rent: 39000, date: "2026-07", source: "Local broker" },
      { rent: 41000, date: "2026-10", source: "NoBroker" },
      { rent: 43000, date: "2026-11", source: "MagicBricks" },
      { rent: 37000, date: "2026-06", source: "99acres" },
      { rent: 42500, date: "2026-09", source: "NoBroker" },
      { rent: 40500, date: "2026-08", source: "Local broker" },
      { rent: 38500, date: "2026-07", source: "NoBroker" },
      { rent: 41500, date: "2026-10", source: "MagicBricks" },
      { rent: 44500, date: "2026-11", source: "NoBroker" },
      { rent: 39500, date: "2026-09", source: "99acres" },
      { rent: 42000, date: "2026-11", source: "NoBroker" },
      { rent: 40000, date: "2026-08", source: "Local broker" }
    ],

    // ── Hennur (High confidence — 16 points) ──────────────────────────────
    "Hennur_1BHK": [
      { rent: 13500, date: "2026-08", source: "NoBroker" },
      { rent: 15000, date: "2026-09", source: "MagicBricks" },
      { rent: 14000, date: "2026-07", source: "NoBroker" },
      { rent: 16000, date: "2026-10", source: "99acres" },
      { rent: 13000, date: "2026-06", source: "Local broker" },
      { rent: 15500, date: "2026-11", source: "NoBroker" },
      { rent: 14500, date: "2026-09", source: "MagicBricks" },
      { rent: 13800, date: "2026-08", source: "99acres" },
      { rent: 15000, date: "2026-10", source: "NoBroker" },
      { rent: 16500, date: "2026-11", source: "NoBroker" },
      { rent: 13200, date: "2026-07", source: "Local broker" },
      { rent: 14800, date: "2026-09", source: "MagicBricks" },
      { rent: 15200, date: "2026-10", source: "NoBroker" },
      { rent: 14000, date: "2026-08", source: "99acres" },
      { rent: 15800, date: "2026-11", source: "NoBroker" },
      { rent: 14200, date: "2026-07", source: "Local broker" }
    ],
    "Hennur_2BHK": [
      { rent: 21000, date: "2026-08", source: "NoBroker" },
      { rent: 23000, date: "2026-09", source: "MagicBricks" },
      { rent: 22000, date: "2026-07", source: "99acres" },
      { rent: 24500, date: "2026-10", source: "NoBroker" },
      { rent: 20000, date: "2026-06", source: "Local broker" },
      { rent: 23500, date: "2026-11", source: "NoBroker" },
      { rent: 22500, date: "2026-09", source: "MagicBricks" },
      { rent: 21500, date: "2026-08", source: "99acres" },
      { rent: 24000, date: "2026-10", source: "NoBroker" },
      { rent: 25000, date: "2026-11", source: "NoBroker" },
      { rent: 20500, date: "2026-07", source: "Local broker" },
      { rent: 23000, date: "2026-09", source: "MagicBricks" },
      { rent: 22000, date: "2026-10", source: "NoBroker" },
      { rent: 21000, date: "2026-08", source: "99acres" },
      { rent: 24000, date: "2026-11", source: "NoBroker" },
      { rent: 22500, date: "2026-07", source: "Local broker" }
    ],

    // ── HSR Layout (High confidence — 15 points) ──────────────────────────
    "HSR Layout_1BHK": [
      { rent: 18000, date: "2026-08", source: "NoBroker" },
      { rent: 20000, date: "2026-09", source: "MagicBricks" },
      { rent: 19000, date: "2026-07", source: "99acres" },
      { rent: 21000, date: "2026-10", source: "NoBroker" },
      { rent: 17500, date: "2026-06", source: "Local broker" },
      { rent: 20500, date: "2026-11", source: "NoBroker" },
      { rent: 19500, date: "2026-09", source: "MagicBricks" },
      { rent: 18500, date: "2026-08", source: "99acres" },
      { rent: 20000, date: "2026-10", source: "NoBroker" },
      { rent: 22000, date: "2026-11", source: "NoBroker" },
      { rent: 17000, date: "2026-07", source: "Local broker" },
      { rent: 19000, date: "2026-09", source: "MagicBricks" },
      { rent: 21500, date: "2026-10", source: "NoBroker" },
      { rent: 18000, date: "2026-08", source: "99acres" },
      { rent: 20500, date: "2026-11", source: "NoBroker" }
    ],
    "HSR Layout_2BHK": [
      { rent: 29000, date: "2026-08", source: "NoBroker" },
      { rent: 32000, date: "2026-09", source: "MagicBricks" },
      { rent: 30000, date: "2026-07", source: "99acres" },
      { rent: 34000, date: "2026-10", source: "NoBroker" },
      { rent: 28000, date: "2026-06", source: "Local broker" },
      { rent: 33000, date: "2026-11", source: "NoBroker" },
      { rent: 31000, date: "2026-09", source: "MagicBricks" },
      { rent: 30500, date: "2026-08", source: "99acres" },
      { rent: 32500, date: "2026-10", source: "NoBroker" },
      { rent: 35000, date: "2026-11", source: "NoBroker" },
      { rent: 27000, date: "2026-07", source: "Local broker" },
      { rent: 31500, date: "2026-09", source: "MagicBricks" },
      { rent: 33500, date: "2026-10", source: "NoBroker" },
      { rent: 29500, date: "2026-08", source: "99acres" },
      { rent: 32000, date: "2026-11", source: "NoBroker" }
    ],
    "HSR Layout_3BHK": [
      { rent: 46000, date: "2026-08", source: "NoBroker" },
      { rent: 50000, date: "2026-09", source: "MagicBricks" },
      { rent: 48000, date: "2026-10", source: "NoBroker" },
      { rent: 52000, date: "2026-11", source: "NoBroker" },
      { rent: 44000, date: "2026-07", source: "Local broker" },
      { rent: 51000, date: "2026-10", source: "MagicBricks" },
      { rent: 47000, date: "2026-09", source: "99acres" },
      { rent: 49000, date: "2026-11", source: "NoBroker" },
      { rent: 45000, date: "2026-08", source: "Local broker" },
      { rent: 50500, date: "2026-10", source: "NoBroker" },
      { rent: 48500, date: "2026-11", source: "MagicBricks" },
      { rent: 46500, date: "2026-09", source: "99acres" },
      { rent: 51500, date: "2026-11", source: "NoBroker" },
      { rent: 47500, date: "2026-08", source: "Local broker" },
      { rent: 49500, date: "2026-10", source: "NoBroker" }
    ],

    // ── Yelahanka (Low confidence — 3 points, will fall back) ─────────────
    "Yelahanka_2BHK": [
      { rent: 19000, date: "2025-06", source: "NoBroker" },
      { rent: 21000, date: "2025-03", source: "MagicBricks" },
      { rent: 20000, date: "2024-11", source: "Local broker" }
    ],

    // ── Koramangala (Medium confidence — 12 points) ────────────────────────
    "Koramangala_1BHK": [
      { rent: 20000, date: "2026-07", source: "NoBroker" },
      { rent: 22000, date: "2026-09", source: "MagicBricks" },
      { rent: 21000, date: "2026-08", source: "99acres" },
      { rent: 23000, date: "2026-10", source: "NoBroker" },
      { rent: 19500, date: "2026-06", source: "Local broker" },
      { rent: 22500, date: "2026-11", source: "NoBroker" },
      { rent: 20500, date: "2026-09", source: "MagicBricks" },
      { rent: 21500, date: "2026-08", source: "99acres" },
      { rent: 23500, date: "2026-10", source: "NoBroker" },
      { rent: 19000, date: "2026-07", source: "Local broker" },
      { rent: 22000, date: "2026-11", source: "NoBroker" },
      { rent: 21000, date: "2026-09", source: "MagicBricks" }
    ],
    "Koramangala_2BHK": [
      { rent: 30000, date: "2026-07", source: "NoBroker" },
      { rent: 33000, date: "2026-09", source: "MagicBricks" },
      { rent: 31000, date: "2026-08", source: "99acres" },
      { rent: 35000, date: "2026-10", source: "NoBroker" },
      { rent: 29000, date: "2026-06", source: "Local broker" },
      { rent: 34000, date: "2026-11", source: "NoBroker" },
      { rent: 32000, date: "2026-09", source: "MagicBricks" },
      { rent: 31500, date: "2026-08", source: "99acres" },
      { rent: 36000, date: "2026-10", source: "NoBroker" },
      { rent: 28000, date: "2026-07", source: "Local broker" },
      { rent: 33500, date: "2026-11", source: "NoBroker" },
      { rent: 32000, date: "2026-09", source: "MagicBricks" }
    ],
    "Koramangala_3BHK": [
      { rent: 50000, date: "2026-08", source: "NoBroker" },
      { rent: 55000, date: "2026-09", source: "MagicBricks" },
      { rent: 52000, date: "2026-10", source: "NoBroker" },
      { rent: 58000, date: "2026-11", source: "NoBroker" },
      { rent: 48000, date: "2026-07", source: "Local broker" },
      { rent: 56000, date: "2026-10", source: "MagicBricks" },
      { rent: 51000, date: "2026-09", source: "99acres" },
      { rent: 54000, date: "2026-11", source: "NoBroker" }
    ],

    // ── Other areas (smaller datasets for variety) ─────────────────────────
    "Whitefield_2BHK": [
      { rent: 27000, date: "2026-08", source: "NoBroker" },
      { rent: 30000, date: "2026-09", source: "MagicBricks" },
      { rent: 28000, date: "2026-10", source: "NoBroker" },
      { rent: 32000, date: "2026-11", source: "NoBroker" },
      { rent: 26000, date: "2026-07", source: "Local broker" },
      { rent: 31000, date: "2026-11", source: "MagicBricks" },
      { rent: 29000, date: "2026-10", source: "99acres" },
      { rent: 27500, date: "2026-09", source: "NoBroker" }
    ],
    "Indiranagar_2BHK": [
      { rent: 35000, date: "2026-08", source: "NoBroker" },
      { rent: 38000, date: "2026-09", source: "MagicBricks" },
      { rent: 36000, date: "2026-10", source: "NoBroker" },
      { rent: 40000, date: "2026-11", source: "NoBroker" },
      { rent: 34000, date: "2026-07", source: "Local broker" },
      { rent: 39000, date: "2026-11", source: "MagicBricks" },
      { rent: 37000, date: "2026-10", source: "99acres" }
    ],
    "Marathahalli_1BHK": [
      { rent: 15000, date: "2026-08", source: "NoBroker" },
      { rent: 17000, date: "2026-09", source: "MagicBricks" },
      { rent: 16000, date: "2026-10", source: "NoBroker" },
      { rent: 18000, date: "2026-11", source: "NoBroker" },
      { rent: 14500, date: "2026-07", source: "Local broker" }
    ],
    "Marathahalli_2BHK": [
      { rent: 24000, date: "2026-08", source: "NoBroker" },
      { rent: 26000, date: "2026-09", source: "MagicBricks" },
      { rent: 25000, date: "2026-10", source: "NoBroker" },
      { rent: 27000, date: "2026-11", source: "NoBroker" },
      { rent: 23000, date: "2026-07", source: "Local broker" },
      { rent: 26500, date: "2026-11", source: "MagicBricks" }
    ],
    "Electronic City_1BHK": [
      { rent: 12000, date: "2026-08", source: "NoBroker" },
      { rent: 14000, date: "2026-09", source: "MagicBricks" },
      { rent: 13000, date: "2026-10", source: "NoBroker" },
      { rent: 15000, date: "2026-11", source: "NoBroker" },
      { rent: 11500, date: "2026-07", source: "Local broker" }
    ],
    "Electronic City_2BHK": [
      { rent: 20000, date: "2026-08", source: "NoBroker" },
      { rent: 22000, date: "2026-09", source: "MagicBricks" },
      { rent: 21000, date: "2026-10", source: "NoBroker" },
      { rent: 23000, date: "2026-11", source: "NoBroker" },
      { rent: 19000, date: "2026-07", source: "Local broker" },
      { rent: 22500, date: "2026-11", source: "MagicBricks" }
    ],
    "Bellandur_2BHK": [
      { rent: 25000, date: "2026-09", source: "NoBroker" },
      { rent: 28000, date: "2026-10", source: "MagicBricks" },
      { rent: 27000, date: "2026-11", source: "NoBroker" },
      { rent: 29000, date: "2026-11", source: "MagicBricks" }
    ],
    "Yeshwanthpur_2BHK": [
      { rent: 23000, date: "2026-08", source: "NoBroker" },
      { rent: 25000, date: "2026-09", source: "MagicBricks" },
      { rent: 24000, date: "2026-10", source: "NoBroker" },
      { rent: 26000, date: "2026-11", source: "NoBroker" },
      { rent: 22000, date: "2026-07", source: "Local broker" }
    ],
    "JP Nagar_2BHK": [
      { rent: 25000, date: "2026-08", source: "NoBroker" },
      { rent: 27000, date: "2026-09", source: "MagicBricks" },
      { rent: 26000, date: "2026-10", source: "NoBroker" },
      { rent: 28000, date: "2026-11", source: "NoBroker" }
    ],
    "BTM Layout_1BHK": [
      { rent: 14000, date: "2026-08", source: "NoBroker" },
      { rent: 16000, date: "2026-09", source: "MagicBricks" },
      { rent: 15000, date: "2026-10", source: "NoBroker" },
      { rent: 17000, date: "2026-11", source: "NoBroker" },
      { rent: 13500, date: "2026-07", source: "Local broker" }
    ]
  };

  // Build window.DATA_RENT with computed stats
  window.DATA_RENT = {};
  for (var key in rawData) {
    if (rawData.hasOwnProperty(key)) {
      window.DATA_RENT[key] = {
        points: rawData[key],
        computed: computeStats(rawData[key])
      };
    }
  }
})();
