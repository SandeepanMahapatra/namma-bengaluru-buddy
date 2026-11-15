/* modules/areas.js — Area scorer: commute + rent + fit */

window.AreasModule = (function() {

  function getRelevantFitKeys(profile) {
    var keys = [];
    if (profile.household === "Solo")   keys.push("solo");
    if (profile.household === "Couple") keys.push("couple");
    if (profile.household === "Family") keys.push("family");
    if (profile.diet === "Non-veg")     keys.push("non_veg");
    if (profile.diet === "Vegan")       keys.push("non_veg"); // vegan often faces same restrictions
    if (profile.vehicle === "Car")      keys.push("male_bachelor"); // parking-related
    return keys.length > 0 ? keys : ["solo"];
  }

  function bhkKey(profile) {
    if (profile.household === "Family") return "avg_rent_2bhk";
    if (profile.household === "Couple") return "avg_rent_1bhk";
    return "avg_rent_1bhk";
  }

  function commuteScore(minutes) {
    if (!minutes && minutes !== 0) return 50; // no data → neutral
    return Math.round(100 * (1 - Math.min(minutes, 90) / 90));
  }

  function rentScore(areaRent, budget) {
    if (!areaRent || !budget) return 50;
    if (areaRent <= budget) return 100;
    return Math.max(0, Math.round(100 * budget / areaRent));
  }

  function fitScore(area, profile) {
    var keys = getRelevantFitKeys(profile);
    var total = 0;
    keys.forEach(function(k) {
      total += (area.owner_rules[k] !== undefined ? area.owner_rules[k] : 0.7);
    });
    return Math.round((total / keys.length) * 100);
  }

  function run(profile, trace) {
    var office = profile.office_area;
    var budget = parseInt(profile.budget_rent, 10);
    var rentKey = bhkKey(profile);

    var scored = window.DATA_AREAS.map(function(area) {
      var minutes = area.commute_to[office];
      var cs = commuteScore(minutes);
      var rs = rentScore(area[rentKey], budget);
      var fs = fitScore(area, profile);
      var total = Math.round(cs * 0.4 + rs * 0.4 + fs * 0.2);

      var traceDetail = area.name + ": commute " +
        (minutes !== undefined ? minutes + " min → " + cs : "n/a → " + cs) +
        " | rent ₹" + (area[rentKey] / 1000).toFixed(0) + "k vs budget ₹" + (budget/1000).toFixed(0) + "k → " + rs +
        " | fit (" + getRelevantFitKeys(profile).join("+") + "): " + fs + "% → " + fs +
        " | total " + total;
      trace.push(traceDetail);

      return { area: area, commuteScore: cs, rentScore: rs, fitScore: fs, total: total, minutes: minutes };
    });

    scored.sort(function(a, b) { return b.total - a.total; });
    var top5 = scored.slice(0, 5);

    // Render
    var html = "<div class='area-list'>";
    top5.forEach(function(item, idx) {
      var a = item.area;
      html += "<div class='area-card'>";
      html += "<div class='area-card-header'>";
      html += "<span class='area-rank'>#" + (idx + 1) + "</span>";
      html += "<span class='area-name'>" + a.name + "</span>";
      html += "<span class='area-total-score'>" + item.total + "</span>";
      html += "</div>";

      // Score bars
      html += scoreBar("Commute", item.commuteScore, item.minutes !== undefined ? item.minutes + " min" : "—");
      html += scoreBar("Rent fit", item.rentScore, "₹" + (a[rentKey]/1000).toFixed(0) + "k");
      html += scoreBar("Owner fit", item.fitScore, item.fitScore + "%");

      // Tags
      var shownTags = (a.tags || []).filter(function(t) {
        // School tags only matter to families
        return profile.household === "Family" || !/school/i.test(t);
      });
      if (shownTags.length > 0) {
        html += "<div class='area-tags'>" + shownTags.map(function(t) {
          return "<span class='area-tag'>" + t + "</span>";
        }).join("") + "</div>";
      }

      html += "</div>";
    });
    html += "</div>";

    document.getElementById("areas-output").innerHTML = html;

    // Trace
    var ul = document.getElementById("areas-trace");
    ul.innerHTML = "";
    trace.forEach(function(line) {
      var li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    });

    // Return top area names for token substitution
    return {
      top_area_1: top5[0] ? top5[0].area.name : "",
      top_area_2: top5[1] ? top5[1].area.name : ""
    };
  }

  function scoreBar(label, score, detail) {
    return "<div class='score-bar-row'>" +
      "<span class='score-bar-label'>" + label + " <small style='color:var(--text-muted)'>" + detail + "</small></span>" +
      "<div class='score-bar-track'><div class='score-bar-fill' style='width:" + score + "%'></div></div>" +
      "<span class='score-bar-val'>" + score + "</span>" +
      "</div>";
  }

  return { run: run };

})();
