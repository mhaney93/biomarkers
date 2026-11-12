// "Above range" / "Below range" blurbs shown on a biomarker's detail page, keyed by biomarker id
// (the trailing comment is the biomarker name). General education only, paraphrasing well-known
// patient references (MedlinePlus, Mayo Clinic, Cleveland Clinic lab-test pages). Biomarkers
// without a reference range, or with a text value, have no entry.

export type RangeNote = { above: string; below: string };

export const RANGE_NOTES: Record<string, RangeNote> = {
  "b8030487-c236-4cdb-b327-25dd113a77e9": { // Cat Dander (E1) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "64a6b505-2277-44a4-99ee-ccd78fcfb487": { // Cockroach (I6) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "dca22a48-dfb0-4270-a5e4-55383595d27c": { // Dog Dander (E5) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "a061292c-2acb-4e1b-85c2-fb48ea522d66": { // Mouse Urine Proteins (E72) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "2cdc0952-e286-4a75-9f21-77e782a154bc": { // Almond (F20) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "bbbe7c75-8a8b-411c-9bf4-e697d36cf14a": { // Cashew Nut (F202) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "8d1a9ed3-e40c-4c12-9d4d-24fcbb122663": { // Codfish (F3) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "c1a87d47-9402-4d1e-9a9d-46487fade1fc": { // Cow's Milk (F2) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "ecb36acc-aabd-4cc8-8480-07c8d1338ba3": { // Egg White (F1) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "1d11a894-a0dd-4c08-ba4e-82efb4bd92c6": { // Hazelnut (F17) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "6d299384-dd6a-4d8d-b56f-6eb03571bd03": { // Peanut (F13) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "a096ac0d-2bb4-4f1a-89d8-ad46e602451d": { // Salmon (F41) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "fb4ac9f3-317f-42ab-93f2-e364d8a68516": { // Scallop (F338) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "88323336-7900-4cc5-9579-7faa234958bc": { // Sesame Seed (F10) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "6ed309ec-aa85-4a04-b89a-39843e94623d": { // Shrimp (F24) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "51a45d15-17c5-4647-a1f4-35b155892f29": { // Soybean (F14) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "10038eb4-85e9-4576-b40c-054541814233": { // Tuna (F40) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "4e535f7b-6cfd-44b8-9198-27f1c9773532": { // Walnut (F256) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "7f63a0ac-ff5a-4177-b262-43553f966ca4": { // Wheat (F4) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "a414dee4-4846-4aa3-b65f-ea13805de6e5": { // Bermuda Grass (G2) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "f0d75cfb-62a5-45fd-af96-4684f7874996": { // Johnson Grass (G10) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "72a06545-1595-49aa-88ea-b67bf9c4260b": { // Timothy Grass (G6) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "ea528132-24b8-4e72-86ab-c4795c702321": { // Alternaria Mold (M6) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "bd938c25-595a-47a1-88f4-2eb65fb5f5c9": { // Aspergillus Mold (M3) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "3b64ad56-41db-4a35-9675-92a40d6befca": { // Cladosporium Mold (M2) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "2eece371-0504-4b07-b887-185654c25e14": { // Dust Mite, D. farinae (D2) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "134f9dd9-1f6b-4544-8b8f-ccd6fe48f2e5": { // Dust Mite, D. pteronyssinus (D1) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "83169b7c-b578-4da9-b5e1-fa89437845de": { // Penicillium Mold (M1) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "071bf6ce-21d9-4938-af49-45853d0040f4": { // Alder (T2) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "cde556ce-11c8-4938-bd7f-0ee3b6946aef": { // Cottonwood (T14) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "1eb908bc-c63e-4508-a7f4-4bacba63d451": { // Elm (T8) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "f0fc925c-a427-4e1d-82fb-2bca132e9619": { // Mountain Cedar (T6) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "2faa4be0-1385-49cc-8f5e-bb6f619b5263": { // Oak (T7) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "2a9a46bc-be69-420c-b006-9f7fd5cdb87f": { // Olive Tree (T9) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "e249f3f6-08ac-44bf-a1f7-2912f851f656": { // Walnut Tree (T10) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "44ff425c-a8c3-499f-b751-8e029373d037": { // White Mulberry (T70) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "a9fb6784-ad07-4cfd-856f-9788daff9161": { // Common Ragweed, Short (W1) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "2671eb03-ac5f-45d8-92ce-3853ca44efd2": { // Mugwort (W6) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "0cf869a6-5e5d-404e-9680-3bab8447f3b2": { // Rough Pigweed (W14) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "1429c533-f93b-4bd6-9c5a-0ace4eb33e4c": { // Russian Thistle (W11) IgE
    above: "Specific IgE antibodies to this allergen are detected, meaning the immune system is sensitized to it. Sensitization is common in people with allergic conditions such as hay fever, asthma, eczema or food allergy, and may be present without symptoms; potential effects range from none to mild or severe reactions on exposure, with higher classes more likely to be clinically relevant.",
    below: "Only the high direction is clinically meaningful; undetectable IgE (class 0) means no sensitization to this allergen was found, though it does not completely rule out an allergy.",
  },
  "d1ee2ea3-f17c-400f-8252-cabb0f0b6ddc": { // Immunoglobulin E (IgE), Total
    above: "Total IgE is the overall level of the allergy-type antibody. High levels are common with allergic conditions such as hay fever, asthma and eczema, and with parasitic infections and some immune disorders; they can reflect a more allergy-prone immune system, though many people with high IgE have no symptoms.",
    below: "Low total IgE is usually unremarkable. It is occasionally seen with certain rare immune deficiencies, but alone it carries little clinical meaning.",
  },
  "5c3cde99-1d46-431d-9905-6e86c167309b": { // Rheumatoid Factor
    above: "Rheumatoid factor is an antibody often present in rheumatoid arthritis, and also in Sjögren syndrome, lupus, chronic infections, liver disease and some healthy people, especially older adults. Higher levels are associated with autoimmune joint inflammation, but a high result alone does not confirm a disease.",
    below: "Only the high direction is clinically meaningful; a low or undetectable level is the expected finding.",
  },
  "9da8bc29-17e9-4209-8193-9b2b4f4188a0": { // Thyroglobulin Antibodies (TgAb)
    above: "Antibodies against thyroglobulin, a thyroid protein, are raised in autoimmune thyroid disease such as Hashimoto thyroiditis and Graves disease, and sometimes in people without thyroid disease. They can accompany thyroid inflammation and, over time, changes in thyroid function.",
    below: "Only the high direction is clinically meaningful; undetectable or low is the expected finding.",
  },
  "0a469369-27df-4da2-bb3b-7c61ab7f8978": { // Thyroid Peroxidase Antibodies (TPOAb)
    above: "Antibodies against thyroid peroxidase, a thyroid enzyme, are raised in autoimmune thyroid disease, most often Hashimoto thyroiditis, and sometimes in people with normal thyroid function. They are associated with a higher chance of developing an underactive thyroid over time.",
    below: "Only the high direction is clinically meaningful; undetectable or low is the expected finding.",
  },
  "52e31cab-d9da-4857-b4ad-3e72e0c031f4": { // Absolute Lymphocytes
    above: "A high lymphocyte count (lymphocytosis) is typical with viral infections and some chronic infections, and can occur with certain blood cancers such as chronic lymphocytic leukemia. It reflects an active immune response.",
    below: "A low count (lymphopenia) can follow severe infection, steroid or chemotherapy treatment, autoimmune disease, HIV or bone marrow problems, and may be associated with reduced infection defense.",
  },
  "608fec91-a8d3-4ea7-b336-36b6920645e0": { // Absolute Monocytes
    above: "High monocytes (monocytosis) are seen with chronic infections such as tuberculosis, recovery from acute infection, inflammatory and autoimmune diseases and some blood cancers. It generally reflects ongoing immune activity.",
    below: "Low monocytes are uncommon and can be seen with bone marrow suppression, some leukemias or steroid use; on its own it is rarely meaningful.",
  },
  "54ac0895-fca7-4ec5-9c6c-140a21f112ed": { // Absolute Neutrophils
    above: "High neutrophils (neutrophilia) are most often due to bacterial infection, inflammation, physical stress, smoking or steroid use, and occasionally bone marrow disorders. It reflects the body's acute inflammatory response.",
    below: "Low neutrophils (neutropenia) can result from viral infections, certain medicines such as chemotherapy, autoimmune conditions or bone marrow disorders, and are associated with a higher risk of infections.",
  },
  "1a3bd882-47e3-41a1-b580-e5c433af7245": { // Ferritin
    above: "Ferritin is the main iron-storage protein. High levels can reflect iron overload (such as hemochromatosis), but also inflammation, liver disease, obesity or some cancers, since ferritin rises with inflammation. Iron overload can over time affect the liver, heart and pancreas.",
    below: "Low ferritin indicates depleted iron stores, most often from blood loss, low iron intake or poor absorption. It can progress to iron-deficiency anemia, with fatigue and reduced exercise tolerance.",
  },
  "dcd4d844-31c6-4b9c-8f5a-9c2c992bb9cb": { // Globulin
    above: "High globulins can reflect chronic inflammation or infection, autoimmune disease, liver disease or certain blood disorders such as multiple myeloma. It means higher levels of immune and transport proteins in the blood.",
    below: "Low globulins can reflect immune-system deficiencies, malnutrition, or protein loss through the kidneys or gut, and may be associated with a weakened infection defense.",
  },
  "dc2ef420-cb74-4de7-9a0b-255ad9bc3f65": { // Hematocrit
    above: "A high hematocrit (the share of blood made of red cells) can result from dehydration, living at altitude, smoking, sleep apnea, testosterone use or polycythemia. Thicker blood can raise the risk of clotting.",
    below: "A low hematocrit is the hallmark of anemia, from blood loss, nutritional deficiency, chronic disease or bone marrow problems. It reduces oxygen delivery, which can cause fatigue and breathlessness.",
  },
  "2326cc50-657d-4e2a-9931-2ff7eabe5b49": { // Hemoglobin
    above: "High hemoglobin can result from dehydration, living at altitude, smoking, sleep apnea, testosterone use or polycythemia. Thicker blood can raise the risk of clotting.",
    below: "Low hemoglobin defines anemia, from blood loss, iron or vitamin deficiency, chronic disease or bone marrow problems. It reduces oxygen delivery, which can cause fatigue, weakness and breathlessness.",
  },
  "cda30afa-038a-4c34-a900-3043dffb0193": { // Iron Binding Capacity
    above: "High total iron-binding capacity (TIBC) is typical of iron deficiency, since the body makes more transferrin to capture iron. It can also rise with pregnancy or oral contraceptive use.",
    below: "Low TIBC can be seen with chronic inflammation, liver disease, malnutrition or iron overload, as transferrin production falls.",
  },
  "b7d96a49-8439-4442-85c5-7df41882d53a": { // Iron, Total
    above: "High serum iron can reflect iron supplements or overdose, iron overload conditions such as hemochromatosis, liver disease or recent iron intake. Excess iron can accumulate in organs over time.",
    below: "Low serum iron is seen with iron deficiency, blood loss, poor absorption or chronic inflammation, and can lead to anemia with fatigue.",
  },
  "cfe98755-26d2-40a7-9545-bc452ec2ffde": { // Lymphocytes
    above: "The lymphocyte share of white cells rises with viral infections and some chronic infections or blood cancers, and also when other white-cell types are low. It reflects an active immune response.",
    below: "A low share can result from a high neutrophil count, steroid or chemotherapy treatment, HIV or other causes of low lymphocytes, and may be associated with reduced infection defense.",
  },
  "09305f28-1726-4cd2-9c33-be382bf06c60": { // Magnesium
    above: "High magnesium is uncommon and usually due to reduced kidney function or heavy use of magnesium-containing antacids or laxatives. Markedly high levels can cause weakness, low blood pressure and heart rhythm changes.",
    below: "Low magnesium can come from poor intake, gut losses, alcohol use, some medicines such as diuretics and proton pump inhibitors, or diabetes. It can cause muscle cramps, tremor and heart rhythm changes, and often occurs along with low potassium or calcium.",
  },
  "e7d75643-5ab3-4f46-8e53-635eab201436": { // Mean Coirpuscular Hemoglobin Concentration (MCHC)
    above: "A high MCHC (hemoglobin concentration in red cells) can occur with spherocytosis, certain hemolytic anemias, or as a lab artifact from clumped cells or lipemia.",
    below: "A low MCHC means paler red cells (hypochromia), typical of iron-deficiency anemia and thalassemia.",
  },
  "c55dfc6a-0017-45cc-b8d1-2d840b267c1f": { // Mean Corpuscular Hemoglobin (MCH)
    above: "High MCH (more hemoglobin per red cell) tracks with larger red cells, as in vitamin B12 or folate deficiency, liver disease or alcohol use.",
    below: "Low MCH (less hemoglobin per red cell) is typical of iron-deficiency anemia and thalassemia, where cells are smaller and paler.",
  },
  "123a4e4a-d5f4-4c22-8999-10a2ace44aad": { // Mean Corpuscular Volume (MCV)
    above: "High MCV (macrocytosis, larger red cells) is associated with vitamin B12 or folate deficiency, alcohol use, liver disease, an underactive thyroid and some medicines or bone marrow disorders.",
    below: "Low MCV (microcytosis, smaller red cells) is typical of iron deficiency and thalassemia, and can occur with chronic disease; it may accompany anemia.",
  },
  "d4d209ba-6e69-4957-a7d7-a5c243071735": { // Mean Platelete Volume (MPV)
    above: "A high MPV means larger, younger platelets, seen when platelets are being rapidly replaced (for example with immune thrombocytopenia), in some inherited platelet disorders, and with higher cardiovascular risk.",
    below: "A low MPV means smaller platelets, seen with bone marrow underproduction, some inherited conditions and certain chronic inflammatory states.",
  },
  "f48d2658-42cb-42dc-83f7-3b3fc441022a": { // Neutrophils
    above: "A high neutrophil share is most often due to bacterial infection, inflammation, physical stress, smoking or steroids, reflecting an acute inflammatory response.",
    below: "A low share can reflect a high proportion of other white cells (such as lymphocytes in viral infection) or true neutropenia from medicines, autoimmune conditions or bone marrow disorders, which is linked to a higher infection risk.",
  },
  "87f2d369-3924-4627-965c-f16839596a3d": { // Platelet Count
    above: "A high platelet count (thrombocytosis) is often reactive, from infection, inflammation, iron deficiency or recent surgery, and occasionally from a bone marrow disorder. Very high levels can raise clotting or bleeding risk.",
    below: "A low platelet count (thrombocytopenia) can come from medicines, viral infection, immune conditions, liver disease, heavy alcohol use or bone marrow problems. Very low levels can cause easy bruising and prolonged bleeding.",
  },
  "86e30c8f-b492-4518-a3e7-4d47e284bdaf": { // Red Blood Cell Count
    above: "A high red cell count can result from dehydration, living at altitude, smoking, sleep apnea, testosterone use or polycythemia, and thickens the blood.",
    below: "A low red cell count points to anemia from blood loss, nutritional deficiency, chronic disease or bone marrow or kidney problems, and can reduce oxygen delivery, causing fatigue.",
  },
  "8f036c44-893d-4f70-9ebf-5ca75e331a28": { // Red Cell Distribution Width (RDW)
    above: "A high RDW means red cells vary more in size (anisocytosis), seen with iron, B12 or folate deficiency, mixed anemias and some liver or bone marrow conditions.",
    below: "A low RDW means uniform red-cell size and is generally not clinically meaningful.",
  },
  "87b4937f-c819-44c9-ae22-1efe65c68821": { // Transferrin Saturation
    above: "High transferrin saturation means a larger share of the iron-carrying protein is loaded with iron, as in iron overload (hemochromatosis), iron supplementation or liver disease.",
    below: "Low transferrin saturation indicates little iron available to tissues, typical of iron deficiency, and can occur with chronic inflammation; it can lead to anemia.",
  },
  "7ba52330-1c8e-4510-8b8c-31b166be7a50": { // White Blood Cell Count
    above: "A high white cell count (leukocytosis) is most often due to infection, inflammation, physical stress, smoking or steroids, and occasionally to blood cancers. It generally reflects an active immune response.",
    below: "A low white cell count (leukopenia) can result from viral infection, certain medicines, autoimmune disease or bone marrow problems, and may be associated with a higher risk of infection.",
  },
  "80dfe6ab-926e-48f3-988d-42f02a217875": { // Calcium
    above: "High calcium (hypercalcemia) is most often caused by an overactive parathyroid gland, and also by some cancers, excess vitamin D or calcium intake, and dehydration. It can cause thirst, constipation, kidney stones and fatigue.",
    below: "Low calcium (hypocalcemia) can come from low vitamin D, an underactive parathyroid, kidney disease or low albumin. It can cause muscle cramps, tingling and, when severe, abnormal heart rhythm.",
  },
  "002d3536-3b3a-4431-988c-3db587bcde63": { // Vitamin D, 25-Hydroxy
    above: "Levels above the range are usually from excessive supplementation. Very high levels can raise blood calcium and, rarely, cause nausea, weakness and kidney problems.",
    below: "Low vitamin D comes from limited sun exposure, low intake, obesity, malabsorption or kidney or liver disease. Over time it can weaken bones, causing rickets in children and osteomalacia or osteoporosis in adults.",
  },
  "56ba1721-e961-47d5-b587-4749d8158110": { // DHA
    above: "Higher DHA reflects more omega-3 intake from fatty fish or fish-oil supplements, and is generally not considered harmful.",
    below: "Low DHA reflects low omega-3 intake from fish or supplements. DHA is a major component of brain and eye tissue; low levels have been associated with less favorable heart and brain health markers.",
  },
  "2004e6d3-913a-4396-918b-0b023722f82d": { // EPA+DPA+DHA (OmegaCheck)
    above: "Only the low direction is clinically meaningful; higher values simply reflect abundant omega-3 intake.",
    below: "Low OmegaCheck reflects a low blood omega-3 level from limited fish or supplement intake, and has been associated with higher cardiovascular risk.",
  },
  "46c2bc0d-59f0-4e01-8721-e77e32e26088": { // Lead, Venous
    above: "Lead is a toxic metal with no safe level. Higher blood levels reflect exposure from old paint, contaminated water or soil, certain occupations or hobbies, or imported products. Lead can affect the nervous system, kidneys and blood, and raise blood pressure.",
    below: "Only the high direction is clinically meaningful; the lowest levels are expected.",
  },
  "186242d9-76c2-4a64-8502-9ecf1b09fd84": { // Mercury, Blood
    above: "Blood mercury rises with frequent consumption of high-mercury fish (such as swordfish or shark), and with certain occupational or environmental exposures. High levels can affect the nervous system and kidneys.",
    below: "Only the high direction is clinically meaningful; the lowest levels are expected.",
  },
  "2ab8fdd0-8af4-4c2e-ab3c-15c78ff0e223": { // Omega-3, Total
    above: "Higher omega-3 reflects frequent fatty fish or fish-oil intake, and is generally not considered harmful.",
    below: "Low omega-3 reflects low intake of fatty fish or supplements and has been associated with less favorable heart and inflammation markers.",
  },
  "df9b58c4-9618-4f0f-b985-a2095a01de67": { // Omega-6, Total
    above: "High omega-6 reflects a diet rich in vegetable oils and processed foods, and often goes with a high omega-6/omega-3 balance, which is discussed in relation to inflammation.",
    below: "Low omega-6 reflects low dietary intake of vegetable oils, nuts and seeds, and is generally not considered clinically meaningful.",
  },
  "af38ccdd-f20a-4116-a17a-5b6cf1a55311": { // Sodium
    above: "High sodium (hypernatremia) is usually due to dehydration or insufficient water intake, and sometimes to hormonal or kidney problems. It can cause thirst, confusion and, when severe, seizures.",
    below: "Low sodium (hyponatremia) can result from excess water intake, certain medicines such as diuretics, heart, liver or kidney conditions, or hormone disorders. It can cause headache, nausea and confusion, and when severe, seizures.",
  },
  "aac83b6d-69dd-4401-bc2d-569e6c798014": { // Apolipoprotein B
    above: "ApoB counts the number of atherogenic particles (LDL, VLDL and others). High levels are associated with a higher risk of plaque buildup in arteries and cardiovascular disease, and can reflect genetics, diet, obesity, diabetes or an underactive thyroid.",
    below: "Low apoB is generally favorable. Very low levels can occur with inherited conditions, malnutrition or hyperthyroidism.",
  },
  "610c3582-108a-438a-998a-b0ade68a7ffa": { // Arachidonic Acid/EPA Ratio
    above: "A high ratio means relatively more pro-inflammatory omega-6 arachidonic acid compared with omega-3 EPA, which is associated with a more inflammatory fatty-acid balance.",
    below: "A low ratio means relatively more EPA, usually from higher fish or fish-oil intake, and is generally considered favorable.",
  },
  "4c98eaab-b584-4f0b-8d8f-f199e0a37f05": { // Cholesterol, Total
    above: "High total cholesterol can come from diet, genetics, obesity, diabetes, an underactive thyroid or inactivity. Over time it is associated with plaque buildup in arteries and higher cardiovascular risk.",
    below: "Low total cholesterol can be genetic or due to malnutrition, an overactive thyroid, liver disease or certain medicines; it is usually not a concern on its own.",
  },
  "f850fbc7-5d5f-412f-ba77-3cdbe75deb20": { // Cholesterol/High-Density Lipoprotein Cholesterol (HDLC) Ratio
    above: "A high ratio means relatively more non-HDL cholesterol compared with protective HDL, and is associated with higher cardiovascular risk.",
    below: "A low ratio is generally favorable.",
  },
  "c2cb61ba-fbce-4af3-87d6-93591a00d073": { // DPA
    above: "Higher DPA reflects more omega-3 intake from fish, fish oil or some meats, and is generally not considered harmful.",
    below: "Low DPA reflects low omega-3 intake and has been associated with a less favorable fatty-acid profile.",
  },
  "9e4b7e7b-d5b2-4ada-9628-d6ff4bf976ea": { // EPA
    above: "Higher EPA reflects more omega-3 intake from fatty fish or fish-oil supplements, and is generally not considered harmful.",
    below: "Low EPA reflects low intake of fatty fish or supplements, and has been associated with a less favorable inflammation and heart-health profile.",
  },
  "c41cf16b-556b-4cb5-9d27-a0deb3741ca4": { // HDL Large (Large HDL-P)
    above: "Only the low direction is clinically meaningful; a higher count of large HDL particles is generally considered favorable.",
    below: "Low large-HDL particles are associated with insulin resistance, higher triglycerides and a higher cardiovascular risk.",
  },
  "630f5f5a-0d02-4724-b5bc-de46a2ca1d50": { // High Density Lipoprotein (HDL) Cholesterol
    above: "Only the low direction is clinically meaningful; high HDL is generally favorable, though very high levels have not clearly shown extra benefit.",
    below: "Low HDL is associated with inactivity, smoking, obesity, type 2 diabetes and genetics, and with a higher risk of cardiovascular disease.",
  },
  "8051af31-8ea7-4913-a324-ee1c04abd6ff": { // Homocyst(e)ine
    above: "High homocysteine can reflect low B vitamins (B12, B6 or folate), kidney disease, an underactive thyroid, some medicines or genetics. It is associated with a higher risk of vascular disease and blood clots.",
    below: "Only the high direction is clinically meaningful; low homocysteine is generally not a concern.",
  },
  "f342f106-1dd2-4dee-995f-990972787c7e": { // LDL Medium (Medium LDL-P)
    above: "More medium-sized LDL particles are associated with insulin resistance and higher triglycerides, and with a higher cardiovascular risk.",
    below: "Only the high direction is clinically meaningful; a low count is generally favorable.",
  },
  "7eb6a224-9c5a-44bf-b665-50992ac9c6cb": { // LDL Particle Number (LDL-P)
    above: "A high LDL particle count is associated with greater plaque buildup in arteries and higher cardiovascular risk, and can come from diet, genetics, insulin resistance or an underactive thyroid, even when LDL cholesterol is normal.",
    below: "A low LDL particle count is generally favorable.",
  },
  "f0b90bb9-4ed9-4213-b932-31b71095ef51": { // LDL Peak Size
    above: "Only the low direction is clinically meaningful; larger LDL particles are generally considered less atherogenic.",
    below: "Smaller LDL particles (pattern B) are associated with insulin resistance, high triglycerides and metabolic syndrome, and with a higher cardiovascular risk.",
  },
  "5fafeeb2-1183-4c82-b3ce-c127e718ce5e": { // LDL Small (Small LDL-P)
    above: "More small LDL particles are associated with insulin resistance, high triglycerides and metabolic syndrome, and with a higher cardiovascular risk.",
    below: "Only the high direction is clinically meaningful; a low count is generally favorable.",
  },
  "f46bee95-5777-4de7-9216-b530d41254cf": { // Lipoprotein (a)
    above: "Lp(a) is largely genetically determined. High levels are associated with a higher risk of heart disease, stroke and aortic valve narrowing, independent of other cholesterol measures.",
    below: "Only the high direction is clinically meaningful; low Lp(a) is generally favorable.",
  },
  "4b2a6bd2-ff88-4849-a9d9-2cbb6f72cd96": { // Low-Density Lipoprotein (LDL) Cholesterol
    above: "High LDL cholesterol can come from diet, genetics, obesity, diabetes or an underactive thyroid, and is associated with plaque buildup in arteries and higher cardiovascular risk.",
    below: "Low LDL is generally favorable; very low levels can be genetic or due to malnutrition, an overactive thyroid or certain medicines.",
  },
  "1f890752-ce78-4d98-ad0d-ec57a43491ef": { // Non High Density Lipoprotein (HDL) Cholesterol
    above: "Non-HDL cholesterol includes all atherogenic cholesterol particles. High levels are associated with plaque buildup in arteries and higher cardiovascular risk, and often reflect high LDL or triglycerides.",
    below: "Low non-HDL cholesterol is generally favorable.",
  },
  "2f2a7d90-01cd-471c-9779-32f327074c86": { // Omega-6/Omega-3 Ratio
    above: "A high ratio means relatively more omega-6 than omega-3 fatty acids, typical of diets rich in vegetable oils and low in fish, and is discussed in relation to inflammation.",
    below: "A low ratio means relatively more omega-3, usually from higher fish or fish-oil intake, and is generally considered favorable.",
  },
  "fd355866-2b26-42ec-8f4a-1b9130012796": { // Triglycerides
    above: "High triglycerides can come from excess calories, sugar or alcohol, obesity, insulin resistance, diabetes, an underactive thyroid or genetics. Very high levels can cause pancreatitis, and moderately high levels are associated with cardiovascular risk.",
    below: "Only the high direction is clinically meaningful; low triglycerides are generally not a concern.",
  },
  "fa23dea8-e8cb-49b6-9f5f-26d63e11b9c8": { // hs-CRP
    above: "High-sensitivity CRP rises with inflammation from infection, injury, obesity, smoking or chronic disease; persistent mild elevations are associated with higher cardiovascular risk. A recent illness can raise it temporarily.",
    below: "Only the high direction is clinically meaningful; low hs-CRP indicates low inflammation.",
  },
  "37ecadcf-34ac-4394-9d8f-3ad70e570152": { // Bioavailable Testosterone
    above: "High bioavailable testosterone can result from testosterone or steroid use, certain tumors or low SHBG. Possible effects include acne, higher red cell counts and reduced natural production.",
    below: "Low bioavailable testosterone can result from aging, obesity, pituitary or testicular problems, chronic illness or high SHBG. It may be associated with low libido, fatigue and reduced muscle mass.",
  },
  "dc58f711-af04-4da9-8071-7f9f5019ef44": { // Cortisol, Total
    above: "High cortisol can result from stress, Cushing syndrome, corticosteroid or estrogen use, or the time of day the sample was drawn. Prolonged high levels can cause weight gain, high blood pressure and high blood sugar.",
    below: "Low cortisol can result from adrenal insufficiency (such as Addison disease), pituitary problems or stopping steroid medicines. It can cause fatigue, low blood pressure and low blood sugar.",
  },
  "c4352af4-12ee-4da1-a59b-690ebc7b3bef": { // DHEA-S
    above: "High DHEA-S can come from adrenal tumors or hyperplasia, supplement use or polycystic ovary syndrome. Possible effects include acne and excess hair growth.",
    below: "Low DHEA-S falls naturally with age, and can also reflect adrenal or pituitary insufficiency or steroid medicines.",
  },
  "4c8e3b94-bb35-4dc4-9679-27240190f430": { // Estradiol
    above: "In men, higher estradiol can come from obesity (testosterone is converted to estrogen in fat tissue), liver disease, testosterone therapy or certain tumors. Possible effects include breast tissue enlargement and reduced libido.",
    below: "Low estradiol in men is uncommon and can occur with some medicines (such as aromatase inhibitors) or pituitary or testicular problems; effects can include lower bone density.",
  },
  "3e46aff0-cc72-4c05-924f-e3e64044354b": { // FSH
    above: "High FSH in men suggests the testes are not responding normally (primary testicular failure), as after injury, infection, chemotherapy or in some genetic conditions, and can accompany reduced sperm production.",
    below: "Low FSH suggests the pituitary or hypothalamus is producing too little signal, as with pituitary disorders, anabolic steroid or testosterone use, or severe illness, which can reduce testosterone and sperm production.",
  },
  "541a5cc5-1e29-4ccf-b59d-d299985fe13b": { // Free Testosterone
    above: "High free testosterone can result from testosterone or steroid use, certain tumors or low SHBG. Possible effects include acne, higher red cell counts and reduced natural production.",
    below: "Low free testosterone can result from aging, obesity, pituitary or testicular problems, chronic illness or high SHBG, and may be associated with low libido, fatigue and reduced muscle mass.",
  },
  "0fc6e5bd-357c-40c5-bb44-9dfcb827aeeb": { // Insulin
    above: "High fasting insulin generally reflects insulin resistance, as seen with obesity, prediabetes and type 2 diabetes, PCOS or certain medicines, and less commonly an insulin-producing tumor. It is associated with a higher risk of diabetes and cardiovascular disease.",
    below: "Low insulin can occur in type 1 diabetes or advanced type 2 diabetes when the pancreas produces too little, and leads to high blood sugar.",
  },
  "1b1fa549-1454-4737-97a5-a8f38f6c5956": { // Luteinizing Hormone (LH)
    above: "High LH in men suggests the testes are not responding normally (primary testicular failure), as after injury, infection or in some genetic conditions, and often goes with low testosterone.",
    below: "Low LH suggests a pituitary or hypothalamic cause, such as pituitary disorders, anabolic steroid or testosterone use, or severe illness, and can lead to low testosterone.",
  },
  "33476c94-ed29-4bb8-9d51-b8ea22b00eff": { // Prolactin
    above: "High prolactin can come from a pituitary tumor (prolactinoma), an underactive thyroid, kidney disease, stress or certain medicines such as some antipsychotics. In men it can cause low libido, low testosterone, erectile dysfunction and, rarely, breast enlargement.",
    below: "Low prolactin is uncommon and usually not meaningful, though it can occur with pituitary damage.",
  },
  "c718ed9b-8bfa-462d-ad11-fb38fa0de234": { // SHBG
    above: "High SHBG binds more testosterone, leaving less available. It is associated with aging, liver disease, an overactive thyroid and some medicines, and can cause symptoms of low testosterone even when total testosterone is normal.",
    below: "Low SHBG is associated with obesity, insulin resistance, type 2 diabetes, an underactive thyroid and androgen use, and leaves more testosterone unbound.",
  },
  "7aeb6ad1-e3ee-427b-99b7-ead9874f14b5": { // Total Testosterone
    above: "High total testosterone can result from testosterone or anabolic steroid use, certain tumors or high SHBG. Possible effects include acne, higher red cell counts and reduced natural testosterone production.",
    below: "Low total testosterone can result from aging, obesity, pituitary or testicular problems, chronic illness or certain medicines, and may be associated with low libido, fatigue, reduced muscle mass and lower bone density.",
  },
  "9bd2333d-0f3b-42c5-bd68-21f834b4505f": { // Absolute Basophils
    above: "High basophils (basophilia) are uncommon and can be seen with allergic reactions, chronic inflammation, hypothyroidism or some bone marrow disorders such as chronic myeloid leukemia.",
    below: "Low basophils are common and generally not clinically meaningful, since normal counts are already very small.",
  },
  "77345baa-75a3-44a7-8cc1-eeb2686aad07": { // Absolute Eosinophils
    above: "High eosinophils (eosinophilia) are typically linked to allergic conditions such as asthma and hay fever, parasitic infections, certain drug reactions and some skin and immune disorders. Persistently high levels can contribute to tissue inflammation.",
    below: "Low eosinophils are common and generally not clinically meaningful; they can occur during acute stress or with steroid use.",
  },
  "eee556df-8ad1-476f-8913-7da6128e2917": { // Arachidonic Acid
    above: "High arachidonic acid reflects a higher omega-6 intake, as from meat, eggs and vegetable oils. It is a precursor of inflammatory signaling molecules, though its health effect at dietary levels is debated.",
    below: "Low arachidonic acid reflects low dietary intake and is generally not considered clinically meaningful.",
  },
  "7be3cdb9-889d-4754-a935-ae060da22728": { // Basophils
    above: "A high basophil share is uncommon and can be seen with allergic reactions, chronic inflammation, hypothyroidism or some bone marrow disorders.",
    below: "A low share is generally not clinically meaningful, since normal values are already very small.",
  },
  "4a71f22c-9817-4375-8978-3a65c1123949": { // Eosinophils
    above: "A high eosinophil share is typically linked to allergic conditions such as asthma and hay fever, parasitic infections, drug reactions and some skin and immune disorders, and can contribute to tissue inflammation.",
    below: "A low share is generally not clinically meaningful; it can occur during acute stress or steroid use.",
  },
  "da30873d-a995-4054-a4f2-6a55a7852801": { // Monocytes
    above: "A high monocyte share is seen with chronic infections, inflammatory and autoimmune diseases, recovery from acute infection and some blood cancers, reflecting ongoing immune activity.",
    below: "A low share is uncommon and rarely meaningful alone; it can occur with bone marrow suppression or steroid use.",
  },
  "fa842c57-97d3-4ca6-8014-fc6486467328": { // Zinc
    above: "High zinc usually comes from supplements or excessive intake. It can cause nausea and, over time, lower copper levels leading to anemia and reduced immune function.",
    below: "Low zinc can result from low intake, poor absorption, alcohol use or chronic disease, and can be associated with impaired immunity, slow wound healing and loss of taste.",
  },
  "be5fefa7-0573-4c17-9281-7fb324e7176b": { // Linoleic Acid
    above: "High linoleic acid reflects a diet high in vegetable oils, nuts and seeds, and is generally not considered harmful.",
    below: "Low linoleic acid can reflect low fat intake or malabsorption, and is generally not considered clinically meaningful.",
  },
  "15032ec9-8905-450b-aa6a-ce63b4022932": { // Albumin/Globulin Ratio
    above: "A high ratio can reflect low globulins (as in some immune deficiencies) or, less often, high albumin from dehydration.",
    below: "A low ratio can reflect low albumin (liver or kidney disease, malnutrition) or high globulins (chronic inflammation, autoimmune disease or certain blood disorders).",
  },
  "3f8af19f-1143-4353-9ddb-6086af7f08f1": { // Blood Urea Nitrogen (BUN)
    above: "High BUN can result from reduced kidney function, dehydration, a high-protein diet, gastrointestinal bleeding or some medicines. It can reflect the kidneys filtering less effectively.",
    below: "Low BUN can result from low protein intake, severe liver disease, overhydration or pregnancy, and is usually not clinically meaningful on its own.",
  },
  "6177856b-71e0-48f7-92ce-e957c03565e3": { // Blood Urea Nitrogen (BUN)/Creatinine Ratio
    above: "A high ratio is often due to dehydration, a high-protein diet, gastrointestinal bleeding or reduced blood flow to the kidneys.",
    below: "A low ratio can come from low protein intake, liver disease or overhydration, and is usually not clinically meaningful alone.",
  },
  "123f163e-3802-4028-bab7-7b9670574bfb": { // Chloride
    above: "High chloride can result from dehydration, certain kidney conditions or metabolic acidosis, and usually moves along with sodium.",
    below: "Low chloride can result from prolonged vomiting, certain diuretics, heart failure or metabolic alkalosis, and usually moves along with sodium.",
  },
  "f1408031-dd97-4626-b82c-be8a5894b278": { // Creatinine
    above: "High creatinine suggests reduced kidney filtration, but can also reflect dehydration, a high-protein meal, creatine supplements or large muscle mass.",
    below: "Low creatinine is seen with low muscle mass, malnutrition or pregnancy, and is usually not clinically meaningful on its own.",
  },
  "8bc21ce8-4a12-4ab0-8374-3bf1b2bdeb19": { // Creatinine, Random Urine
    above: "High urine creatinine reflects concentrated urine (low hydration) or high muscle mass; it mainly serves as a reference to adjust other urine tests.",
    below: "Low urine creatinine reflects dilute urine (high fluid intake) or reduced kidney function, and is used to interpret other urine tests.",
  },
  "bed29b2f-e50e-4e32-b502-4661d122c02a": { // Estimated Glomerular Filtration Rate (eGFR)
    above: "Only the low direction is clinically meaningful; a higher eGFR indicates good kidney filtering.",
    below: "A low eGFR indicates reduced kidney filtering, as in chronic kidney disease, and may also reflect dehydration or some medicines. Over time reduced filtration can lead to waste and fluid buildup.",
  },
  "e6cbe700-7e9e-4096-9255-8ad64c60f0c2": { // Microalbumin
    above: "Albumin leaking into urine is an early sign of kidney damage, associated with diabetes, high blood pressure and kidney disease, and with higher cardiovascular risk. Exercise, fever or infection can raise it temporarily.",
    below: "Only the high direction is clinically meaningful; a low urine albumin level is the expected finding.",
  },
  "729c5b94-2d5e-4b82-910e-9ee0d78125fc": { // Microalbumin/Creatinine Ratio, Random Urine
    above: "A high ratio indicates albumin leaking into urine, an early sign of kidney damage associated with diabetes, high blood pressure and kidney disease. Exercise, fever or infection can raise it temporarily.",
    below: "Only the high direction is clinically meaningful; a low ratio is the expected finding.",
  },
  "0889584c-fc9d-4cbd-8afd-382444e4173d": { // Protein, Total
    above: "High total protein can result from dehydration or from high globulins due to chronic inflammation, infection or conditions such as multiple myeloma.",
    below: "Low total protein can result from malnutrition, liver or kidney disease, or malabsorption, and may be associated with fluid retention and swelling.",
  },
  "f8fa2161-fa2c-4067-81c0-a2dd670c505a": { // Uric Acid
    above: "High uric acid can result from diet, alcohol, obesity, certain medicines or reduced kidney excretion. It can lead to gout and kidney stones.",
    below: "Low uric acid is uncommon and usually not meaningful; it can occur with some medicines, liver disease or rare genetic conditions.",
  },
  "36ab1fcb-4783-406d-ab10-6cff69b5c4ea": { // Alanine Aminotransferase (ALT)
    above: "High ALT signals liver cell injury, from fatty liver, viral hepatitis, alcohol, medicines, supplements or other liver disease. Strenuous exercise or muscle injury can raise it mildly.",
    below: "Only the high direction is clinically meaningful; low ALT is generally not a concern.",
  },
  "dd936af4-d646-4e36-9e2f-26e0367dc3ea": { // Albumin
    above: "High albumin is most often from dehydration and usually normalizes with fluids.",
    below: "Low albumin can result from liver disease, kidney disease (protein loss), malnutrition or chronic inflammation, and can contribute to fluid retention and swelling.",
  },
  "97fbb78b-d700-45f6-b47e-efc424ca641e": { // Alkaline Phosphatase
    above: "High ALP can come from liver or bile duct problems, bone growth or disease (such as Paget disease or healing fractures), or vitamin D deficiency. Where it comes from is often clarified by other tests.",
    below: "Low ALP is uncommon and can occur with zinc deficiency, malnutrition, hypothyroidism or the rare inherited condition hypophosphatasia.",
  },
  "82cf331b-649b-435b-9e8c-1d8229bef4b4": { // Aspartate Aminotransferase (AST)
    above: "High AST signals injury to the liver, muscle or heart; causes include fatty liver, hepatitis, alcohol, medicines, intense exercise and muscle disease.",
    below: "Only the high direction is clinically meaningful; low AST is generally not a concern.",
  },
  "e9795c93-c595-41cd-8185-2aa8c7e5039a": { // Bilirubin, Total
    above: "High bilirubin can come from increased red-cell breakdown, liver disease, bile duct blockage, or a harmless inherited condition (Gilbert syndrome). Levels high enough cause yellowing of the skin and eyes (jaundice).",
    below: "Only the high direction is clinically meaningful; low bilirubin is generally not a concern.",
  },
  "659538f2-8a7e-4c46-98d3-85be14d29407": { // GGT
    above: "High GGT is sensitive to liver and bile duct conditions, alcohol use and certain medicines, and often accompanies a high ALP when the bile ducts are involved.",
    below: "Only the high direction is clinically meaningful; low GGT is generally not a concern.",
  },
  "125c1de8-b34e-43eb-ba0b-b3b918b102e8": { // Carbon Dioxide
    above: "High bicarbonate (CO2) can result from vomiting or dehydration (metabolic alkalosis) or from chronic lung disease with CO2 retention, and can cause weakness or confusion when marked.",
    below: "Low bicarbonate can result from metabolic acidosis, as in kidney disease, diabetic ketoacidosis, severe diarrhea or sustained hyperventilation, and can cause fast breathing and fatigue.",
  },
  "e29f0955-dbfe-47a8-9aab-fd8de88092af": { // Glucose
    above: "High fasting glucose suggests prediabetes or diabetes, and can also be raised by recent food, stress, illness or steroids. Sustained high levels can damage blood vessels, nerves, eyes and kidneys over time.",
    below: "Low glucose (hypoglycemia) can result from fasting, diabetes medicines, heavy alcohol use or certain hormone and liver conditions. It can cause shakiness, sweating, confusion and, when severe, fainting.",
  },
  "ce70cffe-08b1-4001-b72c-41f414da931a": { // Hemoglobin A1c
    above: "A1c reflects average blood sugar over about three months. Levels in the prediabetes range (5.7-6.4%) and diabetes range (6.5% and above) are associated with higher risk of diabetes complications, including damage to the eyes, nerves, kidneys and blood vessels.",
    below: "Only the high direction is clinically meaningful; a low A1c is generally not a concern, though some anemias and diabetes medicines can lower it.",
  },
  "359e6284-acc2-4d58-a570-c7d1176c1237": { // Leptin
    above: "High leptin is typical of higher body fat, with the body becoming less responsive to its fullness signal (leptin resistance). It is associated with obesity and insulin resistance.",
    below: "Low leptin reflects very low body fat or a rare genetic deficiency; it can be associated with increased hunger and, when prolonged, hormonal disruption.",
  },
  "f6bba36c-2edd-44f0-9b7c-5dedec4bc676": { // Methylmalonic Acid (MMA)
    above: "High MMA is a sensitive sign of vitamin B12 deficiency, and can also rise with reduced kidney function or dehydration. Prolonged B12 deficiency can lead to anemia and nerve damage.",
    below: "Only the high direction is clinically meaningful; low MMA is the expected finding.",
  },
  "787a1993-6269-4d97-89ae-8ce96f2d5287": { // Thyroid Stimulating Hormone (TSH) 3rd Generation with Reflex to Free Thyroxine (FT4)
    above: "High TSH suggests the thyroid is underactive (hypothyroidism), as in Hashimoto thyroiditis, with the pituitary signaling more to compensate. Possible effects include fatigue, weight gain, cold sensitivity and constipation.",
    below: "Low TSH suggests an overactive thyroid (hyperthyroidism), as in Graves disease or thyroid nodules, or too much thyroid medicine. Possible effects include a fast heartbeat, weight loss, heat sensitivity and anxiety. Pituitary problems can also lower it.",
  },
  "9a8bdc73-f990-4603-97bb-c6c678a18a9e": { // Thyroxine (T4), Free
    above: "High free T4 indicates an overactive thyroid, as in Graves disease or thyroid nodules, or excess thyroid medication. Possible effects include a fast heartbeat, weight loss, heat sensitivity and tremor.",
    below: "Low free T4 indicates an underactive thyroid (as in Hashimoto thyroiditis) or, less often, a pituitary problem. Possible effects include fatigue, weight gain, cold sensitivity and constipation.",
  },
  "36e312bf-a7be-4d9f-a2ba-0831cdb20301": { // Triiodothyronine (T3), Free
    above: "High free T3 indicates an overactive thyroid, as in Graves disease or thyroid nodules, or excess thyroid medication. Possible effects include a fast heartbeat, weight loss, heat sensitivity and tremor.",
    below: "Low free T3 can occur with an underactive thyroid, or in severe illness, fasting or some medicines, as conversion of T4 to T3 falls. It may be associated with fatigue and cold sensitivity.",
  },
  "0eb5857b-c606-4a04-af3e-532766bc8a13": { // Potassium
    above: "High potassium (hyperkalemia) can result from kidney disease, certain medicines (such as ACE inhibitors and potassium-sparing diuretics), or a sample drawn with cell breakdown. It can cause muscle weakness and abnormal heart rhythm.",
    below: "Low potassium (hypokalemia) can result from vomiting, diarrhea, diuretics or low intake. It can cause muscle weakness, cramps and abnormal heart rhythm.",
  },
  "d478f1e1-c444-47bf-ba03-ba5f3e5f8545": { // Amylase
    above: "High amylase is seen with pancreatitis and other pancreatic conditions, salivary gland disease, kidney disease and some intestinal problems. In pancreatitis, it accompanies abdominal pain.",
    below: "Low amylase is uncommon and can reflect long-term pancreatic damage, but is rarely meaningful alone.",
  },
  "03afc02e-91f6-4438-9559-34859a629d36": { // Lipase
    above: "High lipase is the more specific marker of pancreatic inflammation (pancreatitis) and can also occur with other abdominal conditions or kidney disease. In pancreatitis, it accompanies abdominal pain.",
    below: "Low lipase is uncommon and can reflect long-term pancreatic damage, but is rarely meaningful alone.",
  },
  "9443eae6-9fc0-416c-ba1a-1fb84fcd8795": { // PSA, % Free
    above: "Only the low direction is clinically meaningful; a lower free-PSA percentage is associated with a higher likelihood of prostate cancer when total PSA is mildly raised.",
    below: "A low share of free PSA is associated with a higher likelihood of prostate cancer when total PSA is mildly raised; a higher share is more often seen with benign enlargement.",
  },
  "351cd5e1-65da-407c-8c2a-df70207edbe1": { // PSA, Free
    above: "Free PSA rises along with total PSA, from benign prostate enlargement, prostatitis, recent ejaculation or procedures, or prostate cancer. It is interpreted together with total PSA.",
    below: "Only the high direction is clinically meaningful on its own; a low value is the expected finding.",
  },
  "248a0a59-24ae-465e-bd7b-6256a97006af": { // PSA, Total
    above: "High PSA can come from benign prostate enlargement, prostatitis, recent ejaculation or procedures, or prostate cancer, and is a prompt for further evaluation rather than a diagnosis.",
    below: "Only the high direction is clinically meaningful; a low PSA is the expected finding.",
  },
  "e8bff82a-620f-4632-9aa6-5533c5a56f57": { // Android Bone Mineral Content (BMC)
    above: "Higher bone mineral content in the android generally reflects a larger or denser skeleton there and is not considered a concern.",
    below: "Lower bone mineral content in the android reflects a smaller or less dense skeleton there and, with low bone density, is associated with a higher fracture risk.",
  },
  "72d14cf9-d475-411c-83a6-5ad0f1c1a936": { // Android Fat %
    above: "A higher fat percentage in the android means more of its mass is fat; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "A lower fat percentage in the android means less of its mass is fat, typical of leanness or athletic build; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "c136aaf7-0d6f-4d1e-a580-bda9f00311fe": { // Android Fat Tissue
    above: "More fat tissue in the android reflects higher body fat there; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "Less fat tissue in the android reflects leanness there; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "8b34f0dc-3381-4e24-8426-8ae072e61fea": { // Android Lean %
    above: "A higher lean percentage in the android means more of its mass is muscle and other non-fat tissue, generally associated with better metabolic health.",
    below: "A lower lean percentage in the android means relatively more fat compared with muscle, associated with higher metabolic and cardiovascular risks.",
  },
  "946c2cbb-669a-49b9-835f-6dd0bb2a53cd": { // Android Lean Tissue
    above: "More lean tissue (muscle, organs, water) in the android is generally associated with better strength and metabolic health.",
    below: "Less lean tissue in the android can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength.",
  },
  "6721bcd4-a5d7-4a4a-a6ca-075fe5783e40": { // Android Total Mass
    above: "Higher total mass in the android reflects more tissue there, from more fat, muscle or both; overall higher body mass is associated with higher risks of high blood pressure, type 2 diabetes and joint strain.",
    below: "Lower total mass in the android reflects less tissue there, from less fat, muscle or both; overall low body mass can reflect low food intake, illness or a very lean build.",
  },
  "b9830d5b-acec-44cc-adc7-09870580edee": { // Arms Bone Mineral Content (BMC)
    above: "Higher bone mineral content in the arms generally reflects a larger or denser skeleton there and is not considered a concern.",
    below: "Lower bone mineral content in the arms reflects a smaller or less dense skeleton there and, with low bone density, is associated with a higher fracture risk.",
  },
  "fa4b8c07-3379-4345-890b-0e6a9d5fef8b": { // Arms Fat %
    above: "A higher fat percentage in the arms means more of its mass is fat; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "A lower fat percentage in the arms means less of its mass is fat, typical of leanness or athletic build; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "1b3ee2e2-e337-44fb-bd55-98aa6cafbe59": { // Arms Fat Tissue
    above: "More fat tissue in the arms reflects higher body fat there; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "Less fat tissue in the arms reflects leanness there; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "7ec5ed9f-31c8-46b9-ad5a-74f1aea6eccb": { // Arms Lean %
    above: "A higher lean percentage in the arms means more of its mass is muscle and other non-fat tissue, generally associated with better metabolic health.",
    below: "A lower lean percentage in the arms means relatively more fat compared with muscle, associated with higher metabolic and cardiovascular risks.",
  },
  "8c5bfa21-a4e7-4874-8eed-dd2ef7720e4d": { // Arms Lean Tissue
    above: "More lean tissue (muscle, organs, water) in the arms is generally associated with better strength and metabolic health.",
    below: "Less lean tissue in the arms can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength.",
  },
  "1cf44415-05a5-4fda-b897-a8811fe056bb": { // Arms Total Mass
    above: "Higher total mass in the arms reflects more tissue there, from more fat, muscle or both; overall higher body mass is associated with higher risks of high blood pressure, type 2 diabetes and joint strain.",
    below: "Lower total mass in the arms reflects less tissue there, from less fat, muscle or both; overall low body mass can reflect low food intake, illness or a very lean build.",
  },
  "560f09e9-615f-4651-84fb-d7e49010f585": { // Arms Bone Mineral Density (BMD)
    above: "Only the low direction is clinically meaningful; higher bone density in the arms is generally considered favorable.",
    below: "Low bone density in the arms can come from aging, low calcium or vitamin D, inactivity, hormone deficiency or certain medicines, and is associated with a higher risk of fractures.",
  },
  "f3ec5012-0692-419a-9448-5edb389050ed": { // Head Bone Mineral Density (BMD)
    above: "Only the low direction is clinically meaningful; higher bone density in the head is generally considered favorable.",
    below: "Low bone density in the head can come from aging, low calcium or vitamin D, inactivity, hormone deficiency or certain medicines, and is associated with a higher risk of fractures.",
  },
  "f36aff29-5fbb-46d0-8e90-af1a77c266db": { // Legs Bone Mineral Density (BMD)
    above: "Only the low direction is clinically meaningful; higher bone density in the legs is generally considered favorable.",
    below: "Low bone density in the legs can come from aging, low calcium or vitamin D, inactivity, hormone deficiency or certain medicines, and is associated with a higher risk of fractures.",
  },
  "7185cee4-8e68-41f0-9874-6b75fbdff6f3": { // Pelvis Bone Mineral Density (BMD)
    above: "Only the low direction is clinically meaningful; higher bone density in the pelvis is generally considered favorable.",
    below: "Low bone density in the pelvis can come from aging, low calcium or vitamin D, inactivity, hormone deficiency or certain medicines, and is associated with a higher risk of fractures.",
  },
  "b35f16aa-75a0-484b-8f3b-d97c246e2670": { // Ribs Bone Mineral Density (BMD)
    above: "Only the low direction is clinically meaningful; higher bone density in the ribs is generally considered favorable.",
    below: "Low bone density in the ribs can come from aging, low calcium or vitamin D, inactivity, hormone deficiency or certain medicines, and is associated with a higher risk of fractures.",
  },
  "817802a0-6899-4193-9564-3ea5d5912be5": { // Spine Bone Mineral Density (BMD)
    above: "Only the low direction is clinically meaningful; higher bone density in the spine is generally considered favorable.",
    below: "Low bone density in the spine can come from aging, low calcium or vitamin D, inactivity, hormone deficiency or certain medicines, and is associated with a higher risk of fractures.",
  },
  "81557e58-c8de-440a-a8ca-75fa69139ead": { // Total BMD Age-Matched Z-Score
    above: "Only the low direction is clinically meaningful; a score above the range means bone density above that of peers.",
    below: "A Z-score of -2 or lower means bone density is lower than expected for age and sex, which prompts a search for secondary causes such as hormone, nutritional or medicine effects.",
  },
  "7095da54-a14f-44de-a069-5ee91daa43c2": { // Total BMD Young Adult T-Score
    above: "Only the low direction is clinically meaningful; a score above -1 is considered normal bone density.",
    below: "A T-score of -1 to -2.5 indicates low bone mass (osteopenia) and below -2.5 indicates osteoporosis, associated with a higher fracture risk.",
  },
  "b8e5c842-6dcc-48de-9b91-b80972ab4e3e": { // Total Bone Mineral Density (BMD)
    above: "Only the low direction is clinically meaningful; higher bone density is generally considered favorable.",
    below: "Low bone density (osteopenia, osteoporosis) can come from aging, low calcium or vitamin D, inactivity, hormone deficiency or certain medicines, and is associated with a higher risk of fractures.",
  },
  "c684c6e3-d62a-4621-829b-8f8dbeef63ae": { // Trunk Bone Mineral Density (BMD)
    above: "Only the low direction is clinically meaningful; higher bone density in the trunk is generally considered favorable.",
    below: "Low bone density in the trunk can come from aging, low calcium or vitamin D, inactivity, hormone deficiency or certain medicines, and is associated with a higher risk of fractures.",
  },
  "620d68ce-fdf4-46d2-91dd-f1c1016a076f": { // Gynoid Bone Mineral Content (BMC)
    above: "Higher bone mineral content in the gynoid generally reflects a larger or denser skeleton there and is not considered a concern.",
    below: "Lower bone mineral content in the gynoid reflects a smaller or less dense skeleton there and, with low bone density, is associated with a higher fracture risk.",
  },
  "58d483e3-b517-4529-972c-1975d7abeddd": { // Gynoid Fat %
    above: "A higher fat percentage in the gynoid means more of its mass is fat; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "A lower fat percentage in the gynoid means less of its mass is fat, typical of leanness or athletic build; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "bc430780-6f66-433f-9430-4b4407b43461": { // Gynoid Fat Tissue
    above: "More fat tissue in the gynoid reflects higher body fat there; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "Less fat tissue in the gynoid reflects leanness there; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "2ce0bc4b-cd3b-4c29-8bbe-d9e214dbf153": { // Gynoid Lean %
    above: "A higher lean percentage in the gynoid means more of its mass is muscle and other non-fat tissue, generally associated with better metabolic health.",
    below: "A lower lean percentage in the gynoid means relatively more fat compared with muscle, associated with higher metabolic and cardiovascular risks.",
  },
  "92427e5a-bf41-4de3-9ee5-3ee0721de510": { // Gynoid Lean Tissue
    above: "More lean tissue (muscle, organs, water) in the gynoid is generally associated with better strength and metabolic health.",
    below: "Less lean tissue in the gynoid can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength.",
  },
  "6421f252-999d-4965-9a04-d0f9de604117": { // Gynoid Total Mass
    above: "Higher total mass in the gynoid reflects more tissue there, from more fat, muscle or both; overall higher body mass is associated with higher risks of high blood pressure, type 2 diabetes and joint strain.",
    below: "Lower total mass in the gynoid reflects less tissue there, from less fat, muscle or both; overall low body mass can reflect low food intake, illness or a very lean build.",
  },
  "ce2b39fa-b1c2-416e-9823-cb1f4353b896": { // Legs Bone Mineral Content (BMC)
    above: "Higher bone mineral content in the legs generally reflects a larger or denser skeleton there and is not considered a concern.",
    below: "Lower bone mineral content in the legs reflects a smaller or less dense skeleton there and, with low bone density, is associated with a higher fracture risk.",
  },
  "9f9af39b-f704-444d-9032-d8b83ba20e0a": { // Legs Fat %
    above: "A higher fat percentage in the legs means more of its mass is fat; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "A lower fat percentage in the legs means less of its mass is fat, typical of leanness or athletic build; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "36da780e-e402-4280-a608-a65f0dc4e863": { // Legs Fat Tissue
    above: "More fat tissue in the legs reflects higher body fat there; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "Less fat tissue in the legs reflects leanness there; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "61ebbe3f-29d1-4c27-a487-9b0969f16dd2": { // Legs Lean %
    above: "A higher lean percentage in the legs means more of its mass is muscle and other non-fat tissue, generally associated with better metabolic health.",
    below: "A lower lean percentage in the legs means relatively more fat compared with muscle, associated with higher metabolic and cardiovascular risks.",
  },
  "1f88b42d-800c-4369-9a56-a787804e8e2a": { // Legs Lean Tissue
    above: "More lean tissue (muscle, organs, water) in the legs is generally associated with better strength and metabolic health.",
    below: "Less lean tissue in the legs can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength.",
  },
  "1a35400c-73e5-450e-b1d1-92aec7f5644f": { // Legs Total Mass
    above: "Higher total mass in the legs reflects more tissue there, from more fat, muscle or both; overall higher body mass is associated with higher risks of high blood pressure, type 2 diabetes and joint strain.",
    below: "Lower total mass in the legs reflects less tissue there, from less fat, muscle or both; overall low body mass can reflect low food intake, illness or a very lean build.",
  },
  "e34d77b0-39f0-4b2f-aca1-076e1ddf74a9": { // Left Arm Bone Mineral Content (BMC)
    above: "Higher bone mineral content in the left arm generally reflects a larger or denser skeleton there and is not considered a concern.",
    below: "Lower bone mineral content in the left arm reflects a smaller or less dense skeleton there and, with low bone density, is associated with a higher fracture risk.",
  },
  "da1cd670-1b3c-4a6c-839e-51a55c75f79d": { // Left Arm Fat %
    above: "A higher fat percentage in the left arm means more of its mass is fat; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "A lower fat percentage in the left arm means less of its mass is fat, typical of leanness or athletic build; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "d05955f3-5dc6-4825-92ea-cf4920d9e777": { // Left Arm Fat Tissue
    above: "More fat tissue in the left arm reflects higher body fat there; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "Less fat tissue in the left arm reflects leanness there; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "69585654-fa91-4200-aa2b-fe95b590e67c": { // Left Arm Lean Tissue
    above: "More lean tissue (muscle, organs, water) in the left arm is generally associated with better strength and metabolic health.",
    below: "Less lean tissue in the left arm can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength.",
  },
  "4ed42ac5-52de-41de-ab8c-19d09a05ab45": { // Left Arm Total Mass
    above: "Higher total mass in the left arm reflects more tissue there, from more fat, muscle or both; overall higher body mass is associated with higher risks of high blood pressure, type 2 diabetes and joint strain.",
    below: "Lower total mass in the left arm reflects less tissue there, from less fat, muscle or both; overall low body mass can reflect low food intake, illness or a very lean build.",
  },
  "9d50660d-da88-44d5-a820-ab4494348350": { // Left Leg Bone Mineral Content (BMC)
    above: "Higher bone mineral content in the left leg generally reflects a larger or denser skeleton there and is not considered a concern.",
    below: "Lower bone mineral content in the left leg reflects a smaller or less dense skeleton there and, with low bone density, is associated with a higher fracture risk.",
  },
  "449eaf1b-2f6f-43c2-84a8-77eb1435e21a": { // Left Leg Fat %
    above: "A higher fat percentage in the left leg means more of its mass is fat; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "A lower fat percentage in the left leg means less of its mass is fat, typical of leanness or athletic build; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "d1483cbf-15cb-4d65-ae69-d6af37578cc1": { // Left Leg Fat Tissue
    above: "More fat tissue in the left leg reflects higher body fat there; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "Less fat tissue in the left leg reflects leanness there; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "a374b299-4c84-4d9e-b986-26180c3c6cda": { // Left Leg Lean Tissue
    above: "More lean tissue (muscle, organs, water) in the left leg is generally associated with better strength and metabolic health.",
    below: "Less lean tissue in the left leg can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength.",
  },
  "a3389df1-08eb-4ad0-b5c2-6d0a4e6d4604": { // Left Leg Total Mass
    above: "Higher total mass in the left leg reflects more tissue there, from more fat, muscle or both; overall higher body mass is associated with higher risks of high blood pressure, type 2 diabetes and joint strain.",
    below: "Lower total mass in the left leg reflects less tissue there, from less fat, muscle or both; overall low body mass can reflect low food intake, illness or a very lean build.",
  },
  "d41f7bbe-f19c-4fe1-b1f4-0db92a644911": { // Right Arm Bone Mineral Content (BMC)
    above: "Higher bone mineral content in the right arm generally reflects a larger or denser skeleton there and is not considered a concern.",
    below: "Lower bone mineral content in the right arm reflects a smaller or less dense skeleton there and, with low bone density, is associated with a higher fracture risk.",
  },
  "b43661c7-9629-4afa-aece-cd6db3e581fb": { // Right Arm Fat %
    above: "A higher fat percentage in the right arm means more of its mass is fat; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "A lower fat percentage in the right arm means less of its mass is fat, typical of leanness or athletic build; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "abcb034f-8f26-43f2-87fd-ceb54ccb9334": { // Right Arm Fat Tissue
    above: "More fat tissue in the right arm reflects higher body fat there; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "Less fat tissue in the right arm reflects leanness there; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "6c825426-fe01-469e-ac8e-e7f44f23b9d9": { // Right Arm Lean Tissue
    above: "More lean tissue (muscle, organs, water) in the right arm is generally associated with better strength and metabolic health.",
    below: "Less lean tissue in the right arm can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength.",
  },
  "f0facb3f-f161-4953-a1f7-07a8b958195c": { // Right Arm Total Mass
    above: "Higher total mass in the right arm reflects more tissue there, from more fat, muscle or both; overall higher body mass is associated with higher risks of high blood pressure, type 2 diabetes and joint strain.",
    below: "Lower total mass in the right arm reflects less tissue there, from less fat, muscle or both; overall low body mass can reflect low food intake, illness or a very lean build.",
  },
  "432e2deb-859c-47f7-8dab-867aa8269192": { // Right Leg Bone Mineral Content (BMC)
    above: "Higher bone mineral content in the right leg generally reflects a larger or denser skeleton there and is not considered a concern.",
    below: "Lower bone mineral content in the right leg reflects a smaller or less dense skeleton there and, with low bone density, is associated with a higher fracture risk.",
  },
  "fafe1a2e-e5e3-432b-a94b-91e1153b9f2f": { // Right Leg Fat %
    above: "A higher fat percentage in the right leg means more of its mass is fat; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "A lower fat percentage in the right leg means less of its mass is fat, typical of leanness or athletic build; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "1ba9eaac-47e5-4889-b9ef-a246dc32e2bb": { // Right Leg Fat Tissue
    above: "More fat tissue in the right leg reflects higher body fat there; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "Less fat tissue in the right leg reflects leanness there; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "172bcf81-2b1e-41ec-bfad-4fbc0bc3acf0": { // Right Leg Lean Tissue
    above: "More lean tissue (muscle, organs, water) in the right leg is generally associated with better strength and metabolic health.",
    below: "Less lean tissue in the right leg can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength.",
  },
  "c89171d0-a9c9-4b15-b630-492061d2747a": { // Right Leg Total Mass
    above: "Higher total mass in the right leg reflects more tissue there, from more fat, muscle or both; overall higher body mass is associated with higher risks of high blood pressure, type 2 diabetes and joint strain.",
    below: "Lower total mass in the right leg reflects less tissue there, from less fat, muscle or both; overall low body mass can reflect low food intake, illness or a very lean build.",
  },
  "e6cdc922-16d6-4765-ad3c-eba074433291": { // Trunk Bone Mineral Content (BMC)
    above: "Higher bone mineral content in the trunk generally reflects a larger or denser skeleton there and is not considered a concern.",
    below: "Lower bone mineral content in the trunk reflects a smaller or less dense skeleton there and, with low bone density, is associated with a higher fracture risk.",
  },
  "7055952f-7431-4b96-97d0-b0274da44df3": { // Trunk Fat %
    above: "A higher fat percentage in the trunk means more of its mass is fat; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "A lower fat percentage in the trunk means less of its mass is fat, typical of leanness or athletic build; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "c3b10b03-24d5-48c1-9b18-899a621d2b0a": { // Trunk Fat Tissue
    above: "More fat tissue in the trunk reflects higher body fat there; overall higher body fat is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially around the abdomen.",
    below: "Less fat tissue in the trunk reflects leanness there; very low overall body fat can be associated with hormonal disruption and fatigue.",
  },
  "87deb9ed-d15b-4198-bb82-1fe4f9968473": { // Trunk Lean %
    above: "A higher lean percentage in the trunk means more of its mass is muscle and other non-fat tissue, generally associated with better metabolic health.",
    below: "A lower lean percentage in the trunk means relatively more fat compared with muscle, associated with higher metabolic and cardiovascular risks.",
  },
  "0e696398-3a6c-437c-a8c0-71fceb67e877": { // Trunk Lean Tissue
    above: "More lean tissue (muscle, organs, water) in the trunk is generally associated with better strength and metabolic health.",
    below: "Less lean tissue in the trunk can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength.",
  },
  "0b8436d1-6d80-47c8-adf2-22fb7ab66ab4": { // Trunk Total Mass
    above: "Higher total mass in the trunk reflects more tissue there, from more fat, muscle or both; overall higher body mass is associated with higher risks of high blood pressure, type 2 diabetes and joint strain.",
    below: "Lower total mass in the trunk reflects less tissue there, from less fat, muscle or both; overall low body mass can reflect low food intake, illness or a very lean build.",
  },
  "04a9aa9b-a5f6-487f-8e53-24b1fd34a391": { // Android/Gynoid (A/G) Ratio
    above: "A high ratio means relatively more fat around the abdomen (android) than the hips and thighs (gynoid), associated with higher metabolic and cardiovascular risk.",
    below: "A low ratio means relatively more fat around hips and thighs, generally considered a lower-risk distribution.",
  },
  "20aa0e37-0656-4419-bae1-6cb674c78269": { // Intake Weight
    above: "Weight above range generally means a higher body mass, which is associated with higher risks of high blood pressure, type 2 diabetes and joint strain, though muscle mass also counts.",
    below: "Weight below range can reflect low food intake, illness or a very lean build, and is associated with reduced energy reserves and, if prolonged, lower bone density.",
  },
  "229cd84d-109e-4624-83bd-6faf7fd73fb2": { // Resting Metabolic Rate (RMR)
    above: "A higher resting metabolic rate means the body burns more energy at rest, associated with greater lean mass, a larger body, fever, an overactive thyroid or stimulant use.",
    below: "A lower resting metabolic rate means less energy burned at rest, associated with lower lean mass, a smaller body, calorie restriction or an underactive thyroid.",
  },
  "a1c66a25-a7bc-4d0b-b1f6-c1c001243329": { // Total Body Fat %
    above: "A higher body fat percentage is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially when fat is concentrated around the abdomen.",
    below: "A very low body fat percentage can be seen with athletic leanness, undernutrition or illness, and, if extreme, with hormonal disruption, fatigue and reduced bone density.",
  },
  "11bb302f-7bd9-4058-b488-dc524eb27217": { // Total Bone Mineral Content (BMC)
    above: "Higher bone mineral content generally reflects a larger or denser skeleton, and is not considered a concern.",
    below: "Lower bone mineral content reflects a smaller or less dense skeleton and, when coupled with low bone density, is associated with a higher fracture risk.",
  },
  "0ebafa86-1740-450a-bedc-787f34fae8dc": { // Total Fat Tissue
    above: "More fat tissue is associated with higher risks of type 2 diabetes, high blood pressure and cardiovascular disease, especially when concentrated around the abdomen.",
    below: "Very low fat tissue can be seen with athletic leanness, undernutrition or illness and, if extreme, with hormonal disruption and fatigue.",
  },
  "4e790cb2-76dc-407b-8c20-34b57d2c4b81": { // Total Lean %
    above: "A higher lean percentage means a greater share of body mass is muscle, organs and water rather than fat, generally associated with better metabolic health.",
    below: "A lower lean percentage means relatively more fat compared with muscle, associated with higher metabolic and cardiovascular risks.",
  },
  "297ad803-be56-42ab-8a15-097d1a9cc787": { // Total Lean Tissue
    above: "More lean tissue (muscle, organs, water) is generally associated with better strength, metabolism and metabolic health.",
    below: "Less lean tissue can reflect low muscle mass from inactivity, aging, undernutrition or illness, and is associated with reduced strength and mobility.",
  },
  "259dbec9-bb36-4dc0-84ad-70cff11c2c2c": { // Total Mass
    above: "Mass above range generally means a higher body mass, which is associated with higher risks of high blood pressure, type 2 diabetes and joint strain, though muscle mass also counts.",
    below: "Mass below range can reflect low food intake, illness or a very lean build, and is associated with reduced energy reserves and, if prolonged, lower bone density.",
  },
  "772b734e-41ec-49f6-ba16-4c16f4dd19ce": { // Average Daily Glucose Spike Count (Monthly)
    above: "More daily glucose spikes reflect larger or more frequent rises after meals, associated with insulin resistance and with diet, stress or illness.",
    below: "Only the high direction is clinically meaningful; zero spikes is the target.",
  },
  "90adc66d-10dd-466a-91c3-369dcac3e3a6": { // Average Daily Glucose Spike Duration (Monthly)
    above: "More time spent spiking reflects slower glucose recovery after meals, associated with insulin resistance and with diet, stress or illness.",
    below: "Only the high direction is clinically meaningful; zero spike time is the target.",
  },
  "1348450f-a654-402a-bd67-f05099c56748": { // Average Daily Waking Glucose (Monthly)
    above: "Higher average waking glucose suggests glucose regulation is drifting toward prediabetes or diabetes, which over time is associated with damage to blood vessels, nerves, eyes and kidneys.",
    below: "Lower average waking glucose can reflect low carbohydrate intake, fasting, high insulin sensitivity or diabetes medicines; very low levels can cause shakiness and confusion.",
  },
  "2ad800d4-d11f-4c2d-87a2-bedd1b3a4465": { // Average Glucose (Monthly)
    above: "A higher average glucose suggests glucose regulation is drifting toward prediabetes or diabetes, which over time is associated with damage to blood vessels, nerves, eyes and kidneys.",
    below: "Only the high direction is clinically meaningful on this scale; a low average usually reflects good glucose control, though very low levels can cause shakiness and confusion.",
  },
  "095bae7a-bac9-4831-9d27-7d110dfa2f90": { // Average Stability Score (Monthly)
    above: "Only the low direction is clinically meaningful; a score at the top of the range reflects very steady glucose.",
    below: "A lower stability score reflects larger glucose swings, which are associated with diet, stress, sleep or insulin resistance.",
  },
  "837be29b-5634-4c91-bdd1-6e7545e9ab58": { // Average Bedtime (Monthly)
    above: "A later average bedtime means less time available for sleep with a fixed wake time, and is associated with a shorter sleep duration and with circadian misalignment.",
    below: "Only the late direction is clinically meaningful; an earlier bedtime is generally not a concern.",
  },
  "e2d31719-e7e4-477b-8bd0-24002febc2e7": { // Average Daily Sleep Duration (Monthly)
    above: "Sleeping more than the target on average can reflect recovery from sleep debt, illness, depression or sleep-disordered breathing.",
    below: "Sleeping less than the target is associated with daytime sleepiness, reduced concentration and mood, and, long-term, with a higher risk of cardiometabolic problems.",
  },
  "67142c3a-d314-49df-a460-0e986ab163c6": { // Average Wake Time (Monthly)
    above: "A later average wake time can reflect a late schedule, longer sleep need or circadian delay, and may conflict with morning obligations.",
    below: "Only the late direction is clinically meaningful; an earlier wake time is generally not a concern.",
  },
  "4c7c982c-6442-452d-88fc-93e913472b44": { // CPAP AHI (Monthly)
    above: "A higher residual AHI means more breathing pauses or slowdowns per hour despite therapy, which can be due to mask leak, pressure settings or incompletely controlled sleep apnea. Persistent events can fragment sleep.",
    below: "Only the high direction is clinically meaningful; a low AHI is the target.",
  },
  "6bbe3947-a2d8-4777-8a92-7343d882f3f6": { // CPAP Mask Leak (Monthly)
    above: "A higher mask leak means more air escapes around the mask, often from poor fit or wear, which can reduce therapy effectiveness and disturb sleep.",
    below: "Only the high direction is clinically meaningful; low leak is the target.",
  },
  "490e2afc-bf87-4954-9b66-39401fe46603": { // CPAP Mask On/Off (Monthly)
    above: "More mask removals per night mean more interrupted therapy, which can be due to discomfort, leak, congestion or waking at night, and lowers the effective therapy time.",
    below: "Only the high direction is clinically meaningful; few interruptions are the target.",
  },
  "2b9a2e51-6fc5-4b22-afc5-1a4fd3fafd4f": { // CPAP Usage (Monthly)
    above: "Only the low direction is clinically meaningful; longer nightly use is generally linked to better treatment results.",
    below: "Shorter nightly CPAP use means less time with sleep apnea treated, with a greater chance of daytime sleepiness and other sleep-apnea effects; 4 hours per night is a common adherence threshold.",
  },
  "ae489662-ac63-49ab-a851-a45b4fb984d5": { // Heart Rate Before Sleep (Monthly)
    above: "A higher pre-sleep heart rate can reflect stress, late exercise, caffeine or alcohol, illness or poor fitness, and may make it harder to fall asleep.",
    below: "Only the high direction is clinically meaningful; a lower pre-sleep heart rate is generally associated with good fitness and relaxation.",
  },
  "bfc8cce5-efd2-405b-be38-c56d1c9d3e71": { // Heart Rate Variability (Monthly)
    above: "Only the low direction is clinically meaningful; higher HRV generally reflects good recovery and fitness.",
    below: "Lower HRV is associated with stress, poor sleep, illness, alcohol and overtraining, and is a general marker of reduced recovery.",
  },
  "cdd1efe1-f4fd-4b7f-abac-b25668ea3102": { // Overnight Skin Temperature Variation (Monthly)
    above: "A higher skin temperature than the personal baseline can accompany illness, a warm sleeping environment, alcohol or hormonal changes.",
    below: "A lower skin temperature than the personal baseline can reflect a cool room or bedding, or illness; the signal is only informative relative to your baseline.",
  },
  "85a09e2d-6854-4b67-87c4-d0d64978d1dc": { // Overnight SpO2 (Monthly)
    above: "Only the low direction is clinically meaningful; a high oxygen saturation is the expected finding.",
    below: "Lower overnight oxygen saturation can result from sleep apnea, lung disease or altitude. Repeated dips can fragment sleep and strain the heart.",
  },
  "b3ed6723-9b23-4a01-a885-8346700abc17": { // Resting Heart Rate (Monthly)
    above: "A higher resting heart rate can reflect stress, illness, dehydration, caffeine, an overactive thyroid, anemia or lower fitness, and is associated with higher cardiovascular risk when persistent.",
    below: "A lower resting heart rate is common with athletic conditioning; very low rates can cause lightheadedness or fainting when due to heart conduction problems or certain medicines.",
  },
  "c99dc076-4b4e-4833-b3e4-e3f0f5486d28": { // Sleep Consistency (Monthly)
    above: "A higher number means bed and wake times vary more from night to night, associated with circadian misalignment and poorer sleep quality.",
    below: "Only the high direction is clinically meaningful; a lower number indicates a steady schedule.",
  },
  "49226546-2c64-4605-a345-e154eaa9e285": { // Sleep Respiratory Rate (Monthly)
    above: "A higher sleeping breathing rate can reflect illness or infection, fever, lung or heart conditions, anxiety or sleep-disordered breathing.",
    below: "A lower sleeping breathing rate can reflect high fitness or deep sleep, but also opioid or sedative use; it is mostly informative relative to your baseline.",
  },
  "46a79add-7326-44e8-9cc4-7dd49307c5f2": { // VO2 Max (Fitbit estimate) (Monthly)
    above: "Only the low direction is clinically meaningful; a higher VO2 max reflects better aerobic fitness, associated with lower cardiovascular and all-cause mortality.",
    below: "A lower VO2 max reflects lower aerobic fitness and is associated with higher cardiovascular and all-cause mortality; it can improve with training.",
  },
  "93ba7347-ac89-4ce6-abed-e560000ad1f8": { // myAir Score (Monthly)
    above: "Only the low direction is clinically meaningful; a higher score reflects better CPAP use, mask seal and event control.",
    below: "A lower score reflects shorter therapy hours, more mask leak or more residual breathing events, meaning sleep apnea is less well controlled.",
  },
  "22686945-fb0f-4cae-9338-2c9851fb5069": { // Speed of Aging
    above: "A value above 1 means the body is aging biologically faster than the calendar, as measured by DNA methylation, and is associated with higher risk of age-related disease.",
    below: "A value below the range means a slower pace of biological aging than average, which is associated with a lower risk of age-related disease.",
  },
  "540a74f3-f0a8-4132-b02f-d759a0a3b2da": { // Body Weight
    above: "Weight above range generally means a higher body mass, which is associated with higher risks of high blood pressure, type 2 diabetes and joint strain, though muscle mass also counts.",
    below: "Weight below range can reflect low food intake, illness or a very lean build, and is associated with reduced energy reserves and, if prolonged, lower bone density.",
  },
  "a5c35ab9-89ad-4857-90e2-9aad91626968": { // Diastolic Blood Pressure
    above: "High diastolic pressure (the pressure between beats) is associated with hypertension, which over time can damage arteries, the heart, kidneys and eyes.",
    below: "Low diastolic pressure can be normal in fit people, but can also reflect dehydration, blood loss, some medicines or heart problems, and can cause dizziness or fainting.",
  },
  "5abdc4a3-79a5-4cb0-a900-b3e40f69559a": { // Resting Pulse
    above: "A higher resting pulse can reflect stress, illness, dehydration, caffeine, an overactive thyroid, anemia or lower fitness, and is associated with higher cardiovascular risk when persistent.",
    below: "A lower resting pulse is common with athletic conditioning; very low rates can cause lightheadedness or fainting when due to heart conduction problems or certain medicines.",
  },
  "382ae425-9bfb-48f6-9078-afb83b049de8": { // Systolic Blood Pressure
    above: "High systolic pressure (the pressure during a heartbeat) is associated with hypertension, which over time can damage arteries, the heart, kidneys and eyes.",
    below: "Low systolic pressure can be normal in fit people, but can also reflect dehydration, blood loss, some medicines or heart problems, and can cause dizziness or fainting.",
  },
};

export function getRangeNote(id: string): RangeNote | null {
  return RANGE_NOTES[id] ?? null;
}
