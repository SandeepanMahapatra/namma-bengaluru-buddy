/* modules/plan.js — Task engine: filter, topo-sort, schedule, persist, slip detection */

var PLAN_STORAGE_KEY = "nbb_tasks";
var PLAN_ADMIN_WEEK_CAP = 2;
var planCurrentProfile = null;
var planCurrentTokens = null;

function planSaveState(taskId, done) {
  var state = planLoadState();
  if (done) {
    state[taskId] = { done: true, doneDate: new Date().toISOString() };
  } else {
    delete state[taskId];
  }
  try { localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}

function planLoadState() {
  try { return JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || "{}"); } catch(e) { return {}; }
}

function planWeekEndDate(joinDate, weekNum) {
  var start = new Date(joinDate);
  var end = new Date(start);
  end.setDate(end.getDate() + (weekNum * 7) - 1);
  return end;
}

function planFilterTasks(profile, trace) {
  return window.DATA_TASKS.filter(function(task) {
    var ri = task.required_if;
    if (!ri || Object.keys(ri).length === 0) return true;

    for (var key in ri) {
      if (!ri.hasOwnProperty(key)) continue;
      var need = ri[key];
      var val = profile[key];

      if (Array.isArray(need)) {
        if (need.indexOf(val) === -1) {
          trace.push("Skipped " + task.id + ": " + key + " = " + val + ", not in [" + need.join(", ") + "]");
          return false;
        }
      } else if (need === true) {
        if (!val) {
          trace.push("Skipped " + task.id + ": " + key + " is not set");
          return false;
        }
      } else {
        if (val !== need) {
          trace.push("Skipped " + task.id + ": " + key + " = " + val + ", need " + need);
          return false;
        }
      }
    }
    return true;
  });
}

function planTopoSort(tasks) {
  var idSet = {};
  var i;
  for (i = 0; i < tasks.length; i++) { idSet[tasks[i].id] = tasks[i]; }

  var inDegree = {};
  var adjList = {};
  for (i = 0; i < tasks.length; i++) {
    inDegree[tasks[i].id] = 0;
    adjList[tasks[i].id] = [];
  }

  for (i = 0; i < tasks.length; i++) {
    var deps = tasks[i].depends_on || [];
    for (var j = 0; j < deps.length; j++) {
      var dep = deps[j];
      if (idSet[dep]) {
        adjList[dep].push(tasks[i].id);
        inDegree[tasks[i].id]++;
      }
    }
  }

  var queue = [];
  for (i = 0; i < tasks.length; i++) {
    if (inDegree[tasks[i].id] === 0) queue.push(tasks[i]);
  }

  var sorted = [];
  while (queue.length > 0) {
    var node = queue.shift();
    sorted.push(node);
    var children = adjList[node.id];
    for (var c = 0; c < children.length; c++) {
      inDegree[children[c]]--;
      if (inDegree[children[c]] === 0) queue.push(idSet[children[c]]);
    }
  }

  return sorted;
}

function planSchedule(sorted, joiningWeek, trace, slipWeeks) {
  slipWeeks = slipWeeks || {};
  var scheduled = {};
  var lagMap = {};
  var i;
  for (i = 0; i < sorted.length; i++) {
    lagMap[sorted[i].id] = sorted[i].lagDays || 0;
  }

  var adminCount = {};

  for (i = 0; i < sorted.length; i++) {
    var task = sorted[i];
    var deps = (task.depends_on || []).filter(function(d) { return !!scheduled[d]; });

    var depWeek = 0;
    for (var d = 0; d < deps.length; d++) {
      var s = scheduled[deps[d]];
      // A dependent may share its dependency's week (topo order keeps it after it);
      // only real waits of 7+ days push it into a later week.
      var lag = Math.floor((lagMap[deps[d]] || 0) / 7);
      if (s.scheduledWeek + lag > depWeek) depWeek = s.scheduledWeek + lag;
    }

    var week = Math.max(task.defaultWeek, depWeek);
    if (slipWeeks[task.id]) {
      week += slipWeeks[task.id];
      trace.push("Slip: " + task.id + " delayed by " + slipWeeks[task.id] + " week(s) → Week " + week);
    }

    // Week cap: applies only to the joining week for Admin/Paperwork tasks
    if ((task.category === "Admin" || task.category === "Paperwork") && week === joiningWeek) {
      if (!adminCount[week]) adminCount[week] = 0;
      if (adminCount[week] >= PLAN_ADMIN_WEEK_CAP) {
        week = week + 1;
        trace.push("Capped Week " + (week - 1) + " Admin tasks — bumped " + task.id + " to Week " + week);
      }
    }

    // Cap at week 4; overflow goes to bucket 5
    if (week > 4) {
      trace.push("Overflow: " + task.id + " placed in Week 4+ bucket");
      week = 5;
    } else if (deps.length > 0 && week > task.defaultWeek) {
      trace.push("Moved " + task.id + " to Week " + week + ": waits on " + deps.join(", "));
    }

    if ((task.category === "Admin" || task.category === "Paperwork") && week === joiningWeek) {
      adminCount[week] = (adminCount[week] || 0) + 1;
    }

    scheduled[task.id] = { task: task, scheduledWeek: week };
  }

  var result = [];
  for (var k in scheduled) {
    if (scheduled.hasOwnProperty(k)) result.push(scheduled[k]);
  }
  return result;
}

