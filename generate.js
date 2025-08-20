import fs from "fs"

const potions = {
  night_vision: { color: 12779366, variants: ["base", "long"] },
  invisibility: { color: 16185078, variants: ["base", "long"] },
  leaping: { color: 16646020, variants: ["base", "long", "strong"] },
  fire_resistance: { color: 16750848, variants: ["base", "long"] },
  swiftness: { color: 3402751, variants: ["base", "long", "strong"] },
  slowness: { color: 9154528, variants: ["base", "long", "strong"] },
  turtle_master: { color: 9337576, variants: ["base", "long", "strong"] },
  water_breathing: { color: 10017472, variants: ["base", "long"] },
  healing: { color: 16262179, variants: ["base", "strong"] },
  harming: { color: 11101546, variants: ["base", "strong"] },
  poison: { color: 8889187, variants: ["base", "long", "strong"] },
  regeneration: { color: 13458603, variants: ["base", "long", "strong"] },
  strength: { color: 16762624, variants: ["base", "long", "strong"] },
  weakness: { color: 4738376, variants: ["base", "long"] },
  luck: { color: 5882118, variants: ["base"] },
  slow_falling: { color: 15978425, variants: ["base", "long"] },
  wind_charged: { color: 12438015, variants: ["base"] },
  weaving: { color: 7891290, variants: ["base"] },
  oozing: { color: 10092451, variants: ["base"] },
  infested: { color: 9214860, variants: ["base"] },
  water: { color: 3694022, variants: ["base"] },
  mundane: { color: 3694022, variants: ["base"] },
  thick: { color: 3694022, variants: ["base"] },
  awkward: { color: 3694022, variants: ["base"] }
}

function potionVariants(name, color, variants, isGui) {
  const models = []
  const baseModel = `item/better_bows/crossbow_tipped_arrow${isGui ? "_2d" : ""}`
  const baseTints = isGui
    ? [{ type: "constant", value: -1 }, { type: "constant", value: color }]
    : [{ type: "constant", value: color }]

  for (const variant of variants) {
    let potionId = `${name}`
    if (variant === "long") potionId = `long_${name}`
    if (variant === "strong") potionId = `strong_${name}`

    models.push({
      when: [
        [{ components: { intangible_projectile: {}, potion_contents: { potion: potionId } }, id: "tipped_arrow" }],
        [
          { components: { intangible_projectile: {}, potion_contents: { potion: potionId } }, id: "tipped_arrow" },
          { components: { intangible_projectile: {}, potion_contents: { potion: potionId } }, id: "tipped_arrow" },
          { components: { intangible_projectile: {}, potion_contents: { potion: potionId } }, id: "tipped_arrow" }
        ]
      ],
      model: {
        type: "select",
        property: "component",
        component: "enchantments",
        cases: [
          {
            when: { multishot: 1 },
            model: isGui
              ? {
                  type: "model",
                  model: "item/better_bows/crossbow_tipped_arrow_2d_multishot",
                  tints: baseTints
                }
              : {
                  type: "composite",
                  models: [
                    { type: "model", model: baseModel, tints: baseTints },
                    { type: "model", model: `${baseModel}_1`, tints: baseTints },
                    { type: "model", model: `${baseModel}_2`, tints: baseTints }
                  ]
                }
          }
        ],
        fallback: { type: "model", model: baseModel, tints: baseTints }
      }
    })
  }

  return models
}

function makeChargedProjectiles(isGui) {
  return {
    type: "select",
    property: "component",
    component: "charged_projectiles",
    cases: [
      {
        when: [
          [{ components: { intangible_projectile: {} }, id: "spectral_arrow" }],
          [
            { components: { intangible_projectile: {} }, id: "spectral_arrow" },
            { components: { intangible_projectile: {} }, id: "spectral_arrow" },
            { components: { intangible_projectile: {} }, id: "spectral_arrow" }
          ]
        ],
        model: makeMultishotProjectiles(isGui, "spectral_arrow")
      },
      ...Object.entries(potions).flatMap(([name, { color, variants }]) =>
        potionVariants(name, color, variants, isGui)
      )
    ],
    fallback: makeMultishotProjectiles(isGui, "arrow", true)
  }
}

function makeMultishotProjectiles(isGui, baseName, vanilla) {
  return {
    type: "select",
    property: "component",
    component: "enchantments",
    cases: [
      {
        when: { multishot: 1 },
        model: isGui
          ? {
              type: "model",
              model: `item/better_bows/crossbow_${baseName}_2d_multishot`
            }
          : {
              type: "composite",
              models: [
                { type: "model", model: `item/better_bows/crossbow_${baseName}` },
                { type: "model", model: `item/better_bows/crossbow_${baseName}_1` },
                { type: "model", model: `item/better_bows/crossbow_${baseName}_2` }
              ]
            }
      }
    ],
    fallback: {
      type: "model",
      model: !isGui ? `item/better_bows/crossbow_${baseName}` : vanilla ? `item/crossbow_${baseName}` : `item/better_bows/crossbow_${baseName}_2d`
    }
  }
}

function makeCrossbowJson() {
  return {
    model: {
      type: "select",
      property: "display_context",
      cases: [
        {
          when: "gui",
          model: {
            type: "select",
            property: "charge_type",
            cases: [
              { when: "arrow", model: makeChargedProjectiles(true) },
              { when: "rocket", model: makeMultishotProjectiles(true, "firework", true) }
            ],
            fallback: {
              type: "condition",
              property: "using_item",
              on_false: { type: "model", model: "item/crossbow" },
              on_true: {
                type: "range_dispatch",
                property: "crossbow/pull",
                entries: [
                  { threshold: 0.58, model: { type: "model", model: "item/crossbow_pulling_1" } },
                  { threshold: 1.0, model: { type: "model", model: "item/crossbow_pulling_2" } }
                ],
                fallback: { type: "model", model: "item/crossbow_pulling_0" }
              }
            }
          }
        }
      ],
      fallback: {
        type: "select",
        property: "charge_type",
        cases: [
          { when: "arrow", model: makeChargedProjectiles(false) },
          { when: "rocket", model: makeMultishotProjectiles(false, "firework") }
        ],
        fallback: {
          type: "condition",
          property: "using_item",
          on_false: { type: "model", model: "item/better_bows/crossbow" },
          on_true: {
            type: "range_dispatch",
            property: "crossbow/pull",
            entries: [
              { threshold: 0.58, model: { type: "model", model: "item/better_bows/crossbow_pulling_1" } },
              { threshold: 1.0, model: { type: "model", model: "item/better_bows/crossbow_pulling_2" } }
            ],
            fallback: { type: "model", model: "item/better_bows/crossbow_pulling_0" }
          }
        }
      }
    }
  }
}

fs.writeFileSync("assets/minecraft/items/crossbow.json", JSON.stringify(makeCrossbowJson()))