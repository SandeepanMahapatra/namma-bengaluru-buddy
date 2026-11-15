/* modules/redflags.js — Agreement red-flag checker: regex + numeric rules */

window.RedFlagsModule = (function() {

  function extractNumber(text, pattern) {
    var re = new RegExp(pattern, "i");
    var m = text.match(re);
    if (!m) return null;
    // Last capture group should be the number
    var raw = m[m.length - 1];
    if (!raw) return null;
    return parseFloat(raw.replace(/,/g, ""));
  }

  function snippet(text, pattern) {
    var re = new RegExp(pattern, "i");
    var m = text.match(re);
    if (!m) return "";
    var idx = text.indexOf(m[0]);
    var start = Math.max(0, idx - 20);
    var end = Math.min(text.length, idx + m[0].length + 30);
    var s = text.slice(start, end).replace(/\s+/g, " ").trim();
    return "…" + s + "…";
  }

  function run(agreementText, monthlyRent) {
    var trace = [];
    var triggered = [];
    var totalRisk = 0;

    if (!agreementText || agreementText.trim().length < 50) {
      document.getElementById("agreement-output").classList.add("hidden");
      document.getElementById("agreement-trace-panel").classList.add("hidden");
      alert("Please paste at least a paragraph of agreement text.");
      return;
    }

    // Normalise newlines to spaces so single-line regex patterns work across line breaks
    agreementText = agreementText.replace(/\r?\n/g, " ");

    trace.push("Scanning " + agreementText.length + " characters · monthly rent: " + (monthlyRent ? "₹" + monthlyRent.toLocaleString("en-IN") : "not provided"));

    window.DATA_REDFLAGS.forEach(function(rule) {

      if (rule.type === "regex" || rule.type === "compound") {
        var fired = false;
        var matchedPattern = "";
        var matchedSnippet = "";

        if (rule.type === "compound") {
          // ALL patterns must match (anywhere in the text)
          fired = rule.patterns.every(function(p) {
            return new RegExp(p, "i").test(agreementText);
          });
          if (fired) {
            matchedPattern = rule.patterns.join(" AND ");
          }
        } else {
          for (var i = 0; i < rule.patterns.length; i++) {
            var re = new RegExp(rule.patterns[i], "i");
            if (re.test(agreementText)) {
              fired = true;
              matchedPattern = rule.patterns[i];
              matchedSnippet = snippet(agreementText, rule.patterns[i]);
              break;
            }
          }
        }

        if (fired) {
          triggered.push({ rule: rule, matchedSnippet: matchedSnippet, detail: null });
          totalRisk += rule.riskPoints;
          trace.push("🔴 Fired <code>" + rule.id + "</code>: matched pattern <code>" + matchedPattern + "</code>" +
            (matchedSnippet ? " → “" + String(matchedSnippet).replace(/[&<>"']/g, function(c) {
              return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
            }) + "”" : "") +
            " → +" + rule.riskPoints + " risk points");
        } else {
          trace.push("⬜ Skipped <code>" + rule.id + "</code>: no pattern matched");
        }

      } else if (rule.type === "numeric") {
        // Handle split rules (medium_annual_increase and high_annual_increase share pattern)
        var extracted = extractNumber(agreementText, rule.extractPattern);

        if (extracted === null) {
          trace.push("⬜ Skipped <code>" + rule.id + "</code>: pattern not found in text");
          return;
        }

        var condMet = false;
        var detail = "";

        if (rule.id === "excess_deposit") {
          if (!monthlyRent) {
            trace.push("⬜ Skipped <code>" + rule.id + "</code>: no monthly rent provided");
            return;
          }
          var limit = monthlyRent * 6;
          if (extracted > limit) {
            condMet = true;
            detail = "extracted ₹" + extracted.toLocaleString("en-IN") + " > limit ₹" + limit.toLocaleString("en-IN") + " (₹" + monthlyRent.toLocaleString("en-IN") + " × 6)";
          } else {
            trace.push("✅ OK <code>" + rule.id + "</code>: deposit ₹" + extracted.toLocaleString("en-IN") + " ≤ ₹" + limit.toLocaleString("en-IN"));
          }
        } else if (rule.id === "high_annual_increase") {
          if (extracted > 10) {
            condMet = true;
            detail = "extracted " + extracted + "% — above 10%";
          } else {
            trace.push("✅ OK <code>" + rule.id + "</code>: increase " + extracted + "% ≤ 10%");
          }
        } else if (rule.id === "medium_annual_increase") {
          if (extracted > 5 && extracted <= 10) {
            condMet = true;
            detail = "extracted " + extracted + "% — between 5–10%";
          } else {
            trace.push("✅ OK <code>" + rule.id + "</code>: increase " + extracted + "% not in 5–10% range");
          }
        }

        if (condMet) {
          triggered.push({ rule: rule, matchedSnippet: "", detail: detail });
          totalRisk += rule.riskPoints;
          trace.push((rule.severity === "high" ? "🔴" : "🟡") + " Fired <code>" + rule.id + "</code>: " + detail + " → +" + rule.riskPoints + " risk points");
        }
      }
    });

    totalRisk = Math.min(100, totalRisk);
    var band = totalRisk >= 60 ? "High" : totalRisk >= 30 ? "Medium" : "Low";

    trace.push("── Total risk score: " + totalRisk + " → " + band + " risk ──");

    // Render risk score
    var riskEl = document.getElementById("agreement-risk-score");
    var gaugeClass = band.toLowerCase();
    riskEl.innerHTML =
      "<div class='risk-score-box'>" +
      "<span class='risk-gauge " + gaugeClass + "'>" + totalRisk + "</span>" +
      "<div class='risk-label'>" +
      "<div><span class='risk-band'>" + (band === "High" ? "🔴" : band === "Medium" ? "🟡" : "🟢") + " " + band + " risk</span></div>" +
      "<div style='font-size:.83rem;color:var(--text-muted)'>" + triggered.length + " flag" + (triggered.length !== 1 ? "s" : "") + " found · Guidance only, not legal advice</div>" +
      "</div></div>";

    // Render flags grouped by severity
    var flagsEl = document.getElementById("agreement-flags");
    var flagHtml = "";
    var sevOrder = ["high", "medium", "low"];
    sevOrder.forEach(function(sev) {
      var items = triggered.filter(function(t) { return t.rule.severity === sev; });
      if (items.length === 0) return;
      var label = sev === "high" ? "🔴 High risk" : sev === "medium" ? "🟡 Medium risk" : "🟢 Low risk";
      flagHtml += "<div class='flag-group'><div class='flag-group-title " + sev + "'>" + label + "</div>";
      items.forEach(function(item) {
        flagHtml += "<div class='flag-item " + sev + "'>";
        flagHtml += "<div class='flag-label'>" + item.rule.label + "</div>";
        flagHtml += "<div class='flag-explanation'>" + item.rule.explanation + "</div>";
        if (item.matchedSnippet) {
          flagHtml += "<div class='flag-match'>" + item.matchedSnippet.replace(/</g, "&lt;") + "</div>";
        }
        if (item.detail) {
          flagHtml += "<div class='flag-match'>" + item.detail + "</div>";
        }
        flagHtml += "</div>";
      });
      flagHtml += "</div>";
    });
    if (triggered.length === 0) {
      flagHtml = "<p style='color:var(--ok);font-weight:600'>✅ No red flags found in the pasted text. Review manually before signing.</p>";
    }
    flagsEl.innerHTML = flagHtml;

    // Negotiation message
    var negEl = document.getElementById("agreement-negotiation");
    var textEl = document.getElementById("negotiation-text");
    var highMedTriggers = triggered.filter(function(t) { return t.rule.severity === "high" || t.rule.severity === "medium"; });

    if (highMedTriggers.length > 0) {
      negEl.classList.remove("hidden");
      var rentAmt = monthlyRent ? monthlyRent.toLocaleString("en-IN") : "___";
      var rentX3  = monthlyRent ? (monthlyRent * 3).toLocaleString("en-IN") : "___";
      var asks = highMedTriggers.map(function(item, i) {
        var ask = item.rule.negotiationAsk || "Please review the " + item.rule.label.toLowerCase() + " clause.";
        ask = ask.replace("{rentX3}", rentX3).replace("{rentAmt}", rentAmt);
        return (i + 1) + ". " + item.rule.label + ": " + ask;
      }).join("\n\n");

      textEl.textContent =
        "Dear [Landlord's name],\n\n" +
        "Thank you for sharing the draft rental agreement. I am very interested in the property and look forward to being a responsible tenant.\n\n" +
        "I have reviewed the agreement and would like to kindly request a few changes before we proceed:\n\n" +
        asks + "\n\n" +
        "I hope these are reasonable and that we can finalise the agreement soon. Please let me know if you would like to discuss any of these points.\n\n" +
        "Warm regards,\n[Your name]";
    } else {
      negEl.classList.add("hidden");
    }

    // Show output & trace
    document.getElementById("agreement-output").classList.remove("hidden");
    var tracePanel = document.getElementById("agreement-trace-panel");
    tracePanel.classList.remove("hidden");
    var traceUl = document.getElementById("agreement-trace");
    traceUl.innerHTML = "";
    trace.forEach(function(line) {
      var li = document.createElement("li");
      li.innerHTML = line;
      traceUl.appendChild(li);
    });
  }

  return { run: run };

})();
