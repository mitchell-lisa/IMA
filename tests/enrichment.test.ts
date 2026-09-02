import { describe, expect, it } from "vitest";
import { parseCbp } from "@/lib/server/enrichment/providers/census";
import { parseFmcsa } from "@/lib/server/enrichment/providers/fmcsa";
import { echoFacilityToSignal, echoNameQuery, parseEchoFacilities } from "@/lib/server/enrichment/providers/echo";
import { NRI_FIELDS, nriToSignals, parseNri } from "@/lib/server/enrichment/providers/nri";
import { assertPublicDestination, htmlToText, isPrivateIp, safePublicUrl } from "@/lib/server/enrichment/providers/website";
import { PUBLIC_RECORD_NOTE } from "@/lib/diagnostic";

describe("Census CBP parser", () => {
  it("reads header-indexed rows", () => {
    const rows = [
      ["ESTAB", "EMP", "NAICS2017_LABEL", "NAICS2017", "zip code"],
      ["12", "540", "Warehousing and storage", "493", "08034"],
    ];
    const out = parseCbp(rows);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ naics: "493", establishments: 12, employment: 540 });
    expect(parseCbp([])).toEqual([]);
  });
});

describe("FMCSA parser", () => {
  it("prefers same-ZIP carriers and caps at three", () => {
    const json = {
      content: [
        { carrier: { legalName: "A", phyZipcode: "19103", dotNumber: 1 } },
        { carrier: { legalName: "B", phyZipcode: "08034", dotNumber: 2 } },
        { carrier: { legalName: "C", phyZipcode: "08034", dotNumber: 3 } },
        { carrier: { legalName: "D", phyZipcode: "08034", dotNumber: 4 } },
        { carrier: { legalName: "E", phyZipcode: "08034", dotNumber: 5 } },
      ],
    };
    expect(parseFmcsa(json, "08034").map((c) => c.legalName)).toEqual(["B", "C", "D"]);
    expect(parseFmcsa(json, "99999").map((c) => c.legalName)).toEqual(["A", "B", "C"]);
    expect(parseFmcsa({}, "08034")).toEqual([]);
  });
});

describe("EPA ECHO", () => {
  it("builds a tolerant name query", () => {
    expect(echoNameQuery("Delaware Valley Cold Chain, LLC")).toBe("delaware valley");
    expect(echoNameQuery("The Acme Co.")).toBe("acme");
  });
  it("turns a facility row into a caveated signal with a registry link", () => {
    const rows = { Results: { Facilities: [{ FacName: "X PLANT", FacStreet: "1 Main", FacCity: "Cherry Hill", FacState: "NJ", RegistryID: "110000", FacInspectionCount: "2", FacDateLastInspection: "01/02/2024", FacPenaltyCount: "0" }] } };
    const [f] = parseEchoFacilities(rows);
    const sig = echoFacilityToSignal(f);
    expect(sig.source).toBe("epa_echo");
    expect(sig.caveat).toBe(PUBLIC_RECORD_NOTE);
    expect(sig.sourceUrl).toContain("fid=110000");
    expect(sig.value).toMatch(/2 inspection/);
    expect(sig.value).not.toMatch(/penalty/);
  });
});

describe("FEMA NRI", () => {
  it("requests only real fields and summarizes notable hazards", () => {
    expect(NRI_FIELDS).not.toContain("RFLD_RISKR");
    const json = {
      features: [
        {
          attributes: {
            STATEABBRV: "NJ", COUNTY: "Camden", STCOFIPS: "34007", RISK_SCORE: 71.2, RISK_RATNG: "Relatively Moderate", EAL_RATNG: "Relatively Moderate", SOVI_RATNG: "Relatively Low", RESL_RATNG: "Very High",
            CFLD_RISKR: "Relatively High", IFLD_RISKR: "Relatively Low", HRCN_RISKR: "Relatively Moderate", WNTW_RISKR: "Relatively Low", ISTM_RISKR: "Relatively Low", TRND_RISKR: "Very Low", SWND_RISKR: "Relatively Low", HAIL_RISKR: "Very Low", LTNG_RISKR: "Relatively Low", ERQK_RISKR: "Very Low",
          },
        },
      ],
    };
    const s = parseNri(json)!;
    expect(s.county).toBe("Camden");
    expect(s.notableHazards.map((h) => h.hazard)).toEqual(["Coastal flooding", "Hurricane"]);
    const [sig] = nriToSignals(s);
    expect(sig.source).toBe("fema_nri");
    expect(sig.value).toMatch(/Coastal flooding: relatively high/);
    expect(sig.caveat).toMatch(/not this company's insurability/);
    expect(sig.sourceUrl).toContain("34007");
    expect(parseNri({})).toBeNull();
  });
});

describe("website provider helpers", () => {
  it("refuses private or malformed hosts", () => {
    expect(safePublicUrl("example.com")).toBe("https://example.com/");
    expect(safePublicUrl("localhost")).toBeNull();
    expect(safePublicUrl("10.0.0.5")).toBeNull();
    expect(safePublicUrl("192.168.1.1")).toBeNull();
    expect(safePublicUrl("not a host")).toBeNull();
    expect(safePublicUrl(null)).toBeNull();
  });
  it("classifies private and public addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.0.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "224.0.0.1", "::1", "fe80::1", "fd00::1", "::ffff:10.0.0.1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    for (const ip of ["8.8.8.8", "172.32.0.1", "104.18.0.1", "2606:4700::1111"]) expect(isPrivateIp(ip), ip).toBe(false);
    expect(isPrivateIp("not-an-ip")).toBe(true);
  });
  it("rejects redirect destinations that are not public", async () => {
    expect(await assertPublicDestination(new URL("http://169.254.169.254/latest/meta-data"))).toBe(false);
    expect(await assertPublicDestination(new URL("http://localhost:3000/"))).toBe(false);
    expect(await assertPublicDestination(new URL("ftp://example.com/"))).toBe(false);
    expect(await assertPublicDestination(new URL("http://[::1]/"))).toBe(false);
  });
  it("strips scripts, styles, and tags", () => {
    const t = htmlToText("<html><head><style>a{}</style><script>x()</script></head><body><h1>Acme</h1><p>We ship &amp; store.</p></body></html>");
    expect(t).toBe("Acme We ship & store.");
  });
});
