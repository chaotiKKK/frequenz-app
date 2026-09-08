/* ============================================================
   Frequenz-Datenbank aller Ziele
   Frequenzen basierend auf Literaturwerten; Wirkung ist bei
   manchen Zielen wissenschaftlich umstritten (siehe disc).
   ============================================================ */

const TARGETS = [
  {
    id: "tauben",
    icon: "🕊️",
    name: "Tauben",
    sub: "Stadttauben",
    repel: {
      label: "Abwehren",
      freqs: [2500, 3200, 4000, 5000],
      pattern: "chirp",
      desc: "Alarmschrei-ähnliche Chirps im Vogel-Alarmlaut-Bereich (2–5 kHz)"
    },
    enrich: {
      label: "Bereichern",
      freqs: [200, 250, 300, 400],
      pattern: "chord",
      desc: "Sanfte tiefe Töne im ruhigen Bereich"
    },
    info: {
      hear: "Tauben hören ca. 50 Hz – 5 kHz — und Infraschall unter 20 Hz (z. B. Gewitter von weit weg). Ultraschall über 20 kHz hören sie gar nicht.",
      facts: [
        "Tauben haben einen der tiefsten Hörbereiche der Vögel (Infraschall!).",
        "Ultraschall-Vogelabwehrgeräte (>20 kHz) sind für Tauben wirkungslos — außerhalb des Hörens.",
        "Wirksamer als Pfeiftöne: akustische Alarmrufe kombiniert mit visuellen Reizen (Vögel, Glanz)."
      ],
      disc: "Reine Töne vertreiben Tauben nur begrenzt — sie gewöhnen sich daran. Wirksamer sind Spiegel, Netze und veränderte Landeplätze."
    }
  },
  {
    id: "sittiche",
    icon: "🦜",
    name: "Sittiche",
    sub: "Wellensittiche & Co.",
    repel: {
      label: "Abwehren",
      freqs: [6000, 7000, 8000],
      pattern: "chirp",
      desc: "Unangenehm hohe Chirps am oberen Hörbereich"
    },
    enrich: {
      label: "Bereichern",
      freqs: [2000, 2800, 3400, 4000],
      pattern: "chirp",
      desc: "Melodische Zwitscher-Chirps im Besthörschnitt (2–4 kHz)"
    },
    info: {
      hear: "Sittiche hören ca. 200 Hz – 8,5 kHz, am empfindlichsten bei 2–4 kHz.",
      facts: [
        "Wellensittiche singen selbst im Bereich um 2–4 kHz — dort können sie Töne am besten auflösen.",
        "Sittiche lernen Töne nachahmen und reagieren auf Rhythmus-Wechsel.",
        "Zwitscher-Modus in langsamen Abständen wirkt eher anregend als störend."
      ],
      disc: "Sittiche gewöhnen sich schnell an wiederkehrende Töne. Abwehrtöne nur kurz und nie als Dauerbeschallung."
    }
  },
  {
    id: "hunde",
    icon: "🐕",
    name: "Hunde",
    sub: "Ultraschall-Pfeife",
    repel: {
      label: "Abwehren",
      freqs: [20000, 22000, 25000],
      pattern: "sweep",
      desc: "Ultraschall-Sweep, klassischer Hundepfeifen-Bereich (20–25 kHz)"
    },
    enrich: {
      label: "Bereichern",
      freqs: [60, 85, 120, 150],
      pattern: "chord",
      desc: "Beruhigende tiefe Brumm-Akkorde"
    },
    info: {
      hear: "Hunde hören ca. 40 Hz – 45 kHz. Der Mensch hört nur bis ~20 kHz.",
      facts: [
        "Hundepfeifen nutzen 22–25 kHz — für uns fast lautlos, für Hunde deutlich hörbar.",
        "Hunde lassen sich mit Ultraschalltraining (z. B. Anti-Bell) konditionieren.",
        "Katzen hören Ultraschall übrigens auch (bis ~64 kHz)."
      ],
      disc: "Niemals lange oder laut einsetzen: Ultraschall ist für Hunde deutlich unangenehmer als für uns. Nervöse Tiere können Angst entwickeln."
    }
  },
  {
    id: "muecken",
    icon: "🦟",
    name: "Stechmücken",
    sub: "Flugton & Ultraschall",
    repel: {
      label: "Abwehren",
      freqs: [38000, 40000, 42000, 44000],
      pattern: "sweep",
      desc: "Ultraschall-Sweep 38–44 kHz"
    },
    enrich: {
      label: "Anlocken (Falle)",
      freqs: [400, 480, 560, 600],
      pattern: "constant",
      desc: "Weibchen-Flugton 400–600 Hz — lockt Männchen (DIY-Fallen-Experiment)"
    },
    info: {
      hear: "Mücken haben kein Ohr wie wir: Sie „hören“ mit den Fühlern (Johnstonsches Organ), vor allem Flugtöne um 150–800 Hz.",
      facts: [
        "Weibliche Stechmücken fliegen mit ~400–600 Hz — dieser Ton lockt Männchen an (Grundlage echter Fallen).",
        "Männchen-Schwärme singen bei ~600 Hz; Weibchen-Ton + Männchen-Ton treffen sich bei ~700 Hz (Harmonik-Effekt).",
        "Handy-Lautsprecher schaffen hohe Töne meist nur bis ~15–18 kHz."
      ],
      disc: "Wichtig & ehrlich: Der Cochrane-Review (2007) fand KEINE Wirkung von Ultraschall-Geräten gegen Mückenstiche. Real nutzbar ist der Anlock-Modus für DIY-Fallen (Ventilator + Klebefolie)."
    }
  },
  {
    id: "fliegen",
    icon: "🪰",
    name: "Fliegen",
    sub: "Schmeißfliegen & Co.",
    repel: {
      label: "Abwehren",
      freqs: [38000, 41000, 44000],
      pattern: "sweep",
      desc: "Ultraschall-Sweep 38–44 kHz"
    },
    enrich: null,
    info: {
      hear: "Fliegen haben kein Gehör wie wir. Sie spüren Luftschwingungen mit Antennen und Haarborsten; ihr eigener Flugton liegt bei 150–250 Hz.",
      facts: [
        "Fliegen reagieren stark auf Bewegung und Luftzug — akustisch kaum beeinflussbar.",
        "Ihr Flugton (~200 Hz) dient der Paarungs-Erkennung.",
        "Ultraschall-Werte im Netz (z. B. 38–44 kHz) sind kaum wissenschaftlich belegt."
      ],
      disc: "Ehrlich: Gegen Fliegen helfen Fensterfliegen, Fallen und Hygiene deutlich besser als Töne."
    }
  },
  {
    id: "pflanzen",
    icon: "🌱",
    name: "Pflanzen",
    sub: "Vibrations-Stimulation",
    repel: {
      label: "Stress (Experiment)",
      freqs: [800, 1000, 1200],
      pattern: "constant",
      desc: "Dauer-Schall als Stressor — eher schädlich, nur zum Testen"
    },
    enrich: {
      label: "Bereichern",
      freqs: [110, 220, 330, 432],
      pattern: "chord",
      desc: "100–500 Hz Wurzel-Stimulation + 432-Hz-Akkord"
    },
    info: {
      hear: "Pflanzen haben kein Gehör — sie reagieren auf Vibrationen. Maiswurzeln wuchsen in Studien Richtung Tönen von 100–300 Hz.",
      facts: [
        "Studien zeigen: 100–500 Hz können Keimung und Wurzelwachstum leicht fördern.",
        "432 Hz ist ein beliebter „Harmonie“-Ton — Wirkung auf Pflanzen ist nicht belegt, schadet aber nicht.",
        "Lauter Dauer-Schall wirkt als Stressor und kann Wachstum hemmen."
      ],
      disc: "Effekte sind klein und umstritten. Nie tagelang beschallen — der Stress-Modus ist wirklich nur zum Experimentieren gedacht."
    }
  }
];

/* Hörbereiche für das Diagramm (von, bis, Label, Farbe) */
const HEARING_RANGES = [
  { from: 150,  to: 800,   label: "Insekt (Mücke)", color: "#E08794" },
  { from: 200,  to: 8500,  label: "Vogel (Sittich)", color: "#9A8FC9" },
  { from: 20,   to: 20000, label: "Mensch", color: "#9FB88A" },
  { from: 40,   to: 45000, label: "Hund", color: "#E0A458" }
];
