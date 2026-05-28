export function getBrandSlug(input?: string | null): string | null {
  if (!input) return null;

  const value = input.trim().toLowerCase();

  const map: Record<string, string> = {
    aldi: "aldi",
    alimerka: "alimerka",
    dia: "dia",
    lidl: "lidl",
    mercadona: "mercadona",
    carrefour: "carrefour",
    eroski: "eroski",
    family: "family",
    familia: "autoservicios-familia",
    masymas: "masymas",
    alcampo: "alcampo",
    hiperdino: "hiperdino",
    ahorramas: "ahorramas",
    gadis: "gadis",
    hipercor: "hipercor",
    froiz: "froiz",
    coviran: "coviran",
    spar: "spar",
    familycash: "family-cash",
    spargrancanaria: "spar-gran-canaria",
    supeco: "supeco",
    action: "action",
  };

  return map[value] ?? value;
}