function planFillTokens(text, tokens) {
  if (!text) return "";
  return text.replace(/\{\{(\w+)\}\}/g, function(_, key) {
    return (tokens && tokens[key] !== undefined) ? tokens[key] : ("{{" + key + "}}");
  });
}

function planRender(scheduled, profile, tokens, trace, moved) {
  moved = moved || {};
  var state = planLoadState();
  var byWeek = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  var i;

  for (i = 0; i < scheduled.length; i++) {
    var w = scheduled[i].scheduledWeek;
    if (!byWeek[w]) byWeek[w] = [];
    byWeek[w].push(scheduled[i]);
  }

  var html = "";
  var weeks = [1, 2, 3, 4];

  for (var wi = 0; wi < weeks.length; wi++) {
    var wn = weeks[wi];
    var items = byWeek[wn];
    if (!items || items.length === 0) continue;

    var weekLabel = "Week " + wn;
    if (profile.move_date && profile.join_date) {
      var joinD = new Date(profile.join_date);
      var joinWeekNum = Math.floor((joinD - new Date(profile.move_date)) / 86400000 / 7) + 1;
      if (wn < joinWeekNum) weekLabel += " · Before you join";
      if (wn === joinWeekNum) weekLabel += " · You join on " +
        joinD.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    }
    var anchorDate = profile.move_date || profile.join_date;
    if (anchorDate) {
      var wstart = new Date(anchorDate);
      wstart.setDate(wstart.getDate() + (wn - 1) * 7);
      var wend = new Date(wstart);
      wend.setDate(wend.getDate() + 6);
      weekLabel += " <span style='font-weight:400;font-size:.82rem;color:var(--text-muted)'>" +
        wstart.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " - " +
        wend.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + "</span>";
    }

    html += "<details class='week-block' open><summary>&#128197; " + weekLabel +
      " <span style='margin-left:auto;font-weight:400;font-size:.8rem'>" +
      items.length + " task" + (items.length > 1 ? "s" : "") + "</span></summary>";
    html += "<ul class='task-list'>";

    for (i = 0; i < items.length; i++) {
      var t = items[i].task;
      var isDone = !!(state[t.id] && state[t.id].done);
      var title = planFillTokens(t.title, tokens);
      var desc  = planFillTokens(t.description, tokens);
      var doneClass = (isDone ? " task-done" : "") + (moved[t.id] ? " task-moved" : "");
      html += "<li class='task-item" + doneClass + "'>";
      html += "<input type='checkbox' id='task-" + t.id + "' data-id='" + t.id + "'" + (isDone ? " checked" : "") + " />";
      html += "<label class='task-label' for='task-" + t.id + "'>";
      html += "<div class='task-title'>" + title + " <span class='task-category'>" + t.category + "</span>" +
        (moved[t.id] ? " <span class='moved-badge'>moved from Week " + moved[t.id] + "</span>" : "") + "</div>";
      html += "<div class='task-meta'>" + desc + "</div>";
      if (t.tips && t.tips.length > 0) {
        html += "<div class='task-meta' style='margin-top:.2rem'>&#128161; " + t.tips[0] + "</div>";
      }
      html += "</label></li>";
    }
    html += "</ul></details>";
  }

  // Overflow bucket
  var overflow = byWeek[5];
  if (overflow && overflow.length > 0) {
    html += "<div class='overflow-bucket'><h4>&#9888;&#65039; Week 4+ (may need extra time)</h4><ul class='task-list'>";
    for (i = 0; i < overflow.length; i++) {
      var ot = overflow[i].task;
      var otitle = planFillTokens(ot.title, tokens);
      html += "<li class='task-item" + (moved[ot.id] ? " task-moved" : "") + "'><span style='width:1rem;display:inline-block'></span>" +
        "<div class='task-label'><div class='task-title'>" + otitle +
        " <span class='task-category'>" + ot.category + "</span>" +
        (moved[ot.id] ? " <span class='moved-badge'>moved from Week " + moved[ot.id] + "</span>" : "") + "</div></div></li>";
    }
    html += "</ul></div>";
  }

  document.getElementById("plan-output").innerHTML = html;

  // Trace
  var ul = document.getElementById("plan-trace");
  ul.innerHTML = "";
  for (i = 0; i < trace.length; i++) {
    var li = document.createElement("li");
    li.textContent = trace[i];
    ul.appendChild(li);
  }

  // Wire checkboxes
  var checkboxes = document.querySelectorAll(".task-item input[type='checkbox']");
  for (i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener("change", function() {
      planSaveState(this.dataset.id, this.checked);
      if (planCurrentProfile && planCurrentTokens) {
        planRun(planCurrentProfile, planCurrentTokens);
      }
    });
  }
}

