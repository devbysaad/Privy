/**
 * Company roster for CEO work assignments.
 * Emails use COMPANY_EMAIL_DOMAIN (default acme.com).
 */
export type RosterPerson = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function companyRoster(): RosterPerson[] {
  const domain =
    process.env.COMPANY_EMAIL_DOMAIN?.trim().replace(/^@/, "") || "acme.com";
  const people: Array<{ id: string; name: string; local: string; role: string }> =
    [
      { id: "id-alice", name: "Alice Chen", local: "alice", role: "Engineer" },
      { id: "id-bob", name: "Bob Rivera", local: "bob", role: "Engineer" },
      {
        id: "id-helen",
        name: "Helen Admin",
        local: "helen",
        role: "Admin",
      },
      {
        id: "id-carol",
        name: "Carol Nguyen",
        local: "carol",
        role: "Product",
      },
      {
        id: "id-dave",
        name: "Dave Okonkwo",
        local: "dave",
        role: "Security",
      },
      {
        id: "id-eve",
        name: "Eve Martinez",
        local: "eve",
        role: "Engineer",
      },
    ];
  return people.map((p) => ({
    id: p.id,
    name: p.name,
    email: `${p.local}@${domain}`,
    role: p.role,
  }));
}
