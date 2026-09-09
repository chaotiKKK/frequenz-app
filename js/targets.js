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
  },
  {
    id: "katze",
    icon: "🐱",
    name: "Katze",
    sub: "Pfeifen & Schnurren",
    repel: {
      label: "Abwehren",
      freqs: [20000, 22000, 24000, 25000],
      pattern: "sweep",
      desc: "Ultraschall-Pfeifen 20–25 kHz — wie die Hundepfeife, Katzen hören bis 85 kHz"
    },
    enrich: {
      label: "Bereichern",
      freqs: [100, 125, 150, 200],
      pattern: "chord",
      desc: "Schnurre-Bereich ~25 Hz, als hörbare Oktav-Replik 100–200 Hz"
    },
    info: {
      hear: "Katzen hören 48 Hz – 85 kHz (Heffner 1985) — eines der breitesten Hörfenster der Säugetiere. Am empfindlichsten um 8 kHz.",
      facts: [
        "Katzen hören rund 1,6 Oktaven höher als Menschen (bis 64–85 kHz je nach Studie).",
        "Das Schnurren liegt bei ~25–30 Hz Grundfrequenz — die 100–200-Hz-Töne replizieren es hörbar.",
        "Ultraschall-Abwehr ist bei Katzen kaum belegt; Pfeifen wirkt eher als Neustimulus als als Vertreiber."
      ],
      disc: "Pfeiftöne können Katzen stressen statt vertreiben — nie dauerhaft oder laut einsetzen, und nie, wenn die eigene Katze in Hörweite ist."
    }
  },
  {
    id: "ratte",
    icon: "🐀",
    name: "Ratte",
    sub: "Ultraschall-Kommunikation",
    repel: {
      label: "Abwehren (schwach belegt)",
      freqs: [30000, 35000, 40000, 45000],
      pattern: "sweep",
      desc: "30–45 kHz Sweep — Ratten hören bis ~80 kHz, Vertreibung per Ton ist kaum belegt"
    },
    enrich: {
      label: "Bereichern (50-kHz-Lachen)",
      freqs: [50000, 51000, 52000],
      pattern: "chirp",
      desc: "50-kHz-USV: Rattenglück-Rufe, die Annäherung und positive Affektlage hervorrufen"
    },
    info: {
      hear: "Ratten hören ~200 Hz – 80 kHz. Sie kommunizieren ultraschall: 22 kHz = Angst/Abwehr, 50 kHz = positives Affektgefühl („Lachen“).",
      facts: [
        "50-kHz-Rufe lösen bei Ratten Annäherungsverhalten aus (Wöhr 2007, PLoS ONE) — Bibliothek des Wohlfühlsignals.",
        "Achtung Hardware: 50 kHz brauchen einen Ultraschall-Lautsprecher — normale Boxen erzeugen hier nichts (oder aliasen hörbar).",
        "22-kHz-Rufe signalisieren Bedrohung — die App nutzt sie bewusst NICHT, um Stress zu vermeiden.",
        "„Rattenschreck“-Ultraschallgeräte zeigen in Feldtests kaum dauerhafte Wirkung."
      ],
      disc: "Ethischer Hinweis: Der 50-kHz-Modus ist für Tierhaltung/Forschung gedacht — Ratten sind empfindungsfähige Tiere, keine Schädlings-Abstraktion."
    }
  },
  {
    id: "wespen",
    icon: "🐝",
    name: "Wespen",
    sub: "Flugton & Ultraschall",
    repel: {
      label: "Abwehren",
      freqs: [22000, 25000, 28000],
      pattern: "sweep",
      desc: "Ultraschall-Sweep 22–28 kHz — Wirkung auf Wespen schwach belegt"
    },
    enrich: {
      label: "Anlocken (Experiment)",
      freqs: [150, 200, 250],
      pattern: "constant",
      desc: "Wespen-Flugton 150–250 Hz als Anlock-Experiment (z. B. für Fallen)"
    },
    info: {
      hear: "Wespen hören Luftschall grob 100 Hz – 100 kHz über das Johnsontsche Organ am Fühler — ähnlich wie Mücken, aber schlechter erforscht.",
      facts: [
        "Wespen-Flugton liegt bei 150–250 Hz — tiefer als der der Mücke.",
        "Ultraschall-Wespenabwehr ist kommerziell erhältlich, aber wissenschaftlich kaum validiert.",
        "Echter Wesenschutz: Lebensmittel abdecken, Fallesicherungen, Duftstoffe wie Essig niemals nahe am Tisch."
      ],
      disc: "Datenlage deutlich schwächer als bei Mücken — Mode hier als sauberes Experiment, nicht als Lösung."
    }
  },
  {
    id: "kueken",
    icon: "🐤",
    name: "Küken",
    sub: "Brutstation",
    repel: null,
    enrich: {
      label: "Bereichern",
      freqs: [2800, 3200, 3600, 4000],
      pattern: "chirp",
      desc: "Gluck-Rufe im Mutterstimmen-Bereich 2,8–4 kHz — Prägungssignal für die Brut"
    },
    info: {
      hear: "Hühner hören grob 125 Hz – 2 kHz (empfindlich); Küken prägen sich auf Rufe der Mutterhenne (~2,8–4 kHz) in den ersten Lebenstagen.",
      facts: [
        "Gluck-Rufe der Henne beruhigen Küken und steuern Futterverhalten.",
        "Küken schlüpfen synchron, weil sie sich über die Schale hinweg akustisch abstimmen.",
        "Der Modus ist für Brutstationen/Thermostuben gedacht — leise und zeitlich begrenzt."
      ],
      disc: "Nicht als Dauerton! Küken prägen sich auf das Signal — dauerhafte Beschallung kann die Prägung stören statt stützen."
    }
  },
  {
    id: "tomate",
    icon: "🌾",
    name: "Tomate",
    sub: "Wuchs-Beschallung",
    repel: null,
    enrich: {
      label: "Bereichern",
      freqs: [110, 250, 350, 432],
      pattern: "chord",
      desc: "110–500-Hz-Wurzelstimulation, eigener Preset-Satz mit 432-Hz-Abschluss"
    },
    info: {
      hear: "Tomaten haben kein Gehör — aber Wurzeln reagieren in Studien auf Vibrationen im 100–500-Hz-Band (z. B. Mais-Experimente übertragen).",
      facts: [
        "Studien zeigen leichte Wuchs-Förderung bei 100–500 Hz — Effekte klein, aber messbar.",
        "432 Hz als Abschlussklang: Popularitätsweg, Wirkung nicht belegt, schadet nicht.",
        "Nie über Stunden beschallen — Dauer-Schall wirkt als Stressor."
      ],
      disc: "Übertragene Ergebnisse (Mais, Arabidopsis) — für Tomaten selbst ist die Datenlage dünner. Experiment, kein Dünger-Ersatz."
    }
  },
  {
    id: "mensch",
    icon: "🧑",
    name: "Mensch",
    sub: "Hörtest nach Alter",
    /* Varianten: gleiche Kachel, andere Ohren. Der Mosquito-Ton ist
       derselbe — nur die Hörgrenze des Hörenden unterscheidet sich. */
    variants: [
      {
        id: "jung",
        label: "Junger Mensch",
        repel: {
          label: "Mosquito-Ton",
          freqs: [16800, 17400, 18000],
          pattern: "constant",
          desc: "16,8–18 kHz: für junge Ohren (bis ~25) deutlich hörbar — der berüchtigte Anti-Loitering-Ton"
        },
        enrich: {
          label: "Bereichern",
          freqs: [220, 330, 440],
          pattern: "chord",
          desc: "Weicher A-Dur-Akkord 220–440 Hz — angenehm in jedem Alter"
        }
      },
      {
        id: "alt",
        label: "Älterer Mensch",
        repel: {
          label: "Mosquito-Ton",
          freqs: [16800, 17400, 18000],
          pattern: "constant",
          desc: "Derselbe Ton — ab ~25–30 zunehmend unhörbar (Presbyakusis). Hörst du nichts? Genau das ist der Punkt."
        },
        enrich: {
          label: "Bereichern",
          freqs: [250, 500, 1000],
          pattern: "chord",
          desc: "Sprachband 250–1000 Hz — auch bei altersschwerhörigem Ohr gut wahrnehmbar"
        }
      }
    ],
    info: {
      hear: "Gesunde junge Ohren hören 20 Hz – 20 kHz (Hunter 2020). Ab ~25–30 schwinden die Höhen zuerst: >8 kHz zuerst, im Alter oft nur noch 12–14 kHz.",
      facts: [
        "Der Mosquito-Ton (17,4–18,5 kHz) wurde als Gerät gegen Jugendgruppen eingesetzt — Erwachsene hörten ihn schlicht nicht.",
        "Der Europarat verurteilte die Geräte 2010 als Verstoß gegen die Menschenwürde: Sie vertreiben Jugendliche pauschal.",
        "Selbsttest: Wähle beide Varianten nacheinander und höre, wo deine persönliche Grenze liegt.",
        "Hörverlust beginnt schleichend — laute Kopfhörer beschleunigen ihn deutlich."
      ],
      disc: "Ehrlichkeits-Hinweis: Den Mosquito-Ton nie dauerhaft oder laut einsetzen — er ist für Menschen, die ihn hören, echt unangenehm. Gegenseitiger Respekt statt Vertreibung."
    }
  },
  {
    id: "hornisse",
    icon: "🐞",
    name: "Hornisse",
    sub: "Flugton & Ultraschall",
    repel: {
      label: "Abwehren",
      freqs: [20000, 23000, 26000, 28000],
      pattern: "sweep",
      desc: "Ultraschall-Sweep 20–28 kHz — Experiment, Datenlage wie bei Wespen schwach"
    },
    enrich: {
      label: "Anlocken (Experiment)",
      freqs: [100, 130, 165],
      pattern: "constant",
      desc: "Hornissen-Flugton 100–165 Hz — größerer Körper, tiefere Schlagfrequenz als Wespen"
    },
    info: {
      hear: "Hornissen hören wie andere Faltenwespen über das Johnsontsche Organ, grob 100 Hz – 100 kHz. Spezifische Studien sind rar.",
      facts: [
        "Hornissen sind größer als Wespen — der Flugton liegt entsprechend tiefer (~100–165 Hz).",
        "Hornissen greifen Menschen nicht ungefragt an und stehen in Deutschland unter Schutz.",
        "Echter Schutz: Abstand zum Nest, keine hektischen Bewegungen, Fachbetrieb bei Nest am Haus."
      ],
      disc: "Datenlage schwächer als bei Mücken — Modus als sauberes Experiment. Töten ist bei Hornissen rechtlich problematisch; Nester vom Imker/Umweltamt umsetzen lassen."
    }
  },
  {
    id: "schaben",
    icon: "🪳",
    name: "Schaben",
    sub: "Ultraschall-Experiment",
    repel: {
      label: "Abwehren (wirkungslos belegt)",
      freqs: [25000, 30000, 35000, 45000],
      pattern: "sweep",
      desc: "Ultraschall-Sweep 25–45 kHz — Studien: keine Wirkung, nur zum Selbsttesten"
    },
    enrich: null,
    info: {
      hear: "Schaben hören über Cerci (Anhangsorgane am Hinterleib) vor allem tieffrequent und Luftbewegung; Ultraschall-Wahrnehmung ist begrenzt.",
      facts: [
        "Wissenschaftliche Tests (u. a. Gold et al. 1984; Cornell IPM) fanden KEINE Wirkung von Ultraschall auf Deutsche Schaben.",
        "Kommerzielle Ultraschall-Geräte gegen Schaben sind verkaufsstark, aber wirkungslos.",
        "Echte Bekämpfung: Hygiene, Zugangssperren, Köderdosen — nicht Ton."
      ],
      disc: "Ehrlichkeits-Hinweis: Ultraschall ist gegen Schaben wirkungslos belegt (Gold et al. 1984, Cornell IPM) — dieser Modus ist ein Experiment, keine Bekämpfung. Bei Befall: Fachbetrieb."
    }
  },
  {
    id: "wanzen",
    icon: "🛏️",
    name: "Wanzen",
    sub: "Ultraschall-Experiment",
    repel: {
      label: "Abwehren (wirkungslos belegt)",
      freqs: [30000, 35000, 40000],
      pattern: "sweep",
      desc: "Ultraschall-Sweep 30–40 kHz — Yturralde & Wang 2012: keine Wirkung auf Bettwanzen"
    },
    enrich: null,
    info: {
      hear: "Bettwanzen nehmen Vibrationen und eventuell Luftschall wahr; kommerzielle Ultraschall-Geräte zeigten in Wahlversuchen keinerlei Reaktion.",
      facts: [
        "Yturralde & Wang 2012: Handelsübliche Ultraschall-Geräte stossten Bettwanzen weder an noch stießen sie sie ab.",
        "Wirksam ist Hitze: >55 °C tötet Wanzen in allen Stadien — professonelle Wärmebehandlung.",
        "Auch Kälte, Encasing und gründliches Absaugen sind belegte Maßnahmen."
      ],
      disc: "Ehrlichkeits-Hinweis: Ton ist kein Wanzen-Mittel — Ultraschall ist gegen Bettwanzen wirkungslos belegt (Yturralde & Wang 2012). Bei Befall umgehend Wärmebehandlung/Fachbetrieb."
    }
  },
  {
    id: "glas",
    icon: "🍷",
    name: "Glas & Porzellan",
    sub: "Resonanz-Testtöne",
    material: true,
    repel: null,
    enrich: {
      label: "Resonanz suchen",
      freqs: [400, 600, 800, 1200],
      pattern: "constant",
      desc: "400–1200 Hz: typischer Eigenresonanz-Bereich von Gläsern und Porzellan — Objekt zum Mitschwingen bringen"
    },
    info: {
      hear: "Glas klingt, weil es schwingt: Eigenresonanzen typischer Trinkgläser liegen bei ~400–1200 Hz (abhängig von Form, Größe, Füllstand).",
      facts: [
        "Füllstand verändert die Resonanzfrequenz — volleres Glas = tieferer Klang (Wein-glas-Test).",
        "Chladni-Muster machen Schwingungen sichtbar: Ton + Sand = Geometrie.",
        "Nah an der Eigenresonanz + hohe Lautstärke kann dünnes Glas tatsächlich anregen — mit Bedacht experimentieren."
      ],
      disc: "Resonanz-Experimente bei moderater Lautstärke — sehr laute Töne nahe der Eigenresonanz können Glas beschädigen. Kein Lebewesen, kein Repel."
    }
  },
  {
    id: "metall",
    icon: "🔔",
    name: "Metall & Werkzeug",
    sub: "Stehende Wellen",
    material: true,
    repel: null,
    enrich: {
      label: "Resonanz suchen",
      freqs: [150, 250, 400, 600],
      pattern: "sweep",
      desc: "150–600 Hz Sweep: Eigenschwingungen von Metallteilen, Stäben und Blechen orten"
    },
    info: {
      hear: "Metall klingt hoch und klar: Glocken, Stäbe und Bleche haben Eigenfrequenzen, die Form, Länge und Spannung bestimmen.",
      facts: [
        "Länge bestimmt die Grundfrequenz: doppelt so langer Stab = halbe Frequenz.",
        "Stehende Wellen machen Knoten und Bäuche sichtbar — das Prinzip hinter Chladni-Figuren.",
        "Werkzeug-Prüfung: Verschiedene Materialdicken klingen unterschiedlich — Klang als Schadstoff-Indikator."
      ],
      disc: "Zum Auffinden von Eigenschwingungen gedacht — kein Reinigungs- oder Alarmsystem. Kein Lebewesen, kein Repel."
    }
  },
  {
    id: "holz",
    icon: "🪵",
    name: "Holz & Diffusor",
    sub: "Raumresonanzen",
    material: true,
    repel: null,
    enrich: {
      label: "Resonanz suchen",
      freqs: [200, 300, 400, 500],
      pattern: "constant",
      desc: "200–500 Hz: Testtöne für Resonanzen von Holzwänden, Paneelen und Diffusoren"
    },
    info: {
      hear: "Holz ist ein natürlicher Klangkörper: Resonanzböden von Instrumenten bestehen daraus — Wände und Panele haben spürbare Eigenresonanzen.",
      facts: [
        "Raummoden: Freistehende Holzwände resonieren oft bei 100–300 Hz — der Bäuche-Bereich im Wohnzimmer.",
        "Dielen und Panele knarren resonanzbedingt — der Ton macht es hörbar, wo es liegt.",
        "Diffusoren brechen Schall — ihr Material (Holz) färbt den Klang.",
        "Ton oder Holz-Schlagprobe: vergleichbare Diagnose, nur mit dauerhaftem Ton."
      ],
      disc: "Zum Aufspüren von Raum-Resonanzen gedacht — kein Baugutachter. Kein Lebewesen, kein Repel."
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