var planSlip = null; // e.g. { sign_agreement: 1 } while the "agreement delayed" simulation is on

function planWeekName(w) { return w === 5 ? "Week 4+" : "Week " + w; }

function planRun(profile, tokens) {
  planCurrentProfile = profile;
  planCurrentTokens  = tokens;
  var trace = [];

  var joiningWeek = 2;
  if (profile.move_date && profile.join_date) {
    var move = new Date(profile.move_date);
    var join = new Date(profile.join_date);
    var diffDays = Math.round((join - move) / (1000 * 60 * 60 * 24));
    joiningWeek = diffDays < 7 ? 1 : 2;
  }

  trace.push("Arrival: " + profile.move_date + " | Join: " + profile.join_date + " | Joining week = Week " + joiningWeek);
  trace.push("Profile: " + profile.household + " | " + profile.vehicle + " | " + profile.diet + " | office: " + profile.office_area);

  var filtered = planFilterTasks(profile, trace);
  trace.push("Filtered to " + filtered.length + " of " + window.DATA_TASKS.length + " tasks");

  var sorted    = planTopoSort(filtered);
  var scheduled = planSchedule(sorted, joiningWeek, trace, null);
  var moved = {};
  var banner = document.getElementById("plan-slip-banner");

  if (planSlip) {
    // Re-plan with the slip and diff against the on-time plan
    var baseline = {};
    scheduled.forEach(function(s) { baseline[s.task.id] = s.scheduledWeek; });
    trace.push("── Re-planning: agreement signing delayed by " + planSlip.sign_agreement + " week ──");
    scheduled = planSchedule(sorted, joiningWeek, trace, planSlip);
    var movedLines = [];
    scheduled.forEach(function(s) {
      var before = baseline[s.task.id];
      if (before !== s.scheduledWeek) {
        moved[s.task.id] = before === 5 ? "4+" : before;
        movedLines.push(s.task.id + " " + planWeekName(before) + " → " + planWeekName(s.scheduledWeek));
      }
    });
    movedLines.forEach(function(l) { trace.push("Agreement delayed → moved " + l); });
    var overflowNow = scheduled.filter(function(s) { return s.scheduledWeek === 5; }).length;
    if (banner) {
      banner.innerHTML = "⚠️ <strong>Agreement slipped by a week.</strong> Buddy re-planned your month: " +
        movedLines.length + " task" + (movedLines.length !== 1 ? "s" : "") + " moved (highlighted below)" +
        (overflowNow ? ", " + overflowNow + " now spill past Week 4" : "") + ".";
      banner.classList.remove("hidden");
    }
  } else if (banner) {
    banner.classList.add("hidden");
  }

  trace.push("Scheduling complete — " + scheduled.length + " tasks placed");

  planRender(scheduled, profile, tokens, trace, moved);

  var lastWeek = 0;
  scheduled.forEach(function(s) { if (s.scheduledWeek > lastWeek) lastWeek = s.scheduledWeek; });
  return { tasks: scheduled.length, weeks: Math.min(lastWeek, 4), overflow: lastWeek > 4 };
}

function planToggleSlip() {
  planSlip = planSlip ? null : { sign_agreement: 1 };
  if (planCurrentProfile) planRun(planCurrentProfile, planCurrentTokens);
  return !!planSlip;
}

window.PlanModule = { run: planRun, toggleSlip: planToggleSlip };
