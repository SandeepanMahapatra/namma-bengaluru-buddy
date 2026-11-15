/* modules/i18n.js — English / ಕನ್ನಡ / हिन्दी toggle for headings, buttons and notes.
   Task content stays in English. Choice is remembered on this device only. */

window.I18nModule = (function() {

  var STRINGS = {
    en: {
      tagline: "Your first 30 days in Bengaluru, sorted.",
      s1: "About You",
      sImpact: "Your Bengaluru snapshot",
      s2: "Your Week 1–4 Plan",
      s3: "Best Areas for You",
      s4: "Fair-Rent Check",
      s5: "Agreement Red-Flag Checker",
      btnDemo: "⚡ Load demo profile",
      btnGenerate: "Generate My Plan →",
      btnSimulate: "🔁 Simulate: agreement delayed by a week",
      btnSimulateUndo: "↩️ Back to on-time plan",
      btnCheck: "Check →",
      btnSample: "📄 Load sample agreement",
      btnScan: "Scan for red flags →",
      btnCopy: "📋 Copy message",
      copied: "✅ Copied!",
      trace: "▸ Agent Trace",
      negTitle: "Suggested negotiation message",
      privacy: "🔒 Your agreement text never leaves your device. Nothing is uploaded.",
      legal: "⚖️ Before you sign: have a lawyer or free legal aid from the Karnataka State Legal Services Authority (KSLSA) review it. Buddy flags risks; a human should make the call."
    },
    kn: {
      tagline: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ನಿಮ್ಮ ಮೊದಲ 30 ದಿನಗಳು, ಸುಲಭವಾಗಿ.",
      s1: "ನಿಮ್ಮ ಬಗ್ಗೆ",
      sImpact: "ನಿಮ್ಮ ಬೆಂಗಳೂರು ಸಾರಾಂಶ",
      s2: "ನಿಮ್ಮ 1–4 ವಾರಗಳ ಯೋಜನೆ",
      s3: "ನಿಮಗೆ ಸೂಕ್ತ ಪ್ರದೇಶಗಳು",
      s4: "ನ್ಯಾಯಯುತ ಬಾಡಿಗೆ ಪರಿಶೀಲನೆ",
      s5: "ಬಾಡಿಗೆ ಒಪ್ಪಂದದ ಅಪಾಯ ಪರಿಶೀಲನೆ",
      btnDemo: "⚡ ಡೆಮೊ ಪ್ರೊಫೈಲ್ ತುಂಬಿ",
      btnGenerate: "ನನ್ನ ಯೋಜನೆ ರಚಿಸಿ →",
      btnSimulate: "🔁 ಒಪ್ಪಂದ ಒಂದು ವಾರ ತಡವಾದರೆ?",
      btnSimulateUndo: "↩️ ಸಮಯಕ್ಕೆ ಸರಿಯಾದ ಯೋಜನೆಗೆ ಹಿಂತಿರುಗಿ",
      btnCheck: "ಪರಿಶೀಲಿಸಿ →",
      btnSample: "📄 ಮಾದರಿ ಒಪ್ಪಂದ ತುಂಬಿ",
      btnScan: "ಅಪಾಯಗಳನ್ನು ಹುಡುಕಿ →",
      btnCopy: "📋 ಸಂದೇಶ ನಕಲಿಸಿ",
      copied: "✅ ನಕಲಿಸಲಾಗಿದೆ!",
      trace: "▸ ಏಜೆಂಟ್ ಜಾಡು",
      negTitle: "ಸೂಚಿತ ಮಾತುಕತೆ ಸಂದೇಶ",
      privacy: "🔒 ನಿಮ್ಮ ಒಪ್ಪಂದದ ಪಠ್ಯ ನಿಮ್ಮ ಸಾಧನದಿಂದ ಹೊರಗೆ ಹೋಗುವುದಿಲ್ಲ. ಏನನ್ನೂ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುವುದಿಲ್ಲ.",
      legal: "⚖️ ಸಹಿ ಮಾಡುವ ಮೊದಲು: ವಕೀಲರಿಂದ ಅಥವಾ ಕರ್ನಾಟಕ ರಾಜ್ಯ ಕಾನೂನು ಸೇವೆಗಳ ಪ್ರಾಧಿಕಾರದ (KSLSA) ಉಚಿತ ಕಾನೂನು ನೆರವಿನಿಂದ ಪರಿಶೀಲಿಸಿಕೊಳ್ಳಿ. ಅಂತಿಮ ನಿರ್ಧಾರ ಮನುಷ್ಯರದ್ದೇ."
    },
    hi: {
      tagline: "बेंगलुरु में आपके पहले 30 दिन, आसान।",
      s1: "आपके बारे में",
      sImpact: "आपका बेंगलुरु सारांश",
      s2: "आपकी सप्ताह 1–4 योजना",
      s3: "आपके लिए सबसे अच्छे इलाके",
      s4: "उचित किराया जाँच",
      s5: "किराया अनुबंध जोखिम जाँच",
      btnDemo: "⚡ डेमो प्रोफ़ाइल भरें",
      btnGenerate: "मेरी योजना बनाएँ →",
      btnSimulate: "🔁 अगर अनुबंध एक हफ़्ता देर से हो?",
      btnSimulateUndo: "↩️ समय पर वाली योजना पर लौटें",
      btnCheck: "जाँचें →",
      btnSample: "📄 नमूना अनुबंध भरें",
      btnScan: "जोखिम खोजें →",
      btnCopy: "📋 संदेश कॉपी करें",
      copied: "✅ कॉपी हो गया!",
      trace: "▸ एजेंट ट्रेस",
      negTitle: "सुझाया गया बातचीत संदेश",
      privacy: "🔒 आपके अनुबंध का पाठ आपके डिवाइस से बाहर नहीं जाता। कुछ भी अपलोड नहीं होता।",
      legal: "⚖️ हस्ताक्षर से पहले: किसी वकील या कर्नाटक राज्य विधिक सेवा प्राधिकरण (KSLSA) की मुफ़्त कानूनी सहायता से इसकी जाँच करवाएँ। अंतिम फ़ैसला इंसान का हो।"
    }
  };

  var current = "en";

  function t(key) {
    return (STRINGS[current] && STRINGS[current][key]) || STRINGS.en[key] || key;
  }

  function apply(lang) {
    if (!STRINGS[lang]) lang = "en";
    current = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function(el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll(".lang-btn").forEach(function(b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
    });
    try { localStorage.setItem("nbb_lang", lang); } catch (e) {}
  }

  function init() {
    var saved = "en";
    try { saved = localStorage.getItem("nbb_lang") || "en"; } catch (e) {}
    document.querySelectorAll(".lang-btn").forEach(function(b) {
      b.addEventListener("click", function() { apply(b.getAttribute("data-lang")); });
    });
    apply(saved);
  }

  return { init: init, t: t, apply: apply };

})();
