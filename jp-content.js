export const UNITS = [
  {
    "id": "hira",
    "title": "Hiragana: primeros pasos",
    "desc": "Reconoce las sílabas básicas.",
    "notes": [
      "El hiragana representa sonidos, no letras del alfabeto español. Las cinco vocales son あ a · い i · う u · え e · お o.",
      "か ka · き ki · く ku · け ke · こ ko. さ sa · し shi · す su · せ se · そ so.",
      "た ta · ち chi · つ tsu · て te · と to. な na · に ni · ぬ nu · ね ne · の no.",
      "は ha · ひ hi · ふ fu · へ he · ほ ho. ま ma · み mi · む mu · め me · も mo.",
      "や ya · ゆ yu · よ yo. ら ra · り ri · る ru · れ re · ろ ro. わ wa · を o · ん n. Como partícula, は se lee wa y へ se lee e.",
      "Usamos romaji de estilo Hepburn: し shi, ち chi, つ tsu y ふ fu. El romaji es una ayuda temporal, no una guía de pronunciación exacta."
    ],
    "qs": [
      {
        "id": "hira-0",
        "q": "¿Cómo se lee あ?",
        "opts": [
          "a",
          "ki",
          "su",
          "e"
        ],
        "a": 0,
        "why": "あ se lee a."
      },
      {
        "id": "hira-1",
        "q": "¿Cómo se lee き?",
        "opts": [
          "ki",
          "a",
          "su",
          "e"
        ],
        "a": 0,
        "why": "き se lee ki."
      },
      {
        "id": "hira-2",
        "q": "¿Cómo se lee す?",
        "opts": [
          "su",
          "a",
          "ki",
          "e"
        ],
        "a": 0,
        "why": "す se lee su."
      },
      {
        "id": "hira-3",
        "q": "¿Cómo se lee え?",
        "opts": [
          "e",
          "a",
          "ki",
          "su"
        ],
        "a": 0,
        "why": "え se lee e."
      },
      {
        "id": "hira-4",
        "q": "¿Cómo se lee お?",
        "opts": [
          "o",
          "a",
          "ki",
          "su"
        ],
        "a": 0,
        "why": "お se lee o."
      },
      {
        "id": "hira-5",
        "q": "¿Cómo se lee し?",
        "opts": [
          "shi",
          "a",
          "ki",
          "su"
        ],
        "a": 0,
        "why": "し se lee shi."
      },
      {
        "id": "hira-6",
        "q": "¿Cómo se lee ち?",
        "opts": [
          "chi",
          "a",
          "ki",
          "su"
        ],
        "a": 0,
        "why": "ち se lee chi."
      },
      {
        "id": "hira-7",
        "q": "¿Cómo se lee つ?",
        "opts": [
          "tsu",
          "a",
          "ki",
          "su"
        ],
        "a": 0,
        "why": "つ se lee tsu."
      },
      {
        "id": "hira-8",
        "q": "¿Cómo se lee ふ?",
        "opts": [
          "fu",
          "a",
          "ki",
          "su"
        ],
        "a": 0,
        "why": "ふ se lee fu."
      },
      {
        "id": "hira-9",
        "q": "¿Cómo se lee ん?",
        "opts": [
          "n",
          "a",
          "ki",
          "su"
        ],
        "a": 0,
        "why": "ん se lee n."
      },
      {
        "id": "hira-10",
        "q": "¿Cómo se lee ね?",
        "opts": [
          "ne",
          "a",
          "ki",
          "su"
        ],
        "a": 0,
        "why": "ね se lee ne."
      },
      {
        "id": "hira-11",
        "q": "¿Cómo se lee め?",
        "opts": [
          "me",
          "a",
          "ki",
          "su"
        ],
        "a": 0,
        "why": "め se lee me."
      }
    ]
  },
  {
    "id": "hira-sounds",
    "title": "Hiragana: sonidos que cambian",
    "desc": "Dakuten, combinaciones y pausas.",
    "notes": [
      "Los dos trazos ゛cambian sonidos: か ka → が ga, さ sa → ざ za, た ta → だ da, は ha → ば ba. El círculo ゜da は ha → ぱ pa.",
      "が ga · ぎ gi · ぐ gu · げ ge · ご go. ざ za · じ ji · ず zu · ぜ ze · ぞ zo. だ da · ぢ ji · づ zu · で de · ど do.",
      "ば ba · び bi · ぶ bu · べ be · ぼ bo. ぱ pa · ぴ pi · ぷ pu · ぺ pe · ぽ po.",
      "Una ゃ, ゅ o ょ pequeña se combina con el kana anterior: きゃ kya, しゅ shu, ちょ cho, りょ ryo. No es lo mismo きや kiya que きゃ kya.",
      "La っ pequeña marca una pausa o consonante doble: きって kitte (sello), がっこう gakkou (escuela). Las vocales largas también cuentan: おばさん obasan (tía), おばあさん obaasan (abuela)."
    ],
    "qs": [
      {
        "id": "hira-sounds-0",
        "q": "¿Cómo se lee が?",
        "opts": [
          "ga",
          "shu",
          "pa",
          "ji"
        ],
        "a": 0,
        "why": "が se lee ga."
      },
      {
        "id": "hira-sounds-1",
        "q": "¿Cómo se lee しゅ?",
        "opts": [
          "shu",
          "ga",
          "pa",
          "ji"
        ],
        "a": 0,
        "why": "しゅ se lee shu."
      },
      {
        "id": "hira-sounds-2",
        "q": "¿Cómo se lee ぱ?",
        "opts": [
          "pa",
          "ga",
          "shu",
          "ji"
        ],
        "a": 0,
        "why": "ぱ se lee pa."
      },
      {
        "id": "hira-sounds-3",
        "q": "¿Cómo se lee じ?",
        "opts": [
          "ji",
          "ga",
          "shu",
          "pa"
        ],
        "a": 0,
        "why": "じ se lee ji."
      },
      {
        "id": "hira-sounds-4",
        "q": "¿Cómo se lee きゃ?",
        "opts": [
          "kya",
          "ga",
          "shu",
          "pa"
        ],
        "a": 0,
        "why": "きゃ se lee kya."
      },
      {
        "id": "hira-sounds-5",
        "q": "¿Cómo se lee ちょ?",
        "opts": [
          "cho",
          "ga",
          "shu",
          "pa"
        ],
        "a": 0,
        "why": "ちょ se lee cho."
      },
      {
        "id": "hira-sounds-6",
        "q": "¿Cómo se lee りょ?",
        "opts": [
          "ryo",
          "ga",
          "shu",
          "pa"
        ],
        "a": 0,
        "why": "りょ se lee ryo."
      },
      {
        "id": "hira-sounds-7",
        "q": "¿Cómo se lee きって?",
        "opts": [
          "kitte",
          "ga",
          "shu",
          "pa"
        ],
        "a": 0,
        "why": "きって se lee kitte."
      },
      {
        "id": "hira-sounds-8",
        "q": "¿Cómo se lee がっこう?",
        "opts": [
          "gakkou",
          "ga",
          "shu",
          "pa"
        ],
        "a": 0,
        "why": "がっこう se lee gakkou."
      },
      {
        "id": "hira-sounds-9",
        "q": "¿Cómo se lee おばあさん?",
        "opts": [
          "obaasan",
          "ga",
          "shu",
          "pa"
        ],
        "a": 0,
        "why": "おばあさん se lee obaasan."
      },
      {
        "id": "hira-sounds-10",
        "q": "¿Cómo se lee びょういん?",
        "opts": [
          "byouin",
          "ga",
          "shu",
          "pa"
        ],
        "a": 0,
        "why": "びょういん se lee byouin."
      },
      {
        "id": "hira-sounds-11",
        "q": "¿Cómo se lee ぎゅうにゅう?",
        "opts": [
          "gyuunyuu",
          "ga",
          "shu",
          "pa"
        ],
        "a": 0,
        "why": "ぎゅうにゅう se lee gyuunyuu."
      }
    ]
  },
  {
    "id": "kata",
    "title": "Katakana: reconocer el otro silabario",
    "desc": "Préstamos, nombres y sonidos básicos.",
    "notes": [
      "El katakana representa los mismos sonidos que el hiragana. Se usa mucho en palabras tomadas de otros idiomas y nombres extranjeros.",
      "ア a · イ i · ウ u · エ e · オ o. カ ka · キ ki · ク ku · ケ ke · コ ko.",
      "サ sa · シ shi · ス su · セ se · ソ so. タ ta · チ chi · ツ tsu · テ te · ト to.",
      "ナ na · ニ ni · ヌ nu · ネ ne · ノ no. ハ ha · ヒ hi · フ fu · ヘ he · ホ ho.",
      "マ ma · ミ mi · ム mu · メ me · モ mo. ヤ ya · ユ yu · ヨ yo. ラ ra · リ ri · ル ru · レ re · ロ ro. ワ wa · ヲ o · ン n.",
      "Distingue シ shi de ツ tsu y ソ so de ン n. Fíjate en la inclinación de los trazos."
    ],
    "qs": [
      {
        "id": "kata-0",
        "q": "¿Cómo se lee ア?",
        "opts": [
          "a",
          "shi",
          "n",
          "ka"
        ],
        "a": 0,
        "why": "ア se lee a."
      },
      {
        "id": "kata-1",
        "q": "¿Cómo se lee シ?",
        "opts": [
          "shi",
          "a",
          "n",
          "ka"
        ],
        "a": 0,
        "why": "シ se lee shi."
      },
      {
        "id": "kata-2",
        "q": "¿Cómo se lee ン?",
        "opts": [
          "n",
          "a",
          "shi",
          "ka"
        ],
        "a": 0,
        "why": "ン se lee n."
      },
      {
        "id": "kata-3",
        "q": "¿Cómo se lee カ?",
        "opts": [
          "ka",
          "a",
          "shi",
          "n"
        ],
        "a": 0,
        "why": "カ se lee ka."
      },
      {
        "id": "kata-4",
        "q": "¿Cómo se lee キ?",
        "opts": [
          "ki",
          "a",
          "shi",
          "n"
        ],
        "a": 0,
        "why": "キ se lee ki."
      },
      {
        "id": "kata-5",
        "q": "¿Cómo se lee ツ?",
        "opts": [
          "tsu",
          "a",
          "shi",
          "n"
        ],
        "a": 0,
        "why": "ツ se lee tsu."
      },
      {
        "id": "kata-6",
        "q": "¿Cómo se lee ソ?",
        "opts": [
          "so",
          "a",
          "shi",
          "n"
        ],
        "a": 0,
        "why": "ソ se lee so."
      },
      {
        "id": "kata-7",
        "q": "¿Cómo se lee ス?",
        "opts": [
          "su",
          "a",
          "shi",
          "n"
        ],
        "a": 0,
        "why": "ス se lee su."
      },
      {
        "id": "kata-8",
        "q": "¿Cómo se lee コ?",
        "opts": [
          "ko",
          "a",
          "shi",
          "n"
        ],
        "a": 0,
        "why": "コ se lee ko."
      },
      {
        "id": "kata-9",
        "q": "¿Cómo se lee リ?",
        "opts": [
          "ri",
          "a",
          "shi",
          "n"
        ],
        "a": 0,
        "why": "リ se lee ri."
      },
      {
        "id": "kata-10",
        "q": "¿Cómo se lee ウ?",
        "opts": [
          "u",
          "a",
          "shi",
          "n"
        ],
        "a": 0,
        "why": "ウ se lee u."
      },
      {
        "id": "kata-11",
        "q": "¿Cómo se lee エ?",
        "opts": [
          "e",
          "a",
          "shi",
          "n"
        ],
        "a": 0,
        "why": "エ se lee e."
      }
    ]
  },
  {
    "id": "kata-sounds",
    "title": "Katakana: palabras y vocales largas",
    "desc": "Lee sin saltarte el signo ー.",
    "notes": [
      "En katakana, ー alarga la vocal anterior: コーヒー koohii (café), タクシー takushii (taxi). Aquí escribimos las vocales dobles en romaji.",
      "Los dakuten y el círculo funcionan igual: ガ ga, ジ ji, バ ba, パ pa. Las combinaciones pequeñas también: シャ sha, チョ cho.",
      "La ッ pequeña dobla la consonante siguiente: ベッド beddo (cama). ティ representa ti en préstamos.",
      "Prueba estas palabras: カメラ kamera (cámara), テレビ terebi (televisión), ラジオ rajio (radio), バス basu (autobús), パン pan (pan)."
    ],
    "qs": [
      {
        "id": "kata-sounds-0",
        "q": "¿Cómo se lee コーヒー?",
        "opts": [
          "koohii",
          "beddo",
          "shatsu",
          "kamera"
        ],
        "a": 0,
        "why": "コーヒー se lee koohii."
      },
      {
        "id": "kata-sounds-1",
        "q": "¿Cómo se lee ベッド?",
        "opts": [
          "beddo",
          "koohii",
          "shatsu",
          "kamera"
        ],
        "a": 0,
        "why": "ベッド se lee beddo."
      },
      {
        "id": "kata-sounds-2",
        "q": "¿Cómo se lee シャツ?",
        "opts": [
          "shatsu",
          "koohii",
          "beddo",
          "kamera"
        ],
        "a": 0,
        "why": "シャツ se lee shatsu."
      },
      {
        "id": "kata-sounds-3",
        "q": "¿Cómo se lee カメラ?",
        "opts": [
          "kamera",
          "koohii",
          "beddo",
          "shatsu"
        ],
        "a": 0,
        "why": "カメラ se lee kamera."
      },
      {
        "id": "kata-sounds-4",
        "q": "¿Cómo se lee テレビ?",
        "opts": [
          "terebi",
          "koohii",
          "beddo",
          "shatsu"
        ],
        "a": 0,
        "why": "テレビ se lee terebi."
      },
      {
        "id": "kata-sounds-5",
        "q": "¿Cómo se lee ラジオ?",
        "opts": [
          "rajio",
          "koohii",
          "beddo",
          "shatsu"
        ],
        "a": 0,
        "why": "ラジオ se lee rajio."
      },
      {
        "id": "kata-sounds-6",
        "q": "¿Cómo se lee バス?",
        "opts": [
          "basu",
          "koohii",
          "beddo",
          "shatsu"
        ],
        "a": 0,
        "why": "バス se lee basu."
      },
      {
        "id": "kata-sounds-7",
        "q": "¿Cómo se lee パン?",
        "opts": [
          "pan",
          "koohii",
          "beddo",
          "shatsu"
        ],
        "a": 0,
        "why": "パン se lee pan."
      },
      {
        "id": "kata-sounds-8",
        "q": "¿Cómo se lee タクシー?",
        "opts": [
          "takushii",
          "koohii",
          "beddo",
          "shatsu"
        ],
        "a": 0,
        "why": "タクシー se lee takushii."
      },
      {
        "id": "kata-sounds-9",
        "q": "¿Cómo se lee チョコ?",
        "opts": [
          "choko",
          "koohii",
          "beddo",
          "shatsu"
        ],
        "a": 0,
        "why": "チョコ se lee choko."
      },
      {
        "id": "kata-sounds-10",
        "q": "¿Cómo se lee パーティー?",
        "opts": [
          "paatii",
          "koohii",
          "beddo",
          "shatsu"
        ],
        "a": 0,
        "why": "パーティー se lee paatii."
      },
      {
        "id": "kata-sounds-11",
        "q": "¿Cómo se lee ギター?",
        "opts": [
          "gitaa",
          "koohii",
          "beddo",
          "shatsu"
        ],
        "a": 0,
        "why": "ギター se lee gitaa."
      }
    ]
  },
  {
    "id": "words",
    "title": "Palabras del día a día",
    "desc": "Un pequeño vocabulario que sí vas a usar.",
    "notes": [
      "みず mizu = agua · ほん hon = libro · ねこ neko = gato · いぬ inu = perro.",
      "やま yama = montaña · くるま kuruma = coche · えき eki = estación · がっこう gakkou = escuela.",
      "ともだち tomodachi = amigo/a · おんがく ongaku = música · きょう kyou = hoy · あした ashita = mañana (el día siguiente).",
      "El japonés no suele marcar plural ni género en estos sustantivos: ともだち puede ser amigo, amiga o amigos según el contexto."
    ],
    "qs": [
      {
        "id": "words-0",
        "q": "¿Qué significa みず (mizu)?",
        "opts": [
          "agua",
          "libro",
          "gato",
          "perro"
        ],
        "a": 0,
        "why": "みず (mizu) significa «agua»."
      },
      {
        "id": "words-1",
        "q": "¿Qué significa ほん (hon)?",
        "opts": [
          "libro",
          "agua",
          "gato",
          "perro"
        ],
        "a": 0,
        "why": "ほん (hon) significa «libro»."
      },
      {
        "id": "words-2",
        "q": "¿Qué significa ねこ (neko)?",
        "opts": [
          "gato",
          "agua",
          "libro",
          "perro"
        ],
        "a": 0,
        "why": "ねこ (neko) significa «gato»."
      },
      {
        "id": "words-3",
        "q": "¿Qué significa いぬ (inu)?",
        "opts": [
          "perro",
          "agua",
          "libro",
          "gato"
        ],
        "a": 0,
        "why": "いぬ (inu) significa «perro»."
      },
      {
        "id": "words-4",
        "q": "¿Qué significa やま (yama)?",
        "opts": [
          "montaña",
          "agua",
          "libro",
          "gato"
        ],
        "a": 0,
        "why": "やま (yama) significa «montaña»."
      },
      {
        "id": "words-5",
        "q": "¿Qué significa くるま (kuruma)?",
        "opts": [
          "coche",
          "agua",
          "libro",
          "gato"
        ],
        "a": 0,
        "why": "くるま (kuruma) significa «coche»."
      },
      {
        "id": "words-6",
        "q": "¿Qué significa えき (eki)?",
        "opts": [
          "estación",
          "agua",
          "libro",
          "gato"
        ],
        "a": 0,
        "why": "えき (eki) significa «estación»."
      },
      {
        "id": "words-7",
        "q": "¿Qué significa がっこう (gakkou)?",
        "opts": [
          "escuela",
          "agua",
          "libro",
          "gato"
        ],
        "a": 0,
        "why": "がっこう (gakkou) significa «escuela»."
      },
      {
        "id": "words-8",
        "q": "¿Qué significa ともだち (tomodachi)?",
        "opts": [
          "amigo/a",
          "agua",
          "libro",
          "gato"
        ],
        "a": 0,
        "why": "ともだち (tomodachi) significa «amigo/a»."
      },
      {
        "id": "words-9",
        "q": "¿Qué significa おんがく (ongaku)?",
        "opts": [
          "música",
          "agua",
          "libro",
          "gato"
        ],
        "a": 0,
        "why": "おんがく (ongaku) significa «música»."
      },
      {
        "id": "words-10",
        "q": "¿Qué significa きょう (kyou)?",
        "opts": [
          "hoy",
          "agua",
          "libro",
          "gato"
        ],
        "a": 0,
        "why": "きょう (kyou) significa «hoy»."
      },
      {
        "id": "words-11",
        "q": "¿Qué significa あした (ashita)?",
        "opts": [
          "mañana (el día siguiente)",
          "agua",
          "libro",
          "gato"
        ],
        "a": 0,
        "why": "あした (ashita) significa «mañana (el día siguiente)»."
      }
    ]
  },
  {
    "id": "greetings",
    "title": "Saludos y pequeñas respuestas",
    "desc": "Elige la expresión según la situación.",
    "notes": [
      "こんにちは konnichiwa = hola / buenas tardes. Aunque termina en は, aquí se pronuncia wa. おはようございます ohayou gozaimasu = buenos días (cortés).",
      "こんばんは konbanwa = buenas noches (al saludar). おやすみなさい oyasuminasai = buenas noches (al irse a dormir).",
      "ありがとうございます arigatou gozaimasu = gracias (cortés). すみません sumimasen = disculpe / perdón; también se usa para llamar la atención.",
      "はじめまして hajimemashite = encantado/a (al conocerse). よろしくおねがいします yoroshiku onegaishimasu es una fórmula al empezar una relación: algo como «un placer / cuento contigo», según el contexto.",
      "はい hai = sí · いいえ iie = no · またね mata ne = hasta luego (informal) · いただきます itadakimasu se dice antes de comer."
    ],
    "qs": [
      {
        "id": "greetings-0",
        "q": "¿Qué significa こんにちは (konnichiwa)?",
        "opts": [
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)",
          "buenos días (cortés)"
        ],
        "a": 0,
        "why": "こんにちは (konnichiwa) significa «hola / buenas tardes»."
      },
      {
        "id": "greetings-1",
        "q": "¿Qué significa すみません (sumimasen)?",
        "opts": [
          "disculpe / perdón",
          "hola / buenas tardes",
          "encantado/a (al conocerse)",
          "buenos días (cortés)"
        ],
        "a": 0,
        "why": "すみません (sumimasen) significa «disculpe / perdón»."
      },
      {
        "id": "greetings-2",
        "q": "¿Qué significa はじめまして (hajimemashite)?",
        "opts": [
          "encantado/a (al conocerse)",
          "hola / buenas tardes",
          "disculpe / perdón",
          "buenos días (cortés)"
        ],
        "a": 0,
        "why": "はじめまして (hajimemashite) significa «encantado/a (al conocerse)»."
      },
      {
        "id": "greetings-3",
        "q": "¿Qué significa おはようございます (ohayou gozaimasu)?",
        "opts": [
          "buenos días (cortés)",
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)"
        ],
        "a": 0,
        "why": "おはようございます (ohayou gozaimasu) significa «buenos días (cortés)»."
      },
      {
        "id": "greetings-4",
        "q": "¿Qué significa こんばんは (konbanwa)?",
        "opts": [
          "buenas noches (al saludar)",
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)"
        ],
        "a": 0,
        "why": "こんばんは (konbanwa) significa «buenas noches (al saludar)»."
      },
      {
        "id": "greetings-5",
        "q": "¿Qué significa おやすみなさい (oyasuminasai)?",
        "opts": [
          "buenas noches (al irse a dormir)",
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)"
        ],
        "a": 0,
        "why": "おやすみなさい (oyasuminasai) significa «buenas noches (al irse a dormir)»."
      },
      {
        "id": "greetings-6",
        "q": "¿Qué significa ありがとうございます (arigatou gozaimasu)?",
        "opts": [
          "gracias (cortés)",
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)"
        ],
        "a": 0,
        "why": "ありがとうございます (arigatou gozaimasu) significa «gracias (cortés)»."
      },
      {
        "id": "greetings-7",
        "q": "¿Qué significa はい (hai)?",
        "opts": [
          "sí",
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)"
        ],
        "a": 0,
        "why": "はい (hai) significa «sí»."
      },
      {
        "id": "greetings-8",
        "q": "¿Qué significa いいえ (iie)?",
        "opts": [
          "no",
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)"
        ],
        "a": 0,
        "why": "いいえ (iie) significa «no»."
      },
      {
        "id": "greetings-9",
        "q": "¿Qué significa またね (mata ne)?",
        "opts": [
          "hasta luego (informal)",
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)"
        ],
        "a": 0,
        "why": "またね (mata ne) significa «hasta luego (informal)»."
      },
      {
        "id": "greetings-10",
        "q": "¿Qué significa いただきます (itadakimasu)?",
        "opts": [
          "fórmula antes de comer",
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)"
        ],
        "a": 0,
        "why": "いただきます (itadakimasu) significa «fórmula antes de comer»."
      },
      {
        "id": "greetings-11",
        "q": "¿Qué significa よろしくおねがいします (yoroshiku onegaishimasu)?",
        "opts": [
          "fórmula al empezar una relación",
          "hola / buenas tardes",
          "disculpe / perdón",
          "encantado/a (al conocerse)"
        ],
        "a": 0,
        "why": "よろしくおねがいします (yoroshiku onegaishimasu) significa «fórmula al empezar una relación»."
      }
    ]
  },
  {
    "id": "copula",
    "title": "Presentarte y hacer preguntas",
    "desc": "は, です, か y の en frases sencillas.",
    "notes": [
      "わたしはタナカです。Watashi wa Tanaka desu. = Soy Tanaka. は marca el tema y se lee wa. です aporta cortesía; no equivale siempre a «ser».",
      "がくせいです。Gakusei desu. = Soy estudiante (si hablamos de mí). Se omite lo que ya se entiende por el contexto.",
      "がくせいですか。Gakusei desu ka. = ¿Eres estudiante? En este patrón, か marca la pregunta.",
      "がくせいではありません。Gakusei dewa arimasen. = No soy estudiante. じゃありません ja arimasen es otra forma cortés habitual.",
      "わたしのほん watashi no hon = mi libro. の une sustantivos y puede indicar posesión. これ kore = esto; それ sore = eso; あれ are = aquello."
    ],
    "qs": [
      {
        "id": "copula-0",
        "q": "Completa «Soy Tanaka»: わたし＿タナカです。",
        "opts": [
          "は",
          "を",
          "で",
          "か"
        ],
        "a": 0,
        "why": "は (wa) marca el tema: watashi wa Tanaka desu."
      },
      {
        "id": "copula-1",
        "q": "¿Qué significa がくせいですか (gakusei desu ka)?",
        "opts": [
          "¿Eres estudiante?",
          "Soy profesor.",
          "No soy estudiante.",
          "Este es mi libro."
        ],
        "a": 0,
        "why": "がくせい es estudiante; か convierte este patrón en pregunta."
      },
      {
        "id": "copula-2",
        "q": "Elige «mi libro».",
        "opts": [
          "わたしのほん",
          "わたしをほん",
          "わたしでほん",
          "わたしかほん"
        ],
        "a": 0,
        "why": "の une わたし y ほん: watashi no hon, mi libro."
      },
      {
        "id": "copula-3",
        "q": "¿Cómo se lee は cuando marca el tema?",
        "opts": [
          "wa",
          "ha",
          "ba",
          "pa"
        ],
        "a": 0,
        "why": "La partícula de tema は se pronuncia wa."
      },
      {
        "id": "copula-4",
        "q": "Elige «No soy estudiante» en estilo cortés.",
        "opts": [
          "がくせいではありません。",
          "がくせいです。",
          "がくせいですか。",
          "がくせいのほん。"
        ],
        "a": 0,
        "why": "ではありません (dewa arimasen) es una negación cortés de este patrón."
      },
      {
        "id": "copula-5",
        "q": "¿Qué significa これ (kore)?",
        "opts": [
          "esto",
          "eso",
          "aquello",
          "dónde"
        ],
        "a": 0,
        "why": "これ señala algo cercano a quien habla."
      },
      {
        "id": "copula-6",
        "q": "¿Qué añade normalmente か al final de este patrón con です?",
        "opts": [
          "una pregunta",
          "posesión",
          "pasado",
          "plural"
        ],
        "a": 0,
        "why": "ですか se usa para hacer una pregunta cortés."
      },
      {
        "id": "copula-7",
        "q": "En «ほんです» hablando de un objeto, ¿qué significa ほん (hon)?",
        "opts": [
          "libro",
          "agua",
          "amigo",
          "estación"
        ],
        "a": 0,
        "why": "ほん significa libro: hon desu, es un libro."
      },
      {
        "id": "copula-8",
        "q": "Traduce それはわたしのほんです。 (Sore wa watashi no hon desu.)",
        "opts": [
          "Ese es mi libro.",
          "Soy estudiante.",
          "¿Dónde está el libro?",
          "No tengo libro."
        ],
        "a": 0,
        "why": "それ es eso; わたしのほん es mi libro."
      }
    ]
  },
  {
    "id": "particles",
    "title": "Qué, dónde y adónde",
    "desc": "を, で y に con funciones concretas.",
    "notes": [
      "みずをのみます。Mizu o nomimasu. = Bebo agua. を marca aquí el objeto directo y se pronuncia o.",
      "としょかんでべんきょうします。Toshokan de benkyou shimasu. = Estudio en la biblioteca. で marca el lugar donde ocurre una acción.",
      "にほんにいきます。Nihon ni ikimasu. = Voy a Japón. に marca aquí el destino. へ (e) también puede señalar la dirección, pero no aparece como alternativa en estos ejercicios.",
      "しちじにおきます。Shichiji ni okimasu. = Me levanto a las siete. に puede señalar una hora concreta.",
      "へやにねこがいます。Heya ni neko ga imasu. = Hay un gato en la habitación. に marca la ubicación; が señala lo que existe. No confundas esta ubicación con el lugar de una acción marcado con で."
    ],
    "qs": [
      {
        "id": "particles-0",
        "q": "Bebo agua: みず＿のみます。",
        "opts": [
          "を",
          "で",
          "はありません",
          "か"
        ],
        "a": 0,
        "why": "を (o) marca lo que bebes: mizu o nomimasu."
      },
      {
        "id": "particles-1",
        "q": "Estudio en la biblioteca: としょかん＿べんきょうします。",
        "opts": [
          "で",
          "を",
          "の",
          "か"
        ],
        "a": 0,
        "why": "で marca el lugar de la acción de estudiar."
      },
      {
        "id": "particles-2",
        "q": "Voy a Japón: にほん＿いきます。",
        "opts": [
          "に",
          "を",
          "が",
          "の"
        ],
        "a": 0,
        "why": "に marca el destino en este patrón."
      },
      {
        "id": "particles-3",
        "q": "Leo un libro: ほん＿よみます。",
        "opts": [
          "を",
          "に",
          "で",
          "の"
        ],
        "a": 0,
        "why": "El libro es el objeto de leer: hon o yomimasu."
      },
      {
        "id": "particles-4",
        "q": "Como en casa: うち＿たべます。",
        "opts": [
          "で",
          "を",
          "の",
          "か"
        ],
        "a": 0,
        "why": "で marca dónde tiene lugar la acción de comer."
      },
      {
        "id": "particles-5",
        "q": "Me levanto a las siete: しちじ＿おきます。",
        "opts": [
          "に",
          "を",
          "で",
          "の"
        ],
        "a": 0,
        "why": "Con una hora concreta usamos に en este patrón."
      },
      {
        "id": "particles-6",
        "q": "Hay un gato en la habitación: へや＿ねこがいます。",
        "opts": [
          "に",
          "を",
          "で",
          "の"
        ],
        "a": 0,
        "why": "Con います, に señala dónde está el gato."
      },
      {
        "id": "particles-7",
        "q": "¿Cómo se pronuncia la partícula を en el japonés estándar actual?",
        "opts": [
          "o",
          "wo (siempre)",
          "wa",
          "u"
        ],
        "a": 0,
        "why": "Se escribe を, pero como partícula normalmente se pronuncia o."
      },
      {
        "id": "particles-8",
        "q": "¿Qué marca で en カフェでコーヒーをのみます?",
        "opts": [
          "el lugar de la acción",
          "el objeto bebido",
          "la posesión",
          "una pregunta"
        ],
        "a": 0,
        "why": "Kafe de koohii o nomimasu: bebo café en una cafetería. で marca el lugar."
      }
    ]
  },
  {
    "id": "verbs",
    "title": "Lo que haces, lo que no y lo que hiciste",
    "desc": "Verbos en estilo cortés: ます y sus cambios.",
    "notes": [
      "のみます nomimasu = bebo / beberé. よみます yomimasu = leo / leeré. たべます tabemasu = como / comeré. El no pasado puede ser hábito o futuro según el contexto.",
      "Para negar, cambia ます por ません: のみません nomimasen = no bebo / no beberé.",
      "Para pasado afirmativo, cambia ます por ました: たべました tabemashita = comí. Para pasado negativo, ませんでした: たべませんでした tabemasen deshita = no comí.",
      "いきます ikimasu = voy · きます kimasu = vengo · します shimasu = hago. Estos patrones son de estilo cortés; no explican todavía todas las formas de diccionario."
    ],
    "qs": [
      {
        "id": "verbs-0",
        "q": "Negativo cortés de たべます (tabemasu).",
        "opts": [
          "たべません",
          "たべました",
          "たべますか",
          "たべもの"
        ],
        "a": 0,
        "why": "Cambiamos ます por ません: tabemasen, no como / no comeré."
      },
      {
        "id": "verbs-1",
        "q": "¿Qué significa のみました (nomimashita)?",
        "opts": [
          "bebí / bebió",
          "no bebo",
          "beberé, seguro",
          "beber (diccionario)"
        ],
        "a": 0,
        "why": "ました marca pasado afirmativo cortés; la persona depende del contexto."
      },
      {
        "id": "verbs-2",
        "q": "Pasado negativo cortés de いきます (ikimasu).",
        "opts": [
          "いきませんでした",
          "いきました",
          "いきます",
          "いきません"
        ],
        "a": 0,
        "why": "ませんでした marca pasado negativo cortés: no fui / no fue."
      },
      {
        "id": "verbs-3",
        "q": "Elige «Leo / leeré» en estilo cortés.",
        "opts": [
          "よみます",
          "よみました",
          "よみません",
          "よみませんでした"
        ],
        "a": 0,
        "why": "よみます (yomimasu) es no pasado afirmativo cortés."
      },
      {
        "id": "verbs-4",
        "q": "Elige «No bebo / no beberé».",
        "opts": [
          "のみません",
          "のみました",
          "のみます",
          "のみませんでした"
        ],
        "a": 0,
        "why": "のみません (nomimasen) es no pasado negativo cortés."
      },
      {
        "id": "verbs-5",
        "q": "Elige «Comí» en estilo cortés.",
        "opts": [
          "たべました",
          "たべます",
          "たべません",
          "たべませんでした"
        ],
        "a": 0,
        "why": "たべました (tabemashita) es pasado afirmativo cortés."
      },
      {
        "id": "verbs-6",
        "q": "¿Qué significa きます (kimasu)?",
        "opts": [
          "vengo / vendré",
          "voy / iré",
          "como / comeré",
          "leo / leeré"
        ],
        "a": 0,
        "why": "きます es la forma cortés no pasada de 来る (kuru), venir."
      },
      {
        "id": "verbs-7",
        "q": "¿Qué significa しませんでした (shimasen deshita)?",
        "opts": [
          "no hice / no hizo",
          "hago / hace",
          "hice / hizo",
          "no hago / no hace"
        ],
        "a": 0,
        "why": "しませんでした es pasado negativo cortés de します, hacer."
      },
      {
        "id": "verbs-8",
        "q": "¿Puede たべます (tabemasu) hablar del futuro?",
        "opts": [
          "Sí, según el contexto.",
          "No, solo del pasado.",
          "Solo si termina en か.",
          "Solo cuando lleva の."
        ],
        "a": 0,
        "why": "El no pasado japonés puede describir hábitos y hechos futuros según el contexto."
      }
    ]
  },
  {
    "id": "adjectives",
    "title": "Describir y decir qué te gusta",
    "desc": "Adjetivos en い, adjetivos en な y 好き.",
    "notes": [
      "おいしい oishii = rico / delicioso. Es un adjetivo en い: おいしいです oishii desu = está rico (cortés).",
      "En estos adjetivos, sustituye la い final por くない para negar: おいしくない oishikunai = no está rico. Para pasado: おいしかった oishikatta = estaba rico.",
      "しずか shizuka = tranquilo. Delante de un nombre usa な: しずかなまち shizuka na machi = una ciudad tranquila. Al terminar una frase cortés: しずかです shizuka desu.",
      "きれい kirei (bonito / limpio) termina en el sonido i, pero es de tipo な: きれいなへや kirei na heya = una habitación bonita / limpia.",
      "おんがくがすきです。Ongaku ga suki desu. = Me gusta la música. 好き (すき suki) funciona como adjetivo de tipo な, no como el verbo español «gustar»."
    ],
    "qs": [
      {
        "id": "adjectives-0",
        "q": "Negativo de おいしい (oishii).",
        "opts": [
          "おいしくない",
          "おいしいない",
          "おいしかった",
          "おいしいな"
        ],
        "a": 0,
        "why": "Quitamos la い final y añadimos くない: oishikunai."
      },
      {
        "id": "adjectives-1",
        "q": "Una ciudad tranquila: しずか＿まち。",
        "opts": [
          "な",
          "い",
          "を",
          "か"
        ],
        "a": 0,
        "why": "しずか es de tipo な: shizuka na machi."
      },
      {
        "id": "adjectives-2",
        "q": "Me gusta la música: おんがく＿すきです。",
        "opts": [
          "が",
          "を",
          "で",
          "に"
        ],
        "a": 0,
        "why": "En este patrón, lo que gusta se marca con が: ongaku ga suki desu."
      },
      {
        "id": "adjectives-3",
        "q": "Pasado afirmativo de おいしい (oishii).",
        "opts": [
          "おいしかった",
          "おいしいでした",
          "おいしくない",
          "おいしいな"
        ],
        "a": 0,
        "why": "La い final pasa a かった: oishikatta, estaba rico."
      },
      {
        "id": "adjectives-4",
        "q": "Una habitación bonita: きれい＿へや。",
        "opts": [
          "な",
          "い",
          "を",
          "で"
        ],
        "a": 0,
        "why": "きれい es adjetivo de tipo な, aunque termine en el sonido i."
      },
      {
        "id": "adjectives-5",
        "q": "¿Qué significa しずかです (shizuka desu)?",
        "opts": [
          "Es tranquilo/a.",
          "No está rico.",
          "Me gusta la música.",
          "Fui ayer."
        ],
        "a": 0,
        "why": "しずか significa tranquilo; です cierra la frase de forma cortés."
      },
      {
        "id": "adjectives-6",
        "q": "Elige «Está rico» en estilo cortés.",
        "opts": [
          "おいしいです。",
          "おいしいだです。",
          "おいしくありませんでした。",
          "おいしいな。"
        ],
        "a": 0,
        "why": "Los adjetivos en い pueden ir directamente antes de です: oishii desu."
      },
      {
        "id": "adjectives-7",
        "q": "¿Qué tipo de palabra es すき (suki) en おんがくがすきです?",
        "opts": [
          "adjetivo de tipo な",
          "verbo en ます",
          "partícula de lugar",
          "pronombre personal"
        ],
        "a": 0,
        "why": "好き funciona como adjetivo de tipo な. No se conjuga como el verbo español gustar."
      },
      {
        "id": "adjectives-8",
        "q": "¿Qué significa おいしくないです (oishikunai desu)?",
        "opts": [
          "No está rico.",
          "Estaba rico.",
          "Está muy rico.",
          "¿Está rico?"
        ],
        "a": 0,
        "why": "おいしくない es el negativo de おいしい; です añade cortesía."
      }
    ]
  }
];
