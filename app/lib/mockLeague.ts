export const seasons = [
  {
    id: "season-kiawah-2026",
    name: "Kiawah Island Golf Trip 2026",
    startDate: "2026-05-11",
    endDate: "2026-05-13",
  },
];

export const players = [
  {
    id: "player-01",
    name: "Nick",
    email: "nick@example.com",
    handicapIndex: 10.8,
  },
  {
    id: "player-02",
    name: "Nathan",
    email: "nathan@example.com",
    handicapIndex: 13.7,
  },
  {
    id: "player-03",
    name: "Neil",
    email: "neil@example.com",
    handicapIndex: 8.9,
  },
  {
    id: "player-04",
    name: "Dave",
    email: "dave@example.com",
    handicapIndex: 15.4,
  },
];

export const rounds = [
  {
    id: "round-01",
    seasonId: "season-kiawah-2026",
    week: 1,
    date: "2026-05-11",
    course: "Turtle Point",
    teeTime: "3:00 PM",
    players: 4,
    confirmationNumber: "CN853709J5T8ZW",
  },
  {
    id: "round-02",
    seasonId: "season-kiawah-2026",
    week: 2,
    date: "2026-05-12",
    course: "The Ocean Course",
    teeTime: "2:10 PM",
    players: 4,
    confirmationNumber: "CN47TYW37D1YQK",
  },
  {
    id: "round-03",
    seasonId: "season-kiawah-2026",
    week: 3,
    date: "2026-05-13",
    course: "Cougar Point",
    teeTime: "12:20 PM",
    players: 4,
    confirmationNumber: "CN2B0G2FTX95Q7",
  },
];

export const scores = [
  { id: "score-01", roundId: "round-01", playerId: "player-01", gross: 85, net: 74 },
  { id: "score-02", roundId: "round-01", playerId: "player-02", gross: 91, net: 77 },
  { id: "score-03", roundId: "round-01", playerId: "player-03", gross: 82, net: 73 },
  { id: "score-04", roundId: "round-01", playerId: "player-04", gross: 97, net: 81 },
  { id: "score-05", roundId: "round-02", playerId: "player-01", gross: 83, net: 72 },
  { id: "score-06", roundId: "round-02", playerId: "player-02", gross: 89, net: 75 },
  { id: "score-07", roundId: "round-02", playerId: "player-03", gross: 80, net: 71 },
  { id: "score-08", roundId: "round-02", playerId: "player-04", gross: 95, net: 79 },
  { id: "score-09", roundId: "round-03", playerId: "player-01", gross: 87, net: 76 },
  { id: "score-10", roundId: "round-03", playerId: "player-02", gross: 90, net: 76 },
  { id: "score-11", roundId: "round-03", playerId: "player-03", gross: 81, net: 72 },
  { id: "score-12", roundId: "round-03", playerId: "player-04", gross: 99, net: 83 },
];
