import {stageDayEncounters,normalizeSceneTiming} from './staged-scenes.js';
// Original authored fiction. Performance beats are invented, not reel transcriptions.
export const DAY_ACTORS = [
  {
    "id": "mira",
    "name": "Mira",
    "role": "student organiser",
    "district": "jantar",
    "obligations": [
      "keep promises to families",
      "keep coalition together"
    ],
    "fears": [
      "being seen as weak",
      "someone hurt under her watch"
    ],
    "personality": "pragmatic, warm, defensive when publicly undermined",
    "values": {
      "care": 90,
      "recognition": 50,
      "duty": 80,
      "autonomy": 70,
      "loyalty": 80,
      "security": 60,
      "reputation": 70,
      "economic": 30
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "pragmatic, warm, defensive when publicly undermined",
      "obligations": [
        "keep promises to families",
        "keep coalition together"
      ],
      "fears": [
        "being seen as weak",
        "someone hurt under her watch"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.45,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "mira-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 25,
      "dependents": 0
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "ravi",
    "name": "Ravi",
    "role": "sound volunteer",
    "district": "cp",
    "obligations": [
      "return borrowed equipment",
      "help newcomers belong"
    ],
    "fears": [
      "losing the rented speaker",
      "being abandoned"
    ],
    "personality": "dry humour; reliable until exhausted",
    "values": {
      "care": 80,
      "recognition": 30,
      "duty": 80,
      "autonomy": 60,
      "loyalty": 80,
      "security": 70,
      "reputation": 50,
      "economic": 80
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "dry humour; reliable until exhausted",
      "obligations": [
        "return borrowed equipment",
        "help newcomers belong"
      ],
      "fears": [
        "losing the rented speaker",
        "being abandoned"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.9,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "ravi-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 80,
      "dependents": 0
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "kabir",
    "name": "Kabir",
    "role": "student and aspiring comic",
    "district": "connector",
    "obligations": [
      "get home before family worries",
      "stand by his friends"
    ],
    "fears": [
      "public humiliation",
      "being left behind"
    ],
    "personality": "performs confidence; notices who laughs with him versus at him",
    "values": {
      "care": 70,
      "recognition": 90,
      "duty": 30,
      "autonomy": 90,
      "loyalty": 70,
      "security": 50,
      "reputation": 80,
      "economic": 30
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "performs confidence; notices who laughs with him versus at him",
      "obligations": [
        "get home before family worries",
        "stand by his friends"
      ],
      "fears": [
        "public humiliation",
        "being left behind"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.9,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "kabir-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 25,
      "dependents": 0
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "sana",
    "name": "Sana",
    "role": "medical volunteer",
    "district": "supply",
    "obligations": [
      "treat by need",
      "protect private medical information"
    ],
    "fears": [
      "supplies running out",
      "help becoming a publicity stunt"
    ],
    "personality": "precise, patient, capable of anger",
    "values": {
      "care": 100,
      "recognition": 20,
      "duty": 100,
      "autonomy": 70,
      "loyalty": 60,
      "security": 80,
      "reputation": 40,
      "economic": 40
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "precise, patient, capable of anger",
      "obligations": [
        "treat by need",
        "protect private medical information"
      ],
      "fears": [
        "supplies running out",
        "help becoming a publicity stunt"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.45,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 95
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "sana-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 25,
      "dependents": 0
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "nikhil",
    "name": "Nikhil",
    "role": "first-time participant",
    "district": "metro",
    "obligations": [
      "find his group",
      "call his mother"
    ],
    "fears": [
      "getting separated",
      "being treated as disposable"
    ],
    "personality": "quiet, observant, unexpectedly brave",
    "values": {
      "care": 80,
      "recognition": 30,
      "duty": 50,
      "autonomy": 50,
      "loyalty": 90,
      "security": 90,
      "reputation": 40,
      "economic": 30
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "quiet, observant, unexpectedly brave",
      "obligations": [
        "find his group",
        "call his mother"
      ],
      "fears": [
        "getting separated",
        "being treated as disposable"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.45,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 35
      }
    ],
    "commitments": [
      {
        "id": "nikhil-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 25,
      "dependents": 0
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "officer",
    "name": "Officer Sharma",
    "role": "constable",
    "district": "connector",
    "obligations": [
      "keep passage clear",
      "follow lawful orders",
      "protect junior colleagues"
    ],
    "fears": [
      "discipline",
      "crowd movement he cannot understand"
    ],
    "personality": "can share a joke and still enforce restrictions; help has limits",
    "values": {
      "care": 70,
      "recognition": 40,
      "duty": 95,
      "autonomy": 30,
      "loyalty": 80,
      "security": 90,
      "reputation": 80,
      "economic": 60
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "can share a joke and still enforce restrictions; help has limits",
      "obligations": [
        "keep passage clear",
        "follow lawful orders",
        "protect junior colleagues"
      ],
      "fears": [
        "discipline",
        "crowd movement he cannot understand"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.45,
      "authorityDependence": 0.85
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "officer-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 25,
      "dependents": 2
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "asha",
    "name": "Asha",
    "role": "tea seller and neighbourhood witness",
    "district": "backstreet",
    "obligations": [
      "protect livelihood",
      "keep customers and workers safe"
    ],
    "fears": [
      "shop damage",
      "being misquoted"
    ],
    "personality": "knows the street better than any spokesperson",
    "values": {
      "care": 80,
      "recognition": 30,
      "duty": 70,
      "autonomy": 80,
      "loyalty": 70,
      "security": 90,
      "reputation": 60,
      "economic": 100
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "knows the street better than any spokesperson",
      "obligations": [
        "protect livelihood",
        "keep customers and workers safe"
      ],
      "fears": [
        "shop damage",
        "being misquoted"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.45,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "asha-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 80,
      "dependents": 2
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "journalist",
    "name": "Zoya",
    "role": "independent reporter",
    "district": "press",
    "obligations": [
      "verify accounts",
      "publish before the story is fixed"
    ],
    "fears": [
      "missing harm",
      "misidentifying an innocent person"
    ],
    "personality": "asks difficult questions; will correct herself",
    "values": {
      "care": 80,
      "recognition": 60,
      "duty": 90,
      "autonomy": 90,
      "loyalty": 40,
      "security": 70,
      "reputation": 95,
      "economic": 60
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "asks difficult questions; will correct herself",
      "obligations": [
        "verify accounts",
        "publish before the story is fixed"
      ],
      "fears": [
        "missing harm",
        "misidentifying an innocent person"
      ],
      "uncertaintyTolerance": 0.85,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.45,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "journalist-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 25,
      "dependents": 0
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "inspector",
    "name": "Inspector Rao",
    "role": "deployment supervisor",
    "district": "court",
    "obligations": [
      "maintain control",
      "account for staff",
      "respond to headquarters"
    ],
    "fears": [
      "a visible loss of control",
      "being made a scapegoat"
    ],
    "personality": "institutionally cautious; has discretion but uneven courage",
    "values": {
      "care": 50,
      "recognition": 60,
      "duty": 95,
      "autonomy": 40,
      "loyalty": 80,
      "security": 95,
      "reputation": 90,
      "economic": 50
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "institutionally cautious; has discretion but uneven courage",
      "obligations": [
        "maintain control",
        "account for staff",
        "respond to headquarters"
      ],
      "fears": [
        "a visible loss of control",
        "being made a scapegoat"
      ],
      "uncertaintyTolerance": 0.3,
      "publicPrivateGap": 0.65,
      "humourComfort": 0.45,
      "authorityDependence": 0.85
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "inspector-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 25,
      "dependents": 0
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "organizer",
    "name": "Dev",
    "role": "coalition negotiator",
    "district": "court",
    "obligations": [
      "secure a written meeting",
      "retain coalition confidence"
    ],
    "fears": [
      "being bypassed",
      "a concession framed as betrayal"
    ],
    "personality": "sincere ambition mixed with status anxiety",
    "values": {
      "care": 70,
      "recognition": 80,
      "duty": 80,
      "autonomy": 70,
      "loyalty": 80,
      "security": 60,
      "reputation": 90,
      "economic": 40
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "sincere ambition mixed with status anxiety",
      "obligations": [
        "secure a written meeting",
        "retain coalition confidence"
      ],
      "fears": [
        "being bypassed",
        "a concession framed as betrayal"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.45,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "organizer-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 25,
      "dependents": 0
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "driver",
    "name": "Iqbal",
    "role": "contract delivery driver",
    "district": "supply",
    "obligations": [
      "finish delivery",
      "get paid",
      "protect passenger"
    ],
    "fears": [
      "vehicle impoundment",
      "accusations based on appearance"
    ],
    "personality": "hurried, guarded, not an omniscient plot device",
    "values": {
      "care": 70,
      "recognition": 20,
      "duty": 70,
      "autonomy": 50,
      "loyalty": 60,
      "security": 90,
      "reputation": 50,
      "economic": 100
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "hurried, guarded, not an omniscient plot device",
      "obligations": [
        "finish delivery",
        "get paid",
        "protect passenger"
      ],
      "fears": [
        "vehicle impoundment",
        "accusations based on appearance"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.45,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "driver-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 12
      }
    ],
    "economic": {
      "incomeAtRisk": 80,
      "dependents": 2
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  },
  {
    "id": "meera",
    "name": "Meera",
    "role": "small creator",
    "district": "press",
    "obligations": [
      "make a memorable clip",
      "keep friends safe"
    ],
    "fears": [
      "irrelevance",
      "public correction"
    ],
    "personality": "funny and socially perceptive; learning the cost of selective editing",
    "values": {
      "care": 70,
      "recognition": 95,
      "duty": 40,
      "autonomy": 90,
      "loyalty": 70,
      "security": 50,
      "reputation": 90,
      "economic": 60
    },
    "boundaries": [
      "will remember broken promises",
      "does not know unwitnessed facts"
    ],
    "profile": {
      "temperament": "funny and socially perceptive; learning the cost of selective editing",
      "obligations": [
        "make a memorable clip",
        "keep friends safe"
      ],
      "fears": [
        "irrelevance",
        "public correction"
      ],
      "uncertaintyTolerance": 0.55,
      "publicPrivateGap": 0.25,
      "humourComfort": 0.9,
      "authorityDependence": 0.25
    },
    "constraints": [
      {
        "id": "needs-rest",
        "kind": "max-fatigue",
        "limit": 85
      },
      {
        "id": "personal-safety",
        "kind": "minimum-security",
        "limit": 15
      }
    ],
    "commitments": [
      {
        "id": "meera-daily-duty",
        "kind": "duty",
        "due": 1050,
        "fulfilled": false,
        "cost": 7
      }
    ],
    "economic": {
      "incomeAtRisk": 25,
      "dependents": 0
    },
    "knowledgePolicy": "Witness, report or attributable message required; no automatic global knowledge"
  }
];
export const DAY_DISTRICTS = [
  {
    "id": "cp",
    "name": "Connaught Place",
    "x": -10,
    "z": -35,
    "context": "colonnade, morning arrivals and ordinary commerce"
  },
  {
    "id": "connector",
    "name": "Parliament Street",
    "x": 0,
    "z": 10,
    "context": "movement corridor where announcements conflict"
  },
  {
    "id": "jantar",
    "name": "Jantar Mantar gathering",
    "x": 0,
    "z": -11,
    "context": "stage, public demands and competing organisers"
  },
  {
    "id": "metro",
    "name": "Metro approach",
    "x": -14,
    "z": 49,
    "context": "arrivals, departures and regrouping"
  },
  {
    "id": "supply",
    "name": "Aid courtyard",
    "x": -60,
    "z": 12,
    "context": "water, triage and a disputed delivery"
  },
  {
    "id": "press",
    "name": "Press lane",
    "x": 58,
    "z": -30,
    "context": "recordings, interpretations and public accounts"
  },
  {
    "id": "court",
    "name": "Negotiation court",
    "x": 58,
    "z": 45,
    "context": "negotiators, police liaison and institutional pressure"
  },
  {
    "id": "backstreet",
    "name": "Neighbourhood lane",
    "x": -55,
    "z": 65,
    "context": "shops, residents and overlooked witnesses"
  }
];
export const DAY_ENCOUNTERS = [
  {
    "id": "tuition_call",
    "title": "Mummy on speaker",
    "district": "cp",
    "actorId": "kabir",
    "start": 0,
    "end": 180,
    "description": "Kabir ka phone baj raha hai. His mother thinks he is at tuition. Meera raises her camera; Sharma has noticed.",
    "choices": [
      {
        "id": "teacher",
        "label": "Try being the tuition teacher yourself",
        "line": "Revision. Bas revision bol de.",
        "effects": [
          {
            "type": "relationship",
            "value": 7,
            "target": "kabir"
          },
          {
            "type": "trust",
            "value": 2
          },
          {
            "type": "flag",
            "value": true,
            "target": "tuition_friend"
          },
          {
            "type": "flag",
            "target": "performed_tuition_call",
            "value": "teacher"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "kabir",
            "line": "Haan mummy, sir hain. Sir… naam?",
            "action": "phone-offer",
            "duration": 1.2
          },
          {
            "speaker": "officer",
            "line": "Naam bhi abhi decide karoge?",
            "action": "pause",
            "duration": 1.2
          },
          {
            "speaker": "kabir",
            "line": "Revision. Bas revision bol de.",
            "action": "phone-call",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "ask",
        "label": "Ask Sharma if he will take the call",
        "line": "Haan. Ab tum pehle ghar pe baat kar lo.",
        "effects": [
          {
            "type": "relationship",
            "value": 4,
            "target": "officer"
          },
          {
            "type": "credibility",
            "value": 2
          },
          {
            "type": "flag",
            "value": true,
            "target": "officer_recognizes"
          },
          {
            "type": "flag",
            "target": "performed_tuition_call",
            "value": "ask"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "officer",
            "line": "Phone pakdao. Pehle tumhara naam batao.",
            "action": "phone-offer",
            "duration": 1.2
          },
          {
            "speaker": "kabir",
            "line": "Mera? Aapko mummy ko subject bolna hai.",
            "action": "pause",
            "duration": 1.2
          },
          {
            "speaker": "officer",
            "line": "Haan. Ab tum pehle ghar pe baat kar lo.",
            "action": "phone-return",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "private",
        "label": "Lower the camera and stay beside Kabir",
        "line": "Haan mummy. Bahar hoon. Nahi, thoda zyada bahar.",
        "effects": [
          {
            "type": "relationship",
            "value": 8,
            "target": "kabir"
          },
          {
            "type": "relationship",
            "value": 2,
            "target": "meera"
          },
          {
            "type": "flag",
            "value": true,
            "target": "privacy_respected"
          },
          {
            "type": "flag",
            "target": "performed_tuition_call",
            "value": "private"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "kabir",
            "line": "Camera neeche kar na. Usko pata chal jayega.",
            "action": "lower-phone",
            "duration": 1.2
          },
          {
            "speaker": "kabir",
            "line": "Haan mummy. Bahar hoon. Nahi, thoda zyada bahar.",
            "action": "phone-call",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "leave",
        "label": "Let Kabir answer honestly",
        "line": "Haan mummy… peeche ki awaaz? Assembly hai.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          },
          {
            "type": "flag",
            "target": "performed_tuition_call",
            "value": "leave"
          }
        ],
        "policy": "neutral",
        "responseBeats": [
          {
            "speaker": "kabir",
            "line": "Theek, main kar lunga.",
            "action": "phone-check",
            "duration": 1.2
          },
          {
            "speaker": "kabir",
            "line": "Haan mummy… peeche ki awaaz? Assembly hai.",
            "action": "phone-call",
            "duration": 1.2
          }
        ]
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "kabir_called_home"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Tuition cancelled. Attendance political.",
      "music": "playful",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -10,
      "z": -35
    },
    "staging": {
      "cast": [
        "kabir",
        "officer"
      ],
      "setup": [
        {
          "speaker": "kabir",
          "line": "Bhai, ek second. Nahi, phone mat utha—mummy hai.",
          "action": "phone-ring",
          "duration": 1.2
        },
        {
          "speaker": "kabir",
          "line": "Tu bas teacher jaisa khada reh. Maths mat bolna. Maine maths chhod di.",
          "action": "phone-check",
          "duration": 1.2
        },
        {
          "speaker": "officer",
          "line": "Yahan khade hoke tuition chal rahi hai?",
          "action": "look-at-phone",
          "duration": 1.2
        }
      ],
      "originalPerformance": true
    },
    "callbacks": []
  },
  {
    "id": "borrowed_sound",
    "title": "Borrowed bass",
    "district": "cp",
    "actorId": "ravi",
    "start": 25,
    "end": 230,
    "description": "Ravi tests a tiny borrowed speaker. One bass note makes a paper cup fall. He needs someone reliable.",
    "choices": [
      {
        "id": "promise",
        "label": "Promise to help protect the equipment",
        "line": "Ravi: Blue wire. Darker blue. Haan. Isko kheenchna mat.",
        "effects": [
          {
            "type": "promise",
            "value": "speaker_care",
            "target": "ravi"
          },
          {
            "type": "relationship",
            "value": 5,
            "target": "ravi"
          },
          {
            "type": "flag",
            "value": true,
            "target": "sound_promise"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "soundcheck",
        "label": "Help make the announcement audible",
        "line": "Ravi: Ek baar bolo. Apna naam nahi, test bolo.",
        "effects": [
          {
            "type": "solidarity",
            "value": 4
          },
          {
            "type": "credibility",
            "value": 2
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "clip",
        "label": "Make a harmless soundcheck clip",
        "line": "Ravi: Bass check tha. Cup kyun gira?",
        "effects": [
          {
            "type": "relationship",
            "value": 3,
            "target": "meera"
          },
          {
            "type": "flag",
            "value": true,
            "target": "sound_reel"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "leave",
        "label": "Leave Ravi to his soundcheck",
        "line": "Ravi: Theek. Woh stand pakad ke jaa sakta tha waise.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "fatigue",
        "value": 2,
        "target": "ravi"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Bass se pehle chai gir gayi.",
      "music": "playful",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -10,
      "z": -35
    },
    "callbacks": []
  },
  {
    "id": "water_account",
    "title": "One crate, three requests",
    "district": "supply",
    "actorId": "sana",
    "start": 45,
    "end": 280,
    "description": "Sana has one water crate and three requests: volunteers, arriving students and the stage. Nobody has a complete headcount.",
    "choices": [
      {
        "id": "need",
        "label": "Help count who needs water first",
        "line": "Saat, paanch, chaar. Theek. Sabko thoda milega.",
        "effects": [
          {
            "type": "aid",
            "value": 7
          },
          {
            "type": "solidarity",
            "value": 3
          },
          {
            "type": "relationship",
            "value": 5,
            "target": "sana"
          },
          {
            "type": "flag",
            "value": true,
            "target": "water_counted"
          },
          {
            "type": "flag",
            "target": "performed_water_account",
            "value": "need"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "sana",
            "line": "Pehle in teenon se count poochh le. Main cups nikaalti hoon.",
            "action": "count-crate",
            "duration": 1.2
          },
          {
            "speaker": "sana",
            "line": "Saat, paanch, chaar. Theek. Sabko thoda milega.",
            "action": "cup-handover",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "stage",
        "label": "Send it to the visible stage",
        "line": "Bas idhar wale ko bol dena doosra aayega. Aayega na?",
        "effects": [
          {
            "type": "credibility",
            "value": 2
          },
          {
            "type": "aid",
            "value": 2
          },
          {
            "type": "relationship",
            "value": -3,
            "target": "sana"
          },
          {
            "type": "flag",
            "target": "performed_water_account",
            "value": "stage"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "sana",
            "line": "Stage? Haan, wahan bhej dete hain.",
            "action": "lift-crate",
            "duration": 1.2
          },
          {
            "speaker": "sana",
            "line": "Bas idhar wale ko bol dena doosra aayega. Aayega na?",
            "action": "crate-handover",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "promise",
        "label": "Promise to bring another crate later",
        "line": "Number bhi. Naam se paani nahi aayega.",
        "effects": [
          {
            "type": "promise",
            "value": "water_return",
            "target": "sana"
          },
          {
            "type": "flag",
            "value": true,
            "target": "water_promise"
          },
          {
            "type": "relationship",
            "value": 2,
            "target": "sana"
          },
          {
            "type": "flag",
            "target": "performed_water_account",
            "value": "promise"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "sana",
            "line": "Doosra crate? Pakka? Main tera naam likh rahi hoon.",
            "action": "phone-note",
            "duration": 1.2
          },
          {
            "speaker": "sana",
            "line": "Number bhi. Naam se paani nahi aayega.",
            "action": "pause",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "leave",
        "label": "Do not volunteer",
        "line": "Arre, kisi ne phir do utha liye.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          },
          {
            "type": "flag",
            "target": "performed_water_account",
            "value": "leave"
          }
        ],
        "policy": "neutral",
        "responseBeats": [
          {
            "speaker": "sana",
            "line": "Theek. Cup mat le jaana bas, count kiye hain.",
            "action": "count-crate",
            "duration": 1.2
          },
          {
            "speaker": "sana",
            "line": "Arre, kisi ne phir do utha liye.",
            "action": "look-around",
            "duration": 1.2
          }
        ]
      }
    ],
    "onExpire": [
      {
        "type": "aid",
        "value": -3
      },
      {
        "type": "fatigue",
        "value": 3,
        "target": "sana"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Hydration committee, unofficial.",
      "music": "playful",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -60,
      "z": 12
    },
    "staging": {
      "cast": [
        "sana"
      ],
      "setup": [
        {
          "speaker": "sana",
          "line": "Ek crate. Teen log bol rahe hain unke paas paani khatam hai.",
          "action": "count-crate",
          "duration": 1.2
        },
        {
          "speaker": "sana",
          "line": "Cup chahiye? Haan, woh—ruk, woh khali hai.",
          "action": "offer-cup",
          "duration": 1.2
        },
        {
          "speaker": "sana",
          "line": "Tu idhar aaya hai toh do minute haath dega?",
          "action": "look-at-player",
          "duration": 1.2
        }
      ],
      "originalPerformance": true
    },
    "callbacks": []
  },
  {
    "id": "cute_boundary",
    "title": "Camera permission",
    "district": "connector",
    "actorId": "officer",
    "start": 60,
    "end": 260,
    "description": "Meera calls Sharma cute for a reaction clip. He half-smiles, then notices his colleague being filmed without consent.",
    "choices": [
      {
        "id": "permission",
        "label": "Ask everyone before recording",
        "line": "Sharma: Haan, ek minute. Duty ka sawaal hai toh pehle woh.",
        "effects": [
          {
            "type": "relationship",
            "value": 5,
            "target": "officer"
          },
          {
            "type": "relationship",
            "value": 2,
            "target": "meera"
          },
          {
            "type": "credibility",
            "value": 3
          },
          {
            "type": "flag",
            "value": true,
            "target": "consent_clip"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "self",
        "label": "Turn the joke on yourself",
        "line": "Meera: Main normal sawaal poochhne aayi thi. Yeh kya nikal gaya.",
        "effects": [
          {
            "type": "solidarity",
            "value": 3
          },
          {
            "type": "relationship",
            "value": 4,
            "target": "kabir"
          },
          {
            "type": "flag",
            "value": true,
            "target": "self_roast"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "push",
        "label": "Keep demanding a reaction",
        "line": "Sharma: Bola na. Ab phone neeche.",
        "effects": [
          {
            "type": "relationship",
            "value": -5,
            "target": "officer"
          },
          {
            "type": "tension",
            "value": 3,
            "target": "connector"
          },
          {
            "type": "flag",
            "value": true,
            "target": "camera_boundary_crossed"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Walk on without filming",
        "line": "Meera: Haan, chalo. Pehli baar hi tha.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "camera_moment_passed"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Rizz needs consent too.",
      "music": "playful",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 0,
      "z": 10
    },
    "callbacks": []
  },
  {
    "id": "resident_route",
    "title": "Asha needs a passage",
    "district": "backstreet",
    "actorId": "asha",
    "start": 110,
    "end": 360,
    "description": "Asha ka delivery wala lane mein atka hai. Banner lagane waale keh rahe hain: abhi toh seedha kiya tha.",
    "choices": [
      {
        "id": "listen",
        "label": "Banner thoda upar karo. Delivery ko VIP entry.",
        "line": "Asha: Haan, bas. VIP entry ka bill mat bhej dena.",
        "effects": [
          {
            "type": "solidarity",
            "value": 6
          },
          {
            "type": "relationship",
            "value": 7,
            "target": "asha"
          },
          {
            "type": "flag",
            "value": true,
            "target": "resident_route_open"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "dismiss",
        "label": "Delivery wale ko bolo duck karke aaye.",
        "line": "Asha: Fridge aa raha hai. Gymnast nahi.",
        "effects": [
          {
            "type": "relationship",
            "value": -7,
            "target": "asha"
          },
          {
            "type": "tension",
            "value": 3,
            "target": "backstreet"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "promise",
        "label": "Do dost laata hoon. Main banner se chhota hoon.",
        "line": "Asha: Naam bata pehle. Dost lene gaye log kal se missing hain.",
        "effects": [
          {
            "type": "promise",
            "value": "shop_route",
            "target": "asha"
          },
          {
            "type": "flag",
            "value": true,
            "target": "shop_promise"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "leave",
        "label": "Main delivery wale ko dekh ke aata hoon... udhar.",
        "line": "Asha: Woh idhar khada hai. Achha, tum bhi nikal lo.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "tension",
        "value": 3,
        "target": "backstreet"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Revolution, with delivery access.",
      "music": "playful",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -55,
      "z": 65
    },
    "callbacks": []
  },
  {
    "id": "arrival_buddy",
    "title": "Wrong gate, right friend",
    "district": "metro",
    "actorId": "nikhil",
    "start": 140,
    "end": 390,
    "description": "Nikhil has arrived at the wrong exit. His group keeps sending different locations. His battery is almost gone.",
    "choices": [
      {
        "id": "regroup",
        "label": "Agree one regrouping point together",
        "line": "Haan, group pe wahi bhej. Main ab kahin nahi jaa raha.",
        "effects": [
          {
            "type": "relationship",
            "value": 8,
            "target": "nikhil"
          },
          {
            "type": "solidarity",
            "value": 5
          },
          {
            "type": "flag",
            "value": true,
            "target": "regroup_known"
          },
          {
            "type": "flag",
            "target": "performed_arrival_buddy",
            "value": "regroup"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "nikhil",
            "line": "Ek naam fix karte hain. Yeh wala gate: peela board.",
            "action": "point",
            "duration": 1.2
          },
          {
            "speaker": "nikhil",
            "line": "Haan, group pe wahi bhej. Main ab kahin nahi jaa raha.",
            "action": "phone-call",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "charge",
        "label": "Help him call home and charge his phone",
        "line": "Thanks. Haan mummy, awaaz aa rahi hai?",
        "effects": [
          {
            "type": "relationship",
            "value": 7,
            "target": "nikhil"
          },
          {
            "type": "aid",
            "value": 3
          },
          {
            "type": "flag",
            "value": true,
            "target": "nikhil_home_called"
          },
          {
            "type": "flag",
            "target": "performed_arrival_buddy",
            "value": "charge"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "nikhil",
            "line": "Do percent hai. Location kholun ya mummy ko call?",
            "action": "phone-offer",
            "duration": 1.2
          },
          {
            "speaker": "nikhil",
            "line": "Thanks. Haan mummy, awaaz aa rahi hai?",
            "action": "phone-call",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "invite",
        "label": "Promise to check on him later",
        "line": "Main hil raha hoon. Group ko yeh bhi batana padta hai.",
        "effects": [
          {
            "type": "promise",
            "value": "check_nikhil",
            "target": "nikhil"
          },
          {
            "type": "flag",
            "value": true,
            "target": "nikhil_promise"
          },
          {
            "type": "flag",
            "target": "performed_arrival_buddy",
            "value": "invite"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "nikhil",
            "line": "Saath? Haan. Bas unko message kar doon.",
            "action": "phone-check",
            "duration": 1.2
          },
          {
            "speaker": "nikhil",
            "line": "Main hil raha hoon. Group ko yeh bhi batana padta hai.",
            "action": "join",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "leave",
        "label": "Point toward the crowd and continue",
        "line": "Jab tak koi naya main gate nahi milta.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          },
          {
            "type": "flag",
            "target": "performed_arrival_buddy",
            "value": "leave"
          }
        ],
        "policy": "neutral",
        "responseBeats": [
          {
            "speaker": "nikhil",
            "line": "Theek. Main yahin wait karta hoon.",
            "action": "phone-check",
            "duration": 1.2
          },
          {
            "speaker": "nikhil",
            "line": "Jab tak koi naya main gate nahi milta.",
            "action": "pause",
            "duration": 1.2
          }
        ]
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "nikhil_searching"
      },
      {
        "type": "fatigue",
        "value": 2,
        "target": "nikhil"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Location bhej. Sahi wali.",
      "music": "playful",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -14,
      "z": 49
    },
    "staging": {
      "cast": [
        "nikhil"
      ],
      "setup": [
        {
          "speaker": "nikhil",
          "line": "Main main gate pe hoon. Unhone bola main gate pe aao.",
          "action": "phone-check",
          "duration": 1.2
        },
        {
          "speaker": "nikhil",
          "line": "Abhi thodi der pehle mila tha. Haan toh? Akela thodi chhod doon.",
          "action": "phone-check",
          "duration": 1.2
        },
        {
          "speaker": "nikhil",
          "line": "Yeh bhi main gate hai? Achha.",
          "action": "look-around",
          "duration": 1.2
        },
        {
          "speaker": "nikhil",
          "line": "Ab message aaya: chai pe hain. Chai kahan?",
          "action": "phone-ring",
          "duration": 1.2
        }
      ],
      "originalPerformance": true
    },
    "inspirationSources": [
      {
        "url": "https://www.instagram.com/peeinghuman/reel/DeU2JR_zqYq/",
        "basis": "Root observed signed-in caption and visible comments this session; reported sense of belonging and short acquaintance informing friendship response.",
        "audioVerified": false,
        "adaptation": "Original fictional dialogue; not a quotation or recreation of a verified full event."
      }
    ],
    "callbacks": []
  },
  {
    "id": "slogan_workshop",
    "title": "One mic, four demands",
    "district": "jantar",
    "actorId": "mira",
    "start": 180,
    "end": 440,
    "description": "Mira needs a short statement. Everyone wants their demand first; Kabir offers a rhyme that is funny but excludes half the group.",
    "choices": [
      {
        "id": "listen",
        "label": "Help write a shared demand",
        "line": "Mira: Ek-ek karke. Mic ek hai, demands chaar.",
        "effects": [
          {
            "type": "solidarity",
            "value": 7
          },
          {
            "type": "relationship",
            "value": 5,
            "target": "mira"
          },
          {
            "type": "flag",
            "value": true,
            "target": "shared_demands"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "meme",
        "label": "Use the funniest line regardless",
        "line": "Kabir: Hansa toh sahi. Achha, woh kyun jaa raha hai?",
        "effects": [
          {
            "type": "credibility",
            "value": -2
          },
          {
            "type": "solidarity",
            "value": -3
          },
          {
            "type": "flag",
            "value": true,
            "target": "exclusion_joke"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "space",
        "label": "Make room for another speaker",
        "line": "Mira: Le, tu bol. Main paani peeti hoon.",
        "effects": [
          {
            "type": "solidarity",
            "value": 5
          },
          {
            "type": "relationship",
            "value": 4,
            "target": "mira"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "leave",
        "label": "Listen without joining",
        "line": "Mira tries the line again; two people start a different version.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "solidarity",
        "value": -2
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Mic check. Ego check.",
      "music": "playful",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 0,
      "z": -11
    },
    "callbacks": []
  },
  {
    "id": "press_edit",
    "title": "The part before the music",
    "district": "press",
    "actorId": "journalist",
    "start": 230,
    "end": 490,
    "description": "Meera has made a messy dash look effortless. The original audio tells a less flattering version. Zoya wants to hear the beginning.",
    "choices": [
      {
        "id": "context",
        "label": "Keep the awkward beginning in the edit",
        "line": "Pehle wala bhi. Log dekh lenge.",
        "effects": [
          {
            "type": "evidence",
            "value": 1,
            "target": "full_argument",
            "text": "Long recording shows the argument began over blocked access."
          },
          {
            "type": "relationship",
            "value": 7,
            "target": "journalist"
          },
          {
            "type": "credibility",
            "value": 6
          },
          {
            "type": "flag",
            "value": true,
            "target": "context_preserved"
          },
          {
            "type": "flag",
            "target": "performed_press_edit",
            "value": "context"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "meera",
            "line": "Dono rakh doon? Hero ke baad lost tourist?",
            "action": "phone-edit",
            "duration": 1.2
          },
          {
            "speaker": "journalist",
            "line": "Pehle wala bhi. Log dekh lenge.",
            "action": "clip-play",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "viral",
        "label": "Send the heroic short cut",
        "line": "Usme jo peeche reh gaya, usse poochha?",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "argument_blame",
            "text": "A cropped clip claims the disagreement was unprovoked."
          },
          {
            "type": "credibility",
            "value": -4
          },
          {
            "type": "tension",
            "value": 4,
            "target": "press"
          },
          {
            "type": "flag",
            "target": "performed_press_edit",
            "value": "viral"
          }
        ],
        "policy": "disruptive",
        "responseBeats": [
          {
            "speaker": "meera",
            "line": "Short wala bhej diya.",
            "action": "phone-share",
            "duration": 1.2
          },
          {
            "speaker": "journalist",
            "line": "Usme jo peeche reh gaya, usse poochha?",
            "action": "pause",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "private",
        "label": "Keep it in the friends’ group",
        "line": "Likh sakti ho. Rok nahi sakti.",
        "effects": [
          {
            "type": "relationship",
            "value": 4,
            "target": "journalist"
          },
          {
            "type": "credibility",
            "value": 3
          },
          {
            "type": "flag",
            "value": true,
            "target": "faces_protected"
          },
          {
            "type": "flag",
            "target": "performed_press_edit",
            "value": "private"
          }
        ],
        "policy": "helpful",
        "responseBeats": [
          {
            "speaker": "meera",
            "line": "Group mein? Theek. Forward mat karna likh doon?",
            "action": "phone-edit",
            "duration": 1.2
          },
          {
            "speaker": "journalist",
            "line": "Likh sakti ho. Rok nahi sakti.",
            "action": "phone-share",
            "duration": 1.2
          }
        ]
      },
      {
        "id": "leave",
        "label": "Leave the editors to decide",
        "line": "Original sambhaal ke rakhna.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          },
          {
            "type": "flag",
            "target": "performed_press_edit",
            "value": "leave"
          }
        ],
        "policy": "neutral",
        "responseBeats": [
          {
            "speaker": "meera",
            "line": "Tu decide nahi karega toh main karun?",
            "action": "phone-check",
            "duration": 1.2
          },
          {
            "speaker": "journalist",
            "line": "Original sambhaal ke rakhna.",
            "action": "phone-pocket",
            "duration": 1.2
          }
        ]
      }
    ],
    "onExpire": [
      {
        "type": "rumor",
        "value": 1,
        "target": "argument_blame",
        "text": "A short clip circulates without its opening."
      },
      {
        "type": "tension",
        "value": 2,
        "target": "press"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Ten seconds missing. Whole story changes.",
      "music": "uneasy",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 58,
      "z": -30
    },
    "staging": {
      "cast": [
        "journalist",
        "meera"
      ],
      "setup": [
        {
          "speaker": "meera",
          "line": "Yeh dekho. Music ke saath full hero lag raha hai.",
          "action": "clip-play",
          "duration": 1.2
        },
        {
          "speaker": "journalist",
          "line": "Original mein pehle kya bol raha tha?",
          "action": "phone-check",
          "duration": 1.2
        },
        {
          "speaker": "meera",
          "line": "Raw mat chala. Raw mat—haan, ab sun lo.",
          "action": "clip-stop",
          "duration": 1.2
        },
        {
          "speaker": "journalist",
          "line": "“Ruk, rasta nahi pata.” Yeh bhi tumhari recording hai.",
          "action": "pause",
          "duration": 1.2
        }
      ],
      "originalPerformance": true
    },
    "callbacks": []
  },
  {
    "id": "meeting_terms",
    "title": "The unsigned assurance",
    "district": "court",
    "actorId": "organizer",
    "start": 280,
    "end": 540,
    "description": "Dev says a meeting is promised. Rao says headquarters has not confirmed it. The crowd hears only “meeting”.",
    "choices": [
      {
        "id": "clarify",
        "label": "Ask for the exact agreed wording",
        "line": "Dev: Meeting bola tha. Time nahi diya. Main phir call karta hoon.",
        "effects": [
          {
            "type": "credibility",
            "value": 6
          },
          {
            "type": "relationship",
            "value": 2,
            "target": "organizer"
          },
          {
            "type": "flag",
            "value": true,
            "target": "terms_clear"
          },
          {
            "type": "reschedule",
            "target": "orders_change",
            "value": 35
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "announce",
        "label": "Announce that the meeting is confirmed",
        "line": "Rao: Kisne confirm kiya? Naam bolo.",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "meeting_confirmed",
            "text": "A meeting is being described as confirmed."
          },
          {
            "type": "solidarity",
            "value": 2
          },
          {
            "type": "pressure",
            "value": 5,
            "target": "command"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "witness",
        "label": "Offer to record a jointly agreed update",
        "line": "Rao: Date aur time dono likho. Sirf photo se nahi hoga.",
        "effects": [
          {
            "type": "evidence",
            "value": 1,
            "target": "meeting_terms",
            "text": "Only a request for a meeting was acknowledged."
          },
          {
            "type": "credibility",
            "value": 4
          },
          {
            "type": "relationship",
            "value": 3,
            "target": "inspector"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "leave",
        "label": "Leave the negotiation room",
        "line": "Dev checks his phone before walking back.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "rumor",
        "value": 1,
        "target": "meeting_confirmed",
        "text": "An ambiguous negotiation update raises expectations."
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "“Almost confirmed” is not confirmed.",
      "music": "uneasy",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 58,
      "z": 45
    },
    "callbacks": []
  },
  {
    "id": "delivery_receipt",
    "title": "The unlabelled delivery",
    "district": "supply",
    "actorId": "driver",
    "start": 330,
    "end": 610,
    "description": "Iqbal brings boxes for two different clients. One carton has no label. An argument starts before anyone checks the receipt.",
    "choices": [
      {
        "id": "verify",
        "label": "Ask Iqbal and Sana to check the receipt together",
        "line": "Iqbal: Receipt is pocket mein thi. Ruk, yeh diesel wali hai.",
        "effects": [
          {
            "type": "evidence",
            "value": 1,
            "target": "delivery_receipt",
            "text": "Receipt and inspection distinguish aid boxes from an unclaimed carton."
          },
          {
            "type": "aid",
            "value": 5
          },
          {
            "type": "credibility",
            "value": 5
          },
          {
            "type": "relationship",
            "value": 6,
            "target": "driver"
          },
          {
            "type": "flag",
            "value": true,
            "target": "delivery_checked"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "report",
        "label": "Report the uncertainty accurately to Sharma",
        "line": "Sharma: Entry kara deta hoon. Jo dekha woh batao, guess nahi.",
        "effects": [
          {
            "type": "evidence",
            "value": 1,
            "target": "delivery_report",
            "text": "A concern was reported without claiming proof."
          },
          {
            "type": "relationship",
            "value": 3,
            "target": "officer"
          },
          {
            "type": "pressure",
            "value": 2,
            "target": "command"
          },
          {
            "type": "flag",
            "value": true,
            "target": "delivery_reported"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "accuse",
        "label": "Publicly accuse the driver without evidence",
        "line": "Iqbal: Mera naam daal diya? Abhi carton khula bhi nahi.",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "driver_accusation",
            "text": "The driver is accused without verified evidence."
          },
          {
            "type": "relationship",
            "value": -10,
            "target": "driver"
          },
          {
            "type": "tension",
            "value": 8,
            "target": "supply"
          },
          {
            "type": "credibility",
            "value": -6
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Step back and let the delivery proceed",
        "line": "Sana asks the driver to wait while she finds the order message.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "delivery_unresolved"
      },
      {
        "type": "aid",
        "value": -2
      },
      {
        "type": "tension",
        "value": 3,
        "target": "supply"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Check the carton. Not the surname.",
      "music": "uneasy",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -60,
      "z": 12
    },
    "callbacks": []
  },
  {
    "id": "political_offer",
    "title": "The ready-made caption",
    "district": "press",
    "actorId": "meera",
    "start": 380,
    "end": 660,
    "description": "A fictional Jan Pragati Front intermediary offers Meera reach if she posts a supplied claim. He wants the caption unchanged.",
    "choices": [
      {
        "id": "disclose",
        "label": "Encourage her to disclose the offer and verify",
        "line": "Meera: Caption bhi ready? Mujhe bas apna face dena hai?",
        "effects": [
          {
            "type": "evidence",
            "value": 1,
            "target": "influence_offer",
            "text": "A political intermediary offered amplification for a prescribed claim."
          },
          {
            "type": "credibility",
            "value": 6
          },
          {
            "type": "relationship",
            "value": 5,
            "target": "meera"
          },
          {
            "type": "flag",
            "value": true,
            "target": "offer_disclosed"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "accept",
        "label": "Help publish the claim as personal testimony",
        "line": "Zoya: Yeh wording tumhari nahi lag rahi. Kahan se aayi?",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "scripted_claim",
            "text": "A supplied political claim circulates as eyewitness testimony."
          },
          {
            "type": "escalation",
            "value": 5
          },
          {
            "type": "credibility",
            "value": -7
          },
          {
            "type": "flag",
            "value": true,
            "target": "amplification_complicit"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "decline",
        "label": "Decline quietly and keep the messages",
        "line": "Meera: Nahi. Mere comments mein mujhe hi baithna padega.",
        "effects": [
          {
            "type": "evidence",
            "value": 1,
            "target": "offer_messages",
            "text": "Messages preserve an offer without establishing its wider reach."
          },
          {
            "type": "relationship",
            "value": 4,
            "target": "meera"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "leave",
        "label": "Leave Meera to make her decision",
        "line": "Meera types a reply, deletes it, and locks the phone.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "pressure",
        "value": 3,
        "target": "forum"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Paid partnership: tension.",
      "music": "uneasy",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 58,
      "z": -30
    },
    "callbacks": []
  },
  {
    "id": "water_callback",
    "title": "You said you would return",
    "district": "supply",
    "actorId": "sana",
    "start": 440,
    "end": 730,
    "description": "Sana recognises you from the morning. Supplies have thinned, and she asks whether you can help now.",
    "choices": [
      {
        "id": "deliver",
        "label": "Spend time helping distribute the remaining water",
        "line": "Sana: Aaya tu. Idhar rakh. Cup woh bag mein hain.",
        "effects": [
          {
            "type": "resolvePromise",
            "value": true,
            "target": "water_return"
          },
          {
            "type": "aid",
            "value": 8
          },
          {
            "type": "fatigue",
            "value": 4
          },
          {
            "type": "relationship",
            "value": 6,
            "target": "sana"
          },
          {
            "type": "flag",
            "value": true,
            "target": "water_followthrough"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "honest",
        "label": "Admit you cannot fulfil the earlier promise",
        "line": "Sana: Theek. Main kisi aur ko bolti hoon. Number mat kaatna.",
        "effects": [
          {
            "type": "credibility",
            "value": 2
          },
          {
            "type": "relationship",
            "value": -1,
            "target": "sana"
          },
          {
            "type": "flag",
            "target": "water_honest_inability",
            "value": true
          }
        ],
        "policy": "neutral"
      },
      {
        "id": "perform",
        "label": "Film yourself helping but leave before distribution",
        "line": "Sana: Record ho gaya? Crate abhi bhi idhar hai.",
        "effects": [
          {
            "type": "credibility",
            "value": -5
          },
          {
            "type": "relationship",
            "value": -6,
            "target": "sana"
          },
          {
            "type": "flag",
            "value": true,
            "target": "aid_performance"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Avoid the conversation",
        "line": "Sana looks past you and calls someone else over.",
        "effects": [
          {
            "type": "relationship",
            "value": -2,
            "target": "sana"
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "aid",
        "value": -3
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Promise ka delivery status?",
      "music": "reflective",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -60,
      "z": 12
    },
    "callbacks": [
      {
        "flag": "water_promise",
        "trueText": "Sana: Subah tumne kaha tha wapas aaoge. Main usi ka poochh rahi hoon.",
        "falseText": "Sana: Tumne promise nahi kiya tha. Ab help kar sakte ho toh bolo."
      },
      {
        "flag": "water_counted",
        "trueText": "The morning count lets Sana name which group still needs supplies.",
        "falseText": "Without a count, Sana must ask each group again."
      }
    ],
    "variants": [
      {
        "when": {
          "flags": {
            "performed_water_account": "promise"
          }
        },
        "description": "Sana finds your name in her notes. She had counted on another crate and asks whether you brought it."
      },
      {
        "when": {
          "flags": {
            "performed_water_account": "need"
          }
        },
        "description": "Sana shows you the count you helped make earlier. The numbers have changed; the same people are still asking for cups."
      }
    ]
  },
  {
    "id": "pressure_order",
    "title": "An order without an explanation",
    "district": "court",
    "actorId": "inspector",
    "start": 500,
    "end": 780,
    "description": "Rao receives an instruction to restrict a passage. Sharma points out that it is also the medical route. Dev wants a public answer.",
    "choices": [
      {
        "id": "medical",
        "label": "Ask for a clearly marked medical exception",
        "line": "Rao: Team ko bhi bol do. Mere bolne se sabne suna nahi.",
        "effects": [
          {
            "type": "aid",
            "value": 6
          },
          {
            "type": "pressure",
            "value": -2,
            "target": "command"
          },
          {
            "type": "relationship",
            "value": 4,
            "target": "inspector"
          },
          {
            "type": "flag",
            "value": true,
            "target": "medical_exception"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "public",
        "label": "Demand a public explanation with witnesses",
        "line": "Dev: Theek, main poochhta hoon. Tu mere upar mat bol.",
        "effects": [
          {
            "type": "credibility",
            "value": 4
          },
          {
            "type": "pressure",
            "value": 4,
            "target": "command"
          },
          {
            "type": "flag",
            "value": true,
            "target": "order_witnessed"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "rumor",
        "label": "Tell others the passage is already sealed",
        "line": "Sharma: Kisne bola band hai? Kaun message kar raha hai?",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "passage_closed",
            "text": "An anticipated restriction is reported as already in force."
          },
          {
            "type": "tension",
            "value": 6,
            "target": "connector"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Leave before the instruction is clarified",
        "line": "Rao repeats the instruction; another radio call cuts across it.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "restriction_confusion"
      },
      {
        "type": "tension",
        "value": 4,
        "target": "connector"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Same order. Different consequences.",
      "music": "tense",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 58,
      "z": 45
    },
    "callbacks": [
      {
        "flag": "officer_recognizes",
        "trueText": "Sharma recognises the tuition-call face. He listens, but says he cannot promise what Rao will decide.",
        "falseText": "Sharma asks who you are and what you personally know."
      },
      {
        "flag": "terms_clear",
        "trueText": "Dev refers to the precise terms you helped clarify.",
        "falseText": "Dev and Rao are still using different words for the earlier assurance."
      }
    ]
  },
  {
    "id": "rumor_wave",
    "title": "“Everyone is detained”",
    "district": "metro",
    "actorId": "nikhil",
    "start": 550,
    "end": 820,
    "description": "Nikhil hears that everyone near the stage has been detained. He cannot reach his friends. The message has no time or source.",
    "choices": [
      {
        "id": "verify",
        "label": "Check the time and contact a known person",
        "line": "Nikhil: Purana tha? Main abhi mummy ko bolne wala tha.",
        "effects": [
          {
            "type": "credibility",
            "value": 5
          },
          {
            "type": "tension",
            "value": -5,
            "target": "metro"
          },
          {
            "type": "relationship",
            "value": 6,
            "target": "nikhil"
          },
          {
            "type": "flag",
            "value": true,
            "target": "rumor_checked"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "forward",
        "label": "Forward the warning as confirmed",
        "line": "One phone vibrates, then another. Nikhil starts calling again.",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "mass_detention",
            "text": "An unverified mass-detention message is forwarded as fact."
          },
          {
            "type": "tension",
            "value": 7,
            "target": "metro"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "stay",
        "label": "Stay with Nikhil while he makes a call",
        "line": "Nikhil: Bas yahin ruk. Call lag raha hai.",
        "effects": [
          {
            "type": "resolvePromise",
            "value": true,
            "target": "check_nikhil"
          },
          {
            "type": "relationship",
            "value": 8,
            "target": "nikhil"
          },
          {
            "type": "solidarity",
            "value": 4
          },
          {
            "type": "flag",
            "value": true,
            "target": "nikhil_supported"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "leave",
        "label": "Keep moving",
        "line": "Nikhil tries the same number twice.",
        "effects": [
          {
            "type": "relationship",
            "value": -1,
            "target": "nikhil"
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "tension",
        "value": 3,
        "target": "metro"
      },
      {
        "type": "flag",
        "value": true,
        "target": "nikhil_worried"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Forwarded many times ≠ confirmed.",
      "music": "tense",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -14,
      "z": 49
    },
    "callbacks": [
      {
        "flag": "regroup_known",
        "trueText": "Nikhil remembers your agreed regrouping point and suggests checking it first.",
        "falseText": "Nikhil has no agreed meeting point; every new message sends him elsewhere."
      },
      {
        "flag": "nikhil_promise",
        "trueText": "Nikhil: Tumne bola tha check karoge. Achha hua aaye.",
        "falseText": "Nikhil looks relieved that someone has stopped to listen."
      }
    ]
  },
  {
    "id": "provocation",
    "title": "A stranger wants a spectacle",
    "district": "connector",
    "actorId": "kabir",
    "start": 610,
    "end": 870,
    "description": "An unfamiliar participant urges Kabir to turn an argument into a confrontation for the cameras. Their affiliation is unknown.",
    "choices": [
      {
        "id": "deescalate",
        "label": "Pull the conversation toward Kabir’s friends",
        "line": "Kabir: Nahi bhai. Mere ko isme mat daal.",
        "effects": [
          {
            "type": "escalation",
            "value": -6
          },
          {
            "type": "solidarity",
            "value": 5
          },
          {
            "type": "relationship",
            "value": 7,
            "target": "kabir"
          },
          {
            "type": "flag",
            "value": true,
            "target": "kabir_deescalated"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "witness",
        "label": "Keep an accurate record and ask a trusted organiser for help",
        "line": "Mira: Tu paas tha? Achha, pehle bata kaun kahan khada tha.",
        "effects": [
          {
            "type": "evidence",
            "value": 1,
            "target": "provocation_witness",
            "text": "A stranger urged confrontation; affiliation remains unknown."
          },
          {
            "type": "credibility",
            "value": 5
          },
          {
            "type": "flag",
            "value": true,
            "target": "provocation_recorded"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "join",
        "label": "Encourage the confrontation",
        "line": "Kabir: Ruk. Yeh humne decide nahi kiya tha.",
        "effects": [
          {
            "type": "escalation",
            "value": 12
          },
          {
            "type": "tension",
            "value": 8,
            "target": "connector"
          },
          {
            "type": "relationship",
            "value": -6,
            "target": "kabir"
          },
          {
            "type": "flag",
            "value": true,
            "target": "incitement_complicit"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Leave the scene",
        "line": "The stranger keeps talking; two friends stop listening.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "escalation",
        "value": 4
      },
      {
        "type": "tension",
        "value": 4,
        "target": "connector"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "The camera wants a climax. People do not.",
      "music": "tense",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 0,
      "z": 10
    },
    "callbacks": []
  },
  {
    "id": "broken_mic",
    "title": "The announcement cuts out",
    "district": "jantar",
    "actorId": "ravi",
    "start": 660,
    "end": 920,
    "description": "A cable fails during a crucial announcement. People at the back hear only fragments. Ravi looks for someone he can rely on.",
    "choices": [
      {
        "id": "help",
        "label": "Reconnect the loose microphone lead",
        "line": "Ravi: Loose lead udhar hai. Saath aa, connection pakadna padega.",
        "effects": [
          {
            "type": "resolvePromise",
            "value": true,
            "target": "speaker_care"
          },
          {
            "type": "solidarity",
            "value": 6
          },
          {
            "type": "credibility",
            "value": 4
          },
          {
            "type": "relationship",
            "value": 7,
            "target": "ravi"
          },
          {
            "type": "flag",
            "value": true,
            "target": "clear_announcement"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "gear",
        "label": "Steady the equipment and secure its loose connection",
        "line": "Ravi: Connection hil raha hai. Mere saath aa, steady karte hain.",
        "effects": [
          {
            "type": "resolvePromise",
            "value": true,
            "target": "speaker_care"
          },
          {
            "type": "relationship",
            "value": 8,
            "target": "ravi"
          },
          {
            "type": "aid",
            "value": 2
          },
          {
            "type": "flag",
            "value": true,
            "target": "speaker_protected"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "invent",
        "label": "Fill the silence with your own dramatic warning",
        "line": "Mira: Kisne bola? Mic abhi off tha.",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "invented_announcement",
            "text": "A dramatic warning is mistaken for an official announcement."
          },
          {
            "type": "tension",
            "value": 7,
            "target": "jantar"
          },
          {
            "type": "credibility",
            "value": -6
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Stay clear of the equipment",
        "line": "Ravi turns and calls another pair of hands.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "tension",
        "value": 3,
        "target": "jantar"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Silence also gets misquoted.",
      "music": "tense",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 0,
      "z": -11
    },
    "callbacks": [
      {
        "flag": "sound_promise",
        "trueText": "Ravi: Subah trust ki baat hui thi. Ab help chahiye.",
        "falseText": "Ravi asks whether you can spare a few minutes; he has no prior promise from you."
      }
    ]
  },
  {
    "id": "resident_callback",
    "title": "The shop shutters come down",
    "district": "backstreet",
    "actorId": "asha",
    "start": 700,
    "end": 960,
    "description": "Asha lowers her shutters as people enter the lane. A worker is still outside. She remembers who listened this morning.",
    "choices": [
      {
        "id": "help",
        "label": "Help reconnect Asha with her worker",
        "line": "Asha: Naam se bula. Woh sun lega.",
        "effects": [
          {
            "type": "resolvePromise",
            "value": true,
            "target": "shop_route"
          },
          {
            "type": "aid",
            "value": 5
          },
          {
            "type": "relationship",
            "value": 8,
            "target": "asha"
          },
          {
            "type": "flag",
            "value": true,
            "target": "worker_found"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "listen",
        "label": "Ask what she actually witnessed",
        "line": "Asha: Teen the. Main naam nahi jaanti.",
        "effects": [
          {
            "type": "evidence",
            "value": 1,
            "target": "asha_witness",
            "text": "Asha saw three people arguing; she cannot identify affiliation."
          },
          {
            "type": "credibility",
            "value": 4
          },
          {
            "type": "relationship",
            "value": 3,
            "target": "asha"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "claim",
        "label": "Turn her uncertainty into a confident accusation",
        "line": "Asha: Mere naam se mat bhej. Maine yeh nahi bola.",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "false_attribution",
            "text": "An uncertain neighbourhood observation gains an invented affiliation."
          },
          {
            "type": "relationship",
            "value": -9,
            "target": "asha"
          },
          {
            "type": "credibility",
            "value": -7
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Leave the lane",
        "line": "Asha keeps one hand on the shutter and waits.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      },
      {
        "id": "trusted_local",
        "label": "Ask Asha to introduce you to the other witnesses",
        "line": "Asha: Haan, isi ne subah jagah banayi thi. Bata do isko.",
        "policy": "helpful",
        "requires": {
          "flags": {
            "resident_route_open": true
          }
        },
        "effects": [
          {
            "type": "evidence",
            "target": "resident_accounts",
            "value": 1,
            "text": "Separate neighbourhood witnesses give attributed accounts."
          },
          {
            "type": "credibility",
            "value": 6
          }
        ]
      }
    ],
    "onExpire": [
      {
        "type": "tension",
        "value": 3,
        "target": "backstreet"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Witness, not a ready-made headline.",
      "music": "tense",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -55,
      "z": 65
    },
    "callbacks": [
      {
        "flag": "resident_route_open",
        "trueText": "Asha recognises you as the person who helped protect her access. She immediately explains what she needs.",
        "falseText": "Asha first asks you to stop blocking the remaining passage."
      },
      {
        "flag": "shop_promise",
        "trueText": "Asha: Tum wapas aaye. Ab worker ko contact karna hai.",
        "falseText": "Asha asks for one specific favour rather than assuming your help."
      }
    ]
  },
  {
    "id": "first_injury",
    "title": "Someone needs room",
    "district": "connector",
    "actorId": "sana",
    "start": 760,
    "end": 1000,
    "description": "After a sudden crowd movement, someone falls. Nobody nearby agrees on what triggered it. Sana needs space to assess them.",
    "choices": [
      {
        "id": "assist",
        "label": "Find someone who needs help and accompany them to the meeting point",
        "line": "Sana: Kisi ko saath chahiye. Pehle pooch, phir dheere saath chalna.",
        "effects": [
          {
            "type": "aid",
            "value": 10
          },
          {
            "type": "solidarity",
            "value": 5
          },
          {
            "type": "relationship",
            "value": 6,
            "target": "sana"
          },
          {
            "type": "flag",
            "value": true,
            "target": "injured_helped"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "officer",
        "label": "Ask Sharma for access, then accompany someone to the meeting point",
        "line": "Sharma: Pehle unse pooch lo. Main gap ke liye baat karta hoon.",
        "effects": [
          {
            "type": "aid",
            "value": 7
          },
          {
            "type": "relationship",
            "value": 4,
            "target": "officer"
          },
          {
            "type": "flag",
            "value": true,
            "target": "officer_medical_help"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "film",
        "label": "Film the injured person for engagement",
        "line": "Sana: Phone hata. Mujhe jagah chahiye.",
        "effects": [
          {
            "type": "credibility",
            "value": -6
          },
          {
            "type": "relationship",
            "value": -8,
            "target": "sana"
          },
          {
            "type": "flag",
            "value": true,
            "target": "injury_exposed"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Move away without obstructing help",
        "line": "Sana calls for someone beside you.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      },
      {
        "id": "invoke_exception",
        "label": "Request the agreed access and accompany someone to the meeting point",
        "line": "Sharma: Radio pe poochta hoon. Unke saath rehna; abhi pahunche nahi hain.",
        "policy": "helpful",
        "requires": {
          "flags": {
            "medical_exception": true
          }
        },
        "effects": [
          {
            "type": "aid",
            "value": 10
          },
          {
            "type": "credibility",
            "value": 3
          },
          {
            "type": "flag",
            "target": "exception_used",
            "value": true
          }
        ]
      }
    ],
    "onExpire": [
      {
        "type": "aid",
        "value": -4
      },
      {
        "type": "tension",
        "value": 4,
        "target": "connector"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "No punchline here.",
      "music": "quiet",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 0,
      "z": 10
    },
    "callbacks": [
      {
        "flag": "medical_exception",
        "trueText": "Sharma invokes the medical exception you helped establish. Sana knows whom to ask for access.",
        "falseText": "Sana must seek a medical passage while the instruction is still being clarified."
      },
      {
        "flag": "privacy_respected",
        "trueText": "Meera remembers the morning boundary and lowers her phone without prompting.",
        "falseText": "Meera hesitates with her camera; Sana explicitly asks for privacy."
      }
    ]
  },
  {
    "id": "edited_blame",
    "title": "Your face in someone else’s story",
    "district": "press",
    "actorId": "journalist",
    "start": 810,
    "end": 1060,
    "description": "A montage places your earlier joke next to the confrontation. The edit implies a connection it does not establish.",
    "choices": [
      {
        "id": "context",
        "label": "Give Zoya the original sequence and a precise account",
        "line": "Zoya: Original bhejo. Abhi. Main timestamp dekhti hoon.",
        "effects": [
          {
            "type": "evidence",
            "value": 1,
            "target": "player_context",
            "text": "Original sequence separates the morning joke from the later incident."
          },
          {
            "type": "credibility",
            "value": 7
          },
          {
            "type": "flag",
            "value": true,
            "target": "context_response"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "admit",
        "label": "Acknowledge your actual mistakes without accepting invented ones",
        "line": "Zoya: Theek. Yeh part tumhara tha. Uske baad?",
        "effects": [
          {
            "type": "credibility",
            "value": 6
          },
          {
            "type": "relationship",
            "value": 5,
            "target": "journalist"
          },
          {
            "type": "flag",
            "value": true,
            "target": "accountability"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "counter",
        "label": "Publish an equally unsupported counter-accusation",
        "line": "Zoya: Ruko, ab doosra caption bhi check karna padega.",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "counter_blame",
            "text": "An unsupported counter-accusation spreads."
          },
          {
            "type": "escalation",
            "value": 5
          },
          {
            "type": "credibility",
            "value": -7
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Do not respond now",
        "line": "Zoya keeps the recorder off and waits.",
        "effects": [
          {
            "type": "fatigue",
            "value": -2
          }
        ],
        "policy": "neutral"
      },
      {
        "id": "compare_originals",
        "label": "Compare the preserved originals with the montage",
        "line": "Zoya: Dono files hain? Achha, shuru se chalao.",
        "policy": "helpful",
        "requires": {
          "flags": {
            "context_preserved": true
          }
        },
        "effects": [
          {
            "type": "evidence",
            "target": "montage_comparison",
            "value": 1,
            "text": "Original clips establish the sequence omitted by the montage."
          },
          {
            "type": "credibility",
            "value": 8
          }
        ]
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "public_account_unanswered"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Your clip. Someone else’s caption.",
      "music": "reflective",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 58,
      "z": -30
    },
    "callbacks": [
      {
        "flag": "context_preserved",
        "trueText": "Zoya remembers your insistence on preserving the full recording earlier. She asks for the same care now.",
        "falseText": "Zoya asks to see originals rather than another edited response."
      },
      {
        "flag": "incitement_complicit",
        "trueText": "The record includes your encouragement of confrontation. Zoya asks you to address that directly.",
        "falseText": "Zoya asks what you personally witnessed rather than assigning you a role."
      }
    ],
    "variants": [
      {
        "when": {
          "flags": {
            "performed_press_edit": "viral"
          }
        },
        "description": "The heroic short cut you approved has been reposted with a different caption. Meera recognises the exact cut; Zoya asks for its missing beginning."
      },
      {
        "when": {
          "flags": {
            "performed_press_edit": "context"
          }
        },
        "description": "Zoya has both versions you kept: the confident edit and the awkward beginning. The new caption leaves out the same few seconds."
      },
      {
        "when": {
          "flags": {
            "performed_press_edit": "private"
          }
        },
        "description": "The clip you kept in the friends’ group has escaped it. Meera is checking who forwarded it; Zoya wants the original file."
      }
    ]
  },
  {
    "id": "final_negotiation",
    "title": "A concession nobody trusts",
    "district": "court",
    "actorId": "organizer",
    "start": 860,
    "end": 1090,
    "description": "A limited meeting is finally offered. Some see a gain; others see a tactic. Dev asks what he should say publicly.",
    "choices": [
      {
        "id": "specific",
        "label": "State the limited offer and its unresolved terms",
        "line": "Dev: Yeh do points maane. Teesra abhi latka hai.",
        "effects": [
          {
            "type": "credibility",
            "value": 7
          },
          {
            "type": "solidarity",
            "value": 4
          },
          {
            "type": "flag",
            "value": true,
            "target": "honest_concession"
          },
          {
            "type": "reschedule",
            "target": "final_responsibility",
            "value": 25
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "victory",
        "label": "Call it complete victory",
        "line": "Someone cheers before Dev finishes reading the second line.",
        "effects": [
          {
            "type": "solidarity",
            "value": 2
          },
          {
            "type": "credibility",
            "value": -5
          },
          {
            "type": "flag",
            "value": true,
            "target": "overclaimed_victory"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "reject",
        "label": "Reject the offer and argue for continued pressure",
        "line": "Dev: Phir aur rukna padega. Main group se poochhta hoon.",
        "effects": [
          {
            "type": "pressure",
            "value": 5,
            "target": "forum"
          },
          {
            "type": "fatigue",
            "value": 4
          },
          {
            "type": "flag",
            "value": true,
            "target": "offer_rejected"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "leave",
        "label": "Decline to speak for others",
        "line": "Dev folds the paper, then opens it again.",
        "effects": [
          {
            "type": "fatigue",
            "value": -1
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "limited_offer"
      },
      {
        "type": "pressure",
        "value": 2,
        "target": "forum"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "A partial answer is still a real decision.",
      "music": "tense",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 58,
      "z": 45
    },
    "callbacks": [
      {
        "flag": "delivery_reported",
        "trueText": "Sharma acknowledges that your earlier report distinguished uncertainty from proof.",
        "falseText": "Sharma asks the group to distinguish reports from confirmed facts."
      }
    ]
  },
  {
    "id": "last_group_call",
    "title": "Who is still missing?",
    "district": "metro",
    "actorId": "nikhil",
    "start": 910,
    "end": 1140,
    "description": "The group chat fills with “home?” messages. Two friends have not checked in. Nikhil asks for a calm roll call.",
    "choices": [
      {
        "id": "rollcall",
        "label": "Find two nearby people and walk together to the east meeting point",
        "line": "Nikhil: Do log ko saath leke east meeting point aa. List baad mein dekhenge.",
        "effects": [
          {
            "type": "aid",
            "value": 7
          },
          {
            "type": "solidarity",
            "value": 7
          },
          {
            "type": "resolvePromise",
            "value": true,
            "target": "check_nikhil"
          },
          {
            "type": "flag",
            "value": true,
            "target": "rollcall_done"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "trusted",
        "label": "Help two nearby people regroup at the east meeting point",
        "line": "Mira: Do log ko pooch, saath chalna hai? East meeting point pe milte hain.",
        "effects": [
          {
            "type": "aid",
            "value": 6
          },
          {
            "type": "relationship",
            "value": 4,
            "target": "mira"
          },
          {
            "type": "flag",
            "value": true,
            "target": "followup_coordinated"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "panic",
        "label": "Post that everyone unresponsive has been detained",
        "line": "A family calls back immediately; nobody has a clear answer.",
        "effects": [
          {
            "type": "rumor",
            "value": 1,
            "target": "missing_detained",
            "text": "Unresponsive friends are labelled detained without confirmation."
          },
          {
            "type": "tension",
            "value": 7,
            "target": "metro"
          },
          {
            "type": "credibility",
            "value": -7
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Say you need to leave and give your own status",
        "line": "Nikhil: Pahunch ke ek dot hi bhej dena.",
        "effects": [
          {
            "type": "flag",
            "value": true,
            "target": "player_checked_out"
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "rollcall_incomplete"
      },
      {
        "type": "fatigue",
        "value": 3,
        "target": "nikhil"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Seen at 7:12 is not a location.",
      "music": "quiet",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -14,
      "z": 49
    },
    "callbacks": [
      {
        "flag": "nikhil_supported",
        "trueText": "Nikhil: Pehle tum mere saath ruke the. Ab doosron ko check karte hain.",
        "falseText": "Nikhil is trying to organise the check-in despite his own uncertainty."
      }
    ],
    "variants": [
      {
        "when": {
          "flags": {
            "performed_arrival_buddy": "regroup"
          }
        },
        "description": "Nikhil already has “peela board” typed. This time he checks that everyone means the same place before pressing send."
      },
      {
        "when": {
          "flags": {
            "performed_arrival_buddy": "leave"
          }
        },
        "description": "Nikhil sees you and hesitates before asking for help again. His phone still has three different locations in the chat."
      }
    ]
  },
  {
    "id": "climax_role",
    "title": "When the square changes",
    "district": "jantar",
    "actorId": "mira",
    "start": 970,
    "end": 1170,
    "description": "Announcements overlap as the gathering breaks into smaller groups. Mira asks what you can genuinely take responsibility for now.",
    "choices": [
      {
        "id": "care",
        "label": "Offer to accompany someone to the east meeting point",
        "line": "Mira: Kisi ko company chahiye. Pooch ke saath chal; sprint mat maarna.",
        "effects": [
          {
            "type": "aid",
            "value": 9
          },
          {
            "type": "solidarity",
            "value": 6
          },
          {
            "type": "flag",
            "value": true,
            "target": "final_care"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "witness",
        "label": "Commit to a careful record of what happened",
        "line": "Zoya: Battery bachi hai? Original delete mat karna.",
        "effects": [
          {
            "type": "credibility",
            "value": 8
          },
          {
            "type": "evidence",
            "value": 1,
            "target": "final_account",
            "text": "A contemporaneous account preserves sequence and uncertainties."
          },
          {
            "type": "flag",
            "value": true,
            "target": "final_witness"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "escalate",
        "label": "Urge people into further confrontation",
        "line": "Mira: Ruk, sab tere saath nahi chal rahe.",
        "effects": [
          {
            "type": "escalation",
            "value": 15
          },
          {
            "type": "aid",
            "value": -5
          },
          {
            "type": "relationship",
            "value": -10,
            "target": "mira"
          },
          {
            "type": "flag",
            "value": true,
            "target": "final_escalation"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Leave honestly and tell your friends",
        "line": "Mira: Theek. Kiske saath jaa raha hai?",
        "effects": [
          {
            "type": "fatigue",
            "value": -8
          },
          {
            "type": "flag",
            "value": true,
            "target": "final_departure"
          }
        ],
        "policy": "neutral"
      },
      {
        "id": "regroup",
        "label": "Bring two nearby people to the east meeting point",
        "line": "Nikhil: East meeting point. Do log ko saath laa; attendance abhi pending hai.",
        "policy": "helpful",
        "requires": {
          "flags": {
            "regroup_known": true
          }
        },
        "effects": [
          {
            "type": "solidarity",
            "value": 8
          },
          {
            "type": "aid",
            "value": 6
          },
          {
            "type": "flag",
            "target": "final_regroup",
            "value": true
          }
        ]
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "final_observer"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "The afternoon remembers.",
      "music": "climax",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 0,
      "z": -11
    },
    "callbacks": []
  },
  {
    "id": "return_promises",
    "title": "Borrowed things, unfinished words",
    "district": "cp",
    "actorId": "ravi",
    "start": 1080,
    "end": 1195,
    "description": "Ravi collects equipment. The jokes are quieter now. There are cables to pack and promises to account for.",
    "choices": [
      {
        "id": "repair",
        "label": "Help pack and acknowledge anything left undone",
        "line": "Ravi: Haan, mil gaya. Stand kahan hai?",
        "effects": [
          {
            "type": "resolvePromise",
            "value": true,
            "target": "speaker_care"
          },
          {
            "type": "relationship",
            "value": 7,
            "target": "ravi"
          },
          {
            "type": "solidarity",
            "value": 4
          },
          {
            "type": "flag",
            "value": true,
            "target": "repair_attempt"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "listen",
        "label": "Listen before telling your own heroic version",
        "line": "Ravi: Baith. Chai thandi hai, par chai hai.",
        "effects": [
          {
            "type": "credibility",
            "value": 4
          },
          {
            "type": "relationship",
            "value": 4,
            "target": "ravi"
          },
          {
            "type": "flag",
            "value": true,
            "target": "listened_after"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "boast",
        "label": "Claim you held the whole day together",
        "line": "Ravi: Haan, aur chai bhi tune invent ki thi.",
        "effects": [
          {
            "type": "credibility",
            "value": -4
          },
          {
            "type": "relationship",
            "value": -3,
            "target": "ravi"
          },
          {
            "type": "flag",
            "value": true,
            "target": "hero_claim"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "leave",
        "label": "Say goodbye and go",
        "line": "Ravi: Pahunch ke message kar dena.",
        "effects": [
          {
            "type": "flag",
            "value": true,
            "target": "goodbye"
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "packing_finished"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Return the speaker. Keep the memory.",
      "music": "reflective",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": -10,
      "z": -35
    },
    "callbacks": [
      {
        "flag": "speaker_protected",
        "trueText": "The borrowed equipment is accounted for. Ravi can finally sit down.",
        "falseText": "Ravi still needs to account for borrowed equipment before he can leave."
      },
      {
        "flag": "aid_performance",
        "trueText": "Sana’s unfinished distribution remains part of how friends remember your afternoon.",
        "falseText": "Friends compare the ordinary work that rarely appeared in anyone’s clips."
      }
    ]
  },
  {
    "id": "aftermath_account",
    "title": "Three versions of one day",
    "district": "press",
    "actorId": "journalist",
    "start": 1120,
    "end": 1200,
    "description": "Zoya shows three accounts: an official statement, a popular montage and your friends’ messages. None contains the whole day.",
    "choices": [
      {
        "id": "annotate",
        "label": "Separate what you witnessed from what you heard",
        "line": "Zoya: Is timing ka proof hai? Nahi? Theek, blank chhodte hain.",
        "effects": [
          {
            "type": "credibility",
            "value": 8
          },
          {
            "type": "flag",
            "value": true,
            "target": "aftermath_precise"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "people",
        "label": "Centre the people affected and their consent",
        "line": "Zoya: Naam pehle unse confirm kar leti hoon.",
        "effects": [
          {
            "type": "solidarity",
            "value": 6
          },
          {
            "type": "credibility",
            "value": 4
          },
          {
            "type": "flag",
            "value": true,
            "target": "aftermath_people"
          }
        ],
        "policy": "helpful"
      },
      {
        "id": "myth",
        "label": "Choose the version that makes you look best",
        "line": "The edit ends on the loudest cheer; the next sentence is cut.",
        "effects": [
          {
            "type": "credibility",
            "value": -7
          },
          {
            "type": "flag",
            "value": true,
            "target": "aftermath_myth"
          }
        ],
        "policy": "disruptive"
      },
      {
        "id": "rest",
        "label": "Stop posting and check on your friends privately",
        "line": "Zoya puts the phone face down and finally drinks her tea.",
        "effects": [
          {
            "type": "fatigue",
            "value": -10
          },
          {
            "type": "solidarity",
            "value": 4
          },
          {
            "type": "flag",
            "value": true,
            "target": "aftermath_private"
          }
        ],
        "policy": "neutral"
      }
    ],
    "onExpire": [
      {
        "type": "flag",
        "value": true,
        "target": "aftermath_unwritten"
      }
    ],
    "presentation": {
      "mode": "in-engine-original",
      "shots": [
        "street-wide",
        "speaker-medium",
        "listener-reaction",
        "return-control"
      ],
      "caption": "Same street. Different stories.",
      "music": "reflective",
      "voiceStyle": "original Hinglish performance",
      "duration": 7
    },
    "provenance": "Original fictional scene; not a verified depiction of a named real person or incident.",
    "location": {
      "x": 58,
      "z": -30
    },
    "callbacks": [
      {
        "flag": "accountability",
        "trueText": "Zoya includes your earlier acknowledgement of mistakes alongside the corrected timeline.",
        "falseText": "Zoya asks which parts of your own account you are willing to correct."
      },
      {
        "flag": "final_care",
        "trueText": "Your friends’ messages remember specific assistance, not just the dramatic moments.",
        "falseText": "The group messages contain the people and details the public montages omitted."
      },
      {
        "flag": "final_escalation",
        "trueText": "Some friends ask you to account for encouraging further confrontation.",
        "falseText": "People disagree over the day even where they agree about what they saw."
      }
    ]
  }
];
stageDayEncounters(DAY_ENCOUNTERS);
normalizeSceneTiming(DAY_ENCOUNTERS);
export default DAY_ENCOUNTERS;
