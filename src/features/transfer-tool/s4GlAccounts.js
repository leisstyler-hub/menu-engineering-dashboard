export const S4_GL_ACCOUNTS = Object.freeze([
  { code: "4111003", category: "Meat/Poultry" },
  { code: "4111004", category: "Seafood" },
  { code: "4111005", category: "Grocery/Storeroom" },
  { code: "4111006", category: "Dairy" },
  { code: "4111009", category: "Frozen" },
  { code: "4111010", category: "Bakery" },
  { code: "4111011", category: "Prepared Foods" },
  { code: "4111012", category: "Fresh Produce/Salad" },
  { code: "4112002", category: "Non Alcoholic Beverages" },
]);

export const S4_GL_ACCOUNT_CODES = new Set(S4_GL_ACCOUNTS.map(({ code }) => code));
