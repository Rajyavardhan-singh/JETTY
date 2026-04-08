// Shared rank data — imported by both profile and ship form
export type Department = "Deck" | "Engine" | "Electrical";

export const RANK_OPTIONS: Record<Department, string[]> = {
  Deck: [
    "Master", "Ch. Officer", "1st Officer", "2nd Officer", "2nd Off. Safety",
    "3rd Officer", "Junior Officer", "Deck Cadet", "Bosun", "Able Seaman",
    "Ordinary Seaman", "Tr. OS", "Chief Cook", "Tr. Cook", "Steward",
    "Deck Welder", "Deck Fitter",
  ],
  Engine: [
    "Ch. Engineer", "1st Engineer", "2nd Engineer", "3rd Engineer",
    "4th Engineer", "5th Engineer", "Junior Eng.", "Eng. Cadet",
    "Motor Man", "Oilman", "Wiper", "Tr. Wiper", "Fitter", "Welder",
  ],
  Electrical: ["Sr. ETO", "ETO", "Ass. ETO", "EO", "Junior ETO", "Tr. ETO"],
};

export function getPrefixFromRank(rank: string | null): string {
  if (!rank) return "";
  if (rank === "Master") return "Capt.";
  if (
    ["Ch. Officer", "1st Officer", "2nd Officer", "2nd Off. Safety",
      "3rd Officer", "Junior Officer", "Deck Cadet"].includes(rank)
  ) return "Off.";
  if (
    ["Ch. Engineer", "1st Engineer", "2nd Engineer", "3rd Engineer",
      "4th Engineer", "5th Engineer", "Junior Eng.", "Eng. Cadet",
      "Sr. ETO", "ETO", "Ass. ETO", "EO", "Junior ETO", "Tr. ETO"].includes(rank)
  ) return "Er.";
  return "";
}

export function getDepartmentFromRank(rank: string | null): Department | "" {
  if (!rank) return "";
  for (const [dept, ranks] of Object.entries(RANK_OPTIONS) as [Department, string[]][]) {
    if (ranks.includes(rank)) return dept;
  }
  return "";
}
