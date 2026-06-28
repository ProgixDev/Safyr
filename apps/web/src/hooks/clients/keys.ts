export const clientKeys = {
  all: ["clients"] as const,
  list: () => [...clientKeys.all, "list"] as const,
  detail: (id: string) => [...clientKeys.all, "detail", id] as const,
};

export const subcontractorKeys = {
  all: ["subcontractors"] as const,
  list: () => [...subcontractorKeys.all, "list"] as const,
  detail: (id: string) => [...subcontractorKeys.all, "detail", id] as const,
};
