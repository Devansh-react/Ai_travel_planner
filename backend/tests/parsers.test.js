"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parsers_1 = require("../src/utils/parsers");
describe("parsers", () => {
    test("parsePhone normalizes and validates numbers", () => {
        expect((0, parsers_1.parsePhone)("+91 99999 99999")).toBe("+919999999999");
        expect((0, parsers_1.parsePhone)("12345")).toBeNull();
    });
    test("parseBudget prefixes INR when needed", () => {
        expect((0, parsers_1.parseBudget)("2 lakh")).toBe("Rs 2 lakh");
        expect((0, parsers_1.parseBudget)("Rs 2 lakh")).toBe("Rs 2 lakh");
    });
    test("parseTravellerCount extracts common phrases", () => {
        expect((0, parsers_1.parseTravellerCount)("two adults")).toBe(2);
        expect((0, parsers_1.parseTravellerCount)("a couple")).toBe(2);
        expect((0, parsers_1.parseTravellerCount)("family of 4")).toBe(4);
    });
    test("isVagueText spots vague phrases", () => {
        expect((0, parsers_1.isVagueText)("sometime next year")).toBe(true);
        expect((0, parsers_1.isVagueText)("December")).toBe(false);
    });
});
