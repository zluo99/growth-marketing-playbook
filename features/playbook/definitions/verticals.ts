/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type VerticalDefinitionShape = {
  id: string;
  alias: string;
  description: string;
}

/* -------------------------------------------------------------------------- */
/* Definition: Verticals                                                      */
/* -------------------------------------------------------------------------- */

const VerticalDefinitions = [
  {
    id: "restaurants",
    alias: "Restaurants",
    description: "Food service businesses such as full service, quick service, cafes, and bars.",
  },
  {
    id: "retail",
    alias: "Retail",
    description: "Businesses that sell goods directly to consumers, including specialty and general merchandise.",
  },
  {
    id: "services",
    alias: "Services",
    description: "Local service businesses such as personal services, repair, and professional services.",
  },
  {
    id: "healthcare",
    alias: "Healthcare",
    description: "Outpatient care providers including dental, medical, optometry, and clinics.",
  },
  {
    id: "home_services",
    alias: "Home Services",
    description: "In home and property services such as HVAC, plumbing, electrical, landscaping, and cleaning.",
  },
] as const satisfies readonly VerticalDefinitionShape[]

type VerticalDefinition = (typeof VerticalDefinitions)[number]

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

type Vertical = VerticalDefinition
type VerticalAlias = Vertical["alias"]

export const VerticalAliases = Object.freeze(
  VerticalDefinitions.map((vertical) => vertical.alias) as unknown as readonly VerticalAlias[]
)
