import { isVagueText, parseBudget, parsePhone, parseTravellerCount } from "../src/utils/parsers";

describe("parsers", () => {
  test("parsePhone normalizes and validates numbers", () => {
    expect(parsePhone("+91 99999 99999")).toBe("+919999999999");
    expect(parsePhone("12345")).toBeNull();
  });

  test("parseBudget prefixes INR when needed", () => {
    expect(parseBudget("2 lakh")).toBe("Rs 2 lakh");
    expect(parseBudget("Rs 2 lakh")).toBe("Rs 2 lakh");
  });

  test("parseTravellerCount extracts common phrases", () => {
    expect(parseTravellerCount("two adults")).toBe(2);
    expect(parseTravellerCount("a couple")).toBe(2);
    expect(parseTravellerCount("family of 4")).toBe(4);
  });

  test("isVagueText spots vague phrases", () => {
    expect(isVagueText("sometime next year")).toBe(true);
    expect(isVagueText("December")).toBe(false);
  });
});
