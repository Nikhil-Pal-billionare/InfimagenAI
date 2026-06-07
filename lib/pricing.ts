export type PlanId = "starter" | "pro" | "elite";

export const PRICING = {
  INR: {
    currency: "INR", symbol: "₹",
    plans: {
      starter: { original: 199,  discounted: 149  },
      pro:     { original: 699,  discounted: 499  },
      elite:   { original: 1299, discounted: 999  },
    },
  },
  USD: {
    currency: "USD", symbol: "$",
    plans: {
      starter: { original: 3,  discounted: 2  },
      pro:     { original: 7,  discounted: 6  },
      elite:   { original: 13, discounted: 11 },
    },
  },
};
