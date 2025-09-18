import Handlebars from "handlebars";

export function registerPdfHelpers() {
  Handlebars.registerHelper("formatDate", (d: string, locale = "fr-CH") =>
    d ? new Date(d).toLocaleDateString(locale) : ""
  );
  
  Handlebars.registerHelper("money", (v: any, pricing: any) => 
    new Intl.NumberFormat("fr-CH", { 
      style: "currency", 
      currency: pricing?.currency || "CHF", 
      minimumFractionDigits: pricing?.precision ?? 2 
    }).format(Number(v || 0))
  );
  
  Handlebars.registerHelper("fixed", (n: any, d = 2) => Number(n ?? 0).toFixed(d));
  
  Handlebars.registerHelper("sum3", (a: any, b: any, c: any) => 
    Number(a || 0) + Number(b || 0) + Number(c || 0)
  );
  
  Handlebars.registerHelper("and", (a: any, b: any) => !!a && !!b);
  
  Handlebars.registerHelper("hasAny", (obj: any) => 
    !!obj && Object.values(obj).some(v => 
      Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== ""
    )
  );
  
  Handlebars.registerHelper("eq", (a: any, b: any) => a === b);
  
  Handlebars.registerHelper("includes", (arr: any[], item: any) => 
    Array.isArray(arr) && arr.includes(item)
  );
}