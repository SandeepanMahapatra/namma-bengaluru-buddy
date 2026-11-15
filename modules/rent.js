/* modules/rent.js — Fair-rent check with 4-tier fallback and confidence formula */

window.RentModule = (function() {

  var BHK_RATIOS = { "1BHK": 0.6, "2BHK": 1.0, "3BHK": 1.5 };

  // ── confidence formula ─────────────────────────────────────────────────────

  function computeConfidence(computed, proxyWeight) {
    if (!computed) return 0;
    var n = computed.n || 0;
    var months = computed.months_old_p50 || 99;
    var iqr = computed.iqr || computed.median || 1;
    var median = computed.median || 1;

    var c = (40 * Math.min(1, n / 20)) +
            (25 * Math.max(0, 1 - months / 6)) +
            (20 * Math.max(0, 1 - iqr / median)) +
            (15 * proxyWeight);

    return Math.round(c);
  }

  function confidenceBand(score) {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  }

  function fmt(n) {
    return "₹" + n.toLocaleString("en-IN");
  }

  // ── 4-tier fallback ────────────────────────────────────────────────────────

  function lookup(area, bhk, trace) {
    var key = area + "_" + bhk;

    // Tier 1: direct
    if (window.DATA_RENT[key] && window.DATA_RENT[key].computed) {
      trace.push("✅ Tier 1 (direct): found <strong>" + key + "</strong> — " + window.DATA_RENT[key].computed.n + " data points");
      return { computed: window.DATA_RENT[key].computed, proxyWeight: 1.0, tier: "direct" };
    }
    trace.push("❌ Tier 1: no direct data for " + key);

    // Tier 2: BHK ratio from another BHK in the same area
    var otherBhks = ["1BHK", "2BHK", "3BHK"].filter(function(b) { return b !== bhk; });
    var anchor = null;
    for (var i = 0; i < otherBhks.length; i++) {
      var altKey = area + "_" + otherBhks[i];
      if (window.DATA_RENT[altKey] && window.DATA_RENT[altKey].computed) {
        anchor = { key: altKey, bhk: otherBhks[i], data: window.DATA_RENT[altKey].computed };
        break;
      }
    }
    if (anchor) {
      var ratio = BHK_RATIOS[bhk] / BHK_RATIOS[anchor.bhk];
      var derived = {
        median: Math.round(anchor.data.median * ratio),
        low:    Math.round(anchor.data.low * ratio),
        high:   Math.round(anchor.data.high * ratio),
        iqr:    Math.round(anchor.data.iqr * ratio),
        n:      anchor.data.n,
        months_old_p50: anchor.data.months_old_p50
      };
      trace.push("✅ Tier 2 (BHK ratio): derived " + bhk + " from " + anchor.bhk + " (" + anchor.key + ") × " + ratio.toFixed(2));
      return { computed: derived, proxyWeight: 0.7, tier: "BHK ratio from " + anchor.bhk };
    }
    trace.push("❌ Tier 2: no other BHK data for " + area);

    // Tier 3: nearby areas
    var nearby = window.DATA_NEARBY[area] || [];
    var nearbyResults = [];
    nearby.forEach(function(nearArea, rank) {
      var nKey = nearArea + "_" + bhk;
      if (window.DATA_RENT[nKey] && window.DATA_RENT[nKey].computed) {
        nearbyResults.push({ area: nearArea, data: window.DATA_RENT[nKey].computed, weight: 1 / (rank + 1) });
      } else {
        // Try BHK ratio from nearby
        var nearOther = ["1BHK", "2BHK", "3BHK"].filter(function(b) { return b !== bhk; });
        for (var j = 0; j < nearOther.length; j++) {
          var nk2 = nearArea + "_" + nearOther[j];
          if (window.DATA_RENT[nk2] && window.DATA_RENT[nk2].computed) {
            var r2 = BHK_RATIOS[bhk] / BHK_RATIOS[nearOther[j]];
            var d2 = window.DATA_RENT[nk2].computed;
            nearbyResults.push({
              area: nearArea + "(BHK ratio)",
              data: { median: d2.median * r2, low: d2.low * r2, high: d2.high * r2, iqr: d2.iqr * r2, n: d2.n, months_old_p50: d2.months_old_p50 },
              weight: 0.5 / (rank + 1)
            });
            break;
          }
        }
      }
    });

    if (nearbyResults.length > 0) {
      var totalW = nearbyResults.reduce(function(s, r) { return s + r.weight; }, 0);
      var wMedian = Math.round(nearbyResults.reduce(function(s, r) { return s + r.data.median * r.weight; }, 0) / totalW);
      var wLow    = Math.round(nearbyResults.reduce(function(s, r) { return s + r.data.low * r.weight; }, 0) / totalW);
      var wHigh   = Math.round(nearbyResults.reduce(function(s, r) { return s + r.data.high * r.weight; }, 0) / totalW);
      var avgN    = Math.round(nearbyResults.reduce(function(s, r) { return s + r.data.n; }, 0) / nearbyResults.length);
      var avgAge  = Math.round(nearbyResults.reduce(function(s, r) { return s + r.data.months_old_p50; }, 0) / nearbyResults.length);
      trace.push("✅ Tier 3 (nearby areas): averaged " + nearbyResults.map(function(r){ return r.area; }).join(", "));
      return {
        computed: { median: wMedian, low: wLow, high: wHigh, iqr: wHigh - wLow, n: avgN, months_old_p50: avgAge },
        proxyWeight: 0.5,
        tier: "nearby areas (" + nearbyResults.map(function(r){ return r.area; }).join(", ") + ")"
      };
    }
    trace.push("❌ Tier 3: no nearby area data found");

    // Tier 4: zone median
    var areaObj = null;
    for (var ai = 0; ai < window.DATA_AREAS.length; ai++) {
      if (window.DATA_AREAS[ai].name === area) { areaObj = window.DATA_AREAS[ai]; break; }
    }
    var zone = areaObj ? areaObj.zone : null;
    if (zone && window.DATA_ZONE_MAP[zone]) {
      var zoneAreas = window.DATA_ZONE_MAP[zone];
      var zoneData = [];
      zoneAreas.forEach(function(za) {
        var zKey = za + "_" + bhk;
        if (window.DATA_RENT[zKey] && window.DATA_RENT[zKey].computed) {
          zoneData.push(window.DATA_RENT[zKey].computed);
        }
      });
      if (zoneData.length > 0) {
        var zMedian = Math.round(zoneData.reduce(function(s, d) { return s + d.median; }, 0) / zoneData.length);
        var zLow    = Math.round(zoneData.reduce(function(s, d) { return s + d.low; }, 0) / zoneData.length);
        var zHigh   = Math.round(zoneData.reduce(function(s, d) { return s + d.high; }, 0) / zoneData.length);
        var zN      = Math.round(zoneData.reduce(function(s, d) { return s + d.n; }, 0) / zoneData.length);
        trace.push("✅ Tier 4 (zone median): used " + zone + " zone average across " + zoneData.length + " areas");
        return {
          computed: { median: zMedian, low: zLow, high: zHigh, iqr: zHigh - zLow, n: zN, months_old_p50: 6 },
          proxyWeight: 0.3,
          tier: "zone median (" + zone + ")"
        };
      }
    }
    trace.push("❌ Tier 4: no zone data available");
    return null;
  }

  // ── render ─────────────────────────────────────────────────────────────────

  function run(area, bhk, quotedRent) {
    var trace = [];
    var output = document.getElementById("rent-output");
    var tracePanel = document.getElementById("rent-trace-panel");
    var traceUl = document.getElementById("rent-trace");

    if (!area || !bhk || !quotedRent) {
      output.innerHTML = "<p class='section-note'>Please fill all fields.</p>";
      return;
    }

    trace.push("Query: " + area + " " + bhk + " at quoted rent " + fmt(quotedRent));

    var result = lookup(area, bhk, trace);

    if (!result) {
      output.innerHTML = "<div class='rent-result-box'><p>No data available for this area and BHK type. Try a nearby area.</p></div>";
      tracePanel.classList.remove("hidden");
      traceUl.innerHTML = "";
      trace.forEach(function(line) {
        var li = document.createElement("li");
        li.innerHTML = line;
        traceUl.appendChild(li);
      });
      return;
    }

    var c = result.computed;
    var score = computeConfidence(c, result.proxyWeight);
    var band = confidenceBand(score);

    var verdict, verdictClass;
    if (quotedRent <= c.median * 0.95) {
      verdict = "below market"; verdictClass = "below";
    } else if (quotedRent <= c.median * 1.10) {
      verdict = "fair"; verdictClass = "fair";
    } else {
      verdict = "above market"; verdictClass = "above";
    }

    trace.push("Confidence: " + score + " → " + band + " (n=" + c.n + ", age=" + c.months_old_p50 + "mo, IQR=" + fmt(c.iqr) + ", proxy=" + result.proxyWeight + ")");
    trace.push("Verdict: quoted " + fmt(quotedRent) + " vs median " + fmt(c.median) + " → " + verdict);

    var html = "<div class='rent-result-box'>";
    html += "<div class='rent-verdict " + verdictClass + "'>Your quoted rent of " + fmt(quotedRent) + " is <strong>" + verdict + "</strong> for a " + bhk + " in " + area + ".</div>";
    html += "<div class='rent-detail'>Median <strong>" + fmt(c.median) + "</strong> · Range " + fmt(c.low) + "–" + fmt(c.high);
    html += " · Confidence: <span class='confidence-badge confidence-" + band.toLowerCase() + "'>" + band + " (" + score + ")</span>";
    html += " · Based on " + c.n + " data point" + (c.n !== 1 ? "s" : "") + "</div>";
    if (result.tier !== "direct") {
      html += "<div class='fallback-note'>⚠️ Estimated via " + result.tier + " — data may be less accurate.</div>";
    }
    html += "</div>";

    output.innerHTML = html;

    tracePanel.classList.remove("hidden");
    traceUl.innerHTML = "";
    trace.forEach(function(line) {
      var li = document.createElement("li");
      li.innerHTML = line;
      traceUl.appendChild(li);
    });
  }

  return { run: run };

})();
