/* app.js — Orchestrator: wire intake form, demo buttons, module calls */

(function() {

  // ── Sample agreement text (for "Load sample agreement" button) ────────────
  var SAMPLE_AGREEMENT = [
    "RENTAL AGREEMENT",
    "",
    "This Rental Agreement is made and executed on this 1st day of December 2026,",
    "BETWEEN: Mr. Raghavendra Sharma, hereinafter referred to as the \"Landlord\"",
    "AND: The Tenant, hereinafter referred to as the \"Tenant\".",
    "",
    "PROPERTY: Flat No. 203, 2nd Floor, Green Meadows Apartments, Koramangala, Bengaluru - 560034.",
    "",
    "TERM: This agreement shall be for a period of eleven (11) months commencing from",
    "1st December 2026 to 31st October 2027. This agreement is not registered.",
    "",
    "RENT: The monthly rent shall be ₹30,000 (Rupees Thirty Thousand Only), payable",
    "on or before the 5th of each month.",
    "",
    "ANNUAL INCREASE: The rent shall be increased by twelve percent (12%) every year",
    "on the anniversary of this agreement.",
    "",
    "SECURITY DEPOSIT: The Tenant shall pay a security deposit of Rs. 3,00,000",
    "(Rupees Three Lakh Only) at the time of signing this agreement.",
    "",
    "LOCK-IN PERIOD: The Tenant shall not vacate the premises during the lock-in period",
    "of eleven (11) months from the date of commencement. The lock-in period applies",
    "only on the Tenant and not on the Landlord.",
    "",
    "MAINTENANCE: All major repairs and structural maintenance shall be borne by the Tenant.",
    "",
    "PAINTING: A fixed amount of Rs. 15,000 (Rupees Fifteen Thousand Only) shall be",
    "deducted from the deposit towards painting and whitewash charges at the time of",
    "vacating the property, irrespective of the condition of the walls.",
    "",
    "TERMINATION: The Landlord reserves the right to terminate this agreement at any time",
    "without assigning any reason, with a notice period of 15 days.",
    "",
    "IN WITNESS WHEREOF, the parties have signed this agreement on the date mentioned above.",
    "",
    "Landlord Signature: _______________",
    "Tenant Signature:   _______________"
  ].join("\n");

  // ── Demo profile (from PLAN.md §10) ──────────────────────────────────────
  var DEMO_PROFILE = {
    move_date:   "2026-11-30",
    join_date:   "2026-12-07",
    office_area: "Manyata Tech Park",
    budget_rent: 30000,
    household:   "Solo",
    vehicle:     "Two-wheeler",
    home_state:  "West Bengal",
    diet:        "Non-veg",
    languages:   ["Bengali", "Hindi", "English"]
  };

  // ── Populate dropdowns ────────────────────────────────────────────────────

  function populateDropdowns() {
    // Office area dropdown
    var officeSelect = document.getElementById("office_area");
    window.DATA_OFFICE_AREAS.forEach(function(area) {
      var opt = document.createElement("option");
      opt.value = area;
      opt.textContent = area;
      officeSelect.appendChild(opt);
    });

    // Rent check area dropdown
    var rentAreaSelect = document.getElementById("rent-area");
    window.DATA_AREAS.forEach(function(area) {
      var opt = document.createElement("option");
      opt.value = area.name;
      opt.textContent = area.name;
      rentAreaSelect.appendChild(opt);
    });
  }

  // ── Load demo profile ─────────────────────────────────────────────────────

  function loadDemoProfile() {
    var p = DEMO_PROFILE;
    document.getElementById("move_date").value   = p.move_date;
    document.getElementById("join_date").value   = p.join_date;
    document.getElementById("office_area").value = p.office_area;
    document.getElementById("budget_rent").value = p.budget_rent;
    document.getElementById("household").value   = p.household;
    document.getElementById("vehicle").value     = p.vehicle;
    document.getElementById("home_state").value  = p.home_state;
    document.getElementById("diet").value        = p.diet;

    // Checkboxes
    document.querySelectorAll("input[name='languages']").forEach(function(cb) {
      cb.checked = p.languages.indexOf(cb.value) !== -1;
    });
  }

  // ── Build profile from form ────────────────────────────────────────────────

  function buildProfile() {
    var langs = [];
    document.querySelectorAll("input[name='languages']:checked").forEach(function(cb) {
      langs.push(cb.value);
    });

    var homeState = document.getElementById("home_state").value.trim();
    var vehicle = document.getElementById("vehicle").value;

    return {
      move_date:   document.getElementById("move_date").value,
      join_date:   document.getElementById("join_date").value,
      office_area: document.getElementById("office_area").value,
      budget_rent: parseInt(document.getElementById("budget_rent").value, 10) || 0,
      household:   document.getElementById("household").value,
      vehicle:     vehicle,
      home_state:  homeState,
      diet:        document.getElementById("diet").value,
      languages:   langs,
      // Derived flags used by task required_if
      home_state_outside_karnataka: homeState.toLowerCase() !== "karnataka",
      outside_karnataka: homeState.toLowerCase() !== "karnataka",
      language_bengali: langs.indexOf("Bengali") !== -1,
      language_hindi:   langs.indexOf("Hindi") !== -1
    };
  }

  // ── Show section ──────────────────────────────────────────────────────────

  function showSection(id) {
    var el = document.getElementById(id);
    if (el) {
      el.classList.remove("hidden");
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ── Handle form submit ────────────────────────────────────────────────────

  function handleFormSubmit(e) {
    e.preventDefault();

    var profile = buildProfile();

    if (!profile.office_area) {
      alert("Please select an office location.");
      return;
    }
    if (!profile.household) {
      alert("Please select household type.");
      return;
    }
    if (!profile.diet) {
      alert("Please select diet.");
      return;
    }

    // Reveal all sections first so they are visible even if a module errors
    ["section-plan", "section-areas", "section-rent", "section-agreement"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove("hidden");
    });

    // Step 3: Area Finder first (so tokens are available for plan)
    var areaTokens = { top_area_1: "", top_area_2: "" };
    try {
      var areaTrace = [];
      areaTokens = window.AreasModule.run(profile, areaTrace);
    } catch(err) {
      document.getElementById("areas-output").innerHTML = "<p style='color:var(--danger)'>Area finder error: " + err.message + "</p>";
    }

    // Build token map for plan
    var tokens = {
      office_area:   profile.office_area,
      budget_rent:   "₹" + profile.budget_rent.toLocaleString("en-IN"),
      top_area_1:    areaTokens.top_area_1 || "[top area]",
      top_area_2:    areaTokens.top_area_2 || "[second area]"
    };

    // Step 2: Plan
    try {
      window.PlanModule.run(profile, tokens);
    } catch(err) {
      document.getElementById("plan-output").innerHTML = "<p style='color:var(--danger)'>Plan engine error: " + err.message + "</p>";
    }

    // Pre-fill rent check with top area and budget BHK
    var rentArea = document.getElementById("rent-area");
    if (areaTokens.top_area_1) rentArea.value = areaTokens.top_area_1;
    var rentBhk = document.getElementById("rent-bhk");
    rentBhk.value = (profile.household === "Family") ? "2BHK" : "1BHK";
    document.getElementById("rent-quoted").value = profile.budget_rent;

    // Pre-fill agreement rent
    document.getElementById("agreement-rent").value = profile.budget_rent;

    // Scroll to the plan (top of results)
    document.getElementById("section-plan").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── Rent check button ─────────────────────────────────────────────────────

  function handleRentCheck() {
    var area   = document.getElementById("rent-area").value;
    var bhk    = document.getElementById("rent-bhk").value;
    var quoted = parseInt(document.getElementById("rent-quoted").value, 10);
    window.RentModule.run(area, bhk, quoted);
  }

  // ── Agreement scan button ─────────────────────────────────────────────────

  function handleAgreementScan() {
    var text = document.getElementById("agreement-text").value;
    var rent = parseInt(document.getElementById("agreement-rent").value, 10) || null;
    window.RedFlagsModule.run(text, rent);
  }

  // ── Copy negotiation message ──────────────────────────────────────────────

  function handleCopyNegotiation() {
    var text = document.getElementById("negotiation-text").textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        var btn = document.getElementById("btn-copy-negotiation");
        btn.textContent = "✅ Copied!";
        setTimeout(function() { btn.textContent = "📋 Copy message"; }, 2000);
      });
    } else {
      // Fallback
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      var btn = document.getElementById("btn-copy-negotiation");
      btn.textContent = "✅ Copied!";
      setTimeout(function() { btn.textContent = "📋 Copy message"; }, 2000);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    populateDropdowns();

    document.getElementById("intake-form")
      .addEventListener("submit", handleFormSubmit);

    document.getElementById("btn-load-demo")
      .addEventListener("click", loadDemoProfile);

    document.getElementById("btn-rent-check")
      .addEventListener("click", handleRentCheck);

    document.getElementById("btn-scan-agreement")
      .addEventListener("click", handleAgreementScan);

    document.getElementById("btn-load-sample-agreement")
      .addEventListener("click", function() {
        document.getElementById("agreement-text").value = SAMPLE_AGREEMENT;
      });

    document.getElementById("btn-copy-negotiation")
      .addEventListener("click", handleCopyNegotiation);
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
