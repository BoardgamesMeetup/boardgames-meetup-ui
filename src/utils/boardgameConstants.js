export const MECHANIC_CATEGORIES = {
    "Card & Hand Management": [
      "Card Drafting",
      "Card Play Conflict Resolution",
      "Deck Bag and Pool Building",
      "Deck Construction",
      "Hand Management",
      "Ladder Climbing",
      "Melding and Splaying",
      "Trick-taking"
    ],
    "Worker & Action Selection": [
      "Worker Placement",
      "Worker Placement with Dice Workers",
      "Action Drafting",
      "Action Points",
      "Action Queue",
      "Action Retrieval",
      "Action Timer",
      "Action/Event",
      "Different Worker Types",
      "Rondel",
      "Simultaneous Action Selection"
    ],
    "Dice & Randomness": [
      "Dice Rolling",
      "Die Icon Resolution",
      "Different Dice Movement",
      "Push Your Luck",
      "Re-rolling and Locking",
      "Roll / Spin and Move",
      "Random Production",
      "Cube Tower"
    ],
    "Economic & Trading": [
      "Auction/Bidding",
      "Auction: Dexterity",
      "Auction: Dutch",
      "Auction: Dutch Priority",
      "Auction: English",
      "Auction: Fixed Placement",
      "Auction: Once Around",
      "Auction: Sealed Bid",
      "Auction: Turn Order Until Pass",
      "Commodity Speculation",
      "Contracts",
      "Investment",
      "Loans",
      "Market",
      "Negotiation",
      "Stock Holding",
      "Trading",
      "Bribery",
      "Closed Economy Auction",
      "Multiple-Lot Auction"
    ],
    "Board & Movement": [
      "Area Majority / Influence",
      "Area Movement",
      "Area-Impulse",
      "Grid Movement",
      "Hexagon Grid",
      "Point to Point Movement",
      "Movement Points",
      "Movement Template",
      "Pattern Movement",
      "Track Movement",
      "Three Dimensional Movement",
      "Square Grid",
      "Measurement Movement",
      "Relative Movement",
      "Impulse Movement",
      "Line of Sight",
      "Zone of Control"
    ],
    "Tile & Pattern Building": [
      "Tile Placement",
      "Pattern Building",
      "Pattern Recognition",
      "Modular Board",
      "Map Addition",
      "Map Deformation",
      "Map Reduction",
      "Network and Route Building",
      "Connections",
      "Enclosure",
      "Grid Coverage",
      "Layering"
    ],
    "Resource Management": [
      "Resource to Move",
      "Automatic Resource Growth",
      "Income",
      "Increase Value of Unchosen Resources",
      "Victory Points as a Resource",
      "Ownership",
      "Set Collection",
      "Pick-up and Deliver"
    ],
    "Conflict & Combat": [
      "Take That",
      "Player Elimination",
      "Critical Hits and Failures",
      "Kill Steal",
      "Ratio / Combat Results Table",
      "Stat Check Resolution",
      "Static Capture",
      "Targeted Clues",
      "King of the Hill",
      "Tug of War",
      "Force Commitment"
    ],
    "Social & Party": [
      "Acting",
      "Betting and Bluffing",
      "Communication Limits",
      "Hidden Roles",
      "Negotiation",
      "Player Judge",
      "Prisoner's Dilemma",
      "Role Playing",
      "Roles with Asymmetric Information",
      "Semi-Cooperative Game",
      "Team-Based Game",
      "Traitor Game",
      "Voting",
      "Storytelling",
      "Singing"
    ],
    "Cooperative & Solo": [
      "Cooperative Game",
      "Solo / Solitaire Game",
      "Semi-Cooperative Game",
      "Campaign / Battle Card Driven",
      "Legacy Game",
      "Scenario / Mission / Campaign Game"
    ],
    "Time & Turn Order": [
      "Time Track",
      "Turn Order: Auction",
      "Turn Order: Claim Action",
      "Turn Order: Pass Order",
      "Turn Order: Progressive",
      "Turn Order: Random",
      "Turn Order: Role Order",
      "Turn Order: Stat-Based",
      "Elapsed Real Time Ending",
      "Real-Time",
      "Passed Action Token",
      "Variable Phase Order"
    ],
    "Special Mechanics": [
      "Hidden Movement",
      "Hidden Victory Points",
      "Once-Per-Game Abilities",
      "Variable Player Powers",
      "Variable Set-up",
      "End Game Bonuses",
      "Finale Ending",
      "Sudden Death Ending",
      "Score-and-Reset Game",
      "Events",
      "Interrupts",
      "Chaining",
      "Follow"
    ]
  };
  
  export const DOMAIN_OPTIONS = [
    "Abstract Games",
    "Children's Games",
    "Customizable Games",
    "Family Games",
    "Party Games",
    "Strategy Games",
    "Thematic Games",
    "Wargames"
  ];
  
  export const getAllMechanics = () => {
    return Object.values(MECHANIC_CATEGORIES).flat();
  };
  
  export const findCategoryForMechanic = (mechanic) => {
    for (const [category, mechanics] of Object.entries(MECHANIC_CATEGORIES)) {
      if (mechanics.includes(mechanic)) {
        return category;
      }
    }
    return null;
  };