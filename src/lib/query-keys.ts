// Claves centralizadas de TanStack Query. Evita strings sueltos y permite
// invalidar por dominio (por ejemplo, queryKeys.admin.invites).
export const queryKeys = {
  session: ["session"] as const,
  setupStatus: ["setup", "status"] as const,
  uploads: {
    latest: ["uploads", "latest"] as const,
  },
  sellers: {
    list: ["sellers"] as const,
    catalog: ["sellers", "catalog"] as const,
    portal: (keyUrl: string) => ["sellers", "portal", keyUrl] as const,
  },
  clients: {
    list: ["clients"] as const,
  },
  invites: {
    detail: (token: string) => ["invite", token] as const,
  },
  admin: {
    users: ["admin", "users"] as const,
    invites: ["admin", "invites"] as const,
  },
};
